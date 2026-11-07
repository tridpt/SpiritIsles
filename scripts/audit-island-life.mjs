import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import * as E from '../web/js/engine.js';

const browser=await chromium.launch(),context=await browser.newContext({reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage();
const errors=[],views=[],motion=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(({key,raw})=>{localStorage.setItem(key,raw);},{key:E.SAVE_KEY,raw:E.serialize(E.newGame())});
const controls=()=>page.evaluate(()=>[...document.querySelectorAll('.wallet-item,.game-menu-toggle,.daily-treasure,.lobby-activity,.map-hotspot,.island-pet,.firefly,.lobby-quest,[data-collect-button],.journey-launch,.lobby-dojo,.lobby-awakening,.island-shortcut')].filter(el=>el.checkVisibility()).map(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {name:el.getAttribute('aria-label')||el.textContent.trim(),inViewport:b.top>=0&&b.left>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,tappable:!!hit&&el.contains(hit)};}));
try{
 for(const [width,height] of [[320,640],[320,720],[390,844],[432,912],[768,1024],[1024,844],[1440,1000]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4189');await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);
  const samples=[],bad=[],behaviors=new Set();
  for(let i=0;i<60;i++){
   const c=await controls();for(const control of c)if(!control.inViewport||!control.tappable)bad.push({sample:i,...control});
   const actors=await page.locator('.island-pet').evaluateAll(es=>es.map(e=>({id:e.dataset.id,behavior:e.dataset.behavior,pose:e.style.transform})));
   samples.push(actors);for(const a of actors)behaviors.add(a.behavior);await page.waitForTimeout(100);
  }
  assert.deepEqual(bad,[],`${width}x${height} controls`);
  const path=`dist/screenshots/island-life-${width}x${height}-1.14.0.png`;await page.screenshot({path});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1);assert.equal(overflow,false);
  views.push({width,height,kind:'island',screenshot:path,controls:await controls(),overflow});
  motion.push({width,height,sampleCount:samples.length,behaviors:[...behaviors],pets:samples[0].map((a,j)=>({id:a.id,distinctPoses:new Set(samples.map(s=>s[j].pose)).size}))});
  for(const id of ['mossfox','axolotl','emberbird']){
   await page.locator(`.island-pet[data-id="${id}"]`).click();
   const buttons=await page.locator('#island-care button').evaluateAll(es=>es.map(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {label:el.getAttribute('aria-label'),width:b.width,height:b.height,inViewport:b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,tappable:!!hit&&el.contains(hit)};}));
   assert.ok(buttons.every(b=>b.inViewport&&b.tappable&&b.width>=44&&b.height>=44));
   if(id==='mossfox'){
    await page.getByRole('button',{name:'Vuốt ve Cáo Mầm'}).click();
    const path=`dist/screenshots/island-care-${width}x${height}-1.14.0.png`;await page.screenshot({path});views.push({width,height,kind:'care',screenshot:path,buttons});
   }
   await page.getByRole('button',{name:'Đóng chăm sóc',exact:true}).click();
  }
  console.log(`Verified ${width}x${height}: moving island and three care targets.`);
 }
 assert.deepEqual(errors,[]);
 const report={version:'1.14.0',views,motion,errors,completedAt:new Date().toISOString()};fs.writeFileSync('dist/ISLAND-LIFE-VISUAL-1.14.0.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({views:views.length,motion,errors},null,2));
}finally{await browser.close();}
