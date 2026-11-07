import { BY_ID } from './data.js';
import { TOWER_MAX_FLOOR, TOWER_BLESSING_BY_ID, towerMaxHp, towerEncounter, towerBlessingMatches, towerBlessingAvailable, towerEnemies, towerPaths, towerSeason } from './tower-data.js';
import { validateSquad } from './squad-state.js';
import { validateTactics } from './tactics.js';
import { validateRhythm } from './combat-rhythm.js';
import { validateStrategy } from './combat-orders.js';
import { validateEnemyAI } from './enemy-tactics.js';
import { validateMemberGear } from './forge-state.js';
import { validateTraining } from './skill-paths.js';
import { validateMemberAwakening } from './awakening-state.js';

export const newTower=(now=Date.now())=>({version:1,season:towerSeason(now),best:0,runs:0,bosses:0,dust:0,claimed:[],weeklyBest:0,weeklyClaimed:[],aura:false,lastResult:null,run:null});
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const time=(v,now)=>integer(v,0,now+86400000);
const season=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&towerSeason(Date.parse(v))===v;
const loot=v=>object(v)&&Object.entries(v).every(([k,n])=>['gold','food','wood','crystals','tickets','essence'].includes(k)&&integer(n,0,99999999));
const blessings=v=>object(v)&&Object.entries(v).every(([id,n])=>Object.hasOwn(TOWER_BLESSING_BY_ID,id)&&integer(n,1,TOWER_BLESSING_BY_ID[id].max));
const claims=(v,best)=>Array.isArray(v)&&new Set(v).size===v.length&&v.every(n=>[5,10,15,20,25,30].includes(n)&&n<=best);
export function validateTower(state,now=Date.now()){
  const t=state.tower,fail=()=>{throw new Error('Dữ liệu Tháp Vô Tận không hợp lệ.');};
  if(!object(t)||Object.keys(t).sort().join()!==Object.keys(newTower(now)).sort().join()||t.version!==1||!season(t.season)||!integer(t.best,0,30)||!integer(t.weeklyBest,0,t.best)||!integer(t.runs,0,99999999)||!integer(t.bosses,Math.floor(t.best/5),99999999)||!integer(t.dust,0,99999999)||!claims(t.claimed,t.best)||!claims(t.weeklyClaimed,t.weeklyBest)||typeof t.aura!=='boolean'||t.aura&&!t.claimed.includes(30))fail();
  if(t.lastResult!==null){
    const r=t.lastResult;if(!object(r)||Object.keys(r).length!==9||!['victory','defeat','retreat'].includes(r.status)||!integer(r.floor,1,30)||!integer(r.cleared,0,r.floor)||!integer(r.dust,0,99999999)||!loot(r.loot)||!blessings(r.blessings)||!integer(r.curse,0,3)||!time(r.time,now)||!season(r.season)||r.season>t.season||r.cleared>t.best||r.status==='victory'&&(r.floor!==30||r.cleared!==30)||r.status==='defeat'&&r.cleared!==r.floor-1)fail();
  }
  if(t.run===null)return;
  const r=t.run,keys='version,season,seed,rng,floor,phase,members,hp,shield,focus,potions,paths,path,offers,blessings,battle,cleared,curse,dustEarned,loot,started,log,squad'.split(',');
  if(!object(r)||Object.keys(r).sort().join()!==keys.sort().join()||r.version!==1||!season(r.season)||r.season>t.season||state.expedition||state.ruins?.run||state.boss?.run||state.dojo?.run||!t.runs||!integer(r.seed,1,0xffffffff)||!integer(r.rng,1,0xffffffff)||!integer(r.floor,1,TOWER_MAX_FLOOR)||!['path','battle','blessing'].includes(r.phase)||!blessings(r.blessings)||!time(r.started,now)||!integer(r.curse,0,3))fail();
  if(!Array.isArray(r.members)||r.members.length!==state.team.length||!r.members.every((m,i)=>object(m)&&m.id===state.team[i]&&Object.hasOwn(BY_ID,m.id)&&integer(m.power,1,2000)))fail();
  for(const m of r.members){validateMemberGear(m);validateTraining(m,{optional:true});validateMemberAwakening(m);}
  if(!Object.keys(r.blessings).every(id=>towerBlessingMatches(TOWER_BLESSING_BY_ID[id],r)))fail();
  const max=towerMaxHp(r);
  if(!integer(r.hp,1,max)||!integer(r.shield,0,Math.floor(max*.6))||!integer(r.focus,0,3)||!integer(r.potions,0,2)||r.cleared!==r.floor-1+(r.phase==='blessing'?1:0)||r.cleared>t.best||!integer(r.dustEarned,0,99999999)||!loot(r.loot)||!Array.isArray(r.log)||r.log.length>6||r.log.some(x=>typeof x!=='string'||x.length>300)||!Array.isArray(r.paths)||!Array.isArray(r.offers)||new Set(r.offers).size!==r.offers.length||Object.values(r.blessings).reduce((a,b)=>a+b,0)>r.cleared-(r.phase==='blessing'?1:0))fail();
  if(r.phase==='path'){
    if(r.path!==null||r.battle!==null||r.offers.length||JSON.stringify(r.paths)!==JSON.stringify(towerPaths(r)))fail();
  }else{
    if(r.paths.length||!towerPaths(r).includes(r.path))fail();
    if(r.phase==='blessing'){
      if(r.battle!==null||r.floor===30||!r.offers.length||r.offers.length>3||!r.offers.every(id=>Object.hasOwn(TOWER_BLESSING_BY_ID,id)&&towerBlessingAvailable(TOWER_BLESSING_BY_ID[id],r)))fail();
    }else{
      const b=r.battle,e=towerEncounter(r);
      if(!['battle','elite','boss'].includes(r.path)||!object(b)||Object.keys(b).length!==7||!integer(b.hp,1,e.maxHp)||!integer(b.shield,0,80)||!integer(b.turn,0,119)||r.offers.length||b.enemyAI?.kind!==e.kind)fail();
      validateTactics(b.tactics,r.members,max);validateRhythm(b);validateStrategy(b);validateEnemyAI(b);
      if(r.shield+b.tactics.ward>Math.floor(max*.6))fail();
    }
  }
  validateSquad(r,{maxHp:max,enemyMax:r.battle?towerEncounter(r).maxHp:0,enemies:r.battle?towerEnemies(r):[],active:!!r.battle});
}
