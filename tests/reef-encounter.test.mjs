import test from 'node:test';
import assert from 'node:assert/strict';
import {E,turn,roundtrip,unitHp} from './squad-fixtures.mjs';
import {reefFixture} from './reef-fixtures.mjs';
import {reefEvent,reefWarning,reefOpening,reefPatrol,reefSkin} from '../web/js/reef-encounter.js';
import {exploreEnemies} from '../web/js/combat-team.js';
import {enemyTeam} from '../web/js/combat-team.js';
import {startSquadFight} from '../web/js/squad-state.js';
import {enemySquadPlans} from '../web/js/squad-combat.js';
import {autoOrder,autoRoute} from '../web/js/auto-play.js';
import {combatScene} from '../web/js/combat-stage.js';
import {profilePlan} from '../web/js/auto-tactics.js';
import {available,placeItem,validateLayout} from '../web/js/island-layout.js';
import {creature} from '../web/js/art.js';
import {momentStatus,discoverMoment} from '../web/js/habitat-engine.js';

test('coastal routes exchange genuine combat strength for loot, without spending the bank',()=>{
  const safe=reefFixture({travel:true}),risk=structuredClone(safe),bank={...safe.resources};
  for(const s of [safe,risk]){s.expedition.squad.allies.forEach(u=>u.hp=20);s.expedition.hp=60;}
  E.chooseRoute(safe,0,()=>.5);E.chooseRoute(risk,1,()=>.5);
  assert.equal(safe.expedition.hp,72);assert.equal(risk.expedition.hp,60);
  assert.equal(safe.expedition.battle.power,Math.round(85*.58));assert.equal(risk.expedition.battle.power,Math.round(85*.58*1.3));
  assert.equal(risk.expedition.loot.crystals,10);assert.equal(safe.expedition.loot.crystals,undefined);assert.deepEqual(safe.resources,bank);assert.deepEqual(risk.resources,bank);roundtrip(safe);roundtrip(risk);
});
test('invalid coastal routes reject before healing, rewards or random draws',()=>{
  for(const boss of [false,true])for(const choice of [-1,2,NaN,'0',null]){
    const s=reefFixture({travel:true,boss}),before=structuredClone(s);let draws=0;
    assert.ok(E.chooseRoute(s,choice,()=>{draws++;return .5;}).error);assert.equal(draws,0);assert.deepEqual(s,before);
  }
});
test('patrol species and roles survive reload and always include guard, jelly and healer',()=>{
  const s=reefFixture(),r=s.expedition;assert.equal(reefPatrol(r),true);assert.equal(r.squad.enemies.length,3);
  assert.deepEqual(r.squad.enemies.map(u=>u.role),['guard','attack','heal']);
  assert.equal(r.squad.enemies[0].row,'front');assert.equal(r.squad.enemies[2].row,'back');
  assert.deepEqual(exploreEnemies(roundtrip(s).expedition),exploreEnemies(r));assert.deepEqual(r.squad.enemies.map(u=>reefSkin(r,u).kind),['crab','jelly','clam']);
});
test('crab shields while the jelly charges, without fake hits or offensive retaliation',()=>{
  const s=reefFixture();const r=turn(s,'explore','guard');
  assert.ok(r.unitEvents.some(e=>e.actor==='enemy-0'&&e.kind==='ward'&&e.amount>0));
  assert.ok(r.unitEvents.some(e=>e.actor==='enemy-1'&&e.kind==='charge'));
  assert.ok(!r.unitEvents.some(e=>e.actor==='enemy-1'&&e.kind==='damage'));roundtrip(s);
});
test('jelly discharge hits all living allies on its advertised second turn',()=>{
  const s=reefFixture();s.expedition.battle.round=1;s.expedition.battle.tactics.ward=0;
  s.expedition.squad.allies[0].cover=2;const r=turn(s,'explore','guard');
  const hits=r.unitEvents.filter(e=>e.actor==='enemy-1'&&e.side==='ally'&&e.kind==='damage');
  assert.equal(new Set(hits.map(e=>e.target)).size,3);assert.ok(hits.some(e=>e.amount>0));roundtrip(s);
});
test('rear healer restores a wounded patrol member and a defeated healer never acts',()=>{
  const s=reefFixture();unitHp(s,'explore','enemies',[15,30,30]);const r=turn(s,'explore','charge');
  assert.ok(r.enemyHeal>0);assert.ok(r.unitEvents.some(e=>e.actor==='enemy-2'&&e.kind==='heal'));
  const down=reefFixture();unitHp(down,'explore','enemies',[15,30,0]);const d=turn(down,'explore','charge');assert.ok(!d.unitEvents.some(e=>e.actor==='enemy-2'));roundtrip(s);roundtrip(down);
});
test('jelly telegraphs remain tied to rounds across reload and ignore dead units',()=>{
  const s=reefFixture();for(let round=0;round<6;round++){
    const plans=enemySquadPlans(s.expedition.squad,round,true);assert.equal(plans[1].kind,['charge','skill','attack'][round%3]);
  }
  unitHp(s,'explore','enemies',[35,0,30]);assert.ok(!enemySquadPlans(roundtrip(s).expedition.squad,1,true).some(p=>p.actor==='enemy-1'));
});
test('boss wave warnings occur every third turn and never in other encounters',()=>{
  const s=reefFixture({boss:true});for(let round=0;round<9;round++){s.expedition.battle.round=round;assert.equal(!!reefWarning(s.expedition),(round+1)%3===0);}
  assert.deepEqual(reefWarning(roundtrip(s).expedition),reefWarning(s.expedition));
  assert.equal(reefWarning(reefFixture().expedition),null);assert.equal(reefWarning(reefFixture({travel:true}).expedition),null);assert.equal(reefWarning(null),null);
});
test('wave dodge spends one turn, keeps energy, deals no attack and reduces a real area hit',()=>{
  const s=reefFixture({boss:true,warning:true}),hit=structuredClone(s);s.expedition.battle.tactics.ward=0;hit.expedition.battle.tactics.ward=0;
  const energy=s.expedition.battle.focus,r=turn(s,'explore','evade'),struck=turn(hit,'explore','attack');
  assert.equal(r.evaded,true);assert.equal(r.reefWarning,'tidal-wave');assert.equal(r.damage,0);assert.equal(s.expedition.battle.focus,energy);assert.equal(s.expedition.battle.round,3);assert.ok(r.incoming<struck.incoming*.25);
  assert.equal(r.reefOpened,true);assert.equal(reefOpening(s.expedition),true);assert.equal(s.combatJournal.active.turns,1);roundtrip(s);
});
test('an exposed crab receives a real damage bonus once, including after reload',()=>{
  let s=reefFixture({boss:true,warning:true});turn(s,'explore','evade');s=roundtrip(s);
  const normal=structuredClone(s);normal.expedition.battle.rhythm.exposed=0;
  const r=turn(s,'explore','attack'),n=turn(normal,'explore','attack');assert.ok(r.damage>n.damage);assert.equal(r.rhythm.exposed,true);assert.equal(reefOpening(s.expedition),false);roundtrip(s);
});
test('forged dodge grades and repeated dodges do not mutate saves or consume RNG',()=>{
  for(const grade of ['perfect','good','normal']){const s=reefFixture({boss:true,warning:true}),before=structuredClone(s);let draws=0;assert.ok(E.battleTurn(s,'evade',()=>{draws++;return .5;},grade).error);assert.equal(draws,0);assert.deepEqual(s,before);}
  const s=reefFixture({boss:true,warning:true});turn(s,'explore','evade');const before=structuredClone(s);assert.ok(turn(s,'explore','evade').error);assert.deepEqual(s,before);
});
test('all AUTO profiles dodge the wave and choose the safe coast',()=>{
  for(const profile of ['safe','sweep','boss']){const s=reefFixture({boss:true,warning:true}),{reason,...order}=autoOrder(combatScene(s,'explore'),{plan:profilePlan(profile)});assert.equal(order.move,'evade');assert.match(reason,/Sóng triều/);assert.ok(!turn(s,'explore',order).error);}
  const s=reefFixture({travel:true});assert.equal(autoRoute(s).choice,0);assert.equal(reefEvent(s.expedition).choices.length,2);
});
test('legacy coastal patrols retain their exact species, health and original format',()=>{
  const s=reefFixture(),r=s.expedition;r.battle.enemy='Tinh Linh Đi Lạc';
  const old=enemyTeam({element:'water',seed:r.started+r.stage*7,count:3});startSquadFight(r,old,100,100);const loaded=roundtrip(s);
  assert.equal(reefPatrol(loaded.expedition),false);assert.deepEqual(exploreEnemies(loaded.expedition),old);assert.deepEqual(loaded.expedition.squad,r.squad);
});
test('legacy shared-health coastal boss can dodge without adding a squad',()=>{
  const s=reefFixture({boss:true,warning:true});delete s.expedition.squad;const loaded=roundtrip(s),r=turn(loaded,'explore','evade');assert.equal(r.evaded,true);assert.equal(loaded.expedition.squad,undefined);roundtrip(loaded);
});
test('region decorations unlock at 1, 3 and 5 successful trips and survive placement',()=>{
  const s=E.newGame(),layout={version:1,nextId:1,placed:[]};
  for(const [type,n,x]of [['coralgarden',1,0],['pearllamp',3,2],['coralcrab',5,4]]){s.clears.reef=n-1;assert.equal(available(s,type),false);assert.ok(placeItem(s,layout,type,x,0).error);s.clears.reef=n;assert.equal(available(s,type),true);assert.ok(!placeItem(s,layout,type,x,0).error);}
  s.islandLayout=layout;validateLayout(s);assert.deepEqual(roundtrip(s).islandLayout,layout);
});
test('Ngoc Trieu is a cosmetic for water pets after three clears and never alters pet power',()=>{
  const s=E.newGame(),power=E.petPower(s.pets[1]);assert.doesNotMatch(creature('axolotl',{source:s}),/reef-tide-adornment/);s.clears.reef=3;
  assert.match(creature('axolotl',{source:s}),/reef-tide-adornment/);assert.doesNotMatch(creature('mossfox',{source:s}),/reef-tide-adornment/);assert.equal(E.petPower(s.pets[1]),power);
});
test('coral garden connects regional rewards to a discoverable water-pet memory only once',()=>{
  const s=E.newGame();s.clears.reef=3;s.pets[1].bond=15;s.islandLayout={version:1,nextId:1,placed:[]};
  placeItem(s,s.islandLayout,'coralgarden',0,0);assert.equal(momentStatus(s,'axolotl','coral-song').canPlay,true);assert.equal(momentStatus(s,'axolotl','pearl-tide').canPlay,false);
  placeItem(s,s.islandLayout,'pearllamp',1,0);assert.equal(momentStatus(s,'axolotl','pearl-tide').canPlay,true);
  assert.equal(discoverMoment(s,'axolotl','pearl-tide').isNew,true);assert.equal(discoverMoment(s,'axolotl','pearl-tide').isNew,false);roundtrip(s);
});
test('a full coastal AUTO trip banks one payout and unlocks the coral garden',()=>{
  const s=reefFixture({travel:true,level:20}),gold=s.resources.gold;let turns=0;
  while(s.expedition&&turns++<150){if(s.expedition.battle){const {reason,...order}=autoOrder(combatScene(s,'explore'));assert.ok(!turn(s,'explore',order).error);}else E.chooseRoute(s,autoRoute(s).choice,()=>.5);if(s.expedition)roundtrip(s);}
  assert.equal(s.expedition,null);assert.equal(s.clears.reef,1);assert.equal(s.combatJournal.reports.length,5);assert.ok(s.resources.gold>gold);const bank={...s.resources};assert.ok(E.finishExpedition(s,true).error);assert.deepEqual(s.resources,bank);assert.equal(available(s,'coralgarden'),true);
});
