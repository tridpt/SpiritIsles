import { validateMemberAwakening } from './awakening-state.js';
import { validateEnemyAI } from './enemy-tactics.js';
import { BY_ID } from './data.js';
import { newTactics, validateTactics } from './tactics.js';
import { validateMemberGear } from './forge-state.js';
import { validateTraining } from './skill-paths.js';
import { validateRhythm } from './combat-rhythm.js';
import { validateStrategy } from './combat-orders.js';
import { RUINS_BLESSING_BY_ID, RUINS_RELICS, RUINS_MILESTONES, RUINS_PATHS, ruinsMaxHp, ruinsEncounter, ruinsBlessingAvailable, ruinsBlessingMatches } from './ruins-data.js';
import { ruinsRouteNext, ruinsRouteNode, ROUTE_EVENTS } from './ruins-route.js';
import {validateSquad} from './squad-state.js';
import {ruinsEnemies} from './combat-team.js';

export function newRuins() {
  return {version:1,dust:0,best:0,runs:0,clears:0,bosses:0,relics:{lantern:0,compass:0,flask:0},claimed:[],run:null,lastResult:null};
}

export function validateRuins(state,now=Date.now()) {
  const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const time=n=>integer(n,0,now+86400000);
  const fail=()=>{throw new Error('Tiến trình Phế Tích Cổ không hợp lệ.');};
  const relics=v=>object(v)&&Object.keys(v).length===RUINS_RELICS.length&&RUINS_RELICS.every(r=>integer(v[r.id],0,r.costs.length));
  const blessings=v=>object(v)&&Object.entries(v).every(([id,n])=>RUINS_BLESSING_BY_ID[id]&&integer(n,1,RUINS_BLESSING_BY_ID[id].max));
  const loot=v=>object(v)&&Object.entries(v).every(([id,n])=>['gold','food'].includes(id)&&integer(n,0,99999999));
  const r=state.ruins;
  if(!object(r)||r.version!==1||!integer(r.dust,0,99999999)||!integer(r.best,0,50)||!integer(r.runs,0,99999999)||!integer(r.clears,r.best,99999999)||!integer(r.bosses,Math.floor(r.best/5),r.clears)||!relics(r.relics))fail();
  if(!Array.isArray(r.claimed)||new Set(r.claimed).size!==r.claimed.length||!r.claimed.every(n=>RUINS_MILESTONES.some(m=>m.floor===n&&n<=r.best)))fail();
  if(r.run!==null){
    const run=r.run;
    if(!object(run)||state.expedition||r.runs<1||!integer(run.seed,1,0xffffffff)||!integer(run.rng,1,0xffffffff)||![1,11,21,31,41].includes(run.startFloor)||run.startFloor>r.best+1||!integer(run.floor,run.startFloor,50)||!['path','battle','blessing','event'].includes(run.phase)||!time(run.started)||!relics(run.relics)||!RUINS_RELICS.every(d=>run.relics[d.id]===r.relics[d.id])||!blessings(run.blessings))fail();
    if(!Array.isArray(run.members)||run.members.length!==state.team.length||!run.members.every((m,i)=>object(m)&&m.id===state.team[i]&&Object.hasOwn(BY_ID,m.id)&&integer(m.power,1,2000)))fail();
    for(const member of run.members){validateMemberGear(member);validateTraining(member,{optional:true});validateMemberAwakening(member);}
    if(!Object.keys(run.blessings).every(id=>ruinsBlessingMatches(RUINS_BLESSING_BY_ID[id],run)))fail();
    if(!integer(run.hp,1,ruinsMaxHp(run))||!integer(run.shield,0,Math.floor(ruinsMaxHp(run)*.6))||!integer(run.focus,0,3)||!integer(run.potions,0,1+run.relics.flask)||!integer(run.cleared,0,50-run.startFloor+1)||run.cleared!==run.floor-run.startFloor+(run.phase==='blessing'?1:0)||r.clears<run.cleared||!integer(run.dustEarned,0,99999999)||!loot(run.loot)||typeof run.rerolled!=='boolean')fail();
    if(Object.values(run.blessings).reduce((n,v)=>n+v,0)>run.cleared-(run.phase==='blessing'?1:0)||!Array.isArray(run.log)||run.log.length>6||!run.log.every(t=>typeof t==='string'&&t.length<300)||!Array.isArray(run.paths)||!Array.isArray(run.offers))fail();
    if(Object.hasOwn(run,'route')){
      const route=run.route;
      if(!object(route)||Object.keys(route).length!==4||route.version!==1||!Array.isArray(route.history)||route.history.length!==run.cleared||!integer(route.curse,0,3)||run.floor>=run.startFloor+10)fail();
      let previous=null,curses=0;
      for(const [i,entry]of route.history.entries()){
        if(!object(entry)||Object.keys(entry).length!==2)fail();
        const node=ruinsRouteNode(run,entry.node);
        if(!node||node.room!==i+1||previous&&previous.kind!=='boss'&&node.kind!=='boss'&&Math.abs(previous.lane-node.lane)>1)fail();
        if(node.event){const choice=ROUTE_EVENTS[node.event].choices.find(c=>c.id===entry.choice);if(!choice)fail();curses+=choice.curse||0;}
        else if(entry.choice!==null)fail();
        previous=node;
      }
      if(curses!==route.curse)fail();
      if(run.phase==='path'){
        if(route.position!==null||JSON.stringify(run.paths)!==JSON.stringify(ruinsRouteNext(run).map(n=>n.id)))fail();
      }else{
        const node=ruinsRouteNode(run,route.position);
        if(!node||node.floor!==run.floor||node.kind!==run.path)fail();
        if(run.phase==='blessing'){if(previous?.id!==node.id||node.event||node.room===10)fail();}
        else{const possible=ruinsRouteNext(run);if(!possible.some(n=>n.id===node.id))fail();}
        if((run.phase==='event')!==!!node.event)fail();
      }
    }else if(run.phase==='event'||run.path==='event')fail();
    if(run.phase==='path'){
      if(run.path!==null||run.battle!==null||run.offers.length||new Set(run.paths).size!==run.paths.length)fail();
      if(!run.route&&(run.floor%5===0?(run.paths.length!==1||run.paths[0]!=='boss'):(run.paths.length!==2||!run.paths.every(p=>Object.hasOwn(RUINS_PATHS,p)&&!['boss','event'].includes(p)))))fail();
    }else if(run.phase==='event'){
      if(!run.route||!['event','spring'].includes(run.path)||run.battle!==null||run.offers.length||run.paths.length)fail();
    }else{
      if(run.paths.length||!Object.hasOwn(RUINS_PATHS,run.path)||run.path==='spring'||(run.floor%5===0)!==(run.path==='boss'))fail();
      if(run.phase==='battle'){
        const e=ruinsEncounter(run);const b=run.battle;
        if(run.offers.length||!object(b)||!integer(b.hp,1,e.maxHp)||!integer(b.shield,0,80)||!integer(b.turn,0,149))fail();
        if(!Object.hasOwn(b,'tactics'))b.tactics=newTactics(run.members);
        validateTactics(b.tactics,run.members,ruinsMaxHp(run));validateRhythm(b);validateStrategy(b);validateEnemyAI(b);
        if(run.route&&b.enemyAI.kind!==e.kind)fail();
        if(run.shield+b.tactics.ward>Math.floor(ruinsMaxHp(run)*.6))fail();
      }else if(run.battle!==null||run.floor===50||r.best<run.floor||!run.offers.length||run.offers.length>3||new Set(run.offers).size!==run.offers.length||!run.offers.every(id=>RUINS_BLESSING_BY_ID[id]&&ruinsBlessingAvailable(RUINS_BLESSING_BY_ID[id],run)))fail();
    }
  }
  if(r.run)validateSquad(r.run,{maxHp:ruinsMaxHp(r.run),enemyMax:r.run.battle?ruinsEncounter(r.run).maxHp:0,enemies:r.run.battle?ruinsEnemies(r.run,ruinsEncounter(r.run)):[],active:!!r.run.battle});
  if(r.lastResult!==null){
    const x=r.lastResult;
    if(!object(x)||!['victory','defeat','retreat'].includes(x.status)||![1,11,21,31,41].includes(x.startFloor)||!integer(x.floor,x.startFloor,50)||!integer(x.cleared,0,51-x.startFloor)||!integer(x.dust,0,99999999)||!loot(x.loot)||!blessings(x.blessings)||!time(x.time)||x.floor>r.best+1)fail();
    if(Object.hasOwn(x,'journey')){
      const j=x.journey;
      if(!object(j)||Object.keys(j).length!==4||j.rooms!==10||!integer(j.events,0,x.cleared)||!integer(j.elites,0,x.cleared-j.events)||!integer(j.curse,0,Math.min(3,j.events))||x.floor>x.startFloor+9||x.cleared>10||x.status==='victory'&&(x.floor!==x.startFloor+9||x.cleared!==10||r.best<x.floor))fail();
    }else if(x.status==='victory'&&(x.floor!==50||r.best!==50||x.cleared!==51-x.startFloor))fail();
  }
}
