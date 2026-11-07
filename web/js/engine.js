import {newCampaign,validateCampaign,recordCampaignTurn,settleCampaign} from './campaign-state.js';
import {campaignBiome,campaignEvent,campaignStage} from './campaign-data.js';
import {campaignBossPhase} from './campaign-combat.js';
import {newShiny,validateShiny,rollShinyEgg,shinyExplorationReward} from './shiny.js';
import {newTower,validateTower} from './tower-state.js';
import { SPECIES, BY_ID, RARITIES, BUILDINGS, BIOMES, QUESTS, ELEMENTS, EVENTS } from './data.js';
import { BREED_RECIPES, FISH, FISH_BY_ID, FISH_SPOTS, FISH_MILESTONES } from './activities-data.js';
import { newRuins, validateRuins } from './ruins-state.js';
import { newTactics, formation, skillBlocked, startTacticTurn, endTacticTurn, castPetSkill, skillActor, validateTactics, applyGuardSet, setCaption } from './tactics.js';
import { newForge, validateForge, gearBonuses, validateMemberGear, equippedSet } from './forge-state.js';
import { newTraining, validateTraining } from './skill-paths.js';
import { newEnemyAI, validateEnemyAI, enemyIntent, enemyResponse, enemyCaption } from './enemy-tactics.js';
import { newBoss, validateBoss } from './boss-state.js';
import { newDojo, validateDojo } from './dojo-state.js';
import { newAwakening, validateAwakening, validateMemberAwakening } from './awakening-state.js';
import { newRhythm,validateRhythm,prepareRhythm,rhythmCaption,RHYTHM_GRADES } from './combat-rhythm.js';
import { newStrategy, validateStrategy, readOrder, beginOrder, orderRhythm, finishOrder, orderCaption } from './combat-orders.js';
import { validateCare } from './island-care.js';
import { newIslandLayout, validateLayout } from './island-layout.js';
import { newHabitat, validateHabitat } from './habitat-state.js';
import { newSquad,startSquadFight,validateSquad,validateCombatFormation } from './squad-state.js';
import { exploreEnemies } from './combat-team.js';
import {newAutoTactics,validateAutoTactics} from './auto-tactics.js';
import {newCombatJournal,validateCombatJournal,recordCombatTurn,retireCombatReport} from './combat-report.js';
import {forestWarning} from './forest-encounter.js';
import {reefEvent,reefWarning,REEF_PATROLS} from './reef-encounter.js';
import {volcanoEvent,volcanoWarning,volcanoArmorHit,volcanoCaption,validateVolcano,VOLCANO_ARMOR,VOLCANO_PATROLS} from './volcano-encounter.js';
import { healSquad,healSquadSkill,hitSquadEnemies,receiveSquadDamage,receiveTerrainDamage,castSquadSkill,squadDamageScale,squadMembers,squadCanAttack,endSquadBattle } from './squad-combat.js';
import { newSeasonal, validateSeasonal } from './seasonal-engine.js';
export {setCombatRow} from './squad-state.js';
export { patPet } from './island-care.js';
export { refreshSeason, seasonalMetric, seasonalMissions, seasonalChallenges, seasonalSummary, seasonDay, seasonWeek, seasonRemaining, claimSeasonalMission, claimSeasonalChallenge, claimSeasonalMilestone, buySeasonalShop, startNextSeason } from './seasonal-engine.js';

export const SAVE_KEY = 'spirit-isles-save-v1';
export const MAX_OFFLINE = 8 * 3600;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const pick = (list,rng) => list[Math.min(list.length-1,Math.floor(rng()*list.length))];
export function dayKey(now=Date.now()) { const d=new Date(now); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
export function makePet(species,now=Date.now()) { return {id:species,species,level:1,xp:0,bond:0,stars:0,shards:0,joined:now,training:newTraining(),awakened:false}; }
export function newActivities() {
  return {activitiesVersion:1,breeding:{total:0,egg:null},fishing:{level:1,xp:0,rod:1,total:0,streak:0,bestStreak:0,collection:{},bag:{},claimed:[],session:null}};
}
export function newGame(now=Date.now()) {
  return {version:1,campaign:newCampaign(),autoTactics:newAutoTactics(),combatJournal:newCombatJournal(),islandLayout:newIslandLayout(),habitat:newHabitat(),seasonal:newSeasonal(now),created:now,lastSeen:now,xp:0,level:1,resources:{gold:1650,food:140,wood:65,crystals:300,tickets:10,essence:0},pets:[makePet('mossfox',now),makePet('axolotl',now),makePet('emberbird',now)],team:['mossfox','axolotl','emberbird'],buildings:{garden:{level:1,last:now},lodge:{level:1,last:now}},stats:{hatches:0,feeds:0,expeditions:0,builds:0,evolutions:0,fireflies:0},pity:0,srPity:0,shiny:newShiny(),claimed:[],daily:{date:dayKey(now),hatches:0,feeds:0,expeditions:0,claimed:[],checkin:false},streak:0,lastCheckin:'',clears:{},expedition:null,history:[],settings:{sound:true,motion:true},tutorial:false,...newActivities(),ruins:newRuins(),forge:newForge(),boss:newBoss(),dojo:newDojo(),awakening:newAwakening(),tower:newTower(now)};
}
export function addXP(state,amount) {
  state.xp+=amount;
  const levels=[];
  while(state.level<50 && state.xp>=state.level*110) { state.xp-=state.level*110;state.level++;grant(state,{gold:100+state.level*40,tickets:1});levels.push(state.level); }
  if(state.level===50)state.xp=Math.min(state.xp,5500);
  return levels;
}
export function grant(state,reward) { for(const [k,v] of Object.entries(reward||{})) if(k in state.resources && Number.isFinite(v)) state.resources[k]=clamp(state.resources[k]+Math.floor(v),0,99999999); }
export function canPay(state,cost) { return Object.entries(cost).every(([k,v])=>Number.isFinite(v) && v>=0 && state.resources[k]>=v); }
export function pay(state,cost) { if(!canPay(state,cost)) return false;for(const [k,v] of Object.entries(cost)) state.resources[k]-=v;return true; }
export function refreshDaily(state,now=Date.now()) { if(state.daily.date!==dayKey(now)) state.daily={date:dayKey(now),hatches:0,feeds:0,expeditions:0,claimed:[],checkin:false}; }
export function petPower(pet,state=null) { return Math.round(RARITIES[BY_ID[pet.species].rarity].power*(1+(pet.level-1)*0.16)*(1+pet.stars*0.38)*(1+pet.bond*0.004)*(1+gearBonuses(state,pet.id).power/100)*(pet.awakened?1.15:1)); }
export function combatMembers(state){return state.team.map(id=>{const pet=state.pets.find(p=>p.id===id),g=gearBonuses(state,id),set=equippedSet(state,id);return {id,power:petPower(pet,state),...(pet.shiny&&!pet.shinyOff?{shiny:true}:{}),...(pet.awakened?{awakened:true}:{}),...(pet.training?.rank?{training:{...pet.training}}:{}),...(g.heal||g.ward||set?{gear:{heal:g.heal,ward:g.ward,...(set?{set}:{})}}:{})};});}
export function teamPower(state,biome) {
  const pets=state.team.map(id=>state.pets.find(p=>p.id===id)).filter(Boolean);
  const elements=pets.map(p=>BY_ID[p.species].element);
  let power=pets.reduce((sum,p)=>sum+petPower(p,state)*(biome && ELEMENTS[BY_ID[p.species].element].strong===biome.element?1.3:1),0);
  const synergy=elements.length>=3 && new Set(elements).size===1 ? 'Đồng điệu · +20% sức mạnh' : new Set(elements).size>=3 ? 'Đa dạng · +12% sức mạnh' : 'Kết bạn · +5% sức mạnh';
  power*=new Set(elements).size===1 && elements.length>=3?1.2:new Set(elements).size>=3?1.12:1.05;
  return {power:Math.round(power),synergy};
}
export function hatch(state,count=1,type='nature',rng=Math.random,now=Date.now()) {
  if(![1,10].includes(count) || !['nature','star'].includes(type)) return {error:'Lựa chọn ấp trứng không hợp lệ.'};
  const cost=type==='star'?{crystals:150*count}:state.resources.tickets>=count?{tickets:count}:{crystals:80*count};
  if(!pay(state,cost)) return {error:'Chưa đủ vé hoặc ngọc sao. Thám hiểm và làm nhiệm vụ để kiếm thêm nhé!'};
  refreshDaily(state,now);
  const results=[];
  for(let i=0;i<count;i++) {
    state.pity++;state.srPity++;
    const roll=rng()*100;
    let rarity=type==='star'?(roll<6?'SSR':roll<40?'SR':'R'):(roll<3?'SSR':roll<18?'SR':roll<50?'R':'N');
    if(state.pity>=50) rarity='SSR';
    else if(state.srPity>=10 && ['N','R'].includes(rarity)) rarity='SR';
    if(rarity==='SSR') state.pity=0;
    if(['SR','SSR'].includes(rarity)) state.srPity=0;
    const species=pick(SPECIES.filter(s=>s.rarity===rarity&&s.source!=='breeding'),rng);
    const existing=state.pets.find(p=>p.species===species.id);
    if(existing) { existing.shards+=RARITIES[rarity].shards;grant(state,{essence:rarity==='SSR'?5:rarity==='SR'?2:1}); }
    else state.pets.push(makePet(species.id,now));
    results.push({species:species.id,isNew:!existing,shards:existing?RARITIES[rarity].shards:0});
  }
  state.stats.hatches+=count;state.daily.hatches+=count;addXP(state,count*12);state.history.unshift({type:'hatch',time:now,text:`Ấp ${count} trứng · ${results.filter(r=>r.isNew).length} bạn mới`});state.history=state.history.slice(0,40);
  const shinyResults=[];
  for(let i=0;i<count;i++){const bonus=rollShinyEgg(state,rng,now);if(bonus)shinyResults.push(bonus);}
  return {results,cost,shinyResults};
}
export function feed(state,id,now=Date.now()) {
  const pet=state.pets.find(p=>p.id===id);if(!pet) return {error:'Không tìm thấy linh thú.'};
  if(pet.level>=30) return {error:'Linh thú đã đạt cấp tối đa!'};
  const cost={food:8+pet.level*2};if(!pay(state,cost)) return {error:'Hết quả mọng rồi. Thu hoạch vườn hoặc đi thám hiểm nhé!'};
  refreshDaily(state,now);pet.xp+=35;pet.bond=clamp(pet.bond+3,0,100);let leveled=false;
  while(pet.level<30 && pet.xp>=pet.level*45) {pet.xp-=pet.level*45;pet.level++;leveled=true;}
  if(pet.level>=30)pet.xp=0;
  state.stats.feeds++;state.daily.feeds++;addXP(state,8);return {pet,leveled,cost};
}
export function evolveCost(pet) { return {essence:8+pet.stars*12,gold:200*(pet.stars+1)}; }
export function evolve(state,id) {
  const pet=state.pets.find(p=>p.id===id);if(!pet) return {error:'Không tìm thấy linh thú.'};
  if(pet.stars>=3) return {error:'Đã tiến hóa tối đa!'};
  const requiredLevel=5+pet.stars*5;
  if(pet.level<requiredLevel) return {error:`Cần cấp ${requiredLevel} để tiến hóa.`};
  const cost=evolveCost(pet);const shardDiscount=Math.min(pet.shards,cost.essence);cost.essence-=shardDiscount;
  if(!pay(state,cost))return {error:'Chưa đủ tinh hoa hoặc vàng để tiến hóa.'};
  pet.shards-=shardDiscount;pet.stars++;state.stats.evolutions++;addXP(state,50);return {pet};
}
export function buildingCost(state,id) { const b=BUILDINGS.find(b=>b.id===id);if(!b)return null;const level=state.buildings[id]?.level||0;return {gold:Math.round(b.gold*Math.pow(1.65,level)),wood:Math.round(b.wood*Math.pow(1.5,level))}; }
export function upgradeBuilding(state,id,now=Date.now()) {
  const b=BUILDINGS.find(b=>b.id===id);if(!b)return {error:'Công trình không hợp lệ.'};
  const current=state.buildings[id];if(state.level<b.unlock)return {error:`Mở ở cấp đảo ${b.unlock}.`};if(current?.level>=b.max)return {error:'Công trình đã đạt cấp tối đa.'};
  if(!canPay(state,buildingCost(state,id)))return {error:'Chưa đủ vàng hoặc gỗ.'};
  if(current) collect(state,now,id);
  pay(state,buildingCost(state,id));state.buildings[id]={level:(current?.level||0)+1,last:now};state.stats.builds++;addXP(state,30);return {building:b,level:state.buildings[id].level};
}
export function productionBonus(state,b) {
  const match={garden:'Vườn quả',lodge:'Nhà cây',sawmill:'Xưởng gỗ',observatory:'Đài sao',sanctuary:'Đền cộng hưởng'}[b.id];
  return 1+Math.min(0.75,state.pets.reduce((n,p)=>{const perk=BY_ID[p.species].perk;return n+(perk.startsWith(match)?Number(perk.match(/\d+/)?.[0]||0)/100:0);},0));
}
export function pendingProduction(state,now=Date.now(),id=null) {
  const rewards={};
  for(const b of BUILDINGS) { const built=state.buildings[b.id];if(!built || (id && b.id!==id)) continue;
    const seconds=clamp((now-built.last)/1000,0,MAX_OFFLINE);const cycles=Math.floor(seconds/b.interval);
    if(cycles>0) rewards[b.resource]=(rewards[b.resource]||0)+Math.floor(cycles*b.amount*built.level*productionBonus(state,b));
  }return rewards;
}
export function collect(state,now=Date.now(),id=null) {
  const rewards=pendingProduction(state,now,id);grant(state,rewards);
  for(const b of BUILDINGS) {const built=state.buildings[b.id];if(!built || (id && b.id!==id))continue;const elapsed=Math.max(0,(now-built.last)/1000);const cycles=Math.floor(Math.min(elapsed,MAX_OFFLINE)/b.interval);if(cycles>0)built.last=now-(Math.min(elapsed,MAX_OFFLINE)%b.interval)*1000;}
  return rewards;
}
export function questProgress(state,quest) { return quest.metric==='species'?state.pets.length:quest.metric==='breeds'?state.breeding.total:quest.metric==='catches'?state.fishing.total:quest.metric==='fishSpecies'?Object.keys(state.fishing.collection).length:state.stats[quest.metric]||0; }
export function claimQuest(state,id) {const q=QUESTS.find(q=>q.id===id);if(!q || state.claimed.includes(id) || questProgress(state,q)<q.target)return {error:'Nhiệm vụ chưa hoàn thành hoặc đã nhận.'};state.claimed.push(id);grant(state,q.reward);addXP(state,q.xp);return {reward:q.reward};}
export const DAILY_QUESTS=[{id:'feed',title:'Chăm sóc bạn nhỏ',metric:'feeds',target:3,reward:{food:30,tickets:1}},{id:'explore',title:'Một chuyến phiêu lưu',metric:'expeditions',target:1,reward:{crystals:30,tickets:1}},{id:'hatch',title:'Gõ cửa điều kỳ diệu',metric:'hatches',target:3,reward:{gold:120,tickets:1}}];
export function claimDaily(state,id,now=Date.now()) {refreshDaily(state,now);const q=DAILY_QUESTS.find(q=>q.id===id);if(!q||state.daily.claimed.includes(id)||state.daily[q.metric]<q.target)return {error:'Chưa thể nhận thưởng.'};state.daily.claimed.push(id);grant(state,q.reward);addXP(state,20);return {reward:q.reward};}
export function checkIn(state,now=Date.now()) {
  refreshDaily(state,now);if(state.daily.checkin)return {error:'Hôm nay đã nhận quà rồi. Hẹn bạn ngày mai!'};
  const yesterday=dayKey(now-86400000);state.streak=state.lastCheckin===yesterday?state.streak+1:1;state.lastCheckin=dayKey(now);state.daily.checkin=true;
  const day=(state.streak-1)%7;const reward=day===6?{tickets:5,essence:8}:day===2?{tickets:2,crystals:80}:{tickets:1,food:25+day*5,gold:80+day*20};grant(state,reward);return {reward,day:day+1};
}
export function toggleTeam(state,id) {if(state.expedition||state.ruins?.run||state.boss?.run||state.tower?.run)return {error:'Đội đang thám hiểm. Hãy kết thúc chuyến đi trước nhé.'};if(!state.pets.some(p=>p.id===id))return {error:'Bạn chưa có linh thú này.'};if(state.team.includes(id)){if(state.team.length===1)return {error:'Đội cần ít nhất một người bạn.'};state.team=state.team.filter(x=>x!==id);}else{if(state.team.length>=3)return {error:'Đội tối đa 3 linh thú. Bỏ chọn một bạn trước nhé.'};state.team.push(id);}return {team:state.team};}
export function setTeamSlot(state,slot,id) {
  if(state.expedition||state.ruins?.run||state.boss?.run||state.tower?.run)return {error:'Kết thúc chuyến đi trước khi đổi đội nhé.'};
  if(!Number.isInteger(slot)||slot<0||slot>2||slot>state.team.length||!state.pets.some(p=>p.id===id))return {error:'Vị trí hoặc linh thú không hợp lệ.'};
  if(state.team.includes(id))return {error:'Người bạn này đã ở trong đội.'};
  state.team[slot]=id;return {team:state.team};
}
export function startExpedition(state,id,rng=Math.random,now=Date.now()) {
  if(state.tower?.run)return {error:'Đội đang leo Tháp Vô Tận. Hãy kết thúc chuyến leo trước nhé.'};
  if(state.boss?.run)return {error:'Đội đang săn thủ vệ. Kết thúc trận trước nhé.'};
  if(state.ruins?.run)return {error:'Đội đang khám phá Phế Tích Cổ. Hãy kết thúc chuyến đi trước nhé.'};
  if(state.expedition)return {error:'Bạn đang có một chuyến đi chưa kết thúc.'};const biome=BIOMES.find(b=>b.id===id);if(!biome || state.level<biome.unlock)return {error:'Vùng đất này chưa mở khóa.'};
  if(!state.team.length)return {error:'Hãy chọn đội thám hiểm.'};
  const depth=state.clears[id]||0;const scale=1+Math.min(depth,30)*0.07;
  if(!pay(state,{food:8+biome.unlock*2}))return {error:'Cần thêm quả mọng làm hành trang.'};
  state.expedition={biome:id,stage:0,hp:100,focus:0,power:teamPower(state,biome).power,members:combatMembers(state),threat:Math.round(biome.power*scale),scale,loot:{},event:Math.floor(rng()*EVENTS.length),battle:null,started:now,log:['Chuyến đi bắt đầu. Những điều tốt đẹp đang chờ phía trước.']};state.expedition.squad=newSquad(state.expedition.members,100,100,state.battleFormation?.rows);return {expedition:state.expedition};
}
export function chooseRoute(state,choice,rng=Math.random) {
  const ex=state.expedition;if(!ex || ex.battle)return {error:'Không thể chọn đường lúc này.'};const biome=campaignBiome(ex),chapterStage=campaignStage(ex.campaign?.id);
  if(ex.stage>=biome.stages)return {error:'Đã đến cuối hành trình.'};
  const boss=ex.stage===biome.stages-1&&(!chapterStage||chapterStage.boss);
  if(chapterStage&&choice!==0)return {error:'Lựa chọn không hợp lệ.'};
  if(['reef','volcano'].includes(ex.biome)&&(!Number.isInteger(choice)||choice<0||choice>(boss?0:1)))return {error:'Lựa chọn không hợp lệ.'};
  const event=campaignEvent(ex)||volcanoEvent(ex)||reefEvent(ex)||EVENTS[ex.event];
  if(!boss){const option=event.choices[choice];if(!option)return {error:'Lựa chọn không hợp lệ.'};if(option.cost&&!pay(state,option.cost))return {error:'Chưa đủ tài nguyên cho lựa chọn này.'};for(const [k,v] of Object.entries(option.reward||{}))ex.loot[k]=(ex.loot[k]||0)+v;healSquad(ex,option.heal||0,{maxHp:100});ex.log.unshift(option.text);}
  const enemyPower=Math.round(ex.threat*(boss?1:0.58+ex.stage*0.08)*(boss?1:event.choices[choice].threat||1));
  const tactics=newTactics(ex.members);tactics.ward=Math.round(100*formation(ex.members).openingWard);
  const kind=['reef','volcano'].includes(ex.biome)||ex.stage===0&&ex.biome==='forest'?'plain':['armored','caster','berserker'][(ex.stage+(BIOMES.indexOf(biome)))%3];
  ex.battle={enemyAI:newEnemyAI(kind),enemy:boss?biome.boss:ex.biome==='volcano'?VOLCANO_PATROLS[ex.stage%VOLCANO_PATROLS.length]:ex.biome==='reef'?REEF_PATROLS[ex.stage%REEF_PATROLS.length]:['Bụi Gai Tinh Nghịch','Tinh Linh Đi Lạc','Kẻ Giữ Đường'][ex.stage%3],hp:100,maxHp:100,shield:0,power:enemyPower,round:0,focus:ex.focus||0,guarding:false,boss,tactics,rhythm:newRhythm(),strategy:newStrategy(),...(ex.biome==='volcano'?{volcano:{version:1,armor:boss?VOLCANO_ARMOR:0,opening:0}}:{})};
  if(chapterStage){ex.battle.campaignPhase=1;if(!boss)ex.battle.enemy=`Đội canh · ${chapterStage.name}`;}
  if(!ex.squad)ex.squad=newSquad(ex.members,100,Math.round(ex.hp),state.battleFormation?.rows);ex.hp=ex.squad.allies.reduce((n,u)=>n+u.hp,0);
  startSquadFight(ex,exploreEnemies(ex),100,100,state.battleFormation?.rows);
  return {battle:ex.battle};
}
export function battleTurn(state,action='attack',rng=Math.random,grade='auto') {
  return recordCombatTurn(state,'explore',action,()=>battleTurnCore(state,action,rng,grade));
}
function battleTurnCore(state,action='attack',rng=Math.random,grade='auto') {
  const order=readOrder(action,state.expedition?.battle,{members:state.expedition?.members,squad:state.expedition?.squad});if(order.error)return order;action=order.move;
  const ex=state.expedition;const b=ex?.battle;const actor=skillActor(action);
  if(!b || !['attack','skill','guard','charge','evade'].includes(action)&&!actor)return {error:'Không có trận chiến.'};
  const warning=volcanoWarning(ex)||forestWarning(ex)||reefWarning(ex),evading=action==='evade';
  if(evading&&(!warning||grade!=='auto'))return {error:'Chỉ né khi có cảnh báo nguy hiểm. Né dùng một lượt, không canh nhịp.'};
  if(action==='skill'&&b.focus<2)return {error:'Tuyệt kỹ cần 2 năng lượng. Đánh thường hoặc phòng thủ để tích nhé!'};
  if(!RHYTHM_GRADES.includes(grade))return {error:'Nhịp ra chiêu không hợp lệ.'};
  const members=ex.members||state.team.map(id=>({id,power:petPower(state.pets.find(p=>p.id===id))}));
  if(actor){const error=skillBlocked(b.tactics,actor,b.focus,members,action.startsWith('awaken:'));if(error)return {error};}
  const tactics=b.tactics||=newTactics(members);const tick=startTacticTurn(tactics);
  const result={damage:0,incoming:0,heal:0,absorbed:0,reflected:0,ward:0,...(ex.squad?{actors:squadMembers(ex).map(m=>m.id),unitEvents:[]}: {})};
  const regenHeal=healSquad(ex,tick.heal,{maxHp:100,target:ex.squad?.effects.regen,result,strict:true});result.heal=regenHeal;
  const tickDamage=hitSquadEnemies(ex,b,tick.damage,{tick:true,result});result.damage=tickDamage;
  const roundBefore=b.round;let recorded=false;const record=()=>{if(!recorded){recorded=true;recordCampaignTurn(ex,result,b.round>roundBefore?action:'');}};
  const win=()=>{record();if(ex.squad)result.squadAfter=structuredClone(ex.squad);endSquadBattle(ex);const earned=ex.campaign?{}:{gold:Math.round(15*ex.scale),food:5};for(const [k,v] of Object.entries(earned))ex.loot[k]=(ex.loot[k]||0)+v;ex.stage++;ex.focus=b.focus;ex.battle=null;ex.event=Math.floor(rng()*EVENTS.length);ex.log.unshift(`Đã vượt qua ${b.enemy} · giữ ${ex.focus} năng lượng cho chặng tiếp theo.`);ex.log=ex.log.slice(0,6);if(ex.stage>=campaignBiome(ex).stages)return {...result,...finishExpedition(state,true,rng)};return {...result,won:true};};
  if(tickDamage)campaignBossPhase(ex,b,result);
  if(b.hp<=0)return win();
  const plan=beginOrder(b,order,members),beat=orderRhythm(b,order,grade);result.rhythm=beat;result.strategy=plan;
  const ratio=ex.power/Math.max(1,b.power),heavy=(b.round+1)%3===0;
  const intent=enemyIntent(b,{id:heavy?'heavy':'strike',name:heavy?'Đòn dồn sức':'Đòn thăm dò',text:heavy?'Đòn mạnh gấp 1,8 lần. Phòng thủ hoặc Phá thế để ngắt.':'Đòn tấn công thường.',icon:'swords',danger:heavy});b.round++;
  let damage=Math.round((20+Math.min(2.5,ratio)*12)*(0.9+rng()*0.2));let heal=0;
  if(actor){
    Object.assign(result,castSquadSkill(ex,tactics,actor,{members,baseDamage:damage,maxHp:100,support:beat.support,ultimate:action.startsWith('awaken:'),currentHp:ex.hp},order,result));
    damage=result.damage;result.damage=tickDamage;b.focus=clamp(b.focus-result.cost+result.gain,0,3);heal=result.heal;result.heal=0;
    if(result.breakShield)b.shield=0;
  }else if(action==='skill'){const elements=state.team.map(id=>BY_ID[id].element);damage=Math.round(damage*(1.75+(elements.includes('fire')?0.15:0)));b.focus-=2;b.shield=0;heal=8+(elements.includes('water')?8:0)+(elements.includes('leaf')?4:0);}
  else{b.focus=Math.min(3,b.focus+(evading?0:plan.energyGain));if(action==='guard')damage=Math.round(damage*0.3);if(action==='charge'||evading)damage=0;}
  if(!actor)heal=Math.round(heal*beat.support);
  result.heal=regenHeal+healSquadSkill(ex,heal,{maxHp:100,actor,target:actor?result.allyTarget:undefined,result,ultimate:action.startsWith('awaken:')});
  damage=Math.round(damage*(actor?1:squadDamageScale(ex))*(1+tactics.boost.amount/100)*beat.damage*plan.damage);
  const response=enemyResponse(b,intent,action,beat,result,damage);Object.assign(result,response);result.damage=tickDamage;damage=volcanoArmorHit(ex,response.damage,action,result);
  const blocked=result.pierce?0:Math.min(b.shield||0,damage);b.shield=(b.shield||0)-blocked;
  result.damage+=hitSquadEnemies(ex,b,damage-blocked,{order,actor,result,pierce:result.pierce});
  campaignBossPhase(ex,b,result);
  if(ex.squad){result.squadImpact=structuredClone(ex.squad);result.squadImpactEventCount=result.unitEvents.length;}
  if(b.hp<=0)return win();
  let incoming=Math.round((7+14/Math.max(0.25,ratio))*(0.85+rng()*0.25));const telegraph=intent.id==='heavy';if(telegraph)incoming=Math.round(incoming*1.8);
  result.enraged=b.enemyAI?.kind==='berserker'&&b.hp<=40;incoming=Math.round(incoming*response.multiplier*(result.enraged?1.6:1))+result.enemyCounter;
  if(response.enemyIdle)incoming=0;
  if(warning){incoming=Math.round(incoming*warning.multiplier);result[ex.biome==='volcano'?'volcanoWarning':warning.id==='tidal-wave'?'reefWarning':'forestWarning']=warning.id;if(evading){incoming=Math.round(incoming*warning.evadeFactor);result.evaded=true;if(warning.id==='tidal-wave'){b.rhythm.exposed=1;result.reefOpened=true;}}}
  finishOrder(b,order,result,incoming>0&&squadCanAttack(ex,b));incoming=Math.round(incoming*plan.incoming);if(action==='guard')incoming=Math.round(incoming*beat.guard);
  if(beat.staggered)incoming=0;
  incoming=Math.round(incoming*(1-tactics.weaken.amount/100));result.absorbed=ex.squad?0:Math.min(tactics.ward,incoming);tactics.ward-=result.absorbed;result.incoming=incoming-result.absorbed;
  result.incoming=receiveSquadDamage(ex,b,result.incoming,{order,result,intent,area:!!warning&&!warning.environment,skip:response.enemyIdle||beat.staggered});
  if(warning?.environment){result.lavaDamage=receiveTerrainDamage(ex,b,Math.round(14*(evading?warning.evadeFactor:1)*plan.incoming*(action==='guard'?beat.guard:1)),result);result.incoming+=result.lavaDamage;}
  result.reflected=response.enemyIdle||ex.squad&&!result.enemyAttacked?0:tactics.counter.amount;result.reflected=hitSquadEnemies(ex,b,result.reflected,{reflected:true,order,result});
  campaignBossPhase(ex,b,result);
  applyGuardSet(tactics,members,result,100);
  result.telegraph=telegraph;endTacticTurn(tactics,action.startsWith('awaken:')?null:actor);
  tactics.last=`${actor?`${BY_ID[actor].name} · ${result.skill||BY_ID[actor].skill}`:evading?`Né ${warning.name} · giảm 85% sát thương${result.reefOpened?' · Boss hở bụng, đòn sau +20%':''}`:action==='charge'?'Lấy đà':action==='skill'?'Tuyệt kỹ hợp lực':action==='guard'?'Phòng thủ':'Tấn công'}${result.combo?` · ${result.combo}!`:''} · gây ${result.damage}${result.heal?` · hồi ${result.heal}`:''}${result.ward?` · tạo ${result.ward} khiên`:''}${result.reflected?` · phản ${result.reflected}`:''} · nhận ${result.incoming} sát thương.`;
  tactics.last=(tactics.last+(result.campaignPhase?' · PHA 2! Boss gọi 2 đồng đội, tăng 15% sát thương.':'')+volcanoCaption(result)+setCaption(result)+rhythmCaption(beat)+orderCaption(result)+enemyCaption(result)).slice(0,285);ex.log.unshift(tactics.last);ex.log=ex.log.slice(0,6);
  record();
  if(ex.squad)result.squadAfter=structuredClone(ex.squad);
  if(ex.hp<=0)return {...result,...finishExpedition(state,false,rng)};
  if(b.hp<=0)return win();
  return result;
}
export function finishExpedition(state,success,rng=Math.random,now=Date.now(),retreat=false) {
  const ex=state.expedition;if(!ex)return {error:'Không có chuyến đi.'};const biome=BIOMES.find(b=>b.id===ex.biome);const reward={...ex.loot};
  if(ex.campaign){
    if(success&&(ex.battle||ex.stage<campaignBiome(ex).stages))return {error:'Hãy vượt hết các đợt quái trước khi nhận thưởng ải.'};
    if(retreat)retireCombatReport(state,'explore');const result=settleCampaign(state,ex,success,retreat);
    if(success){grant(state,result.reward);addXP(state,20+campaignStage(ex.campaign.id).chapterNumber*10);refreshDaily(state,now);state.daily.expeditions++;state.stats.expeditions++;for(const id of state.team){const p=state.pets.find(p=>p.id===id);p.bond=Math.min(100,p.bond+1);}}
    state.history.unshift({type:'explore',time:now,text:`${success?'Chiến dịch':'Trở về'} · ${result.campaign.label} ${result.campaign.name}${success?' · '+result.campaign.stars+' sao':''}`});state.history=state.history.slice(0,40);state.expedition=null;return result;
  }
  if(retreat)retireCombatReport(state,'explore');
  if(success){for(const [k,v] of Object.entries(biome.rewards))reward[k]=(reward[k]||0)+Math.round(v*ex.scale);reward.essence=1+Math.floor(biome.unlock/2);if(rng()<0.45)reward.tickets=1;if(!state.clears[biome.id])reward.tickets=(reward.tickets||0)+2;state.clears[biome.id]=(state.clears[biome.id]||0)+1;state.stats.expeditions++;refreshDaily(state,now);state.daily.expeditions++;addXP(state,45+biome.unlock*12);for(const id of state.team){const p=state.pets.find(p=>p.id===id);if(p)p.bond=clamp(p.bond+2,0,100);}}
  else{for(const k of Object.keys(reward))reward[k]=Math.floor(reward[k]*(retreat?0.8:0.5));addXP(state,10);}
  for(const [resource,word] of Object.entries({gold:'vàng',wood:'gỗ',food:'thức ăn'})){const bonus=state.team.reduce((n,id)=>{const perk=BY_ID[id].perk;return n+(perk.startsWith('Khám phá')&&perk.endsWith(word)?Number(perk.match(/\d+/)?.[0]||0)/100:0);},0);if(reward[resource])reward[resource]=Math.floor(reward[resource]*(1+bonus));}
  const shinyReward=success?shinyExplorationReward(state,rng,now):null;
  grant(state,reward);state.history.unshift({type:'explore',time:now,text:`${success?'Khám phá thành công':retreat?'Trở về an toàn':'Nghỉ ngơi sau chuyến đi'} · ${biome.name}`});state.history=state.history.slice(0,40);state.expedition=null;return {finished:true,success,retreat,reward,biome:biome.id,shinyReward};
}
export function catchFirefly(state) {const reward={food:3,gold:5};grant(state,reward);state.stats.fireflies++;return reward;}

export function breedPreview(state,first,second,fish=null) {
  const parents=[first,second].map(id=>state.pets.find(p=>p.id===id));
  const elements=parents.filter(Boolean).map(p=>BY_ID[p.species].element);
  const recipe=BREED_RECIPES.find(r=>r.elements.every(e=>elements.includes(e)));
  const chance=Math.min(55,25+Math.floor(parents.reduce((n,p)=>n+(p?.bond||0),0)/10)+(fish?10:0));
  const duration=(state.breeding.total===0?60000:600000)*(fish?0.7:1);
  let error;
  if(state.level<2)error='Vườn lai tạo mở ở cấp đảo 2. Ấp trứng hoặc chăm thú để lên cấp nhé!';
  else if(parents.some(p=>!p)||first===second)error='Hãy chọn hai linh thú khác nhau.';
  else if(parents.some(p=>p.level<3||p.bond<6))error='Cả hai linh thú cần cấp 3 và ít nhất 6 gắn bó. Cho các bạn ăn thêm nhé!';
  else if(fish&&(!FISH_BY_ID[fish]||!(state.fishing.bag[fish]>0)))error='Bạn chưa có loại cá này trong giỏ.';
  return {parents,elements,recipe,chance,duration,cost:{gold:200,food:30},error};
}
export function startBreeding(state,first,second,fish=null,rng=Math.random,now=Date.now()) {
  if(state.breeding.egg)return {error:'Một quả trứng đang được chăm sóc. Hãy đón bạn ấy trước nhé!'};
  const preview=breedPreview(state,first,second,fish);if(preview.error)return {error:preview.error};
  if(!pay(state,preview.cost))return {error:'Cần 200 vàng và 30 quả mọng cho tổ trứng.'};
  if(fish)state.fishing.bag[fish]--;
  let species;
  if(preview.recipe&&rng()*100<preview.chance)species=preview.recipe.species;
  else {
    const roll=rng()*100;const rarity=roll<2?'SSR':roll<22?'SR':roll<62?'R':'N';
    species=pick(SPECIES.filter(s=>s.source!=='breeding'&&s.rarity===rarity&&preview.elements.includes(s.element)),rng).id;
  }
  // Decide the outcome before saving the egg, so reopening never rerolls it.
  state.breeding.egg={parents:[first,second],species,fish:fish||null,recipe:preview.recipe?.id||null,started:now,readyAt:now+preview.duration};
  for(const p of preview.parents)p.bond=clamp(p.bond+4,0,100);
  return {egg:state.breeding.egg,cost:preview.cost};
}
export function claimBreeding(state,now=Date.now()) {
  const egg=state.breeding.egg;
  if(!egg)return {error:'Chưa có trứng lai tạo để đón.'};
  if(now<egg.readyAt)return {error:'Bạn nhỏ vẫn đang ngủ trong trứng. Đợi thêm một chút nhé!'};
  const species=BY_ID[egg.species];const existing=state.pets.find(p=>p.species===species.id);
  const shards=existing?RARITIES[species.rarity].shards:0;
  if(existing){existing.shards+=shards;grant(state,{essence:species.rarity==='SSR'?5:species.rarity==='SR'?2:1});}
  else state.pets.push(makePet(species.id,now));
  state.breeding.egg=null;state.breeding.total++;addXP(state,45);
  state.history.unshift({type:'breed',time:now,text:`Tổ trứng nở · ${species.name}${species.source==='breeding'?' · Loài lai đặc biệt':''}`});state.history=state.history.slice(0,40);
  return {results:[{species:species.id,isNew:!existing,shards}],hybrid:species.source==='breeding'};
}

export function fishingOdds(state) {
  const bonus=(state.fishing.rod-1)*0.75;
  return {N:50-bonus*2,R:32,SR:15+bonus,SSR:3+bonus};
}
export function rodCost(state) {const rod=state.fishing.rod;return {gold:180*rod*rod,wood:25*rod};}
export function upgradeRod(state) {
  if(state.fishing.rod>=5)return {error:'Cần câu đã đạt cấp tối đa.'};
  const cost=rodCost(state);if(!pay(state,cost))return {error:'Chưa đủ vàng hoặc gỗ để nâng cần.'};
  state.fishing.rod++;return {level:state.fishing.rod};
}
export function castLine(state,spot='pond',rng=Math.random,now=Date.now()) {
  if(state.fishing.session)return {error:'Chiếc phao vẫn đang ở dưới nước.'};
  const place=FISH_SPOTS.find(s=>s.id===spot);
  if(!place||state.fishing.level<place.level)return {error:'Hãy tăng cấp câu cá để mở bến này.'};
  if(!pay(state,{food:4}))return {error:'Cần 4 quả mọng làm mồi. Ghé vườn quả hoặc bắt đom đóm nhé!'};
  const odds=fishingOdds(state);const roll=rng()*100;
  const rarity=roll<odds.SSR?'SSR':roll<odds.SSR+odds.SR?'SR':roll<odds.SSR+odds.SR+odds.R?'R':'N';
  const fish=FISH.find(f=>f.spot===spot&&f.rarity===rarity);
  state.fishing.session={spot,fish:fish.id,weight:Math.round(fish.min+rng()*(fish.max-fish.min)),targets:[0,1,2].map(()=>0.28+rng()*0.44),hits:[],started:now,roundStarted:now+500,pausedAt:null};
  return {session:state.fishing.session};
}
export function fishingMeter(state,now=Date.now()) {
  const session=state.fishing.session;if(!session)return null;
  const time=session.pausedAt??now;
  const elapsed=Math.max(0,time-session.roundStarted);
  const phase=(elapsed%2600)/1300;
  const position=phase<=1?phase:2-phase;
  const width=0.24+(state.fishing.rod-1)*0.025;
  const target=session.targets[session.hits.length];
  return {position,target,width,perfect:0.065,ready:time>=session.roundStarted,round:session.hits.length+1};
}
export function pauseFishing(state,now=Date.now()) {const s=state.fishing.session;if(!s||s.pausedAt!==null)return false;s.pausedAt=now;return true;}
export function resumeFishing(state,now=Date.now()) {const s=state.fishing.session;if(!s||s.pausedAt===null)return false;s.roundStarted+=Math.max(0,now-s.pausedAt);s.pausedAt=null;return true;}
export function cancelFishing(state) {if(!state.fishing.session)return {error:'Chưa thả câu.'};state.fishing.session=null;state.fishing.streak=0;return {cancelled:true};}
export function reelFish(state,now=Date.now()) {
  const f=state.fishing;const session=f.session;if(!session)return {error:'Hãy thả câu trước nhé!'};
  if(session.pausedAt!==null)return {error:'Chuyến câu đang tạm dừng.'};
  const meter=fishingMeter(state,now);if(!meter.ready)return {error:'Đợi phao ổn định một chút nhé!'};
  const distance=Math.abs(meter.position-meter.target);
  const hit=distance<=meter.perfect/2?2:distance<=meter.width/2?1:0;
  session.hits.push(hit);
  if(session.hits.length<3){session.roundStarted=now+450;return {hit,round:session.hits.length};}
  const fish=FISH_BY_ID[session.fish];const hits=[...session.hits];f.session=null;
  if(hits.filter(Boolean).length<2){f.streak=0;return {finished:true,success:false,hits};}
  const rank=['N','R','SR','SSR'].indexOf(fish.rarity);const perfect=hits.every(h=>h===2);
  const isNew=!f.collection[fish.id];const record=f.collection[fish.id];const best=!record||session.weight>record.best;
  f.collection[fish.id]={caught:Math.min(99999999,(record?.caught||0)+1),best:Math.max(record?.best||0,session.weight)};
  f.bag[fish.id]=Math.min(99999999,(f.bag[fish.id]||0)+1);f.total++;f.streak++;f.bestStreak=Math.max(f.bestStreak,f.streak);
  const reward={gold:20+rank*20,food:8+rank*4,...(rank>=2?{essence:rank}:{}),...(isNew?{crystals:10}:{})};
  if(perfect)reward.gold+=30;
  if(f.streak%3===0)reward.essence=(reward.essence||0)+2;
  grant(state,reward);f.xp+=14+rank*8+(perfect?8:0);
  while(f.level<20&&f.xp>=f.level*40){f.xp-=f.level*40;f.level++;}
  if(f.level===20)f.xp=0;
  addXP(state,8+rank*3);
  if(isNew){state.history.unshift({type:'fish',time:now,text:`Gặp loài mới ở ${FISH_SPOTS.find(p=>p.id===session.spot).name} · ${fish.name}`});state.history=state.history.slice(0,40);}
  return {finished:true,success:true,fish:fish.id,weight:session.weight,isNew,best,perfect,hits,reward};
}
export function cookFish(state,id) {
  const fish=FISH_BY_ID[id];if(!fish||!(state.fishing.bag[id]>0))return {error:'Không có cá này trong giỏ.'};
  state.fishing.bag[id]--;const rank=['N','R','SR','SSR'].indexOf(fish.rarity);
  const reward={food:fish.food,...(rank>0?{essence:rank===3?4:rank}:{})};grant(state,reward);return {reward};
}
export function claimFishMilestone(state,target) {
  const milestone=FISH_MILESTONES.find(m=>m.target===target);
  if(!milestone||state.fishing.claimed.includes(target)||Object.keys(state.fishing.collection).length<target)return {error:'Chưa thể nhận cột mốc sưu tầm này.'};
  state.fishing.claimed.push(target);grant(state,milestone.reward);return {reward:milestone.reward};
}

export function serialize(state) {return JSON.stringify({app:'SpiritIsles',version:1,savedAt:Date.now(),state});}
export function validateSave(input,now=Date.now()) {
  const envelope=typeof input==='string'?JSON.parse(input):input;
  if(envelope?.app!=='SpiritIsles'||envelope.version!==1||!envelope.state)throw new Error('Đây không phải bản lưu Đảo Linh Thú hợp lệ.');
  const s=JSON.parse(JSON.stringify(envelope.state));
  if(!Object.hasOwn(s,'activitiesVersion')&&!Object.hasOwn(s,'breeding')&&!Object.hasOwn(s,'fishing'))Object.assign(s,newActivities());
  if(!Object.hasOwn(s,'tower'))s.tower=newTower(now);
  if(!Object.hasOwn(s,'ruins'))s.ruins=newRuins();
  if(!Object.hasOwn(s,'forge'))s.forge=newForge();
  if(!Object.hasOwn(s,'boss'))s.boss=newBoss();
  if(!Object.hasOwn(s,'dojo'))s.dojo=newDojo();
  if(!Object.hasOwn(s,'awakening'))s.awakening=newAwakening();
  const num=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const integer=(v,min,max)=>Number.isInteger(v)&&num(v,min,max);
  const resourceKeys=Object.keys(newGame(now).resources);
  if(s.version!==1||!integer(s.level,1,50)||!integer(s.xp,0,100000)||!s.resources||Object.keys(s.resources).length!==resourceKeys.length||!resourceKeys.every(k=>integer(s.resources[k],0,99999999)))throw new Error('Tài nguyên hoặc cấp đảo trong bản lưu không hợp lệ.');
  if(!Array.isArray(s.pets)||s.pets.length<1||s.pets.length>SPECIES.length||new Set(s.pets.map(p=>p.id)).size!==s.pets.length||!s.pets.every(p=>BY_ID[p.species]&&p.id===p.species&&integer(p.level,1,30)&&integer(p.xp,0,2000)&&integer(p.stars,0,3)&&integer(p.bond,0,100)&&integer(p.shards,0,99999999)&&(!Object.hasOwn(p,'shiny')||typeof p.shiny==='boolean')))throw new Error('Dữ liệu linh thú không hợp lệ.');
  for(const pet of s.pets){validateTraining(pet,{level:pet.level});validateCare(pet,now);}
  if(!Array.isArray(s.team)||s.team.length<1||s.team.length>3||new Set(s.team).size!==s.team.length||!s.team.every(id=>s.pets.some(p=>p.id===id)))throw new Error('Đội thám hiểm không hợp lệ.');
  validateCombatFormation(s);
  validateAutoTactics(s);
  if(!s.buildings||!Object.entries(s.buildings).every(([id,b])=>BUILDINGS.some(x=>x.id===id&&integer(b.level,1,x.max))&&num(b.last,0,now+86400000)))throw new Error('Công trình không hợp lệ.');
  if(!s.stats||!Object.keys(newGame(now).stats).every(k=>integer(s.stats[k],0,99999999))||!integer(s.pity,0,49)||!integer(s.srPity,0,9)||!Array.isArray(s.claimed)||!s.claimed.every(id=>QUESTS.some(q=>q.id===id)))throw new Error('Tiến trình không hợp lệ.');
  if(!s.daily||typeof s.daily.date!=='string'||!['feeds','hatches','expeditions'].every(k=>integer(s.daily[k],0,99999999))||!Array.isArray(s.daily.claimed)||!s.daily.claimed.every(id=>DAILY_QUESTS.some(q=>q.id===id))||typeof s.daily.checkin!=='boolean'||!integer(s.streak,0,999999)||typeof s.lastCheckin!=='string')throw new Error('Dữ liệu ngày không hợp lệ.');
  if(!s.clears||!Object.entries(s.clears).every(([id,n])=>BIOMES.some(b=>b.id===id)&&integer(n,0,99999999)))throw new Error('Dữ liệu khám phá không hợp lệ.');
  if(!Object.hasOwn(s,'islandLayout'))s.islandLayout=newIslandLayout(s);
  validateActivities(s,now,num,integer);
  validateShiny(s);
  validateCampaign(s,now);
  validateForge(s);validateAwakening(s);
  validateTower(s,now);
  validateRuins(s,now);
  validateBoss(s,now);
  validateHabitat(s,now);
  validateSeasonal(s,now);
  validateLayout(s);
  if(s.expedition){
    const e=s.expedition;const b=campaignBiome(e);
    if(!b||!integer(e.stage,0,b.stages-1)||!num(e.hp,1,100)||!num(e.power,1,100000)||!num(e.threat,1,100000)||!num(e.scale,1,4)||!integer(e.event,0,EVENTS.length-1)||!e.loot||!Object.entries(e.loot).every(([k,v])=>resourceKeys.includes(k)&&integer(v,0,99999999))||!Array.isArray(e.log)||!e.log.every(x=>typeof x==='string'&&x.length<500))throw new Error('Chuyến thám hiểm không hợp lệ.');
    if(!Object.hasOwn(e,'members'))e.members=s.team.map(id=>({id,power:petPower(s.pets.find(p=>p.id===id))}));
    if(!Object.hasOwn(e,'focus'))e.focus=0;
    if(!integer(e.focus,0,3))throw new Error('Năng lượng chuyến thám hiểm không hợp lệ.');
    if(!Array.isArray(e.members)||e.members.length!==s.team.length||!e.members.every((m,i)=>m&&m.id===s.team[i]&&integer(m.power,1,2000)))throw new Error('Đội trong chuyến thám hiểm không hợp lệ.');
    for(const member of e.members){validateMemberGear(member);validateTraining(member,{optional:true});validateMemberAwakening(member);}
    if(e.battle){
      const t=e.battle;
      if(!num(t.hp,1,100)||!num(t.power,1,100000)||!integer(t.round,0,9999)||!integer(t.focus,0,3)||typeof t.enemy!=='string'||typeof t.boss!=='boolean')throw new Error('Trận chiến không hợp lệ.');
      if(!Object.hasOwn(t,'shield'))t.shield=0;
      if(!integer(t.shield,0,80))throw new Error('Khiên đối thủ không hợp lệ.');
      if(!Object.hasOwn(t,'tactics'))t.tactics=newTactics(e.members);
      validateTactics(t.tactics,e.members,100);validateRhythm(t);validateStrategy(t);validateEnemyAI(t);
      validateVolcano(e);
    }
    validateSquad(e,{maxHp:100,enemyMax:100,enemies:e.battle?exploreEnemies(e):[],active:!!e.battle});
  }
  validateDojo(s,now,validateSave);validateCombatJournal(s);
  const clean=JSON.parse(JSON.stringify(s));clean.settings={sound:s.settings?.sound!==false,motion:s.settings?.motion!==false};clean.history=Array.isArray(s.history)?s.history.filter(h=>typeof h.text==='string'&&h.text.length<300&&num(h.time,0,now+86400000)).slice(0,40):[];clean.tutorial=!!s.tutorial;clean.created=num(s.created,0,now+86400000)?s.created:now;clean.lastSeen=num(s.lastSeen,0,now+86400000)?s.lastSeen:now;refreshDaily(clean,now);return clean;
}

function validateActivities(s,now,num,integer) {
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const time=v=>num(v,0,now+86400000);
  const b=s.breeding;const f=s.fishing;
  if(s.activitiesVersion!==1||!object(b)||!integer(b.total,0,99999999)||!object(f))throw new Error('Dữ liệu hoạt động trên đảo không hợp lệ.');
  if(!integer(f.level,1,20)||!integer(f.xp,0,f.level===20?0:f.level*40-1)||!integer(f.rod,1,5)||!integer(f.total,0,99999999)||!integer(f.streak,0,f.total)||!integer(f.bestStreak,f.streak,f.total)||!object(f.collection)||!object(f.bag))throw new Error('Tiến trình câu cá không hợp lệ.');
  if(!Object.entries(f.collection).every(([id,r])=>FISH_BY_ID[id]&&object(r)&&integer(r.caught,1,99999999)&&integer(r.best,FISH_BY_ID[id].min,FISH_BY_ID[id].max))||Object.values(f.collection).reduce((n,r)=>n+r.caught,0)!==f.total)throw new Error('Sổ thủy sinh không hợp lệ.');
  if(!Object.entries(f.bag).every(([id,n])=>f.collection[id]&&integer(n,0,f.collection[id].caught)))throw new Error('Giỏ cá không hợp lệ.');
  if(!Array.isArray(f.claimed)||new Set(f.claimed).size!==f.claimed.length||!f.claimed.every(n=>FISH_MILESTONES.some(m=>m.target===n&&Object.keys(f.collection).length>=n)))throw new Error('Cột mốc câu cá không hợp lệ.');
  if(f.session!==null){
    const e=f.session;const fish=FISH_BY_ID[e?.fish];const spot=FISH_SPOTS.find(p=>p.id===e?.spot);
    if(!object(e)||!fish||!spot||fish.spot!==e.spot||f.level<spot.level||!integer(e.weight,fish.min,fish.max)||!Array.isArray(e.targets)||e.targets.length!==3||!e.targets.every(n=>num(n,0.28,0.72))||!Array.isArray(e.hits)||e.hits.length>2||!e.hits.every(n=>integer(n,0,2))||!time(e.started)||!time(e.roundStarted)||e.roundStarted<e.started||(e.pausedAt!==null&&(!time(e.pausedAt)||e.pausedAt<e.started)))throw new Error('Chuyến câu cá không hợp lệ.');
  }
  if(b.egg!==null){
    const e=b.egg;
    if(!object(e)||!Array.isArray(e.parents)||e.parents.length!==2||new Set(e.parents).size!==2||!e.parents.every(id=>s.pets.some(p=>p.id===id))||!BY_ID[e.species]||(e.fish!==null&&!FISH_BY_ID[e.fish])||!time(e.started)||!time(e.readyAt))throw new Error('Trứng lai tạo không hợp lệ.');
    const elements=e.parents.map(id=>BY_ID[id].element);const recipe=BREED_RECIPES.find(r=>r.elements.every(el=>elements.includes(el)));
    const duration=(b.total===0?60000:600000)*(e.fish?0.7:1);
    if(e.recipe!==(recipe?.id||null)||e.readyAt-e.started!==duration||(BY_ID[e.species].source==='breeding'?e.species!==recipe?.species:!elements.includes(BY_ID[e.species].element)))throw new Error('Kết quả lai tạo không hợp lệ.');
  }
}
