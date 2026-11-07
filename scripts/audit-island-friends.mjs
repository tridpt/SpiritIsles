import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {picnicFixture} from '../tests/picnic-fixtures.mjs';

const {version}=JSON.parse(fs.readFileSync('package.json','utf8')),frames=[],errors=[];
const browser=await chromium.launch({headless:true});
fs.mkdirSync('dist/screenshots',{recursive:true});
const tappable=e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),inView:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,tappable:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),size:r.width>=44&&r.height>=44};};
async function open(width,height,motion='reduce',s=picnicFixture()){
  E.validateSave(E.serialize(s));
  const context=await browser.newContext({viewport:{width,height},reducedMotion:motion,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
  await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(s)});
  await page.goto('http://127.0.0.1:4189');await page.evaluate(()=>document.fonts.ready);return {context,page};
}
async function invite(page){await page.locator('.island-pet[data-id="mossfox"]').click();await page.locator('[data-action="island-invite-friend"]').click();await page.mouse.move(1,1);}
async function shot(page,width,height,scene,controls){
  const path=`dist/screenshots/island-friends-${scene}-${width}x${height}-${version}.png`;
  await page.screenshot({path});frames.push({width,height,scene,path,...(controls?{controls}:{})});
}
try{
  for(const [width,height] of [[320,640],[390,844],[390,784],[768,1024],[1440,1000]]){
    const {context,page}=await open(width,height);
    await invite(page);await page.clock.runFor(2700);const camera=page.locator('#island-memory button');
    await expect(camera).toBeEnabled();await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2);
    const controls=[];for(const el of await page.locator('.island-pet[data-life-partner],#island-memory button').all())controls.push(await el.evaluate(tappable));
    assert.ok(controls.every(c=>c.inView&&c.tappable&&c.size));
    await shot(page,width,height,'picnic',controls);await camera.click();await expect(camera).toBeDisabled();await shot(page,width,height,'recorded');
    await page.locator('.island-pet[data-id="emberbird"]').click();await expect(page.locator('#island-care')).toBeVisible();
    for(const button of await page.locator('#island-care button').all())assert.deepEqual(Object.values(await button.evaluate(tappable)).slice(1),[true,true,true]);
    await shot(page,width,height,'care');await context.close();
  }
  const {context,page}=await open(390,844,'no-preference');await invite(page);await page.clock.runFor(300);
  await expect(page.locator('.island-pet[data-life-stage="walking"]')).toHaveCount(1);await shot(page,390,844,'invitation');
  for(let n=0;n<100&&await page.locator('.island-pet[data-life-stage="walking"]').count();n++)await page.clock.runFor(240);
  await expect(page.locator('.island-pet[data-habitat-pose="friends"]')).toHaveCount(2);
  await page.clock.runFor(2700);await shot(page,390,844,'sharing');await context.close();
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`dist/ISLAND-FRIENDS-VISUAL-${version}.json`,JSON.stringify({version,isolatedBrowser:true,frames,consoleErrors:errors,completedAt:new Date().toISOString()},null,2)+'\n');
  console.log(`${frames.length} frames; two pets, camera and care buttons remain tappable at five viewport sizes.`);
}finally{await browser.close();}
