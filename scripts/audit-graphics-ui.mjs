import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {E,squadReady} from '../tests/squad-fixtures.mjs';
import {navigateGame} from '../tests/browser/navigation.mjs';

const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const phase=process.argv[2]||'final';
const report={version,phase,views:[],errors:[]};
const browser=await chromium.launch({headless:true});
fs.mkdirSync('dist/screenshots',{recursive:true});
try {
  for(const [width,height] of [[390,844],[1440,1000],...(phase==='before'?[]:[[320,640],[768,1024],[844,390]])]) {
    const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
    try {
      let page=await context.newPage();
      page.on('pageerror',e=>report.errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
      async function shot(screen,root='body') {
        await page.evaluate(()=>document.fonts.ready);
        const metrics=await page.locator(root).evaluate(e=>({scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}));
        assert.ok(metrics.scrollWidth<=metrics.clientWidth+1,`${width}/${screen}: horizontal overflow`);
        const path=`dist/screenshots/graphics-${phase}-${width}x${height}-${screen}-${version}.png`;
        await page.screenshot({path});report.views.push({width,height,screen,path,metrics});
      }
      await page.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('graphics-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('graphics-seed','1');}},{key:E.SAVE_KEY,raw:E.serialize(E.newGame())});
      await page.goto('http://127.0.0.1:4189/');await shot('island');
      await navigateGame(page,'pets');await shot('pets');
      await page.getByRole('button',{name:'Sổ linh thú',exact:true}).click();
      await page.getByRole('button',{name:'Lọc SSR',exact:true}).click();await shot('collection');
      await page.getByRole('button',{name:'Ngắm Long Thần Hư Không',exact:true}).click();await shot('legend','#game-dialog');
      await page.getByRole('button',{name:'Đóng',exact:true}).click();
      await navigateGame(page,'hatch');await shot('hatch');
      await navigateGame(page,'explore');await shot('map');
      // Close the old app before seeding another save: pagehide persists its in-memory state.
      await page.close();page=await context.newPage();
      page.on('pageerror',e=>report.errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
      await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(squadReady())});
      await page.goto('http://127.0.0.1:4189/');await page.locator('[data-action="active-battle"][data-id="explore"]').first().click();
      await shot('battle','#combat-stage');
      if(phase!=='before') {
        const artAudit=await page.locator('.duel-scenery').evaluate(el=>({
          invalid:!!new DOMParser().parseFromString(el.outerHTML,'image/svg+xml').querySelector('parsererror'),
          missing:[...el.querySelectorAll('[fill^="url"],[stroke^="url"]')].filter(n=>['fill','stroke'].some(a=>{const ref=n.getAttribute(a)?.match(/^url\(#([^)]*)\)/);return ref&&!el.querySelector(`[id="${ref[1]}"]`);})).length
        }));
        assert.deepEqual(artAudit,{invalid:false,missing:0});
      }
    } finally {await context.close();}
  }
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(`dist/GRAPHICS-${phase.toUpperCase()}-${version}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(`${report.views.length} frames; no horizontal overflow or JavaScript errors.`);
} finally {await browser.close();}
