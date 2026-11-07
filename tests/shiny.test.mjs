import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../web/js/shiny.js';
import {SHINY_SPECIES,SHINY_RATE} from '../web/js/data.js';
import {E,B,R,squadGame,squadReady} from './squad-fixtures.mjs';
import {T,towerGame,towerStep,towerNow} from './tower-fixtures.mjs';
import {startDojo,dojoBattleTurn,stopDojo} from '../web/js/dojo-engine.js';
import {available} from '../web/js/island-layout.js';
import {creature} from '../web/js/art.js';

const ids=SHINY_SPECIES.map(s=>s.id),clone=structuredClone;
const valid=s=>E.validateSave(E.serialize(s));
const seq=(values,fallback=.9)=>()=>values.length?values.shift():fallback;
function unlock(s,id='mossfox'){s.shiny.fragments+=30;return S.craftShiny(s,id);}
function bossWin(s){for(let i=0;s.boss.run&&i<80;i++)assert.ok(!B.bossBattleTurn(s,'attack').error);assert.equal(s.boss.run,null);return s.boss.lastResult;}

test('Shiny bonus has an exact 1.2 percent boundary',()=>{
  const a=E.newGame(),b=E.newGame();assert.ok(S.rollShinyEgg(a,seq([SHINY_RATE-1e-6,0]))?.shinyNew);
  assert.equal(S.rollShinyEgg(b,()=>SHINY_RATE),null);assert.equal(b.shiny.pity,1);
});
test('sixtieth egg guarantees a bonus, resets only Shiny pity, and then counts again',()=>{
  const s=E.newGame();s.pity=21;s.srPity=5;
  for(let i=0;i<59;i++)assert.equal(S.rollShinyEgg(s,()=>.99),null);
  assert.ok(S.rollShinyEgg(s,()=>.99)?.shinyNew);assert.equal(s.shiny.pity,0);S.rollShinyEgg(s,()=>.99);
  assert.equal(s.shiny.pity,1);assert.equal(s.pity,21);assert.equal(s.srPity,5);valid(s);
});
test('both paid egg types share one Shiny guarantee and retain normal rewards',()=>{
  const s=E.newGame();s.shiny.pity=58;
  assert.equal(E.hatch(s,1,'nature',()=>.9).shinyResults.length,0);
  const r=E.hatch(s,1,'star',()=>.9);assert.equal(r.results.length,1);assert.equal(r.shinyResults.length,1);assert.equal(s.shiny.pity,0);valid(s);
});
test('ten-pull spends exactly ten tickets and counts each bonus attempt',()=>{
  const s=squadGame();s.shiny.pity=55;const r=E.hatch(s,10,'nature',()=>.9);
  assert.equal(r.results.length,10);assert.equal(r.shinyResults.length,1);assert.equal(s.shiny.pity,5);assert.equal(s.stats.hatches,10);assert.equal(s.resources.tickets,0);valid(s);
});
test('all normal draws complete before bonus draws; normal outcomes and SR/SSR pity are identical',()=>{
  const a=E.newGame(),b=clone(a);a.shiny.pity=59;
  const normal=Array.from({length:20},(_,i)=>(i*.173+.13)%1);
  const ra=E.hatch(a,10,'nature',seq([...normal]),1700000000000),rb=E.hatch(b,10,'nature',seq([...normal]),1700000000000);
  assert.deepEqual(ra.results,rb.results);assert.equal(a.pity,b.pity);assert.equal(a.srPity,b.srPity);assert.deepEqual(a.resources,b.resources);
  for(const p of b.pets){const q=clone(a.pets.find(q=>q.id===p.id));delete q.shiny;assert.deepEqual(q,p);}
  assert.equal(ra.shinyResults.length,1);assert.equal(rb.shinyResults.length,0);
});
test('failed or invalid hatch attempts cannot advance the guarantee',()=>{
  for(const [count,type] of [[2,'nature'],[1,'missing'],[10,'star']]){const s=E.newGame(),before=clone(s);assert.ok(E.hatch(s,count,type).error);assert.deepEqual(s,before);}
});
test('bonus selection exhausts missing variants before duplicate fragments',()=>{
  const s=E.newGame();for(const id of ids){const r=S.rollShinyEgg(s,()=>0);assert.equal(r.species,id);assert.equal(r.shinyNew,true);}
  assert.equal(S.shinyCount(s),6);const r=S.rollShinyEgg(s,()=>0);assert.equal(r.shinyNew,false);assert.equal(r.fragments,10);assert.equal(s.shiny.fragments,10);valid(s);
});
test('each remaining variant occupies an equal segment of the missing pool',()=>{
  for(let i=0;i<ids.length;i++){const s=E.newGame(),r=S.rollShinyEgg(s,seq([0,(i+.5)/ids.length]));assert.equal(r.species,ids[i]);}
});
test('unlocking preserves the original pet growth, training and equipment',()=>{
  const s=squadGame(),p=s.pets[0];Object.assign(p,{level:15,xp:70,bond:48,stars:2,shards:7,training:{branch:'shelter',rank:1}});
  const before=clone(p),forge=clone(s.forge),power=E.petPower(p,s);unlock(s);
  assert.deepEqual(p,{...before,shiny:true});assert.equal(E.petPower(p,s),power);assert.deepEqual(s.forge,forge);
});
test('crafting a missing species creates a level-one companion and never changes the team',()=>{
  const s=E.newGame(),team=[...s.team];s.shiny.fragments=30;const r=S.craftShiny(s,'oceandragon',123);
  assert.equal(r.isNew,true);assert.deepEqual(s.pets.find(p=>p.id==='oceandragon'),{...E.makePet('oceandragon',123),shiny:true});assert.deepEqual(s.team,team);valid(s);
});
test('craft, exchange and milestones reject repeated or malformed spending atomically',()=>{
  const s=E.newGame();for(const id of ['mossfox','constructor','__proto__']){const before=clone(s);assert.ok(S.craftShiny(s,id).error);assert.deepEqual(s,before);}
  unlock(s);s.shiny.fragments=40;const before=clone(s);assert.ok(S.craftShiny(s,'mossfox').error);assert.deepEqual(s,before);
  const tickets=s.resources.tickets;assert.deepEqual(S.exchangeShinyFragments(s).reward,{tickets:2});assert.equal(s.shiny.fragments,30);assert.equal(s.resources.tickets,tickets+2);
  s.shiny.fragments=9;const low=clone(s);assert.ok(S.exchangeShinyFragments(s).error);assert.deepEqual(s,low);
});
test('crafts and encounters preserve egg pity',()=>{
  const s=E.newGame();s.shiny.pity=49;unlock(s);S.shinyExplorationReward(s,()=>0);assert.equal(s.shiny.pity,49);
});
test('appearance toggle preserves power and persists; snapshots follow active appearance',()=>{
  const s=squadGame();unlock(s);const power=E.teamPower(s);assert.equal(E.combatMembers(s)[0].shiny,true);
  S.setShinyAppearance(s,'mossfox',false);assert.equal(S.shinyOf(s,'mossfox'),false);assert.equal(E.combatMembers(s)[0].shiny,undefined);assert.deepEqual(E.teamPower(s),power);
  assert.equal(valid(s).pets[0].shinyOff,true);S.setShinyAppearance(s,'mossfox',true);assert.equal(S.shinyOf(s.pets[0],'mossfox'),true);assert.equal(s.pets[0].shinyOff,undefined);
});
test('appearance changes reject during all five activity types without mutating snapshots',()=>{
  for(const start of [s=>E.startExpedition(s,'forest'),s=>B.startBoss(s),s=>R.startRuins(s),s=>T.startTower(s),s=>startDojo(s,'practice','plain')]){
    const s=squadGame();unlock(s);assert.ok(!start(s).error);const before=clone(s);assert.ok(S.setShinyAppearance(s,'mossfox',false).error);assert.deepEqual(s,before);valid(s);
  }
});
test('Shiny combat snapshots and subsequent HP rolls match original combat exactly',()=>{
  const a=squadGame(),b=clone(a);unlock(a);E.startExpedition(a,'forest',()=>.4,1700000000000);E.startExpedition(b,'forest',()=>.4,1700000000000);
  E.chooseRoute(a,0,()=>.4);E.chooseRoute(b,0,()=>.4);assert.equal(a.expedition.members[0].shiny,true);
  const r=E.battleTurn(a,'attack',()=>.5),q=E.battleTurn(b,'attack',()=>.5);assert.deepEqual(r,q);assert.deepEqual(a.expedition.squad,b.expedition.squad);valid(a);
});
test('one, three and six milestones unlock only their decorations and persistent profile',()=>{
  const s=E.newGame(),tickets=s.resources.tickets;assert.equal(available(s,'prismfox'),false);assert.ok(S.claimShinyMilestone(s,1).error);assert.ok(S.setShinyProfile(s,true).error);
  for(const [i,id]of ids.entries()){
    unlock(s,id);const n=i+1;if([1,3,6].includes(n)){assert.ok(!S.claimShinyMilestone(s,n).error);const before=clone(s);assert.ok(S.claimShinyMilestone(s,n).error);assert.deepEqual(s,before);}
  }
  assert.equal(s.resources.tickets,tickets+10);assert.equal(available(s,'prismfox'),true);assert.equal(available(s,'prismgate'),true);S.setShinyProfile(s,true);assert.equal(valid(s).shiny.profile,true);
});
test('old saves migrate an empty collection without touching a running fight',()=>{
  const s=squadReady(),fight=clone(s.expedition),resources=clone(s.resources);delete s.shiny;
  const restored=valid(s);assert.deepEqual(restored.shiny,S.newShiny());assert.deepEqual(restored.expedition,fight);assert.deepEqual(restored.resources,resources);
});
test('malformed collection data and impossible cosmetics are rejected on import',()=>{
  for(const change of [s=>s.shiny=null,s=>s.shiny.pity=60,s=>s.shiny.fragments=-1,s=>s.shiny.fragments=1.5,s=>s.shiny.claimed=[1],s=>s.shiny.claimed=[0],s=>s.shiny.claimed=[1,1],s=>s.shiny.profile=true,s=>s.shiny.extra=1,s=>s.pets[0].shiny='yes',s=>s.pets[2].shiny=true,s=>s.pets[0].shinyOff=true]){
    const s=E.newGame();change(s);assert.throws(()=>valid(s));
  }
  const s=squadReady();s.expedition.members[2].shiny=true;assert.throws(()=>valid(s));
});
test('successful exploration grants one fragment and its 4 percent encounter has an exact boundary',()=>{
  const a=squadGame(),b=squadGame();E.startExpedition(a,'forest');E.startExpedition(b,'forest');
  const r=E.finishExpedition(a,true,seq([.9,.039,0])),q=E.finishExpedition(b,true,seq([.9,.04]));
  assert.equal(r.shinyReward.fragments,1);assert.equal(r.shinyReward.encounter.shinyNew,true);assert.equal(q.shinyReward.encounter,null);
  const before=clone(a.shiny);assert.ok(E.finishExpedition(a,true).error);assert.deepEqual(a.shiny,before);valid(a);
});
test('retreat and failed exploration grant neither fragments nor encounters',()=>{
  for(const retreat of [true,false]){const s=squadGame();E.startExpedition(s,'forest');const r=E.finishExpedition(s,false,()=>0,Date.now(),retreat);assert.equal(r.shinyReward,null);assert.deepEqual(s.shiny,S.newShiny());}
});
test('boss victory grants tier fragments once, including after save reload',()=>{
  let s=squadGame();s.pets.forEach(p=>p.level=30);B.startBoss(s);const r=bossWin(s);assert.equal(r.status,'victory');assert.equal(r.shinyFragments,3);s=valid(s);
  assert.equal(s.shiny.fragments,3);const before=clone(s);assert.ok(B.bossBattleTurn(s,'attack').error);assert.ok(B.retreatBoss(s).error);assert.deepEqual(s,before);
});
test('boss retreat and defeat do not award Shiny fragments',()=>{
  const a=squadReady('boss');B.retreatBoss(a);assert.equal(a.shiny.fragments,0);
  const b=squadReady('boss');b.boss.run.squad.allies.forEach((u,i)=>u.hp=i===2?1:0);b.boss.run.hp=1;B.bossBattleTurn(b,'charge');assert.equal(b.boss.lastResult.status,'defeat');assert.equal(b.shiny.fragments,0);valid(b);
});
test('tower bosses award 2/3/3/4/4/5 fragments once; ordinary floors and retreat add none',()=>{
  const s=towerGame({level:30,stars:3}),drops=[];
  for(let i=0;s.tower.run&&i<3000;i++){const before=s.shiny.fragments,floor=s.tower.run.floor;const r=towerStep(s);assert.ok(!r?.error);if(s.shiny.fragments>before)drops.push([floor,s.shiny.fragments-before]);}
  assert.equal(s.tower.run,null);assert.deepEqual(drops,[[5,2],[10,3],[15,3],[20,4],[25,4],[30,5]]);assert.equal(s.shiny.fragments,21);valid(s);
  const b=towerGame();T.retreatTower(b);assert.equal(b.shiny.fragments,0);
});
test('tower defeat before clearing a boss grants no fragments',()=>{
  const s=towerGame();T.chooseTowerPath(s,'battle',towerNow);s.tower.run.squad.allies.forEach((u,i)=>u.hp=i===2?1:0);s.tower.run.hp=1;T.towerBattleTurn(s,'charge',towerNow);
  assert.equal(s.tower.lastResult.status,'defeat');assert.equal(s.shiny.fragments,0);valid(s);
});
test('dojo practice displays the active variant but never leaks boss fragments to the real island',()=>{
  const s=squadGame();s.pets.forEach(p=>p.level=30);unlock(s);const before=clone(s.shiny);startDojo(s,'practice','treant');assert.equal(s.dojo.run.sandbox.boss.run.members[0].shiny,true);
  for(let i=0;s.dojo.run&&i<80;i++)assert.ok(!dojoBattleTurn(s,'attack').error);
  assert.equal(s.dojo.lastResult.status,'victory');assert.deepEqual(s.shiny,before);valid(s);stopDojo(s);
});
test('fragment balances saturate and the returned payout reflects the actual credit',()=>{
  const s=E.newGame();s.shiny.fragments=99999998;assert.equal(S.addShinyFragments(s,5),1);assert.equal(S.addShinyFragments(s,1),0);assert.equal(s.shiny.fragments,99999999);valid(s);
});
test('all six variants have distinct anatomy, active art and explicit original comparison',()=>{
  const s=E.newGame();for(const id of ids){unlock(s,id);const art=creature(id,{source:s});assert.match(art,new RegExp(`data-shiny-design="${id}"`));assert.match(art,/data-shiny="true"/);assert.doesNotMatch(creature(id,{source:s,shiny:false}),/shiny-anatomy/);}
});
