import { test,expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { B } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';
import { bossIntent } from '../../web/js/boss-state.js';

const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const battle=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run?.battle:s.expedition?.battle;
function ready(mode='boss'){
  const s=E.newGame();s.level=2;s.resources.food=10000;
  if(mode==='boss')B.startBoss(s,1,()=>.4);
  else if(mode==='ruins'){R.startRuins(s,1,()=>.4);R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring'));}
  else{E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);}
  return s;
}
async function seed(page,s){
  await page.addInitScript(({raw,key})=>{if(!sessionStorage.getItem('rhythm-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('rhythm-seed','1');}Math.random=()=>.5;},{raw:E.serialize(s),key:E.SAVE_KEY});
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
async function clock(page){await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));}
async function open(page,mode='boss'){await page.locator(`[data-action="active-battle"][data-id="${mode}"]`).click();await expect(page.locator('#combat-stage')).toBeVisible();}
async function timed(page,action='attack',at=600,keyboard=false){
  await page.locator(`[data-duel="choose"][data-move="${action}"]`).click();await page.clock.runFor(at);
  if(keyboard)await page.keyboard.press('Space');else await page.locator('[data-duel="hit"]').click();
  await page.clock.runFor(1200);
}

test('choosing or cancelling a timed action cannot consume a turn, energy, pressure or RNG',async({page})=>{
  await clock(page);await seed(page,ready());await open(page);const before=await read(page);
  await page.locator('[data-move="attack"]').click();await page.clock.runFor(6000);expect((await read(page)).boss.run).toEqual(before.boss.run);
  await page.locator('[data-duel="cancel"]').click();expect((await read(page)).boss.run).toEqual(before.boss.run);
  await page.locator('[data-move="guard"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(100);const after=await read(page);expect(after.boss.run.turn).toBe(1);expect(after.boss.run.rhythm).toEqual({pressure:0,exposed:0});
  await page.locator('[data-duel="timing"]').click();await page.locator('[data-move="attack"]').click();await page.clock.runFor(100);expect((await read(page)).boss.run.turn).toBe(2);await expect(page.locator('.duel-meter')).toHaveCount(0);
});

test('perfect timing, stance break and the following exposed hit match actual rules in all three modes',async({browser})=>{
  for(const mode of ['boss','ruins','explore']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
    try{
      const s=ready(mode);battle(s,mode).rhythm.pressure=68;await clock(page);await seed(page,s);await open(page,mode);
      const expected=structuredClone((await read(page))),now=await page.evaluate(()=>Date.now());
      const result=mode==='boss'?B.bossBattleTurn(expected,'guard',now,'perfect'):mode==='ruins'?R.ruinsBattleTurn(expected,'guard',now,'perfect'):E.battleTurn(expected,'guard',()=>.5,'perfect');
      await timed(page,'guard',600,true);const actual=await read(page);expect(battle(actual,mode)).toEqual(battle(expected,mode));expect(result.incoming).toBe(0);expect(battle(actual,mode).rhythm).toEqual({pressure:2,exposed:1});
      await expect(page.locator('.duel-pressure')).toContainText('Đòn sau +20%');await expect(page.locator('.duel-feedback')).toContainText('Phá thế!');
      await page.locator('[data-duel="close"]').click();await page.reload();await open(page,mode);expect(battle(await read(page),mode).rhythm).toEqual({pressure:2,exposed:1});
    }finally{await context.close();}
  }
});

test('native back cancels the meter first, leaves the stage next, and a page reload cannot finish a pending attack',async({page})=>{
  await clock(page);await seed(page,ready());await open(page);const before=(await read(page)).boss.run;
  await page.locator('[data-move="attack"]').click();await page.clock.runFor(600);expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await expect(page.locator('.duel-meter')).toHaveCount(0);await expect(page.locator('#combat-stage')).toBeVisible();
  expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await expect(page.locator('#combat-stage')).not.toBeVisible();expect((await read(page)).boss.run).toEqual(before);
  await open(page);await page.locator('[data-move="guard"]').click();await page.reload();expect((await read(page)).boss.run).toEqual(before);await expect(page.locator('#combat-stage')).not.toBeVisible();
});

test('battle controls and the timing target fit small phones, with the arena still visible while aiming',async({page})=>{
  await clock(page);await seed(page,ready());await open(page);
  for(const [width,height]of [[320,640],[360,740],[390,844],[768,900],[1440,1000]]){
    await page.setViewportSize({width,height});expect(await page.locator('#combat-stage').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
    await expect(page.locator('[data-move="attack"]')).toBeVisible();await page.locator('[data-move="attack"]').click();
    expect(await page.locator('#combat-stage').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
    await expect(page.locator('.duel-arena')).toBeInViewport();await expect(page.locator('[data-duel="hit"]')).toBeInViewport();
    if(width===390){await page.clock.runFor(600);await page.screenshot({path:'dist/screenshots/active-combat-mobile-1.10.0.png'});}
    if(width===1440)await page.screenshot({path:'dist/screenshots/active-combat-desktop-1.10.0.png'});
    await page.locator('[data-duel="cancel"]').click();
  }
});

test('an action has a visible windup, elemental impact and separate enemy response without duplicate turns',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage();
  try{
    await clock(page);await seed(page,ready());await open(page);await page.locator('[data-move="attack"]').click();await page.clock.runFor(600);await page.locator('[data-duel="hit"]').click();
    await expect(page.locator('.duel-friend.is-acting')).toHaveCount(3);await expect(page.locator('.duel-projectile')).toHaveCount(3);await expect(page.locator('[data-move="attack"]')).toBeDisabled();
    const committed=(await read(page)).boss.run;await page.keyboard.press('Space');expect((await read(page)).boss.run).toEqual(committed);
    await page.clock.runFor(550);await expect(page.locator('.duel-opponent.is-hurt')).toHaveCount(1);await expect(page.locator('.duel-number.enemy')).toHaveCount(1);await expect(page.locator('.duel-callout')).toContainText('HOÀN HẢO');
    await page.screenshot({path:'dist/screenshots/team-combat-impact.png'});await page.clock.runFor(230);await expect(page.locator('.duel-opponent.is-attacking')).toHaveCount(1);await page.clock.runFor(450);await expect(page.locator('[data-move="attack"]')).toBeEnabled();expect((await read(page)).boss.run.turn).toBe(1);
  }finally{await context.close();}
});

test('both reduced-motion choices keep real timing and combat feedback without camera or projectile animation',async({browser})=>{
  for(const setting of ['system','game']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',reducedMotion:setting==='system'?'reduce':'no-preference',serviceWorkers:'block'}),page=await context.newPage();
    try{const s=ready();if(setting==='game')s.settings.motion=false;await clock(page);await seed(page,s);await open(page);await timed(page);await expect(page.locator('#combat-stage')).toHaveClass(/duel-quiet/);await expect(page.locator('.duel-projectile')).toHaveCount(0);await expect(page.locator('.duel-feedback')).toContainText('Hoàn hảo');expect((await read(page)).boss.run.rhythm.pressure).toBe(34);}finally{await context.close();}
  }
});

test('a legacy boss save gains rhythm and timed touch combat works offline with a durable save',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',serviceWorkers:'allow'}),page=await context.newPage();
  try{
    const s=ready();delete s.boss.run.rhythm;await seed(page,s);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await clock(page);await open(page);
    await page.locator('[data-move="attack"]').tap();await page.clock.runFor(600);await page.locator('[data-duel="hit"]').tap();await page.clock.runFor(100);const after=(await read(page)).boss.run;expect(after.rhythm.pressure).toBe(34);await page.reload();expect((await read(page)).boss.run).toEqual(after);await open(page);await expect(page.locator('.duel-pressure')).toContainText('34/100');
  }finally{await context.close();}
});

test('a full active guardian battle uses skills and combos, crosses phases and gives durable loot only once',async({page})=>{
  await clock(page);await seed(page,ready());await open(page);const phases=new Set();
  for(let i=0;i<25;i++){
    const r=(await read(page)).boss.run;if(!r)break;phases.add(r.phase);
    const action=r.hp<100&&r.focus>=2&&!r.tactics.cooldowns.axolotl?'pet:axolotl':r.focus>=2&&!r.tactics.cooldowns.emberbird?'pet:emberbird':bossIntent(r).id==='heavy'?'guard':'attack';
    await timed(page,action);
  }
  const won=await read(page);expect(won.boss.lastResult.status).toBe('victory');expect(won.boss.wins).toBe(1);expect(won.forge.items).toHaveLength(1);expect([...phases]).toEqual([1,2,3]);await expect(page.locator('.duel-end')).toBeVisible();
  await page.locator('.duel-end .btn').click();await expect(page.locator('.guardian-result')).toContainText('Một lời chúc');await page.reload();const restored=await read(page);expect(restored.boss).toEqual(won.boss);expect(restored.forge).toEqual(won.forge);expect(restored.resources).toEqual(won.resources);
});
