import { BY_ID } from './data.js';
import { PET_SKILLS, COMBAT_ROLES, ELEMENT_COMBOS } from './tactics-data.js';
import { resolveSkill } from './skill-paths.js';
import { GEAR_SETS } from './forge-state.js';
import { AWAKENINGS, awakenedOf } from './awakening-data.js';

const ids=members=>members.map(m=>typeof m==='string'?m:m.id);
const pct=n=>Math.round(n*100);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function petSkill(id,source,ultimate=false){return ultimate?(awakenedOf(source,id)?AWAKENINGS[id].skill:undefined):resolveSkill(id,source);}
export function skillActor(move){return typeof move==='string'&&/^(pet|awaken):/.test(move)?move.slice(move.indexOf(':')+1):null;}
export function skillDescription(id,compact=false,source,ultimate=false){
  const s=petSkill(id,source,ultimate);if(!s)return '';
  if(ultimate)return `${s.name}: ${AWAKENINGS[id].text} 3 năng lượng · Mỗi trận dùng 1 lần.`;
  const out=[];
  if(s.power)out.push(compact?`${pct(s.power)}% đòn thường`:`Gây ${pct(s.power)}% đòn thường, theo sức mạnh của thú`);
  if(s.heal)out.push(`hồi ${pct(s.heal)}% sinh lực${compact?'':' tối đa của người nhận'}`);
  if(s.ward)out.push(`tạo ${pct(s.ward)}% khiên`);
  if(s.burn)out.push(`thiêu đốt ${pct(s.burn)}% đòn thường × ${s.burnTurns} lượt tới`);
  if(s.regen)out.push(`hồi ${pct(s.regen)}% sinh lực × ${s.regenTurns} lượt tới`);
  if(s.weaken)out.push(`giảm ${pct(s.weaken)}% đòn địch trong ${s.weakenTurns} lượt`);
  if(s.boost)out.push(`tăng ${pct(s.boost)}% sát thương trong ${s.boostTurns} lượt`);
  if(s.counter)out.push(`phản ${pct(s.counter)}% đòn thường trong ${s.counterTurns} lượt`);
  if(s.gain)out.push(`nhận lại ${s.gain} năng lượng`);
  if(s.breakShield)out.push('phá hết khiên địch');
  else if(s.pierce)out.push('xuyên khiên địch');
  const text=out.join(' · ')+'.';
  return compact?text.replaceAll(' sinh lực đội',' sinh lực').replaceAll(' trong ',' / ').replaceAll(' lượt tới',' lượt'):text;
}
export function formation(members){
  const list=ids(members);const roles=new Set(list.map(id=>petSkill(id,members)?.role));
  const shelter=roles.has('heal')&&roles.has('guard');
  const tempo=roles.has('attack')&&roles.has('support');
  const opening=list.length===3&&roles.size>=3;
  return {roles:[...roles],shelter,tempo,opening,wardBonus:shelter?.2:0,damageBonus:tempo?.1:0,openingWard:opening?.06:0};
}
export function comboFor(first,second){
  if(!first||!second||first===second||!BY_ID[first]||!BY_ID[second])return null;
  const a=BY_ID[first].element,b=BY_ID[second].element;
  if(a===b)return {id:'resonance',name:'Cộng hưởng',icon:'heart',text:'Chiêu sau tăng 15% sát thương.',damage:.15};
  return ELEMENT_COMBOS.find(c=>c.elements.includes(a)&&c.elements.includes(b))||{id:'relay',name:'Tiếp sức',icon:'sparkle',text:'Chiêu sau tăng 10% sát thương.',damage:.1};
}
export function teamCombos(members){
  const list=ids(members);const found=new Map();
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
    const combo=comboFor(list[i],list[j]);if(!found.has(combo.id))found.set(combo.id,{...combo,first:list[i],second:list[j]});
  }
  return [...found.values()];
}
const status=()=>({amount:0,turns:0});
export function newTactics(members){
  return {version:1,ward:0,cooldowns:Object.fromEntries(ids(members).map(id=>[id,0])),burn:status(),regen:status(),weaken:status(),boost:status(),counter:status(),mark:null,last:''};
}
export function skillBlocked(tactics,id,focus,members,ultimate=false,units){
  if(units?.some(u=>u.id===id&&u.hp===0))return 'Đã gục trong trận này';
  const skill=petSkill(id,members,ultimate);
  if(!skill||!ids(members).includes(id))return 'Linh thú này không ở trong đội.';
  if(ultimate){if(tactics?.awakenUsed?.includes(id))return 'Đã dùng trong trận này';return focus<skill.cost?'Cần 3 năng lượng':'';}
  const cooldown=tactics?.cooldowns?.[id]||0;
  if(cooldown)return `Chờ ${cooldown} lượt`;
  if(focus<skill.cost)return `Cần ${skill.cost} năng lượng`;
  return '';
}
export function startTacticTurn(tactics){
  const out={damage:0,heal:0};
  for(const [id,key]of [['burn','damage'],['regen','heal']]){
    if(tactics[id].turns){out[key]=tactics[id].amount;if(!--tactics[id].turns)tactics[id].amount=0;}
  }
  return out;
}
export function endTacticTurn(tactics,usedId=null){
  for(const id of Object.keys(tactics.cooldowns))if(id!==usedId)tactics.cooldowns[id]=Math.max(0,tactics.cooldowns[id]-1);
  for(const id of ['weaken','boost','counter'])if(tactics[id].turns&&!--tactics[id].turns)tactics[id].amount=0;
}
function applyStatus(tactics,key,amount,turns){
  if(!amount)return;
  tactics[key]={amount:Math.max(tactics[key].amount,amount),turns:Math.max(tactics[key].turns,turns)};
}
export function grantWard(tactics,amount,maxHp,otherShield=0){
  const before=tactics.ward;tactics.ward=clamp(tactics.ward+Math.round(amount),0,Math.max(0,Math.floor(maxHp*.6)-otherShield));return tactics.ward-before;
}
export function castPetSkill(tactics,id,{members,baseDamage,maxHp,currentHp=maxHp,otherShield=0,support=1,ultimate=false,burnBonus=1}){
  const skill=petSkill(id,members,ultimate),team=formation(members),combo=comboFor(tactics.mark,id);
  const member=members.find(m=>m.id===id),average=members.reduce((n,m)=>n+m.power,0)/members.length;
  const contribution=clamp(.65+.35*(member.power/Math.max(1,average)),.65,1.35);
  const detonation=skill.detonate?tactics.burn.amount*tactics.burn.turns:0;
  if(skill.detonate)tactics.burn=status();
  const damage=Math.max(0,Math.round(baseDamage*(skill.power+(combo?skill.comboPower||0:0))*contribution*(1+team.damageBonus+(combo?.damage||0)))+detonation);
  const healBonus=(1+(member.gear?.heal||0)/100)*support,wardBonus=(1+(member.gear?.ward||0)/100)*support;
  const rescue=skill.rescue&&currentHp<=maxHp*.4?skill.rescue:0;
  const heal=Math.round(maxHp*((skill.heal||0)+(combo?.heal||0)+(combo?skill.comboHeal||0:0)+rescue)*healBonus);
  const ward=grantWard(tactics,maxHp*((skill.ward||0)+(combo?.ward||0))*(1+team.wardBonus)*wardBonus,maxHp,otherShield);
  const fireBonus=member.gear?.set==='phoenix'?1+GEAR_SETS.phoenix.burnBonus:1;
  applyStatus(tactics,'burn',Math.round(baseDamage*(skill.burn||0)*fireBonus*burnBonus),skill.burnTurns);
  applyStatus(tactics,'burn',Math.round(baseDamage*(combo?.burn||0)*fireBonus*burnBonus),combo?.burnTurns);
  applyStatus(tactics,'regen',Math.round(maxHp*(skill.regen||0)*healBonus),skill.regenTurns);
  applyStatus(tactics,'weaken',Math.round(100*(skill.weaken||0)),skill.weakenTurns);
  applyStatus(tactics,'weaken',Math.round(100*(combo?.weaken||0)),combo?.weakenTurns);
  applyStatus(tactics,'boost',Math.round(100*(skill.boost||0)),skill.boostTurns);
  applyStatus(tactics,'counter',Math.round(baseDamage*(skill.counter||0)),skill.counterTurns);
  if(ultimate)(tactics.awakenUsed||=[]).push(id);else tactics.cooldowns[id]=skill.cooldown;
  tactics.mark=id;
  return {actor:id,skill:skill.name||BY_ID[id].skill,...(ultimate?{awakenedSkill:true,detonation,cleanse:!!skill.cleanse,disrupt:!!skill.disrupt,rescue:!!rescue}:{}),offensive:skill.power>0,damage,heal,ward,cost:skill.cost,gain:skill.gain||0,pierce:!!(skill.pierce||combo?.pierce),breakShield:!!(skill.breakShield||combo?.breakShield),combo:combo?.name||null,burnApplied:tactics.burn.amount,burnTurns:tactics.burn.turns,setBurn:fireBonus>1&&!!(skill.burn||combo?.burn)};
}
// Guard sets protect the next turn: the current attack is resolved first.
export function applyGuardSet(tactics,members,result,maxHp,otherShield=0){
  if(!result.strategy?.parried||!members.some(m=>m.gear?.set==='frost'))return;
  result.setWard=grantWard(tactics,maxHp*GEAR_SETS.frost.guardWard,maxHp,otherShield);
  result.ward+=result.setWard;
}
export function setCaption(result){return `${result.setWard?` · Vĩnh Đông +${result.setWard} khiên`:''}${result.setBurn?' · Vũ Hỏa: thiêu đốt +35%':''}`;}
export function validateTactics(tactics,members,maxHp){
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
  const list=ids(members);
  const fail=()=>{throw new Error('Dữ liệu kỹ năng trong trận không hợp lệ.');};
  if(!object(tactics)||tactics.version!==1||!int(tactics.ward,Math.floor(maxHp*.6))||!object(tactics.cooldowns)||Object.keys(tactics.cooldowns).length!==list.length||!list.every(id=>Object.hasOwn(tactics.cooldowns,id)&&int(tactics.cooldowns[id],petSkill(id,members).cooldown)))fail();
  for(const key of ['burn','regen','weaken','boost','counter']){
    const s=tactics[key];if(!object(s)||!int(s.amount,['weaken','boost'].includes(key)?80:100000)||!int(s.turns,3)||(s.turns===0)!==(s.amount===0))fail();
  }
  if(tactics.mark!==null&&!list.includes(tactics.mark)||typeof tactics.last!=='string'||tactics.last.length>290)fail();
  if(Object.hasOwn(tactics,'awakenUsed')&&(!Array.isArray(tactics.awakenUsed)||new Set(tactics.awakenUsed).size!==tactics.awakenUsed.length||!tactics.awakenUsed.every(id=>list.includes(id)&&awakenedOf(members,id))))fail();
}

export { COMBAT_ROLES };
