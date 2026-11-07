import assert from 'node:assert/strict';
import * as E from '../web/js/engine.js';
import * as R from '../web/js/ruins-engine.js';
import * as B from '../web/js/boss-engine.js';
import {healthSum} from '../web/js/squad-state.js';
export {E,R,B};
export const modes=['explore','ruins','boss'];
export function squadGame(team=['mossfox','axolotl','emberbird'],now=Date.now()){
  const s=E.newGame(now);s.level=10;s.resources.food=50000;s.resources.gold=100000;
  for(const id of team)if(!s.pets.some(p=>p.id===id))s.pets.push(E.makePet(id,now));s.team=team;return s;
}
export const getRun=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run:s.expedition;
export const getBattle=(s,m)=>m==='boss'?getRun(s,m):getRun(s,m)?.battle;
export function squadReady(mode='explore',team,options={}){
  const s=squadGame(team);
  if(mode==='boss'){
    if(options.boss&&options.boss!=='treant'){s.boss.best=1;s.boss.wins=1;s.boss.clears[0]=1;}
    if(options.boss==='phoenix')Object.assign(s.boss.rivals.frost,{best:1,wins:1,clears:[1,0,0,0,0]});
    assert.ok(!B.startBoss(s,1,()=>.4,Date.now(),options.boss||'treant').error);
  }else if(mode==='ruins'){
    assert.ok(!R.startRuins(s,1,()=>.4).error);assert.ok(!R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring')).error);
  }else{assert.ok(!E.startExpedition(s,'forest',()=>.1,1720000000000).error);assert.ok(!E.chooseRoute(s,0,()=>.1).error);}
  if(mode==='explore')getBattle(s,mode).focus=3;else getRun(s,mode).focus=3;
  return s;
}
export function turn(s,mode,order='attack',grade='auto',now=1720000000000){return mode==='boss'?B.bossBattleTurn(s,order,now,grade):mode==='ruins'?R.ruinsBattleTurn(s,order,now,grade):E.battleTurn(s,order,()=>.5,grade);}
export function unitHp(s,mode,side,values){
  const r=getRun(s,mode),units=r.squad[side];units.forEach((u,i)=>{if(values[i]!==undefined)u.hp=values[i];if(!u.hp){u.ward=0;u.cover=0;}});
  r.hp=healthSum(r.squad.allies);if(mode==='boss')r.enemyHp=healthSum(r.squad.enemies);else r.battle.hp=healthSum(r.squad.enemies);
}
export const roundtrip=s=>E.validateSave(E.serialize(s));
