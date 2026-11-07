import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { BIOMES, SPECIES, BUILDINGS } from '../web/js/data.js';

const NOW=new Date(2026,9,20,12,0,0).getTime();
const game=()=>E.newGame(NOW);
const rng=()=>0.9;
const roundtrip=s=>E.validateSave(E.serialize(s),NOW);

test('a new island has a usable team and survives a save round trip',()=>{
  const s=game();assert.equal(s.pets.length,3);assert.equal(s.team.length,3);assert.ok(E.teamPower(s).power>50);assert.deepEqual(roundtrip(s).pets,s.pets);
});
test('hatching spends the displayed resource once and rejects invalid requests',()=>{
  const s=game();s.level=10;const before={...s.resources};assert.ok(E.hatch(s,2,'nature',rng,NOW).error);assert.deepEqual(s.resources,before);
  E.hatch(s,10,'nature',rng,NOW);assert.equal(s.resources.tickets,0);assert.equal(s.resources.crystals,before.crystals);
  E.hatch(s,1,'nature',rng,NOW);assert.equal(s.resources.crystals,before.crystals-80);
  const unchanged=JSON.stringify(s);assert.ok(E.hatch(s,10,'star',rng,NOW).error);assert.equal(JSON.stringify(s),unchanged);
});
test('a ten-pull guarantees SR and the fiftieth low roll guarantees SSR',()=>{
  const s=game();s.resources.tickets=60;let final;
  for(let i=0;i<5;i++){final=E.hatch(s,10,'nature',rng,NOW);assert.equal(final.results.length,10);assert.ok(final.results.some(r=>['SR','SSR'].includes(SPECIES.find(p=>p.id===r.species).rarity)));roundtrip(s);}
  assert.equal(SPECIES.find(p=>p.id===final.results.at(-1).species).rarity,'SSR');assert.equal(s.pity,0);assert.equal(s.srPity,0);
});
test('star and nature eggs share pity and SSR resets both counters',()=>{
  const s=game();s.pity=49;s.srPity=9;const r=E.hatch(s,1,'star',rng,NOW);assert.equal(SPECIES.find(p=>p.id===r.results[0].species).rarity,'SSR');assert.equal(s.pity,0);assert.equal(s.srPity,0);assert.equal(s.resources.crystals,150);
});
test('duplicate species remain unique and grant shards and essence',()=>{
  const s=game();const first=E.hatch(s,1,'nature',rng,NOW).results[0];const count=s.pets.length;const r=E.hatch(s,1,'nature',rng,NOW).results[0];assert.equal(r.species,first.species);assert.equal(r.isNew,false);assert.equal(s.pets.length,count);assert.ok(s.pets.find(p=>p.species===r.species).shards>0);assert.ok(s.resources.essence>0);
});
test('feeding levels pets and cannot spend unavailable food',()=>{
  const s=game();const power=E.petPower(s.pets[0]);E.feed(s,'mossfox',NOW);E.feed(s,'mossfox',NOW);assert.equal(s.pets[0].level,2);assert.equal(s.pets[0].bond,6);assert.ok(E.petPower(s.pets[0])>power);
  s.resources.food=0;const unchanged=JSON.stringify(s);assert.ok(E.feed(s,'mossfox',NOW).error);assert.equal(JSON.stringify(s),unchanged);
});
test('evolution obeys level and resource requirements and uses duplicate shards',()=>{
  const s=game();assert.ok(E.evolve(s,'mossfox').error);const p=s.pets[0];p.level=5;p.shards=5;s.resources.essence=3;const before=E.petPower(p);assert.ok(!E.evolve(s,p.id).error);assert.equal(p.stars,1);assert.equal(p.shards,0);assert.equal(s.resources.essence,0);assert.ok(E.petPower(p)>before);assert.ok(E.evolve(s,p.id).error);
});
test('offline production caps at eight hours and collection cannot be repeated',()=>{
  const s=game();const after=NOW+24*3600000;const expected=E.pendingProduction(s,NOW+8*3600000);assert.deepEqual(E.pendingProduction(s,after),expected);const before=s.resources.food;E.collect(s,after);assert.equal(s.resources.food,before+expected.food);assert.deepEqual(E.collect(s,after),{});assert.deepEqual(E.pendingProduction(s,NOW-1000),{});
});
test('production bonuses match the promised creature perk',()=>{
  const s=game();const garden=BUILDINGS.find(b=>b.id==='garden');assert.equal(E.productionBonus(s,garden),1.08);s.pets.push(E.makePet('forestking',NOW));assert.equal(E.productionBonus(s,garden),1.33);
});
test('upgrading collects existing production and obeys island unlocks',()=>{
  const s=game();const before=s.resources.food;assert.ok(!E.upgradeBuilding(s,'garden',NOW+60000).error);assert.ok(s.resources.food>before);assert.equal(s.buildings.garden.level,2);assert.equal(s.stats.builds,1);assert.ok(E.upgradeBuilding(s,'observatory',NOW).error);roundtrip(s);
});
test('quest and daily rewards can only be claimed once',()=>{
  const s=game();E.hatch(s,1,'nature',rng,NOW);assert.ok(!E.claimQuest(s,'first-hatch').error);const snapshot=JSON.stringify(s);assert.ok(E.claimQuest(s,'first-hatch').error);assert.equal(JSON.stringify(s),snapshot);
  for(let i=0;i<3;i++)E.feed(s,'mossfox',NOW);assert.ok(!E.claimDaily(s,'feed',NOW).error);assert.ok(E.claimDaily(s,'feed',NOW).error);E.refreshDaily(s,NOW+86400000);assert.equal(s.daily.feeds,0);assert.deepEqual(s.daily.claimed,[]);
});
test('check-in keeps a consecutive streak, rejects repeats, and resets after a missed day',()=>{
  const s=game();assert.equal(E.checkIn(s,NOW).day,1);assert.ok(E.checkIn(s,NOW).error);assert.equal(E.checkIn(s,NOW+86400000).day,2);assert.equal(E.checkIn(s,NOW+3*86400000).day,1);
});
function completeJourney(s){
  let result;let limit=100;
  while(s.expedition&&limit--){const ex=s.expedition;if(!ex.battle){const r=E.chooseRoute(s,0,()=>.1);assert.ok(!r.error);}
    else{const b=ex.battle;result=E.battleTurn(s,b.focus>=2?'skill':(b.round+1)%3===0?'guard':'attack',()=>.5);assert.ok(!result.error);}if(s.expedition)roundtrip(s);}
  assert.ok(limit>0,'journey must terminate');return result;
}
test('starter team can finish the forest, earn first-clear tickets, and save every turn',()=>{
  const s=game();assert.ok(!E.startExpedition(s,'forest',()=>.1,NOW).error);const r=completeJourney(s);assert.equal(r.success,true);assert.equal(s.expedition,null);assert.equal(s.clears.forest,1);assert.equal(s.stats.expeditions,1);assert.ok(r.reward.tickets>=2);assert.ok(s.resources.gold>1650);roundtrip(s);
});
test('expeditions lock the team and cannot double-pay completion',()=>{
  const s=game();E.startExpedition(s,'forest',()=>.1,NOW);assert.ok(E.toggleTeam(s,'mossfox').error);assert.ok(E.startExpedition(s,'forest').error);E.chooseRoute(s,0,()=>.1);const r=E.finishExpedition(s,false,()=>.5,NOW,true);assert.equal(r.finished,true);assert.ok(E.finishExpedition(s,true).error);assert.ok(!E.toggleTeam(s,'mossfox').error);
});
test('guard mitigates the telegraphed third hit and skill requires focus',()=>{
  const s=game();E.startExpedition(s,'forest',()=>.1,NOW);E.chooseRoute(s,0,()=>.1);s.expedition.battle.hp=100;s.expedition.battle.power=150;s.expedition.battle.round=2;assert.ok(E.battleTurn(s,'skill',()=>.5).error);const a=structuredClone(s);const b=structuredClone(s);const hit=E.battleTurn(a,'attack',()=>.5);const blocked=E.battleTurn(b,'guard',()=>.5);assert.ok(blocked.incoming<hit.incoming*.3);assert.equal(b.expedition.battle.focus,1);
});
test('save validation rejects corrupt or unsupported data instead of crashing the island',()=>{
  const s=game();const mutate=fn=>{const data=JSON.parse(E.serialize(s));fn(data.state);return ()=>E.validateSave(data,NOW);};
  assert.throws(()=>E.validateSave('{',NOW));assert.throws(()=>E.validateSave({app:'Other',version:1,state:s},NOW));
  assert.throws(mutate(x=>x.resources.gold=-1));assert.throws(mutate(x=>x.resources.extra=99));assert.throws(mutate(x=>x.pets[0].species='unknown'));assert.throws(mutate(x=>x.team=['unknown']));assert.throws(mutate(x=>x.buildings.garden.level=900));assert.throws(mutate(x=>x.daily.claimed=['invalid']));
});
test('repeated full gameplay remains saveable and resources stay nonnegative',()=>{
  const s=game();s.resources.tickets=1000;s.resources.food=100000;s.resources.gold=100000;s.resources.wood=10000;
  for(let i=0;i<30;i++){E.hatch(s,10,'nature',rng,NOW);for(const id of s.team)E.feed(s,id,NOW);E.startExpedition(s,'forest',()=>.1,NOW);completeJourney(s);for(const q of ['first-hatch','feed-five','journey-one','friends-eight','hatch-twenty','explorer'])E.claimQuest(s,q);E.upgradeBuilding(s,'garden',NOW);roundtrip(s);assert.ok(Object.values(s.resources).every(n=>n>=0));}
});
