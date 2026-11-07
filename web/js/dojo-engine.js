import { newGame, makePet, combatMembers, teamPower, startExpedition, chooseRoute, battleTurn, grant } from './engine.js';
import { startBoss, bossBattleTurn } from './boss-engine.js';
import { newEnemyAI, enemyIntent } from './enemy-tactics.js';
import { bossIntent } from './boss-state.js';
import { formation, newTactics } from './tactics.js';
import { offensiveMove } from './combat-orders.js';
import { skillPaths } from './skill-paths.js';
import { newDojoMetrics } from './dojo-state.js';
import { CHALLENGE_BY_ID, dojoDefinition, DOJO_MILESTONES, totalStars, challengeUnlocked, goalState, firstClearReward } from './dojo-data.js';
import { awakeningGate } from './awakening-data.js';
import {newSquad,startSquadFight} from './squad-state.js';
import {exploreEnemies,guardianEnemy} from './combat-team.js';

function random(run){let n=run.rng;n^=n<<13;n^=n>>>17;n^=n<<5;run.rng=n>>>0;return run.rng/0x100000000;}
const snapshot=run=>run.mode==='boss'?run.sandbox.boss.run:run.sandbox.expedition?.battle;
export const dojoMembers=run=>run.mode==='boss'?run.sandbox.boss.run.members:run.sandbox.expedition.members;
export function dojoHealth(run){const r=run.mode==='boss'?run.sandbox.boss.run:run.sandbox.expedition;return {hp:r?.hp||0,maxHp:run.mode==='boss'?150:100};}
export function dojoIntent(run){const b=snapshot(run);return run.mode==='boss'?bossIntent(b):enemyIntent(b,{id:(b.round+1)%3===0?'heavy':'strike',danger:(b.round+1)%3===0,name:(b.round+1)%3===0?'Đòn dồn sức':'Đòn thăm dò',text:(b.round+1)%3===0?'Đòn mạnh ×1,8. Đỡ chuẩn hoặc Phá thế để hóa giải.':'Một đòn thường. Quan sát để tích năng lượng và phản kích.',icon:'swords'});}
export function startDojo(state,kind,id,paths={},now=Date.now()){
  if(state.tower?.run)return {error:'Kết thúc chuyến leo tháp trước khi vào Võ đường nhé.'};
  if(state.dojo.run)return {error:'Kết thúc buổi tập hiện tại trước khi chọn trận mới nhé.'};
  const def=dojoDefinition({kind,id});
  if(!def)return {error:'Không tìm thấy bài tập này.'};
  if(kind==='challenge'&&!challengeUnlocked(state,id))return {error:'Thắng ải trước để mở bài thử thách này.'};
  if(kind==='awakening'&&awakeningGate(state,id))return {error:awakeningGate(state,id)};
  if(!paths||typeof paths!=='object'||Array.isArray(paths)||Object.entries(paths).some(([pet,branch])=>!state.team.includes(pet)||branch!==null&&!skillPaths(pet).some(p=>p.id===branch)))return {error:'Nhánh thử kỹ năng không hợp lệ.'};
  const sandbox=newGame(now);delete sandbox.dojo;sandbox.level=10;sandbox.resources.food=1000;
  let members;
  if(kind==='practice'){
    sandbox.pets=structuredClone(state.pets);sandbox.team=[...state.team];sandbox.forge=structuredClone(state.forge);sandbox.awakening=structuredClone(state.awakening);if(state.battleFormation)sandbox.battleFormation=structuredClone(state.battleFormation);members=combatMembers(state);
    for(const m of members)if(Object.hasOwn(paths,m.id)){
      m.training={branch:paths[m.id],rank:paths[m.id]?3:0};
      const pet=sandbox.pets.find(p=>p.id===m.id);pet.level=Math.max(pet.level,15);pet.training={...m.training};
    }
  }else{
    sandbox.team=[...def.team];sandbox.pets=def.team.map(pet=>({...makePet(pet,now),level:15,training:{branch:def.paths?.[pet]||null,rank:def.paths?.[pet]?3:0}}));
    if(kind==='awakening')sandbox.pets.find(p=>p.id===id).training=structuredClone(state.pets.find(p=>p.id===id).training);
    members=combatMembers(sandbox).map(m=>({...m,power:def.power}));
  }
  const run={kind,id,mode:def.mode,sandbox,started:now,rng:0x5eeda11,metrics:newDojoMetrics()};
  const enemy=kind==='practice'?id:def.enemy;
  if(def.mode==='boss'){
    for(const p of [sandbox.boss,sandbox.boss.rivals.frost]){p.best=1;p.wins=1;p.clears[0]=1;}
    const result=startBoss(sandbox,1,()=>random(run),now,enemy);if(result.error)return result;
    sandbox.boss.run.members=members;sandbox.boss.run.tactics=newTactics(members);sandbox.boss.run.tactics.ward=Math.round(150*formation(members).openingWard);sandbox.boss.run.focus=kind==='practice'?3:def.focus;
  }else{
    startExpedition(sandbox,'forest',()=>random(run),now);chooseRoute(sandbox,0,()=>random(run));
    const ex=sandbox.expedition,b=ex.battle;ex.members=members;ex.power=kind==='practice'?teamPower(state).power:Math.round(def.power*3*1.12);
    b.enemyAI=newEnemyAI(enemy);b.enemy=def.name;b.power=72;b.tactics=newTactics(members);b.tactics.ward=Math.round(100*formation(members).openingWard);b.focus=kind==='practice'?3:def.focus;
  }
  // Existing goal puzzles keep their tuned combat rules. Free practice uses the
  // same per-creature health and targeting rules as a new real expedition.
  const host=def.mode==='boss'?sandbox.boss.run:sandbox.expedition;
  if(kind!=='practice')delete host.squad;
  else{host.squad=newSquad(members,def.mode==='boss'?150:100,host.hp,state.battleFormation?.rows);startSquadFight(host,def.mode==='boss'?guardianEnemy(host):exploreEnemies(host),def.mode==='boss'?host.enemyHp:100,def.mode==='boss'?150:100,state.battleFormation?.rows);}
  state.dojo.run=run;state.dojo.lastResult=null;return {run};
}
function finish(state,status,now){
  const run=state.dojo.run,m=run.metrics,members=dojoMembers(run),health=dojoHealth(run);
  let stars=0,newStars=0,first=false,reward={};
  if(run.kind==='challenge'&&status==='victory'){
    const def=CHALLENGE_BY_ID[run.id],old=state.dojo.records[run.id];stars=def.goals.reduce((mask,g,i)=>mask|(goalState(g,m,status).status?1<<i:0),0);
    newStars=stars&~(old?.stars||0);first=!old;state.dojo.records[run.id]={stars:stars|(old?.stars||0),wins:Math.min(99999999,(old?.wins||0)+1),bestTurns:Math.min(old?.bestTurns||60,m.turns)};
    if(first){reward=firstClearReward(run.id);grant(state,reward);}
  }
  const trialCleared=run.kind==='awakening'&&status==='victory'&&dojoDefinition(run).goals.every(g=>goalState(g,m,status).status);
  if(trialCleared){const old=state.awakening.trials[run.id];state.awakening.trials[run.id]={wins:Math.min(99999999,(old?.wins||0)+1),bestTurns:Math.min(old?.bestTurns||60,m.turns)};}
  const result={kind:run.kind,id:run.id,status,team:members.map(m=>m.id),actors:Object.fromEntries(members.map(m=>[m.id,structuredClone(m)])),metrics:structuredClone(m),stars,newStars,first,reward,hp:health.hp,maxHp:health.maxHp,time:now,...(run.kind==='awakening'?{trialCleared}: {})};
  state.dojo.lastResult=result;state.dojo.run=null;return {finished:true,dojoResult:result};
}
export function stopDojo(state,now=Date.now()){
  if(!state.dojo.run)return {error:'Chưa có buổi tập đang mở.'};return finish(state,'stopped',now);
}
export function dojoBattleTurn(state,action,now=Date.now(),grade='auto'){
  const run=state.dojo.run;if(!run)return {error:'Chưa có buổi tập đang mở.'};
  // Real combat rules execute on a disposable host. Only arena progress and
  // bounded first-clear rewards reach the player's real save.
  const before=snapshot(run),intent=dojoIntent(run),members=structuredClone(dojoMembers(run)),health=dojoHealth(run),tick=before.tactics.burn.turns?before.tactics.burn.amount:0;
  const result=run.mode==='boss'?bossBattleTurn(run.sandbox,action,now,grade):battleTurn(run.sandbox,action,()=>random(run),grade);
  if(result.error)return result;
  const m=run.metrics,move=typeof action==='string'?action:action.move;
  const dealt=(result.damage||0)+(result.coreDamage||0)+(result.reflected||0);
  m.turns++;m.damage+=dealt;m.maxHit=Math.max(m.maxHit,dealt);m.incoming+=result.incoming||0;m.healed+=result.heal||0;m.ward+=result.ward||0;
  m.parries+=+!!result.strategy?.parried;m.ripostes+=+!!result.strategy?.riposteUsed;m.combos+=+!!result.combo;m.interrupts+=+!!result.interrupted;
  m.armorPierces+=+(intent.id==='counter'&&offensiveMove(move,members)&&result.damage>tick&&!result.armorBlocked);
  m.armorCounters+=result.enemyCounter||0;m.spellHits+=+(intent.id==='spell'&&!result.interrupted&&!result.rhythm?.staggered&&(result.incoming||result.absorbed)>0);
  m.rootsCut+=result.rootsCut||0;if(result.coreBroken&&!m.coreBreakTurn)m.coreBreakTurn=m.turns;
  m.revives+=+!!result.revived;m.frozen+=+!!result.frozenApplied;m.staggers+=+!!result.rhythm?.staggered;
  if(result.actor){m.skills++;const a=m.actors[result.actor]||={casts:0,damage:0};a.casts++;a.damage+=Math.max(0,result.damage-tick)+(result.coreDamage||0);}
  const won=!!(result.won||result.result?.status==='victory'||result.success===true),lost=result.result?.status==='defeat'||result.success===false;
  const hp=lost||m.turns>=60&&!won?0:run.mode==='boss'?(run.sandbox.boss.run?.hp??Math.min(health.maxHp,health.hp+(result.heal||0)-(result.incoming||0))):run.sandbox.expedition?.hp??Math.max(0,health.hp+(result.heal||0)-(result.incoming||0));
  m.hpPercent=Math.floor(hp/health.maxHp*100);
  if(won||lost||m.turns>=60){
    // Finishing engines dispose of their runs; retain the final position just
    // long enough to build a report, then discard this entire sandbox.
    if(run.mode==='boss'&&!run.sandbox.boss.run)run.sandbox.boss.run={members,hp};
    if(run.mode==='explore'&&!run.sandbox.expedition)run.sandbox.expedition={members,hp};
    if(run.mode==='boss')run.sandbox.boss.run.hp=hp;else run.sandbox.expedition.hp=hp;
    return {...result,...finish(state,won?'victory':'defeat',now)};
  }
  return result;
}
export function claimDojoMilestone(state,stars){
  const m=DOJO_MILESTONES.find(m=>m.stars===stars),d=state.dojo;
  if(!m||d.claimed.includes(stars)||totalStars(state)<stars)return {error:'Chưa đủ sao hoặc mốc này đã nhận rồi.'};
  d.claimed.push(stars);grant(state,m.reward);
  if(m.cosmetic==='reader'||m.cosmetic==='master')d.cosmetics.title=m.cosmetic;else if(m.cosmetic)d.cosmetics[m.cosmetic]=true;return m;
}
export function setDojoCosmetic(state,key,value){
  const d=state.dojo,required=key==='title'?value==='reader'?6:value==='master'?24:value===null?0:-1:key==='aura'&&typeof value==='boolean'?12:key==='decoration'&&typeof value==='boolean'?18:-1;
  if(required<0||required>0&&!d.claimed.includes(required))return {error:'Hoàn thành mốc sao tương ứng để mở món này.'};
  d.cosmetics[key]=value;return {cosmetics:d.cosmetics};
}
