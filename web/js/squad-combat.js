import { BY_ID } from './data.js';
import { petSkill,castPetSkill,skillActor,comboFor } from './tactics.js';
import { living,healthSum,resizeSquad } from './squad-state.js';
import { ROLE_TRAITS } from './role-traits.js';
import {reefPatrol} from './reef-encounter.js';
import {volcanoPatrol} from './volcano-encounter.js';

export const squadMembers=run=>run.squad?run.members.filter(m=>run.squad.allies.some(u=>u.id===m.id&&u.hp>0)):run.members;
const weakest=units=>living(units).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.hp-b.hp)[0];
const front=units=>living(units).filter(u=>u.row==='front');
const enemyValue=(run,b)=>Object.hasOwn(run,'enemyHp')?run.enemyHp:b.hp;
const setEnemyValue=(run,b,hp)=>{if(Object.hasOwn(run,'enemyHp'))run.enemyHp=hp;else b.hp=hp;};
const event=(result,e)=>{if(result)(result.unitEvents||=[]).push(e);};
export function syncSquad(run,b){if(!run.squad)return;run.hp=healthSum(run.squad.allies);setEnemyValue(run,b,healthSum(run.squad.enemies));}
export function healSquad(run,amount,{target,result,actor,revive=false,maxHp,strict=false}={}){
  if(!run.squad){const before=run.hp;run.hp=Math.min(maxHp,run.hp+Math.max(0,Math.round(amount)));return run.hp-before;}
  if(maxHp)resizeSquad(run,maxHp);let left=Math.max(0,Math.round(amount)),healed=0;
  if(strict&&target&&!run.squad.allies.some(u=>u.id===target&&u.hp))return 0;
  if(revive)for(const u of run.squad.allies)if(!u.hp&&left){const n=Math.min(left,Math.max(1,Math.ceil(u.maxHp*.25)));u.hp=n;left-=n;healed+=n;event(result,{side:'ally',kind:'revive',target:u.id,amount:n});}
  const selected=run.squad.allies.find(u=>u.id===target&&u.hp>0),list=selected?[selected]:living(run.squad.allies).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
  for(const u of list){const n=Math.min(left,u.maxHp-u.hp);if(n){u.hp+=n;left-=n;healed+=n;event(result,{side:'ally',kind:'heal',...(actor?{actor}:{}),target:u.id,amount:n});}}
  run.hp=healthSum(run.squad.allies);return healed;
}
export function healSquadSkill(run,amount,options={}){
  const healed=healSquad(run,amount,options),{actor,target,result,ultimate}=options;
  if(!run.squad||!actor||petSkill(actor,run.members,ultimate)?.role!=='heal')return healed;
  const recipient=living(run.squad.allies).find(u=>u.id===target);if(!recipient)return healed;
  const ward=Math.max(0,Math.min(Math.floor((Math.max(0,Math.round(amount))-healed)*ROLE_TRAITS.heal.conversion),Math.floor(recipient.maxHp*.6)-recipient.ward));
  if(ward){recipient.ward+=ward;if(result){result.overhealWard=ward;result.ward=(result.ward||0)+ward;}event(result,{side:'ally',kind:'ward',actor,target:recipient.id,amount:ward,origin:'overheal'});}
  return healed;
}
export function healSquadEnemies(run,b,amount,result,target){
  if(!run.squad){const before=enemyValue(run,b);setEnemyValue(run,b,before+amount);return amount;}
  const u=living(run.squad.enemies).find(u=>u.id===target)||weakest(run.squad.enemies);if(!u)return 0;
  const n=Math.min(Math.max(0,Math.round(amount)),u.maxHp-u.hp);u.hp+=n;syncSquad(run,b);if(n)event(result,{side:'enemy',kind:'heal',target:u.id,amount:n});return n;
}
const taunter=units=>front(units).find(u=>u.role==='guard'&&u.cover>0);
function hit(units,target,amount,{pierce=false,flank=false,area=false,dot=false,result,side,actor,protection,finisher=false}={}){
  let u=living(units).find(u=>u.id===target)||front(units)[0]||living(units)[0];if(!u)return 0;
  if(!pierce&&!flank&&!area&&!dot){
    const protector=taunter(units);
    if(protector&&protector!==u){event(result,{side,kind:'cover',actor:protector.id,target:u.id,amount:0});u=protector;amount*=.85;}
    else if(u.row==='back'&&front(units).length)amount*=.7;
  }
  if(finisher&&u.hp<=u.maxHp*ROLE_TRAITS.attack.threshold){amount*=1+ROLE_TRAITS.attack.bonus;if(result)result.finisher=true;event(result,{side,kind:'finisher',actor,target:u.id,amount:30});}
  let raw=Math.max(0,Math.round(amount));if(!pierce&&!area&&!dot&&u.row==='front')raw=Math.round(raw*.9);
  // Shared wards only pay for attacks that actually happen, after row protection.
  let absorbed=0;
  if(protection){for(const [owner,key]of protection){const n=Math.min(owner[key],raw);owner[key]-=n;raw-=n;absorbed+=n;}}
  const personal=pierce||dot?0:Math.min(u.ward,raw);u.ward-=personal;absorbed+=personal;const damage=Math.min(u.hp,raw-personal);u.hp-=damage;
  event(result,{side,kind:'damage',actor,target:u.id,amount:damage,absorbed});
  if(!u.hp){u.ward=0;u.cover=0;event(result,{side,kind:'down',target:u.id,amount:0});}
  return damage;
}
export function squadDamageScale(run){if(!run.squad)return 1;const total=run.members.reduce((n,m)=>n+m.power,0);return squadMembers(run).reduce((n,m)=>n+m.power,0)/Math.max(1,total);}
export function hitSquadEnemies(run,b,amount,{order={},actor,result,tick=false,reflected=false,pierce=false}={}){
  if(!run.squad){setEnemyValue(run,b,Math.max(0,enemyValue(run,b)-amount));return amount;}
  if(amount<=0)return 0;
  const s=run.squad;let dealt=0;
  if(tick){const target=s.enemies.find(u=>u.id===s.effects.burn&&u.hp>0);if(target)dealt=hit(s.enemies,target.id,amount,{dot:true,side:'enemy',result});}
  else if(reflected)dealt=hit(s.enemies,order.foe,amount,{dot:true,side:'enemy',result});
  else{
    const members=squadMembers(run),actors=actor?members.filter(m=>m.id===actor):members,area=order.move==='skill';
    const total=actors.reduce((n,m)=>n+m.power,0);if(result)result.actors=actors.map(m=>m.id);
    if(area){
      const targets=living(s.enemies);for(const [i,u]of targets.entries())dealt+=hit(s.enemies,u.id,amount/targets.length,{area:true,pierce,side:'enemy',result,actor:actors[i%actors.length]?.id});
    }else for(const m of actors)dealt+=hit(s.enemies,order.foe,amount*m.power/Math.max(1,total),{pierce,side:'enemy',result,actor:m.id,finisher:!!actor&&order.target!=='core'&&petSkill(actor,run.members,order.move?.startsWith('awaken:'))?.role==='attack'});
  }
  if(actor&&result?.appliesBurn){const landed=[...(result.unitEvents||[])].reverse().find(e=>e.side==='enemy'&&e.kind==='damage'&&e.actor===actor);if(landed)s.effects.burn=landed.target;}
  syncSquad(run,b);return dealt;
}
export function castSquadSkill(run,tactics,id,options,order,result){
  if(!run.squad)return castPetSkill(tactics,id,options);
  const s=run.squad,skill=petSkill(id,run.members,options.ultimate),friends=living(s.allies).filter(u=>u.id!==id);
  const waiting=skill.role==='support'?friends.filter(u=>tactics.cooldowns[u.id]>0).sort((a,b)=>tactics.cooldowns[b.id]-tactics.cooldowns[a.id]||a.hp/a.maxHp-b.hp/b.maxHp)[0]:null;
  const target=living(s.allies).find(u=>u.id===order.ally)||waiting||weakest(skill.role==='support'&&friends.length?friends:s.allies);
  const member=run.members.find(m=>m.id===id),total=run.members.reduce((n,m)=>n+m.power,0),beforeWard=tactics.ward,combo=comboFor(tactics.mark,id);
  tactics.ward=0;
  const cast=castPetSkill(tactics,id,{...options,baseDamage:options.baseDamage*member.power/Math.max(1,total)*1.7,maxHp:target.maxHp,currentHp:target.hp,otherShield:0});
  tactics.ward=beforeWard;
  if(cast.ward){const n=Math.min(cast.ward,Math.floor(target.maxHp*.6)-target.ward);target.ward+=n;cast.ward=n;event(result,{side:'ally',kind:'ward',actor:id,target:target.id,amount:n});}
  if(skill.role==='guard'){const self=s.allies.find(u=>u.id===id);if(self.row==='front'){self.cover=2;cast.taunted=true;event(result,{side:'ally',kind:'taunt',actor:id,target:id,amount:2});}}
  if(skill.role==='support'&&target.id!==id&&tactics.cooldowns[target.id]>0){tactics.cooldowns[target.id]--;cast.haste=1;cast.hasteTarget=target.id;event(result,{side:'ally',kind:'haste',actor:id,target:target.id,amount:1});}
  if(skill.burn||combo?.burn)s.effects.burn=order.foe||front(s.enemies)[0]?.id||living(s.enemies)[0]?.id||null;
  if(skill.regen)s.effects.regen=target.id;
  cast.allyTarget=target.id;cast.appliesBurn=!!(skill.burn||combo?.burn);return cast;
}
export function enemySquadPlans(squad,round=0,reef=false,volcano=false){
  if(!squad)return [];
  return living(squad.enemies).map(u=>{
    const ally=weakest(squad.enemies),victim=weakest(squad.allies),first=front(squad.allies)[0]||victim;
    if(volcano&&u.id==='enemy-0'&&!u.cooldown)return {actor:u.id,kind:'guard',target:ally?.id||u.id,name:'Giáp đá · che đồng đội'};
    if(volcano&&u.id==='enemy-1'){
      const rear=weakest(squad.allies.filter(v=>v.row==='back'))||victim;
      return {actor:u.id,kind:!u.cooldown?'skill':'attack',target:rear?.id,flank:true,name:'Săn hàng sau · vượt Khiêu khích'};
    }
    if(volcano&&u.id==='enemy-2')return {actor:u.id,kind:round%3===0?'charge':round%3===1?'skill':'attack',target:first?.id,area:round%3===1,name:round%3===0?'Gom tàn lửa · chưa tấn công':round%3===1?'Mưa tro · đánh lan':'Cánh lửa · đánh đơn'};
    if(reef&&u.id==='enemy-1')return {actor:u.id,kind:round%3===0?'charge':round%3===1?'skill':'attack',target:first?.id,area:round%3===1,name:round%3===0?'Tích điện · chưa tấn công':round%3===1?'Phóng điện · đánh lan':'Tia điện · đánh đơn'};
    if(reef&&u.id==='enemy-0'&&!u.cooldown&&round%3===0)return {actor:u.id,kind:'guard',target:u.id,name:'Khép càng · dựng khiên'};
    if(!u.cooldown&&u.role==='heal'&&ally&&ally.hp/ally.maxHp<.7)return {actor:u.id,kind:'heal',target:ally.id,name:'Hồi phục đồng đội'};
    if(!u.cooldown&&u.role==='guard'&&ally&&ally.hp/ally.maxHp<.65)return {actor:u.id,kind:'guard',target:ally.id,name:'Che chắn đồng đội'};
    const skill=!u.cooldown&&round%3===2;
    const bait=(!skill||!petSkill(u.species)?.pierce)&&taunter(squad.allies);
    const intended=skill&&victim?victim.id:first?.id;
    return {actor:u.id,kind:skill?'skill':'attack',target:bait?.id||intended,...(bait?{intended}:{}),name:bait?'Bị Khiêu khích':skill?'Tung chiêu':'Tấn công hàng trước'};
  });
}
export function receiveSquadDamage(run,b,amount,{order={},result,intent,skip=false,area=false}={}){
  if(run.campaign&&b.campaignPhase===2)amount=Math.round(amount*1.15);
  if(!run.squad){run.hp=Math.max(0,run.hp-amount);return amount;}
  const s=run.squad,plans=skip?[]:enemySquadPlans(s,(b.round??b.turn??run.turn)-1,reefPatrol(run),volcanoPatrol(run)),total=s.enemies.reduce((n,u)=>n+u.maxHp,0),start=(result.unitEvents||[]).length;let incoming=0;result.enemyAttacked=false;
  const tactics=b.tactics||run.tactics,protection=[[tactics,'ward'],...(Object.hasOwn(run,'shield')&&run!==b?[[run,'shield']]:[])];
  if(s.enemies.length===1)for(const plan of plans)plan.kind='attack';
  for(const plan of plans){
    const u=s.enemies.find(u=>u.id===plan.actor);if(!u.hp)continue;
    if(plan.kind==='charge'){
      event(result,{side:'enemy',kind:'charge',actor:u.id,target:u.id,amount:0});
    }else if(plan.kind==='heal'){
      const target=s.enemies.find(v=>v.id===plan.target&&v.hp>0)||weakest(s.enemies),healed=healSquadEnemies(run,b,Math.round(target.maxHp*.3),null,target.id);
      u.cooldown=3;if(healed){result.enemyHeal=(result.enemyHeal||0)+healed;event(result,{side:'enemy',kind:'heal',actor:u.id,target:target.id,amount:healed});}
    }else if(plan.kind==='guard'){
      const target=s.enemies.find(v=>v.id===plan.target&&v.hp>0)||u,n=Math.min(Math.round(target.maxHp*.3),Math.floor(target.maxHp*.6)-target.ward);target.ward+=n;u.cover=2;u.cooldown=3;event(result,{side:'enemy',kind:'ward',actor:u.id,target:target.id,amount:n});
    }else{
      result.enemyAttacked=true;
      const skill=plan.kind==='skill',damage=amount*u.maxHp/Math.max(1,total)*(skill?1.4:1);
      if(area||plan.area){const targets=living(s.allies);for(const target of targets)incoming+=hit(s.allies,target.id,damage/targets.length,{result,side:'ally',actor:u.id,area:true,protection});}
      else incoming+=hit(s.allies,plan.intended||plan.target,damage,{result,side:'ally',actor:u.id,flank:plan.flank,pierce:skill&&petSkill(u.species)?.pierce,protection});
      if(skill)u.cooldown=3;
    }
  }
  result.absorbed=(result.absorbed||0)+(result.unitEvents||[]).slice(start).reduce((n,e)=>n+(e.side==='ally'?e.absorbed||0:0),0);
  for(const u of [...s.allies,...s.enemies]){u.cooldown=Math.max(0,u.cooldown-1);u.cover=Math.max(0,u.cover-1);}
  syncSquad(run,b);return incoming;
}
export function receiveTerrainDamage(run,b,amount,result){
  if(!run.squad){const damage=Math.min(run.hp,amount);run.hp-=damage;return damage;}
  const targets=living(run.squad.allies),start=(result.unitEvents||[]).length;let damage=0;
  for(const [i,u]of targets.entries())damage+=hit(run.squad.allies,u.id,Math.floor(amount/targets.length)+(i<amount%targets.length?1:0),{area:true,side:'ally',result});
  result.absorbed+=(result.unitEvents||[]).slice(start).reduce((n,e)=>n+(e.absorbed||0),0);syncSquad(run,b);return damage;
}
export function squadCanAttack(run,b){return !run.squad||run.squad.enemies.length===1||enemySquadPlans(run.squad,(b.round??b.turn??run.turn)-1,reefPatrol(run),volcanoPatrol(run)).some(p=>['attack','skill'].includes(p.kind));}
export function endSquadBattle(run){
  if(!run.squad)return;const revived=[];
  for(const u of run.squad.allies){if(!u.hp){u.hp=Math.max(1,Math.ceil(u.maxHp*.25));revived.push(u.id);}u.cover=0;u.ward=0;u.cooldown=0;}
  run.hp=healthSum(run.squad.allies);run.squad.enemies=[];run.squad.effects={burn:null,regen:null};return revived;
}
export function squadHealthCost(run,amount){
  if(!run.squad){run.hp-=amount;return;}
  const total=run.hp,units=living(run.squad.allies),cost=Math.min(total,Math.max(0,Math.round(amount)));let left=cost;
  for(const u of units){const n=Math.min(u.hp,Math.floor(cost*u.hp/total));u.hp-=n;left-=n;}
  for(const u of units){const n=Math.min(left,u.hp);u.hp-=n;left-=n;if(!u.hp){u.ward=0;u.cover=0;}}
  run.hp=healthSum(run.squad.allies);
}
export function restoreSquadEnemy(run,b,hp){if(!run.squad)return;const unit=run.squad.enemies[0];unit.hp=hp;unit.ward=0;unit.cover=0;syncSquad(run,b);}
export function squadCaption(result){
  const units=[...(result.squadAfter?.allies||[]),...(result.squadAfter?.enemies||[])],display=id=>BY_ID[units.find(u=>u.id===id)?.species||id]?.name||'Linh thú';
  const events=result.unitEvents||[],downs=events.filter(e=>e.kind==='down').map(e=>`${display(e.target)} đã gục`),heals=events.filter(e=>e.side==='enemy'&&e.kind==='heal'&&e.actor).map(e=>`${display(e.actor)} hồi ${e.amount}`);
  const traits=[result.finisher?'Săn mồi +30%':'',result.taunted?'Khiêu khích · 2 lượt':'',result.overhealWard?`Dưỡng hộ +${result.overhealWard} khiên`:'',result.haste?`Tiếp sức · ${display(result.hasteTarget)} giảm 1 lượt chờ`:''].filter(Boolean);
  return [...traits,...downs,...heals].join(' · ');
}
