import {test,expect} from '@playwright/test';
import {E,squadReady,squadGame,turn,unitHp} from '../squad-fixtures.mjs';
import {combatScene} from '../../web/js/combat-stage.js';
import {autoOrder} from '../../web/js/auto-play.js';
import {startDojo} from '../../web/js/dojo-engine.js';
import {navigateGame} from './navigation.mjs';
const {version}=JSON.parse((await import('node:fs')).readFileSync('package.json','utf8'));
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(p,s,{motion=false}={}){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));if(motion)await p.emulateMedia({reducedMotion:'no-preference'});
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('auto-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('auto-seeded','1');}Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
const toggle=p=>p.locator('[data-duel="auto"]');
async function open(p,m='explore'){await p.locator(`[data-action="active-battle"][data-id="${m}"]`).first().click();await expect(toggle(p)).toHaveAttribute('aria-checked','false');}

test('AUTO commits a real skill without tapping, can be stopped, and does not replay a saved turn',async({page})=>{
  const s=squadReady(),expected=structuredClone(s),{reason,...order}=autoOrder(combatScene(s,'explore'));turn(expected,'explore',order);await seed(page,s);await open(page);const before=await read(page);
  await toggle(page).click();await expect(toggle(page)).toHaveAttribute('aria-checked','true');await expect(page.locator('[data-move="attack"]')).toBeDisabled();expect((await read(page)).expedition).toEqual(before.expedition);
  await page.clock.runFor(901);expect((await read(page)).expedition).toEqual(expected.expedition);await toggle(page).click();await page.clock.runFor(5000);await expect(toggle(page)).toHaveAttribute('aria-checked','false');await expect(page.locator('[data-move="attack"]')).toBeEnabled();const stopped=await read(page);expect(stopped.expedition).toEqual(expected.expedition);
  await page.reload();await open(page);await page.clock.runFor(5000);expect((await read(page)).expedition).toEqual(stopped.expedition);
});
test('AUTO heals the weakest pet and uses support to reopen a waiting skill',async({page})=>{
  const s=squadReady('explore',['pebbleturtle','axolotl','cottonbun']);s.expedition.battle.tactics.cooldowns.axolotl=2;unitHp(s,'explore','allies',[9,31,30]);await seed(page,s);await open(page);await toggle(page).click();await page.clock.runFor(1000);
  await expect(page.locator('.duel-feedback')).toContainText('Tiếp sức');expect((await read(page)).expedition.battle.tactics.cooldowns.axolotl).toBe(0);await page.clock.runFor(1000);await expect(page.locator('.auto-action-note')).toContainText('Cứu bạn');expect((await read(page)).expedition.battle.tactics.cooldowns.axolotl).toBe(2);await toggle(page).click();
});
test('speed changes and repeated toggles during animation never consume duplicate turns',async({page})=>{
  await seed(page,squadReady('boss'),{motion:true});await open(page,'boss');await toggle(page).click();await page.clock.runFor(901);const once=(await read(page)).boss.run;expect(once.turn).toBe(1);
  await page.locator('[data-duel="speed"]').click();await toggle(page).click();await toggle(page).click();await toggle(page).click();await page.clock.runFor(5000);expect((await read(page)).boss.run).toEqual(once);await expect(toggle(page)).toHaveAttribute('aria-checked','false');await expect(page.locator('[data-duel="speed"]')).toHaveText('×2');await expect(page.locator('[data-move="attack"]')).toBeEnabled();
});
test('a phone contact toggles AUTO once even if a committed turn replaces the button before release',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'}),p=await c.newPage(),cdp=await c.newCDPSession(p);
  try{await seed(p,squadReady('boss'),{motion:true});await open(p,'boss');const r=await toggle(p).boundingBox(),point={x:r.x+r.width/2,y:r.y+r.height/2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await expect(toggle(p)).toHaveAttribute('aria-checked','true');await p.clock.runFor(1000);expect((await read(p)).boss.run.turn).toBe(1);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(toggle(p)).toHaveAttribute('aria-checked','true');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await expect(toggle(p)).toHaveAttribute('aria-checked','false');await p.clock.runFor(1500);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.clock.runFor(5000);await expect(toggle(p)).toHaveAttribute('aria-checked','false');expect((await read(p)).boss.run.turn).toBe(1);
    await toggle(p).focus();await p.keyboard.press('Enter');await expect(toggle(p)).toHaveAttribute('aria-checked','true');await p.evaluate(()=>window.spiritBack());await expect(toggle(p)).toHaveAttribute('aria-checked','false');
  }finally{await cdp.detach();await c.close();}
});
test('walking continues into battle, another walking stage, and exactly one completed trip',async({page})=>{
  const s=squadGame();s.pets.forEach(p=>p.level=20);E.startExpedition(s,'forest',()=>.5,1720000000000);await seed(page,s);await page.locator('[data-action="journey-auto"]').click();await expect(page.locator('.travel-world.is-walking')).toBeVisible();await expect(page.locator('[data-duel="route"]').first()).toBeDisabled();
  await page.locator('[data-duel="speed"]').click();await page.clock.runFor(1151);await expect(page.locator('.has-squad')).toBeVisible();await page.clock.runFor(6000);const progressing=await read(page);expect(progressing.expedition?.stage||progressing.stats.expeditions).toBeGreaterThan(0);
  await page.clock.runFor(60000);await expect(page.locator('.duel-end h2')).toHaveText('Đã hoàn thành hành trình!');await expect(page.locator('.auto-result-loot')).toBeVisible();expect((await read(page)).stats.expeditions).toBe(s.stats.expeditions+1);expect((await read(page)).expedition).toBeNull();const finished=(await read(page)).resources;await page.clock.runFor(60000);expect((await read(page)).resources).toEqual(finished);
});
test('manual route and manual timing still work after AUTO is disabled',async({page})=>{
  const s=squadGame();E.startExpedition(s,'forest',()=>.5);await seed(page,s);await page.locator('[data-action="journey-auto"]').click();await toggle(page).click();await expect(page.locator('.travel-world')).not.toHaveClass(/is-walking/);await page.locator('[data-duel="route"]').first().click();await expect(page.locator('.duel-arena')).toBeVisible();await page.locator('[data-move="attack"]').click();await expect(page.locator('.duel-meter')).toBeVisible();const pending=await read(page);await toggle(page).click();await expect(page.locator('.duel-meter')).toHaveCount(0);expect((await read(page)).expedition).toEqual(pending.expedition);await toggle(page).click();await page.locator('[data-move="attack"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(100);expect((await read(page)).expedition.battle.round).toBe(1);
});
test('Back first disables AUTO; closing and reopening cannot restart it',async({page})=>{
  await seed(page,squadReady('boss'));await open(page,'boss');await toggle(page).click();const before=(await read(page)).boss.run;await page.evaluate(()=>window.spiritBack());await expect(toggle(page)).toHaveAttribute('aria-checked','false');await page.clock.runFor(5000);expect((await read(page)).boss.run).toEqual(before);await page.evaluate(()=>window.spiritBack());await expect(page.locator('#combat-stage')).not.toBeVisible();await open(page,'boss');await page.clock.runFor(5000);expect((await read(page)).boss.run).toEqual(before);
});
test('hidden and Android page events suspend without catch-up and resume one scheduled action',async({page})=>{
  await seed(page,squadReady('boss'));await open(page,'boss');await toggle(page).click();const before=(await read(page)).boss.run;await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(60000);expect((await read(page)).boss.run).toEqual(before);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('spirit-resume'));window.dispatchEvent(new Event('pageshow'));});await page.clock.runFor(899);expect((await read(page)).boss.run.turn).toBe(0);await page.clock.runFor(2);expect((await read(page)).boss.run.turn).toBe(1);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.clock.runFor(60000);expect((await read(page)).boss.run.turn).toBe(1);await page.evaluate(()=>window.dispatchEvent(new Event('spirit-resume')));await page.clock.runFor(901);expect((await read(page)).boss.run.turn).toBe(2);await toggle(page).click();
});
test('fixed challenge rules still use manual input',async({page})=>{
  const s=squadGame();startDojo(s,'challenge','rhythm');
  await seed(page,s);await page.locator('[data-action="active-battle"][data-id="dojo"]').click();await expect(toggle(page)).toHaveCount(0);await expect(page.locator('[data-move="attack"]')).toBeEnabled();
});
test('free practice and ruins have working AUTO controls',async({browser})=>{
  for(const m of ['dojo','ruins']){const c=await browser.newContext({reducedMotion:'reduce'}),p=await c.newPage();try{const s=m==='dojo'?squadGame():squadReady('ruins');if(m==='dojo')startDojo(s,'practice','plain');await seed(p,s);await open(p,m);await toggle(p).click();await p.clock.runFor(1000);await expect(toggle(p)).toHaveAttribute('aria-checked','true');const after=await read(p);expect(m==='dojo'?after.dojo.run.metrics.turns:after.ruins.run.battle.turn).toBe(1);await toggle(p).click();}finally{await c.close();}}
});
test('phone controls fit inside the game, switch target priorities, and the new journey works offline',async({browser})=>{
  const c=await browser.newContext({viewport:{width:320,height:640},serviceWorkers:'allow',reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{const s=squadReady();await seed(p,s);await p.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>p.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);expect(await p.evaluate(async version=>{const cache=await caches.open(`spirit-isles-v${version}`);return (await Promise.all(['auto-play.css','js/auto-play.js','js/journey-scene.js'].map(f=>cache.match('/'+f)))).every(Boolean);},version)).toBe(true);await c.setOffline(true);await p.reload();await open(p);await p.locator('[data-auto-priority]').selectOption('weak');await expect(p.locator('[data-auto-priority]')).toHaveValue('weak');const bounds=await p.locator('.auto-hud button,.auto-hud select').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height};}));expect(bounds.every(r=>r.x>=0&&r.right<=320&&r.height>=44&&r.width>=44)).toBe(true);expect(await p.locator('#combat-stage').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await toggle(p).click();await p.clock.runFor(1000);await toggle(p).click();expect((await read(p)).expedition.battle.round).toBe(1);expect(errors).toEqual([]);}
  finally{await c.close();}
});
test('launching AUTO buys only one trip and locked regions stay unavailable',async({page})=>{
  const s=E.newGame();await seed(page,s);await navigateGame(page,'explore');await expect(page.locator('[data-action="auto-expedition"][data-id="reef"]')).toBeDisabled();const food=(await read(page)).resources.food;await page.locator('[data-action="auto-expedition"][data-id="forest"]').click();await expect(page.locator('.travel-world')).toBeVisible();expect((await read(page)).resources.food).toBe(food-10);await toggle(page).click();await page.clock.runFor(10000);expect((await read(page)).resources.food).toBe(food-10);
});
