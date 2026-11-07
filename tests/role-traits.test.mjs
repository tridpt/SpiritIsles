import test from 'node:test';
import assert from 'node:assert/strict';
import {E,modes,squadReady,squadGame,getRun,getBattle,turn,unitHp,roundtrip} from './squad-fixtures.mjs';
import * as C from '../web/js/squad-combat.js';
import * as S from '../web/js/squad-state.js';
import {newTactics,petSkill} from '../web/js/tactics.js';
import {previewOrder} from '../web/js/combat-preview.js';
import {startDojo,dojoBattleTurn} from '../web/js/dojo-engine.js';

function arena(team=['pebbleturtle','axolotl','cottonbun']){
  const members=team.map(id=>({id,power:30})),r={members,hp:300,battle:{hp:300,round:1,tactics:newTactics(members)}};
  r.squad=S.newSquad(members,300);S.startSquadFight(r,['pebbleturtle','axolotl','emberbird'].map((species,i)=>({id:`enemy-${i}`,species})),300,300);return r;
}
const result=()=>({ward:0,absorbed:0,unitEvents:[]});
function damage(run,foe,options={}){const out=result();C.hitSquadEnemies(run,run.battle,10,{actor:'emberbird',order:{move:'pet:emberbird',foe},result:out,...options});return out;}
function cast(run,id,ally){return C.castSquadSkill(run,run.battle.tactics,id,{members:run.members,baseDamage:30,maxHp:300},ally?{ally}:{},result());}

test('Săn mồi checks the actual recipient at the 40% boundary and adds a deterministic 30%',()=>{
  for(const atBoundary of [true,false]){const r=arena(['emberbird']);r.squad.enemies[1].maxHp=100;r.squad.enemies[1].hp=atBoundary?40:41;const out=damage(r,'enemy-1');assert.equal(!!out.finisher,atBoundary);assert.equal(out.unitEvents.find(e=>e.kind==='damage').amount,atBoundary?9:7);}
});
test('Săn mồi follows interception and piercing, never ordinary attacks, burn, reflection, Hợp lực or the fire core',()=>{
  const base=arena(['emberbird']);base.squad.enemies[0].cover=2;base.squad.enemies[1].hp=20;
  assert.equal(damage(structuredClone(base),'enemy-1').finisher,undefined);
  assert.equal(damage(structuredClone(base),'enemy-1',{pierce:true}).finisher,true);
  for(const options of [{actor:undefined,order:{move:'attack',foe:'enemy-1'}},{order:{move:'skill'}},{tick:true},{reflected:true},{order:{move:'pet:emberbird',foe:'enemy-1',target:'core'},pierce:true}]){
    const r=structuredClone(base);r.squad.effects.burn='enemy-1';assert.equal(damage(r,'enemy-1',options).finisher,undefined);
  }
});
test('Khiêu khích redirects attacks aimed at another frontline unit and preserves redirected mitigation',()=>{
  const r=arena(['pebbleturtle','emberbird','cottonbun']);r.squad.allies[1].row='front';r.squad.allies[0].cover=2;
  const out=result();C.receiveSquadDamage(r,r.battle,30,{result:out});const hits=out.unitEvents.filter(e=>e.kind==='damage');
  assert.ok(hits.every(e=>e.target==='pebbleturtle'));assert.ok(C.enemySquadPlans(r.squad,0).every(p=>p.target==='pebbleturtle'));
  const foe=arena(['emberbird']);foe.squad.enemies[0].cover=2;foe.squad.enemies[1].row='front';const hit=damage(foe,'enemy-1').unitEvents.find(e=>e.kind==='damage');assert.equal(hit.target,'enemy-0');assert.equal(hit.amount,8);
});
test('Khiêu khích lasts two responses, ticks through interrupts, requires a frontline and is bypassed by pierce/area',()=>{
  const r=arena(),out=cast(r,'pebbleturtle','axolotl');assert.equal(out.taunted,true);assert.equal(r.squad.allies[0].cover,2);
  C.receiveSquadDamage(r,r.battle,0,{result:result(),skip:true});assert.equal(r.squad.allies[0].cover,1);
  C.receiveSquadDamage(r,r.battle,0,{result:result(),skip:true});assert.equal(r.squad.allies[0].cover,0);
  r.squad.allies[0].row='back';r.squad.allies[1].row='front';assert.equal(cast(r,'pebbleturtle').taunted,undefined);
  for(const options of [{pierce:true},{order:{move:'skill'}}]){const r=arena(['emberbird']);r.squad.enemies[0].cover=2;const events=damage(r,'enemy-1',options).unitEvents;assert.ok(!events.some(e=>e.kind==='cover'));assert.ok(events.some(e=>e.kind==='damage'&&e.target==='enemy-1'));}
});
test('a fallen taunter releases following blows immediately',()=>{
  const r=arena(['emberbird','axolotl','cottonbun']);r.squad.enemies[0].cover=2;r.squad.enemies[0].hp=1;const out=result();
  C.hitSquadEnemies(r,r.battle,60,{order:{move:'attack',foe:'enemy-1'},result:out});const hits=out.unitEvents.filter(e=>e.kind==='damage');assert.equal(hits[0].target,'enemy-0');assert.ok(hits.slice(1).every(e=>e.target==='enemy-1'));assert.equal(r.squad.enemies[0].cover,0);
});
test('Dưỡng hộ converts only the unused immediate heal, rounds down, caps wards and attributes the actual recipient',()=>{
  const r=arena(),u=r.squad.allies[1];u.hp-=3;const out=result();
  assert.equal(C.healSquadSkill(r,14,{actor:'axolotl',target:u.id,result:out}),3);assert.equal(out.overhealWard,5);assert.equal(u.ward,5);assert.equal(out.ward,5);
  assert.deepEqual(out.unitEvents[0],{side:'ally',kind:'heal',actor:'axolotl',target:'axolotl',amount:3});
  u.ward=Math.floor(u.maxHp*.6)-1;const capped=result();C.healSquadSkill(r,100,{actor:'axolotl',target:u.id,result:capped});assert.equal(capped.overhealWard,1);assert.equal(u.ward,Math.floor(u.maxHp*.6));
  const full=result();C.healSquadSkill(r,100,{actor:'axolotl',target:u.id,result:full});assert.equal(full.overhealWard,undefined);
});
test('Dưỡng hộ excludes drain, ordinary recovery, ticks and Hợp lực, and never revives a fallen ally',()=>{
  const r=arena(['flamefox','axolotl','mossfox']),u=r.squad.allies[1];
  for(const fn of [()=>C.healSquadSkill(r,50,{actor:'flamefox',target:u.id}),()=>C.healSquadSkill(r,50,{target:u.id}),()=>C.healSquad(r,50,{actor:'mossfox',target:u.id})]){fn();assert.equal(u.ward,0);}
  u.hp=0;const out=result();C.healSquadSkill(r,50,{actor:'axolotl',target:u.id,result:out,strict:true});assert.equal(u.hp,0);assert.equal(u.ward,0);assert.equal(out.overhealWard,undefined);
});
test('Tiếp sức picks a living teammate with the longest remaining cooldown and never reorders the squad',()=>{
  const r=arena(),before=r.squad.allies.map(u=>u.id),t=r.battle.tactics;t.cooldowns.pebbleturtle=3;t.cooldowns.axolotl=2;r.squad.allies[1].hp=1;
  const out=cast(r,'cottonbun');assert.equal(out.allyTarget,'pebbleturtle');assert.equal(out.haste,1);assert.equal(t.cooldowns.pebbleturtle,2);assert.equal(t.cooldowns.axolotl,2);assert.deepEqual(r.squad.allies.map(u=>u.id),before);
});
test('Tiếp sức respects manual choice and avoids self, fallen allies and negative cooldowns',()=>{
  const r=arena(),t=r.battle.tactics;t.cooldowns.pebbleturtle=3;t.cooldowns.axolotl=1;
  assert.equal(cast(r,'cottonbun','axolotl').hasteTarget,'axolotl');assert.equal(t.cooldowns.axolotl,0);assert.equal(t.cooldowns.pebbleturtle,3);
  assert.equal(cast(r,'cottonbun','cottonbun').haste,undefined);assert.equal(cast(r,'cottonbun','axolotl').haste,undefined);
  r.squad.allies[0].hp=0;assert.equal(cast(r,'cottonbun').allyTarget,'axolotl');assert.equal(cast(arena(['cottonbun']),'cottonbun').haste,undefined);
});

for(const mode of modes){
  test(`${mode}: healer preview and committed wards match, cost/turn occur once, and reload retains existing schema`,()=>{
    const s=squadReady(mode),r=getRun(s,mode),b=getBattle(s,mode),before=structuredClone(s),round=b.round??b.turn??r.turn;
    const order={move:'pet:axolotl',ally:'mossfox'},p=previewOrder(s,mode,order,'perfect');assert.deepEqual(s,before);assert.ok(p.overhealWard.min>0);assert.equal(p.allyTarget,'mossfox');
    const out=turn(s,mode,order,'perfect');assert.ok(out.overhealWard>=p.overhealWard.min&&out.overhealWard<=p.overhealWard.max);assert.equal((b.round??b.turn??r.turn),round+1);assert.equal(mode==='explore'?b.focus:r.focus,1);
    assert.ok(out.unitEvents.some(e=>e.kind==='ward'&&e.origin==='overheal'&&e.actor==='axolotl'&&e.target==='mossfox'));assert.equal(r.squad.version,1);assert.equal(Object.keys(r.squad.allies[0]).length,9);roundtrip(s);
  });
  test(`${mode}: support reduces an extra cooldown beyond normal turn passing and can prepare the next cast`,()=>{
    const s=squadReady(mode,['pebbleturtle','axolotl','cottonbun']),r=getRun(s,mode),b=getBattle(s,mode);b.tactics.cooldowns.axolotl=2;
    const out=turn(s,mode,{move:'pet:cottonbun',ally:'axolotl'});assert.equal(out.haste,1);assert.equal(b.tactics.cooldowns.axolotl,0);assert.equal(b.tactics.cooldowns.cottonbun,3);assert.equal(out.allyTarget,'axolotl');roundtrip(s);
    const next=turn(s,mode,'pet:axolotl');assert.ok(!next.error,next.error);roundtrip(s);
  });
  test(`${mode}: old active squad saves roundtrip without mutation and new role casts continue deterministically`,()=>{
    const original=squadReady(mode,['pebbleturtle','axolotl','cottonbun']),r=getRun(original,mode);r.squad.allies[0].cover=1;r.squad.allies[1].ward=4;getBattle(original,mode).tactics.cooldowns.axolotl=2;
    const loaded=roundtrip(original);assert.deepEqual(loaded,original);const a=turn(original,mode,'pet:cottonbun'),b=turn(loaded,mode,'pet:cottonbun');assert.deepEqual(a,b);assert.deepEqual(loaded,original);roundtrip(loaded);
  });
  test(`${mode}: invalid support targets reject atomically before effects, energy and random draws`,()=>{
    const s=squadReady(mode,['pebbleturtle','axolotl','cottonbun']);unitHp(s,mode,'allies',[0,20,20]);const before=structuredClone(s);
    const out=turn(s,mode,{move:'pet:cottonbun',ally:'pebbleturtle'});assert.ok(out.error);assert.deepEqual(s,before);
  });
}
test('a shelter branch adopts guard traits rather than overheal conversion',()=>{
  const s=squadGame();s.pets.find(p=>p.id==='axolotl').level=5;s.pets.find(p=>p.id==='axolotl').training={branch:'shelter',rank:1};E.setCombatRow(s,'axolotl','front');E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);s.expedition.battle.focus=3;
  const out=turn(s,'explore','pet:axolotl');assert.equal(out.taunted,true);assert.equal(out.overhealWard,undefined);roundtrip(s);
});
test('classic encounters and fixed dojo puzzles retain their original skills without role traits',()=>{
  const s=squadReady();delete s.expedition.squad;const out=turn(s,'explore','pet:axolotl');assert.equal(out.overhealWard,undefined);assert.equal(out.finisher,undefined);roundtrip(s);
  const d=squadGame();startDojo(d,'challenge','rhythm');dojoBattleTurn(d,'guard');dojoBattleTurn(d,'guard');const r=dojoBattleTurn(d,'pet:axolotl');assert.ok(!r.error,r.error);assert.equal(r.overhealWard,undefined);assert.equal(r.taunted,undefined);roundtrip(d);
});
