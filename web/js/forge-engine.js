import { pay, canPay } from './engine.js';
import { GEAR_BY_ID, GEAR_LIMIT, gearOwner, combatLocked } from './forge-state.js';

export function claimForgeKit(state){
  if(state.level<2)return {error:'Xưởng mở ở cấp đảo 2.'};
  if(state.forge.kitClaimed)return {error:'Hòm làm quen đã được nhận.'};
  state.forge.kitClaimed=true;state.forge.materials.sap=Math.min(99999999,state.forge.materials.sap+9);state.forge.materials.ore=Math.min(99999999,state.forge.materials.ore+6);
  return {materials:{sap:9,ore:6}};
}
export function craftCost(){return {gold:90,sap:3,ore:2};}
export function upgradeCost(item,duplicate=false){return {gold:duplicate?50*item.level:100*item.level,sap:duplicate?0:3*item.level,ore:duplicate?0:2*item.level,heart:item.level>=3?item.level-2:0};}
export function canForgePay(state,cost){return canPay(state,{gold:cost.gold})&&['sap','ore','heart'].every(k=>state.forge.materials[k]>=(cost[k]||0));}
function forgePay(state,cost){if(!canForgePay(state,cost))return false;pay(state,{gold:cost.gold});for(const k of ['sap','ore','heart'])state.forge.materials[k]-=cost[k]||0;return true;}
export function addGear(state,recipe){
  if(!Object.hasOwn(GEAR_BY_ID,recipe)||state.forge.items.length>=GEAR_LIMIT||state.forge.nextId>=99999999)return null;
  const item={id:`g${state.forge.nextId++}`,recipe,level:1};state.forge.items.push(item);return item;
}
export function craftGear(state,recipe){
  if(state.level<2||!Object.hasOwn(GEAR_BY_ID,recipe)||GEAR_BY_ID[recipe].boss)return {error:'Công thức chưa mở. Đồ riêng của thủ vệ chỉ nhận khi thắng boss đó.'};
  if(state.forge.items.length>=GEAR_LIMIT||state.forge.nextId>=99999999)return {error:'Túi đã đầy. Dùng đồ trùng để nâng hoặc tái chế nhé.'};
  const cost=craftCost();if(!forgePay(state,cost))return {error:'Cần 90 vàng, 3 nhựa cổ và 2 đá rễ.'};
  return {item:addGear(state,recipe),cost};
}
export function equipGear(state,petId,itemId){
  if(combatLocked(state))return {error:'Kết thúc chuyến đi trước khi thay trang bị nhé.'};
  if(!state.pets.some(p=>p.id===petId))return {error:'Bạn chưa có linh thú này.'};
  const item=state.forge.items.find(i=>i.id===itemId);if(!item)return {error:'Không tìm thấy trang bị.'};
  const owner=gearOwner(state,itemId);if(owner&&owner!==petId)return {error:'Món đồ đang được một bạn khác mang.'};
  state.forge.equipped[petId]||={};state.forge.equipped[petId][GEAR_BY_ID[item.recipe].slot]=itemId;return {item};
}
export function unequipGear(state,petId,slot){
  if(combatLocked(state))return {error:'Kết thúc chuyến đi trước khi thay trang bị nhé.'};
  if(!state.forge.equipped[petId]?.[slot])return {error:'Ô trang bị đang trống.'};
  delete state.forge.equipped[petId][slot];if(!Object.keys(state.forge.equipped[petId]).length)delete state.forge.equipped[petId];return {removed:true};
}
export function upgradeGear(state,id,donorId=null){
  if(combatLocked(state))return {error:'Kết thúc chuyến đi trước khi nâng trang bị nhé.'};
  const item=state.forge.items.find(i=>i.id===id),donor=state.forge.items.find(i=>i.id===donorId);
  if(!item||item.level>=5)return {error:'Món đồ không hợp lệ hoặc đã đạt cấp 5.'};
  if(donorId&&(!donor||donor.id===id||donor.recipe!==item.recipe||donor.level!==1||gearOwner(state,donorId)))return {error:'Chỉ ghép bản trùng cấp 1 chưa được mang.'};
  const cost=upgradeCost(item,!!donorId);if(!forgePay(state,cost))return {error:'Chưa đủ vàng hoặc nguyên liệu nâng cấp. Lõi rừng kiếm từ boss.'};
  if(donorId)state.forge.items=state.forge.items.filter(i=>i.id!==donorId);
  item.level++;return {item,cost,consumed:donorId};
}
export function recycleGear(state,id){
  if(combatLocked(state))return {error:'Kết thúc chuyến đi trước khi tái chế nhé.'};
  const item=state.forge.items.find(i=>i.id===id);
  if(!item||gearOwner(state,id))return {error:'Tháo trang bị trước khi tái chế.'};
  const materials={sap:2*item.level,ore:item.level};
  for(const [k,n]of Object.entries(materials))state.forge.materials[k]=Math.min(99999999,state.forge.materials[k]+n);
  state.forge.items=state.forge.items.filter(i=>i.id!==id);return {materials};
}
