import {addShinyFragments} from './shiny.js';
import { BY_ID } from './data.js';
import { combatMembers, pay, grant, addXP } from './engine.js';
import { BOSS, BOSSES, bossId, bossProgress, bossUnlocked, bossRequiredLevel, bossEnemy, bossTeamPower, bossIntent } from './boss-state.js';
import { GEAR_RECIPES, BOSS_GEAR } from './forge-state.js';
import { addGear } from './forge-engine.js';
import { newTactics, formation, skillBlocked, startTacticTurn, endTacticTurn, castPetSkill, skillActor, applyGuardSet, setCaption } from './tactics.js';
import { newRhythm,rhythmCaption,RHYTHM_GRADES } from './combat-rhythm.js';
import { newStrategy, readOrder, beginOrder, orderRhythm, finishOrder, orderCaption } from './combat-orders.js';
import { grantAwakeningMaterials } from './awakening-data.js';
import {newSquad,startSquadFight} from './squad-state.js';
import {guardianEnemy} from './combat-team.js';
import {recordCombatTurn,retireCombatReport} from './combat-report.js';
import {healSquad,healSquadSkill,healSquadEnemies,hitSquadEnemies,receiveSquadDamage,castSquadSkill,squadDamageScale,squadMembers,squadCanAttack,restoreSquadEnemy} from './squad-combat.js';

const cap=n=>Math.min(99999999,n);
function random(run){let n=run.rng;n^=n<<13;n^=n>>>17;n^=n<<5;run.rng=n>>>0;return run.rng/0x100000000;}
function log(run,text){run.log.unshift(text);run.log=run.log.slice(0,6);}
function advancePhase(run){
  const ratio=run.enemyHp/bossEnemy(run.tier,bossId(run)).maxHp;
  if(ratio<=.3&&run.phase<3){run.phase=3;run.roots=0;run.shield=0;log(run,'Giai đoạn cuối! Cả đội gây thêm 20% sát thương; thủ vệ đánh mạnh hơn 30%.');}
  else if(ratio<=.6&&run.phase===1){run.phase=2;if(bossId(run)==='treant'){run.roots=2;log(run,'Hai rễ hồi sinh xuất hiện! Đánh thường chặt 1 rễ; chiêu Hỏa, combo hoặc tuyệt kỹ chặt hết.');}else if(bossId(run)==='frost'){run.shield=Math.min(200,run.shield+35+run.tier*5);log(run,'Vảy băng khép lại! Dùng Hợp lực hoặc chiêu phá khiên để vượt qua.');}else log(run,'Lõi lửa đã lộ! Vào sàn đấu để chọn mục tiêu và chặn lần tái sinh.');}
}
export function startBoss(state,tier=1,rng=Math.random,now=Date.now(),id='treant'){
  if(!Object.hasOwn(BOSSES,id))return {error:'Không có thủ vệ này.'};
  const definition=BOSSES[id];
  if(state.expedition||state.ruins.run||state.boss.run||state.tower?.run)return {error:'Kết thúc chuyến khám phá hiện tại trước khi săn thủ vệ nhé.'};
  if(!Number.isInteger(tier)||tier<1||tier>5||!bossUnlocked(state,id)||state.level<bossRequiredLevel(id,tier)||tier>bossProgress(state,id).best+1)return {error:'Vượt bậc trước và tăng cấp đảo để mở thử thách này.'};
  if(!state.team.length||!pay(state,{food:BOSS.cost}))return {error:'Cần một đội và 12 quả mọng làm hành trang.'};
  const sample=rng(),seed=1+Math.floor(Math.max(0,Math.min(.999999999,Number.isFinite(sample)?sample:.5))*0xfffffffe),members=combatMembers(state),tactics=newTactics(members);
  tactics.ward=Math.round(150*formation(members).openingWard);
  const run={bossId:id,...(id!=='treant'?{mechanics:{frozen:0,coreHp:id==='phoenix'?70+tier*15:0,revives:0}}:{}),tier,seed,rng:seed,members,maxHp:150,hp:150,enemyHp:bossEnemy(tier,id).maxHp,shield:0,turn:0,phase:1,roots:0,focus:0,tactics,rhythm:newRhythm(),strategy:newStrategy(),started:now,log:[`${definition.name} thức giấc. Quan sát ý định và tìm cách hóa giải cơ chế riêng.`]};
  run.squad=newSquad(members,150,150,state.battleFormation?.rows);startSquadFight(run,guardianEnemy(run),run.enemyHp,150,state.battleFormation?.rows);
  state.boss.run=run;state.boss.lastResult=null;return {run};
}
function finishBoss(state,status,now){
  const run=state.boss.run;if(!run)return {error:'Không có trận săn thủ vệ.'};
  const squadAfter=run.squad?structuredClone(run.squad):undefined;
  const id=bossId(run),progress=bossProgress(state,id),first=status==='victory'&&progress.clears[run.tier-1]===0;
  const reward=status==='victory'?{gold:80+run.tier*30,essence:run.tier,...(first?{tickets:2,crystals:25*run.tier}:{})}:{};
  const materials=status==='victory'?{sap:4+run.tier*2,ore:3+run.tier,heart:1+Math.floor(run.tier/2)}:{};
  let drop=null,converted=false;
  if(status==='victory'){
    const pool=id==='treant'?GEAR_RECIPES:BOSS_GEAR.filter(g=>g.boss===id);
    const recipe=pool[Math.floor(random(run)*pool.length)].id,item=addGear(state,recipe);
    drop={recipe,id:item?.id||null};converted=!item;if(converted){materials.sap+=3;materials.ore+=2;}
    for(const [k,n]of Object.entries(materials))state.forge.materials[k]=cap(state.forge.materials[k]+n);
    grant(state,reward);addXP(state,first?55+run.tier*10:12);
    progress.clears[run.tier-1]=cap(progress.clears[run.tier-1]+1);progress.wins=cap(progress.wins+1);progress.best=Math.max(progress.best,run.tier);
  }
  const shinyFragments=status==='victory'?addShinyFragments(state,2+run.tier):0;
  const awakeningMaterials=status==='victory'?grantAwakeningMaterials(state,'boss',run.tier):{};
  const result={bossId:id,status,tier:run.tier,reward,materials,drop,converted,first,turns:run.turn,time:now,awakeningMaterials,shinyFragments};
  state.boss.lastResult=result;state.boss.run=null;
  state.history.unshift({type:'boss',time:now,text:`${status==='victory'?'Đánh thức':status==='retreat'?'Rời tán rừng của':'Nghỉ chân trước'} ${BOSSES[id].name} · bậc ${run.tier}`});state.history=state.history.slice(0,40);
  return {finished:true,result,...(squadAfter?{squadAfter}:{})};
}
export function retreatBoss(state,now=Date.now()){const r=finishBoss(state,'retreat',now);if(!r.error)retireCombatReport(state,'boss');return r;}
export function bossBattleTurn(state,action,now=Date.now(),grade='auto'){
  return recordCombatTurn(state,'boss',action,()=>bossBattleTurnCore(state,action,now,grade));
}
function bossBattleTurnCore(state,action,now=Date.now(),grade='auto'){
  const order=readOrder(action,state.boss.run,{mode:'boss',roots:state.boss.run?.roots,core:bossId(state.boss.run)==='phoenix'&&state.boss.run?.phase>=2?state.boss.run.mechanics.coreHp:0});
  if(order.error)return order;action=order.move;
  const run=state.boss.run,actor=skillActor(action);
  if(!run||!['attack','guard','skill','charge'].includes(action)&&!actor)return {error:'Không có hành động chiến đấu này.'};
  if(action==='skill'&&run.focus<2)return {error:'Tuyệt kỹ cần 2 năng lượng.'};
  if(!RHYTHM_GRADES.includes(grade))return {error:'Nhịp ra chiêu không hợp lệ.'};
  if(actor){const error=skillBlocked(run.tactics,actor,run.focus,run.members,action.startsWith('awaken:'));if(error)return {error};}
  const tactics=run.tactics,tick=startTacticTurn(tactics),enemy=bossEnemy(run.tier,bossId(run)),ratio=bossTeamPower(run.members,bossId(run))/enemy.power;
  const result={action,damage:0,incoming:0,absorbed:0,heal:0,ward:0,reflected:0,rootsCut:0,...(run.squad?{actors:squadMembers(run).map(m=>m.id),unitEvents:[]}: {})};
  const regenHeal=healSquad(run,tick.heal,{maxHp:run.maxHp,target:run.squad?.effects.regen,result,strict:true});result.heal=regenHeal;
  const frozenBefore=run.mechanics?.frozen||0,focusBefore=run.focus;
  const revive=()=>{if(bossId(run)==='phoenix'&&run.enemyHp<=0&&run.mechanics.coreHp>0&&!run.mechanics.revives){run.mechanics.revives=1;run.enemyHp=Math.round(enemy.maxHp*.45);restoreSquadEnemy(run,run,run.enemyHp);run.phase=Math.max(2,run.phase);result.revived=run.enemyHp;log(run,'Phượng Hoàng tái sinh từ lõi lửa! Đây là lần tái sinh duy nhất.');return true;}return false;};
  const tickDamage=hitSquadEnemies(run,run,tick.damage,{tick:true,result});result.damage=tickDamage;
  if(run.enemyHp<=0&&!revive())return {...result,...finishBoss(state,'victory',now)};
  const plan=beginOrder(run,order),beat=orderRhythm(run,order,grade);result.rhythm=beat;result.strategy=plan;
  advancePhase(run);const intent=bossIntent(run);
  let damage=(12+22*Math.min(2.5,ratio))*(.94+random(run)*.12),skillHeal=0;
  if(actor){
    const cast=castSquadSkill(run,tactics,actor,{members:run.members,baseDamage:damage,maxHp:run.maxHp,support:beat.support,ultimate:action.startsWith('awaken:'),currentHp:run.hp},order,result);
    Object.assign(result,cast);result.damage=tickDamage;result.heal=regenHeal;
    damage=cast.damage;skillHeal=cast.heal;run.focus=Math.min(3,Math.max(0,run.focus-cast.cost+cast.gain));
    if(cast.breakShield)run.shield=0;
  }else if(action==='skill'){damage*=1.85;run.focus-=2;skillHeal=24;run.shield=0;}
  else{run.focus=Math.min(3,run.focus+plan.energyGain);if(action==='guard')damage*=.25;if(action==='charge')damage=0;}
  if(!actor)skillHeal=Math.round(skillHeal*beat.support);
  damage=Math.round(damage*(actor?1:squadDamageScale(run))*(1+tactics.boost.amount/100)*(run.phase===3?1.2:1)*beat.damage*plan.damage);
  if(order.target==='core'){result.coreDamage=Math.min(run.mechanics.coreHp,damage);run.mechanics.coreHp-=result.coreDamage;result.coreBroken=run.mechanics.coreHp===0;damage=Math.round(damage*.25);}
  const blocked=result.pierce?0:Math.min(run.shield,damage);run.shield-=blocked;result.damage+=hitSquadEnemies(run,run,damage-blocked,{order,actor,result,pierce:result.pierce});
  result.heal+=healSquadSkill(run,skillHeal,{maxHp:run.maxHp,actor,target:actor?result.allyTarget:undefined,result,ultimate:action.startsWith('awaken:')});
  advancePhase(run);
  if(run.roots){
    result.rootsCut=order.target==='roots'||action==='skill'||result.combo||actor&&BY_ID[actor].element==='fire'?run.roots:action==='attack'?1:0;
    run.roots-=result.rootsCut;
  }
  const fireMove=actor&&BY_ID[actor].element==='fire'&&damage>0;
  const thaw=action==='skill'||fireMove||result.cleanse||action==='guard'&&beat.grade==='perfect';
  if(frozenBefore){if(thaw){run.mechanics.frozen=0;result.thawed=true;}else{result.energyBlocked=Math.max(0,run.focus-focusBefore);run.focus=Math.min(run.focus,focusBefore);run.mechanics.frozen=Math.max(0,frozenBefore-1);}}
  result.interrupted=bossId(run)==='frost'&&intent.id==='blizzard'&&(action==='skill'||fireMove||result.disrupt);
  run.turn++;
  if(run.squad){result.squadImpact=structuredClone(run.squad);result.squadImpactEventCount=result.unitEvents.length;}
  if(run.enemyHp<=0&&!revive())return {...result,...finishBoss(state,'victory',now)};
  if(!beat.staggered&&!result.revived&&intent.id==='ward'&&run.phase<3)run.shield=Math.min(200,run.shield+24+run.tier*6);
  if(!beat.staggered&&!result.interrupted&&!result.revived&&intent.id==='mend'){if(run.mechanics.coreHp>0){result.enemyHeal=healSquadEnemies(run,run,Math.min(enemy.maxHp-run.enemyHp,Math.round(enemy.maxHp*.1)),result);}}
  if(!beat.staggered&&!result.interrupted&&!result.revived&&!['charge','mend'].includes(intent.id)){
    let incoming=Math.round((8+10/Math.max(.25,ratio))*(.95+random(run)*.1)*(intent.id==='heavy'?(bossId(run)==='treant'?2.3:bossId(run)==='frost'?2:2.1):intent.id==='blizzard'?1.7:intent.id==='ward'?.55:1)*(run.phase===3?1.3:1)*(1+Math.max(0,run.turn-12)*.06));
    finishOrder(run,order,result,incoming>0&&squadCanAttack(run,run));incoming=Math.round(incoming*plan.incoming);
    if(action==='guard')incoming=Math.round(incoming*beat.guard);
    incoming=Math.round(incoming*(1-tactics.weaken.amount/100));result.absorbed=run.squad?0:Math.min(tactics.ward,incoming);tactics.ward-=result.absorbed;
    result.incoming=receiveSquadDamage(run,run,incoming-result.absorbed,{order,result,intent});result.reflected=hitSquadEnemies(run,run,tactics.counter.amount,{reflected:true,order,result});
  }else if(run.squad)receiveSquadDamage(run,run,0,{result,skip:true});
  if(bossId(run)==='frost'&&intent.id==='blizzard'&&!beat.staggered&&!result.interrupted&&!result.revived&&!thaw){run.mechanics.frozen=2;result.frozenApplied=2;}
  result.frozenAfter=run.mechanics?.frozen||0;
  applyGuardSet(tactics,run.members,result,run.maxHp);
  endTacticTurn(tactics,action.startsWith('awaken:')?null:actor);
  if(run.hp<=0||run.turn>=60)return {...result,...finishBoss(state,'defeat',now)};
  if(run.enemyHp<=0&&!revive())return {...result,...finishBoss(state,'victory',now)};
  advancePhase(run);
  if(run.roots){result.enemyHeal=healSquadEnemies(run,run,Math.min(enemy.maxHp-run.enemyHp,run.roots*(5+run.tier)),result);}
  tactics.last=`${actor?`${BY_ID[actor].name} · ${result.skill||BY_ID[actor].skill}`:action==='charge'?'Lấy đà':action==='guard'?'Phòng thủ':action==='skill'?'Tuyệt kỹ hợp lực':'Tấn công'}${result.combo?` · ${result.combo}!`:''} · gây ${result.damage}${result.heal?` · hồi ${result.heal}`:''}${result.ward?` · tạo ${result.ward} khiên`:''}${result.rootsCut?` · chặt ${result.rootsCut} rễ`:''} · nhận ${result.incoming} sát thương.`;
  tactics.last=(tactics.last+setCaption(result)+rhythmCaption(beat)+orderCaption(result)+bossMechanicCaption(result)).slice(0,285);log(run,tactics.last);if(run.squad)result.squadAfter=structuredClone(run.squad);return result;
}

export function bossMechanicCaption(r){return `${r.coreDamage?` · Lõi -${r.coreDamage}`:''}${r.coreBroken?' · Lõi tắt: chặn tái sinh!':''}${r.revived?` · Tái sinh +${r.revived} HP`:''}${r.interrupted?' · Ngắt bão!':''}${r.thawed?' · Tan băng':''}${r.frozenApplied?' · Khóa tích năng lượng 2 lượt':''}${r.energyBlocked?` · Băng khóa ${r.energyBlocked} năng lượng`:''}`; }
