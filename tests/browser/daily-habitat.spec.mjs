import {test,expect} from '@playwright/test';
import {E} from '../legacy-combat.mjs';
import * as H from '../../web/js/habitat-engine.js';
import {BY_ID} from '../../web/js/data.js';
import {placeItem} from '../../web/js/island-layout.js';
import {eventFixture} from '../ruins-route-fixtures.mjs';
import {navigateGame,openGameMenu} from './navigation.mjs';

const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(p,s=E.newGame()){
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('daily-habitat-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('daily-habitat-seed','1');}},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
const hint=p=>p.locator('.lobby-habitat-hint');
const menuEntry=p=>p.locator('.game-menu-item[data-page="habitat"]');
const focused=p=>p.locator('.habitat-card.featured');

test('the memory menu advertises ready discoveries and opens the daily friend without spending resources',async({page})=>{
  await seed(page);const before=await read(page),daily=H.dailyHabitatHint(before);
  await openGameMenu(page);await expect(menuEntry(page)).toHaveAccessibleName('Sổ Kỷ Niệm');await expect(menuEntry(page).locator('.game-notice')).toBeVisible();
  await menuEntry(page).click();await expect(page.locator('.game-shell')).toHaveAttribute('data-screen','habitat');
  await expect(page.locator('#habitat-pet')).toHaveValue(daily.pet.id);
  await expect(page.locator('.habitat-daily')).toContainText(BY_ID[daily.pet.species].name);
  await expect(page.locator('.habitat-daily')).toHaveAttribute('data-habitat-daily',`${daily.pet.id}:${daily.moment.id}`);
  await openGameMenu(page);await expect(menuEntry(page)).toHaveAttribute('aria-current','page');await page.keyboard.press('Escape');
  const after=await read(page);expect(after.resources).toEqual(before.resources);expect(after.pets).toEqual(before.pets);expect(after.habitat).toEqual(before.habitat);
});

test('the island hint selects and focuses its exact moment; recording advances it immediately and persists',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);const before=await read(page);
  const id=await hint(page).getAttribute('data-id'),moment=await hint(page).getAttribute('data-moment');
  await hint(page).click();await expect(page.locator('#habitat-pet')).toHaveValue(id);await expect(focused(page)).toHaveAttribute('data-moment',moment);await expect(focused(page)).toBeFocused();
  await focused(page).locator('[data-action="habitat-play"]').click();const record=page.locator('[data-action="habitat-scene-record"]');await expect(record).toBeEnabled({timeout:8000});await record.click();
  await expect.poll(async()=>`${await hint(page).getAttribute('data-id')}:${await hint(page).getAttribute('data-moment')}`).not.toBe(`${id}:${moment}`);
  await page.locator('[data-action="habitat-scene-close"]').click();const saved=await read(page);
  expect(saved.habitat.discovered[`${id}:${moment}`]).toBeTruthy();expect(saved.pets.find(p=>p.id===id).bond).toBe(before.pets.find(p=>p.id===id).bond+2);
  expect(saved.resources).toEqual(before.resources);const next=await hint(page).getAttribute('aria-label');
  await page.reload();await expect(hint(page)).toHaveAttribute('aria-label',next);expect((await read(page)).habitat).toEqual(saved.habitat);
});

test('a locked suggestion explains actual conditions and leads to its editable island corner without recording a memory',async({page})=>{
  const s=E.newGame();s.islandLayout={version:1,nextId:1,placed:[]};await seed(page,s);
  await expect(hint(page)).not.toHaveClass(/ready/);const id=await hint(page).getAttribute('data-id'),moment=await hint(page).getAttribute('data-moment');
  await openGameMenu(page);await expect(menuEntry(page).locator('.game-notice')).toHaveCount(0);await menuEntry(page).click();
  await expect(page.locator('.habitat-daily')).toContainText(H.momentStatus(s,id,moment).reasons[0]);
  await page.locator('.habitat-daily [data-action="habitat-open"]').click();await expect(focused(page).locator('[data-action="habitat-play"]')).toBeDisabled();
  await focused(page).locator('[data-action="island-edit-open"]').click();await expect(page.locator('.game-shell')).toHaveAttribute('data-screen','decorate');
  const saved=await read(page);expect(saved.habitat).toEqual(s.habitat);expect(saved.resources).toEqual(s.resources);expect(saved.islandLayout).toEqual(s.islandLayout);
});

test('the daily banner and paired island controls remain tappable on small phones and larger screens',async({page})=>{
  await seed(page);
  for(const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]]){
    await page.setViewportSize({width,height});await navigateGame(page,'island');
    expect(await page.locator('.lobby-cozy-actions button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}))).toBe(true);
    const row=await page.locator('.lobby-cozy-actions').boundingBox(),quest=await page.locator('.lobby-quest').boundingBox();expect(row.y+row.height).toBeLessThanOrEqual(quest.y-6);
    await navigateGame(page,'habitat');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    for(const button of await page.locator('.habitat-daily button').all()){
      await button.scrollIntoViewIfNeeded();expect(await button.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.x>=0&&r.right<=innerWidth+1&&r.y>=84&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
    }
  }
});

test('device midnight refreshes the island hint behind a menu and refreshes the book when the menu closes',async({page})=>{
  const today=new Date();today.setHours(23,59,50,0);const tomorrow=new Date(today.getTime()+20000);
  await page.clock.setFixedTime(today);const s=E.newGame(today.getTime());await seed(page,s);
  const first=`${await hint(page).getAttribute('data-id')}:${await hint(page).getAttribute('data-moment')}`;
  await openGameMenu(page);await page.clock.setFixedTime(tomorrow);await expect(hint(page)).toHaveAttribute('data-habitat-day',E.dayKey(tomorrow.getTime()));
  const next=`${await hint(page).getAttribute('data-id')}:${await hint(page).getAttribute('data-moment')}`;expect(next).not.toBe(first);
  await menuEntry(page).click();await openGameMenu(page);const third=new Date(tomorrow.getTime()+86400000);await page.clock.setFixedTime(third);await page.keyboard.press('Escape');
  await expect(page.locator('.habitat-daily')).toHaveAttribute('data-habitat-day',E.dayKey(third.getTime()));
  const after=await read(page);expect(after.habitat).toEqual(s.habitat);expect(after.resources).toEqual(s.resources);
});

test('a completed owned collection invites a new friend and removes the new-behavior notice',async({page})=>{
  const s=E.newGame();s.level=3;s.boss.best=1;s.boss.wins=1;s.boss.clears[0]=1;s.ruins.best=5;s.ruins.clears=5;s.ruins.bosses=1;s.clears.reef=5;s.clears.volcano=5;s.pets.forEach(p=>p.bond=100);
  for(const pet of s.pets)for(const moment of H.momentsFor(pet.species)){
    s.islandLayout={version:1,nextId:1,placed:[]};expect(placeItem(s,s.islandLayout,moment.decor[0],0,0).error).toBeUndefined();
    if(moment.near)expect(placeItem(s,s.islandLayout,moment.near[0],2,0).error).toBeUndefined();
    expect(H.discoverMoment(s,pet.id,moment.id).isNew).toBe(true);
  }
  await seed(page,s);await expect(hint(page)).toContainText('Thêm bạn, thêm kỷ niệm');await openGameMenu(page);await expect(menuEntry(page).locator('.game-notice')).toHaveCount(0);await menuEntry(page).click();
  await expect(page.locator('.habitat-daily.complete')).toBeVisible();await page.locator('.habitat-daily [data-page="hatch"]').click();await expect(page.locator('.game-shell')).toHaveAttribute('data-screen','hatch');
});

test('the daily shortcut, selected friend and new memory work offline without changing a pending expedition',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(page,eventFixture('chest'));await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    const before=await read(page);await context.setOffline(true);await navigateGame(page,'island');
    const id=await hint(page).getAttribute('data-id'),moment=await hint(page).getAttribute('data-moment');await hint(page).click();await focused(page).locator('[data-action="habitat-play"]').click();
    const button=page.locator('[data-action="habitat-scene-record"]');await expect(button).toBeEnabled({timeout:8000});await button.click();const saved=await read(page);expect(saved.habitat.discovered[`${id}:${moment}`]).toBeTruthy();
    await page.reload();expect((await read(page)).ruins).toEqual(before.ruins);expect((await read(page)).resources).toEqual(before.resources);expect((await read(page)).habitat).toEqual(saved.habitat);
    await navigateGame(page,'island');await hint(page).click();await expect(focused(page)).toBeVisible();expect(errors).toEqual([]);
  }finally{await context.close();}
});
