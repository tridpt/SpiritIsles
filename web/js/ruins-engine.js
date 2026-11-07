import { newEnemyAI, enemyResponse, enemyCaption } from './enemy-tactics.js';
import { BY_ID, ELEMENTS } from './data.js';
import { combatMembers, pay, grant, addXP } from './engine.js';
import { newTactics, formation, skillBlocked, startTacticTurn, endTacticTurn, castPetSkill, skillActor, applyGuardSet, setCaption } from './tactics.js';
import { newRhythm,rhythmCaption,RHYTHM_GRADES } from './combat-rhythm.js';
import { newStrategy,readOrder,beginOrder,orderRhythm,finishOrder,orderCaption } from './combat-orders.js';
import { RUINS_ENTRY, RUINS_UNLOCK, RUINS_BLESSINGS, RUINS_BLESSING_BY_ID, RUINS_RELICS, RUINS_MILESTONES, RUINS_EXCHANGES, RUINS_PATHS, ruinsMaxHp, ruinsEncounter, ruinsIntent, ruinsBlessingAvailable } from './ruins-data.js';
import { grantAwakeningMaterials } from './awakening-data.js';
import { newRuinsRoute, ruinsRouteNext, ruinsRouteNode, ruinsRouteBlessing, routeChoiceError, ROUTE_EVENTS, ROUTE_BUILD_IDS } from './ruins-route.js';
import {newSquad,startSquadFight} from './squad-state.js';
import {ruinsEnemies} from './combat-team.js';
import {recordCombatTurn,retireCombatReport} from './combat-report.js';
import {healSquad,healSquadSkill,healSquadEnemies,hitSquadEnemies,receiveSquadDamage,castSquadSkill,squadDamageScale,squadMembers,squadCanAttack,endSquadBattle,squadHealthCost} from './squad-combat.js';

const cap=n=>Math.max(0,Math.min(99999999,Math.floor(n)));
const rank=(run,id)=>run.blessings[id]||0;
function random(run) {
  let n=run.rng;n^=n<<13;n^=n>>>17;n^=n<<5;run.rng=n>>>0;return run.rng/0x100000000;
}
function draw(run,pool,count) {
  const available=[...pool],result=[];
  while(result.length<count&&available.length)result.push(available.splice(Math.floor(random(run)*available.length),1)[0]);
  return result;
}
function log(run,text) {run.log.unshift(text);run.log=run.log.slice(0,6);}
function heal(run,amount,options={}) {return healSquad(run,amount,{maxHp:ruinsMaxHp(run),...options});}
function addShield(run,amount) {const before=run.shield;run.shield=Math.min(Math.floor(ruinsMaxHp(run)*.6)-(run.battle?.tactics?.ward||0),run.shield+Math.max(0,Math.round(amount)));return run.shield-before;}
function prepareFloor(run) {
  run.phase='path';run.path=null;run.battle=null;run.offers=[];run.rerolled=false;
  if(run.route){run.route.position=null;run.paths=ruinsRouteNext(run).map(n=>n.id);return;}
  const pool=['trail','elite','vault'];if(random(run)<.35)pool.push('spring');
  run.paths=run.floor%5===0?['boss']:draw(run,pool,2);
}
function offerBlessings(run,excluded=[]) {
  let pool=RUINS_BLESSINGS.filter(b=>(run.route||!ROUTE_BUILD_IDS.includes(b.id))&&ruinsBlessingAvailable(b,run));
  const fresh=pool.filter(b=>!excluded.includes(b.id));if(fresh.length>=3)pool=fresh;
  if(run.route){const build=draw(run,pool.filter(b=>ROUTE_BUILD_IDS.includes(b.id)),1);return [...build,...draw(run,pool.filter(b=>!build.includes(b)),3-build.length)].map(b=>b.id);}
  return draw(run,pool,3).map(b=>b.id);
}

export function ruinsPower(run,enemyElement=null) {
  const elements=run.members.map(m=>BY_ID[m.id].element);const diverse=new Set(elements).size;
  const synergy=diverse===3?1.12:elements.length===3&&diverse===1?1.2:1.05;
  const power=run.members.reduce((sum,m)=>{
    const s=BY_ID[m.id];const humble=['N','R'].includes(s.rarity)?1+rank(run,'humble')*.25:1;
    return sum+m.power*humble*(enemyElement&&ELEMENTS[s.element].strong===enemyElement?1.3:1);
  },0);
  return Math.round(power*synergy*(1+run.relics.compass*.05+rank(run,'might')*.1+rank(run,'harmony')*.15+rank(run,'unison')*.2));
}
export function ruinsPreview(state) {
  const snapshot={members:combatMembers(state),relics:{...state.ruins.relics},blessings:{}};
  return {...snapshot,power:ruinsPower(snapshot),maxHp:ruinsMaxHp(snapshot),potions:1+snapshot.relics.flask};
}
export function startRuins(state,startFloor=1,rng=Math.random,now=Date.now(),journey=false) {
  const r=state.ruins;
  if(state.tower?.run)return {error:'Đội đang leo Tháp Vô Tận. Kết thúc chuyến leo trước nhé.'};
  if(r.run)return {error:'Chuyến đi trong phế tích chưa kết thúc. Tiếp tục hoặc trở về trước nhé.'};
  if(state.expedition)return {error:'Đội đang thám hiểm quần đảo. Hãy kết thúc chuyến đi trước nhé.'};
  if(state.boss?.run)return {error:'Đội đang săn thủ vệ. Kết thúc trận trước nhé.'};
  if(state.level<RUINS_UNLOCK)return {error:`Phế Tích Cổ mở ở cấp đảo ${RUINS_UNLOCK}. Ấp trứng và chăm thú để lên cấp nhé!`};
  if(![1,11,21,31,41].includes(startFloor)||startFloor>r.best+1)return {error:'Cánh cửa này chưa được đánh thức. Vượt hết khu trước để mở lối.'};
  if(!state.team.length)return {error:'Hãy chọn ít nhất một linh thú đồng hành.'};
  if(!pay(state,RUINS_ENTRY))return {error:'Cần 12 quả mọng làm hành trang. Thu hoạch vườn hoặc đổi bụi cổ lấy giỏ tiếp sức nhé!'};
  const preview=ruinsPreview(state);const sample=rng();const seed=1+Math.floor((Number.isFinite(sample)?Math.max(0,Math.min(.999999999,sample)):.5)*0xfffffffe);
  const run={seed,rng:seed,startFloor,floor:startFloor,phase:'path',members:preview.members,relics:preview.relics,blessings:{},hp:preview.maxHp,shield:0,focus:0,potions:preview.potions,paths:[],path:null,offers:[],battle:null,cleared:0,dustEarned:0,loot:{},rerolled:false,started:now,log:['Một ngọn đèn sáng lên. Cả đội cùng bước xuống những bậc thềm đầu tiên.']};
  run.squad=newSquad(run.members,preview.maxHp,preview.maxHp,state.battleFormation?.rows);
  if(journey)run.route=newRuinsRoute();
  prepareFloor(run);r.run=run;r.runs=cap(r.runs+1);r.lastResult=null;return {run,cost:RUINS_ENTRY};
}
export function startRuinsJourney(state,startFloor=1,rng=Math.random,now=Date.now()){return startRuins(state,startFloor,rng,now,true);}

function finishRun(state,status,now=Date.now()) {
  const run=state.ruins.run;if(!run)return {error:'Không có chuyến đi trong phế tích.'};
  const result={status,startFloor:run.startFloor,floor:run.floor,cleared:run.cleared,dust:run.dustEarned,loot:{...run.loot},blessings:{...run.blessings},time:now};
  if(run.route)result.journey={rooms:10,events:run.route.history.filter(h=>['event','spring'].includes(ruinsRouteNode(run,h.node).kind)).length,elites:run.route.history.filter(h=>ruinsRouteNode(run,h.node).kind==='elite').length,curse:run.route.curse};
  state.ruins.lastResult=result;state.ruins.run=null;
  state.history.unshift({type:'ruins',time:now,text:`${status==='victory'?'Đánh thức trái tim đảo':status==='defeat'?'Nghỉ chân trong phế tích':'Trở về từ phế tích'} · ${run.cleared} tầng · ${run.dustEarned} bụi cổ`});state.history=state.history.slice(0,40);
  return {finished:true,result};
}
function completeFloor(state,now=Date.now(),choice=null) {
  const r=state.ruins,run=r.run;const first=run.floor>r.best;const spring=['spring','event'].includes(run.path);
  const squadAfter=run.squad?structuredClone(run.squad):undefined;endSquadBattle(run);
  const base=spring?(first?2:1):(first?5+Math.floor(run.floor/5):2+Math.floor(run.floor/10));
  const dust=Math.max(1,Math.round(base*(spring?1:RUINS_PATHS[run.path].dust)*(1+rank(run,'treasure')*.2)));
  const reward={gold:spring?0:(first?18+run.floor*4:12+run.floor*2),food:spring?3:2};
  if(run.path==='vault')reward.gold+=40+run.floor*2;
  grant(state,reward);r.dust=cap(r.dust+dust);r.best=Math.max(r.best,run.floor);r.clears=cap(r.clears+1);run.cleared++;run.dustEarned=cap(run.dustEarned+dust);
  for(const [key,n]of Object.entries(reward))run.loot[key]=cap((run.loot[key]||0)+n);
  addXP(state,(first?12:2)+(run.floor%5===0?10:0));
  const awakeningMaterials=run.floor%5===0?grantAwakeningMaterials(state,'ruins',run.floor):{};
  if(run.floor%5===0){r.bosses=cap(r.bosses+1);heal(run,ruinsMaxHp(run)*.15);for(const m of run.members){const p=state.pets.find(p=>p.id===m.id);p.bond=Math.min(100,p.bond+1);}}
  if(!spring)heal(run,rank(run,'recovery')*6);
  log(run,`Vượt tầng ${run.floor} · +${dust} bụi cổ${first?' · Dấu chân mới':''}${awakeningMaterials.relic?` · +${awakeningMaterials.relic} Mảnh cổ linh`:''}.`);
  if(run.route)run.route.history.push({node:run.route.position,choice});
  run.battle=null;
  if(run.floor===(run.route?run.startFloor+9:50))return {...finishRun(state,'victory',now),dust,reward,first,awakeningMaterials,...(squadAfter?{squadAfter}:{})};
  if(spring){run.floor++;prepareFloor(run);return {cleared:true,spring:true,dust,reward,first};}
  run.phase='blessing';run.offers=offerBlessings(run);run.rerolled=false;return {won:true,dust,reward,first,awakeningMaterials,...(squadAfter?{squadAfter}:{})};
}
export function chooseRuinsPath(state,id,now=Date.now()) {
  const run=state.ruins.run;
  if(!run||run.phase!=='path'||!run.paths.includes(id))return {error:'Lối đi này không còn ở trước mặt bạn.'};
  if(run.route){const node=ruinsRouteNode(run,id);if(!node)return {error:'Điểm dừng này không tồn tại.'};run.route.position=id;id=node.kind;}
  run.path=id;run.paths=[];
  if(run.route&&['spring','event'].includes(id)){run.phase='event';log(run,`Dừng chân · ${ROUTE_EVENTS[ruinsRouteNode(run,run.route.position).event].name}.`);return {event:true};}
  if(id==='spring'){const healed=heal(run,ruinsMaxHp(run)*.3);run.focus=Math.min(3,run.focus+1);log(run,`Ghé suối ánh sao · hồi ${healed} sinh lực.`);return {...completeFloor(state,now),heal:healed};}
  const encounter=ruinsEncounter(run);heal(run,rank(run,'kindness')*4);run.focus=Math.max(run.focus,rank(run,'spark'));
  const tactics=newTactics(run.members);tactics.ward=Math.min(Math.round(ruinsMaxHp(run)*formation(run.members).openingWard),Math.floor(ruinsMaxHp(run)*.6)-run.shield);
  run.battle={enemyAI:newEnemyAI(encounter.kind),hp:encounter.maxHp,shield:encounter.elite?.id==='sentinel'?30:id==='vault'?25:0,turn:0,tactics,rhythm:newRhythm(),strategy:newStrategy()};run.phase='battle';
  if(!run.squad)run.squad=newSquad(run.members,ruinsMaxHp(run),run.hp,state.battleFormation?.rows);
  startSquadFight(run,ruinsEnemies(run,encounter),encounter.maxHp,ruinsMaxHp(run),state.battleFormation?.rows);
  log(run,`Gặp ${encounter.name}${encounter.boss?' · Thủ vệ':''}.`);return {battle:run.battle};
}
function receiveBlessing(run,id){run.blessings[id]=(run.blessings[id]||0)+1;if(id==='vitality')heal(run,15);if(id==='dew'){heal(run,ruinsMaxHp(run)*.3);addShield(run,10);}}
export function ruinsEventContext(state){
  const run=state.ruins.run;if(!run?.route||run.phase!=='event')return null;
  const node=ruinsRouteNode(run,run.route.position),event=ROUTE_EVENTS[node.event];
  const pool=RUINS_BLESSINGS.filter(b=>ruinsBlessingAvailable(b,run)).map(b=>b.id);
  return {...event,node,choices:event.choices.map(choice=>{const blessingId=choice.blessing?ruinsRouteBlessing(run,node,pool,choice.blessing):null;return {...choice,blessingId,error:routeChoiceError(state,choice)||(choice.blessing&&!blessingId?'Không còn phước lành phù hợp để nhận.':''),hpCost:choice.hp?Math.ceil(ruinsMaxHp(run)*choice.hp):0,healAmount:choice.heal?Math.min(ruinsMaxHp(run)-run.hp,Math.round(ruinsMaxHp(run)*choice.heal)):0};})};
}
export function chooseRuinsEvent(state,id,now=Date.now()){
  const event=ruinsEventContext(state),choice=event?.choices.find(c=>c.id===id);
  if(!choice)return {error:'Lựa chọn này không còn ở trước mặt bạn.'};
  if(choice.error)return {error:choice.error};
  const run=state.ruins.run;
  if(choice.food)state.resources.food-=choice.food;if(choice.costGold)state.resources.gold-=choice.costGold;
  if(choice.hpCost)squadHealthCost(run,choice.hpCost);
  const healed=choice.heal?heal(run,ruinsMaxHp(run)*choice.heal):0;
  if(choice.focus)run.focus=Math.min(3,run.focus+choice.focus);
  if(choice.potion)run.potions++;
  if(choice.curse)run.route.curse+=choice.curse;
  if(choice.blessingId)receiveBlessing(run,choice.blessingId);
  if(choice.gold){grant(state,{gold:choice.gold});run.loot.gold=cap((run.loot.gold||0)+choice.gold);}
  if(choice.dust){state.ruins.dust=cap(state.ruins.dust+choice.dust);run.dustEarned=cap(run.dustEarned+choice.dust);}
  const result=completeFloor(state,now,choice.id);log(run,`${event.name} · ${choice.name}${choice.blessingId?` · nhận ${RUINS_BLESSING_BY_ID[choice.blessingId].name}`:''}.`);
  return {...result,event:true,heal:healed,blessing:choice.blessingId?RUINS_BLESSING_BY_ID[choice.blessingId]:null};
}
export function chooseRuinsBlessing(state,id) {
  const run=state.ruins.run;const blessing=RUINS_BLESSING_BY_ID[id];
  if(!run||run.phase!=='blessing'||!run.offers.includes(id)||!blessing||!ruinsBlessingAvailable(blessing,run))return {error:'Phép bổ trợ này không còn để chọn.'};
  receiveBlessing(run,id);
  log(run,`Nhận ${blessing.name} · bậc ${run.blessings[id]}.`);run.floor++;prepareFloor(run);return {blessing};
}
export function rerollRuinsBlessings(state) {
  const run=state.ruins.run;
  if(!run||run.phase!=='blessing'||run.path!=='elite'||run.rerolled)return {error:'Chỉ thử thách tinh anh cho đổi lựa chọn một lần.'};
  run.offers=offerBlessings(run,run.offers);run.rerolled=true;return {offers:run.offers};
}
export function useRuinsPotion(state) {
  const run=state.ruins.run;
  if(!run||!['path','battle'].includes(run.phase)||run.potions<=0)return {error:'Không còn bình sương để dùng lúc này.'};
  if(run.hp>=ruinsMaxHp(run))return {error:'Cả đội đang đầy sinh lực. Giữ bình sương cho lúc cần nhé!'};
  run.potions--;const amount=heal(run,ruinsMaxHp(run)*.35);log(run,`Dùng bình sương · hồi ${amount} sinh lực.`);return {heal:amount};
}
export function retreatRuins(state,now=Date.now()) {const r=finishRun(state,'retreat',now);if(!r.error)retireCombatReport(state,'ruins');return r;}

export function ruinsBattleTurn(state,action,now=Date.now(),grade='auto') {
  return recordCombatTurn(state,'ruins',action,()=>ruinsBattleTurnCore(state,action,now,grade));
}
function ruinsBattleTurnCore(state,action,now=Date.now(),grade='auto') {
  const run=state.ruins.run;const b=run?.battle;
  if(!run||run.phase!=='battle'||!b)return {error:'Không có trận chiến trong phế tích.'};
  const order=readOrder(action,b,{mode:'ruins',members:run.members,squad:run.squad});if(order.error)return order;action=order.move;
  const actor=skillActor(action);
  if(!['attack','guard','skill','charge'].includes(action)&&!actor)return {error:'Không có trận chiến trong phế tích.'};
  if(action==='skill'&&run.focus<2)return {error:'Tuyệt kỹ cần 2 năng lượng. Tấn công hoặc phòng thủ để tích nhé!'};
  if(!RHYTHM_GRADES.includes(grade))return {error:'Nhịp ra chiêu không hợp lệ.'};
  if(actor){const error=skillBlocked(b.tactics,actor,run.focus,run.members,action.startsWith('awaken:'));if(error)return {error};}
  const tactics=b.tactics||=newTactics(run.members);const tick=startTacticTurn(tactics);
  const encounter=ruinsEncounter(run);const intent=ruinsIntent(run);const ratio=ruinsPower(run,encounter.element)/Math.max(1,encounter.power);
  const elements=run.members.map(m=>BY_ID[m.id].element);
  const result={action,damage:0,incoming:0,absorbed:0,heal:0,reflected:0,ward:0,...(run.squad?{actors:squadMembers(run).map(m=>m.id),unitEvents:[]}: {})};
  const tickDamage=hitSquadEnemies(run,b,tick.damage,{tick:true,result}),regenHeal=heal(run,tick.heal+(tickDamage>0?rank(run,'fireheart')*3:0),{target:run.squad?.effects.regen,result,strict:true});result.heal=regenHeal;result.damage=tickDamage;
  if(b.hp<=0)return {...result,...completeFloor(state,now)};
  const plan=beginOrder(b,order,run.members);result.strategy=plan;const beat=orderRhythm(b,order,grade);result.rhythm=beat;
  let damage=(12+23*Math.min(2.5,ratio))*(.94+random(run)*.12);
  if(run.hp<ruinsMaxHp(run)*.5)damage*=1+rank(run,'courage')*.2;
  if(b.turn===0)damage*=1+rank(run,'wind')*.35;
  let skillHeal=0;
  if(actor){
    const cast=castSquadSkill(run,tactics,actor,{members:run.members,baseDamage:damage*(1+rank(run,'ember')*.25),maxHp:ruinsMaxHp(run),otherShield:run.shield,support:beat.support,ultimate:action.startsWith('awaken:'),currentHp:run.hp,burnBonus:1+rank(run,'wildfire')*.35},order,result);
    Object.assign(result,cast);result.damage=tickDamage;result.heal=regenHeal;damage=cast.damage;skillHeal=cast.heal;
    run.focus=Math.max(0,Math.min(3,run.focus-cast.cost+cast.gain));
    if(cast.combo){damage*=1+rank(run,'relay')*.2;result.ward+=addShield(run,rank(run,'relay')*8);run.focus=Math.min(3,run.focus+rank(run,'continuum'));}
    if(cast.ward>0)skillHeal+=rank(run,'wardflow')*6;
    if(cast.breakShield)b.shield=0;
  }else if(action==='skill'){
    damage*=1.85+rank(run,'ember')*.25+(elements.includes('fire')?.1:0);run.focus-=2;
    // A skill breaks the enemy's shield before dealing damage.
    b.shield=0;
  }else{
    run.focus=Math.min(3,run.focus+plan.energyGain+(action==='charge'?0:action==='guard'?rank(run,'charge'):rank(run,'radiance')));
    if(action==='guard'){damage*=.28;result.ward+=addShield(run,rank(run,'bastion')*8);}
    if(action==='charge')damage=0;
  }
  damage=Math.max(actor||action==='charge'?0:1,Math.round(damage*(actor?1:squadDamageScale(run))*(1+tactics.boost.amount/100)*beat.damage*plan.damage));const response=enemyResponse(b,intent,action,beat,result,damage,encounter.maxHp);
  if(encounter.elite?.id==='sentinel'){if(response.armorBlocked){response.damage=damage-Math.round(damage*.5);response.armorBlocked=Math.round(damage*.5);}if(response.enemyCounter)response.enemyCounter=14;}
  if(encounter.elite?.id==='oracle'){if(intent.id==='spell')response.multiplier=2.4;if(response.interrupted){run.focus=Math.min(3,run.focus+1);result.ward+=addShield(run,12);result.eliteDisrupted=true;}}
  Object.assign(result,response);result.damage=tickDamage;damage=response.damage;
  const absorbed=result.pierce?0:Math.min(b.shield,damage);b.shield-=absorbed;result.damage+=hitSquadEnemies(run,b,damage-absorbed,{order,actor,result,pierce:result.pierce});
  if((b.turn+1)%3===0&&rank(run,'echo'))result.damage+=hitSquadEnemies(run,b,15*rank(run,'echo'),{reflected:true,order,result});
  if(action==='skill'||actor){
    const amount=healSquadSkill(run,(actor?skillHeal:Math.round((8+(elements.includes('water')?6:0)+(elements.includes('leaf')?4:0))*beat.support))+rank(run,'tide')*8+Math.min(30,Math.round(result.damage*rank(run,'leech')*.12)),{maxHp:ruinsMaxHp(run),actor,target:actor?result.allyTarget:undefined,result,ultimate:action.startsWith('awaken:')});
    result.heal+=amount;result.ward+=addShield(run,amount*rank(run,'canopy')*.25);
  }
  b.turn++;
  if(run.squad){result.squadImpact=structuredClone(run.squad);result.squadImpactEventCount=result.unitEvents.length;}
  if(b.hp<=0){endTacticTurn(tactics,action.startsWith('awaken:')?null:actor);return {...result,...completeFloor(state,now)};}
  if(response.enemyIdle){
    // Breaking stance or disrupting a spell interrupts the entire intent, including mend, drain and ward.
  }else if(intent.id==='mend'){
    const amount=Math.min(encounter.maxHp-b.hp,Math.round(encounter.maxHp*.14));result.enemyHeal=healSquadEnemies(run,b,amount,result);
  }else{
    let incoming=Math.round((7+12/Math.pow(Math.max(.08,ratio),1.2))*(.94+random(run)*.12)*(1+Math.max(0,b.turn-9)*.1));
    if(intent.id==='heavy')incoming=Math.round(incoming*1.9);
    result.enraged=b.enemyAI?.kind==='berserker'&&b.hp<=encounter.maxHp*.4;incoming=Math.round(incoming*response.multiplier*(result.enraged?1.6:1))+result.enemyCounter;
    if(intent.id==='ward'){b.shield=Math.min(80,b.shield+24);incoming=Math.round(incoming*.6);}
    if(intent.id==='drain')run.focus=Math.max(0,run.focus-1);
    finishOrder(b,order,result,squadCanAttack(run,b));incoming=Math.round(incoming*plan.incoming);
    if(action==='guard'){result.reflected=8*rank(run,'thorns');incoming=Math.round(incoming*beat.guard);}
    incoming=Math.round(incoming*(1+(run.route?.curse||0)*.15));
    if(encounter.elite?.id==='sentinel'&&result.strategy.parried){b.shield=0;result.eliteShattered=true;}
    incoming=Math.round(incoming*(1-tactics.weaken.amount/100));
    const wardBlocked=run.squad?0:Math.min(tactics.ward,incoming);tactics.ward-=wardBlocked;incoming-=wardBlocked;
    const shieldBlocked=run.squad?0:Math.min(run.shield,incoming);run.shield-=shieldBlocked;result.absorbed=wardBlocked+shieldBlocked;result.incoming=receiveSquadDamage(run,b,incoming-shieldBlocked,{order,result,intent});
    result.reflected+=tactics.counter.amount;
    result.reflected+=Math.round(result.absorbed*rank(run,'mirror')*.35);
    if(run.squad&&!result.enemyAttacked)result.reflected=0;
    result.reflected=hitSquadEnemies(run,b,result.reflected,{reflected:true,order,result});
  }
  if(run.squad&&(response.enemyIdle||intent.id==='mend'))receiveSquadDamage(run,b,0,{result,skip:true});
  applyGuardSet(tactics,run.members,result,ruinsMaxHp(run),run.shield);
  endTacticTurn(tactics,action.startsWith('awaken:')?null:actor);
  if(run.squad)result.squadAfter=structuredClone(run.squad);
  if(run.hp<=0||b.turn>=149){log(run,'Cả đội cần nghỉ ngơi. Những dấu chân đã đi vẫn ở lại.');return {...result,...finishRun(state,'defeat',now)};}
  if(b.hp<=0)return {...result,...completeFloor(state,now)};
  tactics.last=`${actor?`${BY_ID[actor].name} · ${result.skill||BY_ID[actor].skill}`:action==='skill'?'Tuyệt kỹ hợp lực':action==='guard'?'Phòng thủ':action==='charge'?'Lấy đà':'Tấn công'}${result.combo?` · ${result.combo}!`:''} · gây ${result.damage}${result.heal?` · hồi ${result.heal}`:''}${result.ward?` · tạo ${result.ward} khiên`:''}${result.reflected?` · phản ${result.reflected}`:''} · nhận ${result.incoming} sát thương.`;
  tactics.last=(tactics.last+setCaption(result)+rhythmCaption(beat)+orderCaption(result)+enemyCaption(result)+(result.eliteShattered?' · Phá khiên tinh anh!':'')+(result.eliteDisrupted?' · Ngắt tinh anh: +1 năng lượng, +12 khiên':'')).slice(0,285);log(run,tactics.last);
  return result;
}

export function upgradeRuinsRelic(state,id) {
  const r=state.ruins;const relic=RUINS_RELICS.find(v=>v.id===id);
  if(!relic)return {error:'Di vật này không tồn tại.'};
  if(r.run)return {error:'Kết thúc chuyến đi để nâng di vật. Sức mạnh được chốt khi khởi hành.'};
  const level=r.relics[id];if(level>=relic.costs.length)return {error:'Di vật đã đạt bậc tối đa.'};
  const cost=relic.costs[level];if(r.dust<cost)return {error:'Chưa đủ bụi cổ. Vượt thêm vài tầng hoặc khám phá lại khu đã mở nhé!'};
  r.dust-=cost;r.relics[id]++;return {relic,level:level+1,cost};
}
export function exchangeRuinsDust(state,id) {
  const item=RUINS_EXCHANGES.find(v=>v.id===id);if(!item)return {error:'Vật phẩm trao đổi không hợp lệ.'};
  if(state.ruins.dust<item.cost)return {error:'Chưa đủ bụi cổ để đổi vật phẩm.'};
  state.ruins.dust-=item.cost;grant(state,item.reward);return {reward:item.reward};
}
export function claimRuinsMilestone(state,floor) {
  const r=state.ruins;const milestone=RUINS_MILESTONES.find(v=>v.floor===floor);
  if(!milestone||r.best<floor||r.claimed.includes(floor))return {error:'Mốc này chưa hoàn thành hoặc đã nhận thưởng.'};
  r.claimed.push(floor);grant(state,milestone.reward);return {reward:milestone.reward,title:milestone.title};
}
