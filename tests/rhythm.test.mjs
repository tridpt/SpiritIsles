import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { B } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import * as T from '../web/js/tactics.js';
import { SPECIES } from '../web/js/data.js';
import { rhythmPosition,rhythmGrade,newRhythm,prepareRhythm } from '../web/js/combat-rhythm.js';
import { ruinsEncounter,ruinsIntent } from '../web/js/ruins-data.js';

const modes=['explore','ruins','boss'],copy=structuredClone,now=1800000000000;
const battle=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run?.battle:s.expedition?.battle;
const run=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run:s.expedition;
const turn=(s,m,action='attack',grade='auto')=>m==='boss'?B.bossBattleTurn(s,action,now,grade):m==='ruins'?R.ruinsBattleTurn(s,action,now,grade):E.battleTurn(s,action,()=>.5,grade);
const roundtrip=s=>E.validateSave(E.serialize(s,now),now);
function ready(m){
  const s=E.newGame(now);s.level=2;s.resources.food=10000;
  if(m==='boss')B.startBoss(s,1,()=>.4,now);
  else if(m==='ruins'){R.startRuins(s,1,()=>.4,now);R.chooseRuinsPath(s,s.ruins.run.paths.find(id=>id!=='spring'),now);}
  else{E.startExpedition(s,'forest',()=>.1,now);E.chooseRoute(s,0,()=>.1);}
  battle(s,m).tactics.ward=0;return s;
}
test('timing travels at a fixed speed, repeats without a deadline and has inclusive good/perfect boundaries',()=>{
  assert.deepEqual([0,300,600,1200,1800,2400].map(rhythmPosition),[0,.25,.5,1,.5,0]);
  for(const n of [.43,.5,.57])assert.equal(rhythmGrade(n),'perfect');
  for(const n of [.3,.42,.58,.7])assert.equal(rhythmGrade(n),'good');
  for(const n of [0,.29,.71,1,NaN,Infinity,-1,2])assert.equal(rhythmGrade(n),'normal');
  assert.equal(rhythmPosition(-50),0);assert.equal(rhythmPosition(2400600),.5);
});
test('fast actions retain the existing strength and never generate free break pressure in any mode',()=>{
  for(const m of modes){const s=ready(m),other=copy(s);const a=turn(s,m),b=turn(other,m,'attack','auto');assert.deepEqual(a,b);assert.deepEqual(s,other);assert.deepEqual(battle(s,m)?.rhythm,newRhythm());}
});
test('timed attacks change real damage and gain exactly 8, 20 or 34 pressure in every combat mode',()=>{
  for(const m of modes){const s=ready(m),results=['normal','good','perfect'].map(g=>{const p=copy(s),r=turn(p,m,'attack',g);assert.equal(battle(p,m)?.rhythm.pressure,{normal:8,good:20,perfect:34}[g]);roundtrip(p);return r;});assert.ok(results[0].damage<results[1].damage);assert.ok(results[1].damage<results[2].damage);}
});
test('a perfect guard blocks 90 percent, improving on good and ordinary guards against heavy attacks',()=>{
  for(const m of modes){const s=ready(m),b=battle(s,m);if(m==='explore')b.round=2;else b.turn=m==='boss'?3:2;
    const results=['normal','good','perfect'].map(g=>turn(copy(s),m,'guard',g));
    assert.ok(results[0].incoming>results[1].incoming,m);assert.ok(results[1].incoming>results[2].incoming,m);
  }
});
test('breaking stance skips the enemy intent, saves the remainder and exposes one following action',()=>{
  for(const m of modes){const s=ready(m),b=battle(s,m);b.rhythm.pressure=68;
    const r=turn(s,m,'guard','perfect');assert.equal(r.rhythm.staggered,true);assert.equal(r.incoming,0);assert.equal(r.absorbed,0);assert.deepEqual(battle(s,m).rhythm,{pressure:2,exposed:1});
    const plain=copy(s);battle(plain,m).rhythm.exposed=0;
    const next=turn(s,m),base=turn(plain,m);assert.ok(next.damage>base.damage,m);assert.equal(next.rhythm.exposed,true);assert.equal(battle(s,m)?.rhythm.exposed,0);roundtrip(s);
  }
});
test('a stance break cancels boss shielding, ruins healing and energy drain instead of only zeroing damage',()=>{
  const s=ready('boss');s.boss.run.turn=1;s.boss.run.rhythm.pressure=68;turn(s,'boss','guard','perfect');assert.equal(s.boss.run.shield,0);
  const checked=new Set();
  for(let floor=1;floor<=50;floor++){
    const p=ready('ruins'),r=p.ruins.run;r.floor=floor;r.cleared=floor-1;r.path=floor%5===0?'boss':'normal';r.battle.turn=1;r.battle.rhythm.pressure=68;r.focus=1;
    const e=ruinsEncounter(r),intent=ruinsIntent(r);if(!['mend','drain','ward'].includes(intent.id))continue;
    r.battle.hp=e.maxHp-10;r.battle.shield=0;const result=turn(p,'ruins','guard','perfect');assert.equal(r.phase,'battle');assert.equal(result.enemyHeal,undefined);assert.equal(result.incoming,0);assert.equal(r.focus,2);assert.equal(r.battle.shield,0);checked.add(intent.id);
  }
  assert.deepEqual([...checked].sort(),['drain','mend','ward']);
});
test('healing, regeneration and ward skills use timing support together with existing gear and caps',()=>{
  for(const m of modes){const s=ready(m),r=run(s,m);r.hp=20;if(m==='explore')r.battle.focus=3;else r.focus=3;
    const normal=turn(copy(s),m,'pet:axolotl','normal'),perfect=turn(copy(s),m,'pet:axolotl','perfect');assert.ok(perfect.heal>normal.heal,m);
  }
  const members=[{id:'pebbleturtle',power:30,gear:{heal:0,ward:20}}],a=T.newTactics(members),b=copy(a);
  const ordinary=T.castPetSkill(a,'pebbleturtle',{members,baseDamage:30,maxHp:100}),perfect=T.castPetSkill(b,'pebbleturtle',{members,baseDamage:30,maxHp:100,support:1.25});assert.ok(perfect.ward>ordinary.ward);assert.ok(b.ward<=60);
});
test('legacy active saves add only missing rhythm; malformed present states cannot clear pressure or exposure',()=>{
  for(const m of modes){const s=ready(m),old=copy(s);delete battle(old,m).rhythm;assert.deepEqual(roundtrip(old),s);
    for(const bad of [null,false,[],{pressure:100,exposed:0},{pressure:-1,exposed:0},{pressure:1.5,exposed:0},{pressure:0,exposed:2},{pressure:0},{pressure:0,exposed:0,extra:1}]){const p=copy(s);battle(p,m).rhythm=bad;assert.throws(()=>roundtrip(p));}
  }
});
test('invalid timing and blocked skills do not spend pressure, exposure, RNG, energy or effects',()=>{
  for(const m of modes){const s=ready(m);battle(s,m).rhythm={pressure:92,exposed:1};const original=copy(s);
    assert.ok(turn(s,m,'attack','legendary').error);assert.deepEqual(s,original);
    assert.ok(turn(s,m,'pet:axolotl','perfect').error);assert.deepEqual(s,original);
    assert.ok(turn(s,m,'pet:missing','perfect').error);assert.deepEqual(s,original);
  }
});
test('pressure, exposure and future timed turns survive serialization without changing seeded loot',()=>{
  for(const m of modes){const s=ready(m);battle(s,m).rhythm={pressure:88,exposed:1};const saved=roundtrip(s);
    for(const [action,grade]of [['guard','perfect'],['attack','good']]){assert.deepEqual(turn(s,m,action,grade),turn(saved,m,action,grade));assert.deepEqual(s,saved);roundtrip(s);}
  }
});
test('all 58 individual skills work with perfect timing and leave a valid bounded save',()=>{
  for(const species of SPECIES){const s=E.newGame(now);s.level=2;s.pets=[E.makePet(species.id,now)];s.team=[species.id];B.startBoss(s,1,()=>.3,now);s.boss.run.focus=3;s.boss.run.hp=15;s.boss.run.rhythm.pressure=80;
    const result=turn(s,'boss',`pet:${species.id}`,'perfect');assert.ok(!result.error,species.id);assert.ok(result.rhythm.staggered);roundtrip(s);
  }
});
test('a perfect finishing blow pays one reward and repeated submissions cannot pay or consume again',()=>{
  const s=ready('boss');s.boss.run.phase=3;s.boss.run.enemyHp=1;const result=turn(s,'boss','attack','perfect');assert.equal(result.result.status,'victory');const won=copy(s);assert.ok(turn(s,'boss','attack','perfect').error);assert.deepEqual(s,won);assert.equal(s.forge.items.length,1);
});
