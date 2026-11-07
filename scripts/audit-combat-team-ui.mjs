import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import * as E from '../web/js/engine.js';
import * as R from '../web/js/ruins-engine.js';
import * as B from '../web/js/boss-engine.js';

const version='1.16.1',browser=await chromium.launch({headless:true}),report={version,views:[],errors:[]};
function fixture(mode){
  const s=E.newGame();s.level=2;s.resources.food=5000;
  if(mode==='explore'){E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);s.expedition.stage=1;s.expedition.power=25;s.expedition.battle.power=90;s.expedition.battle.focus=3;}
  if(mode==='ruins'){R.startRuins(s,1,()=>.4);R.chooseRuinsPath(s,s.ruins.run.paths.find(id=>id!=='spring'));s.ruins.run.focus=3;s.ruins.run.members.forEach(m=>m.power=8);}
  if(mode==='boss'){B.startBoss(s,1,()=>.4);s.boss.run.focus=3;}
  return s;
}
async function audit(width,height,mode='explore'){
  const c=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  try{
    await p.addInitScript(({key,raw})=>{localStorage.setItem(key,raw);Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(fixture(mode))});await p.goto('http://127.0.0.1:4189');await p.evaluate(()=>document.fonts.ready);
    await p.locator(`[data-action="active-battle"][data-id="${mode}"]`).click();await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
    async function capture(phase){
      let projectiles=[];
      if(phase==='unison'||phase==='counter'){
        // The JS clock does not freeze compositor animations. Capture a visible
        // point in each real projectile instead of a frame after it has faded.
        const selector=phase==='unison'?'.duel-team-projectile:not(.from-enemy)':'.duel-team-projectile.from-enemy';
        projectiles=await p.locator(selector).evaluateAll(es=>es.map(e=>{
          const delay=parseFloat(e.style.animationDelay)||0;for(const a of e.getAnimations()){a.pause();a.currentTime=delay+160;}
          const b=e.getBoundingClientRect(),arena=e.closest('.duel-arena').getBoundingClientRect();
          return {caster:e.dataset.caster,opacity:Number(getComputedStyle(e).opacity),width:b.width,height:b.height,inside:b.left>=arena.left&&b.top>=arena.top&&b.right<=arena.right&&b.bottom<=arena.bottom};
        }));
        const expected=phase==='unison'?3:await p.locator('.duel-opponent .combat-enemy-member').count()||1;
        assert.equal(projectiles.length,expected);assert.ok(projectiles.every(p=>p.opacity>.1&&p.width>10&&p.height>10&&p.inside));
      }
      const screenshot=`dist/screenshots/team-${mode}-${phase}-${width}x${height}-${version}.png`;await p.screenshot({path:screenshot});
      const metrics=await p.locator('#combat-stage').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1,viewport:[innerWidth,innerHeight]}));assert.equal(metrics.overflow,false);
      report.views.push({mode,phase,width,height,screenshot,projectiles,...metrics});
    }
    await capture('ready');await p.locator('[data-move="skill"]').click();await capture('aiming');await p.locator('[data-duel="skip"]').click();await p.clock.runFor(230);await capture('unison');
    const names=await p.locator('.duel-cast-roster>span').allTextContents();assert.equal(names.length,3);assert.equal(await p.locator('.duel-friend.is-acting').count(),3);
    await p.clock.runFor(570);await capture('counter');
  }finally{await c.close();}
}
try{
  for(const [w,h]of [[320,640],[390,844],[768,1024],[1440,1000]])await audit(w,h);
  await audit(390,844,'boss');await audit(390,844,'ruins');
  assert.deepEqual(report.errors,[]);fs.writeFileSync(`dist/TEAM-VISUAL-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({views:report.views.length,errors:report.errors}));
}finally{await browser.close();}
