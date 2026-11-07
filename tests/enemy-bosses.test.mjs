import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { B } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import * as F from '../web/js/forge-engine.js';
import { BOSSES,bossEnemy,bossIntent,bossProgress } from '../web/js/boss-state.js';
import { BOSS_GEAR,GEAR_LIMIT } from '../web/js/forge-state.js';
import { newEnemyAI,enemyIntent } from '../web/js/enemy-tactics.js';
import { previewOrder } from '../web/js/combat-preview.js';
import { SPECIES } from '../web/js/data.js';
import { offensiveMove } from '../web/js/combat-orders.js';

const clone=structuredClone;
const roundtrip=s=>E.validateSave(E.serialize(s));
const atomic=(s,fn)=>{const before=clone(s);assert.ok(fn().error);assert.deepEqual(s,before);};
function ready(id='treant'){
  const s=E.newGame();s.level=10;s.resources.food=10000;
  if(id!=='treant'){s.boss.best=1;s.boss.wins=1;s.boss.clears[0]=1;}
  if(id==='phoenix')Object.assign(s.boss.rivals.frost,{best:1,wins:1,clears:[1,0,0,0,0]});
  return s;
}
function arena(id){const s=ready(id);assert.ok(!B.startBoss(s,1,()=>.38,Date.now(),id).error);return s;}
function expedition(kind){const s=ready();E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);Object.assign(s.expedition.battle,{enemyAI:newEnemyAI(kind),power:90});s.expedition.power=70;return s;}
function ruins(kind){const s=ready();R.startRuins(s,1,()=>.2);R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring'));s.ruins.run.battle.enemyAI=newEnemyAI(kind);return s;}

test('new bosses enforce their own island, prerequisite and tier gates atomically',()=>{
  const s=ready();s.level=2;for(const id of ['frost','phoenix','missing','toString',''])atomic(s,()=>B.startBoss(s,1,()=>.2,Date.now(),id));
  s.level=10;atomic(s,()=>B.startBoss(s,1,()=>.2,Date.now(),'frost'));
  Object.assign(s.boss,{best:1,wins:1,clears:[1,0,0,0,0]});atomic(s,()=>B.startBoss(s,1,()=>.2,Date.now(),'phoenix'));atomic(s,()=>B.startBoss(s,2,()=>.2,Date.now(),'frost'));
  s.level=3;const food=s.resources.food;B.startBoss(s,1,()=>.2,Date.now(),'frost');assert.equal(s.resources.food,food-12);assert.equal(s.boss.run.bossId,'frost');roundtrip(s);
});
test('legacy progress and active battles retain HP, seeded future and loot while missing new fields migrate',()=>{
  for(const mode of ['boss','explore','ruins']){
    const s=mode==='boss'?arena('treant'):mode==='ruins'?ruins('plain'):expedition('plain');
    const b=mode==='boss'?s.boss.run:mode==='ruins'?s.ruins.run.battle:s.expedition.battle;
    if(mode==='boss')delete b.bossId;else delete b.enemyAI;
    delete s.boss.rivals;const before=clone(s),loaded=roundtrip(s);
    const original=mode==='boss'?B.bossBattleTurn(s,'attack',0):mode==='ruins'?R.ruinsBattleTurn(s,'attack',0):E.battleTurn(s,'attack',()=>.5);
    const resumed=mode==='boss'?B.bossBattleTurn(loaded,'attack',0):mode==='ruins'?R.ruinsBattleTurn(loaded,'attack',0):E.battleTurn(loaded,'attack',()=>.5);
    assert.deepEqual(resumed,original);assert.equal(loaded.boss.rivals.frost.best,0);assert.equal(before.resources.food,loaded.resources.food);
  }
});
test('malformed present boss and enemy data is rejected rather than reset',()=>{
  for(const change of [s=>s.boss.rivals=null,s=>s.boss.rivals.frost=null,s=>s.boss.rivals.phoenix.best=2,s=>s.boss.rivals.phoenix.clears=[0,0],s=>s.boss.run.bossId='toString',s=>s.boss.run.mechanics.frozen=3,s=>s.boss.run.mechanics.revives=1,s=>s.boss.run.mechanics.extra=0]){
    const s=arena('frost');change(s);assert.throws(()=>roundtrip(s));
  }
  for(const ai of [null,{kind:'caster',casting:1},{kind:'armored',casting:true},{kind:'missing',casting:false},{kind:'plain',casting:false,extra:0}]){
    for(const s of [expedition('plain'),ruins('plain')]){(s.expedition?.battle||s.ruins.run.battle).enemyAI=ai;assert.throws(()=>roundtrip(s));}
  }
});
test('frost telegraphs a safe charge, then a real blizzard and locks only future energy gains',()=>{
  const s=arena('frost'),r=s.boss.run;r.turn=1;assert.equal(bossIntent(r).id,'charge');assert.equal(B.bossBattleTurn(s,'attack').incoming,0);
  assert.equal(bossIntent(r).id,'blizzard');const hit=B.bossBattleTurn(s,'attack');assert.ok(hit.incoming>0);assert.equal(r.mechanics.frozen,2);assert.equal(r.focus,2);
  const before=r.focus;const frozen=B.bossBattleTurn(s,'charge');assert.equal(r.focus,before);assert.equal(frozen.energyBlocked,1);assert.equal(r.mechanics.frozen,1);
  B.bossBattleTurn(s,'guard');assert.equal(r.mechanics.frozen,0);roundtrip(s);
});
test('fire and team skills interrupt blizzards while a perfect guard prevents freezing and prepares riposte',()=>{
  for(const move of ['pet:emberbird','skill','guard']){
    const s=arena('frost'),r=s.boss.run;r.turn=2;r.focus=3;
    const result=B.bossBattleTurn(s,move,0,'perfect');assert.equal(r.mechanics.frozen,0);
    if(move==='guard'){assert.ok(result.incoming>0);assert.equal(result.strategy.parried,true);}
    else{assert.equal(result.incoming,0);assert.equal(result.interrupted,true);}
    roundtrip(s);
  }
  const normal=arena('frost');normal.boss.run.turn=2;B.bossBattleTurn(normal,'guard');assert.equal(normal.boss.run.mechanics.frozen,2);
});
test('frozen energy is usable, thaw restores gain immediately and expired ice cannot softlock a zero-energy team',()=>{
  for(const [move,grade]of [['pet:emberbird','auto'],['skill','auto'],['guard','perfect']]){
    const s=arena('frost'),r=s.boss.run;r.mechanics.frozen=2;r.focus=3;
    const result=B.bossBattleTurn(s,move,0,grade);assert.equal(result.thawed,true);assert.equal(r.mechanics.frozen,0);roundtrip(s);
  }
  const s=arena('frost'),r=s.boss.run;r.mechanics.frozen=2;r.focus=0;r.turn=3;
  B.bossBattleTurn(s,'guard');assert.equal(r.focus,0);B.bossBattleTurn(s,'guard');assert.equal(r.focus,0);B.bossBattleTurn(s,'attack');assert.equal(r.focus,1);roundtrip(s);
});
test('a stagger cancels freeze, and phase transitions add frost armor once',()=>{
  const s=arena('frost'),r=s.boss.run;r.turn=2;r.rhythm.pressure=90;
  assert.ok(B.bossBattleTurn(s,'attack',0,'perfect').rhythm.staggered);assert.equal(r.mechanics.frozen,0);
  // Each manual turn rewind starts an independent report sample.
  r.enemyHp=211;r.turn=1;s.combatJournal.active=null;const hit=B.bossBattleTurn(s,'attack');assert.equal(r.phase,2);assert.equal(r.shield,40);r.turn=1;s.combatJournal.active=null;B.bossBattleTurn(s,'guard');assert.ok(r.shield<=40);assert.ok(hit.damage>0);roundtrip(s);
});
test('core targeting is atomic until exposed and rejects support, dead cores and non-boss targets',()=>{
  const s=arena('phoenix');for(const move of ['attack','guard','pet:axolotl'])atomic(s,()=>B.bossBattleTurn(s,{move,target:'core'}));
  const r=s.boss.run;Object.assign(r,{phase:2,enemyHp:220});for(const move of ['guard','charge','pet:axolotl'])atomic(s,()=>B.bossBattleTurn(s,{move,target:'core'}));
  r.mechanics.coreHp=0;atomic(s,()=>B.bossBattleTurn(s,{move:'attack',target:'core'}));
  for(const m of ['explore','ruins']){const q=m==='ruins'?ruins('plain'):expedition('plain');atomic(q,()=>m==='ruins'?R.ruinsBattleTurn(q,{move:'attack',target:'core'}):E.battleTurn(q,{move:'attack',target:'core'}));}
});
test('core damage and body splash are separate; breaking it cancels heal and revival',()=>{
  const s=arena('phoenix'),r=s.boss.run;Object.assign(r,{phase:2,enemyHp:200,turn:3});r.mechanics.coreHp=1;
  const p=previewOrder(s,'boss',{move:'attack',target:'core'}),hit=B.bossBattleTurn(s,{move:'attack',target:'core'});
  assert.equal(hit.coreDamage,1);assert.equal(hit.coreBroken,true);assert.equal(hit.enemyHeal,undefined);assert.equal(r.enemyHp,p.enemyHpAfter.min);assert.ok(hit.damage>1);assert.equal(r.mechanics.revives,0);
  r.enemyHp=1;const won=B.bossBattleTurn(s,'attack');assert.equal(won.result.status,'victory');assert.equal(won.revived,undefined);roundtrip(s);
});
test('phoenix body revives once without rewards, including burn and reflection lethal hits',()=>{
  for(const source of ['attack','burn','counter']){
    const s=arena('phoenix'),r=s.boss.run;Object.assign(r,{phase:3,enemyHp:source==='counter'?70:1,turn:0});
    if(source==='burn')r.tactics.burn={amount:2,turns:2};
    if(source==='counter')r.tactics.counter={amount:100,turns:2};
    const before=clone(s.forge),wins=bossProgress(s,'phoenix').wins,hit=B.bossBattleTurn(s,source==='counter'?'guard':'attack');
    assert.equal(hit.revived,171);assert.equal(hit.finished,undefined);assert.deepEqual(s.forge,before);assert.equal(bossProgress(s,'phoenix').wins,wins);assert.equal(r.mechanics.revives,1);roundtrip(s);
    r.enemyHp=1;const won=B.bossBattleTurn(s,'attack');assert.equal(won.result.status,'victory');assert.equal(won.revived,undefined);roundtrip(s);
  }
});
test('live core healing is real and pressure interrupt cancels it',()=>{
  const s=arena('phoenix');Object.assign(s.boss.run,{phase:2,enemyHp:180,turn:3});
  const broken=clone(s);broken.boss.run.rhythm.pressure=90;
  assert.equal(B.bossBattleTurn(s,'guard').enemyHeal,38);assert.equal(B.bossBattleTurn(broken,'guard',0,'perfect').enemyHeal,undefined);roundtrip(s);roundtrip(broken);
});
test('rival first-clear rewards, tiers and exclusive drops are independent and cannot be crafted',()=>{
  for(const id of ['frost','phoenix']){
    const s=ready(id),treant=clone(s.boss.clears);
    for(let run=0;run<2;run++){
      B.startBoss(s,1,()=>.41,Date.now(),id);Object.assign(s.boss.run,{enemyHp:1,phase:3});s.boss.run.mechanics.coreHp=0;
      const hit=B.bossBattleTurn(s,'attack');assert.equal(hit.result.first,run===0);assert.equal(hit.result.reward.tickets,run===0?2:undefined);assert.equal(GEAR_BOSS(hit.result.drop.recipe),id);assert.deepEqual(s.boss.clears,treant);roundtrip(s);
    }
    assert.equal(bossProgress(s,id).best,1);assert.equal(bossProgress(s,id).wins,2);B.startBoss(s,2,()=>.3,Date.now(),id);assert.equal(s.boss.run.tier,2);roundtrip(s);
  }
  function GEAR_BOSS(recipe){return BOSS_GEAR.find(g=>g.id===recipe)?.boss;}
  const s=ready('phoenix');for(const g of BOSS_GEAR)atomic(s,()=>F.craftGear(s,g.id));
});
test('exclusive gear supports equip, upgrade, reload and full-bag conversion without losing rewards',()=>{
  const s=ready('frost');s.resources.gold=10000;s.forge.materials={sap:100,ore:100,heart:20};
  for(const g of BOSS_GEAR){const item=F.addGear(s,g.id);F.equipGear(s,'mossfox',item.id);F.upgradeGear(s,item.id);assert.equal(item.level,2);roundtrip(s);}
  while(s.forge.items.length<GEAR_LIMIT)F.addGear(s,'rootfang');B.startBoss(s,1,()=>.2,Date.now(),'frost');Object.assign(s.boss.run,{enemyHp:1,phase:3});
  const result=B.bossBattleTurn(s,'attack').result;assert.equal(result.converted,true);assert.equal(result.materials.sap,9);assert.equal(s.forge.items.length,GEAR_LIMIT);roundtrip(s);
});
test('armored counters and damage reduction have real bypasses and a predictable opening in both journey modes',()=>{
  for(const mode of ['explore','ruins']){
    const s=mode==='ruins'?ruins('armored'):expedition('armored'),a=clone(s),plain=clone(s),b=x=>mode==='ruins'?x.ruins.run.battle:x.expedition.battle;
    b(plain).enemyAI=newEnemyAI('plain');const turn=(x,m,g='auto')=>mode==='ruins'?R.ruinsBattleTurn(x,m,0,g):E.battleTurn(x,m,()=>.5,g);
    const hit=turn(s,'attack'),normal=turn(plain,'attack');assert.ok(hit.damage<normal.damage);assert.equal(hit.enemyCounter,9);assert.ok(hit.incoming>normal.incoming);
    if(mode==='ruins')a.ruins.run.focus=3;else b(a).focus=3;
    const skill=turn(a,'skill');assert.equal(skill.enemyCounter,0);assert.equal(skill.armorBlocked,0);roundtrip(s);roundtrip(a);
    b(s).turn=2;if(mode==='explore'){delete b(s).turn;b(s).round=2;}assert.equal(enemyIntent(b(s),{id:'heavy'}).id,'opening');
  }
});
test('caster channel, saved interruption and spell explosion behave identically before and after reload',()=>{
  for(const mode of ['explore','ruins']){
    const s=mode==='ruins'?ruins('caster'):expedition('caster'),a=clone(s),b=x=>mode==='ruins'?x.ruins.run.battle:x.expedition.battle;
    const turn=(x,m,g='auto')=>mode==='ruins'?R.ruinsBattleTurn(x,m,0,g):E.battleTurn(x,m,()=>.5,g);
    assert.equal(turn(s,'attack').incoming,0);assert.equal(b(s).enemyAI.casting,true);
    const cast=clone(s);assert.ok(turn(cast,'charge').incoming>0);
    if(mode==='ruins')a.ruins.run.focus=3;else b(a).focus=3;
    const cut=turn(a,'pet:emberbird','good');assert.equal(cut.interrupted,true);assert.equal(b(a).enemyAI.casting,false);const loaded=roundtrip(a);
    const recovered=turn(a,'charge'),resumed=turn(loaded,'charge');assert.deepEqual(resumed,recovered);assert.equal(recovered.incoming,0);roundtrip(a);
  }
});
test('berserker enrage triggers on crossing 40% HP and meaningful preview includes its added damage',()=>{
  const s=expedition('berserker');s.expedition.battle.hp=60;const plain=clone(s);plain.expedition.battle.enemyAI=newEnemyAI('plain');
  const p=previewOrder(s,'explore','attack'),r=E.battleTurn(s,'attack',()=>.5),normal=E.battleTurn(plain,'attack',()=>.5);
  assert.equal(r.enraged,true);assert.ok(r.incoming>normal.incoming*1.4);assert.ok(r.incoming>=p.incoming.min&&r.incoming<=p.incoming.max);roundtrip(s);
});
test('new encounter types are actually assigned across later expedition stages and normal ruins floors',()=>{
  const kinds=new Set();for(let stage=1;stage<=3;stage++){const s=ready();E.startExpedition(s,'forest',()=>.1);s.expedition.stage=stage;E.chooseRoute(s,0,()=>.1);kinds.add(s.expedition.battle.enemyAI.kind);roundtrip(s);}assert.equal(kinds.size,3);
  const found=new Set();for(let seed=1;seed<=6;seed++){const s=ready();R.startRuins(s,1,()=>seed/10);const r=s.ruins.run;r.floor=2;r.cleared=1;s.ruins.best=1;s.ruins.clears=1;R.chooseRuinsPath(s,r.paths.find(p=>p!=='spring'));found.add(r.battle.enemyAI.kind);roundtrip(s);}assert.ok(found.size>=2);
});
test('new boss previews are pure, match every committed mechanic and retain seeded outcomes after reload',()=>{
  for(const id of ['frost','phoenix'])for(const move of ['attack','guard','charge','skill','pet:emberbird']){
    let s=arena(id),r=s.boss.run;Object.assign(r,{phase:2,enemyHp:id==='frost'?180:200,turn:id==='frost'?2:3,focus:3});if(id==='frost')r.mechanics.frozen=2;
    const order={move,target:id==='phoenix'&&['attack','skill','pet:emberbird'].includes(move)?'core':'body'},before=clone(s),p=previewOrder(s,'boss',order,'perfect');
    assert.ok(!p.error);assert.deepEqual(s,before);const loaded=roundtrip(s),actual=B.bossBattleTurn(s,order,0,'perfect'),resumed=B.bossBattleTurn(loaded,order,0,'perfect');assert.deepEqual(resumed,actual);
    for(const key of ['damage','incoming','coreDamage','revived','frozenAfter','energyBlocked','enemyHeal'])assert.equal(p[key].min,actual[key]||0,`${id} ${move} ${key}`);
    assert.equal(p.hpAfter.min,s.boss.run.hp);assert.equal(p.enemyHpAfter.min,s.boss.run.enemyHp);assert.equal(p.energyAfter.min,s.boss.run.focus);roundtrip(s);
  }
});
test('starter team can defeat each first-tier boss through its counterplay with varied seeds',()=>{
  for(const id of Object.keys(BOSSES))for(const seed of [.1,.4,.8]){
    const s=ready(id);B.startBoss(s,1,()=>seed,Date.now(),id);
    for(let n=0;s.boss.run&&n<60;n++){
      const r=s.boss.run,intent=bossIntent(r);let move;
      if(r.hp<110&&r.focus>=2&&!r.tactics.cooldowns.axolotl)move='pet:axolotl';
      else if(id==='frost'&&(intent.id==='blizzard'||r.mechanics.frozen)&&r.focus>=2&&!r.tactics.cooldowns.emberbird)move='pet:emberbird';
      else if(intent.danger)move='guard';
      else if(r.focus>=2&&!r.tactics.cooldowns.emberbird)move='pet:emberbird';
      else move=intent.id==='charge'&&!r.strategy.drive?'charge':'attack';
      const core=id==='phoenix'&&r.phase>=2&&r.mechanics.coreHp>0&&['attack','pet:emberbird'].includes(move);
      const result=B.bossBattleTurn(s,{move,target:core?'core':'body'},Date.now(),'perfect');assert.ok(!result.error,`${id}: ${result.error}`);roundtrip(s);
    }
    assert.equal(s.boss.lastResult.status,'victory',`${id} ${seed}`);assert.equal(s.forge.items.length,1);
  }
});
test('all 58 creature skills remain usable and saveable against freezing and an exposed phoenix core',()=>{
  for(const id of ['frost','phoenix'])for(const species of SPECIES){
    const s=ready(id);s.team=[...new Set([species.id,'axolotl','emberbird'])];s.pets=s.team.map(p=>E.makePet(p));
    B.startBoss(s,1,()=>.4,Date.now(),id);const r=s.boss.run;Object.assign(r,{phase:2,enemyHp:id==='frost'?200:220,turn:2,focus:3});if(id==='frost')r.mechanics.frozen=2;
    const move=`pet:${species.id}`,order={move,target:id==='phoenix'&&offensiveMove(move)?'core':'body'},before=clone(s),p=previewOrder(s,'boss',order,'perfect');assert.ok(!p.error,`${id} ${species.id}: ${p.error}`);assert.deepEqual(s,before);
    const hit=B.bossBattleTurn(s,order,0,'perfect');assert.ok(!hit.error);assert.equal(hit.damage,p.damage.min);assert.equal(hit.incoming,p.incoming.min);roundtrip(s);
  }
});
test('tactical journey previews include armor, interrupts and enrage without altering the real saved AI',()=>{
  for(const mode of ['ruins','explore'])for(const kind of ['armored','caster','berserker'])for(const move of ['attack','guard','skill','pet:emberbird']){
    const s=mode==='ruins'?ruins(kind):expedition(kind),b=mode==='ruins'?s.ruins.run.battle:s.expedition.battle;
    if(mode==='ruins')s.ruins.run.focus=3;else b.focus=3;b.hp=60;
    const before=clone(s),p=previewOrder(s,mode,move,'perfect');assert.ok(!p.error);assert.deepEqual(s,before);
    const r=mode==='ruins'?R.ruinsBattleTurn(s,move,0,'perfect'):E.battleTurn(s,move,()=>.5,'perfect');
    for(const key of ['damage','incoming','armorBlocked','enemyCounter'])assert.ok((r[key]||0)>=p[key].min&&(r[key]||0)<=p[key].max,`${mode} ${kind} ${move} ${key}`);roundtrip(s);
  }
});
