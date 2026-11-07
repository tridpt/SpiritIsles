import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import * as R from '../web/js/ruins-engine.js';
import {eventFixture,battleFixture} from '../tests/ruins-route-fixtures.mjs';
import {navigateGame} from '../tests/browser/navigation.mjs';
const version='1.15.1',baseline=process.argv.includes('--before'),label=baseline?'before':version;
const state=E.newGame();state.level=2;state.resources.food=5000;
for(const p of state.pets){p.level=30;p.stars=3;p.bond=100;}
R.startRuins(state,1,()=>.38);
for(let n=0;state.ruins.run.floor<3&&n<200;n++){
 const r=state.ruins.run;
 if(r.phase==='path')R.chooseRuinsPath(state,r.paths.find(p=>p==='trail')||r.paths[0]);
 else if(r.phase==='blessing')R.chooseRuinsBlessing(state,r.offers[0]);
 else R.ruinsBattleTurn(state,r.focus>=2?'skill':'attack');
}
state.ruins.run.hp=70;state.ruins.run.focus=3;E.validateSave(E.serialize(state));
const browser=await chromium.launch(),context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],views=[];
let offlineCacheVerified=false;
page.on('pageerror',e=>errors.push(e.message));
let seedNumber=0;
async function seed(s){
 const token=String(++seedNumber);
 await page.addInitScript(({raw,key,token})=>{if(sessionStorage.getItem('clarity-audit')!==token){localStorage.setItem(key,raw);sessionStorage.setItem('clarity-audit',token);}},{raw:E.serialize(s),key:E.SAVE_KEY,token});
 await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>document.fonts.ready);
}
async function nav(id){if(['ruins','dojo'].includes(id)){await navigateGame(page,'explore');await page.locator(`.ruins-explore-tabs [data-page="${id}"]`).click();}else await navigateGame(page,id);}
const targets=['.ruins-explore-tabs button:not(.active)','.ruins-explore-tabs button.active','.ruins-section-tabs button:not(.active)','.ruins-section-tabs button.active','.ruins-active-wallet>span','.ruins-dust','.ruins-health-label','.ruins-health-label>strong','.ruins-energy>small','.ruins-health-tools>.btn','.page-heading .eyebrow','.ruins-path-body>p','.ruins-route-choice p'];
async function contrast(selectors){return page.evaluate(selectors=>{
 const rgba=s=>(s.match(/[\d.]+/g)||[]).map(Number),mix=(a,b)=>{const alpha=a[3]??1;return [0,1,2].map(i=>a[i]*alpha+b[i]*(1-alpha)).concat(1);};
 const luminance=c=>c.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
 return selectors.flatMap(sel=>[...document.querySelectorAll(sel)].filter(e=>e.checkVisibility()).slice(0,4).map(e=>{
   const style=getComputedStyle(e),layers=[];let opacity=1;
   for(let a=e;a;a=a.parentElement){const c=getComputedStyle(a);opacity*=Number(c.opacity);layers.unshift(rgba(c.backgroundColor));}
   let bg=[255,255,255,1];for(const c of layers)if(c.length)bg=mix(c,bg);
   const foreground=mix(rgba(style.color).slice(0,3).concat((rgba(style.color)[3]??1)*opacity),bg),a=luminance(foreground),b=luminance(bg);
   return {selector:sel,text:e.textContent.trim().slice(0,65),color:style.color,background:backgroundHex(bg),ratio:Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2)),opacity,filter:style.filter,fontSize:style.fontSize};
 }));
 function backgroundHex(bg){return '#'+bg.slice(0,3).map(c=>Math.round(c).toString(16).padStart(2,'0')).join('');}
 },selectors);}
try{
 for(const [width,height] of [[320,640],[390,844],[768,1024],[1440,1000]]){
  await page.setViewportSize({width,height});await seed(state);
  const samples=await contrast(targets);const path=`dist/screenshots/clarity-ruins-${width}x${height}-${label}.png`;await page.screenshot({path});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  assert.equal(overflow,false);if(!baseline)assert.ok(samples.every(s=>s.ratio>=4.5),JSON.stringify(samples.filter(s=>s.ratio<4.5)));
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state.ruins,E.SAVE_KEY);
  await nav('island');await nav('ruins');const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state.ruins,E.SAVE_KEY);assert.deepEqual(after,before);
  views.push({width,height,screen:'ruins',screenshot:path,overflow,contrast:samples});
 }
 if(!baseline){
  await page.setViewportSize({width:390,height:844});
  await seed(eventFixture('chest'));const eventContrast=await contrast(['.route-event-body>p','.route-event-choice:not(:disabled) p','.route-event-choice:not(:disabled) h3']);assert.ok(eventContrast.every(s=>s.ratio>=4.5),JSON.stringify(eventContrast));await page.screenshot({path:`dist/screenshots/clarity-route-event-${version}.png`});views.push({screen:'route-event',contrast:eventContrast});
  await seed(battleFixture(3));await page.locator('[data-action="active-battle"]').click();await expect(page.locator('#combat-stage')).toBeVisible();const combatContrast=await contrast(['.duel-intent','.duel-intent p','.duel-stance-note','.duel-stances>button:not([aria-pressed="true"])']);assert.ok(combatContrast.every(s=>s.ratio>=4.5),JSON.stringify(combatContrast));await page.screenshot({path:`dist/screenshots/clarity-combat-${version}.png`});views.push({screen:'combat',contrast:combatContrast});await page.evaluate(()=>window.spiritBack());
  for(const id of ['island','pets','hatch','build','dojo']){await nav(id);const samples=await contrast(id==='hatch'?['.egg-tabs button','.hatch-guarantee']:id==='pets'?['.segmented button','.filter-chip']:[]);assert.ok(samples.every(s=>s.ratio>=4.5),JSON.stringify(samples));await page.screenshot({path:`dist/screenshots/clarity-${id}-${version}.png`});views.push({screen:id,contrast:samples});}
  await page.getByRole('button',{name:'Mở menu đảo',exact:true}).click();await page.screenshot({path:`dist/screenshots/clarity-menu-${version}.png`});views.push({screen:'menu'});
  const offlineContext=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce'}),offline=await offlineContext.newPage();offline.on('pageerror',e=>errors.push(e.message));
  try {
   await offline.addInitScript(({key,raw})=>{if(!localStorage.getItem(key))localStorage.setItem(key,raw);},{key:E.SAVE_KEY,raw:E.serialize(state)});
   await offline.goto('http://127.0.0.1:4189/');await offline.evaluate(()=>navigator.serviceWorker.ready);await offline.reload();
   assert.equal(await offline.evaluate(async()=>{const cache=await caches.open('spirit-isles-v1.15.1');return !!await cache.match('clarity.css');}),true);
   const before=await offline.evaluate(key=>JSON.parse(localStorage.getItem(key)).state.ruins.run,E.SAVE_KEY);
   await offlineContext.setOffline(true);await offline.reload();await expect(offline.locator('.ruins-path-room')).toBeVisible();await expect(offline.locator('.ruins-health-label>strong')).toHaveCSS('color','rgb(39, 84, 55)');
   assert.deepEqual(await offline.evaluate(key=>JSON.parse(localStorage.getItem(key)).state.ruins.run,E.SAVE_KEY),before);offlineCacheVerified=true;
  }finally{await offlineContext.close();}
 }
 assert.deepEqual(errors,[]);const report={version,baseline,views,errors,offlineCacheVerified,contrastBackgroundMethod:'Composited solid background colors; chosen text surfaces use opaque backgrounds after the fix. Secondary button gradient is measured against its darker fallback color.',completedAt:new Date().toISOString()};
 fs.writeFileSync(`dist/UI-CLARITY-${label}.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({baseline,views:views.length,contrast:views[1].contrast,errors},null,2));
}finally{await browser.close();}
