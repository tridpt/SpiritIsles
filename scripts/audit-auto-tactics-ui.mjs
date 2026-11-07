import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import {E,B,squadGame,turn} from '../tests/squad-fixtures.mjs';
import {profilePlan,setAutoPlan,saveTeamPreset} from '../web/js/auto-tactics.js';
import {autoOrder} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const s=squadGame(['pebbleturtle','axolotl','emberbird']);s.pets.push(E.makePet('cottonbun'));s.pets.forEach(p=>p.level=15);B.startBoss(s,1,()=>.5);
while(s.boss.run){const {reason,...o}=autoOrder(combatScene(s,'boss'));assert.ok(!turn(s,'boss',o).error);}
setAutoPlan(s,profilePlan('boss'));saveTeamPreset(s,0,'Thợ săn thủ vệ');s.team=['cottonbun','axolotl','emberbird'];setAutoPlan(s,profilePlan('sweep'));saveTeamPreset(s,1,'Dọn đường nhanh');setAutoPlan(s,profilePlan('safe'));saveTeamPreset(s,2,'Cùng nhau về đảo');
assert.ok(!E.startExpedition(s,'forest',()=>.5).error);assert.ok(!E.chooseRoute(s,0,()=>.5).error);s.expedition.battle.focus=3;assert.ok(!turn(s,'explore','pet:emberbird').error);E.validateSave(E.serialize(s));
const report={version,views:[],errors:[]},browser=await chromium.launch({headless:true});fs.mkdirSync('dist/screenshots',{recursive:true});
try{
  for(const [width,height]of [[320,640],[390,844],[768,1024],[1440,1000],[844,390]]){
    const c=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
    try{
      await p.addInitScript(({key,raw})=>{localStorage.setItem(key,raw);Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});await p.goto('http://127.0.0.1:4189');await p.evaluate(()=>document.fonts.ready);await p.locator('[data-action="active-battle"][data-id="explore"]').first().click();
      async function shot(phase,selector='#auto-planner',bottom=false){
        await p.locator(selector).evaluate((e,bottom)=>e.scrollTop=bottom?e.scrollHeight:0,bottom);const path=`dist/screenshots/tactics-${width}x${height}-${phase}-${version}.png`;await p.screenshot({path});
        const metrics=await p.locator(selector).evaluate(e=>({scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight}));assert.ok(metrics.scrollWidth<=metrics.clientWidth+1,`${width}/${phase}: horizontal overflow`);
        const targets=await p.locator(selector).locator(selector==='#auto-planner'?'button,select,input':'.auto-hud button,.auto-hud select').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {type:e.type,x:r.x,right:r.right,width:r.width,height:r.height};}));
        assert.ok(targets.every(r=>r.x>=0&&r.right<=width&&r.height>=(r.type==='checkbox'?22:44)&&r.width>=(r.type==='checkbox'?22:44)));report.views.push({width,height,phase,path,metrics,targets});
      }
      await shot('battle','#combat-stage');await p.locator('[data-duel="planner"]').click();await shot('plan');await shot('rules','#auto-planner',true);await p.locator('[data-tab="teams"]').click();await shot('teams');await shot('teams-bottom','#auto-planner',true);await p.locator('[data-tab="reports"]').click();await shot('report');await shot('report-bottom','#auto-planner',true);await p.locator('.auto-report-history').first().locator('summary').first().click();await shot('history-bottom','#auto-planner',true);
    }finally{await c.close();}
  }
  assert.deepEqual(report.errors,[]);report.completedAt=new Date().toISOString();fs.writeFileSync(`dist/AUTO-TACTICS-VISUAL-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(`${report.views.length} visual frames; five viewport sizes; no horizontal overflow or page errors.`);
}finally{await browser.close();}
