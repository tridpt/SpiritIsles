import {BY_ID,BIOMES} from './data.js';
import {campaignEnemies} from './campaign-data.js';
import {reefPatrol,REEF_ENEMIES} from './reef-encounter.js';
import {volcanoPatrol,VOLCANO_ENEMIES} from './volcano-encounter.js';

const POOLS={
  leaf:['ferncat','mushroom','mossfox','maplehog','sproutpanda'],
  water:['pebbleturtle','axolotl','coralseal','lotusseal'],
  fire:['flamefox','emberbird','lavadragon'],
  wind:['cottonbun','breezebird','mistfox'],
  shadow:['nightcat','duskbun','moonjelly','eclipsecat'],
  light:['glowmush','stardeer','sunseal','sunfox']
};
const LEADERS={forest:'forestking',reef:'pebbleturtle',volcano:'lavadragon',clouds:'breezebird',moon:'eclipsecat',sun:'sunfox'};

// Deterministic species selection; rendering and combat share these IDs.
export function enemyTeam({element='leaf',primary,seed=0,count=3,pool=POOLS[element]}={}){
  const choices=[...new Set((pool||[]).filter(id=>Object.hasOwn(BY_ID,id)))];
  const index=Math.abs(Math.trunc(seed))%Math.max(1,choices.length);
  const first=Object.hasOwn(BY_ID,primary)?primary:choices[index]||'mossfox';
  const rest=choices.slice(index).concat(choices.slice(0,index)).filter(id=>id!==first);
  return [first,...rest].slice(0,Math.max(1,Math.min(3,count))).map((species,i)=>({id:`enemy-${i}`,species,name:BY_ID[species].name,element:BY_ID[species].element}));
}
export function exploreEnemies(run){
  if(!run?.battle)return [];
  if(run.campaign)return campaignEnemies(run)||[];
  if(reefPatrol(run))return REEF_ENEMIES.map(e=>({...e}));
  if(volcanoPatrol(run))return VOLCANO_ENEMIES.map(e=>({...e}));
  const biome=BIOMES.find(b=>b.id===run.biome),boss=run.battle.boss;
  return enemyTeam({element:biome?.element,primary:boss?LEADERS[run.biome]:undefined,seed:(run.started||0)+run.stage*7,count:boss?1:run.squad?3:run.stage===0?2:3});
}
export function ruinsEnemies(run,encounter){
  if(!run?.battle||!encounter)return [];
  return enemyTeam({element:encounter.chapter.element,primary:encounter.species,seed:(run.seed||0)+run.floor*17,count:encounter.boss?1:run.squad?3:encounter.elite?2:run.floor===1?2:3,pool:encounter.chapter.creatures});
}
export function guardianEnemy(run){return enemyTeam({primary:run.bossId==='phoenix'?'phoenix':run.bossId==='frost'?'oceandragon':'forestking',count:1});}
export function castActors(move,result,members=[]){
  const party=members.filter((m,i)=>Object.hasOwn(BY_ID,m.id)&&members.findIndex(p=>p.id===m.id)===i&&(!result?.actors||result.actors.includes(m.id)));
  if(['attack','skill','guard','charge','evade'].includes(move))return party;
  const id=/^(pet|awaken):/.test(move)?move.split(':')[1]:result?.actor;
  return party.filter(m=>m.id===id);
}
export function castCaption(move,result,members){
  const actors=castActors(move,result,members),names=actors.map(m=>BY_ID[m.id].name).join(' + ');
  if(!actors.length)return '';
  return move==='evade'?result?.volcanoWarning?'Cả đội di chuyển tới nền đá an toàn':result?.reefWarning?'Cả đội né Sóng triều':'Cả đội né Rễ trồi':move==='skill'?`Hợp lực ${actors.length} thú · ${names}`:move==='attack'?`Cả đội tấn công · ${names}`:move==='guard'?'Cả đội dựng thế phòng thủ':move==='charge'?'Cả đội cùng lấy đà':`Chiêu riêng · ${names}`;
}
