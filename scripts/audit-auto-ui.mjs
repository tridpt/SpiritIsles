import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import {E,squadGame} from '../tests/squad-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const browser=await chromium.launch({headless:true}),report={version,views:[],errors:[]};
fs.mkdirSync('dist/screenshots',{recursive:true});
try{
  for(const [width,height]of [[320,640],[390,844],[768,1024],[1440,1000],[844,390]]){
    const c=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
    try{
      const s=squadGame();s.pets.forEach(p=>p.level=20);E.startExpedition(s,'forest',()=>.5,1720000000000);E.validateSave(E.serialize(s));await p.addInitScript(({key,raw})=>{localStorage.setItem(key,raw);Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
      await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));await p.goto('http://127.0.0.1:4189');await p.evaluate(()=>document.fonts.ready);await p.locator('[data-action="journey-auto"]').click();await p.locator('[data-duel="speed"]').click();
      async function shot(phase){
        await p.locator('#combat-stage').evaluate(e=>e.scrollTop=0);const path=`dist/screenshots/auto-${width}x${height}-${phase}-${version}.png`;await p.screenshot({path});
        const bounds=await p.locator('.auto-hud button,.auto-hud select').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
        assert.ok(bounds.every(r=>r.left>=0&&r.right<=width&&r.height>=44&&r.width>=44&&r.top>=0&&r.bottom<=height));assert.ok(await p.locator('#combat-stage').evaluate(e=>e.scrollWidth<=e.clientWidth+1));report.views.push({width,height,phase,path,bounds});
      }
      await shot('walking');await p.clock.runFor(1151);await expect(p.locator('.duel-arena')).toBeVisible();await shot('battle');await p.clock.runFor(451);await shot('cast');await p.locator('[data-duel="auto"]').click();await p.clock.runFor(600);await expect(p.locator('[data-move="attack"]')).toBeEnabled();await shot('manual');
      await p.locator('[data-duel="auto"]').click();await p.clock.runFor(60000);await expect(p.locator('.duel-end h2')).toHaveText('Đã hoàn thành hành trình!');await p.screenshot({path:`dist/screenshots/auto-${width}x${height}-complete-${version}.png`});report.views.push({width,height,phase:'complete'});
    }finally{await c.close();}
  }
  assert.deepEqual(report.errors,[]);report.completedAt=new Date().toISOString();fs.writeFileSync(`dist/AUTO-VISUAL-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(`${report.views.length} frames, five viewport sizes, AUTO controls inside viewport, no horizontal overflow, no page errors.`);
}finally{await browser.close();}
