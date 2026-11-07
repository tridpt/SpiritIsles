import { campaignStars } from './campaign-state.js';
import { SEASON_KEY, SEASON_DURATION, SEASON_DAYS, SEASON_MISSIONS, SEASON_MILESTONES, SEASON_SHOP, SEASON_CHALLENGES } from './seasonal-data.js';

const DAY = 86400000;
const MAX = 99999999;
const REPEAT_METRICS = ['hatches','feeds','expeditions','catches','campaignWins','towerBosses'];
const METRICS = [...REPEAT_METRICS,'memories','campaignStars','towerBest'];
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const integer = (v,a,b) => Number.isInteger(v) && v >= a && v <= b;
const record = (keys,fn) => Object.fromEntries(keys.map(k=>[k,fn(k)]));
const sameKeys = (a,b) => object(a) && Object.keys(a).sort().join() === Object.keys(b).sort().join();
const unique = v => Array.isArray(v) && new Set(v).size === v.length;
const sum = list => list.reduce((n,v)=>n+v,0);
const byId = (list,id) => list.find(v=>v.id===id);

export function seasonalMetric(state,metric) {
  if(metric==='memories')return Object.keys(state.habitat?.discovered||{}).length;
  if(metric==='campaignStars')return campaignStars(state);
  if(metric==='campaignWins')return sum(Object.values(state.campaign?.stages||{}).map(p=>p.wins||0));
  if(metric==='towerBosses')return state.tower?.bosses||0;
  if(metric==='towerBest')return state.tower?.best||0;
  if(metric==='catches')return state.fishing?.total||0;
  return state.stats?.[metric]||0;
}

export function newSeasonal(now=Date.now(),state=null,cycle=1) {
  return {
    version:1,id:`${SEASON_KEY}-${cycle}`,started:now,closed:false,
    currency:0,carried:0,earned:0,
    baseline:record(REPEAT_METRICS,k=>state?seasonalMetric(state,k):0),
    progress:record(METRICS,()=>0),
    claimedMissions:[],claimedChallenges:[],claimedMilestones:[],claimedShop:[],unlockedDecorations:[]
  };
}

// A completed season stays available until the player chooses the next one.
// Freeze its last progress so post-season actions belong to the next cycle.
export function refreshSeason(state,now=Date.now()) {
  if(!Object.hasOwn(state,'seasonal'))state.seasonal=newSeasonal(now,state);
  const s=state.seasonal;
  if(!s.closed){
    for(const k of METRICS)s.progress[k]=Math.max(s.progress[k],seasonalMetric(state,k)-(REPEAT_METRICS.includes(k)?s.baseline[k]:0),0);
    if(now>=s.started+SEASON_DURATION)s.closed=true;
  }
  return s;
}

export function seasonDay(state,now=Date.now()) {
  const s=refreshSeason(state,now);
  return s.closed?SEASON_DAYS:Math.max(1,Math.min(SEASON_DAYS,Math.floor((now-s.started)/DAY)+1));
}
export function seasonWeek(state,now=Date.now()) { return Math.min(3,Math.floor((seasonDay(state,now)-1)/7)); }
export function seasonRemaining(state,now=Date.now()) { const s=refreshSeason(state,now);return Math.max(0,s.started+SEASON_DURATION-now); }
export const missionTarget = (mission,week) => mission.targets[week];
export const missionClaimKey = (week,id) => `${week}:${id}`;
function parseMission(key){
  if(typeof key!=='string'||!/^[0-3]:[a-z]+$/.test(key))return null;
  const [w,id]=key.split(':'),mission=byId(SEASON_MISSIONS,id);
  return mission?{mission,week:Number(w)}:null;
}

export function seasonalMissions(state,now=Date.now(),week=seasonWeek(state,now)) {
  const s=refreshSeason(state,now),openWeek=seasonWeek(state,now);
  if(!integer(week,0,3))return [];
  return SEASON_MISSIONS.map(m=>{
    const target=missionTarget(m,week),claimKey=missionClaimKey(week,m.id),claimed=s.claimedMissions.includes(claimKey),progress=Math.min(target,s.progress[m.metric]),unlocked=week<=openWeek;
    return {...m,week,target,progress,claimed,unlocked,ready:unlocked&&!claimed&&progress>=target,claimKey};
  });
}
export function seasonalChallenges(state,now=Date.now()) {
  const s=refreshSeason(state,now);
  return SEASON_CHALLENGES.map(ch=>{
    const progress=Math.min(ch.target,s.progress[ch.metric]),claimed=s.claimedChallenges.includes(ch.id);
    return {...ch,progress,claimed,ready:!claimed&&progress>=ch.target};
  });
}
export function seasonalSummary(state,now=Date.now()) {
  const s=refreshSeason(state,now),week=seasonWeek(state,now),weeks=Array.from({length:4},(_,i)=>seasonalMissions(state,now,i));
  return {
    season:s,day:seasonDay(state,now),week,remaining:seasonRemaining(state,now),weeks,
    challenges:seasonalChallenges(state,now),
    milestones:SEASON_MILESTONES.map(m=>({...m,claimed:s.claimedMilestones.includes(m.id),ready:s.earned>=m.threshold&&!s.claimedMilestones.includes(m.id)})),
    shop:SEASON_SHOP.map(item=>({...item,claimed:s.claimedShop.includes(item.id),owned:!!item.decoration&&s.unlockedDecorations.includes(item.decoration),canBuy:s.currency>=item.cost&&!s.claimedShop.includes(item.id)&&!(item.decoration&&s.unlockedDecorations.includes(item.decoration))}))
  };
}
export function seasonalNotice(state,now=Date.now()){
  const view=seasonalSummary(state,now);
  return view.weeks.some(ms=>ms.some(m=>m.ready))||view.challenges.some(c=>c.ready)||view.milestones.some(m=>m.ready);
}

function grant(state,reward={}) {
  for(const [k,n] of Object.entries(reward))state.resources[k]=Math.min(MAX,state.resources[k]+n);
}
function unlock(s,decoration){if(decoration&&!s.unlockedDecorations.includes(decoration))s.unlockedDecorations.push(decoration);}
function addStars(s,n){s.currency+=n;s.earned+=n;}

export function claimSeasonalMission(state,key,now=Date.now()) {
  const parsed=parseMission(key);
  if(!parsed)return {error:'Nhiệm vụ lễ hội không hợp lệ.'};
  const {mission,week}=parsed,s=refreshSeason(state,now);
  if(week>seasonWeek(state,now)||s.claimedMissions.includes(key)||s.progress[mission.metric]<missionTarget(mission,week))return {error:'Nhiệm vụ chưa hoàn thành hoặc đã nhận.'};
  if(s.currency>MAX-mission.reward)return {error:'Hãy đổi bớt sao trong Tiệm lễ hội trước nhé.'};
  s.claimedMissions.push(key);addStars(s,mission.reward);
  return {mission,stars:mission.reward,week};
}
export function claimSeasonalChallenge(state,id,now=Date.now()){
  const challenge=byId(SEASON_CHALLENGES,id);
  if(!challenge)return {error:'Thử thách lễ hội không hợp lệ.'};
  const s=refreshSeason(state,now);
  if(s.claimedChallenges.includes(id)||s.progress[challenge.metric]<challenge.target)return {error:'Thử thách chưa hoàn thành hoặc đã nhận.'};
  if(s.currency>MAX-challenge.reward)return {error:'Hãy đổi bớt sao trong Tiệm lễ hội trước nhé.'};
  s.claimedChallenges.push(id);addStars(s,challenge.reward);
  return {challenge,stars:challenge.reward};
}
export function claimSeasonalMilestone(state,id,now=Date.now()) {
  const milestone=byId(SEASON_MILESTONES,id);
  if(!milestone)return {error:'Mốc lễ hội không hợp lệ.'};
  const s=refreshSeason(state,now);
  if(s.claimedMilestones.includes(id)||s.earned<milestone.threshold)return {error:'Mốc lễ hội chưa hoàn thành hoặc đã nhận.'};
  s.claimedMilestones.push(id);grant(state,milestone.reward);unlock(s,milestone.decoration);
  if(milestone.fragments)state.shiny.fragments=Math.min(MAX,state.shiny.fragments+milestone.fragments);
  return {milestone,reward:{...milestone.reward},fragments:milestone.fragments||0,decoration:milestone.decoration||null};
}
export function buySeasonalShop(state,id,now=Date.now()) {
  const item=byId(SEASON_SHOP,id);
  if(!item)return {error:'Vật phẩm lễ hội không hợp lệ.'};
  const s=refreshSeason(state,now);
  if(s.claimedShop.includes(id)||item.decoration&&s.unlockedDecorations.includes(item.decoration))return {error:'Bạn đã đổi hoặc sở hữu món quà này.'};
  if(s.currency<item.cost)return {error:'Chưa đủ sao lễ hội.'};
  s.currency-=item.cost;s.claimedShop.push(id);grant(state,item.reward);unlock(s,item.decoration);
  return {item,reward:{...item.reward},decoration:item.decoration||null};
}

export function startNextSeason(state,now=Date.now()){
  const s=refreshSeason(state,now);
  if(!s.closed)return {error:'Mùa hiện tại vẫn đang diễn ra.'};
  const cycle=Number(s.id.slice(SEASON_KEY.length+1))+1,view=seasonalSummary(state,now);
  if(cycle>999999)return {error:'Đã đạt giới hạn số mùa.'};
  const remainingStars=sum(view.weeks.flat().filter(m=>m.ready).map(m=>m.reward))+sum(view.challenges.filter(c=>c.ready).map(c=>c.reward));
  if(s.currency>MAX-remainingStars)return {error:'Hãy đổi bớt sao trong Tiệm lễ hội trước nhé.'};
  // Settle everything already earned before starting a fresh board.
  let stars=0,fragments=0;const reward={},decorations=[];
  for(const ms of view.weeks)for(const m of ms)if(m.ready){const r=claimSeasonalMission(state,m.claimKey,now);stars+=r.stars;}
  for(const c of view.challenges)if(c.ready){const r=claimSeasonalChallenge(state,c.id,now);stars+=r.stars;}
  for(const m of SEASON_MILESTONES)if(!s.claimedMilestones.includes(m.id)&&s.earned>=m.threshold){
    const r=claimSeasonalMilestone(state,m.id,now);
    for(const [k,n]of Object.entries(r.reward))reward[k]=(reward[k]||0)+n;
    fragments+=r.fragments;if(r.decoration)decorations.push(r.decoration);
  }
  state.seasonal={...newSeasonal(now,state,cycle),carried:s.currency,currency:s.currency,unlockedDecorations:[...s.unlockedDecorations]};
  refreshSeason(state,now);
  return {stars,reward,fragments,decorations,cycle};
}

export function validateSeasonal(state,now=Date.now()){
  if(!Object.hasOwn(state,'seasonal'))state.seasonal=newSeasonal(now,state);
  const s=state.seasonal,fail=()=>{throw new Error('Tiến trình Lễ Hội Sao Rơi không hợp lệ.');};
  if(!sameKeys(s,newSeasonal(now))||s.version!==1||typeof s.id!=='string'||!new RegExp(`^${SEASON_KEY}-[1-9][0-9]{0,5}$`).test(s.id)||!integer(s.started,0,now+DAY)||typeof s.closed!=='boolean'||s.closed&&now+DAY<s.started+SEASON_DURATION||!integer(s.currency,0,MAX)||!integer(s.carried,0,MAX)||!integer(s.earned,0,10000)||!sameKeys(s.baseline,record(REPEAT_METRICS,()=>0))||!sameKeys(s.progress,record(METRICS,()=>0))||![s.claimedMissions,s.claimedChallenges,s.claimedMilestones,s.claimedShop,s.unlockedDecorations].every(unique))fail();
  for(const k of REPEAT_METRICS)if(!integer(s.baseline[k],0,seasonalMetric(state,k)))fail();
  for(const k of METRICS)if(!integer(s.progress[k],0,Math.max(0,seasonalMetric(state,k)-(REPEAT_METRICS.includes(k)?s.baseline[k]:0))))fail();
  const openWeek=Math.min(3,Math.floor((Math.max(1,Math.min(30,Math.floor((now+DAY-s.started)/DAY)+1))-1)/7));
  for(const key of s.claimedMissions){
    const p=parseMission(key);
    if(!p||p.week>openWeek||s.progress[p.mission.metric]<missionTarget(p.mission,p.week))fail();
  }
  for(const id of s.claimedChallenges){const c=byId(SEASON_CHALLENGES,id);if(!c||s.progress[c.metric]<c.target)fail();}
  for(const id of s.claimedMilestones){const m=byId(SEASON_MILESTONES,id);if(!m||s.earned<m.threshold)fail();}
  if(!s.claimedShop.every(id=>byId(SEASON_SHOP,id))||!s.unlockedDecorations.every(id=>id==='starlitlantern'))fail();
  const earned=sum(s.claimedMissions.map(key=>parseMission(key).mission.reward))+sum(s.claimedChallenges.map(id=>byId(SEASON_CHALLENGES,id).reward));
  if(s.earned!==earned||s.currency!==s.carried+s.earned-sum(s.claimedShop.map(id=>byId(SEASON_SHOP,id).cost)))fail();
  if(s.id===`${SEASON_KEY}-1`&&(s.carried!==0||s.unlockedDecorations.length&&!s.claimedShop.includes('lantern')&&!s.claimedMilestones.includes('arch')))fail();
  for(const item of [...SEASON_MILESTONES.filter(m=>s.claimedMilestones.includes(m.id)),...SEASON_SHOP.filter(i=>s.claimedShop.includes(i.id))])if(item.decoration&&!s.unlockedDecorations.includes(item.decoration))fail();
  return s;
}
