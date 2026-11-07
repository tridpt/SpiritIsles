import {test,expect} from '@playwright/test';
import {E,squadGame} from '../squad-fixtures.mjs';
import {towerGame,T,climb,towerNow} from '../tower-fixtures.mjs';
import {SHINY_SPECIES} from '../../web/js/data.js';
import {craftShiny,claimShinyMilestone} from '../../web/js/shiny.js';
import {startBoss} from '../../web/js/boss-engine.js';
import {navigateGame} from './navigation.mjs';
import {readFileSync} from 'node:fs';
const {version}=JSON.parse(readFileSync('package.json','utf8'));
const ids=SHINY_SPECIES.map(s=>s.id),read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
function unlocked(n=6){const s=squadGame();s.settings={motion:false,sound:false};s.shiny.fragments=n*30;for(const id of ids.slice(0,n))craftShiny(s,id);return s;}
async function seed(p,s,{rng=.9}={}){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
  await p.addInitScript(({key,raw,rng})=>{Math.random=()=>rng;if(!sessionStorage.getItem('shiny-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('shiny-seeded','1');}},{key:E.SAVE_KEY,raw:E.serialize(s),rng});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
const close=p=>p.getByRole('button',{name:'Đóng',exact:true}).click();
const specimen=(p,id)=>p.locator(`[data-shiny-specimen="${id}"]`);
test.afterEach(async({page})=>{expect(await page.evaluate(()=>window.__shinyErrors||[])).toEqual([]);});
test.beforeEach(async({page})=>{await page.addInitScript(()=>{window.__shinyErrors=[];window.addEventListener('error',e=>window.__shinyErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__shinyErrors.push(String(e.reason)));});});

test('menu, hatch and pets lead to six read-only previews and transparent odds',async({page})=>{
  await seed(page,squadGame());await navigateGame(page,'shiny');await expect(page.locator('.prism-specimen')).toHaveCount(6);const before=await read(page);
  for(const id of ids){await specimen(page,id).locator('.prism-portrait').click();await expect(page.locator('.prism-compare [data-shiny="false"]')).toHaveCount(1);await expect(page.locator('.prism-compare [data-shiny="true"]')).toHaveCount(1);await close(page);}
  expect((await read(page)).shiny).toEqual(before.shiny);expect((await read(page)).pets).toEqual(before.pets);
  await page.locator('[data-action="shiny-help"]').click();await expect(page.locator('.prism-help')).toContainText('1.2%');await expect(page.locator('.prism-help')).toContainText('60');await close(page);
  for(const destination of ['hatch','pets']){await navigateGame(page,destination);await page.locator('.shiny-entry').click();await expect(page.locator('.prism-specimens')).toBeVisible();}
});
test('craft reveal, care view, appearance toggles and reload preserve growth and balances',async({page})=>{
  const s=squadGame();s.shiny.fragments=30;s.pets[0].level=12;s.pets[0].bond=33;await seed(page,s);await navigateGame(page,'shiny');
  await specimen(page,'mossfox').locator('[data-action="shiny-craft"]').click();await expect(page.locator('.prism-reward-card')).toContainText('Cáo Mầm Hào Quang');expect((await read(page)).shiny.fragments).toBe(0);
  await page.locator('.prism-reveal-dialog [data-action="pet"]').click();await expect(page.locator('.pet-detail-hero [data-shiny="true"]')).toHaveCount(1);await page.locator('[data-action="shiny-appearance"]').last().click();await expect(page.locator('.pet-detail-hero [data-shiny="false"]')).toHaveCount(1);
  const saved=await read(page);expect(saved.pets[0]).toMatchObject({level:12,bond:33,shiny:true,shinyOff:true});await close(page);await page.reload();await navigateGame(page,'shiny');
  await specimen(page,'mossfox').locator('[data-action="shiny-appearance"]').click();expect((await read(page)).pets[0].shinyOff).toBeUndefined();await expect(specimen(page,'mossfox').locator('[data-action="shiny-appearance"]')).toContainText('Dùng hình hài gốc');
});
test('the sixtieth egg shows both its ordinary result and a separate Shiny bonus',async({page})=>{
  const s=squadGame();s.shiny.pity=59;const expected=structuredClone(s);E.hatch(expected,1,'nature',()=>.9);
  await seed(page,s);await navigateGame(page,'hatch');await page.locator('[data-action="hatch"][data-count="1"]').click();await expect(page.locator('.prism-egg-reveal')).toBeVisible();await page.locator('[data-action="reveal-egg"]').last().click();
  await expect(page.locator('.hatch-result')).toHaveCount(1);await expect(page.locator('.prism-reward-card')).toHaveCount(1);const after=await read(page);expect(after.shiny).toEqual(expected.shiny);expect(after.pity).toBe(expected.pity);expect(after.srPity).toBe(expected.srPity);expect(after.resources).toEqual(expected.resources);
  await page.locator('[data-action="shiny-open"]').last().click();await expect(page.locator('.prism-specimen.found')).toHaveCount(1);
});
test('milestone claims, profile and both island ornaments survive reopening without duplicate payment',async({page})=>{
  await seed(page,unlocked());await navigateGame(page,'shiny');const before=await read(page);
  for(const n of [1,3,6])await page.locator(`[data-action="shiny-milestone"][data-id="${n}"]`).click();
  await page.locator('[data-action="shiny-profile"]').click();await expect(page.locator('.player-hud')).toHaveClass(/prism-profile/);expect((await read(page)).resources.tickets).toBe(before.resources.tickets+10);
  await page.reload();await navigateGame(page,'shiny');for(const n of [1,3,6])await expect(page.locator(`[data-action="shiny-milestone"][data-id="${n}"]`)).toBeDisabled();await expect(page.locator('.player-hud')).toHaveClass(/prism-profile/);
  await navigateGame(page,'island');await page.locator('[data-action="island-edit-open"]').click();await page.locator('[data-action="island-edit-catalog"]').click();await page.locator('[data-action="island-edit-category"][data-id="treasure"]').click();
  for(const id of ['prismfox','prismgate'])await expect(page.locator(`.editor-catalog-item[data-id="${id}"]`)).toBeEnabled();
});
test('exchange spends ten fragments once and adds two real hatch tickets',async({page})=>{
  const s=unlocked(1);s.shiny.fragments=10;await seed(page,s);await navigateGame(page,'shiny');await page.locator('[data-action="shiny-exchange"]').click();const after=await read(page);expect(after.shiny.fragments).toBe(0);expect(after.resources.tickets).toBe(s.resources.tickets+2);await expect(page.locator('[data-action="shiny-exchange"]')).toBeDisabled();
});
test('manual and AUTO boss combat render the snapshot variant and show actual fragment payment',async({page})=>{
  const s=unlocked(2);s.pets.forEach(p=>p.level=15);startBoss(s,1,()=>.4);await seed(page,s);await page.locator('[data-action="active-battle"][data-id="boss"]').click();
  await expect(page.locator('.duel-arena .duel-party [data-shiny="true"]')).toHaveCount(2);await page.locator('[data-move="attack"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(10);await expect(page.locator('.prism-caster')).toHaveCount(2);await page.clock.runFor(100);
  await page.locator('[data-duel="auto"]').click();await page.clock.runFor(60000);await expect(page.locator('.duel-end')).toBeVisible();await expect(page.locator('.prism-combat-loot')).toContainText('3');expect((await read(page)).shiny.fragments).toBe(3);
  await page.reload();expect((await read(page)).shiny.fragments).toBe(3);await navigateGame(page,'shiny');await expect(specimen(page,'mossfox').locator('[data-action="shiny-appearance"]')).toBeEnabled();
});
test('a real AUTO forest journey grants fragments and an encounter once',async({page})=>{
  const s=unlocked(1);s.pets.forEach(p=>p.level=30);await seed(page,s,{rng:0});await navigateGame(page,'explore');await page.locator('[data-action="auto-expedition"][data-id="forest"]').click();await expect(page.locator('#combat-stage .creature-shiny')).toHaveCount(1);
  await page.clock.runFor(180000);await expect(page.locator('.duel-end')).toBeVisible();await expect(page.locator('.prism-combat-loot .prism-reward-card')).toBeVisible();const won=await read(page);expect(won.expedition).toBeNull();expect(won.shiny.fragments).toBe(1);expect(won.pets.filter(p=>p.shiny)).toHaveLength(2);await page.reload();expect((await read(page)).shiny).toEqual(won.shiny);
});
test('tower boss fight pays its own two-fragment reward and keeps the Shiny snapshot after reload',async({page})=>{
  let s=unlocked(1);s.pets.forEach(p=>{p.level=30;p.stars=3;});T.startTower(s,1,()=>.4,towerNow);s=climb(s,5,{save:true});T.chooseTowerPath(s,'boss',towerNow);await seed(page,s);await page.reload();await page.locator('[data-action="tower-fight"]').click();await expect(page.locator('#combat-stage .duel-party .creature-shiny')).toHaveCount(1);await page.clock.runFor(60000);expect((await read(page)).shiny.fragments).toBe(2);await expect(page.locator('.prism-combat-loot')).toContainText('2');
});
for(const viewport of [{width:320,height:640},{width:390,height:844},{width:1440,height:1000},{width:844,height:390}])test(`Shiny collection, compare, reveal and help fit ${viewport.width}x${viewport.height}`,async({browser})=>{
  const c=await browser.newContext({viewport,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    const s=unlocked(3);s.shiny.fragments=30;claimShinyMilestone(s,1);claimShinyMilestone(s,3);await seed(p,s);await navigateGame(p,'shiny');
    for(const scene of ['collection','compare','reveal','help']){
      if(scene==='compare')await specimen(p,'oceandragon').locator('.prism-portrait').click();
      if(scene==='reveal'){await close(p);await specimen(p,'oceandragon').locator('[data-action="shiny-craft"]').click();}
      if(scene==='help'){await close(p);await p.locator('[data-action="shiny-help"]').click();}
      expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const scope=scene==='collection'?'.prism-specimens button,.prism-milestones button,.prism-exchange button':'#game-dialog[open] button';
      expect(await p.locator(scope).count()).toBeGreaterThan(0);const bad=await p.locator(scope).evaluateAll(es=>es.filter(e=>e.checkVisibility()).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,right:r.right,height:r.height};}).filter(r=>r.x<0||r.right>innerWidth+1||r.height<35));expect(bad).toEqual([]);
      await p.screenshot({path:`dist/screenshots/shiny-${scene}-${viewport.width}x${viewport.height}-${version}.png`,fullPage:scene==='collection'});
    }expect(errors).toEqual([]);
  }finally{await c.close();}
});
test('all new assets precache and crafting and switching appearances work offline',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'allow'}),p=await c.newPage();try{
    const s=squadGame();s.shiny.fragments=30;await seed(p,s);await p.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>p.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    expect(await p.evaluate(async v=>{const cache=await caches.open(`spirit-isles-v${v}`);return (await Promise.all(['shiny.css','js/shiny.js','js/shiny-ui.js','js/shiny-art.js'].map(f=>cache.match('/'+f)))).every(Boolean);},version)).toBe(true);
    await c.setOffline(true);await p.reload();await navigateGame(p,'shiny');await specimen(p,'mossfox').locator('[data-action="shiny-craft"]').click();await close(p);await specimen(p,'mossfox').locator('[data-action="shiny-appearance"]').click();expect((await read(p)).pets[0].shinyOff).toBe(true);await p.reload();expect((await read(p)).pets[0].shinyOff).toBe(true);
  }finally{await c.close();}
});
