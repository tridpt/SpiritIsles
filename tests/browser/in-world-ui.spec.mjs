import { test, expect } from '@playwright/test';
import {readFileSync} from 'node:fs';
import { E } from '../legacy-combat.mjs';
import { eventFixture } from '../ruins-route-fixtures.mjs';
import { navigateGame, openGameMenu, openSettings } from './navigation.mjs';

const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)).state, E.SAVE_KEY);
const {version}=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8'));
async function seed(page, state = E.newGame()) {
  await page.addInitScript(({key,raw}) => {
    if (!sessionStorage.getItem('in-world-seed')) {
      localStorage.setItem(key,raw);sessionStorage.setItem('in-world-seed','1');
    }
  }, {key:E.SAVE_KEY,raw:E.serialize(state)});
  await page.goto('/');await page.evaluate(() => document.fonts.ready);
}

test('primary shortcuts belong to the island scene, reach their screens directly and leave progress intact', async ({page}) => {
  await page.setViewportSize({width:320,height:640});await seed(page);
  const before=await read(page);
  await expect(page.locator('.mobile-nav,.desktop-nav,.game-dock')).toHaveCount(0);
  await expect(page.locator('.game-lobby .island-shortcut')).toHaveCount(4);
  for (const destination of ['hatch','pets','build','journal']) {
    await page.locator(`.game-lobby .island-shortcut[data-page="${destination}"]`).click();
    await expect(page.locator('.game-shell')).toHaveAttribute('data-screen',destination);
    await expect(page.locator('#game-dialog')).toHaveCount(0);
    expect(await page.evaluate(() => window.spiritBack())).toBe(true);
    await expect(page.locator('.game-lobby')).toBeVisible();
  }
  const after=await read(page);expect(after.resources).toEqual(before.resources);expect(after.pets).toEqual(before.pets);expect(after.stats).toEqual(before.stats);
});

test('the HUD menu navigates its main screens, marks the current screen and dismisses with Back, Escape or backdrop', async ({page}) => {
  await page.setViewportSize({width:390,height:844});await seed(page);
  for (const destination of ['hatch','pets','explore','build','journal','habitat','tower','island']) {
    await navigateGame(page,destination);
    await expect(page.locator('.game-shell')).toHaveAttribute('data-screen',destination);
    await openGameMenu(page);
    await expect(page.locator(`.game-menu-grid [data-page="${destination}"]`)).toHaveAttribute('aria-current','page');
    expect(await page.evaluate(() => window.spiritBack())).toBe(true);
    await expect(page.locator('.island-menu')).toHaveCount(0);
    await expect(page.locator('.game-shell')).toHaveAttribute('data-screen',destination);
  }
  await openGameMenu(page);await page.keyboard.press('Escape');await expect(page.locator('.island-menu')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Mở menu đảo',exact:true})).toBeFocused();
  await openGameMenu(page);await page.mouse.click(3,3);await expect(page.locator('.island-menu')).toHaveCount(0);
  for (const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000],[740,420]]) {
    await page.setViewportSize({width,height});await openGameMenu(page);
    for (const button of await page.locator('.game-menu-grid>button,.game-menu-settings').all()) {
      await button.scrollIntoViewIfNeeded();
      await expect.poll(() => button.evaluate(el => {const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&!!hit&&el.contains(hit);})).toBe(true);
    }
    await page.getByRole('button',{name:'Đóng',exact:true}).click();
  }
  await openSettings(page);await expect(page.locator('.settings-brand')).toContainText(version);
});

test('the offline menu preserves an unresolved route event, resources and RNG across navigation and reload', async ({browser}) => {
  const context=await browser.newContext({viewport:{width:320,height:640},serviceWorkers:'allow',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await seed(page,eventFixture('chest'));await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    const cached=await page.evaluate(async()=>{const keys=await caches.keys(),cache=await caches.open(keys.find(k=>k.startsWith('spirit-isles-v')));return (await cache.keys()).map(r=>new URL(r.url).pathname);});
    expect(cached.some(p=>p.endsWith('/in-world-ui.css'))).toBe(true);
    const before=await read(page);await context.setOffline(true);
    await navigateGame(page,'island');await page.locator('.island-shortcut[data-page="pets"]').click();await navigateGame(page,'explore');await page.locator('.ruins-explore-tabs [data-page="ruins"]').click();
    await expect(page.locator('.route-event')).toBeVisible();expect((await read(page)).ruins).toEqual(before.ruins);expect((await read(page)).resources).toEqual(before.resources);
    await openGameMenu(page);await expect(page.locator('.game-menu-item[data-page="explore"]')).toHaveAttribute('aria-current','page');await page.keyboard.press('Escape');
    await page.reload();await expect(page.locator('.route-event')).toBeVisible();expect((await read(page)).ruins).toEqual(before.ruins);await openGameMenu(page);await expect(page.locator('.game-menu-grid>button')).toHaveCount(11);expect(errors).toEqual([]);
  } finally {await context.close();}
});
