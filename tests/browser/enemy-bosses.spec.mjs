import { navigateGame } from './navigation.mjs';
import {test,expect} from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { B } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';
import {newEnemyAI} from '../../web/js/enemy-tactics.js';
import {previewOrder} from '../../web/js/combat-preview.js';

const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
function ready(id){
  const s=E.newGame();s.level=10;s.resources.food=10000;
  if(id==='frost'||id==='phoenix')Object.assign(s.boss,{best:1,wins:1,clears:[1,0,0,0,0]});
  if(id==='phoenix')Object.assign(s.boss.rivals.frost,{best:1,wins:1,clears:[1,0,0,0,0]});
  if(id)B.startBoss(s,1,()=>.38,Date.now(),id);return s;
}
async function seed(page,s){
  E.validateSave(E.serialize(s));
  await page.addInitScript(({raw,key})=>{if(!sessionStorage.getItem('enemy-boss-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('enemy-boss-seed','1');}Math.random=()=>.5;},{raw:E.serialize(s),key:E.SAVE_KEY});
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
async function hub(page){await navigateGame(page,'explore');await page.locator('.ruins-explore-tabs [data-page="boss"]').click();}
async function open(page,mode='boss'){await page.locator(`[data-action="active-battle"][data-id="${mode}"]`).click();}
async function choose(page,move){await page.locator(`[data-duel="choose"][data-move="${move}"]`).click();}
async function commit(page,move,grade='perfect'){await choose(page,move);if(move!=='charge')await page.clock.runFor(grade==='perfect'?600:0);await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);}
async function fit(page){for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);}}

test('three-boss selection previews gates and a single start control without spending supplies',async({page})=>{
  const s=ready();s.level=2;await seed(page,s);await hub(page);const before=(await read(page)).resources;
  await expect(page.locator('[data-action="boss-select"]')).toHaveCount(3);
  for(const id of ['frost','phoenix']){
    await page.locator(`[data-action="boss-select"][data-id="${id}"]`).click();await expect(page.locator('[data-selected-boss]')).toHaveAttribute('data-selected-boss',id);await expect(page.locator('[data-action="boss-start"]')).toBeDisabled();
    await expect(page.locator('.guardian-sanctum-body')).toContainText(id==='frost'?'thắng Cổ Mộc Gai':'thắng Rồng Băng');await fit(page);
  }
  expect((await read(page)).resources).toEqual(before);await page.locator('[data-action="boss-select"][data-id="treant"]').click();await expect(page.locator('[data-action="boss-start"]')).toBeEnabled();
});
test('unlocked boss starts from the hub with its own artwork, intent and saved identity',async({page})=>{
  const s=ready('frost');B.retreatBoss(s);await seed(page,s);await hub(page);await page.locator('[data-action="boss-select"][data-id="frost"]').click();
  await page.screenshot({path:'dist/screenshots/frost-hub-desktop-1.10.0.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'dist/screenshots/frost-hub-mobile-1.10.0.png',fullPage:true});
  const food=(await read(page)).resources.food;await page.locator('[data-action="boss-start"]').click();expect((await read(page)).boss.run.bossId).toBe('frost');expect((await read(page)).resources.food).toBe(food-12);
  await expect(page.locator('.guardian-enemy .boss-frost')).toBeVisible();await page.reload();await open(page);await expect(page.locator('.duel-topbar')).toContainText('Rồng Băng');await expect(page.locator('.duel-opponent .boss-frost')).toBeVisible();
});
test('frost preview announces energy lock and the saved freeze survives reload until a real thaw',async({page})=>{
  const s=ready('frost');Object.assign(s.boss.run,{turn:2,focus:2});await seed(page,s);await open(page);await choose(page,'attack');
  await page.locator('[data-duel="preview"][data-grade="normal"]').click();await expect(page.locator('.duel-preview')).toContainText('khóa tích năng lượng 2 lượt');const before=(await read(page)).boss.run;
  await page.locator('[data-duel="cancel"]').click();expect((await read(page)).boss.run).toEqual(before);
  await commit(page,'attack','normal');expect((await read(page)).boss.run.mechanics.frozen).toBe(2);await expect(page.locator('[data-buff="frozen"]')).toContainText('2L');await expect(page.locator('.duel-feedback')).toContainText('Khóa tích năng lượng');
  await page.reload();await open(page);await choose(page,'charge');await expect(page.locator('.duel-preview')).toContainText('Băng khóa');await page.locator('[data-duel="cancel"]').click();
  await commit(page,'pet:emberbird');const r=(await read(page)).boss.run;expect(r.mechanics.frozen).toBe(0);await expect(page.locator('[data-buff="frozen"]')).toHaveCount(0);await expect(page.locator('.duel-feedback')).toContainText('Tan băng');
});
test('fire interrupt commits the exact preview without blizzard damage or freezing',async({page})=>{
  const s=ready('frost');Object.assign(s.boss.run,{turn:2,focus:2});await seed(page,s);await open(page);await choose(page,'pet:emberbird');const before=await read(page),p=previewOrder(before,'boss',{move:'pet:emberbird'},'perfect');
  await expect(page.locator('.duel-preview')).toContainText('Ngắt Bão tuyết');await expect(page.locator('[data-preview="incoming"]')).toHaveText('0');
  await page.clock.runFor(600);await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);const r=(await read(page)).boss.run;expect(r.hp).toBe(p.hpAfter.min);expect(r.enemyHp).toBe(p.enemyHpAfter.min);expect(r.mechanics.frozen).toBe(0);await expect(page.locator('.duel-feedback')).toContainText('Ngắt bão');
});
test('phoenix core targeting is preview-only until confirmed, breaks the core and preserves it on reload',async({page})=>{
  const s=ready('phoenix');Object.assign(s.boss.run,{phase:2,enemyHp:200,focus:3,turn:1});s.boss.run.mechanics.coreHp=30;await seed(page,s);await open(page);const before=(await read(page)).boss.run;
  await page.locator('[data-target="core"]').click();await choose(page,'attack');await expect(page.locator('.duel-preview')).toContainText('Nhắm lõi lửa');await expect(page.locator('.duel-preview')).toContainText('Chặn tái sinh');expect((await read(page)).boss.run).toEqual(before);
  await page.screenshot({path:'dist/screenshots/phoenix-core-desktop-1.10.0.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'dist/screenshots/phoenix-core-mobile-1.10.0.png'});
  const p=previewOrder(await read(page),'boss',{move:'attack',target:'core'},'perfect');await page.clock.runFor(600);await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);
  const r=(await read(page)).boss.run;expect(r.mechanics.coreHp).toBe(0);expect(r.enemyHp).toBe(p.enemyHpAfter.min);await expect(page.locator('.duel-feedback')).toContainText('Lõi tắt');await expect(page.locator('[data-target="core"]')).toHaveCount(0);
  await page.reload();await open(page);await expect(page.locator('[data-buff="core"]')).toContainText('Lõi đã tắt');expect((await read(page)).boss.run).toEqual(r);
});
test('phoenix revives in the arena once, grants no early loot and pays exclusive rewards only on final victory',async({page})=>{
  const s=ready('phoenix');Object.assign(s.boss.run,{phase:3,enemyHp:1,focus:3});await seed(page,s);await open(page);await choose(page,'attack');await expect(page.locator('.duel-preview')).toContainText('Boss tái sinh');await expect(page.locator('.duel-preview')).not.toContainText('Kết thúc trận');await page.locator('[data-duel="cancel"]').click();await commit(page,'attack');
  let a=await read(page);expect(a.boss.run.mechanics.revives).toBe(1);expect(a.forge.items).toHaveLength(0);await expect(page.locator('.duel-feedback')).toContainText('Tái sinh');
  for(let i=0;(await read(page)).boss.run&&i<20;i++){
    const r=(await read(page)).boss.run,move=r.hp<100&&r.focus>=2&&!r.tactics.cooldowns.axolotl?'pet:axolotl':r.focus>=2?'skill':'attack';await commit(page,move);
  }
  a=await read(page);expect(a.boss.lastResult.status).toBe('victory');expect(a.boss.rivals.phoenix.best).toBe(1);expect(a.forge.items).toHaveLength(1);expect(['emberplume','dawnstone']).toContain(a.forge.items[0].recipe);
  await page.reload();const b=await read(page);expect(b.forge).toEqual(a.forge);expect(b.boss.rivals).toEqual(a.boss.rivals);await hub(page);await expect(page.locator('.guardian-result')).toContainText('PHƯỢNG HOÀNG');
});
test('quick battle can target a visible core and never mistakes it for a normal attack',async({page})=>{
  const s=ready('phoenix');Object.assign(s.boss.run,{phase:2,enemyHp:200});s.boss.run.mechanics.coreHp=20;await seed(page,s);await expect(page.locator('.guardian-mechanic.fire')).toContainText('Lõi lửa 20');
  const a=await read(page);B.bossBattleTurn(a,{move:'attack',target:'core'},0);await page.locator('[data-action="boss-battle"][data-id="core"]').click();const b=await read(page);expect(b.boss.run).toEqual(a.boss.run);await expect(page.locator('.guardian-mechanic.fire')).toContainText('Không thể tái sinh');
});
test('enemy tactics, interrupt forecasts and saved recovery are visible in both journey arenas',async({browser})=>{
  for(const mode of ['explore','ruins']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
    try{
      const s=ready();let b;if(mode==='ruins'){R.startRuins(s,1,()=>.2);R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring'));b=s.ruins.run.battle;s.ruins.run.focus=3;}else{E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);b=s.expedition.battle;b.focus=3;}
      b.enemyAI=newEnemyAI('caster');await seed(page,s);await open(page,mode);await expect(page.locator('.duel-intent')).toContainText('Đang tụ phép');await choose(page,'pet:emberbird');await expect(page.locator('.duel-preview')).toContainText('Ngắt linh chú');await page.locator('[data-duel="cancel"]').click();await commit(page,'pet:emberbird');
      const after=await read(page),battle=mode==='ruins'?after.ruins.run.battle:after.expedition.battle;expect(battle.enemyAI.casting).toBe(false);await expect(page.locator('.duel-intent')).toContainText('Linh chú đã bị ngắt');await page.reload();await open(page,mode);await expect(page.locator('.duel-intent')).toContainText('Linh chú đã bị ngắt');
      await page.screenshot({path:`dist/screenshots/caster-${mode}-mobile-1.10.0.png`});
    }finally{await context.close();}
  }
});
test('all new boss scenes fit small phones and desktop, with no script errors or clipped controls',async({browser})=>{
  for(const id of ['frost','phoenix']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      const s=ready(id);Object.assign(s.boss.run,{phase:2,enemyHp:190,focus:3});if(id==='frost')s.boss.run.mechanics.frozen=2;
      await seed(page,s);await fit(page);await open(page);await fit(page);for(const [width,height] of [[320,640],[390,844],[1440,1000]]){await page.setViewportSize({width,height});await choose(page,'skill');await expect(page.locator('[data-duel="hit"]')).toBeInViewport();await expect(page.locator('.duel-arena')).toBeInViewport();await page.locator('[data-duel="cancel"]').click();}
      expect(errors).toEqual([]);await page.setViewportSize({width:390,height:844});await page.screenshot({path:`dist/screenshots/${id}-arena-mobile-1.10.0.png`});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:`dist/screenshots/${id}-arena-desktop-1.10.0.png`});
    }finally{await context.close();}
  }
});
test('both new bosses and all local art remain playable after installing the web cache and going offline',async({browser})=>{
  for(const id of ['frost','phoenix']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'allow'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      const s=ready(id);Object.assign(s.boss.run,{phase:2,enemyHp:200,focus:3,turn:id==='frost'?2:1});if(id==='phoenix')s.boss.run.mechanics.coreHp=30;
      await seed(page,s);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await open(page);
      if(id==='phoenix')await page.locator('[data-target="core"]').click();await commit(page,'pet:emberbird');const after=(await read(page)).boss.run;expect(id==='frost'?after.mechanics.frozen:after.mechanics.coreHp).toBe(0);await expect(page.locator(`.duel-opponent .boss-${id}`)).toBeVisible();expect(errors).toEqual([]);
    }finally{await context.close();}
  }
});
