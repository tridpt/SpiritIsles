import { navigateGame, openSettings } from './navigation.mjs';
import { test, expect } from '@playwright/test';

const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state);
const look=stage=>stage.evaluate(e=>Number(e.style.getPropertyValue('--look-x')||0));

test('inspecting a creature follows the pointer in depth, recenters, supports keys, and keeps feeding working',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Chăm sóc Cáo Mầm'}).click();await page.getByRole('button',{name:'Xem chi tiết Cáo Mầm',exact:true}).click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  const stage=page.locator('[data-creature-stage]');const before=await state(page);
  const box=await stage.boundingBox();await page.mouse.move(box.x+box.width*.88,box.y+box.height*.25);
  await expect(stage).toHaveClass(/is-viewing/);expect(await look(stage)).toBeGreaterThan(.7);
  await expect.poll(()=>stage.locator('.pet-volume-face').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41)).toBeGreaterThan(1.5);
  expect(await stage.locator('.pet-volume-rear').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m41)).toBeLessThan(-1);
  await page.screenshot({path:'dist/screenshots/depth-viewing-desktop-1.10.0.png'});
  await page.mouse.move(0,0);await expect.poll(()=>look(stage)).toBe(0);
  await stage.focus();await page.keyboard.press('ArrowLeft');expect(await look(stage)).toBe(-.8);
  await page.keyboard.press('Home');expect(await look(stage)).toBe(0);
  const after=await state(page);expect(after.pets).toEqual(before.pets);expect(after.resources).toEqual(before.resources);
  await page.getByRole('button',{name:/Cho ăn/}).click();expect((await state(page)).pets[0].xp).toBe(before.pets[0].xp+35);
});

test('system and in-game reduced motion keep depth static and do not block normal controls',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Chăm sóc Cáo Mầm'}).click();await page.getByRole('button',{name:'Xem chi tiết Cáo Mầm',exact:true}).click();
  let stage=page.locator('[data-creature-stage]');let box=await stage.boundingBox();
  await page.mouse.move(box.x+box.width*.9,box.y+box.height*.3);expect(await look(stage)).toBe(0);
  expect(await stage.locator('.creature').evaluate(e=>getComputedStyle(e).transform)).toBe('none');
  await expect(page.locator('.creature-view-hint')).toBeHidden();
  await page.getByRole('button',{name:'Đóng',exact:true}).click();await openSettings(page);
  await page.getByRole('switch',{name:'Chuyển động',exact:true}).click();await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Chăm sóc Cáo Mầm'}).click();await page.getByRole('button',{name:'Xem chi tiết Cáo Mầm',exact:true}).click();
  stage=page.locator('[data-creature-stage]');box=await stage.boundingBox();await page.mouse.move(box.x+box.width*.9,box.y+box.height*.3);
  expect(await look(stage)).toBe(0);expect(await stage.locator('.creature').evaluate(e=>getComputedStyle(e).transform)).toBe('none');
  await page.getByRole('button',{name:/Cho ăn/}).click();expect((await state(page)).pets[0].xp).toBe(35);
});

test('horizontal touch viewing releases cleanly and vertical swipes still scroll a small phone dialog',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:600},hasTouch:true,isMobile:true,reducedMotion:'no-preference',serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y])=>({x,y}))});
  try{
    await page.goto('http://127.0.0.1:4189/');await navigateGame(page,'pets');await page.getByRole('button',{name:'Sổ linh thú',exact:true}).click();
    await page.getByRole('button',{name:'Ngắm Long Thần Hư Không',exact:true}).click();
    const stage=page.locator('[data-creature-stage]');const box=await stage.boundingBox();const x=box.x+box.width*.5,y=box.y+box.height*.55;
    await touch('touchStart',[[x,y]]);await touch('touchMove',[[x+75,y]]);
    await expect.poll(()=>look(stage)).toBeGreaterThan(.3);
    await page.screenshot({path:'dist/screenshots/depth-viewing-touch-1.10.0.png'});
    await touch('touchEnd',[]);await expect.poll(()=>look(stage)).toBe(0);
    const dialog=page.getByRole('dialog');const initial=await dialog.evaluate(e=>e.scrollTop);
    await touch('touchStart',[[x,y]]);await touch('touchMove',[[x,y-30]]);await touch('touchMove',[[x,y-90]]);await touch('touchEnd',[]);
    await expect.poll(()=>dialog.evaluate(e=>e.scrollTop)).toBeGreaterThan(initial);
    await expect.poll(()=>look(stage)).toBe(0);expect(errors).toEqual([]);
  }finally{await cdp.detach();await context.close();}
});
