import {test,expect} from '@playwright/test';
import * as E from '../../web/js/engine.js';
import * as H from '../../web/js/habitat-engine.js';
import {picnicFixture} from '../picnic-fixtures.mjs';
import {eventFixture} from '../ruins-route-fixtures.mjs';
import {navigateGame,openGameMenu,openSettings} from './navigation.mjs';

const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const camera=p=>p.locator('#island-memory button');
const actor=(p,id)=>p.locator(`.island-pet[data-id="${id}"]`);
async function seed(p,s=picnicFixture(),motion='no-preference'){
  E.validateSave(E.serialize(s));
  await p.emulateMedia({reducedMotion:motion});await p.clock.install();
  await p.clock.pauseAt(Date.now()+1000);
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('island-friends-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('island-friends-seed','1');}},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function advance(p,ms){await p.mouse.move(1,1);await p.clock.runFor(ms);}
async function invite(p,id='mossfox'){
  await actor(p,id).click();await p.locator('[data-action="island-invite-friend"]').click();await p.mouse.move(1,1);
}
const tappable=e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));};

test('two visible friends walk in sequence and observation starts only after both reach the picnic',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);const before=await read(page);
  const start=await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform));
  await invite(page);await expect(page.locator('.island-pet[data-life-partner]')).toHaveCount(2);
  await expect(page.locator('.island-pet[data-life-stage="walking"]')).toHaveCount(1);
  await expect(page.locator('#island-memory')).toBeHidden();
  let sawWaiting=false,sawSecond=false;
  const first=await page.locator('.island-pet[data-life-stage="walking"]').getAttribute('data-id');
  for(let n=0;n<600;n++){
    await advance(page,40);
    if(await page.locator('.island-pet[data-life-stage="waiting"]').count())sawWaiting=true;
    const walking=page.locator('.island-pet[data-life-stage="walking"]');
    if(await walking.count()){
      if(await walking.getAttribute('data-id')!==first)sawSecond=true;
      await expect(page.locator('#island-memory')).toBeHidden();
    }else break;
  }
  expect(sawWaiting).toBe(true);expect(sawSecond).toBe(true);
  await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2);
  await expect(camera(page)).toBeDisabled();await expect(camera(page)).toHaveAttribute('data-partner','emberbird');
  expect(await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform))).not.toEqual(start);
  await advance(page,2700);await expect(camera(page)).toBeEnabled();await expect(camera(page)).toHaveAccessibleName(/Cáo Mầm & Chim Than Hồng/);
  expect((await read(page)).pets).toEqual(before.pets);expect((await read(page)).habitat).toEqual(before.habitat);
  const thoughts=await page.locator('.island-pet[data-life-partner] .pet-thought').allTextContents();
  await advance(page,1600);expect(await page.locator('.island-pet[data-life-partner] .pet-thought').allTextContents()).not.toEqual(thoughts);
});

for(const [width,height] of [[320,640],[390,844],[390,784],[768,1024],[1440,1000]])test(`picnic, both pets and the camera are tappable at ${width}×${height}; one explicit record survives reload`,async({page})=>{
  await page.setViewportSize({width,height});await seed(page,picnicFixture(),'reduce');const before=await read(page);
  await invite(page);await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2);
  await expect(page.locator('.island-picnic')).toBeVisible();await expect(camera(page)).toBeDisabled();
  const positions=await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform));
  await advance(page,2700);await expect(camera(page)).toBeEnabled();
  for(const id of ['mossfox','emberbird'])expect(await actor(page,id).evaluate(tappable)).toBe(true);
  expect(await camera(page).evaluate(tappable)).toBe(true);
  expect(await camera(page).evaluate(button=>{
    const c=button.getBoundingClientRect(),hits=r=>c.x<r.right&&c.right>r.x&&c.y<r.bottom&&c.bottom>r.y;
    return [...document.querySelectorAll('.island-pet[data-life-partner]')].every(p=>!hits(p.getBoundingClientRect())&&!hits(p.querySelector('.pet-thought').getBoundingClientRect()));
  })).toBe(true);
  expect(await page.locator('.game-hud button,.island-shortcut,.lobby-cozy-actions>button:visible').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}))).toBe(true);
  expect(await page.locator('.island-pet,.island-picnic').evaluateAll(es=>es.every(e=>[e,...e.querySelectorAll('*')].every(a=>getComputedStyle(a).animationName==='none')))).toBe(true);
  expect(await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform))).toEqual(positions);
  await camera(page).click();await expect(camera(page)).toBeDisabled();
  const saved=await read(page);expect(saved.habitat.discovered['mossfox:picnic-friends'].partner).toBe('emberbird');
  expect(saved.pets[0].bond).toBe(before.pets[0].bond+2);expect(saved.pets.slice(1)).toEqual(before.pets.slice(1));expect(saved.resources).toEqual(before.resources);
  await advance(page,1500);expect((await read(page)).habitat).toEqual(saved.habitat);
  await page.reload();expect((await read(page)).habitat).toEqual(saved.habitat);expect((await read(page)).pets).toEqual(saved.pets);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
  await actor(page,'emberbird').click();await expect(page.locator('#island-care')).toBeVisible();
  expect(await page.locator('[data-action="island-invite-friend"]').evaluate(tappable)).toBe(true);
});

test('autonomous visits prefer a new picnic and never summon an owned pet outside the visible team',async({page})=>{
  await seed(page);await advance(page,22000);
  await expect(camera(page)).toHaveAttribute('data-moment','picnic-friends');await expect(camera(page)).toHaveAttribute('data-partner','emberbird');
  await expect(page.locator('.island-pet[data-life-partner]')).toHaveCount(2);
  expect((await read(page)).habitat.discovered).toEqual({});
  const next=picnicFixture(E.newGame(),['mossfox']);await openSettings(page);
  await page.locator('#import-file').setInputFiles({name:'solo.json',mimeType:'application/json',buffer:Buffer.from(E.serialize(next))});await page.getByRole('button',{name:'Khôi phục bản lưu',exact:true}).click();
  await invite(page);await expect(page.locator('.island-care-message')).toContainText('Đưa một bạn khác hệ');
  await expect(page.locator('.island-pet[data-life-partner]')).toHaveCount(0);
});

test('two friends can approach the picnic around a third teammate without sharing its hit target',async({page})=>{
  await page.setViewportSize({width:390,height:784});await seed(page,picnicFixture(E.newGame(),['mossfox','axolotl','emberbird']));await invite(page);
  await expect(page.locator('.island-pet[data-life-partner]')).toHaveCount(2);
  for(let n=0;n<100;n++){
    const clear=await page.locator('.island-pet').evaluateAll(es=>{
      const cores=es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width*.2,y:r.y+r.height*.2,w:r.width*.6,h:r.height*.65};});
      return cores.every((a,i)=>cores.every((b,j)=>i===j||a.x>=b.x+b.w||a.x+a.w<=b.x||a.y>=b.y+b.h||a.y+a.h<=b.y));
    });expect(clear).toBe(true);
    if(!await page.locator('.island-pet[data-life-stage="walking"]').count())break;
    await advance(page,240);
  }
  await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2);
  await advance(page,2700);await expect(camera(page)).toBeEnabled();
  for(const pet of await page.locator('.island-pet[data-life-partner]').all())expect(await pet.evaluate(tappable)).toBe(true);
});

test('menu and background preserve both paths and pause the shared active observation',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);await invite(page);await advance(page,300);
  await openGameMenu(page);const moving=await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform));
  const walkingId=await page.locator('.island-pet[data-life-stage="walking"]').getAttribute('data-id');
  await advance(page,15000);expect(await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform))).toEqual(moving);
  await page.keyboard.press('Escape');await expect(page.locator('.island-pet[data-life-stage="walking"]')).toHaveAttribute('data-id',walkingId);
  await advance(page,18000);await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2);
  await actor(page,'mossfox').click();await invite(page); // start a fresh observation
  for(let n=0;n<100&&await page.locator('.island-pet[data-life-stage="walking"]').count();n++)await advance(page,240);
  await expect(camera(page)).toBeDisabled();
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));const poses=await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform));await advance(page,12000);
  await page.evaluate(()=>window.dispatchEvent(new Event('spirit-resume')));await expect(camera(page)).toBeDisabled();
  expect(await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.style.transform))).toEqual(poses);
  await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2);
  await advance(page,2700);await expect(camera(page)).toBeEnabled();
  await actor(page,'emberbird').click();await expect(page.locator('#island-memory')).toBeHidden();await expect(page.locator('.island-picnic')).toHaveCount(0);await expect(page.locator('.island-pet[data-life-partner]')).toHaveCount(0);
  expect((await read(page)).habitat.discovered).toEqual({});
});

test('resizing and opening the editor cancel both participants and cannot record a stale picnic',async({page})=>{
  await seed(page,picnicFixture(),'reduce');await invite(page);await advance(page,2700);await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#island-memory')).toBeHidden();await expect(page.locator('.island-pet[data-life-partner]')).toHaveCount(0);
  await invite(page);await advance(page,2700);await page.getByRole('button',{name:'Chỉnh đảo',exact:true}).click();
  await expect(page.locator('.island-picnic')).toHaveCount(0);expect((await read(page)).habitat.discovered).toEqual({});
});

test('a recorded picnic replays with the saved companion, even when another friend comes first in the collection',async({page})=>{
  const s=picnicFixture();H.discoverMoment(s,'mossfox','picnic-friends',Date.now(),s.islandLayout.placed[0].id,'emberbird');
  await seed(page,s,'reduce');const before=await read(page);await invite(page);await advance(page,2700);await camera(page).click();
  await expect(page.locator('.habitat-card.featured')).toHaveAttribute('data-moment','picnic-friends');
  await page.locator('.habitat-card.featured [data-action="habitat-play"]').click();
  await expect(page.locator('.habitat-scene-caption')).toHaveText('Cáo Mầm & Chim Than Hồng');
  await advance(page,2800);await expect(page.locator('[data-action="habitat-scene-record"]')).toBeDisabled();
  expect((await read(page)).habitat).toEqual(before.habitat);expect((await read(page)).pets).toEqual(before.pets);
});

test('offline shared memory preserves a pending route, rewards and the actual partner after export/import',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:784},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    const fixture=eventFixture('chest');picnicFixture(fixture,fixture.team);
    await seed(page,fixture,'reduce');await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    await navigateGame(page,'island');const before=await read(page);await context.setOffline(true);await invite(page);await advance(page,2700);await camera(page).click();
    const saved=await read(page);expect(saved.habitat.discovered['mossfox:picnic-friends'].partner).toBe('axolotl');expect(saved.ruins).toEqual(before.ruins);expect(saved.resources).toEqual(before.resources);expect(saved.team).toEqual(before.team);
    await openSettings(page);const downloading=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const file=await(await downloading).path();await page.locator('#import-file').setInputFiles(file);await page.getByRole('button',{name:'Khôi phục bản lưu',exact:true}).click();
    await page.reload();await navigateGame(page,'island');expect((await read(page)).habitat).toEqual(saved.habitat);expect((await read(page)).ruins).toEqual(before.ruins);expect(errors).toEqual([]);
  }finally{await context.close();}
});
