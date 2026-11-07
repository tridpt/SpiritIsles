import {test,expect} from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import {project} from '../../web/js/island-layout.js';
import {eventFixture} from '../ruins-route-fixtures.mjs';
import {navigateGame,openSettings} from './navigation.mjs';
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(p,s=E.newGame()){
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('layout-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('layout-seeded','1');}},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function open(p){await p.getByRole('button',{name:'Chỉnh đảo',exact:true}).click();await expect(p.locator('.island-editor')).toHaveAttribute('data-zoom',/^\d+\.\d+$/);}
async function point(p,x,y){const b=await p.locator('.editor-world').boundingBox(),g=project(x,y);return {x:b.x+g.x*b.width/1000,y:b.y+g.y*b.width/1000};}
async function choose(p,type){await p.locator('[data-action="island-edit-catalog"]').click();await p.locator(`[data-action="island-edit-choose"][data-id="${type}"]`).click();}
const piece=(p,id)=>p.locator(`.island-layout-layer [data-layout-id="${id}"]`);
test('place, rotate, store, undo and redo are isolated until Save, then reload the identical island',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);const before=await read(page);await open(page);
  await choose(page,'bench');await page.locator('[data-action="island-edit-rotate"]').click();const to=await point(page,8,4.5);await page.mouse.click(to.x,to.y);
  await expect(page.locator('[data-editor-inspector]')).toContainText('Ghế nghỉ lá');await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');
  expect((await read(page)).islandLayout).toEqual(before.islandLayout);
  await page.locator('[data-action="island-edit-store"]').click();await expect(piece(page,'i1')).toHaveCount(0);
  await page.locator('[data-action="island-edit-undo"]').click();await expect(piece(page,'i1')).toHaveCount(1);
  await page.locator('[data-action="island-edit-redo"]').click();await expect(piece(page,'i1')).toHaveCount(0);
  await page.locator('[data-action="island-edit-undo"]').click();await page.locator('[data-action="island-edit-save"]').click();
  await expect(page.locator('.game-lobby')).toBeVisible();const saved=await read(page);expect(saved.islandLayout.placed.at(-1)).toEqual({id:'i1',type:'bench',x:8,y:4,rotation:1});expect(saved.resources).toEqual(before.resources);
  await page.reload();expect((await read(page)).islandLayout).toEqual(saved.islandLayout);await open(page);await expect(piece(page,'i1')).toHaveCount(1);
});
test('keyboard moves buildings; native Back and Menu warn before discarding, then keep saved layout',async({page})=>{
  await seed(page);const before=await read(page);await open(page);await piece(page,'base-nursery').focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await expect(page.locator('.island-discard')).toBeVisible();
  await page.getByRole('button',{name:'Chỉnh tiếp',exact:true}).click();await navigateGame(page,'pets');await expect(page.locator('.island-discard')).toBeVisible();
  await page.getByRole('button',{name:'Bỏ thay đổi',exact:true}).click();await expect(page.locator('.game-shell')).toHaveAttribute('data-screen','pets');expect((await read(page)).islandLayout).toEqual(before.islandLayout);
});
test('invalid drops and touch cancellation preserve the draft; real touch drag saves one move',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await c.newPage(),cdp=await c.newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(({x,y})=>({x,y}))});
  try{
    await seed(page);const before=await read(page);await open(page);
    const from=await point(page,7,4);
    await touch('touchStart',[from]);await touch('touchMove',[{x:from.x,y:from.y+25}]);await touch('touchCancel',[]);await expect(page.locator('.placement-ghost')).toHaveCount(0);await expect(page.locator('[data-editor-saved]')).toHaveText('Bố cục đã lưu');
    await touch('touchStart',[from]);await touch('touchMove',[{x:from.x-180,y:from.y+120}]);await touch('touchEnd',[]);await expect(page.locator('.editor-notice')).toHaveClass(/error/);await expect(page.locator('[data-editor-saved]')).toHaveText('Bố cục đã lưu');
    // One grid diagonal forward (x+1,y+1) moves down exactly 30 world pixels.
    await touch('touchStart',[from]);await touch('touchMove',[{x:from.x,y:from.y+20.4}]);await touch('touchEnd',[]);await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');
    await page.locator('[data-action="island-edit-save"]').click();const saved=await read(page),f=saved.islandLayout.placed.find(p=>p.id==='base-flowers');expect(f).toMatchObject({x:8,y:5});expect(saved.resources).toEqual(before.resources);
  }finally{await cdp.detach();await c.close();}
});
test('small screens, zoom and catalog retain reachable controls without page overflow',async({page})=>{
  await seed(page);
  for(const [width,height] of [[320,640],[390,844],[768,1024],[844,390],[1440,1000]]){
    await page.setViewportSize({width,height});await open(page);
    const controls=await page.locator('.editor-heading button,.editor-tools button,.editor-inspector button').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {inView:b.x>=0&&b.y>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,tappable:!!hit&&e.contains(hit),size:Math.min(b.width,b.height)};}));
    expect(controls.every(c=>c.inView&&c.tappable&&c.size>=44)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(height+1);
    const z=await page.locator('.island-editor').getAttribute('data-zoom');await page.locator('[data-action="island-edit-zoom-in"]').click();expect(await page.locator('.island-editor').getAttribute('data-zoom')).not.toBe(z);
    await page.locator('[data-action="island-edit-overview"]').click();await page.locator('[data-action="island-edit-catalog"]').click();await page.locator('[data-action="island-edit-category"][data-id="all"]').click();expect(await page.locator('.editor-catalog-item').count()).toBe(35);
    await page.locator('[data-action="island-edit-category"][data-id="garden"]').click();expect(await page.locator('.editor-catalog-item').count()).toBe(5);await page.keyboard.press('Escape');await page.locator('[data-action="island-edit-exit"]').click();
  }
});
test('pending selection cancels before exiting and page resume retains unsaved changes',async({page})=>{
  await seed(page);await open(page);await choose(page,'lantern');await page.evaluate(()=>window.spiritBack());await expect(page.locator('.island-editor')).toBeVisible();await expect(page.locator('[data-editor-inspector]')).toContainText('Một hòn đảo');
  await piece(page,'base-nursery').focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');await page.evaluate(()=>window.dispatchEvent(new Event('spirit-resume')));await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');await page.locator('[data-action="island-edit-save"]').click();
  expect((await read(page)).islandLayout.placed.find(p=>p.type==='nursery').x).toBe(2);
});
test('two fingers zoom the scene; dragging empty sky pans without changing placements',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await c.newPage(),cdp=await c.newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],id)=>({x,y,id}))});
  try{
    await seed(page);await open(page);const original=await page.locator('.editor-world').getAttribute('style');
    await touch('touchStart',[[120,250]]);await touch('touchMove',[[160,270]]);await touch('touchEnd',[]);expect(await page.locator('.editor-world').getAttribute('style')).not.toBe(original);
    const zoom=Number(await page.locator('.island-editor').getAttribute('data-zoom'));
    await touch('touchStart',[[100,330],[240,330]]);await touch('touchMove',[[70,330],[270,330]]);await touch('touchEnd',[]);
    expect(Number(await page.locator('.island-editor').getAttribute('data-zoom'))).toBeGreaterThan(zoom);await expect(page.locator('[data-editor-saved]')).toHaveText('Bố cục đã lưu');
    await page.locator('[data-action="island-edit-exit"]').click();await expect(page.locator('.island-discard')).toHaveCount(0);await expect(page.locator('.game-lobby')).toBeVisible();
  }finally{await cdp.detach();await c.close();}
});
test('offline saves and exported/imported layouts preserve the exact active route and resource state',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await c.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(page,eventFixture('chest'));await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await navigateGame(page,'island');const before=await read(page);await c.setOffline(true);
    await open(page);await choose(page,'lantern');const to=await point(page,8,6);await page.mouse.click(to.x,to.y);await page.locator('[data-action="island-edit-save"]').click();const saved=await read(page);expect(saved.ruins).toEqual(before.ruins);expect(saved.resources).toEqual(before.resources);
    await open(page);await piece(page,'base-nursery').focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');
    await openSettings(page);const downloadPromise=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const download=await downloadPromise;const path=await download.path();await page.locator('#import-file').setInputFiles(path);await page.getByRole('button',{name:'Khôi phục bản lưu',exact:true}).click();expect((await read(page)).islandLayout).toEqual(saved.islandLayout);
    await navigateGame(page,'pets');await expect(page.locator('.game-shell')).toHaveAttribute('data-screen','pets');await expect(page.locator('.island-discard')).toHaveCount(0);
    await page.reload();await navigateGame(page,'island');expect((await read(page)).islandLayout).toEqual(saved.islandLayout);expect((await read(page)).ruins).toEqual(before.ruins);expect(errors).toEqual([]);
  }finally{await c.close();}
});
