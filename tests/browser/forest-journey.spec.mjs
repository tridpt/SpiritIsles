import fs from 'node:fs';
import {test,expect} from '@playwright/test';
import {E,turn,unitHp} from '../squad-fixtures.mjs';
import {forestFixture} from '../forest-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const toggle=p=>p.locator('#combat-stage [data-duel="auto"]');
async function seed(p,s,{motion=false}={}){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
  if(motion)await p.emulateMedia({reducedMotion:'no-preference'});
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('forest-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('forest-seeded','1');}Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function open(p,auto=false){await p.locator(`[data-action="${auto?'journey-auto':'journey-open'}"]`).click();await expect(p.locator('.forest-layout')).toBeVisible();}

test('the world and allied creatures stay mounted when walking becomes a real encounter',async({page})=>{
  const state=forestFixture({travel:true}),before=structuredClone(state);await seed(page,state);await open(page);
  await page.evaluate(()=>{window.forestWorld=document.querySelector('.forest-field');window.forestArt=document.querySelector('.forest-backdrop');window.forestFriend=document.querySelector('[data-friend="mossfox"]');});
  await page.locator('[data-duel="route"][data-choice="0"]').click();E.chooseRoute(before,0,()=>.5);
  expect((await read(page)).expedition).toEqual(before.expedition);await expect(page.locator('.forest-field')).toHaveAttribute('data-phase','battle');
  expect(await page.evaluate(()=>window.forestWorld===document.querySelector('.forest-field')&&window.forestArt===document.querySelector('.forest-backdrop')&&window.forestFriend===document.querySelector('[data-friend="mossfox"]'))).toBe(true);
  await expect(page.locator('.forest-field .combat-enemy-member')).toHaveCount(3);
});
test('one AUTO root dodge matches a real engine turn and keeps the same scene',async({page})=>{
  const state=forestFixture({boss:true,warning:true}),expected=structuredClone(state);const order={move:'evade',stance:'balanced',target:'body',foe:'enemy-0'};turn(expected,'explore',order);
  await seed(page,state);await open(page);await expect(page.locator('.forest-warning')).toContainText('RỄ SẮP TRỒI');await toggle(page).click();await page.clock.runFor(901);
  expect((await read(page)).expedition).toEqual(expected.expedition);await toggle(page).click();await page.clock.runFor(5000);
  await expect(toggle(page)).toHaveAttribute('aria-checked','false');expect((await read(page)).expedition.battle.round).toBe(3);await expect(page.locator('[data-duel="evade"]')).toHaveCount(0);
});
test('a held native-style touch dodges once and does not repeat when the button is replaced',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'}),page=await context.newPage(),cdp=await context.newCDPSession(page);
  try{
    const state=forestFixture({boss:true,warning:true,motion:true}),expected=structuredClone(state);turn(expected,'explore','evade');await seed(page,state,{motion:true});await open(page);
    const r=await page.locator('[data-duel="evade"]').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});
    expect((await read(page)).expedition).toEqual(expected.expedition);await expect(page.locator('.forest-field')).toHaveAttribute('data-evaded','true');
    await page.clock.runFor(1600);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(5000);expect((await read(page)).expedition).toEqual(expected.expedition);
  }finally{await cdp.detach();await context.close();}
});
test('dodging manually while AUTO is enabled spends only the chosen turn before the next schedule',async({page})=>{
  await seed(page,forestFixture({boss:true,warning:true}));await open(page);await toggle(page).click();await page.locator('[data-duel="evade"]').click();await page.clock.runFor(70);
  expect((await read(page)).expedition.battle.round).toBe(3);await toggle(page).click();await page.clock.runFor(10000);expect((await read(page)).expedition.battle.round).toBe(3);
});
test('melee, ranged and healing motions use the actual actors and recipients',async({page})=>{
  const state=forestFixture({motion:true});await seed(page,state,{motion:true});await open(page);await page.locator('[data-move="attack"]').click();await page.locator('[data-duel="skip"]').click();
  await expect(page.locator('[data-friend="mossfox"]')).toHaveAttribute('data-forest-motion','melee');await expect(page.locator('[data-friend="emberbird"]')).toHaveAttribute('data-forest-motion','ranged');
  await page.clock.runFor(1400);await page.locator('[data-move="pet:axolotl"]').click();await page.locator('[data-duel="skip"]').click();await expect(page.locator('[data-friend="axolotl"]')).toHaveAttribute('data-forest-motion','heal');
  const healed=(await read(page)).combatJournal.active;expect(healed.members.find(m=>m.id==='axolotl').casts).toBe(1);
});
test('winning drops actual loot, keeps it in the trip bag and returns to walking in the same world',async({page})=>{
  const state=forestFixture({motion:true});unitHp(state,'explore','enemies',[1,1,1]);const resources={...state.resources};
  await seed(page,state,{motion:true});await open(page);await page.evaluate(()=>window.forestWorld=document.querySelector('.forest-field'));
  await page.locator('[data-move="attack"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(800);
  await expect(page.locator('.forest-loot-particle[data-resource="gold"]')).toHaveAttribute('data-amount','15');await expect(page.locator('.forest-loot-particle[data-resource="food"]')).toHaveAttribute('data-amount','5');
  expect((await read(page)).resources).toEqual(resources);await page.clock.runFor(400);await expect(page.locator('.forest-field')).toHaveAttribute('data-phase','travel');
  expect(await page.evaluate(()=>window.forestWorld===document.querySelector('.forest-field'))).toBe(true);await expect(page.locator('.forest-bag summary b')).toHaveText('70');expect((await read(page)).expedition.stage).toBe(1);
});
test('a whole AUTO trip archives real reports and pays the bank only once',async({page})=>{
  const state=forestFixture({travel:true,level:20});await seed(page,state);await open(page,true);await page.clock.runFor(120000);
  await expect(page.locator('.forest-result .duel-end h2')).toHaveText('Đã hoàn thành hành trình!');await expect(page.locator('.auto-result-loot')).toBeVisible();
  const finished=await read(page);expect(finished.expedition).toBeNull();expect(finished.stats.expeditions).toBe(state.stats.expeditions+1);expect(finished.combatJournal.reports.length).toBe(4);
  await page.clock.runFor(120000);expect((await read(page)).resources).toEqual(finished.resources);await expect(toggle(page)).toHaveAttribute('aria-checked','false');await expect(toggle(page)).toBeDisabled();
});
test('planner, hidden page and Back suspend the forest without skipped turns or catch-up',async({page})=>{
  const state=forestFixture({boss:true,warning:true});await seed(page,state);await open(page,true);const before=(await read(page)).expedition;
  await page.getByRole('button',{name:'Mở chiến thuật AUTO',exact:true}).click();await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(before);
  await page.evaluate(()=>window.spiritBack());await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(before);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('spirit-resume'));});await page.clock.runFor(899);expect((await read(page)).expedition).toEqual(before);await page.clock.runFor(2);expect((await read(page)).expedition.battle.round).toBe(3);
  await page.evaluate(()=>window.spiritBack());await expect(toggle(page)).toHaveAttribute('aria-checked','false');const stopped=(await read(page)).expedition;await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(stopped);
});
test('reload preserves the active squad and warning, with AUTO always off',async({page})=>{
  const state=forestFixture({boss:true,warning:true});await seed(page,state);await open(page);await toggle(page).click();await toggle(page).click();const before=(await read(page)).expedition;
  await page.reload();await open(page);await expect(toggle(page)).toHaveAttribute('aria-checked','false');await expect(page.locator('.forest-warning')).toBeVisible();await page.clock.runFor(60000);expect((await read(page)).expedition).toEqual(before);
});
test('legacy shared-health saves render both teams and keep their existing format',async({page})=>{
  const state=forestFixture({boss:true,warning:true});delete state.expedition.squad;await seed(page,state);await open(page);
  await expect(page.locator('.forest-field .duel-party>.squad-unit')).toHaveCount(3);await expect(page.locator('.forest-field .combat-enemy-member')).toHaveCount(1);
  await page.locator('[data-duel="evade"]').click();await page.clock.runFor(70);expect((await read(page)).expedition.squad).toBeUndefined();expect((await read(page)).expedition.battle.round).toBe(3);
});
for(const viewport of [{width:320,height:640},{width:390,height:844},{width:844,height:390}])test(`forest controls fit the game frame at ${viewport.width}×${viewport.height}`,async({browser})=>{
  const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage();try{
    await seed(page,forestFixture({boss:true,warning:true}));await open(page);
    const metrics=await page.locator('#combat-stage').evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight,controls:[...e.querySelectorAll('.forest-exit,.auto-hud button,.auto-hud select,.duel-skills>button,.duel-commands>button,[data-duel="evade"]')].map(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,hit:b.contains(hit)};})}));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(viewport.width+1);expect(metrics.scrollHeight).toBeLessThanOrEqual(viewport.height+1);expect(metrics.controls.every(r=>r.x>=0&&r.y>=0&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1&&r.width>=43&&r.height>=43&&r.hit)).toBe(true);
    await page.locator('.forest-tactical>summary').click();await expect(page.locator('[data-duel="timing"]')).toBeVisible();await page.locator('[data-duel="stance"][data-stance="guarded"]').click();await expect(page.locator('[data-duel="stance"][data-stance="guarded"]')).toHaveAttribute('aria-pressed','true');
  }finally{await context.close();}
});
test('new forest assets work offline and both reduced-motion settings suppress movement',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(page,forestFixture({travel:true,motion:true}));await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    expect(await page.evaluate(async version=>{const cache=await caches.open(`spirit-isles-v${version}`);return (await Promise.all(['forest-journey.css','js/forest-journey.js','js/forest-art.js','js/forest-encounter.js'].map(f=>cache.match('/'+f)))).every(Boolean);},version)).toBe(true);
    await context.setOffline(true);await page.reload();await open(page,true);expect(await page.locator('.forest-field').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
    await page.clock.runFor(2301);await expect(page.locator('.forest-field')).toHaveAttribute('data-phase','battle');await toggle(page).click();expect((await read(page)).expedition.battle.round).toBe(0);expect(errors).toEqual([]);
  }finally{await context.close();}
});
