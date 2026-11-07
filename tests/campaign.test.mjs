import test from 'node:test';
import assert from 'node:assert/strict';
import {E,C,campaignGame,unlockTo,finishCampaign,clearCampaign,campaignNow} from './campaign-fixtures.mjs';
import {CAMPAIGN_STAGES,CAMPAIGN_CHAPTERS,campaignStage,campaignEnemies} from '../web/js/campaign-data.js';
import {stageUnlocked,campaignStars} from '../web/js/campaign-state.js';
import {available,placeItem,validateLayout} from '../web/js/island-layout.js';
import {itemThumbnail} from '../web/js/island-layout-art.js';
import {combatScene} from '../web/js/combat-stage.js';
import {autoOrder} from '../web/js/auto-play.js';
import {previewOrder} from '../web/js/combat-preview.js';
const raw=s=>({app:'SpiritIsles',version:1,state:s});
const snapshot=s=>JSON.stringify(s);

test('campaign contains 24 authored stages, six distinct challenges and three chapter guardians',()=>{
  assert.equal(new Set(CAMPAIGN_STAGES.map(s=>s.id)).size,24);assert.equal(new Set(CAMPAIGN_STAGES.map(s=>s.goal.kind)).size,6);
  for(const ch of CAMPAIGN_CHAPTERS){const list=CAMPAIGN_STAGES.filter(s=>s.chapter===ch.id);assert.equal(list.length,8);assert.ok(list.at(-1).boss);assert.ok(list.every(s=>s.story.length>30&&s.dialogue.length>25&&s.cost.food>0));}
});
test('old saves migrate without changing Shiny, team or a running normal expedition',()=>{
  const s=E.newGame();delete s.campaign;E.startExpedition(s,'forest',()=>.5);E.chooseRoute(s,0);const ex=structuredClone(s.expedition),shiny=structuredClone(s.shiny),m=E.validateSave(raw(s));assert.deepEqual(m.campaign,{version:1,stages:{},claimed:[]});assert.deepEqual(m.expedition,ex);assert.deepEqual(m.shiny,shiny);assert.deepEqual(m.team,s.team);
});
test('locked, unknown, unaffordable and busy starts never spend or alter a save',()=>{
  for(const setup of [s=>{},s=>{s.resources.food=0;},s=>{E.startExpedition(s,'forest',()=>.5,campaignNow);}]){const s=campaignGame();setup(s);for(const id of ['__proto__','forest-2','reef-1','volcano-8',...(s.resources.food===0||s.expedition?['forest-1']:[])]){const before=snapshot(s);assert.ok(C.startCampaign(s,id,campaignNow).error);assert.equal(snapshot(s),before);}}
});
test('campaign locks team and other activities, charges only once and snapshots appearances',()=>{
  const s=campaignGame();s.pets.find(p=>p.id==='mossfox').shiny=true;const food=s.resources.food;assert.ok(!C.startCampaign(s,'forest-1',campaignNow).error);assert.equal(s.resources.food,food-10);assert.ok(s.expedition.members.find(m=>m.id==='mossfox').shiny);assert.ok(E.toggleTeam(s,'mossfox').error);assert.ok(E.startExpedition(s,'forest').error);assert.ok(C.startCampaign(s,'forest-1').error);assert.equal(s.resources.food,food-10);assert.ok(!E.chooseRoute(s,1).battle);assert.equal(s.expedition.battle,null);assert.ok(E.finishExpedition(s,true).error);assert.ok(s.expedition);E.validateSave(raw(s));
});
for(const stage of CAMPAIGN_STAGES)test(`real manual campaign ${stage.label}: wins three stars, roundtrips every turn and unlocks the next stage`,()=>{
  const s=unlockTo(campaignGame(),stage.id),before=structuredClone(s.resources),result=clearCampaign(s,stage.id);assert.equal(result.success,true);assert.equal(result.campaign.stars,3,JSON.stringify(result.campaign));assert.equal(result.campaign.first,true);assert.equal(s.campaign.stages[stage.id].wins,1);for(const [k,n]of Object.entries(stage.reward))assert.ok(s.resources[k]>=before[k]+n);assert.equal(s.resources.food,before.food-stage.cost.food);assert.deepEqual(s.clears,{});assert.ok(stageUnlocked(s,result.campaign.next||stage.id));
});
test('a complete natural 24-stage AUTO campaign progresses through all chapters and saves',()=>{
  const s=campaignGame();for(const stage of CAMPAIGN_STAGES){const result=clearCampaign(s,stage.id,{goals:false});assert.equal(result.success,true,stage.id);assert.equal(result.campaign.first,true);assert.ok(result.campaign.stars>=1);E.validateSave(raw(s));}assert.equal(Object.keys(s.campaign.stages).length,24);assert.equal(s.stats.expeditions,24);assert.equal(s.shiny.fragments,0);
});
test('replays keep best single-run stars and never pay the first-clear reward again',()=>{
  const s=campaignGame(),first=clearCampaign(s,'forest-1');assert.equal(first.campaign.stars,3);C.startCampaign(s,'forest-1',campaignNow+1);s.expedition.campaign.turns=20;const tickets=s.resources.tickets,replay=finishCampaign(s);assert.equal(replay.campaign.first,false);assert.equal(replay.campaign.stars,2);assert.equal(s.campaign.stages['forest-1'].stars,3);assert.deepEqual(s.campaign.stages['forest-1'].goals,[true,true,true]);assert.equal(s.resources.tickets,tickets);assert.deepEqual(replay.reward,campaignStage('forest-1').reward);assert.equal(s.campaign.stages['forest-1'].wins,2);
});
test('a fallen ally remains recorded after recovery between waves and after reload',()=>{
  let s=campaignGame();C.startCampaign(s,'forest-1',campaignNow);E.chooseRoute(s,0);const ex=s.expedition;ex.squad.allies[0].hp=0;ex.hp=ex.squad.allies.reduce((n,u)=>n+u.hp,0);ex.squad.enemies.forEach((u,i)=>u.hp=i?0:1);ex.battle.hp=1;const result=E.battleTurn(s,'attack',()=>.5);assert.equal(result.won,true);assert.ok(ex.squad.allies[0].hp>0);assert.deepEqual(ex.campaign.downs,[s.team[0]]);s=E.validateSave(raw(s));const end=finishCampaign(s);assert.equal(end.campaign.goals[1],false);assert.ok(end.campaign.stars<=2);
});
test('defeat and retreat never grant stars, first rewards, next stages or chapter decorations',()=>{
  for(const retreat of [false,true]){const s=campaignGame();C.startCampaign(s,'forest-1',campaignNow);const resources=structuredClone(s.resources),r=E.finishExpedition(s,false,()=>.5,campaignNow,retreat);assert.equal(r.success,false);assert.equal(r.campaign.stars,0);assert.deepEqual(r.reward,{});assert.deepEqual(s.resources,resources);assert.deepEqual(s.campaign.stages,{});assert.equal(stageUnlocked(s,'forest-2'),false);assert.equal(s.expedition,null);E.validateSave(raw(s));}
});
for(const chapter of CAMPAIGN_CHAPTERS)test(`${chapter.name}: real boss phase summons two allies once, preserves save and cannot be skipped by a lethal hit`,()=>{
  const s=unlockTo(campaignGame(),`${chapter.id}-8`);C.startCampaign(s,`${chapter.id}-8`,campaignNow);
  while(s.expedition.stage<2){if(!s.expedition.battle)E.chooseRoute(s,0);else {const {reason,...order}=autoOrder(combatScene(s,'explore'),{plan:s.autoTactics.plan});const turn=E.battleTurn(s,order,()=>.5);assert.ok(!turn.error);}}
  E.chooseRoute(s,0);const ex=s.expedition;assert.equal(ex.battle.boss,true);assert.equal(campaignEnemies(ex).length,1);ex.squad.enemies[0].hp=1;ex.battle.hp=1;const before=structuredClone(s),preview=previewOrder(s,'explore',{move:'attack',stance:'balanced',target:'body'},'auto');assert.ok(!preview.error);assert.deepEqual(s,before);const r=E.battleTurn(s,'attack',()=>.5);assert.equal(r.summoned,2);assert.equal(ex.battle.campaignPhase,2);assert.equal(ex.squad.enemies.length,3);assert.ok(ex.squad.enemies.every(u=>u.hp>0));assert.equal(r.finished,undefined);E.validateSave(raw(s));const end=finishCampaign(s);assert.equal(end.success,true);assert.equal(end.campaign.chapterFinished,true);assert.equal(available(s,chapter.decoration),true);assert.ok(itemThumbnail(chapter.decoration).includes('<svg'));const layout={version:1,nextId:1,placed:[]};assert.ok(!placeItem(s,layout,chapter.decoration,0,0).error);validateLayout(s,layout);
});
test('star chests pay each threshold once; insufficient stars and unknown thresholds are atomic',()=>{
  const s=campaignGame();for(const key of ['forest','reef','volcano','__proto__'])for(const n of [8,16,24,25]){const before=snapshot(s);assert.ok(C.claimCampaignChest(s,key,n).error);assert.equal(snapshot(s),before);}unlockTo(s,'reef-1');assert.equal(campaignStars(s,'forest'),24);for(const n of [8,16,24]){const tickets=s.resources.tickets,r=C.claimCampaignChest(s,'forest',n);assert.ok(!r.error);assert.equal(s.resources.tickets,tickets+r.reward.tickets);const after=snapshot(s);assert.ok(C.claimCampaignChest(s,'forest',n).error);assert.equal(snapshot(s),after);}E.validateSave(raw(s));
});
test('sweep requires three stars and pays only repeated rewards for exactly one or five paid runs',()=>{
  const s=campaignGame();let before=snapshot(s);assert.ok(C.sweepCampaign(s,'forest-1').error);assert.equal(snapshot(s),before);clearCampaign(s,'forest-1');const stage=campaignStage('forest-1'),record=structuredClone(s.campaign.stages),tickets=s.resources.tickets;
  for(const count of [1,5]){const resources=structuredClone(s.resources),r=C.sweepCampaign(s,'forest-1',count);assert.ok(!r.error);assert.equal(s.resources.food,resources.food-stage.cost.food*count);for(const [k,n]of Object.entries(stage.reward))assert.equal(s.resources[k],resources[k]+n*count);assert.deepEqual(s.campaign.stages,record);assert.equal(s.resources.tickets,tickets);E.validateSave(raw(s));}
  for(const count of [0,-1,2,1.5,100]){before=snapshot(s);assert.ok(C.sweepCampaign(s,'forest-1',count).error);assert.equal(snapshot(s),before);}
  C.startCampaign(s,'forest-2');before=snapshot(s);assert.ok(C.sweepCampaign(s,'forest-1').error);assert.equal(snapshot(s),before);E.finishExpedition(s,false);s.resources.food=49;before=snapshot(s);assert.ok(C.sweepCampaign(s,'forest-1',5).error);assert.equal(snapshot(s),before);
});
test('save validation rejects forged stars, progression gaps, duplicate chests and malformed run metrics',()=>{
  const cleared=campaignGame();clearCampaign(cleared,'forest-1');
  for(const change of [s=>s.campaign=null,s=>s.campaign.stages['forest-1'].stars=4,s=>s.campaign.stages['forest-1'].goals=[true,false,false],s=>s.campaign.stages['forest-1'].wins=0,s=>s.campaign.stages['forest-3']=s.campaign.stages['forest-1'],s=>s.campaign.claimed=['forest:8'],s=>s.campaign.claimed=['forest:0'],s=>s.campaign.stages.unknown=s.campaign.stages['forest-1']]){const s=structuredClone(cleared);change(s);assert.throws(()=>E.validateSave(raw(s)),/chiến dịch/);}
  const active=campaignGame();C.startCampaign(active,'forest-1',campaignNow);E.chooseRoute(active,0);
  for(const change of [s=>s.expedition.campaign.id='reef-1',s=>s.expedition.campaign.turns=-1,s=>s.expedition.campaign.skills=2,s=>s.expedition.campaign.downs=['unknown'],s=>s.expedition.battle.campaignPhase=2,s=>s.expedition.battle.boss=true,s=>delete s.expedition.squad]){const s=structuredClone(active);change(s);assert.throws(()=>E.validateSave(raw(s)),/chiến dịch/);}
  unlockTo(cleared,'reef-1');cleared.campaign.claimed=['forest:8','forest:8'];assert.throws(()=>E.validateSave(raw(cleared)),/chiến dịch/);
});
