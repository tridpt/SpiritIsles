import {BY_ID,BIOMES} from './data.js';
import {campaignBiome} from './campaign-data.js';

export const newCombatJournal=()=>({version:1,active:null,reports:[]});
const num=(n,max=999999999)=>Number.isInteger(n)&&n>=0&&n<=max;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const statKeys=['damage','heal','ward','taken','blocked','casts'];
const empty=()=>Object.fromEntries(statKeys.map(k=>[k,0]));
function encounter(state,mode){
  const run=mode==='boss'?state.boss?.run:mode==='ruins'?state.ruins?.run:mode==='tower'?state.tower?.run:state.expedition;
  const battle=mode==='boss'?run:run?.battle;if(!battle)return null;
  const marker=mode==='explore'?run.stage:['ruins','tower'].includes(mode)?run.floor:run.tier;
  return {id:`${mode}:${run.started}:${marker}`,run,battle,round:battle.round??battle.turn??0,title:mode==='explore'?`${campaignBiome(run)?.name} · Chặng ${run.stage+1}`:mode==='tower'?`Tháp Vô Tận · Tầng ${run.floor}`:mode==='ruins'?`Phế Tích Cổ · Tầng ${run.floor}`:`Thủ vệ · Bậc ${run.tier}`};
}
export function recordCombatTurn(state,mode,action,step){
  const before=encounter(state,mode),result=step();if(result?.error||!before)return result;
  const journal=state.combatJournal||=newCombatJournal();
  const report=journal.active?.id===before.id?journal.active:{id:before.id,mode,title:before.title,status:'active',turns:0,partial:before.round>0,members:before.run.members.map(m=>({id:m.id,...empty()})),shared:empty(),downs:[],core:0,interrupts:0};
  const member=id=>report.members.find(m=>m.id===id);
  const move=typeof action==='string'?action:action.move;
  const events=result.unitEvents||[];report.turns++;
  for(const e of events){
    const source=member(e.actor),target=member(e.target),n=Math.max(0,Math.round(e.amount||0));
    if(e.side==='enemy'&&e.kind==='damage')(move==='skill'?report.shared:source||report.shared).damage+=n;
    if(e.side==='ally'&&['heal','ward'].includes(e.kind))(source||report.shared)[e.kind]+=n;
    if(e.side==='ally'&&e.kind==='damage'){(target||report.shared).taken+=n;(target||report.shared).blocked+=Math.max(0,Math.round(e.absorbed||0));}
    if(e.side==='ally'&&e.kind==='down'&&target&&!report.downs.some(d=>d.id===e.target))report.downs.push({id:e.target,turn:report.turns});
  }
  if(before.run.squad){
    // Shared wards (relics, blessings and gear sets) do not emit unit events.
    // Attribute actual newly granted ward to the team, excluding opening ward.
    const sharedGranted=Math.max(0,Math.round(result.ward||0)-events.filter(e=>e.side==='ally'&&e.kind==='ward').reduce((n,e)=>n+e.amount,0));
    report.shared.ward+=sharedGranted;
  }
  // Old shared-health fights have no unit events. Keep these figures as team effects.
  if(!before.run.squad){report.shared.damage+=Math.max(0,Math.round(result.damage||0))+Math.max(0,Math.round(result.reflected||0));report.shared.heal+=Math.max(0,Math.round(result.heal||0));report.shared.ward+=Math.max(0,Math.round(result.ward||0));report.shared.taken+=Math.max(0,Math.round(result.incoming||0));report.shared.blocked+=Math.max(0,Math.round(result.absorbed||0));}
  const caster=result.actor;
  if(member(caster))member(caster).casts++;
  if(move==='skill'&&result.strategy)report.shared.casts++;
  report.core+=Math.max(0,Math.round(result.coreDamage||0));report.interrupts+=Number(!!result.interrupted);
  const after=encounter(state,mode);
  if(!after||after.id!==before.id){report.status=result.result?.status||(result.finished&&result.success===false?'defeat':'victory');journal.reports.unshift(structuredClone(report));journal.reports=journal.reports.slice(0,8);journal.active=null;result.combatReport=structuredClone(report);}
  else journal.active=report;
  return result;
}
export function retireCombatReport(state,mode){
  const j=state.combatJournal;if(j?.active?.mode!==mode)return;
  const report={...structuredClone(j.active),status:'retreat'};j.reports.unshift(report);j.reports=j.reports.slice(0,8);j.active=null;
}
export function currentCombatReport(state,mode){const e=encounter(state,mode),r=state.combatJournal?.active;return e&&r?.id===e.id?r:null;}
export function validateCombatJournal(state){
  if(!Object.hasOwn(state,'combatJournal'))state.combatJournal=newCombatJournal();
  const j=state.combatJournal,fail=()=>{throw new Error('Báo cáo chiến đấu không hợp lệ.');};
  if(!object(j)||Object.keys(j).length!==3||j.version!==1||!Object.hasOwn(j,'active')||!Array.isArray(j.reports)||j.reports.length>8)fail();
  function check(r,active){
    if(!object(r)||Object.keys(r).length!==11||typeof r.id!=='string'||r.id.length>100||!['explore','boss','ruins','tower'].includes(r.mode)||typeof r.title!=='string'||r.title.length>150||!(active?['active']:['victory','defeat','retreat']).includes(r.status)||!num(r.turns,10000)||typeof r.partial!=='boolean'||!Array.isArray(r.members)||r.members.length<1||r.members.length>3||new Set(r.members.map(m=>m?.id)).size!==r.members.length||!Array.isArray(r.downs)||r.downs.length>3||!num(r.core)||!num(r.interrupts,10000))fail();
    if(r.turns<1)fail();
    for(const m of r.members)if(!object(m)||Object.keys(m).length!==7||!Object.hasOwn(BY_ID,m.id)||!state.pets.some(p=>p.id===m.id)||!statKeys.every(k=>num(m[k]))||m.casts>r.turns)fail();
    if(!object(r.shared)||Object.keys(r.shared).length!==6||!statKeys.every(k=>num(r.shared[k])))fail();
    if(new Set(r.downs.map(d=>d?.id)).size!==r.downs.length||r.downs.some((d,i)=>!object(d)||Object.keys(d).length!==2||!r.members.some(m=>m.id===d.id)||!num(d.turn,r.turns)||d.turn<1||i>0&&d.turn<r.downs[i-1].turn))fail();
  }
  if(j.active!==null){check(j.active,true);const e=encounter(state,j.active.mode);if(!e||e.id!==j.active.id||j.active.turns>e.round||j.active.members.map(m=>m.id).join(',')!==e.run.members.map(m=>m.id).join(','))fail();}for(const r of j.reports)check(r,false);
}
