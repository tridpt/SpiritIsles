import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import {placeItem} from '../web/js/island-layout.js';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8')),frames=[],errors=[];
fs.mkdirSync('dist/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install();await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(E.newGame())});await page.goto('http://127.0.0.1:4189');await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(10000);
    const button=page.locator('#island-memory button');await expect(button).toBeVisible();await expect(button).toBeEnabled();
    const controls=await page.locator('.game-hud button,.island-shortcut,.lobby-cozy-actions>button:visible,#island-memory button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),inView:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,tappable:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
    assert.ok(controls.every(c=>c.inView&&c.tappable));assert.ok(await button.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44;}));
    for(const scene of ['playing','recorded','care']){
      if(scene==='recorded')await button.click();
      if(scene==='care'){await page.locator('.island-pet-0').click();await expect(page.locator('#island-care')).toBeVisible();}
      const path=`dist/screenshots/living-island-${scene}-${width}-${version}.png`;await page.screenshot({path});frames.push({width,height,scene,path,controls:scene==='playing'?controls:undefined});
    }
    await context.close();
  }
  for(const [type,id] of [['pond','axolotl'],['swing','mossfox'],['sapling','mossfox']]){
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage(),s=E.newGame();s.team=[id];s.islandLayout={version:1,nextId:1,placed:[]};placeItem(s,s.islandLayout,type,5,4);
    page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(s)});await page.goto('http://127.0.0.1:4189');await page.evaluate(()=>document.fonts.ready);await page.locator('.island-pet').click();await page.locator('[data-action="island-invite"]').click();await page.clock.runFor(2700);await expect(page.locator('#island-memory button')).toBeEnabled();
    const path=`dist/screenshots/living-island-${type}-390-${version}.png`;await page.screenshot({path});frames.push({width:390,height:844,scene:type,path});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(`dist/LIVING-ISLAND-VISUAL-${version}.json`,JSON.stringify({version,isolatedBrowser:true,frames,consoleErrors:errors,completedAt:new Date().toISOString()},null,2)+'\n');console.log(`${frames.length} visual frames; camera hit targets clear at all four sizes.`);
}finally{await browser.close();}
