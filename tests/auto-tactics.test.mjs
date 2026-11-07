import test from 'node:test';
import assert from 'node:assert/strict';
import {E,R,B,modes,squadReady,squadGame,getRun,getBattle,turn,unitHp,roundtrip} from './squad-fixtures.mjs';
import {AUTO_PROFILES,profilePlan,setAutoPlan,saveTeamPreset,applyTeamPreset} from '../web/js/auto-tactics.js';
import {currentCombatReport} from '../web/js/combat-report.js';
import {autoOrder} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
import {newEnemyAI} from '../web/js/enemy-tactics.js';
import {awakeningFixture} from './awakening-fixtures.mjs';
import {startDojo,dojoBattleTurn} from '../web/js/dojo-engine.js';
import {previewOrder} from '../web/js/combat-preview.js';

const order=(s,m='explore',plan=s.autoTactics.plan)=>{const {reason,...o}=autoOrder(combatScene(s,m),{plan});assert.ok(reason);return o;};
const sum=(r,k)=>r.members.reduce((n,m)=>n+m[k],r.shared[k]);
test('1.19 saves gain default settings and an empty journal without touching active combat',()=>{
  const s=squadReady(),before=structuredClone(s.expedition);delete s.autoTactics;delete s.combatJournal;const restored=roundtrip(s);
  assert.deepEqual(restored.expedition,before);assert.deepEqual(restored.autoTactics.plan,profilePlan('safe'));assert.deepEqual(restored.autoTactics.slots,[null,null,null]);assert.deepEqual(restored.combatJournal,{version:1,active:null,reports:[]});
});
test('three profiles have real choices: attack stance, healing threshold, boss ultimates and target priorities',()=>{
  const s=squadReady();unitHp(s,'explore','allies',[15,30,30]);const before=structuredClone(s);
  assert.equal(order(s,'explore',profilePlan('sweep')).stance,'assault');assert.equal(order(s,'explore',profilePlan('safe')).move,'pet:axolotl');assert.notEqual(order(s,'explore',profilePlan('sweep')).move,'pet:axolotl');
  const scene=structuredClone(combatScene(s,'explore'));scene.strategy.stance='assault';assert.equal(autoOrder(scene,{plan:profilePlan('safe')}).stance,'balanced');assert.deepEqual(s,before);
});
test('custom healing priorities honor the exact percentage and ignore fallen allies',()=>{
  const s=squadReady();unitHp(s,'explore','allies',[13,33,0]);const plan={...profilePlan(),healAt:40};
  assert.equal(order(s,'explore',plan).move,'pet:axolotl');plan.healAt=30;assert.notEqual(order(s,'explore',plan).move,'pet:axolotl');plan.healAt=0;assert.notEqual(order(s,'explore',plan).move,'pet:axolotl');
  unitHp(s,'explore','allies',[0,33,0]);assert.notEqual(order(s,'explore',{...plan,healAt:80}).move,'pet:mossfox');
});
test('disabling interrupt removes special interrupt priority while preserving legal ordinary decisions',()=>{
  const s=squadReady();s.expedition.battle.enemyAI=newEnemyAI('caster');const p=profilePlan();assert.equal(order(s,'explore',p).move,'skill');p.interrupt=false;assert.equal(order(s,'explore',p).move,'pet:emberbird');assert.ok(!turn(s,'explore',order(s,'explore',p)).error);roundtrip(s);
});
test('reserve ultimate gates ordinary fights, exploration bosses, ruins bosses and guardians',()=>{
  for(const kind of ['normal','exploreBoss','ruinsBoss','guardian']){
    const s=awakeningFixture(true);let mode='explore';
    if(kind==='guardian'){mode='boss';B.startBoss(s,1,()=>.3);s.boss.run.focus=3;}
    else if(kind==='ruinsBoss'){mode='ruins';R.startRuins(s,1,()=>.3);Object.assign(s.ruins.run,{floor:5,cleared:4,paths:['boss']});s.ruins.best=4;s.ruins.clears=4;R.chooseRuinsPath(s,'boss');s.ruins.run.focus=3;}
    else {E.startExpedition(s,'forest',()=>.1);if(kind==='exploreBoss')s.expedition.stage=3;E.chooseRoute(s,0,()=>.1);s.expedition.battle.focus=3;}
    const scene=combatScene(s,mode),before=structuredClone(s),reserved=autoOrder(scene,{plan:profilePlan('boss')});
    assert.equal(reserved.move.startsWith('awaken:'),kind!=='normal',`${kind}: ${reserved.move}`);
    assert.ok(!autoOrder(scene,{plan:{...profilePlan(),ultimate:'never'}}).move.startsWith('awaken:'));assert.deepEqual(s,before);
  }
});
test('preset slots snapshot ordered pets, rows and policy, restore atomically and leave gear/training alone',()=>{
  const s=squadGame(['pebbleturtle','axolotl','emberbird']);E.setCombatRow(s,'emberbird','front');setAutoPlan(s,{...profilePlan('boss'),healAt:70});
  const saved=saveTeamPreset(s,0,'  Săn rễ  ');assert.equal(saved.slot.name,'Săn rễ');const snapshot=structuredClone(saved.slot),pets=structuredClone(s.pets),forge=structuredClone(s.forge);
  s.team=['axolotl'];s.battleFormation.rows.emberbird='back';setAutoPlan(s,profilePlan('sweep'));assert.deepEqual(s.autoTactics.slots[0],snapshot);
  assert.ok(!applyTeamPreset(s,0).error);assert.deepEqual(s.team,snapshot.team);assert.equal(s.battleFormation.rows.emberbird,'front');assert.deepEqual(s.autoTactics.plan,snapshot.plan);assert.deepEqual(s.pets,pets);assert.deepEqual(s.forge,forge);roundtrip(s);
});
test('presets cannot change active journeys or practice; failures never mutate the save',()=>{
  for(const m of [...modes,'dojo']){
    const s=m==='dojo'?squadGame():squadReady(m);if(m==='dojo')startDojo(s,'practice','plain');saveTeamPreset(s,0,'Đội A');const before=structuredClone(s);assert.ok(applyTeamPreset(s,0).error);assert.deepEqual(s,before);roundtrip(s);
  }
  const s=squadGame();for(const [slot,name]of [[-1,'A'],[3,'B'],[1,''],[1,'a'.repeat(33)]]){const before=structuredClone(s);assert.ok(saveTeamPreset(s,slot,name).error);assert.deepEqual(s,before);}
});
test('present malformed tactics and slots are rejected, not replaced with defaults',()=>{
  for(const change of [s=>s.autoTactics=null,s=>s.autoTactics.plan.healAt=81,s=>s.autoTactics.plan.interrupt=1,s=>s.autoTactics.plan.ultimate='fake',s=>s.autoTactics.slots=[],s=>s.autoTactics.slots[0].team.push('voiddragon'),s=>s.autoTactics.slots[0].rows={mossfox:'back',axolotl:'back',emberbird:'back'},s=>s.autoTactics.slots[0].name='x'.repeat(33)]){
    const s=squadGame();saveTeamPreset(s,0,'Đội thử');change(s);assert.throws(()=>roundtrip(s),/AUTO/);
  }
});
for(const mode of modes)test(`${mode}: real unit events account for damage/heal/ward/received/blocked and persist exactly across reload`,()=>{
  let s=squadReady(mode);unitHp(s,mode,'allies',mode==='boss'?[20,40,40]:[8,25,25]);let totals={damage:0,heal:0,ward:0,taken:0,blocked:0};
  for(let i=0;i<3&&combatScene(s,mode);i++){
    const r=turn(s,mode,order(s,mode));assert.ok(!r.error);totals.damage+=(r.damage||0)+(r.reflected||0);totals.heal+=r.heal||0;totals.ward+=r.ward||0;totals.taken+=r.incoming||0;totals.blocked+=r.absorbed||0;
    const report=r.combatReport||currentCombatReport(s,mode);assert.ok(report);for(const [k,n]of Object.entries(totals))assert.equal(sum(report,k),n,`${mode}/${i}/${k}`);
    const after=roundtrip(s);assert.deepEqual(after.combatJournal,s.combatJournal);s=after;
  }
});
test('a normal pet skill credits its caster; Hợp lực and status ticks stay in shared effects',()=>{
  const s=squadReady();let r=turn(s,'explore','pet:emberbird'),report=currentCombatReport(s,'explore');assert.equal(report.members.find(m=>m.id==='emberbird').casts,1);assert.equal(report.members.find(m=>m.id==='emberbird').damage,r.unitEvents.filter(e=>e.actor==='emberbird'&&e.side==='enemy'&&e.kind==='damage').reduce((n,e)=>n+e.amount,0));
  const damage=report.members.map(m=>m.damage);s.expedition.battle.focus=3;r=turn(s,'explore','skill');report=r.combatReport||currentCombatReport(s,'explore');assert.deepEqual(report.members.map(m=>m.damage),damage);assert.ok(report.shared.damage>0);roundtrip(s);
});
test('a status-tick kill archives once and never credits an uncast skill',()=>{
  const s=squadReady();s.expedition.squad.enemies.forEach((u,i)=>u.hp=i?0:1);s.expedition.battle.hp=1;s.expedition.squad.effects.burn='enemy-0';s.expedition.battle.tactics.burn={amount:5,turns:1};
  const r=turn(s,'explore','pet:emberbird');assert.equal(r.won,true);assert.equal(r.combatReport.turns,1);assert.equal(sum(r.combatReport,'casts'),0);assert.equal(r.combatReport.shared.damage,1);assert.equal(s.combatJournal.reports.length,1);const before=structuredClone(s);assert.ok(turn(s,'explore').error);assert.deepEqual(s,before);roundtrip(s);
});
test('downs preserve the first actual victim and cause, even when survivors are revived after victory',()=>{
  const s=squadReady('boss');unitHp(s,'boss','allies',[50,50,1]);turn(s,'boss','attack');const j=currentCombatReport(s,'boss');assert.ok(j.downs.some(d=>d.id==='emberbird'));assert.equal(j.downs[0].turn,1);
  const snapshot=structuredClone(j.downs);s.boss.run.enemyHp=1;s.boss.run.squad.enemies[0].hp=1;const won=turn(s,'boss','attack');assert.equal(won.combatReport.status,'victory');assert.deepEqual(won.combatReport.downs,snapshot);roundtrip(s);
});
test('retreat preserves a partial report and never grants extra rewards',()=>{
  for(const m of modes){const s=squadReady(m);turn(s,m,'attack');const resources=structuredClone(s.resources);const r=m==='explore'?E.finishExpedition(s,false,()=>.5,Date.now(),true):m==='boss'?B.retreatBoss(s):R.retreatRuins(s);assert.ok(!r.error);assert.equal(s.combatJournal.active,null);assert.equal(s.combatJournal.reports[0].status,'retreat');for(const [k,v]of Object.entries(resources))assert.equal(s.resources[k],v+(m==='explore'?r.reward[k]||0:0));roundtrip(s);}
});
test('journal retains eight complete fights and a reloaded active fight cannot duplicate turns or rewards',()=>{
  let s=squadGame();s.pets.forEach(p=>p.level=30);
  for(let fight=0;fight<10;fight++){E.startExpedition(s,'forest',()=>.1,Date.now()+fight);E.chooseRoute(s,0,()=>.1);for(let n=0;s.expedition?.battle&&n<30;n++){const r=turn(s,'explore',order(s));assert.ok(!r.error);s=roundtrip(s);}E.finishExpedition(s,false,()=>.5,Date.now(),true);}
  assert.equal(s.combatJournal.reports.length,8);assert.equal(s.combatJournal.active,null);assert.ok(s.combatJournal.reports.every(r=>r.status==='victory'));assert.equal(new Set(s.combatJournal.reports.map(r=>r.id)).size,8);
});
test('old in-progress fights start partial reporting, with honest recorded-turn numbers',()=>{
  const s=squadReady();turn(s,'explore');delete s.combatJournal;const restored=roundtrip(s);turn(restored,'explore');const j=currentCombatReport(restored,'explore');assert.equal(j.partial,true);assert.equal(j.turns,1);roundtrip(restored);
});
test('preview and practice cannot mutate the real battle journal',()=>{
  const s=squadReady('boss'),original=structuredClone(s);previewOrder(s,'boss',{move:'attack',stance:'balanced',target:'body'},'auto');assert.deepEqual(s,original);startDojo(s,'practice','plain');const outside=structuredClone(s.combatJournal);dojoBattleTurn(s,'attack');assert.deepEqual(s.combatJournal,outside);assert.equal(s.dojo.run.sandbox.combatJournal.active.turns,1);roundtrip(s);
});
test('corrupt report metrics, units, status, histories and down orders are rejected',()=>{
  for(const change of [s=>s.combatJournal=null,s=>s.combatJournal.active.members[0].damage=-1,s=>s.combatJournal.active.shared.heal=Infinity,s=>s.combatJournal.active.downs=[{id:'fake',turn:1}],s=>s.combatJournal.active.status='victory',s=>s.combatJournal.reports=Array(9).fill(s.combatJournal.active)]){const s=squadReady();turn(s,'explore');change(s);assert.throws(()=>roundtrip(s),/Báo cáo/);}
});
for(const profile of Object.keys(AUTO_PROFILES))test(`${profile}: every mode completes with legal skills, cooldowns and save data`,()=>{
  for(const m of modes){let s=squadReady(m);setAutoPlan(s,profilePlan(profile));let n=0;while(combatScene(s,m)&&n++<160){const o=order(s,m),r=turn(s,m,o);assert.ok(!r.error,`${profile}/${m}: ${r.error}`);s=roundtrip(s);}assert.ok(n<160);assert.equal(s.combatJournal.active,null);assert.equal(s.combatJournal.reports.length,1);}
});
