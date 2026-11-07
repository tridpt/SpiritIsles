import { BY_ID, SPECIES } from './data.js';
import { layoutOf, sizeOf, itemOf } from './island-layout.js';
import { grant, dayKey } from './engine.js';
import { HABITAT_MOMENTS, MOMENT_BY_ID, HABITAT_MILESTONES, momentApplies, memoryKey, newHabitat } from './habitat-data.js';

export const momentsFor=species=>HABITAT_MOMENTS.filter(m=>momentApplies(typeof species==='string'?BY_ID[species]:species,m));
export const habitatOf=state=>state.habitat||newHabitat();
export const memoryOf=(state,id,moment)=>habitatOf(state).discovered[memoryKey(id,moment)];
export function habitatSummary(state) {
  const h=habitatOf(state),count=Object.keys(h.discovered).length;
  return {count,total:SPECIES.reduce((n,s)=>n+momentsFor(s).length,0),ownedTotal:state.pets.reduce((n,p)=>n+momentsFor(p.species).length,0),species:new Set(Object.keys(h.discovered).map(k=>k.split(':')[0])).size,
    ready:HABITAT_MILESTONES.filter(m=>count>=m.target&&!h.claimed.includes(m.id)),next:HABITAT_MILESTONES.find(m=>count<m.target)||null};
}

// Pick one owned, undiscovered moment for the current device day. The choice is
// derived from the day and the player's current collection, so it works offline
// and never needs another save field.
export function dailyHabitatHint(state, now=Date.now()) {
  if(!Number.isFinite(now)||!Number.isFinite(new Date(now).getTime()))return null;
  const owned=state.pets.filter(p=>BY_ID[p.species]);
  if(!owned.length)return null;
  const moments=owned.flatMap(p=>momentsFor(p.species).map(moment=>({
    pet:p,moment,status:momentStatus(state,p.id,moment.id)
  }))).filter(entry=>!entry.status.discovered);
  if(!moments.length)return {date:dayKey(now),complete:true,pet:owned[0],moment:null,status:null,ready:false};
  const ready=moments.filter(entry=>entry.status.canPlay);
  const closest=Math.min(...moments.map(entry=>entry.status.reasons.length));
  const pool=(ready.length?ready:moments.filter(entry=>entry.status.reasons.length===closest)).sort((a,b)=>{
    const left=memoryKey(a.pet.id,a.moment.id),right=memoryKey(b.pet.id,b.moment.id);
    return left<right?-1:left>right?1:0;
  });
  const date=dayKey(now),parts=date.split('-').map(Number),day=Math.floor(Date.UTC(parts[0],parts[1]-1,parts[2])/86400000);
  const selected=pool[((day%pool.length)+pool.length)%pool.length];
  return {date,complete:false,pet:selected.pet,moment:selected.moment,status:selected.status,ready:selected.status.canPlay};
}
// Distance between the nearest occupied cells, including rotated furniture.
export function furnitureDistance(a,b) {
  const aa=sizeOf(a),bb=sizeOf(b);
  return Math.max(0,a.x-b.x-bb.w+1,b.x-a.x-aa.w+1)+Math.max(0,a.y-b.y-bb.h+1,b.y-a.y-aa.h+1);
}
const names=types=>types.map(type=>itemOf(type).name).join(' / ');
export function momentStatus(state,id,momentId,decorationId=null,partnerId=null) {
  const pet=state.pets.find(p=>p.id===id),m=Object.hasOwn(MOMENT_BY_ID,momentId)?MOMENT_BY_ID[momentId]:null;
  if(!pet||!momentApplies(BY_ID[pet.species],m))return {error:'Người bạn này chưa có khoảnh khắc đó.'};
  const placed=layoutOf(state).placed,primary=placed.filter(p=>m.decor.includes(p.type)&&(decorationId===null||p.id===decorationId));
  let decoration=primary[0],support=null;
  if(m.near){for(const p of primary){const q=placed.find(q=>q.id!==p.id&&m.near.includes(q.type)&&furnitureDistance(p,q)<=2);if(q){decoration=p;support=q;break;}}}
  const partner=m.buddy?state.pets.find(p=>(partnerId===null||p.id===partnerId)&&p.id!==id&&p.bond>=10&&BY_ID[p.species].element!==BY_ID[pet.species].element):null;
  const reasons=[];
  if(!decoration)reasons.push(`Đặt ${names(m.decor)} lên đảo.`);
  if(m.near&&!support)reasons.push(`Đặt ${names(m.near)} cách ${names(m.decor)} tối đa 2 ô.`);
  if(pet.bond<m.bond)reasons.push(`Cần ${m.bond} gắn bó, hiện có ${pet.bond}.`);
  if(m.buddy&&!partner)reasons.push('Cần một bạn khác hệ có ít nhất 10 gắn bó.');
  return {moment:m,pet,decoration,support,partner,discovered:!!memoryOf(state,id,m.id),canPlay:reasons.length===0,reasons};
}
export function discoverMoment(state,id,momentId,now=Date.now(),decorationId=null,partnerId=null) {
  if(!Number.isFinite(now)||now<0||now>Date.now()+86400000)return {error:'Thời gian ghi kỷ niệm không hợp lệ.'};
  const status=momentStatus(state,id,momentId,decorationId,partnerId);if(status.error)return status;
  if(status.discovered)return {pet:status.pet,isNew:false,gained:0};
  if(!status.canPlay)return {error:status.reasons.join(' ')};
  state.habitat||=newHabitat();
  const entry={at:now,decoration:status.decoration.type,...(status.partner?{partner:status.partner.id}:{})};
  state.habitat.discovered[memoryKey(id,momentId)]=entry;
  const gained=Math.min(2,100-status.pet.bond);status.pet.bond+=gained;
  return {pet:status.pet,entry,isNew:true,gained};
}
export function claimHabitatMilestone(state,id) {
  const m=HABITAT_MILESTONES.find(m=>m.id===id),h=habitatOf(state);
  if(!m||h.claimed.includes(id)||Object.keys(h.discovered).length<m.target)return {error:'Cột mốc chưa hoàn thành hoặc đã nhận.'};
  state.habitat||=newHabitat();state.habitat.claimed.push(id);grant(state,m.reward);return {reward:{...m.reward},milestone:m};
}
export function decorMomentHint(type) {
  const list=HABITAT_MOMENTS.filter(m=>m.decor.includes(type)||m.near?.includes(type));
  return list.length?`Gợi ý: ${list.slice(0,2).map(m=>m.name).join(' · ')}${list.length>2?` · +${list.length-2} khoảnh khắc`:''}`:'';
}
