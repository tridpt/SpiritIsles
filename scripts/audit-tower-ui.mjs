import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {E,T,towerGame,towerReady,climb,towerNow} from '../tests/tower-fixtures.mjs';
import {squadGame} from '../tests/squad-fixtures.mjs';
const browser=await chromium.launch(),results=[],errors=[];
fs.mkdirSync('dist/screenshots',{recursive:true});
const won=climb(towerGame({level:30,stars:3}),31,{save:true});
for(const n of [5,10,15,20,25,30])T.claimTowerMilestone(won,n);T.setTowerAura(won,true);
const boon=towerReady({level:15});for(let i=0;boon.tower.run.phase==='battle'&&i<20;i++){
  const {autoTowerTurn}=await import('../tests/tower-fixtures.mjs');autoTowerTurn(boon);
}
const boss=climb(towerGame({level:15}),5,{save:true});T.chooseTowerPath(boss,'boss',towerNow);
try{
  for(const viewport of [{width:390,height:844},{width:320,height:640},{width:1440,height:1000},{width:844,height:390}])for(const scene of ['hub','paths','blessing','fight','boss','prizes']){
    const c=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push({scene,viewport,error:e.message}));
    try{
      const s=scene==='hub'?squadGame():scene==='paths'?towerGame():scene==='blessing'?boon:scene==='fight'?towerReady():scene==='boss'?boss:won;
      await p.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(s)});
      await p.goto('http://127.0.0.1:4189/');await p.evaluate(()=>document.fonts.ready);
      if(!s.tower.run){await p.locator('[data-action="game-menu"]').click();await p.locator('.game-menu-grid [data-page="tower"]').click();}
      if(scene==='prizes')await p.locator('[data-action="tower-tab"][data-id="rewards"]').click();
      if(['fight','boss'].includes(scene))await p.locator('[data-action="active-battle"][data-id="tower"]').click();
      const audit=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,invalidSVG:[...document.querySelectorAll('svg')].filter(e=>new DOMParser().parseFromString(e.outerHTML,'image/svg+xml').querySelector('parsererror')).length}));
      assert.ok(audit.scrollWidth<=audit.width+1,JSON.stringify({scene,viewport,audit}));assert.equal(audit.invalidSVG,0);
      const file=`dist/screenshots/tower-${scene}-${viewport.width}x${viewport.height}-1.25.0.png`;await p.screenshot({path:file,fullPage:!['fight','boss'].includes(scene)});results.push({scene,viewport,...audit,screenshot:file});
    }finally{await c.close();}
  }
  assert.deepEqual(errors,[]);fs.writeFileSync('dist/TOWER-VISUAL-1.25.0.json',JSON.stringify({results,errors},null,2));console.log(`${results.length} tower scenes verified`);
}finally{await browser.close();}
