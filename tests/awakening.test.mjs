import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { B } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import { D } from './legacy-combat.mjs';
import * as T from '../web/js/tactics.js';
import { newAwakening, awakenPet } from '../web/js/awakening-state.js';
import { AWAKENINGS, AWAKENING_IDS, awakeningCost, awakenedOf } from '../web/js/awakening-data.js';
import { previewOrder } from '../web/js/combat-preview.js';
import { offensiveMove } from '../web/js/combat-orders.js';
import { newEnemyAI } from '../web/js/enemy-tactics.js';
import { skillPaths } from '../web/js/skill-paths.js';
import { AWAKENING_PLANS, awakeningFixture, clearAwakening, awakeningOrder } from './awakening-fixtures.mjs';
const valid=s=>E.validateSave(E.serialize(s));
const outside=s=>{const c=structuredClone(s);delete c.dojo;delete c.awakening;return c;};
function fight(mode,id='mossfox',awakened=true){
 const s=awakeningFixture(awakened);s.team=[id,...['mossfox','axolotl','emberbird'].filter(p=>p!==id)].slice(0,3);
 if(mode==='boss'){B.startBoss(s,1,()=>.3);s.boss.run.focus=3;s.boss.run.hp=40;s.boss.run.members.forEach(m=>m.power=20);}
 else if(mode==='ruins'){R.startRuins(s,1,()=>.3);const r=s.ruins.run;r.floor=5;r.cleared=4;r.paths=['boss'];s.ruins.best=4;s.ruins.clears=4;R.chooseRuinsPath(s,'boss');r.focus=3;r.hp=40;r.members.forEach(m=>m.power=20);}
 else{E.startExpedition(s,'forest',()=>.3);E.chooseRoute(s,0,()=>.3);s.expedition.power=40;s.expedition.hp=100;s.expedition.members.forEach(m=>m.power=20);s.expedition.battle.power=200;s.expedition.battle.focus=3;}
 arena(s,mode).tactics.ward=0;return s;
}
const arena=(s,mode)=>mode==='boss'?s.boss.run:mode==='ruins'?s.ruins.run?.battle:s.expedition?.battle;
const energy=(s,mode)=>mode==='ruins'?s.ruins.run:arena(s,mode);
const members=(s,mode)=>mode==='ruins'?s.ruins.run.members:mode==='boss'?s.boss.run.members:s.expedition.members;
const turn=(s,mode,action,grade='auto')=>mode==='boss'?B.bossBattleTurn(s,action,Date.now(),grade):mode==='ruins'?R.ruinsBattleTurn(s,action,Date.now(),grade):E.battleTurn(s,action,()=>.5,grade);

test('1.11 saves migrate only absent awakening fields, including unchanged active snapshots and dojo sandboxes',()=>{
 for(const mode of ['explore','boss','ruins','practice']){let s=mode==='practice'?awakeningFixture():fight(mode,'mossfox',false);if(mode==='practice')D.startDojo(s,'practice','treant');const before=outside(s);delete s.awakening;for(const p of s.pets)delete p.awakened;if(s.dojo.run){delete s.dojo.run.sandbox.awakening;for(const p of s.dojo.run.sandbox.pets)delete p.awakened;}
 const loaded=valid(s);assert.deepEqual(loaded.awakening,newAwakening());assert.deepEqual(outside(loaded),before);assert.ok(loaded.pets.every(p=>p.awakened===false));}
});
test('awakening gates, exact costs, one-time payment and power gain are atomic and persistent',()=>{
 for(const id of AWAKENING_IDS){const s=awakeningFixture(),p=s.pets.find(p=>p.id===id);for(const modify of [()=>p.level=29,()=>{p.level=30;p.stars=2;},()=>p.stars=3]){modify();const before=structuredClone(s);assert.ok(awakenPet(s,id).error);assert.deepEqual(s,before);}clearAwakening(s,id);const before=structuredClone(s),power=E.petPower(p,s),r=awakenPet(s,id),cost=awakeningCost(id);assert.equal(r.pet,p);for(const [k,n]of Object.entries(cost))assert.equal(k in s.awakening.materials?s.awakening.materials[k]:s.resources[k],(k in before.awakening.materials?before.awakening.materials[k]:before.resources[k])-n);assert.ok(Math.abs(E.petPower(p,s)-power*1.15)<2);assert.equal(valid(s).pets.find(p=>p.id===id).awakened,true);const after=structuredClone(s);assert.ok(awakenPet(s,id).error);assert.deepEqual(s,after);}
});
test('missing materials, unsupported ids and every active journey or arena reject without spending',()=>{
 for(const id of ['__proto__','toString','cottonbun','missing']){const s=awakeningFixture(),before=structuredClone(s);assert.ok(awakenPet(s,id).error);assert.ok(D.startDojo(s,'awakening',id).error);assert.deepEqual(s,before);}
 for(const k of ['gold','essence','sigil','relic']){const s=awakeningFixture();clearAwakening(s,'mossfox');if(k in s.resources)s.resources[k]=0;else s.awakening.materials[k]=0;const before=structuredClone(s);assert.ok(awakenPet(s,'mossfox').error);assert.deepEqual(s,before);}
 for(const mode of ['explore','boss','ruins','practice']){const s=mode==='practice'?awakeningFixture():fight(mode,'mossfox',false);s.awakening.trials.mossfox={wins:1,bestTurns:5};if(mode==='practice')D.startDojo(s,'practice','plain');const before=structuredClone(s);assert.ok(awakenPet(s,'mossfox').error);assert.deepEqual(s,before);}
});
for(const id of AWAKENING_IDS)test(`${id}: its full trial is reachable, previewable and reloadable without real loot leaks`,()=>{
 let s=awakeningFixture(),before=outside(s),mats={...s.awakening.materials};assert.ok(D.startDojo(s,'awakening',id).run);assert.ok(D.dojoMembers(s.dojo.run).every(m=>!m.awakened));
 for(const step of AWAKENING_PLANS[id]){s=valid(s);const copy=structuredClone(s),order=awakeningOrder(step),p=previewOrder(s,'dojo',order,'perfect');assert.deepEqual(s,copy);const r=D.dojoBattleTurn(s,order,Date.now(),'perfect');assert.equal(r.error,undefined);for(const k of ['damage','incoming','heal','ward','coreDamage'])assert.equal(p[k].min,r[k]||0);valid(s);}
 assert.equal(s.dojo.lastResult.trialCleared,true);assert.equal(s.awakening.trials[id].wins,1);assert.deepEqual(s.awakening.materials,mats);assert.deepEqual(outside(s),before);assert.deepEqual(s.dojo.records,{});assert.deepEqual(s.dojo.lastResult.reward,{});assert.equal(s.dojo.lastResult.stars,0);
 clearAwakening(s,id);assert.equal(s.awakening.trials[id].wins,2);assert.deepEqual(outside(s),before);assert.equal(valid(s).awakening.trials[id].bestTurns,AWAKENING_PLANS[id].length);
});
test('victory with missing objectives, defeat and stopping do not clear a trial; current trial is resumable',()=>{
 for(const finish of ['incomplete','defeat','stop']){let s=awakeningFixture(),before=outside(s);D.startDojo(s,'awakening','mossfox');s=valid(s);if(finish==='stop')D.stopDojo(s);else{const ex=s.dojo.run.sandbox.expedition;if(finish==='defeat')ex.hp=1;else ex.battle.hp=1;D.dojoBattleTurn(s,'attack',Date.now(),'normal');}assert.equal(s.dojo.lastResult.trialCleared,false);assert.deepEqual(s.awakening.trials,{});assert.deepEqual(outside(s),before);valid(s);}
});
test('trial sandbox may coexist with a real battle and cannot advance it or transfer its boss materials',()=>{
 const s=fight('boss','mossfox',false),before=outside(s),mats={...s.awakening.materials};clearAwakening(s,'phoenix');assert.deepEqual(outside(s),before);assert.deepEqual(s.awakening.materials,mats);valid(s);
});
test('each ultimate resolves in all three modes, keeps normal skill cooldown ticking and can only be cast once',()=>{
 for(const id of AWAKENING_IDS)for(const mode of ['explore','boss','ruins']){const s=fight(mode,id),b=arena(s,mode);b.tactics.cooldowns[id]=2;const r=turn(s,mode,'awaken:'+id);assert.equal(r.error,undefined,`${mode} ${id}`);assert.equal(r.awakenedSkill,true);assert.equal(r.skill,AWAKENINGS[id].skill.name);assert.deepEqual(b.tactics.awakenUsed,[id]);assert.equal(b.tactics.cooldowns[id],1);assert.equal(energy(s,mode).focus,id==='axolotl'?1:0);assert.ok(r.damage||r.heal||r.ward);valid(s);if(arena(s,mode)){energy(s,mode).focus=3;const before=structuredClone(s);assert.ok(turn(s,mode,'awaken:'+id).error);assert.deepEqual(s,before);assert.deepEqual(valid(s).awakening,s.awakening);}}
});
test('an unavailable, foreign, spent or underfunded ultimate is rejected before statuses, RNG or strategy mutate',()=>{
 for(const mode of ['explore','boss','ruins'])for(const reason of ['old-snapshot','foreign','energy','used']){const s=fight(mode),b=arena(s,mode);b.tactics.burn={amount:7,turns:2};let id='mossfox';if(reason==='old-snapshot')delete members(s,mode)[0].awakened;if(reason==='foreign')id='sunfox';if(reason==='energy')energy(s,mode).focus=2;if(reason==='used')b.tactics.awakenUsed=['mossfox'];const before=structuredClone(s);assert.ok(turn(s,mode,'awaken:'+id).error);assert.deepEqual(s,before);}
});
test('Mossfox provides group healing, three future regen ticks and an extra combo heal without spending offense buffs',()=>{
 const ms=[{id:'mossfox',power:20,awakened:true},{id:'axolotl',power:20}],t=T.newTactics(ms);t.mark='axolotl';const r=T.castPetSkill(t,'mossfox',{members:ms,baseDamage:20,maxHp:100,currentHp:10,ultimate:true});assert.equal(r.damage,0);assert.equal(r.heal,52);assert.equal(r.ward,18);assert.deepEqual(t.regen,{amount:10,turns:3});for(let i=0;i<3;i++)assert.equal(T.startTacticTurn(t).heal,10);assert.equal(T.startTacticTurn(t).heal,0);
 for(const mode of ['explore','boss','ruins']){const s=fight(mode),b=arena(s,mode);b.strategy.drive=1;b.strategy.riposte=1;const r=turn(s,mode,'awaken:mossfox');assert.equal(r.strategy.driveUsed,false);assert.equal(b.strategy.drive,1);assert.equal(b.strategy.riposte,1);assert.equal(offensiveMove('awaken:mossfox',members(s,mode)),false);}
});
test('Axolotl cleanses frost and refunds one energy while its support cannot be aimed at a core',()=>{
 const s=fight('boss','axolotl');s.boss.run=null;for(const p of [s.boss,s.boss.rivals.frost]){p.best=1;p.wins=1;p.clears[0]=1;}B.startBoss(s,1,()=>.3,Date.now(),'frost');Object.assign(s.boss.run,{focus:3,hp:50});s.boss.run.mechanics.frozen=2;const r=turn(s,'boss','awaken:axolotl');assert.equal(r.thawed,true);assert.equal(s.boss.run.mechanics.frozen,0);assert.equal(s.boss.run.focus,1);assert.ok(r.heal>=60);valid(s);
 s.boss.run=null;B.startBoss(s,1,()=>.3,Date.now(),'phoenix');Object.assign(s.boss.run,{focus:3,phase:2,enemyHp:180});const before=structuredClone(s);assert.ok(turn(s,'boss',{move:'awaken:axolotl',target:'core'}).error);assert.deepEqual(s,before);
});
test('Emberbird detonates only remaining burn after the current tick, reapplies burn, and honors its fire set',()=>{
 const ms=[{id:'emberbird',power:20,awakened:true}],t=T.newTactics(ms);t.burn={amount:7,turns:3};assert.equal(T.startTacticTurn(t).damage,7);const r=T.castPetSkill(t,'emberbird',{members:ms,baseDamage:20,maxHp:100,ultimate:true});assert.equal(r.detonation,14);assert.equal(r.damage,70);assert.deepEqual(t.burn,{amount:13,turns:3});ms[0].gear={heal:0,ward:0,set:'phoenix'};const other=T.newTactics(ms),r2=T.castPetSkill(other,'emberbird',{members:ms,baseDamage:20,maxHp:100,ultimate:true});assert.equal(r2.damage,56);assert.equal(other.burn.amount,18);
});
test('Sunfox has a distinct piercing combo burst while Phoenix heals more only at low HP',()=>{
 const ms=[{id:'sunfox',power:20,awakened:true},{id:'mossfox',power:20}],a=T.newTactics(ms),b=T.newTactics(ms);b.mark='mossfox';const x=T.castPetSkill(a,'sunfox',{members:ms,baseDamage:20,maxHp:100,ultimate:true}),y=T.castPetSkill(b,'sunfox',{members:ms,baseDamage:20,maxHp:100,ultimate:true});assert.equal(x.pierce,true);assert.ok(y.damage>x.damage+11);
 for(const hp of [40,41]){const ms=[{id:'phoenix',power:20,awakened:true}],t=T.newTactics(ms),r=T.castPetSkill(t,'phoenix',{members:ms,baseDamage:20,maxHp:100,currentHp:hp,ultimate:true});assert.equal(r.heal,hp===40?50:25);assert.equal(r.rescue,hp===40);assert.deepEqual(t.burn,{amount:9,turns:3});}
});
test('Void dragon shatters shields and interrupts casters without rhythm; frost charge is never falsely reported as interrupted',()=>{
 const s=fight('explore','voiddragon');s.expedition.battle.enemyAI=newEnemyAI('caster');s.expedition.battle.shield=20;const r=turn(s,'explore','awaken:voiddragon','auto');assert.equal(r.breakShield,true);assert.equal(r.interrupted,true);assert.equal(r.incoming,0);assert.equal(s.expedition.battle.shield,0);assert.equal(s.expedition.battle.tactics.weaken.amount,45);valid(s);
 for(const i of [1,2]){const s=fight('boss','voiddragon');s.boss.run=null;s.boss.best=1;s.boss.wins=1;s.boss.clears[0]=1;B.startBoss(s,1,()=>.3,Date.now(),'frost');Object.assign(s.boss.run,{focus:3,turn:i});s.boss.run.members.forEach(m=>m.power=10);const r=turn(s,'boss','awaken:voiddragon','auto');assert.equal(r.interrupted,i===2);if(i===2)assert.equal(r.incoming,0);valid(s);}
});
test('ultimate previews are pure, match every kit in each mode, and used flags survive exact turn reloads',()=>{
 for(const mode of ['boss','ruins','explore'])for(const id of AWAKENING_IDS){let s=fight(mode,id),before=structuredClone(s),p=previewOrder(s,mode,'awaken:'+id,'perfect');assert.equal(p.error,undefined);assert.deepEqual(s,before);const r=turn(s,mode,'awaken:'+id,'perfect');for(const k of ['damage','incoming','heal','ward']){assert.ok((r[k]||0)>=p[k].min&& (r[k]||0)<=p[k].max,`${mode} ${id} ${k}`);}const other=valid(s);if(arena(s,mode)){assert.deepEqual(arena(other,mode).tactics.awakenUsed,[id]);const a=turn(s,mode,'guard'),b=turn(other,mode,'guard');assert.deepEqual(a,b);}}
});
test('an awakening changes only future journey snapshots and its once flag resets in the next fight',()=>{
 let s=fight('explore','mossfox',false);s.awakening.trials.mossfox={wins:1,bestTurns:5};const m=structuredClone(s.expedition.members);s.pets[0].awakened=true;assert.equal(awakenedOf(s.expedition.members,'mossfox'),false);assert.deepEqual(valid(s).expedition.members,m);assert.ok(turn(s,'explore','awaken:mossfox').error);
 s=fight('explore');turn(s,'explore','awaken:mossfox');s.expedition.battle.hp=1;turn(s,'explore','attack');E.chooseRoute(s,0,()=>.3);s.expedition.battle.focus=3;assert.equal(s.expedition.battle.tactics.awakenUsed,undefined);assert.equal(turn(s,'explore','awaken:mossfox').error,undefined);valid(s);
});
test('real boss wins and ruins boss floors award bounded awakening materials once; losses and ordinary floors do not',()=>{
 for(const outcome of ['win','lose','retreat']){const s=fight('boss'),before=s.awakening.materials.sigil;if(outcome==='win')s.boss.run.enemyHp=1;else if(outcome==='lose')s.boss.run.hp=1;const r=outcome==='retreat'?B.retreatBoss(s):turn(s,'boss','attack');assert.equal(s.awakening.materials.sigil,before+(outcome==='win'?2:0));assert.deepEqual(r.result.awakeningMaterials,outcome==='win'?{sigil:2}:{});const after=structuredClone(s);assert.ok(turn(s,'boss','attack').error);assert.deepEqual(s,after);valid(s);}
 const s=fight('ruins'),before=s.awakening.materials.relic;s.ruins.run.battle.hp=1;const r=turn(s,'ruins','attack');assert.deepEqual(r.awakeningMaterials,{relic:3});assert.equal(s.awakening.materials.relic,before+3);const after=structuredClone(s);assert.ok(turn(s,'ruins','attack').error);assert.deepEqual(s,after);valid(s);
});
test('malformed present awakening, trial, member and spent-skill data is rejected rather than reset',()=>{
 const cases=[s=>s.awakening=null,s=>s.awakening.version=2,s=>delete s.awakening.materials.relic,s=>s.awakening.materials.sigil=-1,s=>s.awakening.materials.relic=1.2,s=>s.awakening.trials.missing={wins:1,bestTurns:5},s=>s.awakening.trials.mossfox={wins:0,bestTurns:5},s=>s.awakening.trials.mossfox={wins:1,bestTurns:0},s=>s.pets[0].awakened='true',s=>s.pets[0].awakened=true,s=>{clearAwakening(s,'mossfox');s.pets[0].level=29;},s=>{D.startDojo(s,'awakening','mossfox');s.dojo.run.sandbox.expedition.members[0].awakened=true;},s=>{clearAwakening(s,'mossfox');s.dojo.lastResult.trialCleared=false;},s=>{clearAwakening(s,'mossfox');s.dojo.lastResult.reward={gold:1};}];
 for(const mutate of cases){const s=awakeningFixture();mutate(s);assert.throws(()=>valid(s));}
 for(const values of [['mossfox','mossfox'],['sunfox'],['missing'],'mossfox']){const s=fight('explore');s.expedition.battle.tactics.awakenUsed=values;assert.throws(()=>valid(s));}
});
test('trials preserve both trained branches as independent snapshots while keeping every loan member unawakened and balanced',()=>{
 for(const id of AWAKENING_IDS)for(const path of skillPaths(id))for(const rank of [1,3]){const s=awakeningFixture(true),pet=s.pets.find(p=>p.id===id);pet.training={branch:path.id,rank};D.startDojo(s,'awakening',id);const main=D.dojoMembers(s.dojo.run).find(m=>m.id===id);assert.deepEqual(main.training,pet.training);assert.ok(D.dojoMembers(s.dojo.run).every(m=>!m.awakened&&m.power===AWAKENINGS[id].trial.power));pet.training={branch:null,rank:3};assert.equal(main.training.branch,path.id);valid(s);D.stopDojo(s);valid(s);}
});
test('ordinary ruins floors, springs, retreat and defeat never award awakening materials',()=>{
 for(const kind of ['ordinary','spring','retreat','defeat']){const s=awakeningFixture(true);R.startRuins(s,1,()=>.3);const before={...s.awakening.materials},run=s.ruins.run;if(kind==='spring'){run.paths=['spring'];R.chooseRuinsPath(s,'spring');}else if(kind==='retreat')R.retreatRuins(s);else{R.chooseRuinsPath(s,run.paths.find(p=>p!=='spring'));if(kind==='ordinary')run.battle.hp=1;else run.hp=1;R.ruinsBattleTurn(s,'attack');}assert.deepEqual(s.awakening.materials,before);valid(s);}
});
test('an ultimate is available again on the next ruins floor while its creature snapshot stays awakened',()=>{
 const s=fight('ruins');s.ruins.run.hp=100;turn(s,'ruins','awaken:mossfox');s.ruins.run.battle.hp=1;turn(s,'ruins','attack');R.chooseRuinsBlessing(s,s.ruins.run.offers[0]);R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring'));s.ruins.run.focus=3;assert.equal(s.ruins.run.battle.tactics.awakenUsed,undefined);assert.equal(turn(s,'ruins','awaken:mossfox').awakenedSkill,true);assert.equal(s.ruins.run.members[0].awakened,true);valid(s);
});
