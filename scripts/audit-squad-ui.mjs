import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {E,squadReady} from '../tests/squad-fixtures.mjs';
const version='1.17.0',browser=await chromium.launch({headless:true}),report={version,views:[],errors:[]};
async function audit(width,height,mode='explore'){
  const c=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  try{
    const state=squadReady(mode);if(mode==='explore'){state.expedition.power=30;state.expedition.battle.power=80;}if(mode==='ruins')state.ruins.run.members.forEach(m=>m.power=8);
    E.validateSave(E.serialize(state));await p.addInitScript(({key,raw})=>{localStorage.setItem(key,raw);Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(state)});
    await p.goto('http://127.0.0.1:4189');await p.evaluate(()=>document.fonts.ready);await p.locator(`[data-action="active-battle"][data-id="${mode}"]`).first().click();await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
    async function capture(phase){
      if(['unison','counter'].includes(phase))await p.locator('.duel-team-projectile').evaluateAll(es=>es.forEach(e=>{for(const a of e.getAnimations()){a.pause();a.currentTime=(parseFloat(e.style.animationDelay)||0)+160;}}));
      const screenshot=`dist/screenshots/squad-${mode}-${phase}-${width}x${height}-${version}.png`;await p.screenshot({path:screenshot});
      const metrics=await p.locator('#combat-stage').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1,units:[...e.querySelectorAll('.squad-unit')].map(u=>{const a=u.closest('.duel-arena').getBoundingClientRect(),r=u.getBoundingClientRect(),info=u.querySelector('.squad-unit-info').getBoundingClientRect();return {id:u.dataset.unit,side:u.dataset.side,row:u.dataset.row,down:u.classList.contains('is-down'),width:r.width,height:r.height,inside:r.left>=a.left&&r.right<=a.right&&r.top>=a.top&&info.bottom<=a.bottom,health:u.querySelector('[data-unit-hp]').textContent};})}));
      assert.equal(metrics.overflow,false,`${mode} ${width} ${phase} overflow`);assert.ok(metrics.units.every(u=>u.width>30&&u.height>35&&u.inside),JSON.stringify(metrics));
      report.views.push({mode,phase,width,height,screenshot,...metrics});
    }
    for(const side of ['ally','enemy'])for(const id of await p.locator(`.squad-unit[data-side="${side}"]`).evaluateAll(es=>es.map(e=>e.dataset.unit))){await p.locator(`.squad-unit[data-side="${side}"][data-unit="${id}"]`).click({timeout:3000});assert.equal(await p.locator(`.squad-unit[data-side="${side}"][data-unit="${id}"]`).getAttribute('aria-pressed'),'true');}
    await p.locator('#combat-stage').evaluate(e=>e.scrollTop=0);await capture('ready');
    await p.locator('[data-move="skill"]').click();await capture('aiming');await p.locator('[data-duel="skip"]').click();await p.clock.runFor(230);await capture('unison');assert.equal(await p.locator('.duel-friend.is-acting').count(),3);
    await p.clock.runFor(570);await capture('counter');
  }finally{await c.close();}
}
try{
  for(const [w,h]of [[320,640],[390,844],[768,1024],[1440,1000],[844,390]])await audit(w,h);
  await audit(390,844,'boss');await audit(390,844,'ruins');assert.deepEqual(report.errors,[]);
  fs.writeFileSync(`dist/SQUAD-VISUAL-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({views:report.views.length,errors:report.errors}));
}finally{await browser.close();}
