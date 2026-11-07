import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import {ruinsRouteMap,ruinsRouteNode} from '../web/js/ruins-route.js';
import {ruinsIntent,ruinsMaxHp} from '../web/js/ruins-data.js';
export function journey(seed=.21,strong=true,start=1){
  const s=E.newGame();s.level=2;s.resources.food=5000;s.resources.gold=10000;
  if(strong){for(const p of s.pets){p.level=30;p.stars=3;p.bond=100;}s.ruins.relics={lantern:5,compass:5,flask:3};}
  if(strong&&start>=21){s.team=['forestking','oceandragon','phoenix'];for(const id of s.team)s.pets.push({...E.makePet(id),level:30,stars:3,bond:100});}
  if(start>1){s.ruins.best=start-1;s.ruins.clears=start-1;s.ruins.bosses=(start-1)/5;}
  assert.ok(!R.startRuinsJourney(s,start,()=>seed).error);return s;
}
export function settleRoom(s){
  let turns=0;
  while(s.ruins.run&&['battle','blessing','event'].includes(s.ruins.run.phase)&&turns++<80){
    const r=s.ruins.run;let out;
    if(r.phase==='event'){const e=R.ruinsEventContext(s);const c=e.choices.find(c=>['guide','outer','rest','talk','dew'].includes(c.id)&&!c.error)||e.choices.find(c=>!c.error);out=R.chooseRuinsEvent(s,c.id);}
    else if(r.phase==='blessing'){const priorities=['recovery','vitality','might','fireheart','tide','bastion','mirror','relay','dew'];out=R.chooseRuinsBlessing(s,priorities.find(id=>r.offers.includes(id))||r.offers[0]);}
    else if(r.hp<ruinsMaxHp(r)*.55&&r.potions)out=R.useRuinsPotion(s);
    else out=R.ruinsBattleTurn(s,r.focus>=2?'skill':ruinsIntent(r).danger?'guard':'attack');
    assert.ok(!out.error,out.error);E.validateSave(E.serialize(s));
  }
  assert.ok(turns<80,'room should finish');
}
export function planTo(run,target){
  const rows=ruinsRouteMap(run),end=ruinsRouteNode(run,target).room;
  function seek(row,previous,path){for(const n of rows[row]){if(previous&&previous.kind!=='boss'&&n.kind!=='boss'&&Math.abs(previous.lane-n.lane)>1)continue;if(row===end-1){if(n.id===target)return [...path,n.id];}else{const found=seek(row+1,n,[...path,n.id]);if(found)return found;}}return null;}
  return seek(0,null,[]);
}
export function enterNode(s,id){
  const plan=planTo(s.ruins.run,id);assert.ok(plan);
  for(const node of plan){assert.ok(!R.chooseRuinsPath(s,node).error);E.validateSave(E.serialize(s));if(node!==id)settleRoom(s);}
  return s;
}
export function eventFixture(event){
  for(let i=1;i<100;i++){
    const s=journey(i/101),node=ruinsRouteMap(s.ruins.run).flat().find(n=>n.room<5&&n.event===event);
    if(node)return enterNode(s,node.id);
  }
  throw Error('No event '+event);
}
export function battleFixture(room=8,elite=null){
  for(let i=1;i<100;i++){
    const s=journey(i/101),node=ruinsRouteMap(s.ruins.run)[room-1].find(n=>elite?n.elite===elite:['trail','vault','boss'].includes(n.kind));
    if(node)return enterNode(s,node.id);
  }
  throw Error('No battle fixture');
}
