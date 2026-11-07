import test,{mock,after} from 'node:test';
import assert from 'node:assert/strict';
import {E,T,towerGame,towerReady,towerStep,autoTowerTurn,climb,towerNow} from './tower-fixtures.mjs';
import {squadReady,squadGame} from './squad-fixtures.mjs';
import {towerSeason,towerOmen,towerMaxHp,towerPaths,towerPower,TOWER_BLESSINGS,towerBlessingAvailable} from '../web/js/tower-data.js';
import {previewOrder} from '../web/js/combat-preview.js';
import {setCombatRow,healthSum} from '../web/js/squad-state.js';
import {available,placeItem,commitLayout} from '../web/js/island-layout.js';
import {creature} from '../web/js/art.js';
import {startRuins} from '../web/js/ruins-engine.js';
import {startBoss} from '../web/js/boss-engine.js';
import {startDojo} from '../web/js/dojo-engine.js';

// Every fixture and action uses the same clock, even when this suite is run
// months after its reference week. Production timestamp validation stays strict.
mock.timers.enable({apis:['Date'],now:towerNow});
after(()=>mock.timers.reset());

const clone=structuredClone;
const roundtrip=s=>E.validateSave(E.serialize(s),towerNow);
const completed=()=>climb(towerGame({level:30,stars:3}),31,{save:true});
const changeHp=(s,amount)=>{const r=s.tower.run;r.squad.allies.forEach(u=>u.hp=Math.min(u.maxHp,amount));r.hp=healthSum(r.squad.allies);};
function getPath(id){for(const seed of [.1,.2,.3,.4,.5,.6,.7,.8,.9]){const s=towerGame({seed});if(s.tower.run.paths.includes(id))return s;}throw Error(`missing path ${id}`);}
function finishBattle(s){for(let i=0;s.tower.run?.phase==='battle'&&i<120;i++)autoTowerTurn(s);assert.notEqual(s.tower.run?.phase,'battle');return s;}

test('tower weeks reset at Monday midnight Vietnam and cycle three distinct omens',()=>{
  assert.equal(towerSeason(Date.parse('2026-10-25T16:59:59Z')),'2026-10-19');
  assert.equal(towerSeason(Date.parse('2026-10-25T17:00:00Z')),'2026-10-26');
  assert.equal(new Set(['2026-10-12','2026-10-19','2026-10-26'].map(s=>towerOmen(s).id)).size,3);
});
test('older saves migrate a dormant tower without altering an existing journey',()=>{
  const s=squadReady(),before=clone(s);delete s.tower;const restored=roundtrip(s);
  assert.deepEqual(restored.expedition,before.expedition);assert.deepEqual(restored.resources,before.resources);
  assert.equal(restored.tower.run,null);assert.equal(restored.tower.best,0);
});
test('entry gates reject atomically and one valid entry spends exactly ten food',()=>{
  for(const change of [s=>s.level=1,s=>s.resources.food=9,s=>E.startExpedition(s,'forest',()=>.4),s=>startDojo(s,'practice','plain')]){
    const s=squadGame();change(s);const before=clone(s);assert.ok(T.startTower(s,1,()=>.4,towerNow).error);assert.deepEqual(s,before);
  }
  const s=squadGame(),food=s.resources.food;assert.ok(T.startTower(s,1,()=>.4,towerNow).run);assert.equal(s.resources.food,food-10);const before=clone(s);
  assert.ok(T.startTower(s).error);assert.deepEqual(s,before);roundtrip(s);
});
test('tower locks the shared team, formation, expedition, ruins, dojo and boss',()=>{
  const s=towerGame(),before=clone(s);
  for(const f of [()=>E.toggleTeam(s,s.team[0]),()=>E.setTeamSlot(s,0,s.team[1]),()=>setCombatRow(s,s.team[0],'back'),()=>E.startExpedition(s,'forest'),()=>startRuins(s),()=>startBoss(s),()=>startDojo(s,'practice','plain')]){assert.ok(f().error);assert.deepEqual(s,before);}
});
test('path choices are seeded, unique, include battle and reserve every fifth floor for bosses',()=>{
  const s=towerGame(),r=s.tower.run;
  for(let floor=1;floor<=30;floor++){const paths=towerPaths({...r,floor});assert.deepEqual(paths,towerPaths({...r,floor}));assert.equal(new Set(paths).size,paths.length);if(floor%5===0)assert.deepEqual(paths,['boss']);else{assert.equal(paths.length,3);assert.ok(paths.includes('battle'));}}
});
test('invalid room, blessing, combat, claim and exchange actions cannot spend or advance',()=>{
  const s=towerGame();for(const f of [()=>T.chooseTowerPath(s,'constructor'),()=>T.chooseTowerBlessing(s,'might'),()=>T.towerBattleTurn(s,'attack'),()=>T.claimTowerMilestone(s,5),()=>T.claimTowerWeekly(s,5,towerNow),()=>T.exchangeTowerDust(s,'constructor'),()=>T.setTowerAura(s,true),()=>T.useTowerPotion(s)]){const before=clone(s);assert.ok(f().error);assert.deepEqual(s,before);}
  T.chooseTowerPath(s,'battle');for(const order of ['nope',{move:'skill',reason:'injected'},{move:'attack',foe:'not-there'},{move:'attack',target:'core'},'skill']){const before=clone(s);assert.ok(T.towerBattleTurn(s,order).error);assert.deepEqual(s,before);}
});
test('three allies and three enemies have individual HP and all allies attack',()=>{
  const s=towerReady(),r=s.tower.run;assert.equal(r.squad.enemies.length,3);assert.equal(r.squad.allies.length,3);
  const result=T.towerBattleTurn(s,'attack',towerNow);assert.deepEqual(result.actors,s.team);for(const id of s.team)assert.ok(result.unitEvents.some(e=>e.side==='enemy'&&e.kind==='damage'&&e.actor===id));roundtrip(s);
});
test('resume retains RNG and choosing a blessing twice cannot advance another floor',()=>{
  const s=towerReady({level:15});E.refreshDaily(s,towerNow);T.towerBattleTurn(s,'attack',towerNow);let restored=roundtrip(s);
  const a=autoTowerTurn(s),b=autoTowerTurn(restored);assert.deepEqual(a,b);assert.deepEqual(s,restored);
  finishBattle(s);assert.equal(s.tower.run.phase,'blessing');restored=roundtrip(s);assert.deepEqual(restored.tower.run,s.tower.run);
  const id=s.tower.run.offers[0];T.chooseTowerBlessing(s,id);roundtrip(s);const before=clone(s);assert.ok(T.chooseTowerBlessing(s,id).error);assert.deepEqual(s,before);
});
test('a complete thirty-floor AUTO climb validates after every action and defeats six bosses',()=>{
  const s=completed();assert.equal(s.tower.best,30);assert.equal(s.tower.bosses,6);assert.equal(s.tower.weeklyBest,30);assert.equal(s.tower.lastResult.status,'victory');assert.equal(s.tower.lastResult.cleared,30);assert.equal(s.tower.run,null);assert.equal(s.combatJournal.reports.length,8);assert.ok(s.combatJournal.reports.every(r=>r.mode==='tower'&&r.status==='victory'));
  const resources=clone(s.resources),dust=s.tower.dust;assert.ok(T.towerBattleTurn(s,'attack').error);assert.deepEqual(s.resources,resources);assert.equal(s.tower.dust,dust);roundtrip(s);
});
test('a starter team can make progress, loses later and keeps only banked floor rewards',()=>{
  let s=towerGame();const initial=clone(s.resources);s=climb(s,31,{save:true});assert.equal(s.tower.lastResult.status,'defeat');assert.ok(s.tower.best>=4&&s.tower.best<30);assert.equal(s.tower.best,s.tower.lastResult.cleared);
  for(const [k,n]of Object.entries(s.tower.lastResult.loot))assert.equal(s.resources[k],initial[k]+n);assert.equal(s.tower.dust,s.tower.lastResult.dust);roundtrip(s);
});
test('elite path adds a persistent curse and pays twelve bonus crystals once',()=>{
  const s=getPath('elite');s.tower.run.members.forEach(m=>m.power=300);const crystals=s.resources.crystals;
  T.chooseTowerPath(s,'elite',towerNow);assert.equal(s.tower.run.curse,1);finishBattle(s);assert.equal(s.resources.crystals,crystals+12);assert.equal(s.tower.run.phase,'blessing');roundtrip(s);
  T.chooseTowerBlessing(s,s.tower.run.offers[0]);assert.equal(s.tower.run.curse,1);roundtrip(s);
});
test('curse stacks alter real incoming damage on the same seeded turn',()=>{
  const a=towerReady(),b=clone(a);b.tower.run.curse=3;
  const first=T.towerBattleTurn(a,'charge',towerNow),cursed=T.towerBattleTurn(b,'charge',towerNow);assert.ok(cursed.incoming>first.incoming);assert.equal(cursed.damage,first.damage);
});
test('rest heals the real squad, gives energy, banks once and opens the next floor',()=>{
  const s=getPath('rest');changeHp(s,15);const r=s.tower.run,before=r.hp,result=T.chooseTowerPath(s,'rest',towerNow);
  assert.ok(result.heal>0);assert.equal(r.hp,Math.min(towerMaxHp(r),before+result.heal));assert.equal(r.focus,1);assert.equal(r.floor,2);assert.equal(r.cleared,1);assert.ok(s.tower.dust>0);roundtrip(s);
});
test('treasure advertises and grants gold and eight crystals while leaving at least one HP',()=>{
  const s=getPath('treasure');changeHp(s,1);const before=clone(s.resources),r=s.tower.run,hp=r.hp;const result=T.chooseTowerPath(s,'treasure',towerNow);
  assert.equal(result.treasure.crystals,8);assert.equal(s.resources.crystals,before.crystals+8);assert.equal(s.resources.gold,before.gold+r.loot.gold);assert.ok(r.hp>=1&&r.hp<=hp);assert.ok(r.squad.allies.every(u=>u.hp>0));assert.equal(r.floor,2);roundtrip(s);
});
test('a blessing room banks once and offers only compatible blessings',()=>{
  const s=getPath('blessing');T.chooseTowerPath(s,'blessing',towerNow);const r=s.tower.run;assert.equal(r.phase,'blessing');assert.equal(r.cleared,1);assert.ok(r.offers.every(id=>towerBlessingAvailable(TOWER_BLESSINGS.find(b=>b.id===id),r)));roundtrip(s);
  const before=clone(s);assert.ok(T.chooseTowerPath(s,'blessing').error);assert.deepEqual(s,before);
});
test('potions restore actual allied HP, preserve battle turns and run out after two uses',()=>{
  const s=towerReady(),r=s.tower.run;for(let i=0;i<2;i++){changeHp(s,7);const before=r.hp;const result=T.useTowerPotion(s);assert.equal(result.heal,39);assert.equal(r.hp,before+39);assert.equal(r.battle.turn,0);roundtrip(s);}assert.equal(r.potions,0);const before=clone(s);assert.ok(T.useTowerPotion(s).error);assert.deepEqual(s,before);
});
test('vitality resizes individual health budgets and restores exactly thirteen HP',()=>{
  const s=getPath('blessing');T.chooseTowerPath(s,'blessing',towerNow);const r=s.tower.run;r.offers=['vitality'];changeHp(s,8);const hp=r.hp;T.chooseTowerBlessing(s,'vitality');assert.equal(towerMaxHp(r),125);assert.equal(r.hp,hp+13);assert.equal(r.squad.allies.reduce((n,u)=>n+u.maxHp,0),125);roundtrip(s);
});
test('elemental and rarity blessings change power and do not offer impossible team synergies',()=>{
  const s=towerGame(),r=s.tower.run,p=towerPower(r);r.blessings.humble=1;assert.ok(towerPower(r)>p);r.blessings={might:1};assert.ok(towerPower(r)>p);
  assert.equal(towerBlessingAvailable(TOWER_BLESSINGS.find(b=>b.id==='harmony'),r),true);assert.equal(towerBlessingAvailable(TOWER_BLESSINGS.find(b=>b.id==='unison'),r),false);
  const mono=towerGame({team:['mossfox','ferncat','mushroom']}).tower.run;assert.equal(towerBlessingAvailable(TOWER_BLESSINGS.find(b=>b.id==='tide'),mono),false);assert.equal(towerBlessingAvailable(TOWER_BLESSINGS.find(b=>b.id==='unison'),mono),true);
});
test('Hỏa Vũ increases both shared and individual offensive skills',()=>{
  for(const move of ['skill','pet:emberbird']){const a=climb(towerGame({level:15}),5);T.chooseTowerPath(a,'boss',towerNow);const b=clone(a);a.tower.run.focus=3;b.tower.run.focus=3;b.tower.run.blessings.ember=(a.tower.run.blessings.ember||0)+1;const normal=T.towerBattleTurn(a,move,towerNow),buffed=T.towerBattleTurn(b,move,towerNow);assert.ok(buffed.damage>normal.damage,move);}
});
test('thorns reflect only when guarding an actual attack with a perfect beat',()=>{
  const idle=towerReady({seed:.1});idle.tower.run.blessings.thorns=1;assert.equal(T.towerBattleTurn(idle,'guard',towerNow,'perfect').reflected,0);
  const a=climb(towerGame({level:15}),5);T.chooseTowerPath(a,'boss',towerNow);a.tower.run.blessings.thorns=1;const b=clone(a);
  assert.equal(T.towerBattleTurn(a,'guard',towerNow,'auto').reflected,0);const result=T.towerBattleTurn(b,'guard',towerNow,'perfect');assert.ok(result.reflected>0);assert.equal(result.strategy.parried,true);
});
test('preview uses the exact next RNG sample without mutating progression or prizes',()=>{
  const s=towerReady(),before=clone(s),p=previewOrder(s,'tower',{move:'attack',stance:'balanced'});assert.deepEqual(s,before);const result=T.towerBattleTurn(s,{move:'attack',stance:'balanced'},towerNow);assert.equal(p.exact,true);assert.equal(p.damage.min,result.damage);assert.equal(p.incoming.min,result.incoming);assert.equal(p.hpAfter.min,s.tower.run.hp);assert.equal(p.enemyHpAfter.min,s.tower.run.battle.hp);roundtrip(s);
});
test('retreat keeps banked resources and retires the unfinished combat report once',()=>{
  const s=climb(towerGame({level:15}),3,{save:true});T.chooseTowerPath(s,'battle',towerNow);T.towerBattleTurn(s,'guard',towerNow);const resources=clone(s.resources),dust=s.tower.dust;
  assert.ok(T.retreatTower(s,towerNow).finished);assert.equal(s.tower.run,null);assert.equal(s.tower.lastResult.status,'retreat');assert.equal(s.combatJournal.reports[0].status,'retreat');assert.deepEqual(s.resources,resources);assert.equal(s.tower.dust,dust);const before=clone(s);assert.ok(T.retreatTower(s).error);assert.deepEqual(s,before);roundtrip(s);
});
test('all permanent milestones pay once and unlock island decorations and a cosmetic crown',()=>{
  const s=completed();assert.equal(available(s,'towerlamp'),false);assert.equal(available(s,'towerstatue'),false);
  for(const n of [5,10,15,20,25,30]){assert.ok(T.claimTowerMilestone(s,n).reward);const before=clone(s);assert.ok(T.claimTowerMilestone(s,n).error);assert.deepEqual(s,before);}
  assert.equal(available(s,'towerlamp'),true);assert.equal(available(s,'towerstatue'),true);const layout=clone(s.islandLayout);assert.ok(!placeItem(s,layout,'towerlamp',8,6).error);assert.ok(!placeItem(s,layout,'towerstatue',7,6).error);assert.ok(!commitLayout(s,layout).error);
  const power=E.petPower(s.pets[0],s);assert.ok(!T.setTowerAura(s,true).error);assert.match(creature(s.team[0],{source:s}),/tower-pet-crown/);assert.equal(E.petPower(s.pets[0],s),power);roundtrip(s);
});
test('weekly prizes cannot duplicate, and rollover preserves permanent progress and cosmetics',()=>{
  const s=completed();T.claimTowerMilestone(s,30);T.setTowerAura(s,true);assert.ok(T.claimTowerWeekly(s,5,towerNow).reward);const after=clone(s);assert.ok(T.claimTowerWeekly(s,5,towerNow).error);assert.deepEqual(s,after);
  const next=Date.parse('2026-10-25T17:00:00Z');assert.equal(T.refreshTower(s,next),true);assert.equal(s.tower.weeklyBest,0);assert.deepEqual(s.tower.weeklyClaimed,[]);assert.equal(s.tower.best,30);assert.equal(s.tower.aura,true);assert.ok(T.claimTowerWeekly(s,5,next).error);assert.equal(T.refreshTower(s,towerNow),false);E.validateSave(E.serialize(s),next);
});
test('an active old-week climb resumes and earns permanent rewards but no new-week credit',()=>{
  const s=climb(towerGame({level:30,stars:3}),5,{save:true}),old=clone(s.tower.run),next=Date.parse('2026-10-25T17:00:00Z');T.refreshTower(s,next);assert.deepEqual(s.tower.run,old);
  T.chooseTowerPath(s,'boss',next);for(let i=0;s.tower.run.phase==='battle'&&i<120;i++)autoTowerTurn(s,next);assert.equal(s.tower.best,5);assert.equal(s.tower.weeklyBest,0);assert.equal(s.tower.bosses,1);E.validateSave(E.serialize(s),next);
});
test('dust exchanges spend only their exact cost and reject insufficient funds',()=>{
  const s=towerGame();s.tower.dust=140;const before=clone(s.resources);assert.ok(T.exchangeTowerDust(s,'tickets').reward);assert.equal(s.resources.tickets,before.tickets+2);assert.equal(s.tower.dust,60);assert.ok(T.exchangeTowerDust(s,'essence').reward);assert.equal(s.tower.dust,0);assert.equal(s.resources.essence,before.essence+8);const empty=clone(s);assert.ok(T.exchangeTowerDust(s,'tickets').error);assert.deepEqual(s,empty);roundtrip(s);
});
test('weekly iron omen adds eighteen real enemy shield at encounter entry',()=>{
  for(const season of ['2026-10-12','2026-10-19','2026-10-26']){const s=towerGame();s.tower.run.season=season;T.chooseTowerPath(s,'battle',towerNow);assert.equal(s.tower.run.battle.shield,towerOmen(season).id==='iron'?18:0);}
});
test('silence reduces skill healing while potions retain full healing',()=>{
  const a=towerReady(),b=clone(a),seasons=['2026-10-12','2026-10-19','2026-10-26'];
  a.tower.run.season=seasons.find(s=>towerOmen(s).id==='silence');b.tower.run.season=seasons.find(s=>towerOmen(s).id==='storm');
  for(const s of [a,b]){changeHp(s,5);s.tower.run.focus=3;}
  const low=T.towerBattleTurn(a,'pet:axolotl',towerNow),full=T.towerBattleTurn(b,'pet:axolotl',towerNow);assert.ok(low.heal<full.heal&&low.heal>0);
  for(const s of [a,b]){changeHp(s,5);assert.equal(T.useTowerPotion(s).heal,39);}
});
test('opening formation shield respects a carried shield without losing save validity',()=>{
  const s=towerGame({team:['mossfox','cottonbun','axolotl']});s.tower.run.shield=67;T.chooseTowerPath(s,'battle',towerNow);assert.ok(s.tower.run.shield+s.tower.run.battle.tactics.ward<=67);roundtrip(s);
});
test('malformed tower phases, snapshots, allies, enemies, offers and claims are rejected',()=>{
  const valid=towerReady();for(const change of [s=>s.tower.best=31,s=>s.tower.weeklyBest=1,s=>s.tower.claimed=[5],s=>s.tower.aura=true,s=>s.tower.run.rng=0,s=>s.tower.run.floor=5,s=>s.tower.run.phase='path',s=>s.tower.run.members[0].power=0,s=>s.tower.run.members[0].id='not-a-pet',s=>s.tower.run.squad=null,s=>s.tower.run.hp--,s=>s.tower.run.squad.enemies[0].maxHp++,s=>s.tower.run.offers=['might'],s=>s.tower.run.blessings.unison=1,s=>s.tower.run.curse=4,s=>s.tower.run.paths=['battle'],s=>s.tower.run.battle.turn=120,s=>s.tower.run.battle.enemyAI.kind='caster']){const s=clone(valid);change(s);assert.throws(()=>roundtrip(s));}
});
