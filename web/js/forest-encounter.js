import {BY_ID,RESOURCES} from './data.js';
import {petSkill,skillActor} from './tactics.js';

// A boss warning is derived from the saved round, never from elapsed wall time.
// Reloading or suspending cannot skip it or grant another turn.
export function forestWarning(run){
  if(run?.biome!=='forest'||!run.battle?.boss||(run.battle.round+1)%3!==0)return null;
  return {id:'root-surge',name:'Rễ trồi',text:'Rễ sắp trồi dưới chân! Né để giảm 85% sát thương lượt này.',multiplier:1.65,evadeFactor:.15};
}

export function forestMotion(member,move='attack'){
  if(move==='evade')return 'evade';
  if(move==='guard')return 'guard';
  if(move==='charge')return 'charge';
  const species=BY_ID[member.id],skill=petSkill(member.id,[member],move.startsWith('awaken:'));
  if(skillActor(move)&&['heal','support','guard'].includes(skill?.role))return skill.role;
  return ['bird','dragon','jelly','whale','mushroom'].includes(species?.shape)?'ranged':'melee';
}

// Presentation consumes actual engine loot changes; it never pays a reward.
export function forestLootDelta(before={},after={}){
  return Object.fromEntries(Object.keys(RESOURCES).flatMap(k=>{
    const n=(after[k]||0)-(before[k]||0);return n>0?[[k,n]]:[];
  }));
}
