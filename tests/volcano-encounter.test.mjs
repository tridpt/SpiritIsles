import test from 'node:test';
import assert from 'node:assert/strict';
import {E,turn,roundtrip,unitHp} from './squad-fixtures.mjs';
import {volcanoFixture} from './volcano-fixtures.mjs';
import {volcanoEvent,volcanoWarning,volcanoOpening,volcanoPatrol,volcanoSkin,VOLCANO_ENEMIES,VOLCANO_ARMOR} from '../web/js/volcano-encounter.js';
import {exploreEnemies,enemyTeam} from '../web/js/combat-team.js';
import {startSquadFight} from '../web/js/squad-state.js';
import {enemySquadPlans} from '../web/js/squad-combat.js';
import {autoOrder,autoRoute} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
import {profilePlan} from '../web/js/auto-tactics.js';
import {available,placeItem,validateLayout} from '../web/js/island-layout.js';
import {creature} from '../web/js/art.js';
import {momentStatus,discoverMoment} from '../web/js/habitat-engine.js';

test('volcanic safe and risky routes bank different rewards, heal and scale real opponents',()=>{
  const safe=volcanoFixture({travel:true}),risk=structuredClone(safe),bank={...safe.resources};
  for(const s of [safe,risk]){s.expedition.squad.allies.forEach(u=>u.hp=20);s.expedition.hp=60;}
  E.chooseRoute(safe,0,()=>.5);E.chooseRoute(risk,1,()=>.5);
  assert.equal(safe.expedition.hp,74);assert.equal(risk.expedition.hp,60);assert.equal(safe.expedition.battle.power,Math.round(145*.58));assert.equal(risk.expedition.battle.power,Math.round(145*.58*1.35));
  assert.equal(safe.expedition.loot.food,12);assert.equal(risk.expedition.loot.crystals,14);assert.deepEqual(safe.resources,bank);assert.deepEqual(risk.resources,bank);roundtrip(safe);roundtrip(risk);
});
test('invalid volcanic routes reject before all mutations and random draws',()=>{
  for(const boss of [false,true])for(const choice of [-1,2,NaN,'0',null]){const s=volcanoFixture({travel:true,boss}),before=structuredClone(s);let draws=0;assert.ok(E.chooseRoute(s,choice,()=>{draws++;return .5;}).error);assert.equal(draws,0);assert.deepEqual(s,before);}
});
test('volcanic patrol identities, roles and distinct skins survive save validation',()=>{
  const s=roundtrip(volcanoFixture()),r=s.expedition;assert.equal(volcanoPatrol(r),true);assert.deepEqual(exploreEnemies(r),VOLCANO_ENEMIES);assert.deepEqual(r.squad.enemies.map(u=>u.role),['guard','attack','attack']);assert.deepEqual(r.squad.enemies.map(u=>volcanoSkin(r,u).kind),['golem','wolf','bird']);
});
test('golem shields an ally and firebird charges instead of inventing damage',()=>{
  const s=volcanoFixture(),r=turn(s,'explore','charge');assert.ok(r.unitEvents.some(e=>e.actor==='enemy-0'&&e.kind==='ward'));assert.ok(r.unitEvents.some(e=>e.actor==='enemy-2'&&e.kind==='charge'));assert.ok(!r.unitEvents.some(e=>e.actor==='enemy-2'&&e.kind==='damage'));roundtrip(s);
});
test('wolf targets the weakest back-row ally past taunt, while personal wards still protect',()=>{
  const s=volcanoFixture({team:['pebbleturtle','axolotl','emberbird']});unitHp(s,'explore','allies',[38,25,10]);const r=s.expedition;
  r.squad.allies[0].cover=2;r.squad.allies[2].ward=10;
  const p=enemySquadPlans(r.squad,0,false,true).find(p=>p.actor==='enemy-1');assert.equal(p.target,'emberbird');
  const result=turn(s,'explore','charge'),hit=result.unitEvents.find(e=>e.actor==='enemy-1'&&e.side==='ally'&&e.kind==='damage');assert.equal(hit.target,'emberbird');assert.ok(hit.absorbed>0);assert.ok(!result.unitEvents.some(e=>e.kind==='cover'));roundtrip(s);
});
test('dead volcanic enemies never act or enter advertised plans',()=>{
  const s=volcanoFixture();unitHp(s,'explore','enemies',[35,0,0]);const plans=enemySquadPlans(s.expedition.squad,0,false,true);assert.deepEqual(plans.map(p=>p.actor),['enemy-0']);const r=turn(s,'explore','charge');assert.ok(!r.unitEvents.some(e=>['enemy-1','enemy-2'].includes(e.actor)));roundtrip(s);
});
test('volcanic warnings follow saved turns, with different slam, breath and lava telegraphs',()=>{
  const s=volcanoFixture({boss:true});const ids=[];for(let round=0;round<8;round++){s.expedition.battle.round=round;ids.push(volcanoWarning(roundtrip(s).expedition)?.id||null);}
  assert.deepEqual(ids,[null,'stone-slam','lava-eruption','fire-breath',null,'stone-slam',null,'fire-breath']);assert.equal(volcanoWarning(null),null);assert.equal(volcanoWarning(volcanoFixture({travel:true}).expedition),null);
});
test('lava is real environmental area damage and remains after a perfect stagger',()=>{
  const s=volcanoFixture({round:2});s.expedition.battle.rhythm.pressure=90;
  const r=turn(s,'explore','guard','perfect');assert.equal(r.rhythm.staggered,true);assert.equal(r.enemyAttacked,false);assert.ok(r.lavaDamage>0);assert.equal(r.incoming,r.lavaDamage);assert.ok(r.unitEvents.filter(e=>e.side==='ally'&&e.kind==='damage').every(e=>!e.actor));roundtrip(s);
});
test('moving to safe stone spends exactly one turn and no attack or energy',()=>{
  const s=volcanoFixture({round:2}),hit=structuredClone(s);const energy=s.expedition.battle.focus,armor=s.expedition.battle.volcano.armor;
  const r=turn(s,'explore','evade'),struck=turn(hit,'explore','attack');assert.equal(r.evaded,true);assert.equal(r.damage,0);assert.equal(r.volcanoWarning,'lava-eruption');assert.ok(r.lavaDamage<struck.lavaDamage*.25);assert.equal(s.expedition.battle.focus,energy);assert.equal(s.expedition.battle.round,3);assert.equal(s.expedition.battle.volcano.armor,armor);assert.equal(s.combatJournal.active.turns,1);roundtrip(s);
});
test('both dragon warnings strike the whole living team and dodging reduces actual damage',()=>{
  for(const round of [1,3]){const s=volcanoFixture({boss:true,round}),hit=structuredClone(s);const r=turn(s,'explore','evade'),struck=turn(hit,'explore','attack');assert.ok(r.incoming<struck.incoming*.3);assert.equal(new Set(struck.unitEvents.filter(e=>e.side==='ally'&&e.kind==='damage').map(e=>e.target)).size,3);roundtrip(s);roundtrip(hit);}
});
test('normal hits chip armor while Hợp lực breaks it and opens two damaging actions',()=>{
  const a=volcanoFixture({boss:true}),b=structuredClone(a);const normal=turn(a,'explore','attack'),burst=turn(b,'explore','skill');assert.ok(normal.volcanoArmorDamage>0);assert.ok(burst.volcanoArmorDamage>normal.volcanoArmorDamage);assert.equal(burst.volcanoArmorBroken,true);assert.equal(b.expedition.battle.volcano.armor,0);assert.equal(volcanoOpening(b.expedition),2);assert.ok(burst.damage>0);roundtrip(a);roundtrip(b);
});
test('saved weakness gives a real bonus and is not spent by charge or a warning dodge',()=>{
  let s=volcanoFixture({boss:true});turn(s,'explore','skill');s=roundtrip(s);turn(s,'explore','evade');assert.equal(volcanoOpening(s.expedition),2);
  s.expedition.battle.round=4;turn(s,'explore','charge');assert.equal(volcanoOpening(s.expedition),2);const plain=structuredClone(s);plain.expedition.battle.volcano.opening=0;
  const exposed=turn(s,'explore','attack'),normal=turn(plain,'explore','attack');assert.equal(exposed.volcanoWeakness,true);assert.ok(exposed.damage>normal.damage);if(s.expedition){assert.equal(volcanoOpening(s.expedition),1);roundtrip(s);}
});
test('forged and repeated volcanic dodges reject without mutation or RNG draws',()=>{
  for(const round of [0,1,2,3])for(const grade of ['perfect','good','normal']){const s=volcanoFixture({boss:true,round}),before=structuredClone(s);let draws=0;assert.ok(E.battleTurn(s,'evade',()=>{draws++;return .5;},grade).error);assert.equal(draws,0);assert.deepEqual(s,before);}
  const s=volcanoFixture({round:2});turn(s,'explore','evade');const before=structuredClone(s);assert.ok(turn(s,'explore','evade').error);assert.deepEqual(s,before);
});
test('armor save metadata rejects forged, invalid and cross-region states',()=>{
  for(const value of [{version:1,armor:-1,opening:0},{version:1,armor:46,opening:0},{version:1,armor:1,opening:1},{version:1,armor:0,opening:3},{version:2,armor:45,opening:0},null]){const s=volcanoFixture({boss:true});s.expedition.battle.volcano=value;assert.throws(()=>roundtrip(s),/Giáp/);}
  const s=volcanoFixture();s.expedition.battle.volcano.armor=1;assert.throws(()=>roundtrip(s),/Giáp/);
});
test('AUTO profiles dodge every volcano hazard, choose safe travel and preserve input state',()=>{
  for(const profile of ['safe','sweep','boss'])for(const round of [1,2,3]){const s=volcanoFixture({boss:true,round}),before=structuredClone(s);const {reason,...order}=autoOrder(combatScene(s,'explore'),{plan:profilePlan(profile)});assert.deepEqual(s,before);assert.equal(order.move,'evade');assert.match(reason,/Né/);assert.ok(!turn(s,'explore',order).error);}
  const s=volcanoFixture({travel:true});assert.equal(autoRoute(s).choice,0);assert.equal(volcanoEvent(s.expedition).choices.length,2);
});
test('AUTO shatters armor, heals low allies first and then exploits weakness',()=>{
  const s=volcanoFixture({boss:true});let o=autoOrder(combatScene(s,'explore'));assert.equal(o.move,'skill');turn(s,'explore',(({reason,...order})=>order)(o));s.expedition.battle.round=4;s.expedition.battle.focus=3;unitHp(s,'explore','allies',s.expedition.squad.allies.map(u=>u.maxHp));
  o=autoOrder(combatScene(s,'explore'));assert.match(o.reason,/điểm yếu/);assert.equal(o.move,'skill');
  const low=volcanoFixture({boss:true});unitHp(low,'explore','allies',[34,5,33]);o=autoOrder(combatScene(low,'explore'));assert.equal(o.move,'pet:axolotl');assert.equal(o.ally,'axolotl');
});
test('old volcanic squad and shared-health saves retain exact identities and no new mechanics',()=>{
  for(const shared of [false,true]){const s=volcanoFixture(),r=s.expedition;delete r.battle.volcano;r.battle.enemy='Tinh Linh Đi Lạc';
    if(shared)delete r.squad;else startSquadFight(r,enemyTeam({element:'fire',seed:r.started,count:3}),100,100);
    const loaded=roundtrip(s);assert.deepEqual(loaded.expedition,r);assert.equal(volcanoPatrol(loaded.expedition),false);assert.equal(volcanoWarning(loaded.expedition),null);assert.ok(!turn(loaded,'explore','attack').error);roundtrip(loaded);}
});
test('volcanic decorations unlock at 1, 3 and 5 wins and memories are discovered once',()=>{
  const s=E.newGame(),layout={version:1,nextId:1,placed:[]};s.islandLayout=layout;s.pets[2].bond=15;
  for(const [type,n,x]of [['hotspring',1,0],['lavatree',3,2],['stonedragon',5,4]]){s.clears.volcano=n-1;assert.equal(available(s,type),false);assert.ok(placeItem(s,layout,type,x,0).error);s.clears.volcano=n;assert.ok(!placeItem(s,layout,type,x,0).error);}
  validateLayout(s);assert.equal(momentStatus(s,'emberbird','warm-spring').canPlay,true);assert.equal(momentStatus(s,'emberbird','ember-blossom').canPlay,true);assert.equal(discoverMoment(s,'emberbird','ember-blossom').isNew,true);assert.equal(discoverMoment(s,'emberbird','ember-blossom').isNew,false);roundtrip(s);
});
test('Than Hong appearance applies only to Fire pets after 3 wins without changing power',()=>{
  const s=E.newGame(),power=E.petPower(s.pets[2]);assert.doesNotMatch(creature('emberbird',{source:s}),/volcano-ember-adornment/);s.clears.volcano=3;assert.match(creature('emberbird',{source:s}),/volcano-ember-adornment/);assert.doesNotMatch(creature('axolotl',{source:s}),/volcano-ember-adornment/);assert.equal(E.petPower(s.pets[2]),power);
});
test('full volcanic AUTO journey saves every turn, makes five reports and pays only once',()=>{
  const s=volcanoFixture({travel:true,level:20}),gold=s.resources.gold;let steps=0;
  while(s.expedition&&steps++<180){if(s.expedition.battle){const {reason,...order}=autoOrder(combatScene(s,'explore'));assert.ok(!turn(s,'explore',order).error);}else E.chooseRoute(s,autoRoute(s).choice,()=>.5);if(s.expedition)roundtrip(s);}
  assert.equal(s.expedition,null);assert.equal(s.clears.volcano,1);assert.equal(s.combatJournal.reports.length,5);assert.ok(s.resources.gold>gold);const bank={...s.resources};assert.ok(E.finishExpedition(s,true).error);assert.deepEqual(s.resources,bank);assert.equal(available(s,'hotspring'),true);
});
