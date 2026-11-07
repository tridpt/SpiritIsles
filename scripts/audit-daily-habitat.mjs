import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import * as E from '../web/js/engine.js';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
fs.mkdirSync('dist/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true}),frames=[],errors=[];
try{
  for(const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(E.newGame())});
    await page.goto('http://127.0.0.1:4189');await page.evaluate(()=>document.fonts.ready);
    for(const scene of ['island','menu','book','focused']){
      if(scene==='menu')await page.locator('[data-action="game-menu"]').click();
      if(scene==='book')await page.locator('.game-menu-item[data-page="habitat"]').click();
      if(scene==='focused')await page.locator('.habitat-daily [data-action="habitat-open"]').click();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      const path=`dist/screenshots/daily-habitat-${scene}-${width}-${version}.png`;
      await page.screenshot({path});frames.push({width,height,scene,path});
    }
    await context.close();
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(`dist/DAILY-HABITAT-VISUAL-${version}.json`,JSON.stringify({version,frames,consoleErrors:errors,isolatedBrowser:true,completedAt:new Date().toISOString()},null,2)+'\n');
  console.log(`${frames.length} isolated visual frames, no horizontal overflow or JavaScript errors.`);
}finally{await browser.close();}
