import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import * as E from '../web/js/engine.js';
import {placeItem} from '../web/js/island-layout.js';
import {HABITAT_MOMENTS} from '../web/js/habitat-data.js';
import {navigateGame} from '../tests/browser/navigation.mjs';

const browser=await chromium.launch({headless:true}),report={version:'1.16.0',views:[],errors:[]};
fs.mkdirSync('dist/screenshots',{recursive:true});
function fixture(id){
  const s=E.newGame();s.level=3;s.ruins.best=5;s.ruins.clears=5;s.ruins.bosses=1;s.boss.best=1;s.boss.wins=1;s.boss.clears[0]=1;
  for(const p of s.pets)p.bond=50;s.pets.push({...E.makePet('phoenix'),bond:50});
  s.islandLayout={version:1,nextId:1,placed:[]};const m=HABITAT_MOMENTS.find(m=>m.id===id);placeItem(s,s.islandLayout,m.decor[0],0,0);if(m.near)placeItem(s,s.islandLayout,m.near[0],2,0);return s;
}
async function view(width,height,moment='shade-nap',pet='mossfox',captureBook=false){
  const c=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  try{
    await p.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(fixture(moment))});await p.goto('http://127.0.0.1:4189');await p.evaluate(()=>document.fonts.ready);
    await navigateGame(p,'pets');await p.locator('.habitat-entry').click();await p.locator('#habitat-pet').selectOption(pet);
    if(captureBook){
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      const screenshot=`dist/screenshots/habitat-book-${width}x${height}-1.16.0.png`;await p.screenshot({path:screenshot});
      report.views.push({screen:'book',width,height,overflow:false,screenshot});
    }
    await p.locator(`.habitat-card[data-moment="${moment}"] [data-action="habitat-play"]`).click();
    const controls=await p.locator('.habitat-scene button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {action:e.dataset.action,x:r.x,y:r.y,width:r.width,height:r.height,reachable:!!hit&&e.contains(hit)&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};}));
    assert.ok(controls.every(b=>b.reachable&&b.width>=44&&b.height>=44));
    const screenshot=`dist/screenshots/habitat-${moment}-${width}x${height}-1.16.0.png`;await p.screenshot({path:screenshot});report.views.push({screen:'scene',moment,pet,width,height,controls,screenshot});
  }finally{await c.close();}
}
try{
  for(const [w,h] of [[320,640],[390,844],[768,1024],[1440,1000]])await view(w,h,'shade-nap','mossfox',true);
  for(const [m,p] of [['swing-play','mossfox'],['pond-bubbles','axolotl'],['picnic-friends','mossfox'],['legend-aurora','phoenix'],['guardian-oath','emberbird']])await view(390,844,m,p);
  assert.deepEqual(report.errors,[]);fs.writeFileSync('dist/HABITAT-VISUAL-1.16.0.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({views:report.views.length,errors:report.errors}));
}finally{await browser.close();}
