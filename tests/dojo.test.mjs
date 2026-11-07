import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { B } from './legacy-combat.mjs';
import { D } from './legacy-combat.mjs';
import { newDojo } from '../web/js/dojo-state.js';
import { CHALLENGES, PRACTICE_ENEMIES, DOJO_MILESTONES, totalStars, goalState } from '../web/js/dojo-data.js';
import { previewOrder } from '../web/js/combat-preview.js';
import { DOJO_PLANS, solveDojo, dojoProgress } from './dojo-fixtures.mjs';

const outside=s=>{const c=structuredClone(s);delete c.dojo;return c;};
const valid=s=>E.validateSave(E.serialize(s));
const turn=(s,a,g='perfect')=>{const r=D.dojoBattleTurn(s,a,Date.now(),g);assert.equal(r.error,undefined);return r;};

test('1.10 saves migrate a missing dojo and preserve active real journeys byte for byte',()=>{
  for(const mode of ['idle','explore','boss']){const s=E.newGame();s.level=3;if(mode==='explore'){E.startExpedition(s,'forest',()=>.3);E.chooseRoute(s,0,()=>.3);}if(mode==='boss')B.startBoss(s,1,()=>.3);delete s.dojo;const imported=valid(s);assert.deepEqual(imported.dojo,newDojo());assert.deepEqual(outside(imported),s);}
});
test('practice starts all seven targets, tries locked paths and never changes the real team or resource economy',()=>{
  const s=E.newGame(),before=outside(s);
  for(const e of PRACTICE_ENEMIES){assert.ok(D.startDojo(s,'practice',e.id,{emberbird:'shatter',axolotl:'shelter'}).run);valid(s);assert.equal(D.dojoMembers(s.dojo.run)[2].training.rank,3);turn(s,'pet:emberbird');valid(s);D.stopDojo(s);valid(s);assert.deepEqual(outside(s),before);assert.equal(s.dojo.lastResult.stars,0);assert.deepEqual(s.dojo.lastResult.reward,{});}
});
test('practice may coexist with and cannot advance a real boss battle or expedition',()=>{
  for(const mode of ['explore','boss']){const s=E.newGame();s.level=3;if(mode==='boss')B.startBoss(s,1,()=>.4);else{E.startExpedition(s,'forest',()=>.4);E.chooseRoute(s,0,()=>.4);}const before=outside(s);D.startDojo(s,'practice','phoenix');for(let i=0;i<4;i++)turn(s,'guard');assert.deepEqual(outside(s),before);assert.deepEqual(outside(valid(s)),before);D.stopDojo(s);assert.deepEqual(outside(s),before);}
});
test('invalid arena starts and orders reject atomically, including prototype ids and premature challenge unlocks',()=>{
  const s=E.newGame(),initial=structuredClone(s);
  for(const args of [['practice','missing'],['practice','__proto__'],['challenge','armor'],['invalid','plain'],['practice','plain',{emberbird:'shelter'}]]){assert.ok(D.startDojo(s,...args).error);assert.deepEqual(s,initial);}
  D.startDojo(s,'practice','frost');const before=structuredClone(s);
  for(const a of [{move:'attack',target:'core'},{move:'attack',stance:'missing'},'pet:forestking','missing']){assert.ok(D.dojoBattleTurn(s,a).error);assert.deepEqual(s,before);}
  assert.ok(D.startDojo(s,'practice','plain').error);assert.deepEqual(s,before);
});
test('arena save roundtrips preserve the exact random stream, cooldowns, intent and next turn',()=>{
  for(const e of PRACTICE_ENEMIES){let s=E.newGame();D.startDojo(s,'practice',e.id);turn(s,'guard');s=valid(s);const other=valid(s),a=turn(s,'attack'),b=turn(other,'attack');assert.deepEqual(a,b);assert.deepEqual(s.dojo,other.dojo);valid(s);}
});
test('previewing every practice mode uses real deterministic rules without rewards, RNG or objective side effects',()=>{
  for(const e of PRACTICE_ENEMIES){const s=E.newGame();D.startDojo(s,'practice',e.id,{emberbird:'burn'});const before=structuredClone(s),p=previewOrder(s,'dojo','pet:emberbird','perfect');assert.equal(p.error,undefined);assert.equal(p.exact,true);assert.deepEqual(s,before);const r=turn(s,'pet:emberbird');for(const key of ['damage','incoming','heal','ward','burnApplied'])assert.equal(p[key].min,r[key]||0);assert.equal(p.hpAfter.min,D.dojoHealth(s.dojo.run).hp);valid(s);}
});
for(const c of CHALLENGES)test(`${c.id}: the three-star solution is reachable with the loan team and saveable after every action`,()=>{
  const s=dojoProgress(CHALLENGES.indexOf(c)),before=outside(s),r=solveDojo(s,c.id);assert.equal(r.status,'victory');assert.equal(r.stars,7);assert.equal(s.dojo.records[c.id].stars,7);assert.equal(r.first,true);const after=outside(s);after.resources.tickets-=1;after.resources.gold-=r.reward.gold;assert.deepEqual(after,before);valid(s);
});
test('stars accumulate per objective across victories and replay never repeats first-clear resources or XP',()=>{
  let s=E.newGame();D.startDojo(s,'challenge','rhythm');while(s.dojo.run)turn(s,'guard');assert.equal(s.dojo.lastResult.stars,3);assert.equal(s.dojo.records.rhythm.stars,3);const before=outside(s);
  D.startDojo(s,'challenge','rhythm');turn(s,'guard');turn(s,'charge');turn(s,'skill');assert.equal(s.dojo.lastResult.stars,5);assert.equal(s.dojo.records.rhythm.stars,7);assert.equal(s.dojo.lastResult.newStars,4);assert.equal(totalStars(s),3);assert.deepEqual(outside(s),before);
  s=valid(s);solveDojo(s,'rhythm');assert.equal(s.dojo.lastResult.newStars,0);assert.equal(s.dojo.lastResult.first,false);assert.deepEqual(s.dojo.lastResult.reward,{});assert.deepEqual(outside(s),before);
});
test('stopping or losing never records objective stars, unlocks another challenge or grants loot',()=>{
  for(const stop of [true,false]){const s=E.newGame(),before=outside(s);D.startDojo(s,'challenge','rhythm');if(stop){turn(s,'guard');D.stopDojo(s);}else{const b=s.dojo.run.sandbox.expedition;b.hp=1;turn(s,'attack','normal');}assert.deepEqual(s.dojo.records,{});assert.equal(s.dojo.lastResult.stars,0);assert.deepEqual(outside(s),before);valid(s);assert.ok(D.startDojo(s,'challenge','armor').error);}
});
test('perfect guards only count actual enemy attacks; charge and stagger idle turns cannot farm the objective',()=>{
  const s=E.newGame();D.startDojo(s,'practice','frost');turn(s,'guard');assert.equal(s.dojo.run.metrics.parries,1);turn(s,'guard');assert.equal(s.dojo.run.metrics.parries,1);const r=turn(s,'guard');assert.equal(r.rhythm.staggered,true);assert.equal(s.dojo.run.metrics.parries,1);valid(s);
});
test('the 60-turn practice limit ends safely without rewards, while a killing blow at the limit still wins',()=>{
  for(const kill of [false,true]){const s=E.newGame(),before=outside(s);D.startDojo(s,'practice','plain',{axolotl:'shelter'});const run=s.dojo.run;run.metrics.turns=59;run.sandbox.expedition.battle.round=59;if(kill)run.sandbox.expedition.battle.hp=1;const r=turn(s,kill?'attack':'pet:axolotl');assert.equal(r.dojoResult.status,kill?'victory':'defeat');if(!kill)assert.equal(r.dojoResult.hp,0);assert.equal(r.dojoResult.metrics.turns,60);assert.deepEqual(outside(s),before);valid(s);}
});
test('report totals separate burn ticks from a pet skill and retain the chosen trial branch snapshot',()=>{
  const s=E.newGame();D.startDojo(s,'practice','treant',{emberbird:'burn',axolotl:'shelter'});turn(s,'pet:emberbird');turn(s,'guard');const burn=s.dojo.run.sandbox.boss.run.tactics.burn.amount,r=turn(s,'pet:axolotl');assert.equal(s.dojo.run.metrics.actors.axolotl.damage,Math.max(0,r.damage-burn));D.stopDojo(s);assert.equal(s.dojo.lastResult.actors.axolotl.training.branch,'shelter');valid(s);
});
test('core timing, no-revival, no-freeze and no-counter goals evaluate actual battle events',()=>{
  const s=dojoProgress();assert.equal(s.dojo.lastResult.metrics.coreBreakTurn,4);for(const c of CHALLENGES){const m=s.dojo.lastResult.metrics;for(const g of c.goals){if(g.metric==='coreBreakTurn')assert.equal(goalState(g,{...m,coreBreakTurn:7},'victory').status,false);if(['revives','frozen','armorCounters'].includes(g.metric))assert.equal(goalState(g,{...m,[g.metric]:1},'victory').status,false);}}assert.equal(totalStars(s),24);
});
test('star rewards are one-time durable claims and cosmetics can only be equipped after earning their milestones',()=>{
  const empty=E.newGame();for(const m of DOJO_MILESTONES)assert.ok(D.claimDojoMilestone(empty,m.stars).error);assert.ok(D.setDojoCosmetic(empty,'aura',true).error);assert.ok(D.setDojoCosmetic(empty,'title','master').error);
  const s=dojoProgress();for(const m of DOJO_MILESTONES){const before=structuredClone(s.resources);assert.equal(D.claimDojoMilestone(s,m.stars).stars,m.stars);for(const [k,n]of Object.entries(m.reward))assert.equal(s.resources[k],before[k]+n);const after=structuredClone(s);assert.ok(D.claimDojoMilestone(s,m.stars).error);assert.deepEqual(s,after);valid(s);}assert.deepEqual(s.dojo.cosmetics,{title:'master',aura:true,decoration:true});assert.deepEqual(valid(s).dojo,s.dojo);D.setDojoCosmetic(s,'title',null);D.setDojoCosmetic(s,'aura',false);D.setDojoCosmetic(s,'decoration',false);valid(s);
});
test('malformed present arena data is rejected, including recursive hosts and report member injection',()=>{
  const cases=[s=>s.dojo=null,s=>s.dojo.records={unknown:{stars:1,wins:1,bestTurns:1}},s=>s.dojo.records={rhythm:{stars:2,wins:1,bestTurns:1}},s=>s.dojo.claimed=[24],s=>s.dojo.claimed=[3,3],s=>s.dojo.cosmetics.title='master',s=>s.dojo.run={kind:'practice',id:'__proto__'},s=>{D.startDojo(s,'practice','plain');s.dojo.run.sandbox.dojo=newDojo();},s=>{D.startDojo(s,'practice','plain');s.dojo.run.metrics.parries=1;},s=>{D.startDojo(s,'practice','plain');s.dojo.run.metrics.turns=2;},s=>{D.startDojo(s,'practice','plain');s.dojo.run.rng=0;},s=>{D.startDojo(s,'practice','plain');D.stopDojo(s);s.dojo.lastResult.team[0]='<script>';},s=>{D.startDojo(s,'practice','plain');D.stopDojo(s);s.dojo.lastResult.actors.mossfox.power=-1;},s=>{D.startDojo(s,'practice','plain');D.stopDojo(s);s.dojo.lastResult.first=true;},s=>{D.startDojo(s,'practice','plain');D.stopDojo(s);s.dojo.lastResult.reward={tickets:999};}];
  for(const mutate of cases){const s=E.newGame();mutate(s);assert.throws(()=>valid(s));}
});
