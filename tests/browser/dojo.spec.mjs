import { navigateGame } from './navigation.mjs';
import { test,expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { D } from '../legacy-combat.mjs';
import { B } from '../legacy-combat.mjs';
import { CHALLENGES, DOJO_MILESTONES, totalStars } from '../../web/js/dojo-data.js';
import { previewOrder } from '../../web/js/combat-preview.js';
import { dojoProgress, DOJO_PLANS } from '../dojo-fixtures.mjs';

const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(page,s=E.newGame()){
  E.validateSave(E.serialize(s));await page.addInitScript(({raw,key})=>{if(!sessionStorage.getItem('dojo-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('dojo-seed','1');}},{raw:E.serialize(s),key:E.SAVE_KEY});
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
async function hub(p){if(!await p.locator('h1').filter({hasText:'Võ đường linh thú'}).count())await p.locator('[data-page=dojo]').first().click();}
const tab=(p,id)=>p.locator(`[data-action="dojo-tab"][data-id="${id}"]`).click();
async function cast(p,order){
  const before=await read(p),input=typeof order==='string'?{move:order}:order,b=before.dojo.run.mode==='boss'?before.dojo.run.sandbox.boss.run:before.dojo.run.sandbox.expedition.battle;
  const full={move:input.move,stance:input.stance||b.strategy.stance,target:input.target||'body'};
  if(input.stance)await p.locator(`[data-duel="stance"][data-stance="${input.stance}"]`).click();
  if(full.target!=='body')await p.locator(`[data-duel="target"][data-target="${full.target}"]`).click();
  await p.locator(`[data-duel="choose"][data-move="${input.move}"]`).click();const preview=previewOrder(before,'dojo',full,input.move==='charge'?'auto':'perfect');
  await expect(p.locator('[data-preview="damage"]')).toHaveText(String(preview.damage.min));await expect(p.locator('[data-preview="incoming"]')).toHaveText(String(preview.incoming.min));
  if(input.move!=='charge')await p.clock.runFor(600);
  const expected=structuredClone(before);D.dojoBattleTurn(expected,full,await p.evaluate(()=>Date.now()),input.move==='charge'?'auto':'perfect');
  await p.locator('[data-duel="hit"]').click();await p.clock.runFor(1200);
  const actual=await read(p);expect(actual.dojo).toEqual(expected.dojo);expect(actual.resources).toEqual(expected.resources);expect(actual.boss).toEqual(before.boss);expect(actual.expedition).toEqual(before.expedition);E.validateSave(E.serialize(actual));return actual;
}

test('mobile lobby reaches the dojo, locks later challenges and records a three-star first clear exactly once',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);await page.getByRole('button',{name:'Vào Võ đường linh thú'}).click();await expect(page.locator('.dojo-challenge')).toHaveCount(8);await expect(page.locator('[data-action="dojo-start"][data-id="armor"]')).toBeDisabled();
  const before=await read(page);await page.locator('[data-action="dojo-start"][data-id="rhythm"]').click();await expect(page.locator('#combat-stage .dojo-live')).toContainText('Đỡ hoàn hảo 2 đòn địch');for(const a of DOJO_PLANS.rhythm)await cast(page,a);
  await expect(page.locator('#combat-stage .dojo-stars')).toHaveAttribute('aria-label','3 trên 3 sao');await expect(page.locator('#combat-stage .dojo-first-reward')).toContainText('đã cất');let s=await read(page);expect(s.resources.tickets).toBe(before.resources.tickets+1);expect(s.resources.gold).toBe(before.resources.gold+200);expect(s.dojo.records.rhythm.stars).toBe(7);
  await page.locator('#combat-stage [data-action="dojo-retry"]').click();for(const a of DOJO_PLANS.rhythm)await cast(page,a);s=await read(page);expect(s.resources.tickets).toBe(before.resources.tickets+1);expect(s.dojo.records.rhythm.wins).toBe(2);await page.locator('#combat-stage [data-duel="close"]').first().click();await expect(page.locator('[data-action="dojo-start"][data-id="armor"]')).toBeEnabled();await page.reload();await hub(page);expect((await read(page)).dojo.records.rhythm).toEqual(s.dojo.records.rhythm);
});

for(const c of CHALLENGES.slice(1))test(`${c.name}: real controls match deterministic forecasts, complete all objectives and keep rewards durable`,async({page})=>{
  await seed(page,dojoProgress(CHALLENGES.indexOf(c)));await hub(page);await page.locator(`[data-action="dojo-start"][data-id="${c.id}"]`).click();for(const a of DOJO_PLANS[c.id])await cast(page,a);
  const s=await read(page);expect(s.dojo.lastResult.stars).toBe(7);expect(s.dojo.records[c.id].stars).toBe(7);await expect(page.locator('#combat-stage .dojo-result-goals>.earned')).toHaveCount(3);await page.reload();expect((await read(page)).dojo).toEqual(s.dojo);
});

test('practice tries unpaid skill paths while a real journey is paused and cancel or Back never commits a turn',async({page})=>{
  const initial=E.newGame();initial.level=3;B.startBoss(initial,1,()=>.4);await seed(page,initial);await hub(page);await tab(page,'practice');await page.locator('[data-action="dojo-enemy"][data-id="frost"]').click();await page.locator('[data-action="dojo-path"][data-id="emberbird"][data-branch="shatter"]').click();await page.locator('[data-action="dojo-path"][data-id="axolotl"][data-branch="shelter"]').click();await page.locator('[data-action="dojo-start"][data-kind="practice"]').click();await expect(page.locator('[data-move="pet:emberbird"]')).toContainText('Phá giáp 3');await expect(page.locator('[data-move="pet:axolotl"]')).toContainText('Bảo hộ 3');
  let before=await read(page);await page.locator('[data-move="pet:emberbird"]').click();await page.locator('[data-duel="preview"][data-grade="normal"]').click();await page.locator('[data-duel="cancel"]').click();expect((await read(page)).dojo).toEqual(before.dojo);await page.locator('[data-move="attack"]').click();await page.evaluate(()=>window.spiritBack());await expect(page.locator('.duel-meter')).toHaveCount(0);expect((await read(page)).dojo).toEqual(before.dojo);
  await cast(page,'pet:emberbird');const played=await read(page);expect(played.resources).toEqual(initial.resources);expect(played.pets).toEqual(initial.pets);expect(played.boss).toEqual(initial.boss);await page.reload();expect((await read(page)).dojo.run).toEqual(played.dojo.run);await page.locator('[data-action="active-battle"][data-id="dojo"]').click();await cast(page,'guard');await page.locator('[data-duel="close"]').click();await page.locator('[data-action="dojo-stop"]').click();await expect(page.locator('.dojo-last-report')).toHaveAttribute('open','');const stopped=await read(page);expect(stopped.resources).toEqual(initial.resources);expect(stopped.dojo.lastResult.status).toBe('stopped');expect(stopped.dojo.records).toEqual({});
});

test('star milestones grant once, equip visible island cosmetics and survive reload and toggling',async({page})=>{
  await seed(page,dojoProgress());await hub(page);await tab(page,'rewards');const before=await read(page);for(const m of DOJO_MILESTONES){await page.locator(`[data-action="dojo-claim"][data-id="${m.stars}"]`).click();await expect(page.locator(`[data-action="dojo-claim"][data-id="${m.stars}"]`)).toBeDisabled();}
  let s=await read(page);expect(s.resources.tickets).toBe(before.resources.tickets+17);expect(s.dojo.cosmetics).toEqual({title:'master',aura:true,decoration:true});await navigateGame(page,'island');await expect(page.locator('.player-details')).toContainText('Bậc thầy chiến thuật');await expect(page.locator('.location-kicker')).toContainText('BẬC THẦY CHIẾN THUẬT');await expect(page.locator('.dojo-island-monument')).toBeVisible();await expect(page.locator('body')).toHaveClass(/dojo-aura/);await page.reload();expect((await read(page)).dojo.cosmetics).toEqual(s.dojo.cosmetics);await hub(page);await tab(page,'rewards');await page.locator('[data-action="dojo-cosmetic"][data-key="aura"]').click();await page.locator('[data-action="dojo-cosmetic"][data-key="decoration"]').click();await page.locator('[data-action="dojo-cosmetic"][data-value="none"]').click();await expect(page.locator('body')).not.toHaveClass(/dojo-aura/);await navigateGame(page,'island');await expect(page.locator('.dojo-island-monument')).toHaveCount(0);await expect(page.locator('.player-details')).toContainText('Người giữ đảo');
});

test('dojo screens, reports and combat fit 320px through desktop, retain Vietnamese words and expose reachable controls',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,dojoProgress());await hub(page);
  for(const id of ['challenges','practice','rewards']){await tab(page,id);for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);if(id==='challenges'&&width===390)await page.screenshot({path:'dist/screenshots/dojo-challenges-mobile-1.11.0.png'});if(id==='practice'&&width===1440)await page.screenshot({path:'dist/screenshots/dojo-practice-desktop-1.11.0.png'});}}
  await tab(page,'practice');await page.locator('[data-action="dojo-start"][data-kind="practice"]').click();for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});expect(await page.locator('#combat-stage').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.locator('[data-move="guard"]').scrollIntoViewIfNeeded();await expect(page.locator('[data-move="guard"]')).toBeInViewport();if(width===390){await page.locator('#combat-stage').evaluate(e=>e.scrollTop=0);await page.screenshot({path:'dist/screenshots/dojo-practice-mobile-1.11.0.png'});}}await page.locator('[data-duel="close"]').click();await page.locator('[data-action="dojo-stop"]').click();await page.locator('.dojo-report').scrollIntoViewIfNeeded();await page.screenshot({path:'dist/screenshots/dojo-report-1.11.0.png'});expect(errors).toEqual([]);
});

test('installed cache includes all dojo files and supports fresh challenge rewards and practice after an offline reload',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await seed(page);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await hub(page);await page.locator('[data-action="dojo-start"][data-id="rhythm"]').click();for(const a of DOJO_PLANS.rhythm)await cast(page,a);await page.locator('[data-duel="close"]').first().click();await tab(page,'rewards');await page.locator('[data-action="dojo-claim"][data-id="3"]').click();const s=await read(page);expect(s.dojo.claimed).toEqual([3]);await page.reload();await hub(page);await tab(page,'practice');await page.locator('[data-action="dojo-path"][data-id="emberbird"][data-branch="burn"]').click();await page.locator('[data-action="dojo-start"][data-kind="practice"]').click();await cast(page,'pet:emberbird');expect((await read(page)).resources).toEqual(s.resources);expect(errors).toEqual([]);}finally{await context.close();}
});
