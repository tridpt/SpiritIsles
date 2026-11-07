import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import { newRuins } from '../web/js/ruins-state.js';
import { RUINS_BLESSING_BY_ID, ruinsIntent, ruinsEncounter, ruinsMaxHp } from '../web/js/ruins-data.js';

const clone=x=>JSON.parse(JSON.stringify(x));
function ready(strong=false) {
  const s=E.newGame();s.level=2;s.resources.food=5000;
  if(strong){
    s.team=['forestking','oceandragon','phoenix'];
    for(const id of s.team){const p=E.makePet(id);p.level=30;p.stars=3;p.bond=100;s.pets.push(p);}
    s.ruins.relics={lantern:5,compass:5,flask:3};
  }
  return s;
}
function battleAt(floor=1,strong=false) {
  const s=ready(strong);R.startRuins(s,1,()=>.38);const r=s.ruins.run;
  s.ruins.best=floor-1;s.ruins.clears=floor-1;s.ruins.bosses=Math.floor((floor-1)/5);
  r.floor=floor;r.cleared=floor-1;r.paths=floor%5===0?['boss']:['trail','elite'];
  assert.ok(!R.chooseRuinsPath(s,r.paths[0]).error);return s;
}
function nextAction(s) {
  const r=s.ruins.run;
  if(r.phase==='path')return R.chooseRuinsPath(s,r.paths.includes('spring')&&r.hp<ruinsMaxHp(r)*.7?'spring':r.paths.find(p=>p==='trail')||r.paths[0]);
  if(r.phase==='blessing'){
    const priority=['recovery','humble','might','canopy','tide','bastion','charge','ember','vitality','spark','harmony','leech','thorns','dew'];
    return R.chooseRuinsBlessing(s,priority.find(id=>r.offers.includes(id))||r.offers[0]);
  }
  if(r.hp<ruinsMaxHp(r)*.5&&r.potions)return R.useRuinsPotion(s);
  return R.ruinsBattleTurn(s,r.focus>=2?'skill':ruinsIntent(r).danger?'guard':'attack');
}
function complete(s,stopFloor=50) {
  let steps=0;
  while(s.ruins.run&&s.ruins.best<stopFloor&&steps++<1500){assert.ok(!nextAction(s).error);E.validateSave(E.serialize(s));}
  assert.ok(steps<1500,'a run must not become stuck');return s;
}

test('1.0 and 1.1 saves gain ruins without changing existing progress or a running expedition',()=>{
  const s=ready();E.feed(s,'mossfox');E.startExpedition(s,'forest',()=>0);delete s.ruins;
  const old=clone(s);const loaded=E.validateSave(E.serialize(s));assert.deepEqual(loaded.ruins,newRuins());
  for(const key of ['pets','resources','team','pity','stats','fishing','breeding','expedition'])assert.deepEqual(loaded[key],old[key]);
  delete s.activitiesVersion;delete s.breeding;delete s.fishing;
  const legacy=E.validateSave(E.serialize(s));assert.deepEqual(legacy.ruins,newRuins());assert.equal(legacy.fishing.total,0);
});

test('partially present or malformed ruins data is rejected instead of silently resetting progress',()=>{
  for(const ruin of [null,{},[],{...newRuins(),version:2},{...newRuins(),dust:-1},{...newRuins(),relics:{lantern:7,compass:0,flask:0}},{...newRuins(),claimed:[5]}]){
    const s=ready();s.ruins=ruin;assert.throws(()=>E.validateSave(E.serialize(s)),/Phế Tích/);
  }
});

test('entry enforces unlocks, provisions, checkpoints, and one active journey without charging on failure',()=>{
  const s=E.newGame();const initial=clone(s.resources);assert.ok(R.startRuins(s).error);assert.deepEqual(s.resources,initial);
  s.level=2;assert.ok(R.startRuins(s,11).error);assert.equal(s.ruins.runs,0);
  s.resources.food=11;assert.ok(R.startRuins(s).error);assert.equal(s.resources.food,11);
  s.resources.food=100;E.startExpedition(s,'forest',()=>0);assert.ok(R.startRuins(s).error);s.expedition=null;
  assert.ok(!R.startRuins(s,1,()=>.5).error);assert.equal(s.resources.food,78);const entered=clone(s);
  assert.ok(R.startRuins(s).error);assert.deepEqual(s,entered);assert.equal(s.ruins.runs,1);E.validateSave(E.serialize(s));
});

test('a run freezes pet strength and relics and locks team changes and ordinary expeditions',()=>{
  const s=ready();R.startRuins(s,1,()=>.1);const power=R.ruinsPower(s.ruins.run);const members=clone(s.ruins.run.members);
  for(let i=0;i<6;i++)E.feed(s,'mossfox');assert.deepEqual(s.ruins.run.members,members);assert.equal(R.ruinsPower(s.ruins.run),power);
  assert.ok(E.toggleTeam(s,'mossfox').error);assert.ok(E.startExpedition(s,'forest').error);s.ruins.dust=200;
  assert.ok(R.upgradeRuinsRelic(s,'lantern').error);assert.equal(s.ruins.relics.lantern,0);assert.equal(s.ruins.dust,200);
});

test('save and reload preserve generated paths, future randomness and every battle outcome',()=>{
  const first=ready();R.startRuins(first,1,()=>.314159);const second=E.validateSave(E.serialize(first));
  const path=first.ruins.run.paths.find(p=>p!=='spring');R.chooseRuinsPath(first,path);R.chooseRuinsPath(second,path);
  for(let i=0;i<4&&first.ruins.run.phase==='battle';i++){
    const action=first.ruins.run.focus>=2?'skill':'attack';R.ruinsBattleTurn(first,action,123456);R.ruinsBattleTurn(second,action,123456);
    assert.deepEqual(first.ruins,second.ruins);assert.deepEqual(first.resources,second.resources);
  }
  E.validateSave(E.serialize(first));
});

test('invalid phase, path, blessing and premature skill do not mutate progress or reroll outcomes',()=>{
  const s=ready();R.startRuins(s,1,()=>.2);let before=clone(s);
  for(const operation of [()=>R.chooseRuinsPath(s,'not-a-path'),()=>R.ruinsBattleTurn(s,'attack'),()=>R.chooseRuinsBlessing(s,'might'),()=>R.rerollRuinsBlessings(s)]){assert.ok(operation().error);assert.deepEqual(s,before);}
  R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring'));before=clone(s);assert.ok(R.ruinsBattleTurn(s,'skill').error);assert.deepEqual(s,before);
});

test('a spring heals, stores rewards, and advances a floor without a fight or an extra blessing',()=>{
  const s=ready();R.startRuins(s,1,()=>.2);const r=s.ruins.run;r.paths=['spring','trail'];r.hp=35;
  const result=R.chooseRuinsPath(s,'spring');assert.equal(result.heal,30);assert.equal(r.hp,65);assert.equal(r.focus,1);assert.equal(r.floor,2);assert.equal(r.phase,'path');assert.equal(s.ruins.best,1);assert.ok(s.ruins.dust>0);assert.deepEqual(r.blessings,{});E.validateSave(E.serialize(s));
});

test('a potion heals 35 percent without consuming a turn, cannot be wasted at full health or reused',()=>{
  const s=battleAt(1);const r=s.ruins.run;const initial=clone(r);assert.ok(R.useRuinsPotion(s).error);assert.deepEqual(r,initial);
  r.hp=40;r.focus=2;const result=R.useRuinsPotion(s);assert.equal(result.heal,35);assert.equal(r.hp,75);assert.equal(r.potions,0);assert.equal(r.battle.turn,0);assert.equal(r.focus,2);assert.ok(R.useRuinsPotion(s).error);E.validateSave(E.serialize(s));
});

test('the visible heavy intent is mitigated by guard and shield and grants energy',()=>{
  const s=battleAt(5);s.ruins.run.battle.turn=2;s.ruins.run.blessings.bastion=1;
  const guarded=clone(s);assert.equal(ruinsIntent(s.ruins.run).id,'heavy');
  const hit=R.ruinsBattleTurn(s,'attack'),guard=R.ruinsBattleTurn(guarded,'guard');assert.ok(guard.incoming<hit.incoming);assert.equal(guarded.ruins.run.focus,1);assert.ok(guard.absorbed>0);E.validateSave(E.serialize(guarded));
});

test('skills spend two energy, break the enemy shield, heal, and combine water and leaf blessings',()=>{
  const s=battleAt(5);const r=s.ruins.run;r.focus=2;r.hp=40;r.battle.shield=25;r.blessings={tide:1,canopy:1};
  const result=R.ruinsBattleTurn(s,'skill');assert.equal(r.focus,0);assert.equal(r.battle?.shield||0,0);assert.ok(result.heal>=20);assert.ok(result.absorbed>0);assert.ok(result.damage>25);E.validateSave(E.serialize(s));
});

test('thorns can finish a guard counterattack and a cleared floor never pays twice',()=>{
  const s=battleAt(5);const r=s.ruins.run;r.members.forEach(m=>m.power=4);r.blessings={thorns:1};r.battle.hp=10;
  const result=R.ruinsBattleTurn(s,'guard');assert.ok(result.won);assert.equal(result.reflected,8);assert.equal(s.ruins.best,5);
  const earned=clone(s.resources),dust=s.ruins.dust;assert.ok(R.ruinsBattleTurn(s,'guard').error);assert.deepEqual(s.resources,earned);assert.equal(s.ruins.dust,dust);E.validateSave(E.serialize(s));
});

test('guardian patterns expose shields, recovery, energy drain, and heavy attacks before acting',()=>{
  for(const [floor,id]of [[5,'ward'],[15,'mend'],[35,'drain']]){
    const s=battleAt(floor,true);const r=s.ruins.run;r.battle.turn=1;r.focus=1;
    assert.equal(ruinsIntent(r).id,id);const out=R.ruinsBattleTurn(s,'attack');
    if(id==='ward')assert.equal(r.battle.shield,24);
    if(id==='mend')assert.ok(out.enemyHeal>0);
    if(id==='drain')assert.equal(r.focus,1);
    r.battle.turn=2;assert.equal(ruinsIntent(r).id,'heavy');
  }
});

test('elite victories offer a saved choice of three useful blessings and one free reroll',()=>{
  const s=ready(true);R.startRuins(s,1,()=>.4);const r=s.ruins.run;r.paths=['elite','trail'];R.chooseRuinsPath(s,'elite');
  while(r.phase==='battle')R.ruinsBattleTurn(s,r.focus>=2?'skill':'attack');
  assert.equal(r.offers.length,3);assert.ok(r.offers.every(id=>!RUINS_BLESSING_BY_ID[id].element||['leaf','water','fire'].includes(RUINS_BLESSING_BY_ID[id].element)));
  const first=[...r.offers];assert.ok(!R.rerollRuinsBlessings(s).error);assert.ok(r.offers.every(id=>!first.includes(id)));assert.ok(R.rerollRuinsBlessings(s).error);
  const loaded=E.validateSave(E.serialize(s));assert.deepEqual(loaded.ruins.run.offers,r.offers);assert.equal(loaded.ruins.run.rerolled,true);
  const id=r.offers[0];R.chooseRuinsBlessing(s,id);assert.equal(r.blessings[id],1);assert.equal(r.floor,2);assert.ok(R.chooseRuinsBlessing(s,id).error);E.validateSave(E.serialize(s));
});

test('low rarity and elemental teams gain meaningful power from compatible builds',()=>{
  const s=battleAt(5);const r=s.ruins.run;const base=R.ruinsPower(r);r.blessings={humble:1};assert.ok(R.ruinsPower(r)>base);
  assert.ok(R.ruinsPower(r,'water')>R.ruinsPower(r));r.blessings={harmony:1};assert.ok(R.ruinsPower(r)>base);
  r.blessings={unison:1};assert.throws(()=>E.validateSave(E.serialize(s)),/Phế Tích/);
});

test('retreat and defeat preserve banked rewards, floor records and a durable result without repaying',()=>{
  const s=ready(true);R.startRuins(s,1,()=>.3);complete(s,3);const balance=clone(s.resources),dust=s.ruins.dust,best=s.ruins.best;
  const result=R.retreatRuins(s);assert.equal(result.result.status,'retreat');assert.equal(s.ruins.run,null);assert.deepEqual(s.resources,balance);assert.equal(s.ruins.dust,dust);assert.equal(s.ruins.best,best);assert.ok(R.retreatRuins(s).error);E.validateSave(E.serialize(s));
  const lost=battleAt(21);lost.ruins.dust=100;lost.ruins.run.hp=1;lost.ruins.run.members.forEach(m=>m.power=1);const food=lost.resources.food;
  const loss=R.ruinsBattleTurn(lost,'attack');assert.equal(loss.result.status,'defeat');assert.equal(lost.ruins.best,20);assert.equal(lost.ruins.dust,100);assert.equal(lost.resources.food,food);assert.equal(E.validateSave(E.serialize(lost)).ruins.lastResult.status,'defeat');
});

test('milestones pay once after the threshold and relics and exchanges obey currency and caps',()=>{
  const s=ready();assert.ok(R.claimRuinsMilestone(s,5).error);s.ruins.best=10;s.ruins.clears=10;s.ruins.bosses=2;
  const tickets=s.resources.tickets;assert.ok(!R.claimRuinsMilestone(s,10).error);assert.ok(s.resources.tickets>tickets);const once=clone(s.resources);assert.ok(R.claimRuinsMilestone(s,10).error);assert.deepEqual(s.resources,once);
  assert.ok(R.upgradeRuinsRelic(s,'lantern').error);s.ruins.dust=1000;
  for(let i=0;i<5;i++)assert.ok(!R.upgradeRuinsRelic(s,'lantern').error);assert.equal(s.ruins.relics.lantern,5);assert.ok(R.upgradeRuinsRelic(s,'lantern').error);
  const before=s.ruins.dust,eggs=s.resources.tickets;R.exchangeRuinsDust(s,'eggs');assert.equal(s.ruins.dust,before-45);assert.equal(s.resources.tickets,eggs+2);
  s.ruins.dust=0;assert.ok(R.exchangeRuinsDust(s,'eggs').error);E.validateSave(E.serialize(s));
});

test('a complete fifty-floor journey opens checkpoints, banks the final boss and cannot double-finish',()=>{
  const s=ready(true);R.startRuins(s,1,()=>.38);complete(s);
  assert.equal(s.ruins.best,50);assert.equal(s.ruins.run,null);assert.equal(s.ruins.lastResult.status,'victory');assert.equal(s.ruins.lastResult.cleared,50);assert.equal(s.ruins.bosses,10);
  const wallet=clone(s.resources);assert.ok(R.ruinsBattleTurn(s,'skill').error);assert.deepEqual(s.resources,wallet);assert.ok(!R.claimRuinsMilestone(s,50).error);
  assert.ok(!R.startRuins(s,41,()=>.2).error);assert.equal(s.ruins.run.floor,41);assert.deepEqual(s.ruins.run.blessings,{});E.validateSave(E.serialize(s));
});

test('corrupt combat, choices, snapshot, potion and phase data cannot enter an imported save',()=>{
  const base=battleAt(5);
  const mutations=[r=>r.hp=0,r=>r.hp=9999,r=>r.focus=4,r=>r.potions=9,r=>r.battle.hp=9999,r=>r.battle.turn=-1,r=>r.path='__proto__',r=>r.members[0].id='sunfox',r=>r.blessings={might:9},r=>r.blessings={wind:1},r=>r.phase='finished',r=>r.offers=['might'],r=>r.cleared=0];
  for(const mutate of mutations){const s=clone(base);mutate(s.ruins.run);assert.throws(()=>E.validateSave(E.serialize(s)),/Phế Tích/);}
  const both=clone(base);both.expedition={};assert.throws(()=>E.validateSave(E.serialize(both)),/Phế Tích/);
});

test('varied long runs stay saveable, keep useful choices, and reward growth rather than starter strength alone',()=>{
  const floors=[];
  for(let i=1;i<=18;i++){
    const s=ready(i>12);if(i>6&&i<=12)for(const p of s.pets){p.level=10;p.stars=1;p.bond=30;}
    R.startRuins(s,1,()=>i/20);complete(s);assert.equal(s.ruins.run,null);assert.ok(s.ruins.dust>=0);assert.ok(s.resources.food>=0);floors.push(s.ruins.best);
  }
  assert.ok(floors.slice(0,6).every(n=>n<50));assert.ok(floors.slice(12).some(n=>n===50));
});
