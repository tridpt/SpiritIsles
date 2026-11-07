import { validateMemberAwakening } from './awakening-state.js';
import { CHALLENGES, CHALLENGE_BY_ID, dojoDefinition, DOJO_MILESTONES, totalStars, challengeUnlocked, goalState } from './dojo-data.js';
import { awakeningGate } from './awakening-data.js';
import { BY_ID } from './data.js';
import { validateTraining } from './skill-paths.js';
import { validateMemberGear } from './forge-state.js';

export const newDojo=()=>({version:1,records:{},claimed:[],cosmetics:{title:null,aura:false,decoration:false},run:null,lastResult:null});
export const newDojoMetrics=()=>({turns:0,damage:0,maxHit:0,incoming:0,healed:0,ward:0,parries:0,ripostes:0,combos:0,interrupts:0,armorPierces:0,armorCounters:0,spellHits:0,rootsCut:0,coreBreakTurn:0,revives:0,frozen:0,staggers:0,skills:0,hpPercent:100,actors:{}});
export function validateDojo(state,now,validateSandbox){
  const d=state.dojo,object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),int=(v,min=0,max=99999999)=>Number.isInteger(v)&&v>=min&&v<=max;
  const fail=()=>{throw new Error('Tiến trình Võ đường không hợp lệ.');};
  if(!object(d)||d.version!==1||!object(d.records)||Object.keys(d.records).some(id=>!Object.hasOwn(CHALLENGE_BY_ID,id)))fail();
  for(const [id,r]of Object.entries(d.records))if(!object(r)||!int(r.stars,1,7)||!(r.stars&1)||!int(r.wins,1)||!int(r.bestTurns,1,60)||!challengeUnlocked(state,id))fail();
  if(!Array.isArray(d.claimed)||new Set(d.claimed).size!==d.claimed.length||!d.claimed.every(n=>DOJO_MILESTONES.some(m=>m.stars===n)&&n<=totalStars(state)))fail();
  const c=d.cosmetics;if(!object(c)||Object.keys(c).length!==3||![null,'reader','master'].includes(c.title)||c.title==='reader'&&!d.claimed.includes(6)||c.title==='master'&&!d.claimed.includes(24)||typeof c.aura!=='boolean'||c.aura&&!d.claimed.includes(12)||typeof c.decoration!=='boolean'||c.decoration&&!d.claimed.includes(18))fail();
  const metrics=(m,team)=>{
    if(!object(m)||Object.keys(m).length!==Object.keys(newDojoMetrics()).length||!object(m.actors)||Object.keys(m.actors).some(id=>!team.includes(id)))fail();
    for(const key of Object.keys(newDojoMetrics()))if(key!=='actors'&&!int(m[key],0,key==='turns'?60:key==='hpPercent'?100:99999999))fail();
    for(const v of Object.values(m.actors))if(!object(v)||Object.keys(v).length!==2||!int(v.casts,1,60)||!int(v.damage))fail();
    if(m.coreBreakTurn>m.turns||['parries','ripostes','combos','interrupts','armorPierces','spellHits','revives','frozen','staggers','skills'].some(k=>m[k]>m.turns)||Object.values(m.actors).reduce((n,a)=>n+a.casts,0)!==m.skills)fail();
  };
  const definition=dojoDefinition;
  if(d.run!==null){
    const r=d.run,def=object(r)&&definition(r);
    if(!def||r.mode!==def.mode||!int(r.started,0,now+86400000)||!int(r.rng,1,0xffffffff)||!object(r.sandbox)||Object.hasOwn(r.sandbox,'dojo'))fail();
    // Sandbox saves may never contain nested arenas. Validate with the same rules
    // as normal play, on a copy, without importing an engine into this module.
    const s=validateSandbox({app:'SpiritIsles',version:1,state:r.sandbox},now);
    if(r.mode==='boss'?(!s.boss.run||s.expedition||s.ruins.run||s.boss.run.bossId!==(r.kind==='practice'?r.id:def.enemy)):(!s.expedition?.battle||s.boss.run||s.ruins.run||s.expedition.battle.enemyAI.kind!==(r.kind==='practice'?r.id:def.enemy)))fail();
    if(r.kind==='challenge'&&(!challengeUnlocked(state,r.id)||s.team.join(',')!==def.team.join(',')))fail();
    if(r.kind==='awakening'&&(awakeningGate(state,r.id)||s.team.join(',')!==def.team.join(',')||(r.mode==='boss'?s.boss.run.members:s.expedition.members).some(m=>m.awakened||m.power!==def.power)))fail();
    metrics(r.metrics,s.team);
    const b=r.mode==='boss'?s.boss.run:s.expedition.battle,hp=r.mode==='boss'?b.hp:s.expedition.hp;
    if(r.metrics.turns>=60||r.metrics.turns!==(b.turn??b.round)||r.metrics.hpPercent!==Math.floor(hp/(r.mode==='boss'?150:100)*100))fail();
  }
  if(d.lastResult!==null){
    const r=d.lastResult,def=object(r)&&definition(r);
    if(!def||!['victory','defeat','stopped'].includes(r.status)||!Array.isArray(r.team)||r.team.length<1||r.team.length>3||new Set(r.team).size!==r.team.length||!object(r.actors)||Object.keys(r.actors).length!==r.team.length||!r.team.every(id=>Object.hasOwn(BY_ID,id)&&Object.hasOwn(r.actors,id))||!int(r.time,0,now+86400000)||!int(r.stars,0,7)||!int(r.newStars,0,7)||typeof r.first!=='boolean'||!object(r.reward)||r.maxHp!==(def.mode==='boss'?150:100)||!int(r.hp,0,r.maxHp)||r.status==='defeat'&&r.hp!==0)fail();
    for(const id of r.team){const a=r.actors[id];if(!object(a)||a.id!==id||!int(a.power,1,2000))fail();validateMemberGear(a);validateTraining(a,{optional:true});validateMemberAwakening(a);}
    metrics(r.metrics,r.team);
    if(r.kind==='awakening'&&(awakeningGate(state,r.id)||r.team.join(',')!==def.team.join(',')||r.team.some(id=>r.actors[id].awakened||r.actors[id].power!==def.power)||typeof r.trialCleared!=='boolean'||r.trialCleared!==(r.status==='victory'&&def.goals.every(g=>goalState(g,r.metrics,r.status).status))||r.trialCleared&&!state.awakening.trials[r.id]))fail();
    const expected=r.kind==='challenge'&&r.status==='victory'?def.goals.reduce((mask,g,i)=>mask|(goalState(g,r.metrics,r.status).status?1<<i:0),0):0;
    if(r.stars!==expected||(r.newStars&r.stars)!==r.newStars||r.first&&(r.status!=='victory'||r.kind!=='challenge')||r.kind==='challenge'&&r.status==='victory'&&((d.records[r.id]?.stars&r.stars)!==r.stars))fail();
    const allowed=r.first?{tickets:1,gold:200+CHALLENGES.findIndex(c=>c.id===r.id)*40}:{};
    if(Object.keys(r.reward).length!==Object.keys(allowed).length||!Object.entries(r.reward).every(([k,v])=>Object.hasOwn(allowed,k)&&v===allowed[k])||r.metrics.hpPercent!==Math.floor(r.hp/r.maxHp*100))fail();
  }
}
