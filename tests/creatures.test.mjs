import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import { SPECIES, GACHA_SPECIES, BY_ID, ELEMENTS, QUESTS } from '../web/js/data.js';
import { NEW_SPECIES } from '../web/js/creature-catalog.js';

const NOW=new Date(2026,9,20,12).getTime();
const rollFor={nature:{N:.9,R:.3,SR:.1,SSR:.01},star:{R:.9,SR:.2,SSR:.01}};

test('every creature is reachable from its advertised source with an equal slot in its rarity',()=>{
  assert.equal(SPECIES.length,58);assert.equal(GACHA_SPECIES.length,55);assert.equal(NEW_SPECIES.length,30);
  assert.equal(new Set(SPECIES.map(s=>s.id)).size,SPECIES.length);
  for(const el of Object.keys(ELEMENTS))assert.equal(NEW_SPECIES.filter(s=>s.element===el).length,5);
  for(const banner of ['nature','star'])for(const species of GACHA_SPECIES){
    if(banner==='star'&&species.rarity==='N')continue;
    const pool=GACHA_SPECIES.filter(s=>s.rarity===species.rarity);const at=pool.indexOf(species);
    const random=[rollFor[banner][species.rarity],(at+.5)/pool.length];
    const s=E.newGame(NOW);const result=E.hatch(s,1,banner,()=>random.shift(),NOW);
    assert.equal(result.results[0].species,species.id,`${banner}: ${species.id}`);
    assert.equal(BY_ID[result.results[0].species].source,undefined);
    assert.ok(E.validateSave(E.serialize(s),NOW).pets.some(p=>p.id===species.id));
  }
});

test('each new SSR grants the existing legendary duplicate reward and remains usable for growth',()=>{
  for(const species of NEW_SPECIES.filter(s=>s.rarity==='SSR')){
    const s=E.newGame(NOW);const pool=GACHA_SPECIES.filter(s=>s.rarity==='SSR');
    const random=()=>{let phase=0;return ()=>phase++%2===0?.001:(pool.indexOf(species)+.5)/pool.length;};
    E.hatch(s,1,'nature',random(),NOW);const before=s.resources.essence;
    const again=E.hatch(s,1,'nature',random(),NOW);
    assert.equal(again.results[0].isNew,false);assert.equal(again.results[0].shards,8);
    assert.equal(s.pets.filter(p=>p.id===species.id).length,1);assert.equal(s.resources.essence,before+5);
    const p=s.pets.find(p=>p.id===species.id);p.level=5;
    const power=E.petPower(p);assert.ok(!E.evolve(s,p.id).error);assert.ok(E.petPower(p)>power);assert.equal(p.shards,0);
    assert.ok(!E.feed(s,p.id,NOW).error);assert.ok(!E.toggleTeam(s,s.team[2]).error);assert.ok(!E.toggleTeam(s,p.id).error);
    E.validateSave(E.serialize(s),NOW);
  }
});

test('a complete 1.2 collection and an active ruin and breeding egg survive the catalog expansion unchanged',()=>{
  const s=E.newGame(NOW);const fresh=new Set(NEW_SPECIES.map(s=>s.id));
  s.pets=SPECIES.filter(s=>!fresh.has(s.id)).map(s=>({...E.makePet(s.id,NOW),level:5,bond:12}));
  assert.equal(s.pets.length,28);s.level=4;s.pity=37;s.srPity=6;s.ruins.best=5;s.ruins.clears=5;s.ruins.bosses=1;s.ruins.dust=82;
  assert.ok(!E.startBreeding(s,'mossfox','axolotl',null,()=>0,NOW).error);
  assert.ok(!R.startRuins(s,1,()=>.5,NOW).error);
  const restored=E.validateSave(E.serialize(s),NOW);
  assert.deepEqual(restored,s);assert.equal(restored.ruins.run.phase,'path');assert.equal(restored.breeding.egg.species,'lotusseal');
});

test('expanded collection milestones award only earned thresholds, once, and persist in backups',()=>{
  const s=E.newGame(NOW);const targets=QUESTS.filter(q=>['friends-thirty','friends-fortyfive','friends-everyone'].includes(q.id));
  assert.deepEqual(targets.map(q=>q.target),[30,45,58]);
  for(const q of targets){
    const before=structuredClone(s);assert.ok(E.claimQuest(s,q.id,NOW).error);assert.deepEqual(s,before);
    s.pets=SPECIES.slice(0,q.target).map(p=>E.makePet(p.id,NOW));
    const tickets=s.resources.tickets;assert.ok(!E.claimQuest(s,q.id,NOW).error);assert.ok(s.resources.tickets>=tickets+q.reward.tickets);
    const after=structuredClone(s);assert.ok(E.claimQuest(s,q.id,NOW).error);assert.deepEqual(s,after);
    assert.ok(E.validateSave(E.serialize(s),NOW).claimed.includes(q.id));
  }
});
