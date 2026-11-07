import test from 'node:test';
import assert from 'node:assert/strict';
import {E,modes,squadReady,squadGame,getRun,getBattle,turn,unitHp,roundtrip} from './squad-fixtures.mjs';
import {combatScene} from '../web/js/combat-stage.js';
import {travelScene} from '../web/js/journey-scene.js';
import {autoOrder,autoRoute,createAutoRunner} from '../web/js/auto-play.js';
import {EVENTS,BIOMES} from '../web/js/data.js';
import {newEnemyAI} from '../web/js/enemy-tactics.js';
import {awakeningFixture} from './awakening-fixtures.mjs';
const decision=(s,m='explore',options)=>{const {reason,...order}=autoOrder(combatScene(s,m),options);assert.ok(reason);return order;};

test('route decisions are read-only, always free, and valid for every event',()=>{
  const s=squadGame();E.startExpedition(s,'forest',()=>.1);const food=s.resources.food;
  for(let i=0;i<EVENTS.length;i++){s.expedition.event=i;const before=structuredClone(s),p=autoRoute(s);assert.ok(p);assert.deepEqual(s,before);assert.ok(!Object.values(EVENTS[i].choices[p.choice].cost||{}).some(n=>n>0));const copy=structuredClone(s);assert.ok(!E.chooseRoute(copy,p.choice,()=>.5).error);assert.equal(copy.resources.food,food);roundtrip(copy);}
  s.expedition.stage=BIOMES[0].stages-1;assert.equal(autoRoute(s).choice,0);assert.equal(travelScene(s).boss,true);
});
test('routes choose recovery when it is useful and never buy a donation',()=>{
  const s=squadGame();E.startExpedition(s,'forest',()=>.1);const heal=EVENTS.findIndex(e=>e.choices.some(c=>c.heal));assert.ok(heal>=0);s.expedition.event=heal;s.expedition.hp=10;
  assert.ok(EVENTS[heal].choices[autoRoute(s).choice].heal);const donation=EVENTS.findIndex(e=>e.choices.some(c=>c.cost));s.expedition.event=donation;assert.ok(!EVENTS[donation].choices[autoRoute(s).choice].cost);
});
test('no journey, active battles, and completed journeys cannot advance a route',()=>{
  assert.equal(autoRoute(E.newGame()),null);const s=squadReady();assert.equal(autoRoute(s),null);assert.equal(travelScene(s),null);s.expedition.battle=null;s.expedition.stage=4;assert.equal(autoRoute(s),null);assert.equal(autoOrder(travelScene(s)),null);
});
test('AUTO heals the actual weakest living ally and excludes fallen casters and targets',()=>{
  const s=squadReady();unitHp(s,'explore','allies',[4,33,0]);const before=structuredClone(s),order=decision(s);assert.equal(order.move,'pet:axolotl');assert.equal(order.ally,'mossfox');assert.deepEqual(s,before);assert.ok(!turn(s,'explore',order).error);roundtrip(s);
});
test('target priority switches between an enemy healer and the lowest HP ratio',()=>{
  const s=squadReady(),scene=combatScene(s,'explore');scene.squad.enemies.forEach(u=>u.role='attack');scene.squad.enemies[0].role='heal';scene.squad.enemies[1].hp=1;
  assert.equal(autoOrder(scene).foe,scene.squad.enemies[0].id);assert.equal(autoOrder(scene,{priority:'weak'}).foe,scene.squad.enemies[1].id);scene.squad.enemies[1].hp=0;assert.notEqual(autoOrder(scene,{priority:'weak',foe:scene.squad.enemies[1].id}).foe,scene.squad.enemies[1].id);
});
test('normal cooldowns and energy prevent repeated casts; AUTO uses Hợp lực as fallback',()=>{
  const s=squadReady();getBattle(s,'explore').tactics.cooldowns.emberbird=2;assert.equal(decision(s).move,'skill');getBattle(s,'explore').focus=0;assert.equal(decision(s).move,'attack');
});
test('support enables the waiting teammate instead of spending another attack',()=>{
  const s=squadReady('explore',['pebbleturtle','axolotl','cottonbun']);getBattle(s,'explore').tactics.cooldowns.axolotl=2;const order=decision(s);assert.equal(order.move,'pet:cottonbun');assert.equal(order.ally,'axolotl');const r=turn(s,'explore',order);assert.equal(r.haste,1);assert.equal(getBattle(s,'explore').tactics.cooldowns.axolotl,0);roundtrip(s);
});
test('AUTO puts a frontline guard under cover before a dangerous response',()=>{
  const s=squadReady('explore',['pebbleturtle','axolotl','cottonbun']);getBattle(s,'explore').round=2;unitHp(s,'explore','allies',[25,30,30]);const order=decision(s);assert.equal(order.move,'pet:pebbleturtle');assert.equal(order.ally,'pebbleturtle');assert.equal(turn(s,'explore',order).taunted,true);roundtrip(s);
});
test('AUTO interrupts a caster using ordinary Hợp lực, with no perfect rhythm bonus',()=>{
  const s=squadReady();getBattle(s,'explore').enemyAI=newEnemyAI('caster');const order=decision(s);assert.equal(order.move,'skill');const r=turn(s,'explore',order);assert.equal(r.interrupted,true);assert.equal(r.rhythm.grade,'auto');assert.equal(r.rhythm.pressure,0);roundtrip(s);
});
test('AUTO takes safe charge opportunities but respects existing drive and frost',()=>{
  const s=squadReady('boss',undefined,{boss:'frost'}),r=s.boss.run;r.focus=0;r.turn=1;assert.equal(decision(s,'boss').move,'charge');r.strategy.drive=1;assert.notEqual(decision(s,'boss').move,'charge');r.strategy.drive=0;r.mechanics.frozen=2;assert.notEqual(decision(s,'boss').move,'charge');
});
test('AUTO uses an awakened skill once and still obeys energy and per-fight limits',()=>{
  const s=awakeningFixture(true);E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);s.expedition.battle.focus=3;s.expedition.power=30;s.expedition.battle.power=90;
  let order=decision(s);assert.equal(order.move,'awaken:emberbird');assert.equal(turn(s,'explore',order).awakenedSkill,true);s.expedition.battle.focus=3;assert.notEqual(decision(s).move,'awaken:emberbird');roundtrip(s);
});
test('AUTO targets exposed boss roots and phoenix core only with offensive moves',()=>{
  for(const id of ['treant','phoenix']){const s=squadReady('boss',undefined,{boss:id}),r=s.boss.run;r.phase=2;r.enemyHp=Math.floor(r.squad.enemies[0].maxHp*.55);r.squad.enemies[0].hp=r.enemyHp;if(id==='treant')r.roots=2;const order=decision(s,'boss');assert.equal(order.target,id==='treant'?'roots':'core');assert.ok(!turn(s,'boss',order).error);roundtrip(s);}
});
for(const mode of modes)test(`${mode}: all AUTO turns use legal engine orders and remain reloadable`,()=>{
  let s=squadReady(mode),n=0;while(combatScene(s,mode)&&n++<60){const before=structuredClone(s),order=decision(s,mode);assert.deepEqual(s,before);const r=turn(s,mode,order);assert.ok(!r.error,r.error);s=roundtrip(s);}assert.ok(n<60);
});
test('classic active saves can use AUTO without adding unit targeting to the old encounter',()=>{
  for(const mode of modes){const s=squadReady(mode);delete getRun(s,mode).squad;const order=decision(s,mode);assert.ok(!('foe' in order)&&!('ally' in order));assert.ok(!turn(s,mode,order).error);roundtrip(s);}
});
test('a whole trip walks through every battle, pays once, stops, and replays identically after reloads',()=>{
  const fixture=squadGame();fixture.pets.forEach(p=>p.level=20);
  function trip(reload){let s=structuredClone(fixture);E.startExpedition(s,'forest',()=>.5,1720000000000);const start=s.resources.food,stats=s.stats.expeditions;let n=0,rooms=0,result,casts=[];
    while(s.expedition&&n++<100){if(reload)s=roundtrip(s);if(s.expedition.battle){const order=decision(s);casts.push(order.move);result=E.battleTurn(s,order,()=>.5);}else{rooms++;result=E.chooseRoute(s,autoRoute(s).choice,()=>.5);}assert.ok(!result.error);}
    assert.ok(n<100);assert.equal(rooms,4);assert.equal(s.stats.expeditions,stats+1);assert.equal(result.finished,true);assert.equal(result.success,true);assert.equal(s.resources.food,start+result.reward.food);assert.ok(casts.some(m=>m.startsWith('pet:')));assert.ok(casts.includes('skill'));const before=structuredClone(s);assert.ok(E.battleTurn(s,'attack').error);assert.equal(autoRoute(s),null);assert.deepEqual(s,before);roundtrip(s);return {resources:s.resources,casts,clears:s.clears};}
  assert.deepEqual(trip(false),trip(true));
});

function clock(){let at=0,id=0;const tasks=new Map();return {tasks,setTimer:(fn,ms)=>{tasks.set(++id,{fn,at:at+ms});return id;},clearTimer:i=>tasks.delete(i),tick(ms){const end=at+ms;for(;;){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;at=next[1].at;tasks.delete(next[0]);next[1].fn();}at=end;}};}
test('one timer commits one step; renders, speed changes and repeated enabling never duplicate it',()=>{
  const c=clock();let steps=0;const a=createAutoRunner({...c,ready:()=>true,step:()=>steps++});a.setEnabled(true);a.schedule();a.schedule();assert.equal(c.tasks.size,1);c.tick(899);assert.equal(steps,0);c.tick(1);assert.equal(steps,1);c.tick(10000);assert.equal(steps,1);a.schedule();a.setSpeed(2);a.setEnabled(true);assert.equal(c.tasks.size,1);c.tick(450);assert.equal(steps,2);
});
test('busy actors wait, closing disables, and background time never catches up',()=>{
  const c=clock();let ready=false,steps=0;const a=createAutoRunner({...c,ready:()=>ready,step:()=>{steps++;a.schedule();}});a.setEnabled(true);c.tick(2700);assert.equal(steps,0);assert.equal(c.tasks.size,1);a.suspend();ready=true;c.tick(60000);assert.equal(steps,0);assert.equal(c.tasks.size,0);a.resume();c.tick(899);assert.equal(steps,0);c.tick(1);assert.equal(steps,1);a.stop();c.tick(60000);assert.equal(steps,1);assert.equal(c.tasks.size,0);assert.equal(a.enabled,false);
});
test('changing travel versus combat delay schedules only the next visible action',()=>{
  const c=clock();let travel=true,steps=0;const a=createAutoRunner({...c,ready:()=>true,delay:()=>travel?2300:900,step:()=>{steps++;travel=false;a.schedule();}});a.setEnabled(true);c.tick(2299);assert.equal(steps,0);c.tick(1);assert.equal(steps,1);c.tick(900);assert.equal(steps,2);a.setEnabled(false);c.tick(10000);assert.equal(steps,2);
});
