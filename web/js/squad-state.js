import { BY_ID } from './data.js';
import { petSkill } from './tactics.js';

const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
export const living=units=>units.filter(u=>u.hp>0);
export const unitRole=(id,members)=>petSkill(id,members)?.role||'attack';
export const healthSum=units=>units.reduce((n,u)=>n+u.hp,0);
export function squadRows(members,settings={}){
  const rows=Object.fromEntries(members.map(m=>[m.id,settings[m.id]||(unitRole(m.id,members)==='guard'?'front':'back')]));
  if(!Object.values(rows).includes('front')){
    const first=members.find(m=>unitRole(m.id,members)==='attack')||members[0];if(first)rows[first.id]='front';
  }
  return rows;
}
function budgets(members,total){
  const weights=members.map(m=>unitRole(m.species||m.id,members)==='guard'?1.25:1),sum=weights.reduce((a,b)=>a+b,0);
  const values=weights.map(w=>Math.floor(total*w/sum));let left=total-values.reduce((a,b)=>a+b,0);
  for(let i=0;left>0;i=(i+1)%values.length,left--)values[i]++;
  return values;
}
export function squadUnits(members,total,hp=total,settings={}){
  const rows=squadRows(members.map(m=>({...m,id:m.species||m.id})),settings),maxima=budgets(members,total);
  const values=maxima.map(max=>Math.floor(hp*max/total));let left=hp-values.reduce((a,b)=>a+b,0);
  for(let i=0;left>0;i=(i+1)%values.length)if(values[i]<maxima[i]){values[i]++;left--;}
  return members.map((m,i)=>({id:m.id,species:m.species||m.id,row:rows[m.species||m.id],role:unitRole(m.species||m.id,members),maxHp:maxima[i],hp:values[i],ward:0,cooldown:0,cover:0}));
}
export function newSquad(members,total,hp=total,rows={}){
  return {version:1,allies:squadUnits(members,total,Math.round(hp),rows),enemies:[],effects:{burn:null,regen:null}};
}
export function startSquadFight(run,enemies,total,maxHp,rows={}){
  if(!run.squad)run.squad=newSquad(run.members,maxHp,run.hp,rows);
  run.squad.enemies=squadUnits(enemies,total);run.squad.effects={burn:null,regen:null};
  for(const u of run.squad.allies){u.ward=0;u.cover=0;u.cooldown=0;}
}
export function resizeSquad(run,maxHp){
  if(!run.squad)return;const maxima=budgets(run.members,maxHp);
  run.squad.allies.forEach((u,i)=>{u.maxHp=maxima[i];u.hp=Math.min(u.hp,u.maxHp);u.ward=Math.min(u.ward,Math.floor(u.maxHp*.6));});run.hp=healthSum(run.squad.allies);
}
export function setCombatRow(state,id,row){
  if(state.expedition||state.ruins?.run||state.boss?.run||state.tower?.run)return {error:'Kết thúc chuyến đi trước khi đổi hàng nhé.'};
  if(!state.team.includes(id)||!['front','back'].includes(row))return {error:'Vị trí đội hình không hợp lệ.'};
  const members=state.team.map(id=>state.pets.find(p=>p.id===id)),rows=squadRows(members,state.battleFormation?.rows);
  rows[id]=row;if(!Object.values(rows).includes('front'))return {error:'Cần ít nhất một thú đứng hàng trước.'};
  state.battleFormation={version:1,rows:{...(state.battleFormation?.rows||{}),...rows}};return {rows};
}
export function validateCombatFormation(state){
  if(!Object.hasOwn(state,'battleFormation'))return;const f=state.battleFormation;
  if(!object(f)||f.version!==1||Object.keys(f).length!==2||!object(f.rows)||Object.entries(f.rows).some(([id,row])=>!state.pets.some(p=>p.id===id)||!['front','back'].includes(row)))throw new Error('Hàng trước và hàng sau không hợp lệ.');
}
export function validateSquad(run,{maxHp,enemyMax=0,enemies=[],active=false}={}){
  if(!Object.hasOwn(run,'squad'))return;
  const s=run.squad,fail=()=>{throw new Error('Sinh lực hoặc đội hình từng linh thú không hợp lệ.');};
  if(!object(s)||Object.keys(s).length!==4||s.version!==1||!Array.isArray(s.allies)||!Array.isArray(s.enemies)||!object(s.effects)||Object.keys(s.effects).length!==2)fail();
  function units(list,members,total){
    if(list.length!==members.length||new Set(list.map(u=>u?.id)).size!==list.length)fail();
    const maxima=members.length?budgets(members,total):[];
    list.forEach((u,i)=>{
      const m=members[i];if(!object(u)||Object.keys(u).length!==9||u.id!==m.id||u.species!==(m.species||m.id)||!Object.hasOwn(BY_ID,u.species)||u.role!==unitRole(u.species,members)||!['front','back'].includes(u.row)||u.maxHp!==maxima[i]||!integer(u.hp,0,u.maxHp)||!integer(u.ward,0,Math.floor(u.maxHp*.6))||!integer(u.cooldown,0,3)||!integer(u.cover,0,2)||u.hp===0&&(u.ward||u.cover))fail();
    });
    if(list.length&&!list.some(u=>u.row==='front'))fail();
  }
  units(s.allies,run.members,maxHp);units(s.enemies,active?enemies:[],enemyMax);
  if(healthSum(s.allies)!==run.hp)fail();
  if(active&&healthSum(s.enemies)!==(Object.hasOwn(run,'enemyHp')?run.enemyHp:run.battle.hp))fail();
  for(const [key,list]of [['burn',s.enemies],['regen',s.allies]])if(s.effects[key]!==null&&!list.some(u=>u.id===s.effects[key]))fail();
}
