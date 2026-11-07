import assert from 'node:assert/strict';
import {E,squadGame} from './squad-fixtures.mjs';
import * as T from '../web/js/tower-engine.js';
import {combatScene} from '../web/js/combat-stage.js';
import {autoOrder} from '../web/js/auto-play.js';
export {E,T};
export const towerNow=Date.parse('2026-10-23T05:00:00Z');
export function towerGame({level=1,stars=0,team,seed=.4,now=towerNow}={}){
  const s=squadGame(team,now);s.settings={motion:false,sound:false};
  s.pets.forEach(p=>{p.level=level;p.stars=stars;});
  assert.ok(!T.startTower(s,1,()=>seed,now).error);return s;
}
export function towerReady(options={}){const s=towerGame(options);assert.ok(!T.chooseTowerPath(s,'battle',options.now??towerNow).error);return s;}
export function autoTowerTurn(s,now=towerNow){const {reason,...order}=autoOrder(combatScene(s,'tower'));const r=T.towerBattleTurn(s,order,now);assert.ok(!r.error,r.error);return r;}
export function towerStep(s,{path='battle',blessings=['vitality','might','tide','humble','ember','canopy','spark','harmony','fortune','thorns'],now=towerNow}={}){
  const run=s.tower.run;if(!run)return;
  if(run.phase==='path')return T.chooseTowerPath(s,run.paths.includes(path)?path:run.paths[0],now);
  if(run.phase==='blessing')return T.chooseTowerBlessing(s,blessings.find(id=>run.offers.includes(id))||run.offers[0]);
  if(run.hp<60&&run.potions)T.useTowerPotion(s);
  return autoTowerTurn(s,now);
}
export function climb(s,until=31,{save=false,...options}={}){
  for(let i=0;s.tower.run&&s.tower.run.floor<until&&i<3000;i++){
    const result=towerStep(s,options);assert.ok(!result?.error,result?.error);
    if(save)s=E.validateSave(E.serialize(s),options.now??towerNow);
  }
  assert.ok(!s.tower.run||s.tower.run.floor>=until,'climb did not advance');return s;
}
