import {test,expect} from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import * as H from '../../web/js/habitat-engine.js';
import {HABITAT_MOMENTS} from '../../web/js/habitat-data.js';
import {placeItem,project} from '../../web/js/island-layout.js';
import {eventFixture} from '../ruins-route-fixtures.mjs';
import {navigateGame,openGameMenu,openSettings} from './navigation.mjs';

const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(p,s=E.newGame()){
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('habitat-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('habitat-seeded','1');}},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function book(p){await navigateGame(p,'pets');await p.locator('.habitat-entry').click();await expect(p.locator('#habitat-pet')).toBeVisible();}
const card=(p,id)=>p.locator(`.habitat-card[data-moment="${id}"]`);
async function play(p,id){await card(p,id).locator('[data-action="habitat-play"]').click();await expect(p.locator('.habitat-scene')).toBeVisible();}
async function record(p){const b=p.locator('[data-action="habitat-scene-record"]');await expect(b).toBeEnabled({timeout:8000});await b.click();await expect(p.locator('[data-habitat-scene-status]')).toContainText('Đã ghi kỷ niệm mới');}
function prepared(id){
  const s=E.newGame();s.level=3;s.ruins.best=5;s.ruins.clears=5;s.ruins.bosses=1;
  s.pets.forEach(p=>p.bond=50);s.pets.push({...E.makePet('phoenix'),bond:50});
  s.islandLayout={version:1,nextId:1,placed:[]};const m=HABITAT_MOMENTS.find(m=>m.id===id);
  placeItem(s,s.islandLayout,m.decor[0],0,0);if(m.near)placeItem(s,s.islandLayout,m.near[0],2,0);return s;
}

test('care leads to species memories; recording, filtering, replay and reload award bond exactly once',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);const before=await read(page);
  await page.locator('.island-pet[data-id="mossfox"]').click();await page.getByRole('button',{name:'Rủ Cáo Mầm chơi với đồ trang trí',exact:true}).click();
  await expect(page.locator('#habitat-pet')).toHaveValue('mossfox');await expect(card(page,'shade-nap')).toHaveClass(/ready/);
  await play(page,'shade-nap');await expect(page.locator('[data-action="habitat-scene-record"]')).toBeDisabled();await record(page);
  const saved=await read(page);expect(saved.pets[0].bond).toBe(2);expect(saved.resources).toEqual(before.resources);expect(saved.team).toEqual(before.team);
  await page.locator('[data-action="habitat-scene-book"]').click();await page.locator('[data-action="habitat-filter"][data-id="found"]').click();await expect(page.locator('.habitat-card')).toHaveCount(1);
  await play(page,'shade-nap');await expect(page.locator('[data-action="habitat-scene-record"]')).toBeDisabled();await page.waitForTimeout(300);expect((await read(page)).habitat).toEqual(saved.habitat);
  await page.reload();await book(page);await page.locator('[data-action="habitat-filter"][data-id="found"]').click();await expect(card(page,'shade-nap')).toContainText('ĐÃ GHI NHỚ');expect((await read(page)).pets[0].bond).toBe(2);
  await page.locator('#habitat-pet').selectOption('axolotl');await expect(page.locator('.habitat-empty')).toBeVisible();await page.locator('[data-action="habitat-filter"][data-id="new"]').click();await expect(card(page,'pond-bubbles')).toContainText('Đặt Hồ sen nhỏ');
});

test('editor shows behavior hints; committing an actual corner unlocks play without spending resources',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);await book(page);await expect(card(page,'swing-play').locator('[data-action="habitat-play"]')).toBeDisabled();const before=await read(page);
  await page.getByRole('button',{name:'Chỉnh đảo',exact:true}).first().click();await page.locator('[data-action="island-edit-catalog"]').click();
  await page.locator('[data-action="island-edit-category"][data-id="cozy"]').click();await expect(page.locator('[data-action="island-edit-choose"][data-id="swing"]')).toContainText('Chuyến bay xích đu');
  await page.locator('[data-action="island-edit-choose"][data-id="swing"]').click();const box=await page.locator('.editor-world').boundingBox(),p=project(6.5,5);await page.mouse.click(box.x+p.x*box.width/1000,box.y+p.y*box.width/1000);
  await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');expect((await read(page)).islandLayout).toEqual(before.islandLayout);
  await page.locator('[data-action="island-edit-save"]').click();await book(page);await play(page,'swing-play');await expect(page.locator('.habitat-stage')).toHaveAttribute('data-pose','swing');await record(page);expect((await read(page)).resources).toEqual(before.resources);
});

test('Menu and background pause observation; Back cancels before leaving and an unrecorded scene survives only normal resume',async({page})=>{
  await seed(page);await book(page);await play(page,'shade-nap');await page.waitForTimeout(150);await openGameMenu(page);
  const progress=()=>page.locator('[data-habitat-progress]').getAttribute('style'),held=await progress();await page.waitForTimeout(500);expect(await progress()).toBe(held);
  expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await expect(page.locator('.habitat-scene')).toBeVisible();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await progress();await page.waitForTimeout(500);expect(await progress()).toBe(hidden);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('.habitat-scene')).toBeVisible();await expect(page.locator('[data-action="habitat-scene-record"]')).toBeDisabled();
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));const paused=await progress();await page.waitForTimeout(300);expect(await progress()).toBe(paused);
  await page.evaluate(()=>window.dispatchEvent(new Event('spirit-resume')));await expect(page.locator('.habitat-scene')).toBeVisible();
  expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await expect(page.locator('.habitat-scene')).toHaveCount(0);await expect(page.locator('.game-lobby')).toBeVisible();expect(Object.keys((await read(page)).habitat.discovered)).toHaveLength(0);
  await book(page);await play(page,'shade-nap');await page.reload();await expect(page.locator('.habitat-scene')).toHaveCount(0);expect(Object.keys((await read(page)).habitat.discovered)).toHaveLength(0);
});

test('duo play includes a bonded companion outside the team; legendary aurora uses the owned SSR pet',async({page})=>{
  await page.setViewportSize({width:390,height:844});const s=prepared('picnic-friends');s.team=['emberbird'];await seed(page,s);await book(page);await page.locator('#habitat-pet').selectOption('mossfox');
  await play(page,'picnic-friends');await expect(page.locator('.habitat-scene-partner')).toBeVisible();await expect(page.locator('.habitat-scene-caption')).toContainText('Cáo Mầm & Kỳ Nhông Mây');await record(page);expect((await read(page)).team).toEqual(['emberbird']);
  await openSettings(page);const next=prepared('legend-aurora');await page.locator('#import-file').setInputFiles({name:'aurora.json',mimeType:'application/json',buffer:Buffer.from(E.serialize(next))});await page.getByRole('button',{name:'Khôi phục bản lưu',exact:true}).click();
  await book(page);await page.locator('#habitat-pet').selectOption('phoenix');await play(page,'legend-aurora');await expect(page.locator('.habitat-stage')).toHaveAttribute('data-pose','aurora');await expect(page.locator('.habitat-scene-caption')).toContainText('Phượng Bình Minh');await record(page);expect((await read(page)).habitat.discovered['phoenix:legend-aurora']).toBeTruthy();expect((await read(page)).team).toEqual(next.team);
});

test('milestone rewards have their own presentation and cannot be reclaimed after reopening',async({page})=>{
  const s=E.newGame();for(const p of s.pets)H.discoverMoment(s,p.id,'shade-nap');H.discoverMoment(s,'mossfox','flower-sniff');placeItem(s,s.islandLayout,'swing',6,5);H.discoverMoment(s,'mossfox','swing-play');
  await seed(page,s);await book(page);await page.locator('[data-action="habitat-claim"][data-id="first-five"]').click();await expect(page.locator('#game-dialog')).toContainText('Những thói quen bé xíu');await expect(page.locator('#game-dialog')).not.toContainText('50%');
  const claimed=await read(page);expect(claimed.resources.tickets).toBe(s.resources.tickets+1);expect(claimed.resources.food).toBe(s.resources.food+60);
  await page.getByRole('button',{name:'Tiếp tục khám phá',exact:true}).click();await expect(page.locator('[data-action="habitat-claim"][data-id="first-five"]')).toBeDisabled();await page.reload();await book(page);await expect(page.locator('[data-action="habitat-claim"][data-id="first-five"]')).toBeDisabled();expect((await read(page)).resources).toEqual(claimed.resources);
});

test('book, care and scene controls fit small phones and stay usable with reduced motion',async({page})=>{
  await seed(page);
  for(const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]]){
    await page.setViewportSize({width,height});await book(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await play(page,'shade-nap');expect(await page.locator('.habitat-scene button').evaluateAll(es=>es.every(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.width>=44&&b.height>=44&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight&&e.contains(hit);}))).toBe(true);
    expect(await page.locator('.habitat-scene-pet').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');await page.locator('[data-action="habitat-scene-close"]').click();
  }
});

test('offline record, export/import and reload preserve memories and the exact pending route',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    const s=eventFixture('chest');s.pets[0].bond=98;await seed(page,s);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    const cache=await page.evaluate(async()=>{const k=(await caches.keys()).find(k=>k.startsWith('spirit-isles-'));return (await (await caches.open(k)).keys()).map(r=>new URL(r.url).pathname);});
    for(const asset of ['habitat.css','js/habitat-data.js','js/habitat-state.js','js/habitat-engine.js','js/habitat-ui.js','js/habitat-scene.js'])expect(cache).toContain('/'+asset);
    await context.setOffline(true);await book(page);await play(page,'shade-nap');await record(page);const saved=await read(page);expect(saved.pets[0].bond).toBe(100);expect(saved.ruins).toEqual(s.ruins);expect(saved.resources).toEqual(s.resources);
    await openSettings(page);const downloading=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const file=await(await downloading).path();await page.locator('#import-file').setInputFiles(file);await page.getByRole('button',{name:'Khôi phục bản lưu',exact:true}).click();
    await page.reload();expect((await read(page)).habitat).toEqual(saved.habitat);expect((await read(page)).ruins).toEqual(s.ruins);await book(page);await page.locator('[data-action="habitat-filter"][data-id="found"]').click();await play(page,'shade-nap');await expect(page.locator('[data-action="habitat-scene-record"]')).toBeDisabled();expect(errors).toEqual([]);
  }finally{await context.close();}
});
