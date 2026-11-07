import {CAMPAIGN_STAGES,CAMPAIGN_CHAPTERS,campaignStage,chapterOf,campaignGoalText} from './campaign-data.js';
export const newCampaign=()=>({version:1,stages:{},claimed:[]});
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
export const campaignStars=(state,chapter)=>CAMPAIGN_STAGES.filter(s=>!chapter||s.chapter===chapter).reduce((n,s)=>n+(state.campaign?.stages[s.id]?.stars||0),0);
export function stageUnlocked(state,id){const s=campaignStage(id);if(!s)return false;const i=CAMPAIGN_STAGES.indexOf(s);return i===0||!!state.campaign?.stages[CAMPAIGN_STAGES[i-1].id]?.wins;}
export const nextCampaignStage=state=>CAMPAIGN_STAGES.find(s=>!state.campaign?.stages[s.id]?.wins)||CAMPAIGN_STAGES.at(-1);
export function campaignGoals(ex,success){
  const s=campaignStage(ex.campaign.id),r=ex.campaign,{kind,target}=s.goal;
  const achieved=kind==='speed'?r.turns<=target:kind==='health'?ex.hp>=target:r[kind]>=target;
  return [!!success,!!success&&r.downs.length===0,!!success&&achieved];
}
export function recordCampaignTurn(ex,result,move){
  const r=ex?.campaign;if(!r||result.error)return;
  r.turns++;if(/^(pet|awaken):/.test(move))r.skills++;if(move==='guard')r.guards++;if(result.evaded)r.evades++;if(result.combo)r.combos++;
  for(const e of result.unitEvents||[])if(e.side==='ally'&&e.kind==='down'&&!r.downs.includes(e.target))r.downs.push(e.target);
  for(const u of ex.squad?.allies||[])if(!u.hp&&!r.downs.includes(u.id))r.downs.push(u.id);
}
export function settleCampaign(state,ex,success,retreat=false){
  const s=campaignStage(ex.campaign.id),ch=chapterOf(s),goals=campaignGoals(ex,success),stars=goals.filter(Boolean).length,old=state.campaign.stages[s.id];
  const first=success&&!old,chapterFinished=first&&s.boss,reward=success?{...s.reward}:{};
  if(first)for(const [k,v]of Object.entries(s.firstReward))reward[k]=(reward[k]||0)+v;
  if(success)state.campaign.stages[s.id]={wins:Math.min(99999999,(old?.wins||0)+1),stars:Math.max(old?.stars||0,stars),goals:old&&old.stars>=stars?old.goals:goals,bestTurns:Math.min(old?.bestTurns||999999,ex.campaign.turns)};
  return {finished:true,success,retreat,reward,biome:s.chapter,campaign:{id:s.id,label:s.label,name:s.name,chapter:s.chapter,stars,goals,goalText:campaignGoalText(s),first,bestStars:Math.max(old?.stars||0,stars),turns:ex.campaign.turns,chapterFinished,decoration:chapterFinished?ch.decorationName:null,story:success?(chapterFinished?ch.outro:s.dialogue):'Cả đội đã về an toàn. Chăm sóc các bạn rồi quay lại thử một chiến thuật mới nhé.',next:success?CAMPAIGN_STAGES[CAMPAIGN_STAGES.indexOf(s)+1]?.id:null}};
}
export function validateCampaign(state,now=Date.now()){
  if(!Object.hasOwn(state,'campaign'))state.campaign=newCampaign();
  const c=state.campaign,fail=()=>{throw new Error('Tiến trình chiến dịch không hợp lệ.');};
  if(!object(c)||Object.keys(c).length!==3||c.version!==1||!object(c.stages)||!Array.isArray(c.claimed)||new Set(c.claimed).size!==c.claimed.length)fail();
  for(const [id,p]of Object.entries(c.stages)){
    if(!campaignStage(id)||!stageUnlocked(state,id)||!object(p)||Object.keys(p).length!==4||!integer(p.wins,1,99999999)||!integer(p.stars,1,3)||!integer(p.bestTurns,1,999999)||!Array.isArray(p.goals)||p.goals.length!==3||!p.goals.every(v=>typeof v==='boolean')||p.goals[0]!==true||p.goals.filter(Boolean).length!==p.stars)fail();
  }
  for(const key of c.claimed){if(typeof key!=='string')fail();const [id,n]=key.split(':');if(!CAMPAIGN_CHAPTERS.some(ch=>ch.id===id)||![8,16,24].includes(Number(n))||key!==`${id}:${Number(n)}`||campaignStars(state,id)<Number(n))fail();}
  const ex=state.expedition;
  if(!ex||!Object.hasOwn(ex,'campaign'))return;
  const r=ex.campaign,s=campaignStage(r?.id);
  if(!object(r)||Object.keys(r).length!==8||r.version!==1||!s||ex.biome!==s.chapter||!stageUnlocked(state,s.id)||!['turns','skills','combos','evades','guards'].every(k=>integer(r[k],0,k==='turns'?999999:r.turns))||r.combos>r.skills||r.skills+r.guards+r.evades>r.turns||!Array.isArray(r.downs)||new Set(r.downs).size!==r.downs.length||!r.downs.every(id=>state.team.includes(id))||!ex.squad||!integer(ex.started,0,now+86400000))fail();
  if(state.tower?.run||state.ruins?.run||state.boss?.run)fail();
  if(ex.battle){const b=ex.battle,boss=s.boss&&ex.stage===s.waves-1;if(b.boss!==boss||![1,2].includes(b.campaignPhase)||!boss&&b.campaignPhase!==1||r.turns<b.round)fail();}
}
