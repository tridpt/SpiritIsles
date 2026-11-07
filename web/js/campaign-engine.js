import {combatMembers,teamPower,pay,grant,addXP} from './engine.js';
import {newSquad} from './squad-state.js';
import {campaignStage,chapterOf,campaignChestReward,CAMPAIGN_CHAPTERS} from './campaign-data.js';
import {stageUnlocked,campaignStars} from './campaign-state.js';

const busy=state=>!!(state.expedition||state.boss?.run||state.ruins?.run||state.tower?.run||state.dojo?.run);
export function startCampaign(state,id,now=Date.now()){
  const s=campaignStage(id);if(!s||!stageUnlocked(state,id))return {error:'Vượt ải trước để mở con đường này.'};
  if(busy(state))return {error:'Kết thúc chuyến đi hiện tại trước khi vào chiến dịch nhé.'};
  if(!pay(state,s.cost))return {error:'Cần thêm quả mọng làm hành trang cho ải này.'};
  const ch=chapterOf(s),members=combatMembers(state);
  state.expedition={biome:s.chapter,stage:0,hp:100,focus:0,power:teamPower(state,{element:ch.element}).power,members,threat:s.power,scale:1,loot:{},event:0,battle:null,started:now,log:[s.dialogue],squad:newSquad(members,100,100,state.battleFormation?.rows),campaign:{version:1,id,turns:0,downs:[],skills:0,combos:0,evades:0,guards:0}};
  return {expedition:state.expedition,cost:{...s.cost}};
}
export function sweepCampaign(state,id,count=1){
  const s=campaignStage(id);if(!s||![1,5].includes(count))return {error:'Lượt quét không hợp lệ.'};
  if(state.campaign.stages[id]?.stars!==3)return {error:'Đạt 3 sao ở ải này để mở quét nhanh.'};
  if(busy(state))return {error:'Đội đang đi xa. Kết thúc chuyến đi trước khi quét nhé.'};
  const cost={food:s.cost.food*count};if(!pay(state,cost))return {error:'Chưa đủ quả mọng để quét số lượt này.'};
  const reward=Object.fromEntries(Object.entries(s.reward).map(([k,n])=>[k,n*count]));grant(state,reward);addXP(state,10*count);
  return {reward,cost,count,id};
}
export function claimCampaignChest(state,chapter,stars){
  const ch=CAMPAIGN_CHAPTERS.find(c=>c.id===chapter),key=`${chapter}:${stars}`;
  if(!ch||![8,16,24].includes(stars)||state.campaign.claimed.includes(key)||campaignStars(state,chapter)<stars)return {error:'Rương sao chưa mở hoặc bạn đã nhận rồi.'};
  state.campaign.claimed.push(key);const reward=campaignChestReward(ch,stars);grant(state,reward);return {reward,chapter,stars};
}
