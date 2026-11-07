import test from 'node:test';
import assert from 'node:assert/strict';
import {E,turn,roundtrip} from './squad-fixtures.mjs';
import {forestFixture} from './forest-fixtures.mjs';
import {forestWarning,forestMotion,forestLootDelta} from '../web/js/forest-encounter.js';
import {combatScene} from '../web/js/combat-stage.js';
import {autoOrder} from '../web/js/auto-play.js';
import {profilePlan} from '../web/js/auto-tactics.js';

test('root warnings belong only to every third forest boss turn and survive serialization',()=>{
  const state=forestFixture({boss:true});
  for(let round=0;round<9;round++){state.expedition.battle.round=round;assert.equal(!!forestWarning(state.expedition),(round+1)%3===0);}
  const warning=forestWarning(state.expedition);assert.deepEqual(forestWarning(roundtrip(state).expedition),warning);
  state.expedition.biome='reef';assert.equal(forestWarning(state.expedition),null);
  assert.equal(forestWarning(forestFixture().expedition),null);assert.equal(forestWarning(forestFixture({travel:true}).expedition),null);assert.equal(forestWarning(null),null);
});
test('evading sacrifices an attack and energy gain to reduce a real boss hit',()=>{
  const state=forestFixture({boss:true,warning:true}),normal=structuredClone(state),energy=state.expedition.battle.focus;
  state.expedition.battle.tactics.ward=0;normal.expedition.battle.tactics.ward=0;
  const dodged=turn(state,'explore','evade'),struck=turn(normal,'explore','attack');
  assert.equal(dodged.error,undefined);assert.equal(dodged.evaded,true);assert.equal(dodged.forestWarning,'root-surge');assert.equal(dodged.damage,0);
  assert.equal(state.expedition.battle.hp,100);assert.equal(state.expedition.battle.focus,energy);assert.equal(state.expedition.battle.round,3);
  assert.ok(dodged.incoming<struck.incoming);assert.ok(dodged.incoming<=Math.ceil(struck.incoming*.2));assert.ok(struck.incoming>0);
  assert.deepEqual(state.resources,normal.resources);assert.equal(state.combatJournal.active.turns,1);assert.ok(roundtrip(state));
});
test('dodge neither builds break pressure nor consumes saved offensive bonuses',()=>{
  const state=forestFixture({boss:true,warning:true});Object.assign(state.expedition.battle.rhythm,{pressure:80,exposed:1});Object.assign(state.expedition.battle.strategy,{drive:1,riposte:1});
  state.expedition.battle.tactics.cooldowns.mossfox=2;
  const result=turn(state,'explore','evade');assert.equal(result.rhythm.staggered,false);assert.deepEqual(state.expedition.battle.rhythm,{pressure:80,exposed:1});
  assert.equal(state.expedition.battle.strategy.drive,1);assert.equal(state.expedition.battle.strategy.riposte,1);assert.equal(state.expedition.battle.tactics.cooldowns.mossfox,1);
});
test('root surges hit all living allies and do not get redirected by a front guard',()=>{
  const state=forestFixture({boss:true,warning:true,team:['pebbleturtle','axolotl','cottonbun']});
  state.expedition.battle.tactics.ward=0;state.expedition.squad.allies[0].cover=2;
  const result=turn(state,'explore','attack'),hits=result.unitEvents.filter(e=>e.side==='ally'&&e.kind==='damage'&&e.amount>0);
  assert.equal(new Set(hits.map(e=>e.target)).size,3);assert.ok(!result.unitEvents.some(e=>e.kind==='cover'));assert.ok(roundtrip(state));
});
test('dodge is not repeatable outside its warning and rejected moves never mutate or draw RNG',()=>{
  for(const state of [forestFixture(),forestFixture({boss:true}),forestFixture({boss:true,warning:true})]){
    if(forestWarning(state.expedition))turn(state,'explore','evade');
    const before=structuredClone(state);let draws=0;
    const result=E.battleTurn(state,'evade',()=>{draws++;return .5;});assert.ok(result.error);assert.equal(draws,0);assert.deepEqual(state,before);
  }
});
test('forged timing or target orders cannot improve a dodge or spend a turn',()=>{
  for(const [order,grade]of [['evade','perfect'],[{move:'evade',target:'roots'},'auto'],[{move:'evade',foe:'missing'},'auto']]){
    const state=forestFixture({boss:true,warning:true}),before=structuredClone(state);let draws=0;
    assert.ok(E.battleTurn(state,order,()=>{draws++;return .5;},grade).error);assert.equal(draws,0);assert.deepEqual(state,before);
  }
});
test('AUTO selects the same legal dodge for every strategy, including a low-health party',()=>{
  for(const profile of ['safe','sweep','boss']){
    const state=forestFixture({boss:true,warning:true}),plan=profilePlan(profile);
    state.expedition.squad.allies[0].hp=1;state.expedition.hp=state.expedition.squad.allies.reduce((n,u)=>n+u.hp,0);
    const {reason,...order}=autoOrder(combatScene(state,'explore'),{plan});assert.equal(order.move,'evade');assert.match(reason,/Rễ trồi/);assert.ok(!turn(state,'explore',order).error);
  }
});
test('AUTO returns to regular skills after the dodge and never fabricates perfect timing',()=>{
  const state=forestFixture({boss:true,warning:true}),{reason,...order}=autoOrder(combatScene(state,'explore'));
  const result=turn(state,'explore',order);assert.equal(result.rhythm.grade,'auto');assert.equal(forestWarning(state.expedition),null);assert.notEqual(autoOrder(combatScene(state,'explore')).move,'evade');
});
test('the new move works with a shared-health legacy forest save without converting it',()=>{
  const state=forestFixture({boss:true,warning:true});delete state.expedition.squad;const loaded=roundtrip(state),before=loaded.resources.gold;
  const result=turn(loaded,'explore','evade');assert.equal(result.evaded,true);assert.equal(loaded.expedition.squad,undefined);assert.equal(loaded.resources.gold,before);assert.ok(roundtrip(loaded));
});
test('warning metadata and visual effects do not add fields to persisted saves',()=>{
  const state=forestFixture({boss:true,warning:true}),keys=Object.keys(state.expedition.battle).sort();turn(state,'explore','evade');
  assert.deepEqual(Object.keys(state.expedition.battle).sort(),keys);assert.equal(state.version,1);assert.equal(E.SAVE_KEY,'spirit-isles-save-v1');assert.ok(roundtrip(state));
});
test('loot presentation contains only real positive engine changes and never mutates resources',()=>{
  const before={gold:55,food:20},after={gold:70,food:25,crystals:4};assert.deepEqual(forestLootDelta(before,after),{gold:15,food:5,crystals:4});assert.deepEqual(before,{gold:55,food:20});assert.deepEqual(after,{gold:70,food:25,crystals:4});
  assert.deepEqual(forestLootDelta({gold:50},{gold:20}),{});assert.deepEqual(forestLootDelta(),{});assert.deepEqual(forestLootDelta({}, {fake:999}),{});
});
test('different species and support roles have distinct motion without changing combat roles',()=>{
  assert.equal(forestMotion({id:'mossfox'}),'melee');assert.equal(forestMotion({id:'emberbird'}),'ranged');assert.equal(forestMotion({id:'axolotl'},'pet:axolotl'),'heal');assert.equal(forestMotion({id:'pebbleturtle'},'pet:pebbleturtle'),'guard');assert.equal(forestMotion({id:'cottonbun'},'pet:cottonbun'),'support');assert.equal(forestMotion({id:'mossfox'},'evade'),'evade');
});
