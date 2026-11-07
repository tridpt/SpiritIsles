import { BY_ID } from './data.js';

export const GEAR_SLOTS={charm:'Bùa',collar:'Vòng cổ',stone:'Tinh thạch'};
export const MATERIALS={sap:{name:'Nhựa cổ',icon:'drop'},ore:{name:'Đá rễ',icon:'gem'},heart:{name:'Lõi rừng',icon:'leaf'}};
export const GEAR_RECIPES=[
  {id:'rootfang',name:'Bùa Nanh Rễ',slot:'charm',stat:'power',base:10,step:3,icon:'swords',color:'#ba8965',text:'Tăng sức mạnh của thú.'},
  {id:'mistcharm',name:'Bùa Sương Mai',slot:'charm',stat:'heal',base:14,step:4,icon:'drop',color:'#73a9ac',text:'Tăng hồi phục từ chiêu của thú.'},
  {id:'barkcollar',name:'Vòng Vỏ Cổ',slot:'collar',stat:'ward',base:18,step:5,icon:'shield',color:'#8a9a6a',text:'Tăng khiên từ chiêu của thú.'},
  {id:'ambercollar',name:'Vòng Hổ Phách',slot:'collar',stat:'power',base:8,step:2.5,icon:'sun',color:'#c4a05e',text:'Tăng sức mạnh của thú.'},
  {id:'dewstone',name:'Thạch Mạch Sống',slot:'stone',stat:'heal',base:12,step:4,icon:'heart',color:'#a38bad',text:'Tăng hồi phục từ chiêu của thú.'},
  {id:'jadestone',name:'Thạch Lục Bảo',slot:'stone',stat:'ward',base:14,step:4,icon:'gem',color:'#6ca587',text:'Tăng khiên từ chiêu của thú.'}
];
export const BOSS_GEAR=[
  {id:'frostfang',boss:'frost',name:'Bùa Nanh Băng',slot:'charm',stat:'power',base:12,step:3,icon:'swords',color:'#67b9d5',text:'Chiến lợi phẩm Rồng Băng. Tăng sức mạnh của thú.'},
  {id:'glacierstone',boss:'frost',name:'Thạch Vĩnh Đông',slot:'stone',stat:'ward',base:18,step:4,icon:'gem',color:'#8acbd9',text:'Chiến lợi phẩm Rồng Băng. Tăng khiên từ chiêu của thú.'},
  {id:'emberplume',boss:'phoenix',name:'Vòng Vũ Hỏa',slot:'collar',stat:'power',base:11,step:3,icon:'flame',color:'#e18e56',text:'Chiến lợi phẩm Phượng Hoàng. Tăng sức mạnh của thú.'},
  {id:'dawnstone',boss:'phoenix',name:'Thạch Tái Sinh',slot:'stone',stat:'heal',base:16,step:4,icon:'sun',color:'#e1b564',text:'Chiến lợi phẩm Phượng Hoàng. Tăng hồi phục từ chiêu của thú.'},
];
export const GEAR_BY_ID=Object.fromEntries([...GEAR_RECIPES,...BOSS_GEAR].map(r=>[r.id,r]));
export const GEAR_SETS={
  frost:{id:'frost',name:'Vĩnh Đông',icon:'shield',color:'#67b9d5',pieces:['frostfang','glacierstone'],guardWard:.1,text:'Đeo đủ 2 món trên cùng một thú trong đội: đỡ hoàn hảo một đòn địch sẽ tạo khiên bằng 10% sinh lực tối đa sau đòn đó. Nhiều thú mang bộ này không cộng dồn.'},
  phoenix:{id:'phoenix',name:'Vũ Hỏa',icon:'flame',color:'#e18e56',pieces:['emberplume','dawnstone'],burnBonus:.35,text:'Đeo đủ 2 món trên cùng một thú: thiêu đốt do chiêu hoặc nối chiêu của thú đó gây ra mạnh hơn 35%. Không tăng sát thương trực tiếp.'},
};
export function gearSetProgress(state,id){
  const worn=Object.values(state?.forge?.equipped?.[id]||{}).map(itemId=>state.forge.items.find(i=>i.id===itemId)?.recipe);
  return Object.values(GEAR_SETS).map(s=>({...s,count:s.pieces.filter(recipe=>worn.includes(recipe)).length}));
}
export function equippedSet(state,id){return gearSetProgress(state,id).find(s=>s.count===2)?.id||null;}
export const GEAR_LIMIT=120;
export function newForge(){return {version:1,kitClaimed:false,materials:{sap:0,ore:0,heart:0},items:[],equipped:{},nextId:1};}
export function gearValue(item){const r=GEAR_BY_ID[item.recipe];return r.base+r.step*(item.level-1);}
export function gearBonuses(state,id){
  const result={power:0,heal:0,ward:0};
  for(const itemId of Object.values(state?.forge?.equipped?.[id]||{})){
    const item=state.forge.items.find(i=>i.id===itemId);if(item)result[GEAR_BY_ID[item.recipe].stat]+=gearValue(item);
  }
  return result;
}
export function gearOwner(state,itemId){return Object.entries(state.forge.equipped).find(([,slots])=>Object.values(slots).includes(itemId))?.[0]||null;}
export function combatLocked(state){return !!(state.expedition||state.ruins?.run||state.boss?.run);}
export function validateMemberGear(member){
  if(!Object.hasOwn(member,'gear'))return;
  const g=member.gear;
  if(!g||typeof g!=='object'||Array.isArray(g)||Object.keys(g).some(k=>!['heal','ward','set'].includes(k))||!['heal','ward'].every(k=>Number.isFinite(g[k])&&g[k]>=0&&g[k]<=100)||Object.hasOwn(g,'set')&&!Object.hasOwn(GEAR_SETS,g.set))throw new Error('Trang bị trong đội không hợp lệ.');
}
export function validateForge(state){
  const f=state.forge,object=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  const fail=()=>{throw new Error('Dữ liệu xưởng trang bị không hợp lệ.');};
  if(!object(f)||f.version!==1||typeof f.kitClaimed!=='boolean'||!object(f.materials)||Object.keys(f.materials).length!==3||!Object.keys(MATERIALS).every(k=>int(f.materials[k],0,99999999))||!Array.isArray(f.items)||f.items.length>GEAR_LIMIT||!int(f.nextId,1,99999999)||!object(f.equipped))fail();
  const seen=new Set();
  for(const item of f.items){
    if(!object(item)||!/^g[1-9]\d{0,7}$/.test(item.id)||seen.has(item.id)||Number(item.id.slice(1))>=f.nextId||!Object.hasOwn(GEAR_BY_ID,item.recipe)||!int(item.level,1,5))fail();
    seen.add(item.id);
  }
  const used=new Set();
  for(const [pet,slots]of Object.entries(f.equipped)){
    if(!Object.hasOwn(BY_ID,pet)||!state.pets.some(p=>p.id===pet)||!object(slots))fail();
    for(const [slot,id]of Object.entries(slots)){
      const item=f.items.find(i=>i.id===id);
      if(!Object.hasOwn(GEAR_SLOTS,slot)||!item||GEAR_BY_ID[item.recipe].slot!==slot||used.has(id))fail();used.add(id);
    }
  }
}
