import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {E,squadReady,unitHp} from '../tests/squad-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const browser=await chromium.launch({headless:true}),report={version,views:[],errors:[]};
const cases={attack:{team:['mossfox','axolotl','emberbird'],move:'pet:emberbird'},guard:{team:['emberbird','pebbleturtle','axolotl'],move:'pet:pebbleturtle'},heal:{team:['mossfox','axolotl','emberbird'],move:'pet:axolotl'},support:{team:['pebbleturtle','axolotl','cottonbun'],move:'pet:cottonbun'}};
async function audit(width,height,role){
  const c=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  try{
    const def=cases[role],s=squadReady('explore',def.team),r=s.expedition;r.power=30;r.battle.power=80;
    if(role==='attack')unitHp(s,'explore','enemies',r.squad.enemies.map((u,i)=>i===2?Math.floor(u.maxHp*.4):u.hp));
    if(role==='guard')r.squad.allies[0].row='front';if(role==='support')r.battle.tactics.cooldowns.axolotl=2;
    E.validateSave(E.serialize(s));await p.addInitScript(({key,raw})=>{localStorage.setItem(key,raw);Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
    await p.goto('http://127.0.0.1:4189');await p.evaluate(()=>document.fonts.ready);await p.locator('[data-action="active-battle"][data-id="explore"]').first().click();await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
    if(role==='attack')await p.locator('[data-unit="enemy-2"]').click();if(role==='heal')await p.locator('[data-friend="mossfox"]').click();
    async function capture(phase){
      await p.locator('#combat-stage').evaluate(e=>e.scrollTop=0);
      const screenshot=`dist/screenshots/roles-${role}-${phase}-${width}x${height}-${version}.png`;await p.screenshot({path:screenshot});
      const metrics=await p.locator('#combat-stage').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1,units:[...e.querySelectorAll('.squad-unit')].map(u=>{const a=u.closest('.duel-arena').getBoundingClientRect(),r=u.getBoundingClientRect(),info=u.querySelector('.squad-unit-info').getBoundingClientRect();return {id:u.dataset.unit,side:u.dataset.side,row:u.dataset.row,width:r.width,height:r.height,inside:r.left>=a.left&&r.right<=a.right&&r.top>=a.top&&info.bottom<=a.bottom,status:u.querySelector('[data-unit-status]').textContent};})}));
      assert.equal(metrics.overflow,false,`${role}/${width}/${phase}: overflow`);assert.ok(metrics.units.every(u=>u.width>30&&u.height>35&&u.inside),JSON.stringify(metrics));report.views.push({role,phase,width,height,screenshot,...metrics});
    }
    await p.locator('[data-move="'+def.move+'"]').click();await capture('preview');
    const previewScreenshot=`dist/screenshots/roles-${role}-forecast-${width}x${height}-${version}.png`;await p.locator('.duel-preview').screenshot({path:previewScreenshot});report.views.push({role,phase:'forecast',width,height,screenshot:previewScreenshot});
    await p.locator('[data-duel="skip"]').click();await p.clock.runFor(410);await capture('impact');await p.clock.runFor(850);
    await p.locator('.squad-role-guide summary').click();assert.equal(await p.locator('[data-role-trait]').count(),4);assert.equal(await p.locator('#combat-stage').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  }finally{await c.close();}
}
try{
  for(const [width,height]of [[320,640],[390,844],[768,1024],[1440,1000],[844,390]])for(const role of Object.keys(cases))await audit(width,height,role);
  assert.deepEqual(report.errors,[]);fs.writeFileSync(`dist/ROLES-VISUAL-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({views:report.views.length,errors:report.errors}));
}finally{await browser.close();}
