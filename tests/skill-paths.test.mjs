import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { B } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import * as F from '../web/js/forge-engine.js';
import * as T from '../web/js/tactics.js';
import * as S from '../web/js/skill-training.js';
import { skillPaths } from '../web/js/skill-paths.js';
import { SPECIES } from '../web/js/data.js';
import { equippedSet } from '../web/js/forge-state.js';
import { newEnemyAI } from '../web/js/enemy-tactics.js';
import { previewOrder } from '../web/js/combat-preview.js';

const now=1800000000000,modes=['explore','ruins','boss'],clone=structuredClone;
const save=s=>E.validateSave(E.serialize(s),now);
const arena=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run.battle:s.expedition.battle;
const run=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run:s.expedition;
const turn=(s,m,move,grade='perfect')=>m==='boss'?B.bossBattleTurn(s,move,now,grade):m==='ruins'?R.ruinsBattleTurn(s,move,now,grade):E.battleTurn(s,move,()=>.5,grade);
const atomic=(s,fn)=>{const before=clone(s);assert.ok(fn().error);assert.deepEqual(s,before);};
function ready(team=['mossfox','axolotl','emberbird']){const s=E.newGame(now);s.level=10;s.resources={...s.resources,gold:10000,essence:100,food:10000};s.team=team;s.pets=team.map(id=>({...E.makePet(id,now),level:15}));return s;}
function start(s,m){
  if(m==='boss')B.startBoss(s,1,()=>.38,now);
  else if(m==='ruins'){R.startRuins(s,1,()=>.38,now);R.chooseRuinsPath(s,s.ruins.run.paths.find(p=>p!=='spring'),now);}
  else{E.startExpedition(s,'forest',()=>.1,now);E.chooseRoute(s,0,()=>.1);}
  const b=arena(s,m),r=run(s,m);b.tactics.ward=0;
  r.members.forEach(member=>member.power=10);if(m==='explore')r.power=40;
  r.hp=40;if(m==='explore')b.focus=3;else r.focus=3;
  return s;
}
function wear(s,id,recipes){for(const recipe of recipes){const item=F.addGear(s,recipe);assert.ok(!F.equipGear(s,id,item.id).error);}}

test('training unlocks at levels 5/10/15, pays once per rank, and free branch/base swaps retain rank',()=>{
  const s=ready(),p=s.pets[2];p.level=4;atomic(s,()=>S.chooseSkillBranch(s,p.id,'burn'));
  p.level=5;const before=clone(s.resources);assert.ok(!S.chooseSkillBranch(s,p.id,'burn').error);assert.equal(s.resources.gold,before.gold-150);assert.equal(s.resources.essence,before.essence-2);
  atomic(s,()=>S.chooseSkillBranch(s,p.id,'burn'));atomic(s,()=>S.upgradeSkillRank(s,p.id));
  const paid=clone(s.resources);for(const branch of ['shatter',null,'burn']){assert.ok(!S.chooseSkillBranch(s,p.id,branch).error);assert.deepEqual(s.resources,paid);assert.equal(p.training.rank,1);}
  for(const [level,gold,essence]of [[10,350,5],[15,700,9]]){p.level=level;const was=clone(s.resources);assert.ok(!S.upgradeSkillRank(s,p.id).error);assert.equal(was.gold-s.resources.gold,gold);assert.equal(was.essence-s.resources.essence,essence);}
  atomic(s,()=>S.upgradeSkillRank(s,p.id));save(s);
});
test('invalid ownership, branches, insufficient money and all journey locks are atomic',()=>{
  for(const [id,branch]of [['emberbird','shelter'],['missing','burn'],['toString','burn'],['emberbird','__proto__'],['emberbird',{}]]){const s=ready();atomic(s,()=>S.chooseSkillBranch(s,id,branch));}
  for(const currency of ['gold','essence']){const s=ready();s.resources[currency]=0;atomic(s,()=>S.chooseSkillBranch(s,'emberbird','burn'));}
  for(const m of modes){const s=ready();S.chooseSkillBranch(s,'emberbird','burn');start(s,m);atomic(s,()=>S.chooseSkillBranch(s,'emberbird','shatter'));atomic(s,()=>S.upgradeSkillRank(s,'emberbird'));}
});
test('all 116 branches at every rank produce saveable real skills in all three modes',()=>{
  let casts=0;
  for(const species of SPECIES)for(const path of skillPaths(species.id))for(const rank of [1,2,3])for(const m of modes){
    const ids=[species.id,...['mossfox','axolotl','emberbird'].filter(id=>id!==species.id)].slice(0,3),s=ready(ids);s.pets[0].training={rank,branch:path.id};start(s,m);
    const r=turn(s,m,`pet:${species.id}`);assert.ok(!r.error,`${species.id} ${path.id} ${rank} ${m}`);assert.ok(r.damage||r.heal||r.ward||r.gain);assert.equal(r.cost,T.petSkill(species.id,s.pets[0]).cost);assert.ok(Number.isFinite(r.damage));save(s);casts++;
  }
  assert.equal(casts,1044);
});
test('Emberbird chooses stronger burning or actual shield breaking; ranks strengthen the selected effect',()=>{
  for(const m of modes){const base=ready(),burn=clone(base),shatter=clone(base);burn.pets[2].training={rank:3,branch:'burn'};shatter.pets[2].training={rank:3,branch:'shatter'};
    for(const s of [base,burn,shatter]){start(s,m);arena(s,m).shield=50;}
    const a=turn(base,m,'pet:emberbird'),b=turn(burn,m,'pet:emberbird'),c=turn(shatter,m,'pet:emberbird');
    assert.ok(b.burnApplied>a.burnApplied);assert.ok(c.breakShield);assert.equal(arena(shatter,m).shield,0);assert.equal(c.burnApplied,0);assert.ok(c.damage>a.damage);assert.equal(c.offensive,true);save(shatter);
  }
});
test('shelter changes role and preserves drive/riposte, cannot target cores, counter or interrupt as offense',()=>{
  for(const m of modes){const s=ready();s.pets[1].training={rank:3,branch:'shelter'};start(s,m);const b=arena(s,m);b.strategy={stance:'balanced',drive:1,riposte:1};
    if(m!=='boss')b.enemyAI=newEnemyAI('armored');const r=turn(s,m,'pet:axolotl');assert.equal(r.damage,0);assert.equal(r.strategy.driveUsed,false);assert.equal(b.strategy.drive,1);assert.equal(b.strategy.riposte,1);assert.ok(r.ward>0);assert.equal(r.enemyCounter||0,0);assert.ok(T.formation(run(s,m).members).roles.includes('guard'));save(s);
  }
  const s=ready();s.pets[1].training={rank:3,branch:'shelter'};Object.assign(s.boss,{best:1,wins:1,clears:[1,0,0,0,0]});Object.assign(s.boss.rivals.frost,{best:1,wins:1,clears:[1,0,0,0,0]});
  B.startBoss(s,1,()=>.38,now,'phoenix');Object.assign(s.boss.run,{enemyHp:200,phase:2,focus:3});atomic(s,()=>B.bossBattleTurn(s,{move:'pet:axolotl',target:'core'},now));
  const caster=ready();caster.pets[1].training={rank:1,branch:'shelter'};start(caster,'explore');caster.expedition.battle.enemyAI=newEnemyAI('caster');const r=turn(caster,'explore','pet:axolotl');assert.equal(r.interrupted,false);assert.equal(caster.expedition.battle.enemyAI.casting,true);
});
test('sets require two matching pieces on one creature; mixed or spread items do not activate',()=>{
  const s=ready();wear(s,'mossfox',['frostfang']);wear(s,'axolotl',['glacierstone']);assert.equal(equippedSet(s,'mossfox'),null);assert.equal(equippedSet(s,'axolotl'),null);
  F.unequipGear(s,'axolotl','stone');F.equipGear(s,'mossfox','g2');assert.equal(equippedSet(s,'mossfox'),'frost');assert.equal(E.combatMembers(s)[0].gear.set,'frost');
  wear(s,'emberbird',['emberplume','dawnstone']);assert.equal(equippedSet(s,'emberbird'),'phoenix');F.unequipGear(s,'emberbird','stone');assert.equal(equippedSet(s,'emberbird'),null);save(s);
});
test('frost set grants exactly 10% after an actual perfect guard, never on good guards, idle or stagger',()=>{
  for(const m of modes){const s=ready();wear(s,'mossfox',['frostfang','glacierstone']);start(s,m);const initial=clone(s),r=turn(s,m,'guard');assert.equal(r.setWard,m==='boss'?15:10);assert.equal(arena(s,m).tactics.ward,r.setWard);save(s);
    const good=clone(initial);assert.equal(turn(good,m,'guard','good').setWard,undefined);
    const stagger=clone(initial);arena(stagger,m).rhythm.pressure=99;assert.equal(turn(stagger,m,'guard').setWard,undefined);
    const idle=clone(initial);if(m==='boss')idle.boss.run.turn=2;else arena(idle,m).enemyAI=newEnemyAI('caster');assert.equal(turn(idle,m,'guard').setWard,undefined);
    const normal=clone(initial);delete run(normal,m).members[0].gear.set;assert.equal(turn(normal,m,'guard').incoming,r.incoming,'new ward protects future, not current hit');
  }
});
test('frost set never stacks across party members and respects the shared 60% ward cap in ruins',()=>{
  const s=ready();for(const id of ['mossfox','axolotl'])wear(s,id,['frostfang','glacierstone']);start(s,'ruins');s.ruins.run.shield=58;
  const r=turn(s,'ruins','guard');assert.ok(r.setWard<=10);assert.ok(s.ruins.run.shield+arena(s,'ruins').tactics.ward<=60);save(s);
});
test('phoenix set buffs the wearers newly applied burn and elemental burn, without boosting direct hits or other actors',()=>{
  for(const m of modes){const s=ready();wear(s,'emberbird',['emberplume','dawnstone']);start(s,m);const plain=clone(s);delete run(plain,m).members[2].gear.set;
    const a=turn(s,m,'pet:emberbird'),b=turn(plain,m,'pet:emberbird');assert.equal(a.damage,b.damage);assert.ok(Math.abs(a.burnApplied-b.burnApplied*1.35)<=1.2,'burn is rounded once after multiplying the raw value');assert.equal(a.setBurn,true);save(s);
  }
  const members=[{id:'cottonbun',power:20,gear:{heal:0,ward:0,set:'phoenix'}},{id:'emberbird',power:20},{id:'axolotl',power:20}],t=T.newTactics(members);t.mark='emberbird';const r=T.castPetSkill(t,'cottonbun',{members,maxHp:100,baseDamage:100});assert.equal(r.burnApplied,54);assert.equal(r.setBurn,true);
  const t2=T.newTactics(members);const r2=T.castPetSkill(t2,'emberbird',{members,maxHp:100,baseDamage:100});assert.equal(r2.burnApplied,26);assert.equal(r2.setBurn,false);
});
test('previews including branches and sets are pure and match seeded real turns and burn ticks',()=>{
  for(const m of modes)for(const move of ['guard','pet:emberbird','pet:axolotl']){const s=ready();s.pets[2].training={rank:3,branch:'burn'};s.pets[1].training={rank:2,branch:'shelter'};wear(s,'emberbird',['emberplume','dawnstone']);wear(s,'mossfox',['frostfang','glacierstone']);start(s,m);const before=clone(s),p=previewOrder(s,m,move,'perfect');assert.deepEqual(s,before);assert.ok(!p.error);const r=turn(s,m,move);
    for(const key of ['damage','incoming','heal','ward','setWard','burnApplied','burnTurns'])assert.ok((r[key]||0)>=p[key].min&&(r[key]||0)<=p[key].max,`${m} ${move} ${key}`);
    if(m!=='explore'){const loaded=save(s),a=turn(s,m,'guard','auto'),b=turn(loaded,m,'guard','auto');assert.deepEqual(a,b);assert.deepEqual(s,loaded);}
  }
});
test('old active battles migrate only missing pet training, preserving existing snapshots and all progress',()=>{
  for(const m of modes){const s=ready();start(s,m);for(const pet of s.pets)delete pet.training;const before=clone(s),loaded=save(s);assert.deepEqual(run(loaded,m),run(before,m));assert.deepEqual(loaded.resources,s.resources);for(const p of loaded.pets){assert.deepEqual(p.training,{rank:0,branch:null});delete p.training;}assert.deepEqual(loaded.pets,before.pets);}
});
test('malformed present training and set snapshots are rejected rather than reset',()=>{
  const bad=[null,{},[],{rank:1,branch:'shelter'},{rank:4,branch:'burn'},{rank:0,branch:'burn'},{rank:-1,branch:null},{rank:1,branch:'burn',free:true},{rank:1.5,branch:'burn'}];
  for(const t of bad){const s=ready();s.pets[2].training=t;assert.throws(()=>save(s),/kỹ năng/);}
  const tooYoung=ready();tooYoung.pets[2].level=5;tooYoung.pets[2].training={rank:3,branch:'burn'};assert.throws(()=>save(tooYoung),/kỹ năng/);
  for(const m of modes){const s=ready();start(s,m);for(const training of bad){const a=clone(s);run(a,m).members[2].training=training;assert.throws(()=>save(a),/kỹ năng/);}
    for(const set of ['invalid',null,'__proto__']){const a=clone(s);run(a,m).members[0].gear={heal:0,ward:0,set};assert.throws(()=>save(a),/Trang bị/);}
  }
});
