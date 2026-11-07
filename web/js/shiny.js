import {SHINY_SPECIES,SHINY_VARIANTS,SHINY_RATE,SHINY_PITY_MAX} from './data.js';
import {makePet,grant} from './engine.js';

export const SHINY_FRAGMENT_COST=30;
export const SHINY_ENCOUNTER_RATE=.04;
export const newShiny=()=>({version:1,pity:0,fragments:0,claimed:[],profile:false});
export const shinyCount=state=>state.pets.filter(p=>p.shiny===true).length;
export function shinyOf(source,id){
  const p=Array.isArray(source)?source.find(m=>m.id===id):source?.pets?.find(p=>p.id===id)||((source?.id===id||source?.species===id)?source:null);
  return !!p?.shiny&&!p.shinyOff;
}
export function validateShinyMember(p){
  if(Object.hasOwn(p,'shiny')&&(typeof p.shiny!=='boolean'||p.shiny&&!Object.hasOwn(SHINY_VARIANTS,p.id)))throw new Error('Biến thể Shiny không hợp lệ.');
  if(Object.hasOwn(p,'shinyOff')&&(typeof p.shinyOff!=='boolean'||!p.shiny))throw new Error('Diện mạo Shiny không hợp lệ.');
}
export function validateShiny(state){
  if(!Object.hasOwn(state,'shiny'))state.shiny=newShiny();
  const s=state.shiny,int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
  const fail=()=>{throw new Error('Sổ Hào Quang không hợp lệ.');};
  if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length!==5||s.version!==1||!int(s.pity,0,SHINY_PITY_MAX-1)||!int(s.fragments,0,99999999)||!Array.isArray(s.claimed)||new Set(s.claimed).size!==s.claimed.length||!s.claimed.every(n=>[1,3,6].includes(n)&&shinyCount(state)>=n)||typeof s.profile!=='boolean'||s.profile&&!s.claimed.includes(3))fail();
  state.pets.forEach(validateShinyMember);
  for(const run of [state.expedition,state.boss?.run,state.ruins?.run,state.tower?.run])for(const m of run?.members||[])validateShinyMember(m);
  for(const m of Object.values(state.dojo?.lastResult?.actors||{}))validateShinyMember(m);
}
const sample=rng=>{const n=rng();return Number.isFinite(n)?Math.max(0,Math.min(.999999999,n)):.5;};
export function addShinyFragments(state,amount){const s=state.shiny,before=s.fragments;s.fragments=Math.min(99999999,before+Math.max(0,Math.floor(amount)));return s.fragments-before;}
function award(state,id,source,now){
  let pet=state.pets.find(p=>p.id===id);const isNew=!pet;
  if(!pet){pet=makePet(id,now);state.pets.push(pet);}
  if(pet.shiny)return {species:id,shiny:true,shinyNew:false,isNew:false,fragments:addShinyFragments(state,10),source};
  pet.shiny=true;delete pet.shinyOff;
  state.history.unshift({type:'shiny',time:now,text:`Đón ${SHINY_VARIANTS[id].name} · ${source==='egg'?'Trứng Hào Quang':source==='explore'?'Bạn đồng hành trên đường':'Ghép mảnh Hào Quang'}`});state.history=state.history.slice(0,40);
  return {species:id,shiny:true,shinyNew:true,isNew,source};
}
function randomAward(state,rng,source,now){
  const missing=SHINY_SPECIES.filter(s=>!state.pets.find(p=>p.id===s.id)?.shiny),pool=missing.length?missing:SHINY_SPECIES;
  return award(state,pool[Math.floor(sample(rng)*pool.length)].id,source,now);
}
// The bonus draw never replaces a normal egg. It has its own pity counter.
export function rollShinyEgg(state,rng=Math.random,now=Date.now()){
  const s=state.shiny;s.pity++;
  if(sample(rng)>=SHINY_RATE&&s.pity<SHINY_PITY_MAX)return null;
  s.pity=0;return randomAward(state,rng,'egg',now);
}
export function shinyExplorationReward(state,rng=Math.random,now=Date.now()){
  const fragments=addShinyFragments(state,1);
  return {fragments,encounter:sample(rng)<SHINY_ENCOUNTER_RATE?randomAward(state,rng,'explore',now):null};
}
export function craftShiny(state,id,now=Date.now()){
  if(!Object.hasOwn(SHINY_VARIANTS,id))return {error:'Biến thể này chưa có trong sổ Hào Quang.'};
  if(state.pets.find(p=>p.id===id)?.shiny)return {error:'Bạn đã mở biến thể này. Hãy chọn một bạn khác nhé.'};
  if(state.shiny.fragments<SHINY_FRAGMENT_COST)return {error:'Cần 30 mảnh Hào Quang. Thắng khám phá, thủ vệ hoặc boss tháp để kiếm thêm.'};
  state.shiny.fragments-=SHINY_FRAGMENT_COST;return award(state,id,'craft',now);
}
export function setShinyAppearance(state,id,enabled){
  const p=state.pets.find(p=>p.id===id);
  if(!p?.shiny||typeof enabled!=='boolean')return {error:'Chưa mở diện mạo Shiny này.'};
  if(state.expedition||state.boss?.run||state.ruins?.run||state.tower?.run||state.dojo?.run)return {error:'Kết thúc chuyến đi trước khi đổi diện mạo nhé.'};
  if(enabled)delete p.shinyOff;else p.shinyOff=true;return {enabled};
}
export function claimShinyMilestone(state,count){
  if(![1,3,6].includes(count)||shinyCount(state)<count||state.shiny.claimed.includes(count))return {error:'Mốc Hào Quang chưa hoàn thành hoặc đã nhận.'};
  state.shiny.claimed.push(count);const reward=count===6?{tickets:6,crystals:100}:count===3?{tickets:3}:{tickets:1};grant(state,reward);return {count,reward};
}
export function setShinyProfile(state,enabled){
  if(typeof enabled!=='boolean'||!state.shiny.claimed.includes(3))return {error:'Nhận mốc 3 Shiny để mở nền hồ sơ.'};
  state.shiny.profile=enabled;return {enabled};
}
export function exchangeShinyFragments(state){
  if(state.shiny.fragments<10)return {error:'Cần 10 mảnh Hào Quang để đổi 2 vé ấp.'};
  state.shiny.fragments-=10;grant(state,{tickets:2});return {reward:{tickets:2}};
}
