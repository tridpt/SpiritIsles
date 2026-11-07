import { test, expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { eventFixture } from '../ruins-route-fixtures.mjs';
import { navigateGame, openGameMenu, openSettings } from './navigation.mjs';

const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(page,state=E.newGame()) {
  await page.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('life-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('life-seed','1');}},{key:E.SAVE_KEY,raw:E.serialize(state)});
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
const choose=(page,id='mossfox')=>page.locator(`.island-pet[data-id="${id}"]`).click();
const at=(page,id)=>page.locator(`.island-pet[data-id="${id}"]`).evaluate(e=>e.style.transform);
async function dragFood(page,id,miss=false) {
  const from=await page.locator('.island-food').boundingBox(),to=await page.locator(`.island-pet[data-id="${id}"]`).boundingBox();
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();
  await page.mouse.move(miss?5:to.x+to.width/2,miss?5:to.y+to.height*.65,{steps:12});await page.mouse.up();
}

test('care happens inside the island: pet, feed once, inspect, close and restore affection',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page);const before=await read(page);
  await choose(page);await expect(page.locator('#island-care')).toBeVisible();await expect(page.locator('#game-dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Vuốt ve Cáo Mầm',exact:true}).click();await expect(page.locator('.island-care-message')).toContainText('+1 gắn bó');
  expect((await read(page)).pets[0].bond).toBe(1);
  await page.getByRole('button',{name:'Vuốt ve Cáo Mầm',exact:true}).click();expect((await read(page)).pets[0].bond).toBe(1);
  await page.locator('.island-food').click();const fed=await read(page);expect(fed.resources.food).toBe(before.resources.food-10);expect(fed.pets[0].xp).toBe(35);expect(fed.pets[0].bond).toBe(4);expect(fed.stats.feeds).toBe(1);
  await page.getByRole('button',{name:'Xem chi tiết Cáo Mầm',exact:true}).click();await expect(page.locator('.pet-dialog')).toBeVisible();await expect(page.locator('.pet-detail-bars')).toContainText('4 / 100');
  expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await choose(page);expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await expect(page.locator('#island-care')).toBeHidden();
  await page.reload();expect((await read(page)).pets[0]).toEqual(fed.pets[0]);await choose(page);await page.keyboard.press('Escape');await expect(page.locator('#island-care')).toBeHidden();
});

test('dragging a berry to another pet spends exactly one meal; a miss or pointer cancellation spends nothing',async({page})=>{
  await page.setViewportSize({width:320,height:640});await seed(page);await choose(page);const before=await read(page);
  await dragFood(page,'axolotl',true);expect((await read(page)).resources).toEqual(before.resources);await expect(page.locator('.island-food-ghost')).toHaveCount(0);
  await dragFood(page,'axolotl');const after=await read(page);expect(after.resources.food).toBe(before.resources.food-10);expect(after.stats.feeds).toBe(1);expect(after.pets.find(p=>p.id==='axolotl').xp).toBe(35);expect(after.pets[0].xp).toBe(0);
  await expect(page.locator('.island-care-heading')).toContainText('Kỳ Nhông Mây');await expect(page.locator('.island-food-ghost')).toHaveCount(0);
});

test('real touch can drag a meal and cancellation releases the captured pointer',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  const cdp=await context.newCDPSession(page),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y])=>({x,y}))});
  try{
    await seed(page);await choose(page);const before=await read(page);
    const from=await page.locator('.island-food').boundingBox(),to=await page.locator('.island-pet[data-id="mossfox"]').boundingBox();
    const x=from.x+from.width/2,y=from.y+from.height/2;
    await touch('touchStart',[[x,y]]);await touch('touchMove',[[x+20,y+10]]);await expect(page.locator('.island-food-ghost')).toBeVisible();await touch('touchCancel',[]);
    await expect(page.locator('.island-food-ghost')).toHaveCount(0);expect((await read(page)).resources).toEqual(before.resources);
    await touch('touchStart',[[x,y]]);await touch('touchMove',[[x+15,y+10]]);await touch('touchMove',[[to.x+to.width/2,to.y+to.height*.65]]);await touch('touchEnd',[]);
    await expect.poll(async()=>(await read(page)).stats.feeds).toBe(1);expect((await read(page)).resources.food).toBe(before.resources.food-10);
  }finally{await cdp.detach();await context.close();}
});

test('roaming is visual, has distinct gaits, and pauses for care, Menu, settings and page changes',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await seed(page);const before=await read(page);
  const initial=await Promise.all(['mossfox','axolotl','emberbird'].map(id=>at(page,id)));
  await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','roaming');
  await expect.poll(async()=>JSON.stringify(await Promise.all(['mossfox','axolotl','emberbird'].map(id=>at(page,id)))),{timeout:15000}).not.toBe(JSON.stringify(initial));
  expect(new Set(await page.locator('.island-pet').evaluateAll(es=>es.map(e=>e.dataset.gait))).size).toBe(3);
  expect((await read(page)).pets).toEqual(before.pets);expect((await read(page)).resources).toEqual(before.resources);
  await choose(page);await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','interacting');const held=await at(page,'mossfox');await page.waitForTimeout(250);expect(await at(page,'mossfox')).toBe(held);
  await page.getByRole('button',{name:'Đóng chăm sóc',exact:true}).click();await openGameMenu(page);await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','paused');
  await page.keyboard.press('Escape');await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','roaming');
  await openSettings(page);await page.getByRole('switch',{name:'Chuyển động',exact:true}).click();await page.getByRole('button',{name:'Đóng',exact:true}).click();await expect(page.locator('.game-lobby')).toHaveAttribute('data-island-life','still');
  await navigateGame(page,'pets');await expect(page.locator('.game-lobby')).toHaveCount(0);await navigateGame(page,'island');await expect(page.locator('#island-care')).toBeHidden();
});

test('care controls stay on small screens and all normal scene controls remain reachable',async({page})=>{
  await seed(page);
  for(const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]]){
    await page.setViewportSize({width,height});
    for(const id of ['mossfox','axolotl','emberbird']){
      await choose(page,id);await expect.poll(()=>page.locator('#island-care button').evaluateAll(es=>es.every(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight&&!!hit&&el.contains(hit);}))).toBe(true);
      await page.getByRole('button',{name:'Đóng chăm sóc',exact:true}).click();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(height+1);
  }
});

test('offline care preserves route progress and reloads with affection; capped pets and empty food are handled',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    const s=eventFixture('chest');s.pets[0].level=30;s.pets[0].bond=50;s.resources.food=0;await seed(page,s);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    const cached=await page.evaluate(async()=>{const key=(await caches.keys()).find(k=>k.startsWith('spirit-isles-'));return (await (await caches.open(key)).keys()).map(r=>new URL(r.url).pathname);});
    for(const f of ['/island-life.css','/js/island-life.js','/js/island-care.js'])expect(cached).toContain(f);
    await context.setOffline(true);await navigateGame(page,'island');const before=await read(page);await choose(page);await expect(page.locator('.island-food')).toBeDisabled();await page.getByRole('button',{name:'Vuốt ve Cáo Mầm'}).click();
    const cared=await read(page);expect(cared.ruins).toEqual(before.ruins);expect(cared.resources).toEqual(before.resources);expect(cared.pets[0].bond).toBe(before.pets[0].bond+1);
    await page.reload();await navigateGame(page,'island');await choose(page);expect((await read(page)).pets[0].care).toEqual(cared.pets[0].care);await expect(page.locator('.island-food')).toBeDisabled();expect(errors).toEqual([]);
  }finally{await context.close();}
});
