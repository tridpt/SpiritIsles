import {squadRows} from './squad-state.js';

export const AUTO_PROFILES={
  sweep:{name:'Càn quét',icon:'swords',text:'Dồn sát thương, nhắm thú yếu máu. Thế Tấn công gây và nhận thêm 25%.',healAt:30,ultimate:'always',interrupt:true,priority:'weak'},
  safe:{name:'An toàn',icon:'shield',text:'Ưu tiên cứu đồng đội và hộ vệ. Chuyển Phòng bị khi yếu máu trước đòn mạnh.',healAt:48,ultimate:'always',interrupt:true,priority:'smart'},
  boss:{name:'Săn boss',icon:'trophy',text:'Giữ tuyệt kỹ cho thủ lĩnh, ưu tiên ngắt phép và phá rễ/lõi.',healAt:60,ultimate:'boss',interrupt:true,priority:'smart'}
};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>object(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export function profilePlan(profile='safe'){const p=AUTO_PROFILES[profile];return p?{profile,healAt:p.healAt,ultimate:p.ultimate,interrupt:p.interrupt,priority:p.priority}:null;}
export const newAutoTactics=()=>({version:1,plan:profilePlan(),slots:[null,null,null]});
export function validAutoPlan(p){return exact(p,['profile','healAt','ultimate','interrupt','priority'])&&Object.hasOwn(AUTO_PROFILES,p.profile)&&Number.isInteger(p.healAt)&&p.healAt>=0&&p.healAt<=80&&['always','boss','never'].includes(p.ultimate)&&typeof p.interrupt==='boolean'&&['smart','weak'].includes(p.priority);}
export function validateAutoTactics(state){
  if(!Object.hasOwn(state,'autoTactics'))state.autoTactics=newAutoTactics();
  const a=state.autoTactics,fail=()=>{throw new Error('Chiến thuật AUTO hoặc đội hình lưu không hợp lệ.');};
  if(!exact(a,['version','plan','slots'])||a.version!==1||!validAutoPlan(a.plan)||!Array.isArray(a.slots)||a.slots.length!==3)fail();
  for(const slot of a.slots){if(slot===null)continue;
    if(!exact(slot,['name','team','rows','plan'])||typeof slot.name!=='string'||!slot.name.trim()||slot.name.length>32||!Array.isArray(slot.team)||slot.team.length<1||slot.team.length>3||new Set(slot.team).size!==slot.team.length||!slot.team.every(id=>state.pets.some(p=>p.id===id))||!exact(slot.rows,slot.team)||!Object.values(slot.rows).every(r=>['front','back'].includes(r))||!Object.values(slot.rows).includes('front')||!validAutoPlan(slot.plan))fail();
  }
}
export function setAutoPlan(state,plan){
  if(!validAutoPlan(plan))return {error:'Điều kiện AUTO không hợp lệ.'};
  state.autoTactics||=newAutoTactics();state.autoTactics.plan={...plan};return {plan:state.autoTactics.plan};
}
export const teamLocked=state=>!!(state.expedition||state.ruins?.run||state.boss?.run||state.dojo?.run);
export function saveTeamPreset(state,index,name){
  if(!Number.isInteger(index)||index<0||index>2||typeof name!=='string'||!name.trim()||name.trim().length>32)return {error:'Tên đội cần từ 1 đến 32 ký tự.'};
  state.autoTactics||=newAutoTactics();
  const members=state.team.map(id=>state.pets.find(p=>p.id===id));
  const slot={name:name.trim(),team:[...state.team],rows:squadRows(members,state.battleFormation?.rows),plan:{...state.autoTactics.plan}};
  state.autoTactics.slots[index]=slot;return {slot};
}
export function applyTeamPreset(state,index){
  if(teamLocked(state))return {error:'Kết thúc chuyến đi hoặc buổi tập trước khi đổi đội nhé.'};
  const slot=Number.isInteger(index)&&state.autoTactics?.slots[index];if(!slot||!slot.team.every(id=>state.pets.some(p=>p.id===id)))return {error:'Chưa có đội hình trong ô này.'};
  state.team=[...slot.team];state.battleFormation={version:1,rows:{...(state.battleFormation?.rows||{}),...slot.rows}};state.autoTactics.plan={...slot.plan};return {slot};
}
