import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import * as F from '../web/js/forge-engine.js';
import { B } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import * as T from '../web/js/tactics.js';
import { bossEnemy,bossIntent } from '../web/js/boss-state.js';
import { GEAR_RECIPES,GEAR_LIMIT,gearBonuses } from '../web/js/forge-state.js';
import { SPECIES } from '../web/js/data.js';

const clone=s=>structuredClone(s),roundtrip=s=>E.validateSave(E.serialize(s));
const game=()=>{const s=E.newGame();s.level=2;s.resources.gold=100000;s.resources.food=50000;return s;};
const arena=()=>{const s=game();B.startBoss(s,1,()=>.42);return s;};
const rich=s=>{s.forge.materials={sap:5000,ore:5000,heart:500};return s;};
function kit(s,recipe,pet){const item=F.addGear(s,recipe);if(pet)assert.ok(!F.equipGear(s,pet,item.id).error);return item;}
function win(s){
  let result;
  while(s.boss.run){
    const r=s.boss.run,c=r.tactics.cooldowns;
    const action=r.hp<r.maxHp*.6&&r.focus>=2&&!c.axolotl?'pet:axolotl':r.focus>=2&&!c.emberbird?'pet:emberbird':bossIntent(r).id==='heavy'?'guard':'attack';
    result=B.bossBattleTurn(s,action);assert.ok(!result.error);if(s.boss.run)roundtrip(s);
  }
  return result;
}
function unchanged(s,fn){const before=clone(s);assert.ok(fn().error);assert.deepEqual(s,before);}

test('1.4 active saves gain empty forge and boss progress without changing their journey',()=>{
  for(const mode of ['expedition','ruins']){
    const s=game();mode==='expedition'?(E.startExpedition(s,'forest',()=>.1),E.chooseRoute(s,0,()=>.1)):(R.startRuins(s,1,()=>.3),R.chooseRuinsPath(s,s.ruins.run.paths[0]));
    const old=clone(s);delete old.forge;delete old.boss;
    const migrated=roundtrip(old);assert.deepEqual(migrated.expedition,s.expedition);assert.deepEqual(migrated.ruins,s.ruins);assert.deepEqual(migrated.pets,s.pets);assert.deepEqual(migrated.resources,s.resources);
    assert.equal(migrated.forge.items.length,0);assert.equal(migrated.boss.best,0);
  }
  for(const key of ['forge','boss']){const s=game();s[key]=null;assert.throws(()=>roundtrip(s));}
});

test('forge kit is gated and granted once, costs are atomic and all six recipes work',()=>{
  const s=E.newGame();unchanged(s,()=>F.claimForgeKit(s));s.level=2;
  assert.ok(!F.claimForgeKit(s).error);assert.deepEqual(s.forge.materials,{sap:9,ore:6,heart:0});unchanged(s,()=>F.claimForgeKit(s));
  unchanged(s,()=>F.craftGear(s,'unknown'));rich(s);
  const before=clone(s.resources);
  for(const recipe of GEAR_RECIPES){assert.equal(F.craftGear(s,recipe.id).item.recipe,recipe.id);roundtrip(s);}
  assert.equal(s.resources.gold,before.gold-540);assert.equal(new Set(s.forge.items.map(i=>i.id)).size,6);
  s.forge.materials.sap=0;unchanged(s,()=>F.craftGear(s,'rootfang'));
});

test('equipment belongs to exactly one creature and replaces only the matching slot',()=>{
  const s=game(),a=kit(s,'rootfang','mossfox'),b=kit(s,'mistcharm'),c=kit(s,'barkcollar','mossfox');
  unchanged(s,()=>F.equipGear(s,'axolotl',a.id));unchanged(s,()=>F.equipGear(s,'missing',b.id));
  F.equipGear(s,'mossfox',b.id);assert.deepEqual(s.forge.equipped.mossfox,{charm:b.id,collar:c.id});
  assert.ok(!F.equipGear(s,'axolotl',a.id).error);F.unequipGear(s,'mossfox','charm');assert.deepEqual(s.forge.equipped.mossfox,{collar:c.id});roundtrip(s);
});

test('power equipment changes the same displayed, team and encounter snapshot power',()=>{
  const s=game(),base=E.petPower(s.pets[0],s),team=E.teamPower(s).power;kit(s,'rootfang','mossfox');kit(s,'ambercollar','mossfox');
  assert.equal(gearBonuses(s,'mossfox').power,18);assert.equal(E.petPower(s.pets[0],s),Math.round(base*1.18));assert.ok(E.teamPower(s).power>team);
  assert.equal(E.combatMembers(s)[0].power,E.petPower(s.pets[0],s));assert.equal(R.ruinsPreview(s).members[0].power,E.petPower(s.pets[0],s));
  B.startBoss(s,1,()=>.2);const snapshot=clone(s.boss.run.members);E.feed(s,'mossfox');E.feed(s,'mossfox');assert.deepEqual(s.boss.run.members,snapshot);roundtrip(s);
});

test('healing and ward equipment affect real skills in all three combat modes',()=>{
  for(const mode of ['expedition','ruins','boss']){
    const plain=game();plain.pets.push(E.makePet('pebbleturtle'));plain.team=['mossfox','axolotl','pebbleturtle'];const geared=clone(plain);
    kit(geared,'mistcharm','axolotl');kit(geared,'dewstone','axolotl');kit(geared,'barkcollar','pebbleturtle');kit(geared,'jadestone','pebbleturtle');
    const prepare=s=>{
      if(mode==='boss'){B.startBoss(s,1,()=>.2);s.boss.run.hp=15;s.boss.run.focus=3;}
      else if(mode==='ruins'){R.startRuins(s,1,()=>.2);R.chooseRuinsPath(s,s.ruins.run.paths[0]);s.ruins.run.hp=15;s.ruins.run.focus=3;}
      else{E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);s.expedition.hp=15;s.expedition.battle.focus=3;}
    };
    prepare(plain);prepare(geared);
    const turn=(s,a)=>mode==='boss'?B.bossBattleTurn(s,a):mode==='ruins'?R.ruinsBattleTurn(s,a):E.battleTurn(s,a,()=>.5);
    const p=turn(plain,'pet:axolotl'),g=turn(geared,'pet:axolotl');assert.ok(g.heal>p.heal,`${mode} heal`);
    const a=clone(plain),b=clone(geared);
    for(const s of [a,b]){if(mode==='boss')s.boss.run.focus=3;else if(mode==='ruins')s.ruins.run.focus=3;else s.expedition.battle.focus=3;}
    assert.ok(turn(b,'pet:pebbleturtle').ward>turn(a,'pet:pebbleturtle').ward,`${mode} ward`);roundtrip(geared);
  }
});

test('all journeys lock team and equipment changes while crafting cannot alter the snapshot',()=>{
  for(const mode of ['expedition','ruins','boss']){
    const s=rich(game()),item=kit(s,'rootfang','mossfox');s.pets.push(E.makePet('pebbleturtle'));
    if(mode==='boss')B.startBoss(s,1,()=>.2);else if(mode==='ruins')R.startRuins(s,1,()=>.2);else E.startExpedition(s,'forest',()=>.2);
    unchanged(s,()=>F.upgradeGear(s,item.id));unchanged(s,()=>F.unequipGear(s,'mossfox','charm'));unchanged(s,()=>F.equipGear(s,'mossfox',item.id));unchanged(s,()=>F.recycleGear(s,item.id));unchanged(s,()=>E.setTeamSlot(s,0,'pebbleturtle'));unchanged(s,()=>E.toggleTeam(s,'pebbleturtle'));
    const members=clone(mode==='boss'?s.boss.run.members:mode==='ruins'?s.ruins.run.members:s.expedition.members);
    F.craftGear(s,'dewstone');assert.deepEqual(mode==='boss'?s.boss.run.members:mode==='ruins'?s.ruins.run.members:s.expedition.members,members);roundtrip(s);
  }
});

test('upgrades charge displayed costs, require cores at high levels and consume eligible duplicates once',()=>{
  const s=rich(game()),item=kit(s,'rootfang'),donor=kit(s,'rootfang'),wrong=kit(s,'dewstone');
  unchanged(s,()=>F.upgradeGear(s,item.id,wrong.id));unchanged(s,()=>F.upgradeGear(s,item.id,item.id));
  F.equipGear(s,'mossfox',donor.id);unchanged(s,()=>F.upgradeGear(s,item.id,donor.id));F.unequipGear(s,'mossfox','charm');
  const before=clone(s.forge.materials),gold=s.resources.gold;F.upgradeGear(s,item.id,donor.id);
  assert.equal(item.level,2);assert.equal(s.resources.gold,gold-50);assert.deepEqual(s.forge.materials,before);assert.ok(!s.forge.items.some(i=>i.id===donor.id));
  F.upgradeGear(s,item.id);assert.equal(item.level,3);s.forge.materials.heart=0;unchanged(s,()=>F.upgradeGear(s,item.id));
  s.forge.materials.heart=3;F.upgradeGear(s,item.id);F.upgradeGear(s,item.id);assert.equal(item.level,5);assert.equal(s.forge.materials.heart,0);unchanged(s,()=>F.upgradeGear(s,item.id));roundtrip(s);
});

test('recycling rejects equipped items and inventory overflow cannot consume crafting costs',()=>{
  const s=rich(game()),item=kit(s,'barkcollar','mossfox');unchanged(s,()=>F.recycleGear(s,item.id));F.unequipGear(s,'mossfox','collar');
  const before=clone(s.forge.materials);assert.deepEqual(F.recycleGear(s,item.id).materials,{sap:2,ore:1});assert.equal(s.forge.materials.sap,before.sap+2);unchanged(s,()=>F.recycleGear(s,item.id));
  while(s.forge.items.length<GEAR_LIMIT)kit(s,'rootfang');unchanged(s,()=>F.craftGear(s,'rootfang'));roundtrip(s);
});

test('boss entry enforces unlock, preceding tiers, journey exclusivity and one provision payment',()=>{
  const s=E.newGame();unchanged(s,()=>B.startBoss(s,1));s.level=3;unchanged(s,()=>B.startBoss(s,2));unchanged(s,()=>B.startBoss(s,0));unchanged(s,()=>B.startBoss(s,1.5));
  const food=s.resources.food;B.startBoss(s,1,()=>.1);assert.equal(s.resources.food,food-12);unchanged(s,()=>B.startBoss(s,1));unchanged(s,()=>E.startExpedition(s,'forest'));unchanged(s,()=>R.startRuins(s));
  B.retreatBoss(s);assert.equal(s.boss.lastResult.status,'retreat');assert.deepEqual(s.boss.lastResult.reward,{});assert.equal(s.boss.wins,0);roundtrip(s);
});

test('unavailable boss actions are atomic and do not advance RNG, status ticks or intent',()=>{
  const s=arena();s.boss.run.tactics.regen={amount:10,turns:3};
  for(const action of ['skill','pet:missing','pet:pebbleturtle','dance',null])unchanged(s,()=>B.bossBattleTurn(s,action));
  B.bossBattleTurn(s,'attack');B.bossBattleTurn(s,'attack');B.bossBattleTurn(s,'pet:mossfox');s.boss.run.focus=3;unchanged(s,()=>B.bossBattleTurn(s,'pet:mossfox'));roundtrip(s);
});

test('boss charging causes no incoming damage and guarding mitigates the announced heavy strike',()=>{
  const a=arena();a.boss.run.turn=2;assert.equal(bossIntent(a.boss.run).id,'charge');assert.equal(B.bossBattleTurn(a,'attack').incoming,0);assert.equal(bossIntent(a.boss.run).id,'heavy');
  const b=clone(a),hit=B.bossBattleTurn(a,'attack'),guard=B.bossBattleTurn(b,'guard');assert.ok(guard.incoming<hit.incoming*.3);assert.ok(guard.incoming>0);roundtrip(b);
});

test('phase two roots heal until chopped; attacks, fire skills and combos remove the right count',()=>{
  const initial=arena();initial.boss.run.enemyHp=190;initial.boss.run.phase=2;initial.boss.run.roots=2;
  const wait=clone(initial),attack=clone(initial),fire=clone(initial),combo=clone(initial);
  assert.equal(B.bossBattleTurn(wait,'guard').enemyHeal,12);assert.equal(wait.boss.run.roots,2);
  const chop=B.bossBattleTurn(attack,'attack');assert.equal(chop.rootsCut,1);assert.equal(chop.enemyHeal,6);assert.equal(attack.boss.run.roots,1);
  fire.boss.run.focus=3;assert.equal(B.bossBattleTurn(fire,'pet:emberbird').rootsCut,2);assert.equal(fire.boss.run.roots,0);
  combo.boss.run.focus=3;combo.boss.run.tactics.mark='mossfox';const linked=B.bossBattleTurn(combo,'pet:axolotl');assert.equal(linked.combo,'Nảy mầm');assert.equal(linked.rootsCut,2);assert.equal(combo.boss.run.roots,0);roundtrip(combo);
});

test('crossing phases is permanent and exposure clears roots and shields even on a ward intent',()=>{
  const s=arena(),r=s.boss.run;r.enemyHp=195;B.bossBattleTurn(s,'attack');assert.equal(r.phase,2);assert.equal(r.roots,1);
  r.enemyHp=100;r.shield=0;r.turn=1;r.roots=2;B.bossBattleTurn(s,'attack');assert.equal(r.phase,3);assert.equal(r.roots,0);assert.equal(r.shield,0);roundtrip(s);
});

test('starter victories grant one gear item each, materials, first-clear rewards once and unlock the next tier',()=>{
  const s=game();B.startBoss(s,1,()=>.42);const first=win(s);assert.equal(first.result.status,'victory');assert.equal(first.result.first,true);assert.equal(first.result.reward.tickets,2);assert.equal(first.result.materials.heart,1);assert.equal(s.forge.items.length,1);assert.equal(s.boss.best,1);unchanged(s,()=>B.bossBattleTurn(s,'attack'));
  B.startBoss(s,1,()=>.42);const second=win(s);assert.equal(second.result.first,false);assert.equal(second.result.reward.tickets,undefined);assert.equal(s.forge.items.length,2);assert.equal(s.boss.wins,2);roundtrip(s);
});

test('boss reward converts a full inventory into materials and defeat or retreat gives no loot',()=>{
  const s=game();while(s.forge.items.length<GEAR_LIMIT)kit(s,'rootfang');B.startBoss(s,1,()=>.4);const won=win(s);assert.equal(won.result.converted,true);assert.equal(won.result.materials.sap,9);assert.equal(s.forge.items.length,GEAR_LIMIT);roundtrip(s);
  const loss=arena();loss.boss.run.turn=59;const before=clone(loss.forge);const r=B.bossBattleTurn(loss,'guard');assert.equal(r.result.status,'defeat');assert.deepEqual(r.result.reward,{});assert.deepEqual(loss.forge,before);roundtrip(loss);
});

test('saving before every action keeps boss RNG, drops, gear effects and future outcomes identical',()=>{
  let a=rich(game());kit(a,'mistcharm','axolotl');kit(a,'barkcollar','mossfox');B.startBoss(a,1,()=>.89);let b=roundtrip(a);
  const now=Date.now();
  for(let n=0;a.boss.run&&n<60;n++){
    const run=a.boss.run;const action=run.hp<90&&run.focus>=2&&!run.tactics.cooldowns.axolotl?'pet:axolotl':run.focus>=2&&!run.tactics.cooldowns.emberbird?'pet:emberbird':bossIntent(run).id==='heavy'?'guard':'attack';
    assert.deepEqual(B.bossBattleTurn(a,action,now),B.bossBattleTurn(b,action,now));assert.deepEqual(a,b);b=E.validateSave(E.serialize(b),now);
  }
  assert.equal(a.boss.lastResult.status,'victory');
});

test('malformed equipment, duplicate ownership, boss snapshots and inconsistent clears are rejected',()=>{
  const base=game();kit(base,'mistcharm','mossfox');B.startBoss(base,1,()=>.3);
  const mutations=[s=>s.forge.items.push(clone(s.forge.items[0])),s=>s.forge.items[0].level=6,s=>s.forge.items[0].recipe='constructor',s=>s.forge.nextId=1,s=>s.forge.equipped.axolotl={charm:'g1'},s=>s.forge.equipped.mossfox={stone:'g1'},s=>s.forge.materials.sap=-1,s=>s.boss.run.focus=4,s=>s.boss.run.rng=0,s=>s.boss.run.members[0].gear.heal=101,s=>s.boss.run.members[0].gear={ward:0},s=>s.boss.clears[1]=1,s=>s.boss.run.phase=0,s=>s.boss.run.roots=3,s=>s.boss.run.turn=60];
  for(const mutate of mutations){const s=clone(base);mutate(s);assert.throws(()=>roundtrip(s));}
});

test('five tiers with varied teams and equipment terminate with valid saves and bounded effects',()=>{
  for(let tier=1;tier<=5;tier++)for(let seed=1;seed<=4;seed++){
    const s=rich(game());s.level=10;s.boss.best=tier-1;s.boss.clears=s.boss.clears.map((_,i)=>i<tier-1?1:0);s.boss.wins=tier-1;
    for(const p of s.pets){p.level=4+tier;p.stars=1;p.bond=20;}
    for(const [recipe,pet]of [['rootfang','emberbird'],['mistcharm','axolotl'],['jadestone','mossfox']]){const item=kit(s,recipe,pet);item.level=3;}
    B.startBoss(s,tier,()=>seed*.173);let n=0;
    while(s.boss.run){const r=s.boss.run,options=r.members.filter(m=>!T.skillBlocked(r.tactics,m.id,r.focus,r.members));const action=bossIntent(r).id==='heavy'?'guard':options.length?`pet:${options[(n+seed)%options.length].id}`:'attack';B.bossBattleTurn(s,action);roundtrip(s);assert.ok(++n<=60);}
    assert.ok(['victory','defeat'].includes(s.boss.lastResult.status));
  }
});

test('all 58 individual kits can act against the guardian with gear bonuses and save their result',()=>{
  for(const species of SPECIES){
    const s=game();s.pets=[E.makePet(species.id),...s.pets.filter(p=>p.id!==species.id)].slice(0,3);s.team=s.pets.map(p=>p.id);
    kit(s,'mistcharm',species.id);kit(s,'barkcollar',species.id);B.startBoss(s,1,()=>.41);s.boss.run.focus=3;s.boss.run.hp=20;
    const r=B.bossBattleTurn(s,`pet:${species.id}`);assert.equal(r.actor,species.id);assert.ok(r.damage||r.heal||r.ward||r.gain);roundtrip(s);
  }
});
