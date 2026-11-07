import test from 'node:test';
import assert from 'node:assert/strict';
import {E,festivalGame,claimFestivalTasks,seasonalNow as NOW,DAY} from './seasonal-fixtures.mjs';
import {SEASON_MISSIONS,SEASON_MILESTONES,SEASON_SHOP,SEASON_DURATION} from '../web/js/seasonal-data.js';
import {newSeasonal,seasonDay,seasonWeek,seasonalSummary,seasonalMissions,seasonalNotice,claimSeasonalMission,claimSeasonalChallenge,claimSeasonalMilestone,buySeasonalShop,startNextSeason,refreshSeason} from '../web/js/seasonal-engine.js';
import {available,placeItem,commitLayout} from '../web/js/island-layout.js';
import {itemThumbnail} from '../web/js/island-layout-art.js';
import {finishCampaign,C} from './campaign-fixtures.mjs';
import {climb,T} from './tower-fixtures.mjs';
import * as H from '../web/js/habitat-engine.js';

const clone=structuredClone,roundtrip=(s,now=NOW)=>E.validateSave(E.serialize(s),now);
const accepted=r=>assert.ok(!r.error,r.error);
const unchanged=(s,action)=>{const before=clone(s);assert.ok(action().error);assert.deepEqual(s,before);};

test('new games have a personal thirty-day season, no extra base resource and exact save round trips',()=>{
  const s=E.newGame(NOW);assert.deepEqual(s.seasonal,newSeasonal(NOW));assert.equal(Object.keys(s.resources).length,6);
  assert.deepEqual(roundtrip(s).seasonal,s.seasonal);assert.equal(seasonDay(s,NOW),1);assert.equal(seasonWeek(s,NOW),0);
  assert.equal(seasonalSummary(s,NOW).weeks.flat().length,32);assert.equal(seasonalNotice(s,NOW),false);
});

test('old saves start a full season now and preserve their running battle and all existing progress',()=>{
  const s=E.newGame(NOW-15*DAY);s.stats.hatches=120;s.stats.feeds=80;
  accepted(E.startExpedition(s,'forest',()=>.4,NOW));accepted(E.chooseRoute(s,0,()=>.4));delete s.seasonal;
  const before=clone(s),loaded=roundtrip(s);assert.deepEqual(s,before);assert.equal(loaded.seasonal.started,NOW);assert.equal(loaded.seasonal.baseline.hatches,120);
  const migrated=clone(loaded);delete migrated.seasonal;assert.deepEqual(migrated,{...before,daily:{...before.daily,date:E.dayKey(NOW)}});
  assert.equal(seasonalMissions(loaded,NOW).find(m=>m.id==='hatch').progress,0);
  loaded.stats.hatches+=4;accepted(claimSeasonalMission(loaded,'0:hatch',NOW));assert.equal(loaded.seasonal.earned,50);roundtrip(loaded);
});

test('weeks open on days 1, 8, 15, 22 while previous weeks and accumulated progress stay available',()=>{
  const s=festivalGame({now:NOW,day:1}),claimed=new Set();
  for(const [day,week]of [[1,0],[7,0],[8,1],[14,1],[15,2],[21,2],[22,3],[30,3]]){
    const time=NOW+(day-1)*DAY;assert.equal(seasonWeek(s,time),week);
    if(week<3)unchanged(s,()=>claimSeasonalMission(s,`${week+1}:hatch`,time));
    if(claimed.has(week))unchanged(s,()=>claimSeasonalMission(s,`${week}:hatch`,time));
    else{accepted(claimSeasonalMission(s,`${week}:hatch`,time));claimed.add(week);}
  }
  assert.equal(s.seasonal.claimedMissions.length,4);
  accepted(claimSeasonalMission(s,'0:feed',NOW+29*DAY));
  roundtrip(s,NOW+29*DAY);
});

test('all 32 mission claims are one-time and survive a save after every claim',()=>{
  let s=festivalGame();
  for(const m of seasonalSummary(s,NOW).weeks.flat()){
    accepted(claimSeasonalMission(s,m.claimKey,NOW));s=roundtrip(s);unchanged(s,()=>claimSeasonalMission(s,m.claimKey,NOW));
  }
  assert.equal(s.seasonal.claimedMissions.length,32);assert.equal(s.seasonal.earned,4*SEASON_MISSIONS.reduce((n,m)=>n+m.reward,0));
});

test('malformed keys, unopened weeks and unmet requirements never spend or grant anything',()=>{
  const s=E.newGame(NOW);refreshSeason(s,NOW);
  for(const id of ['hatch','0:hatch:extra','00:hatch','-1:hatch','4:hatch','0:constructor','0:__proto__',null,1,'0:feed'])unchanged(s,()=>claimSeasonalMission(s,id,NOW));
  for(const id of ['missing','constructor','story'])unchanged(s,()=>claimSeasonalChallenge(s,id,NOW));
  for(const id of ['missing','constructor','arch'])unchanged(s,()=>claimSeasonalMilestone(s,id,NOW));
  for(const id of ['missing','constructor','lantern'])unchanged(s,()=>buySeasonalShop(s,id,NOW));
});

test('the three challenge cards each pay the advertised currency once, including after reload',()=>{
  let s=festivalGame();const before=clone(s.resources);
  for(const ch of seasonalSummary(s,NOW).challenges){accepted(claimSeasonalChallenge(s,ch.id,NOW));s=roundtrip(s);unchanged(s,()=>claimSeasonalChallenge(s,ch.id,NOW));}
  assert.equal(s.seasonal.earned,360);assert.deepEqual(s.resources,before);
});

test('shop spending changes only the balance; earned stars still unlock every qualified milestone',()=>{
  const s=festivalGame({claim:true}),earned=s.seasonal.earned,before=clone(s.resources);
  for(const item of SEASON_SHOP)accepted(buySeasonalShop(s,item.id,NOW));
  assert.equal(s.seasonal.earned,earned);assert.equal(s.seasonal.currency,earned-SEASON_SHOP.reduce((n,i)=>n+i.cost,0));
  for(const m of SEASON_MILESTONES){accepted(claimSeasonalMilestone(s,m.id,NOW));roundtrip(s);unchanged(s,()=>claimSeasonalMilestone(s,m.id,NOW));}
  assert.equal(s.shiny.fragments,15);assert.equal(s.resources.tickets,before.tickets+9);assert.ok(available(s,'starlitlantern'));
});

test('a limited shop purchase charges and grants exactly once and rejects insufficient balances',()=>{
  const s=festivalGame({claim:true}),before=clone(s.resources),balance=s.seasonal.currency;
  accepted(buySeasonalShop(s,'tickets',NOW));assert.equal(s.resources.tickets,before.tickets+1);assert.equal(s.seasonal.currency,balance-90);
  const loaded=roundtrip(s);unchanged(loaded,()=>buySeasonalShop(loaded,'tickets',NOW));
  const empty=E.newGame(NOW);refreshSeason(empty,NOW);unchanged(empty,()=>buySeasonalShop(empty,'food',NOW));
});

test('unlocking the arch by milestone prevents a second shop charge; placing it uses existing island rules',()=>{
  const s=festivalGame({claim:true});assert.equal(available(s,'starlitlantern'),false);accepted(claimSeasonalMilestone(s,'arch',NOW));
  unchanged(s,()=>buySeasonalShop(s,'lantern',NOW));assert.equal(seasonalSummary(s,NOW).shop.find(i=>i.id==='lantern').owned,true);
  const draft=clone(s.islandLayout);accepted(placeItem(s,draft,'starlitlantern',6,5));accepted(commitLayout(s,draft));
  assert.ok(placeItem(s,draft,'starlitlantern',0,3).error);assert.deepEqual(roundtrip(s).islandLayout,s.islandLayout);assert.match(itemThumbnail('starlitlantern'),/Cổng Sao Rơi/);
});

test('resource and Shiny reward caps are respected',()=>{
  const s=festivalGame({claim:true});for(const k of Object.keys(s.resources))s.resources[k]=99999998;s.shiny.fragments=99999998;
  for(const m of SEASON_MILESTONES)accepted(claimSeasonalMilestone(s,m.id,NOW));
  assert.ok(Object.values(s.resources).every(n=>n<=99999999));assert.equal(s.shiny.fragments,99999999);roundtrip(s);
});

test('expiration freezes progress and keeps eligible claims and the shop available after a long absence',()=>{
  const s=E.newGame(NOW);s.stats.hatches=4;refreshSeason(s,NOW+SEASON_DURATION);assert.equal(s.seasonal.closed,true);assert.equal(seasonDay(s,NOW+80*DAY),30);
  s.stats.hatches=100;refreshSeason(s,NOW+80*DAY);assert.equal(s.seasonal.progress.hatches,4);
  accepted(claimSeasonalMission(s,'0:hatch',NOW+80*DAY));unchanged(s,()=>claimSeasonalMission(s,'1:hatch',NOW+80*DAY));
  accepted(buySeasonalShop(s,'food',NOW+80*DAY));roundtrip(s,NOW+80*DAY);
});

test('opening the next season banks all completed old rewards and preserves currency, ornaments and placements',()=>{
  const s=festivalGame(),end=s.seasonal.started+SEASON_DURATION;accepted(claimSeasonalMission(s,'0:hatch',NOW));
  for(const id of ['story','tower','memories'])accepted(claimSeasonalChallenge(s,id,NOW));
  accepted(buySeasonalShop(s,'lantern',NOW));accepted(placeItem(s,s.islandLayout,'starlitlantern',6,5));
  const expected=clone(s);refreshSeason(expected,end);claimFestivalTasks(expected,end);for(const m of SEASON_MILESTONES)accepted(claimSeasonalMilestone(expected,m.id,end));
  const r=startNextSeason(s,end);accepted(r);assert.equal(r.cycle,2);assert.deepEqual(s.resources,expected.resources);assert.equal(s.shiny.fragments,15);
  assert.equal(s.seasonal.currency,expected.seasonal.currency);assert.equal(s.seasonal.carried,expected.seasonal.currency);assert.equal(s.seasonal.earned,0);assert.equal(s.seasonal.started,end);
  assert.equal(s.seasonal.baseline.hatches,28);assert.equal(s.seasonal.progress.hatches,0);assert.equal(s.seasonal.claimedShop.length,0);assert.ok(available(s,'starlitlantern'));assert.deepEqual(s.islandLayout,expected.islandLayout);
  roundtrip(s,end);unchanged(s,()=>startNextSeason(s,end));unchanged(s,()=>claimSeasonalMission(s,'0:hatch',end));
  s.stats.hatches+=4;accepted(claimSeasonalMission(s,'0:hatch',end));accepted(buySeasonalShop(s,'tickets',end));roundtrip(s,end);
});

test('claims and new cycles preserve a live expedition snapshot, pets and team',()=>{
  const s=festivalGame({claim:true});accepted(E.startExpedition(s,'forest',()=>.5,NOW));accepted(E.chooseRoute(s,0,()=>.5));const battle=clone(s.expedition),pets=clone(s.pets),team=clone(s.team);
  accepted(buySeasonalShop(s,'lantern',NOW));accepted(claimSeasonalMilestone(s,'comet',NOW));accepted(startNextSeason(s,s.seasonal.started+SEASON_DURATION));
  assert.deepEqual(s.expedition,battle);assert.deepEqual(s.pets,pets);assert.deepEqual(s.team,team);roundtrip(s,NOW+SEASON_DURATION);
});

test('corrupt seasonal balances, claims, baselines and unlocks are rejected instead of resetting progress',()=>{
  const source=festivalGame({claim:true});
  const mutations=[s=>s.seasonal=null,s=>s.seasonal.version=2,s=>s.seasonal.id='other-1',s=>s.seasonal.id='starlit-festival-0',s=>s.seasonal.currency++,s=>s.seasonal.earned++,s=>s.seasonal.currency=-1,s=>s.seasonal.currency=.5,s=>s.seasonal.started=Infinity,s=>s.seasonal.extra=1,s=>delete s.seasonal.baseline,s=>s.seasonal.baseline.hatches=999,s=>s.seasonal.progress.feeds=999,s=>s.seasonal.claimedMissions.push('0:hatch'),s=>s.seasonal.claimedMissions[0]='0:fish:extra',s=>s.seasonal.claimedMilestones=['missing'],s=>s.seasonal.claimedShop=['missing'],s=>s.seasonal.unlockedDecorations=['prismgate'],s=>s.seasonal.unlockedDecorations=['starlitlantern'],s=>s.seasonal.closed='yes'];
  for(const mutate of mutations){const s=clone(source);mutate(s);assert.throws(()=>roundtrip(s));}
  const unearned=E.newGame(NOW);unearned.seasonal.claimedMilestones=['arch'];assert.throws(()=>roundtrip(unearned));
});

test('real hatching, feeding, fishing, exploration, campaign, habitat and tower actions feed their mission metrics',()=>{
  let s=E.newGame(NOW);s.level=10;s.resources.food=10000;s.resources.tickets=100;s.resources.gold=10000;
  for(let i=0;i<8;i++)accepted(E.feed(s,'mossfox',NOW));accepted(E.hatch(s,10,'nature',()=>.9,NOW));
  for(let i=0;i<3;i++){accepted(E.castLine(s,'pond',()=>.9,NOW));for(let j=0;j<3;j++){const f=s.fishing.session;accepted(E.reelFish(s,f.roundStarted+Math.round(f.targets[j]*1300)));}}
  for(const p of s.pets){p.level=30;p.stars=3;p.bond=100;}
  accepted(E.startExpedition(s,'forest',()=>.5,NOW));
  for(let i=0;s.expedition&&i<100;i++)accepted(s.expedition.battle?E.battleTurn(s,s.expedition.battle.focus>=2?'skill':'attack',()=>.5):E.chooseRoute(s,0,()=>.5));
  assert.equal(s.expedition,null);
  for(let i=0;i<2;i++){accepted(C.startCampaign(s,'forest-1',NOW));assert.equal(finishCampaign(s,{goals:true,save:false}).success,true);}
  H.discoverMoment(s,'mossfox','shade-nap',NOW);H.discoverMoment(s,'axolotl','shade-nap',NOW);
  accepted(T.startTower(s,1,()=>.4,NOW));s=climb(s,6,{save:true,now:NOW});accepted(T.retreatTower(s,NOW));
  const view=seasonalMissions(s,NOW);assert.equal(view.length,8);assert.ok(view.every(m=>m.ready),JSON.stringify(view.map(m=>({id:m.id,progress:m.progress,target:m.target}))));
  for(const m of view)accepted(claimSeasonalMission(s,m.claimKey,NOW));roundtrip(s);
});
