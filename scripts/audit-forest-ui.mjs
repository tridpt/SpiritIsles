import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {E,unitHp} from '../tests/squad-fixtures.mjs';
import {forestFixture} from '../tests/forest-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const quick=process.argv.includes('--quick'),views=quick?[[390,844]]:[[320,640],[390,844],[768,1024],[1440,1000],[844,390]];
const report={version,views:[],errors:[]},browser=await chromium.launch({headless:true});
fs.mkdirSync('dist/screenshots',{recursive:true});
try{
  for(const [width,height]of views){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});
    try{
      for(const phase of ['travel','battle','warning','dodge','loot','complete']){
        const page=await context.newPage(),state=forestFixture({travel:phase==='travel'||phase==='complete',boss:phase==='warning'||phase==='dodge',warning:phase==='warning'||phase==='dodge',level:phase==='complete'?20:1});
        if(phase==='loot')unitHp(state,'explore','enemies',[1,1,1]);
        page.on('pageerror',e=>report.errors.push(`${width}/${phase}: ${e.message}`));
        await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
        await page.addInitScript(({key,raw})=>{localStorage.setItem(key,raw);Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(state)});
        await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>document.fonts.ready);
        await page.locator(`[data-action="${phase==='complete'?'journey-auto':'journey-open'}"]`).click();
        if(phase==='dodge'){await page.locator('[data-duel="evade"]').click();await page.clock.runFor(61);}
        if(phase==='loot'){await page.locator('[data-move="attack"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(70);}
        if(phase==='complete')await page.clock.runFor(120000);
        const metrics=await page.locator('#combat-stage').evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight,field:e.querySelector('.forest-field')?.getBoundingClientRect().toJSON(),controls:[...e.querySelectorAll('.forest-exit,.auto-hud button,.auto-hud select,.duel-skills>button,.duel-commands>button')].filter(b=>b.getBoundingClientRect().width&&getComputedStyle(b).visibility!=='hidden').map(b=>{const r=b.getBoundingClientRect();return {name:b.getAttribute('aria-label')||b.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};})}));
        assert.ok(metrics.scrollWidth<=width+1,`${width}/${phase}: horizontal overflow`);
        assert.ok(metrics.scrollHeight<=height+1,`${width}/${phase}: game frame should fit vertically`);
        assert.ok(metrics.field?.height>=150,`${width}/${phase}: visible world`);
        assert.ok(metrics.controls.every(r=>r.x>=-1&&r.y>=-1&&r.right<=width+1&&r.bottom<=height+1&&r.height>=43&&r.width>=43),`${width}/${phase}: touch controls must fit: ${JSON.stringify(metrics.controls)}`);
        if(phase==='warning')assert.equal(await page.locator('.forest-warning').isVisible(),true);
        if(phase==='complete')assert.equal(await page.locator('.duel-end h2').textContent(),'Đã hoàn thành hành trình!');
        const path=`dist/screenshots/forest-${width}x${height}-${phase}-${version}.png`;
        await page.screenshot({path});report.views.push({width,height,phase,path,metrics});await page.close();
      }
    }finally{await context.close();}
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(`dist/FOREST-VISUAL${quick?'-QUICK':''}-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(`${report.views.length} forest frames: controls fit, persistent world visible, no JavaScript errors.`);
}finally{await browser.close();}
