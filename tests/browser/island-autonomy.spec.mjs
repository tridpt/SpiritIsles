import {test,expect} from '@playwright/test';
import * as E from '../../web/js/engine.js';
import * as H from '../../web/js/habitat-engine.js';
import {placeItem} from '../../web/js/island-layout.js';
import {navigateGame,openGameMenu} from './navigation.mjs';
import {eventFixture} from '../ruins-route-fixtures.mjs';

const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const memory=p=>p.locator('#island-memory');
const camera=p=>memory(p).locator('button');
async function seed(p,s=E.newGame(),motion='no-preference'){
  await p.emulateMedia({reducedMotion:motion});await p.clock.install();
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('living-island-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('living-island-seed','1');}},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function advance(p,ms=10000){await p.mouse.move(1,1);await p.clock.runFor(ms);}
async function invite(p,id='mossfox'){
  await p.locator(`.island-pet[data-id="${id}"]`).click();await p.locator('[data-action="island-invite"]').click();await p.mouse.move(1,1);
}
const clear=p=>camera(p).evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});

test('a pet actually walks to saved furniture; watching alone never awards a memory',async({page})=>{
  const s=E.newGame();s.team=['mossfox'];s.islandLayout={version:1,nextId:1,placed:[]};const flower=placeItem(s,s.islandLayout,'flowers',3,1).item;
  await seed(page,s);const before=await read(page),pet=page.locator('.island-pet-0'),start=await pet.getAttribute('style');
  await advance(page,1200);await expect(pet).toHaveAttribute('data-behavior','walk');await expect(pet).toHaveAttribute('data-life-decoration',flower.id);
  expect(await pet.getAttribute('style')).not.toBe(start);await advance(page,14000);await expect(pet).toHaveAttribute('data-habitat-pose','sniff');await expect(memory(page)).toHaveAttribute('data-ready','true');
  expect(await clear(page)).toBe(true);expect((await read(page)).pets).toEqual(before.pets);expect((await read(page)).habitat).toEqual(before.habitat);expect((await read(page)).resources).toEqual(before.resources);
  const near=await page.evaluate(()=>{const pet=document.querySelector('.island-pet-0').getBoundingClientRect(),scene=document.querySelector('.island-scene').getBoundingClientRect();return {x:(pet.x+pet.width/2-scene.x)/scene.width*1000,y:(pet.y+pet.height*.86-scene.y)/scene.height*600,width:pet.width/scene.width*1000};});
  expect(Math.hypot(near.x-(488+(flower.x-flower.y)*36),near.y-(222+(flower.x+flower.y)*15))).toBeLessThan(near.width);
});

for(const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]])test(`record inside the island at ${width}px; controls stay clear and reward persists once`,async({page})=>{
  await page.setViewportSize({width,height});await seed(page);const before=await read(page);await advance(page);
  await expect(memory(page)).toBeVisible();await expect(camera(page)).toBeEnabled();expect(await clear(page)).toBe(true);
  const id=await camera(page).getAttribute('data-id'),moment=await camera(page).getAttribute('data-moment');
  expect(await page.locator('.game-hud button,.island-shortcut,.lobby-cozy-actions>button:visible').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}))).toBe(true);
  expect(await page.locator(`.island-pet[data-id="${id}"]`).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  await camera(page).click();await expect(camera(page)).toBeDisabled();await expect(memory(page)).toContainText('Đã ghi');
  const saved=await read(page);expect(saved.habitat.discovered[`${id}:${moment}`]).toBeTruthy();expect(saved.pets.find(p=>p.id===id).bond).toBe(before.pets.find(p=>p.id===id).bond+2);expect(saved.resources).toEqual(before.resources);
  await advance(page,2000);expect((await read(page)).habitat).toEqual(saved.habitat);await page.reload();expect((await read(page)).habitat).toEqual(saved.habitat);expect((await read(page)).pets).toEqual(saved.pets);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
});

test('observation and walking pause for Menu and background; opening care cancels the activity',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);await advance(page,1200);await expect(camera(page)).toBeDisabled();
  const pet=page.locator('.island-pet[data-life-moment]'),position=await pet.getAttribute('style');
  await openGameMenu(page);await expect(memory(page)).toBeHidden();await advance(page,15000);await page.keyboard.press('Escape');
  await expect(memory(page)).toBeVisible();await expect(camera(page)).toBeDisabled();expect(await pet.getAttribute('style')).toBe(position);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await expect(memory(page)).toBeHidden();await advance(page,12000);
  await page.evaluate(()=>window.dispatchEvent(new Event('spirit-resume')));await expect(camera(page)).toBeDisabled();await advance(page,2800);await expect(camera(page)).toBeEnabled();
  const id=await camera(page).getAttribute('data-id');await page.locator(`.island-pet[data-id="${id}"]`).click();await expect(memory(page)).toBeHidden();await expect(page.locator('#island-care')).toBeVisible();expect(Object.keys((await read(page)).habitat.discovered)).toHaveLength(0);
});

test('reduced motion retains an intentional visit and active observation without autonomous movement',async({page})=>{
  await page.setViewportSize({width:320,height:640});await seed(page,E.newGame(),'reduce');
  const before=await read(page),start=await page.locator('.island-pet-0').getAttribute('style');await advance(page,14000);expect(await page.locator('.island-pet-0').getAttribute('style')).toBe(start);await expect(memory(page)).toBeHidden();
  await invite(page);await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','still');await expect(camera(page)).toBeDisabled();
  const at=await page.locator('.island-pet-0').getAttribute('style');await advance(page,2700);await expect(camera(page)).toBeEnabled();expect(await page.locator('.island-pet-0').getAttribute('style')).toBe(at);expect(await clear(page)).toBe(true);
  const animations=await page.locator('.island-pet-0 *').evaluateAll(es=>es.map(e=>getComputedStyle(e).animationName));expect(animations.every(a=>a==='none')).toBe(true);
  await camera(page).click();expect((await read(page)).pets[0].bond).toBe(before.pets[0].bond+2);
});

test('an Android-sized viewport shares the hint slot and keeps the visiting pet centre tappable',async({page})=>{
  await page.setViewportSize({width:390,height:784});await seed(page);await advance(page);
  await expect(memory(page)).toBeVisible();await expect(camera(page)).toBeEnabled();expect(await clear(page)).toBe(true);
  const id=await camera(page).getAttribute('data-id'),pet=page.locator(`.island-pet[data-id="${id}"]`);
  expect(await pet.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  await pet.click();await expect(memory(page)).toBeHidden();await expect(page.locator('.lobby-habitat-hint')).toBeVisible();await expect(page.locator('#island-care')).toBeVisible();
});

test('replaying an existing island memory opens its exact journal entry without granting bond',async({page})=>{
  const s=E.newGame();s.islandLayout={version:1,nextId:1,placed:[]};placeItem(s,s.islandLayout,'flowers',7,4);H.discoverMoment(s,'mossfox','flower-sniff');
  await seed(page,s,'reduce');const before=await read(page);await invite(page);await advance(page,2700);await expect(camera(page)).toHaveAttribute('data-action','island-memory-open');await camera(page).click();
  await expect(page.locator('.habitat-card.featured')).toHaveAttribute('data-moment','flower-sniff');await expect(page.locator('#habitat-pet')).toHaveValue('mossfox');expect((await read(page)).pets).toEqual(before.pets);expect((await read(page)).habitat).toEqual(before.habitat);
});

test('missing furniture explains the next step, and saved editor changes enable a real island visit',async({page})=>{
  const s=E.newGame();s.islandLayout={version:1,nextId:1,placed:[]};await seed(page,s,'reduce');await invite(page);await expect(page.locator('.island-care-message')).toContainText('Chưa có chỗ trống');
  await page.locator('[data-action="island-care-close"]').click();await page.getByRole('button',{name:'Chỉnh đảo',exact:true}).click();await page.locator('[data-action="island-edit-catalog"]').click();await page.locator('[data-action="island-edit-choose"][data-id="flowers"]').click();
  const to=await page.locator('.editor-world').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+(488+(6-4)*36)*r.width/1000,y:r.y+(222+(6+4)*15)*r.width/1000};});await page.mouse.click(to.x,to.y);await page.locator('[data-action="island-edit-save"]').click();
  const saved=await read(page);expect(saved.islandLayout.placed[0]).toMatchObject({type:'flowers',x:6,y:4});await invite(page);await advance(page,2700);await expect(camera(page)).toBeEnabled();await camera(page).click();expect((await read(page)).habitat.discovered['mossfox:flower-sniff']).toBeTruthy();expect((await read(page)).resources).toEqual(s.resources);
});

for(const [type,id,pose] of [['pond','axolotl','bubbles'],['swing','mossfox','swing'],['sapling','mossfox','nap']])test(`a ${type} corner shows its distinct ${pose} behavior on the actual island`,async({page})=>{
  const s=E.newGame();s.team=[id];s.islandLayout={version:1,nextId:1,placed:[]};const item=placeItem(s,s.islandLayout,type,5,4).item;
  await seed(page,s,'reduce');await invite(page,id);await expect(page.locator('.island-pet')).toHaveAttribute('data-habitat-pose',pose);await expect(page.locator('.island-pet')).toHaveAttribute('data-life-decoration',item.id);await advance(page,2600);await expect(camera(page)).toBeEnabled();expect(await clear(page)).toBe(true);
});

test('resizing or removing a visited decoration cancels the old record button without touching memories',async({page})=>{
  await seed(page,E.newGame(),'reduce');await invite(page);await advance(page,2700);await expect(camera(page)).toBeEnabled();const before=await read(page);
  await page.setViewportSize({width:390,height:844});await expect(memory(page)).toBeHidden();expect((await read(page)).habitat).toEqual(before.habitat);
  await invite(page);await advance(page,2700);await page.getByRole('button',{name:'Chỉnh đảo',exact:true}).click();const piece=page.locator('[data-layout-id="base-flowers"]');await piece.focus();await page.keyboard.press('Enter');await page.locator('[data-action="island-edit-store"]').click();await page.locator('[data-action="island-edit-save"]').click();
  await expect(memory(page)).toBeHidden();expect((await read(page)).habitat).toEqual(before.habitat);expect((await read(page)).islandLayout.placed.some(p=>p.id==='base-flowers')).toBe(false);
});

test('offline recording survives reload and preserves an unrelated active expedition',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(page,eventFixture('chest'),'reduce');await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await navigateGame(page,'island');const before=await read(page);
    await context.setOffline(true);await invite(page);await advance(page,2700);await camera(page).click();const saved=await read(page);expect(saved.ruins).toEqual(before.ruins);expect(saved.resources).toEqual(before.resources);
    await page.reload();await navigateGame(page,'island');expect((await read(page)).habitat).toEqual(saved.habitat);expect((await read(page)).ruins).toEqual(before.ruins);await invite(page);await expect(memory(page)).toBeVisible();expect(errors).toEqual([]);
  }finally{await context.close();}
});
