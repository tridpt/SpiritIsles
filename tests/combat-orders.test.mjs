import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { B } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import { SPECIES } from '../web/js/data.js';
import { newStrategy } from '../web/js/combat-orders.js';
import { previewOrder } from '../web/js/combat-preview.js';
import { ruinsEncounter, ruinsIntent } from '../web/js/ruins-data.js';

const now=1800000000000, modes=['explore','ruins','boss'], copy=structuredClone;
const battle=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run?.battle:s.expedition?.battle;
const run=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run:s.expedition;
const focus=(s,m,n)=>{if(m==='explore')s.expedition.battle.focus=n;else run(s,m).focus=n;};
const turn=(s,m,a='attack',g='auto',rng=()=>.5)=>m==='boss'?B.bossBattleTurn(s,a,now,g):m==='ruins'?R.ruinsBattleTurn(s,a,now,g):E.battleTurn(s,a,rng,g);
const roundtrip=s=>E.validateSave(E.serialize(s,now),now);
function ready(m,team){
  const s=E.newGame(now);s.level=2;s.resources.food=10000;
  if(team){s.team=team;s.pets=team.map(id=>E.makePet(id,now));}
  if(m==='boss')B.startBoss(s,1,()=>.4,now);
  else if(m==='ruins'){R.startRuins(s,1,()=>.4,now);R.chooseRuinsPath(s,s.ruins.run.paths.find(id=>id!=='spring'),now);}
  else{E.startExpedition(s,'forest',()=>.1,now);E.chooseRoute(s,0,()=>.1);}
  battle(s,m).tactics.ward=0;return s;
}

test('each stance has a real damage and survival tradeoff in all three modes',()=>{
  for(const m of modes){
    const s=ready(m),r={};battle(s,m).shield=0;if(m==='ruins')s.ruins.run.members.forEach(member=>member.power=10);
    for(const stance of ['balanced','assault','guarded'])r[stance]=turn(copy(s),m,{move:'attack',stance});
    assert.ok(r.assault.damage>r.balanced.damage&&r.balanced.damage>r.guarded.damage,m);
    assert.ok(r.assault.incoming>r.balanced.incoming&&r.balanced.incoming>r.guarded.incoming,m);
    assert.ok(Math.abs(r.assault.damage/r.balanced.damage-1.25)<.06,m);
    assert.ok(Math.abs(r.guarded.incoming/r.balanced.incoming-.8)<.06,m);
  }
});
test('committed stances persist and legacy string actions use the saved stance',()=>{
  for(const m of modes){
    const s=ready(m);turn(s,m,{move:'guard',stance:'guarded'});assert.equal(battle(s,m).strategy.stance,'guarded');
    const loaded=roundtrip(s),explicit=copy(s);assert.deepEqual(turn(loaded,m,'attack'),turn(explicit,m,{move:'attack',stance:'guarded'}));assert.deepEqual(loaded,explicit);
  }
});
test('taking a risk to charge grants two energy without attack damage, pressure or spent exposure',()=>{
  for(const m of modes){
    const s=ready(m),b=battle(s,m);b.rhythm={pressure:99,exposed:1};const baseline=turn(copy(s),m,'attack');
    const r=turn(s,m,'charge','perfect');assert.equal(r.damage,0,m);assert.equal(r.strategy.charged,true);assert.equal(r.rhythm.grade,'auto');
    assert.deepEqual(b.rhythm,{pressure:99,exposed:1});assert.equal(b.strategy.drive,1);assert.equal(m==='explore'?b.focus:run(s,m).focus,2);
    assert.ok(r.incoming>baseline.incoming,m);roundtrip(s);
    const saved=copy(s);assert.ok(turn(s,m,'charge').error);assert.deepEqual(s,saved);
  }
});
test('a charge survives guards and pure support, and powers exactly one offensive action',()=>{
  for(const m of modes){
    const s=ready(m,['mossfox','honeyhamster','emberbird']),b=battle(s,m);b.strategy.drive=1;b.strategy.riposte=1;
    turn(s,m,'guard');assert.equal(b.strategy.drive,1);assert.equal(b.strategy.riposte,1);
    focus(s,m,3);const support=turn(s,m,'pet:honeyhamster');assert.equal(support.strategy.driveUsed,false);assert.equal(support.strategy.riposteUsed,false);assert.equal(b.strategy.drive,1);assert.equal(b.strategy.riposte,1);
    const plain=copy(s);battle(plain,m).strategy.drive=0;battle(plain,m).strategy.riposte=0;
    const burst=turn(s,m),normal=turn(plain,m);assert.ok(burst.damage>normal.damage*1.7,m);assert.equal(b.strategy.drive,0);assert.equal(b.strategy.riposte,0);
    assert.equal(burst.strategy.driveUsed,true);assert.equal(burst.strategy.riposteUsed,true);roundtrip(s);
  }
});
test('perfect guards only prepare a riposte when an enemy actually attacks',()=>{
  for(const m of modes){
    const s=ready(m),b=battle(s,m),r=turn(s,m,'guard','perfect');assert.equal(r.strategy.parried,true,m);assert.equal(b.strategy.riposte,1);
    const plain=copy(s);battle(plain,m).strategy.riposte=0;const riposte=turn(s,m),base=turn(plain,m);assert.ok(riposte.damage>base.damage*1.15,m);assert.equal(b.strategy.riposte,0);
    for(const grade of ['auto','normal','good']){const a=ready(m);turn(a,m,'guard',grade);assert.equal(battle(a,m).strategy.riposte,0);}
    const broken=ready(m);battle(broken,m).rhythm.pressure=68;const cancelled=turn(broken,m,'guard','perfect');assert.equal(cancelled.rhythm.staggered,true);assert.equal(cancelled.strategy.parried,false);assert.equal(battle(broken,m).strategy.riposte,0);
  }
  const s=ready('boss');s.boss.run.turn=2;const r=turn(s,'boss','guard','perfect');assert.equal(r.incoming,0);assert.equal(r.strategy.parried,false);assert.equal(s.boss.run.strategy.riposte,0);
  let found=false;
  for(let floor=1;floor<50;floor++){
    const s=ready('ruins'),r=s.ruins.run;r.floor=floor;r.battle.turn=1;if(ruinsIntent(r).id!=='mend')continue;
    r.battle.hp=ruinsEncounter(r).maxHp;const out=turn(s,'ruins','guard','perfect');assert.equal(out.strategy.parried,false);assert.equal(r.battle.strategy.riposte,0);found=true;break;
  }
  assert.equal(found,true);
});
test('targeting living roots trades half body damage to stop all root healing',()=>{
  const s=ready('boss');Object.assign(s.boss.run,{phase:2,roots:2,enemyHp:180,turn:0});
  const body=copy(s),root=copy(s),a=turn(body,'boss','attack'),b=turn(root,'boss',{move:'attack',target:'roots'});
  assert.equal(a.rootsCut,1);assert.equal(b.rootsCut,2);assert.equal(body.boss.run.roots,1);assert.equal(root.boss.run.roots,0);
  assert.ok(Math.abs(b.damage*2-a.damage)<=1);assert.equal(a.enemyHeal,6);assert.ok(!b.enemyHeal);roundtrip(body);roundtrip(root);
  const next=turn(root,'boss','attack');assert.equal(next.rootsCut,0);
});
test('unavailable targets and malformed orders are atomic and never advance random draws',()=>{
  for(const m of modes){
    const s=ready(m);battle(s,m).tactics.burn={amount:4,turns:2};battle(s,m).strategy={stance:'balanced',drive:1,riposte:1};const original=copy(s);
    const bad=[null,false,5,[],{}, {move:'attack',extra:true},{move:'attack',stance:'rush'},{move:'attack',stance:null},{move:'attack',target:'face'},{move:'guard',target:'roots'},{move:'attack',target:'roots'},'charge',{move:'skill',stance:'assault'},{move:'pet:missing',stance:'guarded'}];
    for(const order of bad){let calls=0;assert.ok(turn(s,m,order,'perfect',()=>{calls++;return .5;}).error,JSON.stringify(order));assert.equal(calls,0);assert.deepEqual(s,original);}
  }
  const s=ready('boss');Object.assign(s.boss.run,{phase:2,roots:2,enemyHp:180});
  for(const move of ['guard','charge']){const saved=copy(s);assert.ok(turn(s,'boss',{move,target:'roots'}).error);assert.deepEqual(s,saved);}
});
test('legacy fights gain only absent strategy and reject malformed present data',()=>{
  for(const m of modes){
    const s=ready(m),old=copy(s);delete battle(old,m).strategy;assert.deepEqual(roundtrip(old),s);assert.deepEqual(battle(s,m).strategy,newStrategy());
    for(const value of [null,false,[],{}, {stance:'balanced',drive:0},{stance:'balanced',drive:0,riposte:0,extra:1},{stance:'attack',drive:0,riposte:0},{stance:'balanced',drive:2,riposte:0},{stance:'balanced',drive:0,riposte:-1},{stance:'balanced',drive:true,riposte:0}]){const broken=copy(s);battle(broken,m).strategy=value;assert.throws(()=>roundtrip(broken));}
  }
});
test('drive, riposte and stance survive reload without rerolling damage or granting rewards twice',()=>{
  for(const m of modes){
    const s=ready(m);battle(s,m).strategy={stance:'guarded',drive:1,riposte:1};const loaded=roundtrip(s);
    assert.deepEqual(turn(s,m,{move:'attack',stance:'assault'},'perfect'),turn(loaded,m,{move:'attack',stance:'assault'},'perfect'));assert.deepEqual(loaded,s);roundtrip(s);
  }
});
test('boss and ruin previews match the real turn exactly while leaving saves and RNG untouched',()=>{
  for(const m of ['boss','ruins'])for(const move of ['attack','guard','charge','skill','pet:axolotl','pet:emberbird','pet:pebbleturtle'])for(const stance of ['balanced','assault','guarded']){
    const s=ready(m,move==='pet:pebbleturtle'?['mossfox','pebbleturtle','emberbird']:undefined);focus(s,m,3);run(s,m).hp=35;battle(s,m).strategy.riposte=1;
    const order={move,stance},original=copy(s),preview=previewOrder(s,m,order,'perfect');assert.ok(!preview.error);assert.deepEqual(s,original);
    const real=turn(copy(s),m,order,'perfect');for(const key of ['damage','incoming','heal','ward','absorbed','rootsCut','enemyHeal'])assert.deepEqual(preview[key],{min:real[key]||0,max:real[key]||0},`${m} ${move} ${key}`);
    if(move==='pet:pebbleturtle'){assert.ok(preview.ward.min>0);assert.ok(preview.absorbed.min>0);}
    assert.equal(preview.parried,!!real.strategy?.parried);assert.equal(preview.staggered,!!real.rhythm?.staggered);
  }
});
test('expedition preview bounds cover independent outgoing and incoming rolls, kills and defeat',()=>{
  for(const hp of [1,100])for(const enemyHp of [42,100])for(const move of ['attack','guard','charge','skill','pet:axolotl']){
    const s=ready('explore');s.expedition.hp=hp;s.expedition.battle.hp=enemyHp;s.expedition.battle.focus=3;
    const order={move,stance:'assault'},saved=copy(s),p=previewOrder(s,'explore',order,'perfect');assert.ok(!p.error);assert.equal(p.exact,false);assert.deepEqual(s,saved);
    for(const rolls of [[0,.9999999],[.9999999,0],[.2,.8],[.8,.2],[.5,.5]]){
      let index=0;const actual=turn(copy(s),'explore',order,'perfect',()=>rolls[Math.min(index++,1)]);
      for(const key of ['damage','incoming','heal','ward'])assert.ok(p[key].min<=(actual[key]||0)&&p[key].max>=(actual[key]||0),`${move}: ${key}`);
    }
  }
});
test('previewing a fatal, finishing or rejected move never pays, kills or consumes the real turn',()=>{
  for(const m of modes){
    const s=ready(m),saved=copy(s);for(let i=0;i<5;i++)assert.ok(!previewOrder(s,m,{move:'charge',stance:'assault'}).error);assert.deepEqual(s,saved);
    assert.ok(previewOrder(s,m,{move:'skill'}).error);assert.deepEqual(s,saved);
    if(m==='boss')s.boss.run.enemyHp=1;else battle(s,m).hp=1;
    const finishing=copy(s);assert.equal(previewOrder(s,m,'attack','perfect').victory,true);assert.deepEqual(s,finishing);assert.ok(!run(s,m).tactics?.last);
  }
});
test('every creature can use both stored bonuses with any stance and leave a valid save',()=>{
  for(const creature of SPECIES)for(const stance of ['balanced','assault','guarded']){
    const s=ready('boss',[creature.id]);s.boss.run.strategy={stance,drive:1,riposte:1};s.boss.run.focus=3;s.boss.run.hp=30;
    const r=turn(s,'boss',{move:`pet:${creature.id}`,stance},'perfect');assert.ok(!r.error,creature.id);roundtrip(s);
  }
});
