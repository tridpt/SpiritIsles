import { AWAKENINGS,awakeningCost,awakeningGate } from './awakening-data.js';
export const newAwakening=()=>({version:1,materials:{sigil:0,relic:0},trials:{}});
export function validateMemberAwakening(member){if(Object.hasOwn(member,'awakened')&&(typeof member.awakened!=='boolean'||member.awakened&&!Object.hasOwn(AWAKENINGS,member.id)))throw new Error('Dạng thức tỉnh trong đội không hợp lệ.');}
export function validateAwakening(state){
  const a=state.awakening,object=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(n,min=0,max=99999999)=>Number.isInteger(n)&&n>=min&&n<=max;
  const fail=()=>{throw new Error('Tiến trình Thức tỉnh không hợp lệ.');};
  if(!object(a)||a.version!==1||Object.keys(a).length!==3||!object(a.materials)||Object.keys(a.materials).length!==2||!['sigil','relic'].every(k=>int(a.materials[k]))||!object(a.trials))fail();
  for(const [id,r]of Object.entries(a.trials))if(!Object.hasOwn(AWAKENINGS,id)||awakeningGate(state,id)||!object(r)||Object.keys(r).length!==2||!int(r.wins,1)||!int(r.bestTurns,1,60))fail();
  for(const p of state.pets){
    if(!Object.hasOwn(p,'awakened'))p.awakened=false;
    validateMemberAwakening(p);if(p.awakened&&(awakeningGate(state,p.id)||!Object.hasOwn(a.trials,p.id)))fail();
  }
}
export function awakenPet(state,id){
  const error=awakeningGate(state,id);if(error)return {error};
  const pet=state.pets.find(p=>p.id===id);
  if(pet.awakened)return {error:'Người bạn này đã thức tỉnh.'};
  if(state.expedition||state.ruins?.run||state.boss?.run||state.dojo?.run)return {error:'Kết thúc hành trình và buổi thử thách trước khi thức tỉnh nhé.'};
  if(!Object.hasOwn(state.awakening.trials,id))return {error:'Vượt đủ mục tiêu thử thách riêng trước nhé.'};
  const cost=awakeningCost(id);
  if(!Object.entries(cost).every(([k,n])=>(k in state.awakening.materials?state.awakening.materials[k]:state.resources[k])>=n))return {error:'Chưa đủ nguyên liệu thức tỉnh. Săn Thủ Vệ và vượt tầng boss Phế Tích Cổ để kiếm thêm.'};
  for(const [k,n]of Object.entries(cost))if(k in state.awakening.materials)state.awakening.materials[k]-=n;else state.resources[k]-=n;
  pet.awakened=true;return {pet,awakening:AWAKENINGS[id],cost};
}
