import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {E,squadGame} from '../tests/squad-fixtures.mjs';
import {BIOMES} from '../web/js/data.js';
import {openSettings} from '../tests/browser/navigation.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const report={version,views:[],errors:[],offlineAssets:[],motionChecks:[]};
const browser=await chromium.launch({headless:true});
try {
  for(const width of [390,1440])for(const biome of BIOMES) {
    const context=await browser.newContext({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce',serviceWorkers:'block'});
    try {
      const s=squadGame();s.level=30;
      assert.ok(!E.startExpedition(s,biome.id,()=>.5).error);E.validateSave(E.serialize(s));
      const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
      await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(s)});
      await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>document.fonts.ready);
      await page.locator('[data-action="journey-open"]').click();
      const audit=await page.locator('.travel-scenery').evaluate(svg=>({
        invalid:!!new DOMParser().parseFromString(svg.outerHTML,'image/svg+xml').querySelector('parsererror'),
        missing:[...svg.querySelectorAll('[fill^="url"],[stroke^="url"]')].filter(n=>['fill','stroke'].some(a=>{const ref=n.getAttribute(a)?.match(/^url\(#([^)]*)\)/);return ref&&!svg.querySelector(`[id="${ref[1]}"]`);})).length,
        motion:getComputedStyle(svg.querySelector('.scenery-motes')).animationName,
        width:svg.getBoundingClientRect().width
      }));
      assert.equal(audit.invalid,false);assert.equal(audit.missing,0);assert.equal(audit.motion,'none');assert.ok(audit.width>250);
      assert.ok(await page.locator('#combat-stage').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
      const path=`dist/screenshots/graphics-${biome.element}-travel-${width}-${version}.png`;
      await page.screenshot({path});report.views.push({width,biome:biome.id,element:biome.element,path,audit});
      if(width===390&&biome.element==='leaf') {
        await page.locator('[data-duel="close"]').click();
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.locator('[data-action="journey-open"]').click();
        assert.equal(await page.locator('.travel-scenery .scenery-motes').evaluate(e=>getComputedStyle(e).animationName),'world-glimmer');
        await page.locator('[data-duel="close"]').click();await openSettings(page);
        await page.getByRole('switch',{name:'Chuyển động',exact:true}).click();
        await page.getByRole('button',{name:'Đóng',exact:true}).click();
        await page.locator('[data-action="journey-open"]').click();
        assert.equal(await page.locator('.travel-scenery .scenery-motes').evaluate(e=>getComputedStyle(e).animationName),'none');
        report.motionChecks.push('system preference and in-game setting disable scenery animation');
      }
    } finally {await context.close();}
  }
  const context=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'allow'});
  try {
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    report.offlineAssets=await page.evaluate(async version=>{const cache=await caches.open(`spirit-isles-v${version}`);return Promise.all(['visual-world.css','js/world-art.js'].map(async f=>({file:f,cached:!!await cache.match('/'+f)})));},version);
    assert.ok(report.offlineAssets.every(a=>a.cached));await context.setOffline(true);await page.reload();
    assert.equal(await page.locator('.island-art-refined').count(),1);
    await page.getByRole('button',{name:'Ấp trứng',exact:true}).click();await page.getByRole('button',{name:'Ánh Sao',exact:true}).click();
    assert.ok(await page.locator('.egg-art').evaluate(e=>!!e.querySelector('radialGradient')));
    await page.screenshot({path:`dist/screenshots/graphics-star-egg-offline-${version}.png`});
  } finally {await context.close();}
  assert.deepEqual(report.errors,[]);report.completedAt=new Date().toISOString();
  fs.writeFileSync(`dist/WORLD-SCENES-${version}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(`${report.views.length} real travel scenes, six themes, valid SVG, reduced motion and offline assets passed.`);
} finally {await browser.close();}
