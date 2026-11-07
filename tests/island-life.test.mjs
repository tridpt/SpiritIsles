import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { SPECIES } from '../web/js/data.js';
import { PAT_COOLDOWN, careStatus, lifeProfile } from '../web/js/island-care.js';
import { eventFixture } from './ruins-route-fixtures.mjs';

const NOW=new Date(2026,9,21,12).getTime();
test('petting grants one existing bond point and never consumes food, XP or a feeding quest',()=>{
  const s=E.newGame(NOW),before=structuredClone(s);
  const r=E.patPet(s,'mossfox',NOW);
  assert.equal(r.gained,1);assert.equal(s.pets[0].bond,1);assert.equal(r.remaining,2);
  assert.deepEqual(s.resources,before.resources);assert.deepEqual(s.stats,before.stats);assert.deepEqual(s.daily,before.daily);assert.equal(s.xp,before.xp);
  assert.deepEqual(E.validateSave(E.serialize(s),NOW).pets,s.pets);
});
test('repeated petting reacts without farming bond, including after a save reload',()=>{
  let s=E.newGame(NOW);E.patPet(s,'mossfox',NOW);
  s=E.validateSave(E.serialize(s),NOW);
  for(let i=0;i<15;i++)assert.equal(E.patPet(s,'mossfox',NOW+1000).gained,0);
  assert.equal(s.pets[0].bond,1);assert.equal(E.patPet(s,'mossfox',NOW+PAT_COOLDOWN-1).gained,0);
  assert.equal(E.patPet(s,'mossfox',NOW+PAT_COOLDOWN).gained,1);
  assert.equal(E.patPet(s,'mossfox',NOW+2*PAT_COOLDOWN).gained,1);
  const capped=structuredClone(s);
  assert.equal(E.patPet(s,'mossfox',NOW+3*PAT_COOLDOWN).remaining,0);assert.deepEqual(s,capped);
});
test('care limits are per pet and reset at the local date boundary while cooldown is retained',()=>{
  const s=E.newGame(NOW),late=new Date(2026,9,21,23,59).getTime();
  E.patPet(s,'mossfox',late);assert.equal(E.patPet(s,'axolotl',late).gained,1);
  assert.equal(careStatus(s.pets[0],late+60000).remaining,3);
  assert.equal(E.patPet(s,'mossfox',late+60000).gained,0);
  assert.equal(E.patPet(s,'mossfox',late+PAT_COOLDOWN).gained,1);
  assert.equal(s.pets[0].care.pats,1);
});
test('max bond and unknown pets cannot change progress, and invalid time is rejected',()=>{
  const s=E.newGame(NOW);s.pets[0].bond=100;const before=structuredClone(s);
  assert.equal(E.patPet(s,'mossfox',NOW).full,true);
  for(const id of ['missing','__proto__'])assert.ok(E.patPet(s,id,NOW).error);
  for(const time of [NaN,Infinity,-1])assert.ok(E.patPet(s,'axolotl',time).error);
  assert.deepEqual(s,before);
});
test('old saves retain pets without adding care records until an interaction',()=>{
  const s=E.newGame(NOW),restored=E.validateSave(E.serialize(s),NOW);
  assert.deepEqual(restored.pets,s.pets);assert.equal(careStatus(restored.pets[0],NOW).remaining,3);
  E.patPet(restored,'mossfox',NOW);assert.equal(Object.hasOwn(restored.pets[1],'care'),false);
});
test('import rejects malformed care records and accepts a bounded future clock',()=>{
  for(const care of [null,[],{}, {date:'2026-10-21',pats:4,lastPat:NOW},{date:'wrong',pats:1,lastPat:NOW},{date:'2026-10-21',pats:1,lastPat:-1},{date:'2026-10-24',pats:1,lastPat:NOW+3*86400000}]){
    const s=E.newGame(NOW);s.pets[0].care=care;assert.throws(()=>E.validateSave(E.serialize(s),NOW),/vuốt ve/);
  }
  const s=E.newGame(NOW);E.patPet(s,'mossfox',NOW);assert.equal(E.validateSave(E.serialize(s),NOW-60000).pets[0].bond,1);
});
test('island care never changes an active route, its combat snapshot, event or RNG',()=>{
  const s=eventFixture('chest'),run=structuredClone(s.ruins),resources={...s.resources};
  E.patPet(s,s.team[0],Date.now());assert.deepEqual(s.ruins,run);assert.deepEqual(s.resources,resources);
  E.feed(s,s.team[0]);assert.deepEqual(s.ruins,run);assert.deepEqual(E.validateSave(E.serialize(s)).ruins,run);
});
test('all 58 creatures have an anatomical gait, with distinct starter movement',()=>{
  for(const s of SPECIES){const p=lifeProfile(s);assert.ok(['trot','hop','waddle','glide'].includes(p.gait));assert.ok(p.speed>0);assert.ok(p.trait&&p.play);}
  assert.equal(new Set(SPECIES.filter(s=>['mossfox','axolotl','emberbird'].includes(s.id)).map(s=>lifeProfile(s).gait)).size,3);
});
