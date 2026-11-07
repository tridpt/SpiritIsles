import { test,expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { B } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';
import { previewOrder } from '../../web/js/combat-preview.js';

const battle=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run?.battle:s.expedition?.battle;
const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
function ready(mode='boss',team){
  const s=E.newGame();s.level=2;s.resources.food=10000;
  if(team){s.team=team;s.pets=team.map(id=>E.makePet(id));}
  if(mode==='boss')B.startBoss(s,1,()=>.4);
  else if(mode==='ruins'){R.startRuins(s,1,()=>.4);R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring'));}
  else{E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);}
  return s;
}
async function seed(page,s){
  await page.addInitScript(({raw,key})=>{if(!sessionStorage.getItem('orders-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('orders-seed','1');}Math.random=()=>.5;},{raw:E.serialize(s),key:E.SAVE_KEY});
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
async function open(page,mode='boss'){await page.locator(`[data-action="active-battle"][data-id="${mode}"]`).click();await expect(page.locator('#combat-stage')).toBeVisible();}
async function choose(page,move){await page.locator(`[data-duel="choose"][data-move="${move}"]`).click();}
async function commit(page,move){await choose(page,move);if(move!=='charge')await page.clock.runFor(600);await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);}

test('stances, root selection and previews never mutate the saved turn before confirmation',async({page})=>{
  const s=ready();Object.assign(s.boss.run,{phase:2,roots:2,enemyHp:180});await seed(page,s);await open(page);const before=(await read(page)).boss.run;
  await page.locator('[data-stance="assault"]').click();await page.locator('[data-target="roots"]').click();await choose(page,'attack');
  await expect(page.locator('.duel-preview')).toContainText('Nhắm rễ');await expect(page.locator('.duel-preview')).toContainText('Chặt 2 rễ');
  await page.locator('[data-duel="preview"][data-grade="normal"]').click();await page.locator('[data-duel="preview"][data-grade="perfect"]').click();
  expect((await read(page)).boss.run).toEqual(before);await page.locator('[data-duel="cancel"]').click();expect((await read(page)).boss.run).toEqual(before);
  await choose(page,'guard');await expect(page.locator('.duel-preview')).not.toContainText('Nhắm rễ');await page.evaluate(()=>window.spiritBack());await page.evaluate(()=>window.spiritBack());
  await open(page);await expect(page.locator('[data-stance="balanced"]')).toHaveAttribute('aria-pressed','true');expect((await read(page)).boss.run).toEqual(before);
});
test('perfect root targeting commits exactly the previewed result and remembers the chosen stance',async({page})=>{
  const s=ready();Object.assign(s.boss.run,{phase:2,roots:2,enemyHp:180});await seed(page,s);await open(page);
  await page.locator('[data-stance="assault"]').click();await page.locator('[data-target="roots"]').click();await choose(page,'attack');
  const before=(await read(page)),p=previewOrder(before,'boss',{move:'attack',stance:'assault',target:'roots'},'perfect');
  await expect(page.locator('[data-preview="damage"]')).toHaveText(`${p.damage.min}`);await expect(page.locator('[data-preview="incoming"]')).toHaveText(`${p.incoming.min}`);
  await page.clock.runFor(600);await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);
  const after=(await read(page)).boss.run;expect(after.enemyHp).toBe(p.enemyHpAfter.min);expect(after.hp).toBe(p.hpAfter.min);expect(after.roots).toBe(0);expect(after.strategy.stance).toBe('assault');
  await expect(page.locator('.duel-feedback')).toContainText('chặt 2 rễ');await expect(page.locator('.duel-targets')).toHaveCount(0);
  await page.reload();await open(page);await expect(page.locator('[data-stance="assault"]')).toHaveAttribute('aria-pressed','true');expect((await read(page)).boss.run).toEqual(after);
});
test('perfect guarding prepares one riposte, charging preserves it, and an offensive skill spends both',async({browser})=>{
  for(const mode of ['boss','ruins','explore']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
    try{
      await seed(page,ready(mode));await open(page,mode);await commit(page,'guard');
      expect(battle(await read(page),mode).strategy.riposte).toBe(1);await expect(page.locator('[data-buff="riposte"]')).toBeVisible();
      await choose(page,'charge');await expect(page.locator('.duel-meter')).toHaveCount(0);const held=battle(await read(page),mode);await page.clock.runFor(12000);expect(battle(await read(page),mode)).toEqual(held);
      await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);const charged=battle(await read(page),mode);expect(charged.strategy).toEqual({stance:'balanced',drive:1,riposte:1});
      await expect(page.locator('[data-move="charge"]')).toBeDisabled();await expect(page.locator('[data-buff="drive"]')).toBeVisible();
      const s=await read(page),now=await page.evaluate(()=>Date.now());const order={move:'pet:emberbird',stance:'balanced',target:'body'};
      if(mode==='boss')B.bossBattleTurn(s,order,now,'perfect');else if(mode==='ruins')R.ruinsBattleTurn(s,order,now,'perfect');else E.battleTurn(s,order,()=>.5,'perfect');
      await commit(page,'pet:emberbird');expect(battle(await read(page),mode)).toEqual(battle(s,mode));
    }finally{await context.close();}
  }
});
test('charging is harmless to cancel and cannot farm pressure, including fast mode and native Back',async({page})=>{
  const s=ready();s.boss.run.rhythm={pressure:99,exposed:1};s.boss.run.turn=2;await seed(page,s);await open(page);const before=(await read(page)).boss.run;
  await page.locator('[data-duel="timing"]').click();await choose(page,'charge');await expect(page.locator('.duel-charge-confirm')).toBeVisible();await expect(page.locator('[data-preview="incoming"]')).toHaveText('0');
  await page.evaluate(()=>window.spiritBack());expect((await read(page)).boss.run).toEqual(before);
  await commit(page,'charge');const r=(await read(page)).boss.run;expect(r.turn).toBe(3);expect(r.rhythm).toEqual(before.rhythm);expect(r.strategy.drive).toBe(1);expect(r.focus).toBe(2);
  await expect(page.locator('.duel-feedback')).toContainText('Lấy đà');
});
test('previews warn about lethal turns and show healing and shield effects from real skills',async({page})=>{
  const s=ready('boss',['mossfox','axolotl','pebbleturtle']);s.boss.run.hp=1;s.boss.run.focus=3;s.boss.run.turn=3;await seed(page,s);await open(page);
  await choose(page,'charge');await expect(page.locator('.duel-preview.risky')).toBeVisible();await expect(page.locator('.duel-preview-note')).toContainText('gục');
  await page.locator('[data-duel="cancel"]').click();await choose(page,'pet:axolotl');await expect(page.locator('.duel-move-description')).toContainText('hồi');
  expect(Number(await page.locator('[data-preview="heal"]').textContent())).toBeGreaterThan(0);await expect(page.locator('.duel-preview.risky')).toHaveCount(0);
  await page.locator('[data-duel="cancel"]').click();await choose(page,'pet:pebbleturtle');
  expect(Number(await page.locator('[data-preview="support"]').textContent())).toBeGreaterThan(0);await expect(page.locator('.duel-preview-note')).toContainText('Khiên chặn');
});
test('root and charge previews fit a 320 by 640 phone with the arena and commit control visible',async({page})=>{
  const s=ready();Object.assign(s.boss.run,{phase:2,roots:2,enemyHp:180});s.boss.run.strategy.riposte=1;await seed(page,s);await open(page);
  for(const [width,height]of [[320,640],[360,740],[390,844],[1440,1000]]){
    await page.setViewportSize({width,height});await page.locator('[data-target="roots"]').click();await choose(page,'attack');
    await expect(page.locator('.duel-arena')).toBeInViewport();await expect(page.locator('.duel-preview')).toBeInViewport();await expect(page.locator('[data-duel="hit"]')).toBeInViewport();
    expect(await page.locator('#combat-stage').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.screenshot({path:`dist/screenshots/combat-root-${width}-1.10.0.png`});await page.locator('[data-duel="cancel"]').click();await choose(page,'charge');
    await expect(page.locator('.duel-arena')).toBeInViewport();await expect(page.locator('[data-duel="hit"]')).toBeInViewport();
    if(width===390)await page.screenshot({path:'dist/screenshots/combat-charge-mobile-1.10.0.png'});
    await page.locator('[data-duel="cancel"]').click();
  }
});
test('the installed offline web app saves charged and riposte state once and resumes it after reload',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',serviceWorkers:'allow'}),page=await context.newPage();
  try{
    const s=ready();delete s.boss.run.strategy;await seed(page,s);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await open(page);
    await page.locator('[data-stance="guarded"]').tap();await commit(page,'guard');await commit(page,'charge');const before=(await read(page)).boss.run;
    expect(before.strategy).toEqual({stance:'guarded',drive:1,riposte:1});await page.reload();expect((await read(page)).boss.run).toEqual(before);await open(page);
    await expect(page.locator('[data-buff="drive"]')).toBeVisible();await expect(page.locator('[data-buff="riposte"]')).toBeVisible();await choose(page,'pet:emberbird');
    const saved=(await read(page)).boss.run;await page.reload();expect((await read(page)).boss.run).toEqual(saved);
  }finally{await context.close();}
});
