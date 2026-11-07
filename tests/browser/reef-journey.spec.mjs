import fs from 'node:fs';
import {test,expect} from '@playwright/test';
import {E,turn,unitHp} from '../squad-fixtures.mjs';
import {reefFixture} from '../reef-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const toggle=p=>p.locator('#combat-stage [data-duel="auto"]');
async function seed(p,s,{motion=false}={}){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
  if(motion)await p.emulateMedia({reducedMotion:'no-preference'});
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('reef-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('reef-seeded','1');}Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function open(p,auto=false){await p.locator(`[data-action="${auto?'journey-auto':'journey-open'}"]`).click();await expect(p.locator('#combat-stage')).toHaveClass(/reef-journey/);}

test('coastal world and allied pets persist through both real route choices and battle',async({page})=>{
  const state=reefFixture({travel:true}),expected=structuredClone(state);await seed(page,state);await open(page);
  await expect(page.locator('.forest-progress>span')).toHaveCount(5);await expect(page.locator('.forest-head h2')).toHaveText('Vịnh Ngọc Lam');
  await page.evaluate(()=>{window.reefWorld=document.querySelector('.forest-field');window.reefArt=document.querySelector('.reef-backdrop');window.reefPet=document.querySelector('[data-friend="mossfox"]');});
  await expect(page.locator('[data-duel="route"][data-choice="1"]')).toContainText('Quái mạnh hơn 30%');await page.locator('[data-duel="route"][data-choice="1"]').click();E.chooseRoute(expected,1,()=>.5);
  expect((await read(page)).expedition).toEqual(expected.expedition);await expect(page.locator('.forest-field')).toHaveAttribute('data-phase','battle');
  expect(await page.evaluate(()=>window.reefWorld===document.querySelector('.forest-field')&&window.reefArt===document.querySelector('.reef-backdrop')&&window.reefPet===document.querySelector('[data-friend="mossfox"]'))).toBe(true);
  await expect(page.locator('.combat-enemy-team .reef-crab')).toHaveCount(1);await expect(page.locator('.combat-enemy-team .reef-jelly')).toHaveCount(1);await expect(page.locator('.combat-enemy-team .reef-clam')).toHaveCount(1);
  await expect(page.locator('.combat-enemy-member[data-reef-kind="clam"]')).toHaveAttribute('aria-label',/Sò Ngọc Chữa Lành/);
});
test('enemy plans show charging, crab defense and rear healing by the displayed names',async({page})=>{
  await seed(page,reefFixture());await open(page);await page.locator('.forest-tactical>summary').click();
  await expect(page.locator('[data-intent-actor="enemy-0"]')).toContainText('Cua Đá');await expect(page.locator('[data-intent-actor="enemy-0"]')).toContainText('Khép càng');
  await expect(page.locator('[data-intent-actor="enemy-1"]')).toContainText('Tích điện');await expect(page.locator('[data-intent-actor="enemy-2"]')).toContainText('Sò Ngọc Chữa Lành');
});
test('one manual wave dodge agrees with the engine and exposes the belly after reload',async({page})=>{
  const state=reefFixture({boss:true,warning:true}),expected=structuredClone(state);turn(expected,'explore','evade');await seed(page,state);await open(page);
  await expect(page.locator('.forest-warning')).toContainText('SÓNG TRIỀU ĐANG TỚI');await page.locator('[data-duel="evade"]').click();await page.clock.runFor(70);
  expect((await read(page)).expedition).toEqual(expected.expedition);await expect(page.locator('.forest-field')).toHaveClass(/reef-opening/);await expect(page.locator('.forest-caption')).toContainText('Đòn kế tiếp +20%');
  await page.reload();await open(page);await expect(toggle(page)).toHaveAttribute('aria-checked','false');await expect(page.locator('.forest-field')).toHaveClass(/reef-opening/);expect((await read(page)).expedition).toEqual(expected.expedition);
});
test('AUTO dodges a wave then resumes legal attacks on the exposed boss',async({page})=>{
  const state=reefFixture({boss:true,warning:true}),expected=structuredClone(state);turn(expected,'explore',{move:'evade',stance:'balanced',target:'body',foe:'enemy-0'});
  await seed(page,state);await open(page);await toggle(page).click();await page.clock.runFor(901);expect((await read(page)).expedition).toEqual(expected.expedition);
  await toggle(page).click();await page.clock.runFor(60000);expect((await read(page)).expedition.battle.round).toBe(3);
  await toggle(page).click();await page.clock.runFor(901);expect((await read(page)).expedition.battle.round).toBe(4);expect((await read(page)).expedition.battle.rhythm.exposed).toBe(0);
});
test('held native-style dodge touch consumes only one turn when warning UI is replaced',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  try{const state=reefFixture({boss:true,warning:true,motion:true}),expected=structuredClone(state);turn(expected,'explore','evade');await seed(page,state,{motion:true});await open(page);
    const r=await page.locator('[data-duel="evade"]').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});expect((await read(page)).expedition).toEqual(expected.expedition);
    await page.clock.runFor(1600);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(5000);expect((await read(page)).expedition).toEqual(expected.expedition);
  }finally{await cdp.detach();await context.close();}
});
test('wave VFX plays during the actual enemy counter phase',async({page})=>{
  await seed(page,reefFixture({boss:true,warning:true,motion:true}),{motion:true});await open(page);await page.locator('[data-duel="evade"]').click();await page.clock.runFor(850);await expect(page.locator('.reef-tidal-burst')).toBeVisible();
  await page.screenshot({path:`dist/screenshots/reef-wave-${version}.png`});
});
test('charging jelly, shielding crab and healing clam animate their real actions',async({page})=>{
  const state=reefFixture({motion:true});unitHp(state,'explore','enemies',[15,30,30]);await seed(page,state,{motion:true});await open(page);
  await page.locator('[data-move="charge"]').click();await page.locator('[data-duel="hit"]').click();await page.clock.runFor(850);
  await expect(page.locator('[data-reef-kind="crab"]')).toHaveAttribute('data-forest-motion','guard');await expect(page.locator('[data-reef-kind="jelly"]')).toHaveAttribute('data-forest-motion','charge');await expect(page.locator('[data-reef-kind="clam"]')).toHaveAttribute('data-forest-motion','heal');
  const current=await read(page);expect(current.combatJournal.active.turns).toBe(1);await page.screenshot({path:`dist/screenshots/reef-patrol-${version}.png`});
});
test('a full five-encounter AUTO trip pays once and retains the world for results',async({page})=>{
  const state=reefFixture({travel:true,level:20});await seed(page,state);await open(page,true);await page.evaluate(()=>window.reefWorld=document.querySelector('.forest-field'));
  await page.clock.runFor(180000);await expect(page.locator('.forest-result .duel-end h2')).toHaveText('Đã hoàn thành hành trình!');const finished=await read(page);
  expect(finished.clears.reef).toBe(1);expect(finished.combatJournal.reports.length).toBe(5);expect(finished.expedition).toBeNull();expect(await page.evaluate(()=>window.reefWorld===document.querySelector('.forest-field'))).toBe(true);
  await page.clock.runFor(120000);expect((await read(page)).resources).toEqual(finished.resources);await expect(toggle(page)).toBeDisabled();await page.screenshot({path:`dist/screenshots/reef-complete-${version}.png`});
});
test('planner, Home and Back suspend the coast without missed waves or catch-up',async({page})=>{
  await seed(page,reefFixture({boss:true,warning:true}));await open(page,true);const before=(await read(page)).expedition;
  await page.getByRole('button',{name:'Mở chiến thuật AUTO',exact:true}).click();await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(before);await page.evaluate(()=>window.spiritBack());
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(before);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('spirit-resume'));});await page.clock.runFor(901);expect((await read(page)).expedition.battle.round).toBe(3);
  await page.evaluate(()=>window.spiritBack());await expect(toggle(page)).toHaveAttribute('aria-checked','false');const paused=(await read(page)).expedition;await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(paused);
});
for(const viewport of [{width:320,height:640},{width:390,height:844},{width:844,height:390},{width:1440,height:1000}])test(`coastal controls stay inside the game at ${viewport.width}×${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await seed(page,reefFixture({boss:true,warning:true}));await open(page);const metrics=await page.locator('#combat-stage').evaluate(e=>({scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,controls:[...e.querySelectorAll('.forest-exit,.auto-hud button,.auto-hud select,.duel-skills>button,.duel-commands>button,[data-duel="evade"]')].map(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:b.contains(hit)};})}));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(viewport.width+1);expect(metrics.scrollHeight).toBeLessThanOrEqual(viewport.height+1);expect(metrics.controls.every(r=>r.x>=0&&r.y>=0&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1&&r.width>=43&&r.height>=43&&r.hit)).toBe(true);
    await page.screenshot({path:`dist/screenshots/reef-${viewport.width}x${viewport.height}-warning-${version}.png`});expect(errors).toEqual([]);
  }finally{await context.close();}
});
test('new regional assets and warning work fully offline with no running reduced-motion effects',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await seed(page,reefFixture({boss:true,warning:true,motion:true}));await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    expect(await page.evaluate(async version=>{const c=await caches.open(`spirit-isles-v${version}`);return(await Promise.all(['reef-journey.css','js/reef-art.js','js/reef-encounter.js','js/reef-rewards.js'].map(f=>c.match('/'+f)))).every(Boolean);},version)).toBe(true);
    await context.setOffline(true);await page.reload();await open(page);expect(await page.locator('.forest-field').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
    await page.locator('[data-duel="evade"]').click();await page.clock.runFor(70);expect((await read(page)).expedition.battle.round).toBe(3);expect(errors).toEqual([]);
  }finally{await context.close();}
});
test('island and collection show Ngoc Trieu after three wins without a save migration',async({page})=>{
  const state=E.newGame();state.clears.reef=3;state.settings.motion=false;await seed(page,state);
  await expect(page.locator('.island-pet[data-id="axolotl"] .reef-tide-adornment')).toHaveCount(1);await expect(page.locator('.island-pet[data-id="mossfox"] .reef-tide-adornment')).toHaveCount(0);
  await page.screenshot({path:`dist/screenshots/reef-island-rewards-${version}.png`});expect((await read(page)).version).toBe(1);
});
