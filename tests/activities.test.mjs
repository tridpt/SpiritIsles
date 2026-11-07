import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { BY_ID, QUESTS } from '../web/js/data.js';
import { FISH, FISH_SPOTS, BREED_RECIPES } from '../web/js/activities-data.js';

const NOW=new Date(2026,9,20,12).getTime();
const game=()=>E.newGame(NOW);
const save=(s,now=NOW)=>E.validateSave(E.serialize(s),now);
function parentsReady(s){s.level=2;for(const p of s.pets.slice(0,2)){p.level=3;p.bond=12;}return s;}
function catchOne(s,roll=.9,now=NOW,perfect=true){
  assert.ok(!E.castLine(s,'pond',()=>roll,now).error);
  let result;
  for(let i=0;i<3;i++){
    const ex=s.fishing.session;
    const target=ex.targets[i]+(perfect?0:0.08);
    result=E.reelFish(s,ex.roundStarted+Math.round(target*1300));
    assert.ok(!result.error);
  }
  return result;
}

test('legacy 1.0 saves migrate without changing pets, resources, pity, or a running journey',()=>{
  const s=game();E.startExpedition(s,'forest',()=>.2,NOW);E.chooseRoute(s,0,()=>.2);
  delete s.activitiesVersion;delete s.breeding;delete s.fishing;
  const original=structuredClone(s);const migrated=save(s);
  for(const key of Object.keys(original))assert.deepEqual(migrated[key],original[key]);
  assert.deepEqual(migrated.fishing,E.newActivities().fishing);assert.deepEqual(migrated.breeding,{total:0,egg:null});
  assert.ok(!Object.hasOwn(s,'fishing'),'migration must not modify caller input');
});

test('partly missing or malformed new activity data is rejected, not reset as an old save',()=>{
  const mutate=fn=>{const s=game();fn(s);assert.throws(()=>save(s));};
  mutate(s=>delete s.fishing);mutate(s=>s.breeding=null);mutate(s=>s.activitiesVersion=2);
  mutate(s=>s.fishing.rod=6);mutate(s=>s.fishing.bag.minnow=1);mutate(s=>s.fishing.claimed=[3]);
  mutate(s=>s.fishing.session={fish:'unknown'});mutate(s=>s.breeding.egg={species:'unknown'});
});

test('breeding enforces island, pet level, bond, distinct parents, inventory, and available resources',()=>{
  const s=game();
  for(const mutate of [()=>{},()=>{s.level=2;},()=>{s.pets[0].level=3;s.pets[1].level=3;},()=>{s.pets[0].bond=6;}]){
    mutate();const before=structuredClone(s);assert.ok(E.startBreeding(s,'mossfox','axolotl',null,()=>0,NOW).error);assert.deepEqual(s,before);
  }
  parentsReady(s);assert.ok(E.startBreeding(s,'mossfox','mossfox').error);assert.ok(E.startBreeding(s,'mossfox','axolotl','minnow').error);
  s.resources.gold=0;const before=structuredClone(s);assert.ok(E.startBreeding(s,'mossfox','axolotl',null,()=>0,NOW).error);assert.deepEqual(s,before);
});

test('breeding outcomes survive reload, mature offline, and cannot charge or pay twice',()=>{
  let s=parentsReady(game());const before=structuredClone(s.resources);const pity=[s.pity,s.srPity];
  const started=E.startBreeding(s,'mossfox','axolotl',null,()=>0,NOW);
  assert.equal(started.egg.species,'lotusseal');assert.equal(s.resources.gold,before.gold-200);assert.equal(s.resources.food,before.food-30);
  const locked=structuredClone(s);assert.ok(E.startBreeding(s,'mossfox','axolotl').error);assert.deepEqual(s,locked);
  assert.ok(E.claimBreeding(s,NOW+59999).error);s=save(s,NOW+3600000);
  const r=E.claimBreeding(s,NOW+3600000);assert.equal(r.results[0].species,'lotusseal');assert.equal(r.hybrid,true);assert.equal(s.breeding.total,1);assert.equal(s.pets.length,4);
  assert.deepEqual([s.pity,s.srPity],pity);assert.equal(s.stats.hatches,0);assert.equal(s.daily.hatches,0);
  const done=structuredClone(s);assert.ok(E.claimBreeding(s,NOW+3600000).error);assert.deepEqual(s,done);save(s,NOW+3600000);
});

test('a fish is consumed once, boosts recipe odds, shortens incubation, and duplicates yield shards',()=>{
  const s=parentsReady(game());catchOne(s);const plain=E.breedPreview(s,'mossfox','axolotl');const helped=E.breedPreview(s,'mossfox','axolotl','minnow');
  assert.equal(helped.chance,plain.chance+10);assert.equal(helped.duration,42000);
  E.startBreeding(s,'mossfox','axolotl','minnow',()=>0,NOW+5000);assert.equal(s.fishing.bag.minnow,0);save(s,NOW+5000);
  E.claimBreeding(s,NOW+47000);const first=s.pets.find(p=>p.id==='lotusseal');assert.equal(first.shards,0);
  const egg=E.startBreeding(s,'mossfox','axolotl',null,()=>0,NOW+50000).egg;assert.equal(egg.readyAt-egg.started,600000);
  const result=E.claimBreeding(s,egg.readyAt);assert.equal(result.results[0].isNew,false);assert.equal(first.shards,4);assert.equal(s.pets.length,4);save(s,egg.readyAt);
});

test('all recipe pairs work in either order and normal breeding respects parent elements',()=>{
  const ids={leaf:'mossfox',water:'axolotl',fire:'emberbird',wind:'cottonbun',light:'sunseal',shadow:'nightcat'};
  for(const recipe of BREED_RECIPES){
    const s=parentsReady(game());s.resources.gold=10000;s.resources.food=10000;
    for(const el of recipe.elements){if(!s.pets.some(p=>p.id===ids[el]))s.pets.push(E.makePet(ids[el],NOW));const p=s.pets.find(p=>p.id===ids[el]);p.level=3;p.bond=30;}
    const pair=recipe.elements.map(el=>ids[el]).reverse();const r=E.startBreeding(s,...pair,null,()=>0,NOW);assert.equal(r.egg.species,recipe.species);save(s);
    s.breeding.egg=null;const normal=E.startBreeding(s,...pair,null,()=>.9,NOW);assert.equal(BY_ID[normal.egg.species].source,undefined);assert.ok(recipe.elements.includes(BY_ID[normal.egg.species].element));save(s);
  }
});

test('gacha cannot roll breeding-only creatures and retains its SR guarantees',()=>{
  const s=game();s.resources.crystals=100000;
  for(const roll of [.02,.1,.3,.8,.999]){
    const r=E.hatch(s,10,'star',()=>roll,NOW);assert.ok(!r.error);assert.ok(r.results.every(p=>BY_ID[p.species].source!=='breeding'));assert.ok(r.results.some(p=>['SR','SSR'].includes(BY_ID[p.species].rarity)));
  }
});

test('fishing costs one bait, rejects locked spots, and cannot start a second cast',()=>{
  const s=game();const initial=structuredClone(s);assert.ok(E.castLine(s,'moon',()=>0,NOW).error);assert.deepEqual(s,initial);
  assert.ok(!E.castLine(s,'pond',()=>.9,NOW).error);assert.equal(s.resources.food,initial.resources.food-4);
  const active=structuredClone(s);assert.ok(E.castLine(s,'pond').error);assert.deepEqual(s,active);save(s);
  assert.ok(E.reelFish(s,NOW).error);assert.equal(s.fishing.session.hits.length,0);
});

test('three perfect taps catch a stored fish, grant one reward, and update the collection record',()=>{
  let s=game();E.castLine(s,'pond',()=>.9,NOW);const candidate=structuredClone(s.fishing.session);s=save(s,NOW);
  let result;
  for(let i=0;i<3;i++){const e=s.fishing.session;result=E.reelFish(s,e.roundStarted+Math.round(e.targets[i]*1300));s=save(s,e.roundStarted+1400);}
  assert.equal(result.success,true);assert.equal(result.perfect,true);assert.equal(result.fish,candidate.fish);assert.equal(result.weight,candidate.weight);
  assert.equal(s.fishing.total,1);assert.equal(s.fishing.bag.minnow,1);assert.equal(s.fishing.collection.minnow.caught,1);assert.equal(result.reward.crystals,10);assert.equal(result.reward.gold,50);
  const snapshot=structuredClone(s);assert.ok(E.reelFish(s,NOW+10000).error);assert.deepEqual(s,snapshot);
});

test('two hits suffice, misses and cancellation pay nothing, and streak bonuses reset correctly',()=>{
  const s=game();E.castLine(s,'pond',()=>.9,NOW);let first;
  for(let i=0;i<3;i++){const e=s.fishing.session;first=E.reelFish(s,e.roundStarted+(i===1?0:Math.round(e.targets[i]*1300)));}
  assert.equal(first.success,true);assert.equal(first.perfect,false);assert.deepEqual(first.hits,[2,0,2]);
  catchOne(s,.9,NOW+10000);const third=catchOne(s,.9,NOW+20000);assert.equal(third.reward.essence,2);assert.equal(s.fishing.bestStreak,3);
  E.castLine(s,'pond',()=>.9,NOW+30000);const paid=structuredClone(s.resources);
  let missed;for(let i=0;i<3;i++)missed=E.reelFish(s,s.fishing.session.roundStarted);
  assert.equal(missed.success,false);assert.deepEqual(s.resources,paid);assert.equal(s.fishing.streak,0);assert.equal(s.fishing.total,3);
  E.castLine(s,'pond',()=>.9,NOW+40000);E.cancelFishing(s);assert.equal(s.fishing.session,null);assert.equal(s.fishing.total,3);assert.ok(E.cancelFishing(s).error);save(s,NOW+50000);
});

test('pause, save, reload, and resume preserve the exact cursor phase and round results',()=>{
  let s=game();E.castLine(s,'pond',()=>.4,NOW);const pausedAt=NOW+1100;const phase=E.fishingMeter(s,pausedAt);
  assert.equal(E.pauseFishing(s,pausedAt),true);assert.equal(E.pauseFishing(s,pausedAt+100),false);assert.deepEqual(E.fishingMeter(s,NOW+999999),phase);assert.ok(E.reelFish(s,NOW+10000).error);
  s=save(s,NOW+3600000);assert.equal(E.resumeFishing(s,NOW+3600000),true);const resumed=E.fishingMeter(s,NOW+3600000);assert.ok(Math.abs(resumed.position-phase.position)<1e-8);assert.equal(resumed.target,phase.target);save(s,NOW+3600000);
});

test('rod upgrades widen the hit area, improve rare odds, obey costs and cap at five',()=>{
  const s=game();s.resources.gold=100000;s.resources.wood=10000;E.castLine(s,'pond',()=>.5,NOW);const old=E.fishingMeter(s,NOW+600);const odds=E.fishingOdds(s);
  for(let i=0;i<4;i++)assert.ok(!E.upgradeRod(s).error);
  assert.ok(E.fishingMeter(s,NOW+600).width>old.width);assert.ok(E.fishingOdds(s).SSR>odds.SSR);assert.equal(Object.values(E.fishingOdds(s)).reduce((a,b)=>a+b),100);
  const snapshot=structuredClone(s);assert.ok(E.upgradeRod(s).error);assert.deepEqual(s,snapshot);save(s,NOW+1000);
});

test('fishing levels open all spots, trading keeps records, collection rewards cannot repeat',()=>{
  const s=game();s.resources.food=100000;
  for(let i=0;i<30;i++)catchOne(s,.9,NOW+i*10000);
  assert.ok(s.fishing.level>=6);const record=structuredClone(s.fishing.collection);const trade=E.cookFish(s,'minnow');assert.equal(trade.reward.food,12);assert.deepEqual(s.fishing.collection,record);
  const tried=structuredClone(s);assert.ok(E.cookFish(s,'galaxy').error);assert.deepEqual(s,tried);
  for(const fish of FISH){
    const roll={N:.99,R:.4,SR:.1,SSR:0}[fish.rarity];const spot=FISH_SPOTS.find(p=>p.id===fish.spot);assert.ok(!E.castLine(s,spot.id,()=>roll,NOW+400000).error);
    let r;for(let i=0;i<3;i++){const e=s.fishing.session;r=E.reelFish(s,e.roundStarted+Math.round(e.targets[i]*1300));}assert.equal(r.fish,fish.id);
  }
  assert.equal(Object.keys(s.fishing.collection).length,12);const reward=E.claimFishMilestone(s,12);assert.equal(reward.reward.tickets,10);const complete=structuredClone(s);assert.ok(E.claimFishMilestone(s,12).error);assert.deepEqual(s,complete);save(s,NOW+500000);
  assert.equal(E.questProgress(s,QUESTS.find(q=>q.id==='water-collector')),12);
});

test('activity save validation checks species, timer, catch weight, session rounds and bag integrity',()=>{
  const s=parentsReady(game());E.startBreeding(s,'mossfox','axolotl',null,()=>0,NOW);E.castLine(s,'pond',()=>.5,NOW);
  const invalid=fn=>{const bad=structuredClone(s);fn(bad);assert.throws(()=>save(bad));};
  invalid(x=>x.breeding.egg.readyAt++);invalid(x=>x.breeding.egg.species='mistfox');invalid(x=>x.breeding.egg.parents=['mossfox','mossfox']);
  invalid(x=>x.fishing.session.weight=-1);invalid(x=>x.fishing.session.targets=[.5]);invalid(x=>x.fishing.session.hits=[1,1,1]);invalid(x=>x.fishing.session.spot='moon');
  invalid(x=>x.fishing.collection.minnow={caught:1,best:999999});invalid(x=>x.fishing.total=2);save(s);
});
