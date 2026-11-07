import fs from 'node:fs';
import {test,expect} from '@playwright/test';
import {E,turn} from '../squad-fixtures.mjs';
import {volcanoFixture} from '../volcano-fixtures.mjs';
import {autoOrder} from '../../web/js/auto-play.js';
import {combatScene} from '../../web/js/combat-stage.js';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const toggle=p=>p.locator('#combat-stage [data-duel="auto"]');
async function seed(p,s,{motion=false}={}){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));if(motion)await p.emulateMedia({reducedMotion:'no-preference'});
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('volcano-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('volcano-seeded','1');}Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function open(p,auto=false){await p.locator(`[data-action="${auto?'journey-auto':'journey-open'}"]`).click();await expect(p.locator('#combat-stage')).toHaveClass(/volcano-journey/);}

test('volcanic world and allied pets persist across routes and encounters',async({page})=>{
  const state=volcanoFixture({travel:true}),expected=structuredClone(state);await seed(page,state);await open(page);
  await expect(page.locator('.forest-head h2')).toHaveText('Đồi Than Hồng');await expect(page.locator('.forest-progress>span')).toHaveCount(5);
  await page.evaluate(()=>{window.volcanoWorld=document.querySelector('.forest-field');window.volcanoArt=document.querySelector('.volcano-backdrop');window.volcanoPet=document.querySelector('[data-friend="mossfox"]');});
  await expect(page.locator('[data-duel="route"][data-choice="1"]')).toContainText('Quái mạnh hơn 35%');await page.locator('[data-duel="route"][data-choice="1"]').click();E.chooseRoute(expected,1,()=>.5);expect((await read(page)).expedition).toEqual(expected.expedition);
  expect(await page.evaluate(()=>window.volcanoWorld===document.querySelector('.forest-field')&&window.volcanoArt===document.querySelector('.volcano-backdrop')&&window.volcanoPet===document.querySelector('[data-friend="mossfox"]'))).toBe(true);
  for(const kind of ['golem','wolf','bird'])await expect(page.locator(`.combat-enemy-team .volcano-${kind}`)).toHaveCount(1);
  await expect(page.locator('.combat-enemy-member[data-volcano-kind="wolf"]')).toHaveAttribute('aria-label',/Sói Than Hồng/);
});
test('volcanic intentions name the protector, back-row hunter and charging firebird',async({page})=>{
  await seed(page,volcanoFixture());await open(page);await page.locator('.forest-tactical>summary').click();
  await expect(page.locator('[data-intent-actor="enemy-0"]')).toContainText('Hộ Vệ Đá');await expect(page.locator('[data-intent-actor="enemy-0"]')).toContainText('che đồng đội');await expect(page.locator('[data-intent-actor="enemy-1"]')).toContainText('Săn hàng sau');await expect(page.locator('[data-intent-actor="enemy-2"]')).toContainText('Gom tàn lửa');
});
for(const [round,title]of [[1,'RỒNG SẮP DẬM ĐẤT'],[2,'DUNG NHAM SẮP PHUN'],[3,'RỒNG SẮP PHUN LỬA']])test(`manual volcanic dodge round ${round} agrees with engine and survives reload`,async({page})=>{
  const state=volcanoFixture({boss:true,round}),expected=structuredClone(state);turn(expected,'explore','evade');await seed(page,state);await open(page);
  await expect(page.locator('.forest-warning')).toContainText(title);await expect(page.locator('.volcano-safe-ground')).toBeVisible();await page.locator('[data-duel="evade"]').click();await page.clock.runFor(70);expect((await read(page)).expedition).toEqual(expected.expedition);
  await page.reload();await open(page);await expect(toggle(page)).toHaveAttribute('aria-checked','false');expect((await read(page)).expedition).toEqual(expected.expedition);
});
test('Hợp lực breaks visible armor and preserves the two-hit opening after reload',async({page})=>{
  const state=volcanoFixture({boss:true}),expected=structuredClone(state);turn(expected,'explore','skill');await seed(page,state);await open(page);await expect(page.locator('.volcano-armor')).toContainText('45/45');
  await page.locator('[data-move="skill"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(70);expect((await read(page)).expedition).toEqual(expected.expedition);
  await expect(page.locator('.volcano-armor')).toContainText('+60% · 2 ĐÒN');await expect(page.locator('.forest-field')).toHaveClass(/volcano-opening/);await page.reload();await open(page);await expect(page.locator('.volcano-armor')).toContainText('+60% · 2 ĐÒN');
});
test('AUTO first dodges and then resumes a legal action without consuming extra turns',async({page})=>{
  const state=volcanoFixture({boss:true,round:3}),expected=structuredClone(state),{reason,...order}=autoOrder(combatScene(expected,'explore'));turn(expected,'explore',order);
  await seed(page,state);await open(page);await toggle(page).click();await page.clock.runFor(901);expect((await read(page)).expedition).toEqual(expected.expedition);await toggle(page).click();await page.clock.runFor(60000);expect((await read(page)).expedition.battle.round).toBe(4);await toggle(page).click();await page.clock.runFor(901);expect((await read(page)).expedition.battle.round).toBe(5);
});
test('held mobile touch commits only one lava dodge even when the warning is replaced',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  try{const state=volcanoFixture({round:2,motion:true}),expected=structuredClone(state);turn(expected,'explore','evade');await seed(page,state,{motion:true});await open(page);
    const r=await page.locator('[data-duel="evade"]').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});expect((await read(page)).expedition).toEqual(expected.expedition);
    await page.clock.runFor(1600);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(5000);expect((await read(page)).expedition).toEqual(expected.expedition);
  }finally{await cdp.detach();await context.close();}
});
test('dodge moves pets onto the marked safe ground and lava VFX plays in the counter phase',async({page})=>{
  await seed(page,volcanoFixture({round:2,motion:true}),{motion:true});await open(page);await page.locator('[data-duel="evade"]').click();await page.clock.runFor(500);
  expect(await page.locator('.forest-style-evade').count()).toBe(3);await expect(page.locator('.forest-field')).toHaveAttribute('data-evaded','true');
  await page.clock.runFor(350);await expect(page.locator('.volcano-burst[data-kind="lava-eruption"]')).toBeVisible();await page.screenshot({path:`dist/screenshots/volcano-eruption-${version}.png`});
});
test('five-encounter volcanic AUTO trip retains its world, stops and pays only once',async({page})=>{
  await seed(page,volcanoFixture({travel:true,level:20}));await open(page,true);await page.evaluate(()=>window.volcanoWorld=document.querySelector('.forest-field'));await page.clock.runFor(210000);
  await expect(page.locator('.forest-result .duel-end h2')).toHaveText('Đã hoàn thành hành trình!');const finished=await read(page);expect(finished.clears.volcano).toBe(1);expect(finished.combatJournal.reports.length).toBe(5);expect(finished.expedition).toBeNull();expect(await page.evaluate(()=>window.volcanoWorld===document.querySelector('.forest-field'))).toBe(true);
  await page.clock.runFor(120000);expect((await read(page)).resources).toEqual(finished.resources);await expect(toggle(page)).toBeDisabled();
});
test('planner, Home and Back pause volcano AUTO without missed hazards or background catch-up',async({page})=>{
  await seed(page,volcanoFixture({boss:true,round:1}));await open(page,true);const before=(await read(page)).expedition;
  await page.getByRole('button',{name:'Mở chiến thuật AUTO',exact:true}).click();await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(before);await page.evaluate(()=>window.spiritBack());
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(before);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('spirit-resume'));});await page.clock.runFor(901);expect((await read(page)).expedition.battle.round).toBe(2);
  await page.evaluate(()=>window.spiritBack());await expect(toggle(page)).toHaveAttribute('aria-checked','false');const paused=(await read(page)).expedition;await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(paused);
});
for(const viewport of [{width:320,height:640},{width:390,height:844},{width:844,height:390},{width:1440,height:1000}])test(`volcano controls fit and receive touch at ${viewport.width}×${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await seed(page,volcanoFixture({boss:true,round:1}));await open(page);const metrics=await page.locator('#combat-stage').evaluate(e=>({scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,controls:[...e.querySelectorAll('.forest-exit,.auto-hud button,.auto-hud select,.duel-skills>button,.duel-commands>button,[data-duel="evade"]')].map(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:b.contains(hit)};})}));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(viewport.width+1);expect(metrics.scrollHeight).toBeLessThanOrEqual(viewport.height+1);expect(metrics.controls.every(r=>r.x>=0&&r.y>=0&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1&&r.width>=43&&r.height>=43&&r.hit)).toBe(true);expect(errors).toEqual([]);await page.screenshot({path:`dist/screenshots/volcano-${viewport.width}x${viewport.height}-warning-${version}.png`});
  }finally{await context.close();}
});
test('volcano assets and dodge work offline and obey system reduced motion',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await seed(page,volcanoFixture({round:2,motion:true}));await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    expect(await page.evaluate(async version=>{const c=await caches.open(`spirit-isles-v${version}`);return(await Promise.all(['volcano-journey.css','js/volcano-art.js','js/volcano-encounter.js','js/volcano-rewards.js'].map(f=>c.match('/'+f)))).every(Boolean);},version)).toBe(true);
    await context.setOffline(true);await page.reload();await open(page);expect(await page.locator('.forest-field').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);await page.locator('[data-duel="evade"]').click();await page.clock.runFor(70);expect((await read(page)).expedition.battle.round).toBe(3);expect(errors).toEqual([]);
  }finally{await context.close();}
});
test('island and collection show Fire cosmetic after three wins while other pets keep theirs',async({page})=>{
  const state=E.newGame();state.clears.volcano=3;state.settings.motion=false;await seed(page,state);await expect(page.locator('.island-pet[data-id="emberbird"] .volcano-ember-adornment')).toHaveCount(1);await expect(page.locator('.island-pet[data-id="axolotl"] .volcano-ember-adornment')).toHaveCount(0);expect((await read(page)).version).toBe(1);
});
