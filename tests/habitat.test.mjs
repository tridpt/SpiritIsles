import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import * as H from '../web/js/habitat-engine.js';
import {SPECIES, BY_ID} from '../web/js/data.js';
import {HABITAT_MOMENTS, HABITAT_MILESTONES, momentApplies} from '../web/js/habitat-data.js';
import {placeItem, commitLayout} from '../web/js/island-layout.js';
import {eventFixture, battleFixture} from './ruins-route-fixtures.mjs';

const clone=structuredClone;
const empty=()=>({version:1,nextId:1,placed:[]});
export function habitatFixture() {
  const s=E.newGame();s.level=3;s.pets=SPECIES.map(p=>({...E.makePet(p.id),bond:100}));
  s.boss.best=1;s.boss.wins=1;s.boss.clears[0]=1;
  s.ruins.best=5;s.ruins.clears=5;s.ruins.bosses=1;
  s.clears.reef=5;s.clears.volcano=5;
  return s;
}
function arrange(s,m) {
  s.islandLayout=empty();assert.ok(!placeItem(s,s.islandLayout,m.decor[0],0,0).error);
  if(m.near)assert.ok(!placeItem(s,s.islandLayout,m.near[0],2,0).error);
}
function collect(s,count) {
  let n=0;
  for(const p of s.pets)for(const m of H.momentsFor(p.species)){
    arrange(s,m);assert.equal(H.discoverMoment(s,p.id,m.id).isNew,true);
    if(++n===count)return;
  }
}

test('every species has a compatible collection and all 22 behaviors can actually be discovered',()=>{
  const s=habitatFixture();
  assert.equal(HABITAT_MOMENTS.length,22);assert.equal(new Set(HABITAT_MOMENTS.map(m=>m.id)).size,22);
  for(const p of s.pets)assert.ok(H.momentsFor(p.species).length>=8,p.id);
  for(const m of HABITAT_MOMENTS){
    const p=s.pets.find(p=>momentApplies(BY_ID[p.species],m));assert.ok(p,m.id);arrange(s,m);
    assert.equal(H.momentStatus(s,p.id,m.id).canPlay,true,m.id);assert.equal(H.discoverMoment(s,p.id,m.id).isNew,true);
  }
  assert.equal(H.habitatSummary(s).count,22);assert.equal(H.habitatSummary(s).total,592);
  assert.deepEqual(E.validateSave(E.serialize(s)).habitat,s.habitat);
});

test('viewing requirements and unavailable behaviors is read only',()=>{
  const s=E.newGame(),before=clone(s);
  assert.equal(H.momentStatus(s,'mossfox','shade-nap').canPlay,true);
  assert.ok(H.momentStatus(s,'mossfox','pond-bubbles').error);
  assert.ok(H.momentStatus(s,'phoenix','shade-nap').error);
  for(const id of ['__proto__','constructor','unknown'])assert.ok(H.discoverMoment(s,'mossfox',id).error);
  assert.ok(H.discoverMoment(s,'mossfox','bench-rest').error);
  assert.ok(H.momentStatus(s,'mossfox','picnic-friends').reasons.length>=3);
  H.habitatSummary(s);H.decorMomentHint('pond');assert.deepEqual(s,before);
});

test('only committed furniture enables a moment; a draft or an item in storage does not',()=>{
  const s=E.newGame(),draft=clone(s.islandLayout);
  assert.ok(!placeItem(s,draft,'swing',6,5).error);
  assert.equal(H.momentStatus(s,'mossfox','swing-play').canPlay,false);
  assert.ok(!commitLayout(s,draft).error);
  assert.equal(H.momentStatus(s,'mossfox','swing-play').canPlay,true);
});

test('nearby furniture uses the nearest occupied cells and respects rotation and the two-cell boundary',()=>{
  const a={type:'bench',x:0,y:0,rotation:0},b={type:'flowers',x:3,y:0,rotation:0};
  assert.equal(H.furnitureDistance(a,b),2);assert.equal(H.furnitureDistance({...a,rotation:1},b),3);
  assert.equal(H.furnitureDistance(a,{...b,x:0,y:3}),3);
  const s=habitatFixture();s.islandLayout={version:1,nextId:1,placed:[{...a,id:'seat'},{...b,id:'bloom'}]};
  assert.equal(H.momentStatus(s,'mossfox','picnic-friends').canPlay,true);
  s.islandLayout.placed[0].rotation=1;assert.equal(H.momentStatus(s,'mossfox','picnic-friends').canPlay,false);
  s.islandLayout.placed.push({id:'closer',type:'bench',x:3,y:1,rotation:0});
  assert.equal(H.momentStatus(s,'mossfox','picnic-friends').decoration.id,'closer');
});

test('bond requirements and species restrictions cannot be bypassed',()=>{
  const s=habitatFixture(),m=HABITAT_MOMENTS.find(m=>m.id==='legend-aurora');arrange(s,m);
  const p=s.pets.find(p=>BY_ID[p.species].rarity==='SSR');p.bond=39;const before=clone(s);
  assert.ok(H.discoverMoment(s,p.id,m.id).error);assert.ok(H.discoverMoment(s,'mossfox',m.id).error);assert.deepEqual(s,before);
  p.bond=40;assert.equal(H.discoverMoment(s,p.id,m.id).isNew,true);
});

test('new memories give at most two bond, once per species and behavior, including after reload',()=>{
  const s=E.newGame();s.pets[0].bond=99;
  const r=H.discoverMoment(s,'mossfox','shade-nap');assert.equal(r.gained,1);assert.equal(s.pets[0].bond,100);
  const after=clone(s);assert.equal(H.discoverMoment(s,'mossfox','shade-nap').isNew,false);assert.deepEqual(s,after);
  const loaded=E.validateSave(E.serialize(s));assert.equal(H.discoverMoment(loaded,'mossfox','shade-nap').gained,0);
  assert.equal(H.discoverMoment(loaded,'axolotl','shade-nap').gained,2);assert.equal(H.habitatSummary(loaded).count,2);
});

test('invalid record times and unavailable pets leave all state unchanged',()=>{
  const s=E.newGame(),before=clone(s);
  for(const now of [-1,NaN,Infinity,Date.now()+172800000])assert.ok(H.discoverMoment(s,'mossfox','shade-nap',now).error);
  assert.ok(H.discoverMoment(s,'not-owned','shade-nap').error);assert.deepEqual(s,before);
});

test('a duo requires a bonded other-element friend and can include owned pets outside the battle team',()=>{
  const s=E.newGame(),m=HABITAT_MOMENTS.find(m=>m.id==='picnic-friends');s.pets[0].bond=20;arrange(s,m);
  s.pets.push({...E.makePet('forestking'),bond:100});assert.equal(H.momentStatus(s,'mossfox',m.id).canPlay,false);
  s.pets.find(p=>p.id==='axolotl').bond=9;assert.equal(H.momentStatus(s,'mossfox',m.id).canPlay,false);
  s.pets.find(p=>p.id==='axolotl').bond=10;s.team=['emberbird'];const before=clone(s.team);
  assert.equal(H.discoverMoment(s,'mossfox',m.id).entry.partner,'axolotl');assert.deepEqual(s.team,before);
  assert.deepEqual(E.validateSave(E.serialize(s)).habitat,s.habitat);
});

test('each collection milestone pays once, persists across round trips, and respects the resource cap',()=>{
  const s=habitatFixture(),before=clone(s);assert.ok(H.claimHabitatMilestone(s,'first-five').error);assert.deepEqual(s,before);
  collect(s,150);for(const key of Object.keys(s.resources))s.resources[key]=99999998;
  for(const m of HABITAT_MILESTONES){assert.deepEqual(H.claimHabitatMilestone(s,m.id).reward,m.reward);const once=clone(s);assert.ok(H.claimHabitatMilestone(s,m.id).error);assert.deepEqual(s,once);}
  assert.ok(Object.values(s.resources).every(n=>n<=99999999));assert.equal(H.habitatSummary(s).ready.length,0);
  const loaded=E.validateSave(E.serialize(s));assert.deepEqual(loaded.habitat,s.habitat);assert.ok(H.claimHabitatMilestone(loaded,'first-five').error);
});

test('recorded memories remain after their furniture is stored or moved away',()=>{
  const s=E.newGame();H.discoverMoment(s,'mossfox','shade-nap');s.islandLayout=empty();
  assert.equal(H.momentStatus(s,'mossfox','shade-nap').discovered,true);assert.equal(H.momentStatus(s,'mossfox','shade-nap').canPlay,false);
  assert.equal(E.validateSave(E.serialize(s)).habitat.discovered['mossfox:shade-nap'].decoration,'sapling');
});

test('legacy saves migrate without progress changes or mutation of the imported source',()=>{
  const s=eventFixture('chest');delete s.habitat;const raw=E.serialize(s),before=clone(s),loaded=E.validateSave(raw);
  assert.deepEqual(loaded.habitat,{version:1,discovered:{},claimed:[]});delete loaded.habitat;
  assert.deepEqual(loaded,before);assert.deepEqual(s,before);
});

test('malformed memories, impossible species, partners and unearned claims are rejected',()=>{
  const base=E.newGame(),entry={at:Date.now(),decoration:'sapling'};
  const invalid=[null,[],{}, {version:2,discovered:{},claimed:[]}, {version:1,discovered:[],claimed:[]},
    {version:1,discovered:{'mossfox:shade-nap':entry},claimed:['first-five']},
    {version:1,discovered:{},claimed:['twelve','twelve']}];
  for(const [key,e] of [['unknown:shade-nap',entry],['mossfox:unknown',entry],['mossfox:pond-bubbles',{...entry,decoration:'pond'}],
    ['mossfox:shade-nap',{...entry,decoration:'bench'}],['mossfox:shade-nap',{...entry,at:-1}],['mossfox:shade-nap',{...entry,at:Date.now()+172800000}],
    ['mossfox:shade-nap',{...entry,partner:'axolotl'}],['mossfox:picnic-friends',{...entry,decoration:'bench',partner:'mossfox'}],
    ['mossfox:picnic-friends',{...entry,decoration:'bench',partner:'forestking'}]])invalid.push({version:1,discovered:{[key]:e},claimed:[]});
  for(const habitat of invalid){const s=clone(base);s.habitat=habitat;const before=clone(s);assert.throws(()=>E.validateSave(E.serialize(s)),/Sổ khoảnh khắc/);assert.deepEqual(s,before);}
  assert.deepEqual(base.habitat,{version:1,discovered:{},claimed:[]});
});

test('discovering moments preserves active events, battle snapshots, team, resources and RNG',()=>{
  for(const s of [eventFixture('chest'),battleFixture()]){
    s.pets[0].bond=10;const before=clone(s);assert.equal(H.discoverMoment(s,'mossfox','shade-nap').isNew,true);
    assert.deepEqual({...s,pets:before.pets,habitat:before.habitat},before);
    assert.deepEqual(s.ruins.run,before.ruins.run);assert.deepEqual(E.validateSave(E.serialize(s)).ruins,before.ruins);
  }
});

test('daily hints are stable within the device day and rotate at local midnight without touching the save',()=>{
  const s=eventFixture('chest'),before=clone(s),morning=new Date(2026,9,24,0,1).getTime();
  const first=H.dailyHabitatHint(s,morning);
  assert.deepEqual(H.dailyHabitatHint(s,morning+20*3600000),first);
  const next=H.dailyHabitatHint(s,new Date(2026,9,25,0,0).getTime());
  assert.notEqual(`${first.pet.id}:${first.moment.id}`,`${next.pet.id}:${next.moment.id}`);
  assert.equal(first.date,E.dayKey(morning));assert.equal(next.date,E.dayKey(new Date(2026,9,25).getTime()));
  assert.deepEqual(s,before);
});

test('daily hints include owned friends outside the battle team and ignore pet array ordering',()=>{
  const s=E.newGame();s.team=['emberbird'];const seen=new Set();
  for(let day=1;day<=20;day++){
    const now=new Date(2026,9,day).getTime(),hint=H.dailyHabitatHint(s,now);seen.add(hint.pet.id);
    assert.ok(s.pets.some(p=>p.id===hint.pet.id));assert.equal(hint.status.discovered,false);
    const reordered=clone(s);reordered.pets.reverse();
    assert.equal(H.dailyHabitatHint(reordered,now).pet.id,hint.pet.id);
    assert.equal(H.dailyHabitatHint(reordered,now).moment.id,hint.moment.id);
  }
  assert.ok(seen.has('mossfox'));assert.ok(seen.has('axolotl'));assert.ok(seen.has('emberbird'));
});

test('discovering the suggested moment advances the hint immediately and replay cannot farm bond',()=>{
  const s=E.newGame(),now=Date.now(),hint=H.dailyHabitatHint(s,now),key=`${hint.pet.id}:${hint.moment.id}`,before=clone(s);
  assert.equal(hint.ready,true);assert.equal(H.discoverMoment(s,hint.pet.id,hint.moment.id,now).isNew,true);
  const next=H.dailyHabitatHint(s,now);assert.notEqual(`${next.pet.id}:${next.moment.id}`,key);
  assert.equal(next.ready,true);assert.deepEqual(s.resources,before.resources);assert.deepEqual(s.team,before.team);
  const recorded=clone(s);assert.equal(H.discoverMoment(s,hint.pet.id,hint.moment.id,now).gained,0);assert.deepEqual(s,recorded);
  assert.deepEqual(H.dailyHabitatHint(E.validateSave(E.serialize(s)),now),next);
});

test('when no new moment is ready the daily hint explains the closest missing conditions without unlocking it',()=>{
  const s=E.newGame();s.islandLayout=empty();const before=clone(s);
  for(let day=1;day<=8;day++){
    const hint=H.dailyHabitatHint(s,new Date(2026,9,day).getTime());
    assert.equal(hint.ready,false);assert.equal(hint.complete,false);assert.equal(hint.status.reasons.length,1);
    assert.match(hint.status.reasons[0],/^Đặt /);assert.ok(H.discoverMoment(s,hint.pet.id,hint.moment.id).error);
  }
  assert.deepEqual(s,before);
});

test('finishing all owned pages produces a completion hint and a newly owned pet opens fresh suggestions',()=>{
  const s=habitatFixture();s.pets=s.pets.filter(p=>['mossfox','axolotl','emberbird'].includes(p.id));
  for(const p of s.pets)for(const m of H.momentsFor(p.species)){arrange(s,m);assert.equal(H.discoverMoment(s,p.id,m.id).isNew,true);}
  const done=H.dailyHabitatHint(s);assert.equal(done.complete,true);assert.equal(done.moment,null);assert.equal(done.ready,false);
  s.pets.push(E.makePet('phoenix'));s.islandLayout=E.newGame().islandLayout;
  const hint=H.dailyHabitatHint(s);assert.equal(hint.complete,false);assert.equal(hint.pet.id,'phoenix');assert.equal(hint.ready,true);
});

test('daily suggestions work with old saves and reject invalid clocks without changing state',()=>{
  const s=E.newGame();delete s.habitat;const before=clone(s);
  assert.equal(H.dailyHabitatHint(s).ready,true);assert.deepEqual(s,before);
  for(const now of [NaN,Infinity,-Infinity,9e15])assert.equal(H.dailyHabitatHint(s,now),null);
  assert.equal(H.dailyHabitatHint({...s,pets:[]}),null);
});
