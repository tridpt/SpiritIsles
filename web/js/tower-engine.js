import {addShinyFragments} from './shiny.js';
import { BY_ID } from './data.js';
import { combatMembers, pay, grant, addXP } from './engine.js';
import { newTactics, formation, skillBlocked, startTacticTurn, endTacticTurn, skillActor, applyGuardSet, setCaption } from './tactics.js';
import { newRhythm, rhythmCaption, RHYTHM_GRADES } from './combat-rhythm.js';
import { newStrategy, readOrder, beginOrder, orderRhythm, finishOrder, orderCaption } from './combat-orders.js';
import { newEnemyAI, enemyResponse, enemyCaption } from './enemy-tactics.js';
import { TOWER_ENTRY, TOWER_UNLOCK, TOWER_MAX_FLOOR, TOWER_BLESSINGS, TOWER_BLESSING_BY_ID, TOWER_MILESTONES, towerMaxHp, towerPower, towerEncounter, towerIntent, towerBlessingAvailable, towerEnemies, towerSeason, towerOmen, towerPaths } from './tower-data.js';
import { newSquad, startSquadFight } from './squad-state.js';
import { healSquad, healSquadSkill, hitSquadEnemies, receiveSquadDamage, castSquadSkill, squadDamageScale, squadMembers, endSquadBattle } from './squad-combat.js';
import { recordCombatTurn, retireCombatReport } from './combat-report.js';

const cap=n=>Math.max(0,Math.min(99999999,Math.floor(n)));
const rank=(run,id)=>run.blessings[id]||0;
function random(run){let n=run.rng>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;run.rng=n>>>0;return (run.rng>>>0)/0x100000000;}
function log(run,text){run.log.unshift(text);run.log=run.log.slice(0,6);}
function heal(run,amount,options={}){return healSquad(run,amount,{maxHp:towerMaxHp(run),...options});}
function addShield(run,amount){const max=Math.floor(towerMaxHp(run)*.6)-(run.battle?.tactics?.ward||0);const before=run.shield;run.shield=Math.min(max,run.shield+Math.max(0,Math.round(amount)));return run.shield-before;}
function treasureTrap(run){
  // A room trap leaves each companion alive; it must not trigger the recovery
  // reserved for pets who fall in a battle.
  let left=Math.min(8,run.squad.allies.reduce((sum,u)=>sum+Math.max(0,u.hp-1),0)),cost=left;
  for(const u of [...run.squad.allies].sort((a,b)=>b.hp-a.hp)){const n=Math.min(left,Math.max(0,u.hp-1));u.hp-=n;left-=n;}
  run.hp-=cost;return cost;
}
function draw(run,pool,count){const a=[...pool],out=[];while(out.length<count&&a.length)out.push(a.splice(Math.floor(random(run)*a.length),1)[0]);return out;}
function prepareFloor(run){
  run.phase='path';run.path=null;run.battle=null;run.offers=[];
  run.paths=towerPaths(run);
}
function offerBlessings(run){
  const pool=TOWER_BLESSINGS.filter(b=>towerBlessingAvailable(b,run));
  return draw(run,pool,Math.min(3,pool.length)).map(b=>b.id);
}
function rewardFor(run){
  const boss=run.floor%5===0,elite=run.path==='elite',peace=['blessing','rest','treasure'].includes(run.path);
  const dust=Math.max(2,Math.round((peace?4:7+run.floor*(boss?1.5:.65))*(elite?1.7:1)*(1+rank(run,'fortune')*.18)));
  const reward=peace?{gold:12+run.floor,food:2}:{gold:boss?90+run.floor*7:28+run.floor*4,food:boss?7:2,...(boss?{essence:2+Math.floor(run.floor/10)}:{}),...(elite?{crystals:12}:{})};
  return {dust,reward};
}
function finishRun(state,status,now=Date.now()){
  const t=state.tower,run=t.run;if(!run)return {error:'Không có chuyến leo tháp.'};
  const result={status,season:run.season,floor:Math.min(TOWER_MAX_FLOOR,run.floor),cleared:run.cleared,dust:run.dustEarned,loot:{...run.loot},blessings:{...run.blessings},curse:run.curse,time:now};
  t.lastResult=result;t.run=null;
  state.history.unshift({type:'tower',time:now,text:`${status==='victory'?'Chạm đỉnh Tháp Vô Tận':status==='defeat'?'Nghỉ lại dưới chân tháp':'Rời Tháp Vô Tận'} · ${run.cleared} tầng · ${run.dustEarned} bụi tháp`});state.history=state.history.slice(0,40);
  return {finished:true,result};
}
function bankFloor(state,{offerBlessing=true,now=Date.now()}={}){
  const t=state.tower,run=t.run,info=rewardFor(run);endSquadBattle(run);
  const shinyFragments=run.floor%5===0?addShinyFragments(state,2+Math.floor(run.floor/10)):0;
  grant(state,info.reward);t.dust=cap(t.dust+info.dust);t.best=Math.max(t.best,run.floor);run.dustEarned=cap(run.dustEarned+info.dust);run.cleared++;
  for(const [k,v]of Object.entries(info.reward))run.loot[k]=cap((run.loot[k]||0)+v);
  if(run.season===t.season)t.weeklyBest=Math.max(t.weeklyBest,run.floor);
  if(run.floor%5===0){t.bosses=cap(t.bosses+1);run.focus=Math.min(3,run.focus+1);heal(run,towerMaxHp(run)*(towerOmen(run.season).id==='storm'?.2:.16));for(const m of run.members){const p=state.pets.find(p=>p.id===m.id);if(p)p.bond=Math.min(100,p.bond+1);}}
  addXP(state,run.floor%5===0?22:9);log(run,`Vượt tầng ${run.floor} · +${info.dust} bụi tháp${run.floor%5===0?' · thủ vệ đã gục':''}.`);
  if(run.floor>=TOWER_MAX_FLOOR)return {...finishRun(state,'victory',now),dust:info.dust,reward:info.reward,shinyFragments};
  run.battle=null;
  if(offerBlessing){run.phase='blessing';run.offers=offerBlessings(run);if(!run.offers.length){run.floor++;prepareFloor(run);return {won:true,autoAdvance:true,dust:info.dust,reward:info.reward,shinyFragments};}return {won:true,dust:info.dust,reward:info.reward,shinyFragments,offers:run.offers};}
  run.floor++;prepareFloor(run);return {cleared:true,dust:info.dust,reward:info.reward,shinyFragments};
}

export function towerPreview(state){
  const members=combatMembers(state),run={members,relics:{},blessings:{}};
  return {members,power:towerPower(run),maxHp:towerMaxHp(run),potions:2};
}
export function startTower(state,startFloor=1,rng=Math.random,now=Date.now()){
  const t=state.tower;
  if(t.run)return {error:'Đội đang ở trong Tháp Vô Tận. Tiếp tục chuyến leo hoặc rời tháp trước nhé.'};
  if(state.expedition||state.ruins?.run||state.boss?.run)return {error:'Kết thúc hoạt động hiện tại trước khi vào Tháp Vô Tận nhé.'};
  if(state.dojo?.run)return {error:'Kết thúc buổi luyện tập trước khi leo tháp nhé.'};
  if(state.level<TOWER_UNLOCK)return {error:`Tháp Vô Tận mở ở cấp đảo ${TOWER_UNLOCK}.`};
  if(startFloor!==1)return {error:'Mỗi tuần hãy bắt đầu lại từ chân tháp để thử một lối xây đội mới.'};
  if(!state.team.length)return {error:'Hãy chọn ít nhất một linh thú đồng hành.'};
  if(!pay(state,TOWER_ENTRY))return {error:'Cần 10 quả mọng làm hành trang cho cả đội.'};
  refreshTower(state,now);const sample=rng(),seed=1+Math.floor((Number.isFinite(sample)?Math.max(0,Math.min(.999999999,sample)):.5)*0xfffffffe);
  const preview=towerPreview(state),run={version:1,season:t.season,seed,rng:seed,floor:1,phase:'path',members:preview.members,hp:preview.maxHp,shield:0,focus:0,potions:preview.potions,paths:[],path:null,offers:[],blessings:{},battle:null,cleared:0,curse:0,dustEarned:0,loot:{},started:now,log:['Cánh cửa Tháp Vô Tận mở ra. Mỗi tầng là một cách thử đội hình khác nhau.'],squad:null};
  run.squad=newSquad(run.members,preview.maxHp,preview.maxHp,state.battleFormation?.rows);prepareFloor(run);t.run=run;t.runs=cap(t.runs+1);t.lastResult=null;return {run,cost:TOWER_ENTRY};
}

export function chooseTowerPath(state,id,now=Date.now()){
  const run=state.tower.run;if(!run||run.phase!=='path'||!run.paths.includes(id))return {error:'Lối đi này không còn ở trước mặt bạn.'};
  run.path=id;run.paths=[];
  if(id==='blessing')return {...bankFloor(state,{now}),blessingRoom:true};
  if(id==='rest'){const amount=heal(run,towerMaxHp(run)*.28);run.focus=Math.min(3,run.focus+1);return {...bankFloor(state,{offerBlessing:false,now}),heal:amount};}
  if(id==='treasure'){const found={gold:35+run.floor*5,crystals:8};grant(state,found);for(const[k,v]of Object.entries(found))run.loot[k]=cap((run.loot[k]||0)+v);const cost=treasureTrap(run);log(run,`Mở rương phong ấn · +${found.gold} vàng, +8 ngọc · mất ${cost} sinh lực.`);return {...bankFloor(state,{offerBlessing:false,now}),treasure:found};}
  if(id==='elite')run.curse=Math.min(3,run.curse+1);
  const encounter=towerEncounter(run,id),max=towerMaxHp(run),tactics=newTactics(run.members);tactics.ward=Math.min(Math.round(max*formation(run.members).openingWard),Math.floor(max*.6)-run.shield);run.focus=Math.max(run.focus,rank(run,'spark'));run.battle={hp:encounter.maxHp,shield:(id==='elite'?22:0)+towerOmen(run.season).shield,turn:0,tactics,rhythm:newRhythm(),strategy:newStrategy(),enemyAI:newEnemyAI(encounter.kind)};run.phase='battle';startSquadFight(run,towerEnemies(run,encounter),encounter.maxHp,max,state.battleFormation?.rows);log(run,`Gặp ${encounter.name}${encounter.boss?' · Thủ vệ':''}.`);return {battle:run.battle,encounter};
}

export function chooseTowerBlessing(state,id){
  const run=state.tower.run,b=TOWER_BLESSING_BY_ID[id];
  if(!run||run.phase!=='blessing'||!run.offers.includes(id)||!b||!towerBlessingAvailable(b,run))return {error:'Phước lành này không còn khả dụng.'};
  run.blessings[id]=(run.blessings[id]||0)+1;run.offers=[];if(id==='vitality')heal(run,13);log(run,`Nhận ${b.name} · bậc ${run.blessings[id]}.`);run.floor++;prepareFloor(run);return {blessing:b};
}
export function useTowerPotion(state){const run=state.tower.run;if(!run||!['path','battle'].includes(run.phase)||run.potions<=0)return {error:'Không còn bình sương.'};if(run.hp>=towerMaxHp(run))return {error:'Cả đội đang đầy sinh lực.'};run.potions--;const amount=heal(run,towerMaxHp(run)*.35);log(run,`Dùng bình sương · hồi ${amount} sinh lực.`);return {heal:amount};}
export function retreatTower(state,now=Date.now()){const r=finishRun(state,'retreat',now);if(!r.error)retireCombatReport(state,'tower');return r;}
export function towerBattleTurn(state,action,now=Date.now(),grade='auto'){
  return recordCombatTurn(state,'tower',action,()=>towerBattleTurnCore(state,action,now,grade));
}
function towerBattleTurnCore(state,action,now=Date.now(),grade='auto'){
  const run=state.tower.run,b=run?.battle;if(!run||run.phase!=='battle'||!b)return {error:'Không có trận chiến trong tháp.'};
  const order=readOrder(action,b,{mode:'tower',members:run.members,squad:run.squad});if(order.error)return order;action=order.move;const actor=skillActor(action);
  if(!['attack','guard','skill','charge'].includes(action)&&!actor)return {error:'Nước đi không hợp lệ.'};
  if(action==='skill'&&run.focus<2)return {error:'Tuyệt kỹ cần 2 năng lượng.'};if(!RHYTHM_GRADES.includes(grade))return {error:'Nhịp ra chiêu không hợp lệ.'};
  if(actor){const error=skillBlocked(b.tactics,actor,run.focus,run.members,action.startsWith('awaken:'),run.squad?.allies);if(error)return {error};}
  const tactics=b.tactics||=newTactics(run.members),tick=startTacticTurn(tactics),encounter=towerEncounter(run),intent=towerIntent(run),ratio=towerPower(run,encounter.element)/Math.max(1,encounter.power);
  const result={action,damage:0,incoming:0,absorbed:0,heal:0,reflected:0,ward:0,actors:run.squad?squadMembers(run).map(m=>m.id):run.members.map(m=>m.id),unitEvents:[]};
  const tickDamage=hitSquadEnemies(run,b,tick.damage,{tick:true,result}),regenHeal=heal(run,tick.heal*towerOmen(run.season).heal,{target:run.squad?.effects.regen,result,strict:true});result.damage=tickDamage;result.heal=regenHeal;
  const win=()=>{endTacticTurn(tactics,action.startsWith('awaken:')?null:actor);result.squadAfter=structuredClone(run.squad);return {...result,...bankFloor(state,{now})};};
  if(b.hp<=0)return win();
  const plan=beginOrder(b,order,run.members),beat=orderRhythm(b,order,grade);result.strategy=plan;result.rhythm=beat;let damage=(13+25*Math.min(2.4,ratio))*(.95+random(run)*.1),skillHeal=0;

  if(actor){const cast=castSquadSkill(run,tactics,actor,{members:run.members,baseDamage:damage*(1+rank(run,'ember')*.22),maxHp:towerMaxHp(run),otherShield:run.shield,support:beat.support,ultimate:action.startsWith('awaken:'),currentHp:run.hp,burnBonus:1},order,result);Object.assign(result,cast);result.heal=regenHeal;result.damage=tickDamage;damage=cast.damage;skillHeal=cast.heal;run.focus=Math.max(0,Math.min(3,run.focus-cast.cost+cast.gain));if(cast.breakShield)b.shield=0;}
  else if(action==='skill'){damage*=1.82*(1+rank(run,'ember')*.22);run.focus-=2;b.shield=0;}
  else{run.focus=Math.min(3,run.focus+plan.energyGain);if(action==='guard'){damage*=.28;result.ward+=addShield(run,8);}if(action==='charge')damage=0;}
  damage=Math.max(actor||action==='charge'?0:1,Math.round(damage*(actor?1:squadDamageScale(run))*(1+tactics.boost.amount/100)*beat.damage*plan.damage));
  const response=enemyResponse(b,intent,action,beat,result,damage,encounter.maxHp);Object.assign(result,response);result.damage=tickDamage;damage=response.damage;
  const blocked=result.pierce?0:Math.min(b.shield,damage);b.shield-=blocked;result.damage+=hitSquadEnemies(run,b,damage-blocked,{order,actor,result,pierce:result.pierce});
  if(action==='skill'||actor){const amount=healSquadSkill(run,((actor?skillHeal:Math.round(8*beat.support))+rank(run,'tide')*7)*towerOmen(run.season).heal,{maxHp:towerMaxHp(run),actor,target:actor?result.allyTarget:undefined,result,ultimate:action.startsWith('awaken:')});result.heal+=amount;result.ward+=addShield(run,amount*rank(run,'canopy')*.25);}
  b.turn++;if(run.squad){result.squadImpact=structuredClone(run.squad);result.squadImpactEventCount=result.unitEvents.length;}
  if(b.hp<=0)return win();
  if(!response.enemyIdle){let incoming=Math.round((8+14/Math.max(.15,ratio))*(.94+random(run)*.12)*(1+Math.max(0,b.turn-8)*.1));if(intent.id==='heavy')incoming=Math.round(incoming*1.85);if(intent.id==='rage'&&b.hp<encounter.maxHp*.5)incoming=Math.round(incoming*1.55);if(intent.id==='ward'){b.shield=Math.min(80,b.shield+24);incoming=Math.round(incoming*.55);}if(intent.id==='channel')incoming=0;if(intent.id==='strike'&&b.turn%4===0)incoming=Math.round(incoming*1.2);incoming=Math.round(incoming*response.multiplier*plan.incoming*towerOmen(run.season).incoming*(1+run.curse*.08));if(action==='guard')incoming=Math.round(incoming*beat.guard);incoming=Math.round(incoming*(1-tactics.weaken.amount/100));const wardBlocked=run.squad?0:Math.min(tactics.ward,incoming);tactics.ward-=wardBlocked;const shieldBlocked=run.squad?0:Math.min(run.shield,incoming-wardBlocked);run.shield-=shieldBlocked;result.absorbed=wardBlocked+shieldBlocked;result.incoming=receiveSquadDamage(run,b,incoming-shieldBlocked,{order,result,intent});result.reflected=hitSquadEnemies(run,b,(action==='guard'&&grade==='perfect'&&!beat.staggered&&intent.id!=='channel'&&result.enemyAttacked?rank(run,'thorns')*8:0)+tactics.counter.amount,{reflected:true,order,result});}
  if(run.squad&&(response.enemyIdle||intent.id==='channel'))receiveSquadDamage(run,b,0,{result,skip:true});
  finishOrder(b,order,result,!response.enemyIdle&&intent.id!=='channel'&&result.enemyAttacked);applyGuardSet(tactics,run.members,result,towerMaxHp(run),run.shield);endTacticTurn(tactics,action.startsWith('awaken:')?null:actor);if(run.squad)result.squadAfter=structuredClone(run.squad);
  if(run.hp<=0||b.turn>=120){log(run,'Cả đội dừng lại trước sức nặng của tầng tháp.');return {...result,...finishRun(state,'defeat',now)};}
  if(b.hp<=0)return {...result,...bankFloor(state,{now})};
  result.damage=Math.max(0,Math.round(result.damage));tactics.last=`${actor?`${BY_ID[actor].name} · ${result.skill||'Chiêu riêng'}`:action==='skill'?'Tuyệt kỹ hợp lực':action==='guard'?'Phòng thủ':action==='charge'?'Lấy đà':'Cả đội tấn công'} · gây ${result.damage}${result.heal?` · hồi ${result.heal}`:''}${result.incoming?` · nhận ${result.incoming}`:''}.${result.combo?` ${result.combo}!`:''}${orderCaption(result)}${setCaption(result)}${rhythmCaption(beat)}${enemyCaption(result)}`.slice(0,285);log(run,tactics.last);
  return result;
}

export function claimTowerMilestone(state,floor){const m=TOWER_MILESTONES.find(x=>x.floor===floor),t=state.tower;if(!m||t.best<floor||t.claimed.includes(floor))return {error:'Mốc tháp chưa hoàn thành hoặc đã nhận.'};t.claimed.push(floor);grant(state,m.reward);return {reward:m.reward,title:m.title};}

export function refreshTower(state,now=Date.now()){
  const t=state.tower,season=towerSeason(now);if(season<=t.season)return false;
  t.season=season;t.weeklyBest=0;t.weeklyClaimed=[];return true;
}
export function claimTowerWeekly(state,floor,now=Date.now()){
  refreshTower(state,now);const t=state.tower;if(![5,10,15,20,25,30].includes(floor)||floor>t.weeklyBest||t.weeklyClaimed.includes(floor))return {error:'Rương tuần chưa mở hoặc đã nhận.'};
  const reward={tickets:floor===30?3:1,essence:Math.ceil(floor/5),crystals:15};t.weeklyClaimed.push(floor);grant(state,reward);return {reward};
}
export function exchangeTowerDust(state,id){
  const items={tickets:{cost:80,reward:{tickets:2}},essence:{cost:60,reward:{essence:8}}},item=Object.hasOwn(items,id)?items[id]:null;
  if(!item||state.tower.dust<item.cost)return {error:'Chưa đủ bụi tháp để đổi món này.'};
  state.tower.dust-=item.cost;grant(state,item.reward);return {reward:item.reward};
}
export function setTowerAura(state,enabled){if(typeof enabled!=='boolean'||!state.tower.claimed.includes(30))return {error:'Nhận rương tầng 30 để mở trang sức Tinh Quan.'};state.tower.aura=enabled;return {enabled};}
