import assert from 'node:assert/strict';
import * as E from '../web/js/engine.js';
import * as C from '../web/js/campaign-engine.js';
import {CAMPAIGN_STAGES,campaignStage} from '../web/js/campaign-data.js';
import {combatScene} from '../web/js/combat-stage.js';
import {autoOrder} from '../web/js/auto-play.js';
import {skillBlocked} from '../web/js/tactics.js';
export {E,C};
export const campaignNow=Date.now()-10000;
export function campaignGame(){const s=E.newGame(campaignNow);s.level=10;s.resources.food=10000;s.settings={motion:false,sound:false};s.pets.unshift(E.makePet('pebbleturtle',campaignNow));s.team=['pebbleturtle','mossfox','emberbird'];s.pets.forEach(p=>{p.level=30;p.stars=3;p.bond=100;});return s;}
export function unlockTo(s,id,stars=3){for(const stage of CAMPAIGN_STAGES){if(stage.id===id)break;s.campaign.stages[stage.id]={wins:1,stars,goals:[true,stars>1,stars>2],bestTurns:6};}return s;}
export function goalOrder(state){
  const ex=state.expedition,b=ex.battle,s=campaignStage(ex.campaign.id),r=ex.campaign,scene=combatScene(state,'explore'),warning=scene.forestWarning||scene.reefWarning||scene.volcanoWarning;
  if(warning)return {move:'evade',stance:'balanced',target:'body'};
  if(s.goal.kind==='guards'&&r.guards<s.goal.target)return {move:'guard',stance:'guarded',target:'body'};
  if(s.goal.kind==='skills'&&r.skills<s.goal.target||s.goal.kind==='combos'&&r.combos<s.goal.target){
    const member=ex.members.find(m=>m.id!==b.tactics.mark&&!skillBlocked(b.tactics,m.id,b.focus,ex.members,false,ex.squad.allies));
    if(member)return {move:`pet:${member.id}`,stance:'guarded',target:'body'};
    return {move:'guard',stance:'guarded',target:'body'};
  }
  if(s.goal.kind==='evades'&&r.evades<s.goal.target&&b.boss)return {move:'guard',stance:'guarded',target:'body'};
  const {reason,...order}=autoOrder(scene,{plan:state.autoTactics.plan});return order;
}
export function finishCampaign(state,{goals=true,save=true}={}){
  let result;
  for(let turn=0;turn<150&&state.expedition;turn++){
    if(save)E.validateSave(E.serialize(state));
    if(!state.expedition.battle){assert.ok(!E.chooseRoute(state,0,()=>.5).error);continue;}
    const move=goals?goalOrder(state):autoOrder(combatScene(state,'explore'),{plan:state.autoTactics.plan});
    const {reason,...order}=move;result=E.battleTurn(state,order,()=>.5,'auto');assert.ok(!result.error,JSON.stringify(result));
  }
  assert.equal(state.expedition,null,'campaign must finish within 150 steps');if(save)E.validateSave(E.serialize(state));return result;
}
export function clearCampaign(state,id,options){assert.ok(!C.startCampaign(state,id,campaignNow).error);return finishCampaign(state,options);}
