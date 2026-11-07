import test from 'node:test';
import assert from 'node:assert/strict';
import {E,R,B,modes,squadGame,squadReady,getRun,getBattle,turn,unitHp,roundtrip} from './squad-fixtures.mjs';
import * as D from '../web/js/dojo-engine.js';
import * as S from '../web/js/squad-state.js';
import * as C from '../web/js/squad-combat.js';
import {newTactics,petSkill} from '../web/js/tactics.js';
import {enemyTeam,exploreEnemies,ruinsEnemies,castActors,guardianEnemy} from '../web/js/combat-team.js';
import {previewOrder} from '../web/js/combat-preview.js';
import {ruinsEncounter,ruinsMaxHp,ruinsIntent} from '../web/js/ruins-data.js';
import {bossIntent,bossEnemy,bossId} from '../web/js/boss-state.js';
import {combatScene} from '../web/js/combat-stage.js';
import {RUINS_BLESSINGS} from '../web/js/ruins-data.js';
import {addGear,equipGear} from '../web/js/forge-engine.js';
const clone=structuredClone;
function fake(foes=['pebbleturtle','axolotl','emberbird'],team=['pebbleturtle','axolotl','emberbird']){
  const members=team.map(id=>({id,power:30})),run={members,hp:100,battle:{hp:100,round:1,tactics:newTactics(members)}};
  run.squad=S.newSquad(members,100);S.startSquadFight(run,foes.map((species,i)=>({id:`enemy-${i}`,species})),100,100);return run;
}
const res=()=>({absorbed:0,unitEvents:[]});
const sync=(s,m)=>unitHp(s,m,'allies',[]);

test('rows choose a guard or attacker at the front, allocate exact integer budgets and retain at least one front',()=>{
  for(const team of [['mossfox'],['mossfox','axolotl'],['pebbleturtle','axolotl','emberbird']]){
    const s=squadGame(team),r=S.newSquad(E.combatMembers(s),100);assert.equal(S.healthSum(r.allies),100);assert.ok(r.allies.some(u=>u.row==='front'));
    if(team.includes('pebbleturtle'))assert.ok(r.allies[0].maxHp>r.allies[1].maxHp);
    const front=r.allies.find(u=>u.row==='front');assert.ok(E.setCombatRow(s,front.id,'back').error);
    if(team.length>1){assert.ok(!E.setCombatRow(s,team.at(-1),'front').error);assert.ok(!E.setCombatRow(s,front.id,'back').error);assert.deepEqual(roundtrip(s).battleFormation,s.battleFormation);}
  }
});
test('row actions reject invalid targets atomically and lock all real journeys',()=>{
  const s=squadGame();for(const [id,row]of [['missing','front'],['mossfox','middle']]){const before=clone(s);assert.ok(E.setCombatRow(s,id,row).error);assert.deepEqual(s,before);}
  for(const m of modes){const s=squadReady(m),before=clone(s);assert.ok(E.setCombatRow(s,s.team[0],'front').error);assert.deepEqual(s,before);}
});
for(const mode of modes){
  test(`${mode}: new saves contain independent HP, stable targets and read-only scene snapshots`,()=>{
    const s=squadReady(mode),r=getRun(s,mode),before=clone(s),scene=combatScene(s,mode);
    assert.equal(r.squad.allies.length,3);assert.equal(r.squad.enemies.length,mode==='boss'?1:3);assert.equal(S.healthSum(r.squad.allies),r.hp);
    assert.deepEqual(roundtrip(s),s);assert.deepEqual(s,before);scene.squad.allies[0].hp=0;assert.deepEqual(s,before);
  });
  test(`${mode}: target choice directs damage and support to actual selected units`,()=>{
    const s=squadReady(mode),r=getRun(s,mode);unitHp(s,mode,'allies',[8,12,20]);if(mode==='ruins')r.battle.shield=0;
    const target=r.squad.enemies.at(-1).id,friend=r.squad.allies[1].id,out=turn(s,mode,{move:'pet:axolotl',foe:target,ally:friend});
    assert.ok(!out.error);assert.ok(out.unitEvents.some(e=>e.kind==='heal'&&e.target===friend&&e.amount>0));assert.ok(out.unitEvents.some(e=>e.side==='enemy'&&e.kind==='damage'&&e.target===target));
    assert.deepEqual(castActors('pet:axolotl',out,r.members).map(m=>m.id),['axolotl']);if(getRun(s,mode))roundtrip(s);
  });
  test(`${mode}: fallen allies never cast or contribute damage; their actions and dead targets reject before ticks or RNG`,()=>{
    const s=squadReady(mode),r=getRun(s,mode);unitHp(s,mode,'allies',[0,25,25]);r.squad.effects.regen='axolotl';getBattle(s,mode).tactics.regen={amount:3,turns:2};
    for(const order of ['pet:mossfox',{move:'attack',ally:'mossfox'},{move:'attack',foe:'enemy-99'}]){const before=clone(s);assert.ok(turn(s,mode,order).error);assert.deepEqual(s,before);}
    const out=turn(s,mode,'skill');assert.ok(!out.error);assert.ok(!out.actors.includes('mossfox'));assert.ok(!out.unitEvents.some(e=>e.actor==='mossfox'));assert.equal(out.squadAfter.allies[0].hp,0);if(getRun(s,mode))roundtrip(s);
  });
  test(`${mode}: support cannot revive midfight and ordinary damage scales with the living party`,()=>{
    const full=squadReady(mode),part=clone(full);unitHp(part,mode,'allies',[0,30,30]);
    const before=clone(part);const hp=C.healSquad(getRun(part,mode),100,{maxHp:getRun(part,mode).maxHp||100});assert.ok(hp>=0);assert.equal(getRun(part,mode).squad.allies[0].hp,0);
    const a=turn(full,mode,'attack'),b=turn(before,mode,'attack');assert.ok(b.damage<a.damage,`${b.damage}<${a.damage}`);if(getRun(full,mode))roundtrip(full);
  });
  test(`${mode}: preview executes actual rules on disposable copies, reports per-unit outcomes, and matches the committed result`,()=>{
    let s=squadReady(mode);const r=getRun(s,mode);unitHp(s,mode,'allies',[20,14,25]);const before=clone(s),order={move:'pet:axolotl',foe:r.squad.enemies.at(-1).id,ally:'mossfox',stance:'guarded'};
    const p=previewOrder(s,mode,order,'perfect');assert.ok(!p.error);assert.deepEqual(s,before);assert.ok(p.squad);
    const result=turn(s,mode,order,'perfect');for(const side of ['allies','enemies'])for(const u of result.squadAfter[side]){const range=p.squad[side].find(v=>v.id===u.id).hp;assert.ok(u.hp>=range.min&&u.hp<=range.max);}
    assert.ok(result.incoming>=p.incoming.min&&result.incoming<=p.incoming.max);assert.ok(result.damage>=p.damage.min&&result.damage<=p.damage.max);roundtrip(s);
  });
  test(`${mode}: save/reload continues the exact random stream, individual wards, deaths and cooldowns`,()=>{
    let a=squadReady(mode,['pebbleturtle','axolotl','emberbird']),b=roundtrip(a);
    for(let i=0;i<25&&getRun(a,mode)&&getBattle(a,mode);i++){
      const r=getRun(a,mode),alive=S.living(r.squad.allies),energy=mode==='explore'?r.battle.focus:r.focus;
      const caster=alive.find(u=>['pebbleturtle','axolotl'].includes(u.id)&&energy>=2&&!getBattle(a,mode).tactics.cooldowns[u.id]);
      const order=caster?{move:`pet:${caster.id}`,ally:alive.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0].id}:energy>=2?'skill':'attack';
      const ra=turn(a,mode,order),rb=turn(b,mode,order);assert.ok(!ra.error);assert.deepEqual(ra,rb);assert.deepEqual(a,b);b=roundtrip(b);
    }
  });
  test(`${mode}: finishing a battle rescues downed allies for later rooms and rewards can only pay once`,()=>{
    const s=squadReady(mode),r=getRun(s,mode);unitHp(s,mode,'allies',[0,25,25]);unitHp(s,mode,'enemies',r.squad.enemies.map((_,i)=>i?0:1));
    if(mode==='boss'){r.phase=3;r.roots=0;}
    const out=turn(s,mode,'attack');assert.ok(out.won||out.finished);assert.equal(out.squadAfter.allies[0].hp,0);
    const remaining=getRun(s,mode);if(remaining){assert.equal(remaining.squad.allies[0].hp,Math.ceil(remaining.squad.allies[0].maxHp*.25));assert.deepEqual(remaining.squad.enemies,[]);}
    roundtrip(s);const after=clone(s);assert.ok(turn(s,mode,'attack').error);assert.deepEqual(s,after);
  });
  test(`${mode}: malformed present squad state rejects instead of silently changing a saved battle`,()=>{
    const valid=squadReady(mode);for(const mutate of [
      r=>r.squad=null,r=>r.squad.version=2,r=>r.squad.allies[0].hp--,r=>r.squad.allies[0].maxHp++,r=>r.squad.allies[0].role='attack',r=>r.squad.allies[0].row='middle',r=>r.squad.allies.forEach(u=>u.row='back'),r=>r.squad.enemies[0].id='enemy-x',r=>r.squad.enemies[0].species='missing',r=>r.squad.effects.burn='nope',r=>r.squad.allies[0].ward=999,r=>r.squad.extra=1
    ]){const s=clone(valid);mutate(getRun(s,mode));assert.throws(()=>roundtrip(s));}
  });
}

test('front rows and rear protection reduce direct hits, and pierce or area attacks bypass them',()=>{
  const base=fake(['emberbird','axolotl','pebbleturtle']);base.squad.enemies.forEach(u=>u.cover=0);
  const hit=(target,options={})=>{const r=clone(base),result=res();C.hitSquadEnemies(r,r.battle,20,{actor:'emberbird',order:{move:'pet:emberbird',foe:target},result,...options});return result.unitEvents.find(e=>e.kind==='damage');};
  assert.equal(hit('enemy-2').amount,18);assert.equal(hit('enemy-1').amount,14);assert.equal(hit('enemy-1',{pierce:true}).amount,20);
  const r=clone(base),result=res();C.hitSquadEnemies(r,r.battle,30,{order:{move:'skill'},result});assert.deepEqual(result.unitEvents.filter(e=>e.kind==='damage').map(e=>e.amount),[10,10,10]);
});
test('active frontline guards intercept rear attacks, use their own ward, and bind burn to the actual victim',()=>{
  const r=fake();r.squad.enemies[0].cover=2;r.squad.enemies[0].ward=9;const result={...res(),appliesBurn:true};
  C.hitSquadEnemies(r,r.battle,20,{actor:'emberbird',order:{move:'pet:emberbird',foe:'enemy-1'},result});
  assert.ok(result.unitEvents.some(e=>e.kind==='cover'&&e.actor==='enemy-0'&&e.target==='enemy-1'));const hit=result.unitEvents.find(e=>e.kind==='damage');assert.equal(hit.target,'enemy-0');assert.equal(hit.absorbed,9);assert.equal(r.squad.effects.burn,'enemy-0');assert.equal(r.squad.enemies[1].hp,r.squad.enemies[1].maxHp);
});
test('each ally redirects the remaining attack to a living enemy after the chosen enemy falls',()=>{
  const r=fake();r.squad.enemies[0].hp=1;const result=res();C.hitSquadEnemies(r,r.battle,60,{order:{move:'attack',foe:'enemy-0'},result});
  const hits=result.unitEvents.filter(e=>e.kind==='damage');assert.equal(hits.length,3);assert.equal(hits[0].target,'enemy-0');assert.ok(hits.slice(1).every(e=>e.target!=='enemy-0'));assert.equal(result.unitEvents.filter(e=>e.kind==='down'&&e.target==='enemy-0').length,1);
});
test('regen and burn stay on their bound recipients and never jump after a recipient falls',()=>{
  const s=squadReady(),r=s.expedition;unitHp(s,'explore','allies',[0,4,4]);r.squad.effects.regen='mossfox';r.battle.tactics.regen={amount:5,turns:2};unitHp(s,'explore','enemies',[0,20,20]);r.squad.enemies.forEach(u=>u.cooldown=1);r.squad.effects.burn='enemy-0';r.battle.tactics.burn={amount:12,turns:2};
  const out=turn(s,'explore','charge');assert.equal(out.heal,0);assert.equal(out.damage,0);assert.equal(out.squadAfter.enemies[1].hp,20);assert.equal(out.squadAfter.allies[0].hp,0);
});
test('enemy healer and guard coordinate with cooldowns, skip downed actors and never consume wards without attacks',()=>{
  const r=fake(['axolotl','pebbleturtle','emberbird']);r.squad.enemies[2].hp=5;r.squad.enemies[0].hp=0;let plans=C.enemySquadPlans(r.squad,0);assert.ok(plans.every(p=>p.actor!=='enemy-0'));assert.equal(plans.find(p=>p.actor==='enemy-1').kind,'guard');
  r.squad.enemies[0].hp=5;r.squad.enemies[2].hp=0;r.battle.tactics.ward=20;r.squad.allies[0].ward=10;const before=clone(r),result=res();
  C.receiveSquadDamage(r,r.battle,30,{result});assert.equal(result.enemyAttacked,false);assert.equal(result.absorbed,0);assert.equal(r.battle.tactics.ward,20);assert.equal(r.squad.allies[0].ward,10);assert.equal(r.hp,before.hp);assert.ok(result.unitEvents.some(e=>e.kind==='heal'));assert.ok(result.unitEvents.some(e=>e.kind==='ward'));assert.equal(r.squad.enemies[0].cooldown,2);
  assert.ok(C.enemySquadPlans(r.squad,1).every(p=>p.kind==='attack'));
});
test('individual wards and team wards record exactly the HP they block and do not reflect idle enemy turns',()=>{
  const r=fake(['emberbird']);r.squad.allies[0].ward=5;r.battle.tactics.ward=5;const result=res();const incoming=C.receiveSquadDamage(r,r.battle,20,{result});
  assert.equal(incoming,8);assert.equal(result.absorbed,10);assert.equal(r.hp,92);assert.equal(r.battle.tactics.ward,0);assert.equal(r.squad.allies[0].ward,0);assert.equal(result.unitEvents.find(e=>e.kind==='damage').absorbed,10);
});
test('support skills use the selected recipient max HP and personal ward, keeping shared ward intact',()=>{
  const s=squadReady('boss',['pebbleturtle','axolotl','emberbird']),r=s.boss.run;r.tactics.ward=7;r.turn=2;
  const out=turn(s,'boss',{move:'pet:pebbleturtle',ally:'axolotl'});assert.ok(out.ward>0);assert.ok(out.squadAfter.allies.find(u=>u.id==='axolotl').ward>0);assert.equal(r.tactics.ward,7);assert.equal(out.squadAfter.allies[0].cover,1);roundtrip(s);
});
test('HP costs preserve the exact cost for uneven distributions without negative HP',()=>{
  for(const values of [[34,1,1],[1,1,31],[1,30,1],[0,1,1]])for(let cost=0;cost<40;cost++){
    const r=fake();r.squad.allies.forEach((u,i)=>u.hp=values[i]);r.hp=S.healthSum(r.squad.allies);const before=r.hp;C.squadHealthCost(r,cost);assert.equal(r.hp,Math.max(0,before-cost));assert.ok(r.squad.allies.every(u=>u.hp>=0));
  }
});
test('a previous active save keeps its classic encounter; its next fight upgrades once with current HP preserved',()=>{
  const s=squadReady();delete s.expedition.squad;s.expedition.hp=71;s.expedition.battle.hp=1;roundtrip(s);
  const out=turn(s,'explore','attack');assert.ok(out.won);assert.ok(!s.expedition.squad);const hp=s.expedition.hp;E.chooseRoute(s,0,()=>.1);assert.ok(s.expedition.squad);assert.equal(s.expedition.squad.enemies.length,3);assert.ok(s.expedition.hp>=hp);assert.equal(s.expedition.hp,S.healthSum(s.expedition.squad.allies));roundtrip(s);
});
test('saved row choices carry into every new encounter without mutating an active snapshot',()=>{
  const s=squadGame();E.setCombatRow(s,'axolotl','front');E.setCombatRow(s,'emberbird','back');E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);const r=s.expedition;
  assert.equal(r.squad.allies.find(u=>u.id==='axolotl').row,'front');assert.equal(r.squad.allies.find(u=>u.id==='emberbird').row,'back');const before=clone(r.squad);s.battleFormation.rows.axolotl='back';assert.deepEqual(r.squad,before);roundtrip(s);
});
test('free practice uses squad rules; fixed challenges and awakening puzzles retain their tuned rules',()=>{
  const s=squadGame();D.startDojo(s,'practice','plain');assert.ok(s.dojo.run.sandbox.expedition.squad);roundtrip(s);const real=clone({...s,dojo:undefined});D.dojoBattleTurn(s,'attack');assert.deepEqual({...s,dojo:undefined},real);
  D.abandonDojo?.(s);const t=squadGame();D.startDojo(t,'challenge','rhythm');assert.ok(!t.dojo.run.sandbox.expedition.squad);roundtrip(t);
});
test('boss roots, frost interrupts and phoenix revival preserve actual unit health and remain saveable',()=>{
  const treant=squadReady('boss'),tr=treant.boss.run;unitHp(treant,'boss','enemies',[180]);tr.phase=2;tr.roots=2;tr.turn=2;const root=turn(treant,'boss',{move:'attack',target:'roots'});assert.equal(root.rootsCut,2);assert.equal(tr.roots,0);roundtrip(treant);
  const frost=squadReady('boss',undefined,{boss:'frost'});frost.boss.run.turn=2;const ice=turn(frost,'boss','skill');assert.equal(ice.interrupted,true);assert.equal(ice.incoming,0);roundtrip(frost);
  const phoenix=squadReady('boss',undefined,{boss:'phoenix'}),ph=phoenix.boss.run;unitHp(phoenix,'boss','enemies',[1]);ph.phase=3;const fire=turn(phoenix,'boss','attack');assert.ok(fire.revived>0);assert.equal(ph.squad.enemies[0].hp,ph.enemyHp);assert.equal(ph.mechanics.revives,1);roundtrip(phoenix);
});
test('ruins blessings, potions and full journeys preserve per-unit HP, exact previews and one-time loot',()=>{
  const s=squadGame(['pebbleturtle','axolotl','emberbird']);s.pets.forEach(p=>{p.level=30;p.stars=3;});R.startRuinsJourney(s,1,()=>.15);let actions=0;
  while(s.ruins.run&&actions++<240){const r=s.ruins.run;let out;
    if(r.phase==='path')out=R.chooseRuinsPath(s,r.paths[0]);
    else if(r.phase==='event'){const context=R.ruinsEventContext(s);out=R.chooseRuinsEvent(s,context.choices.find(c=>!c.error).id);}
    else if(r.phase==='blessing')out=R.chooseRuinsBlessing(s,r.offers.find(x=>['vitality','recovery','might','tide','dew'].includes(x))||r.offers[0]);
    else if(r.hp<ruinsMaxHp(r)*.5&&r.potions)out=R.useRuinsPotion(s);
    else out=turn(s,'ruins',r.focus>=2?'skill':'attack','perfect');
    assert.ok(!out.error,out.error);roundtrip(s);if(s.ruins.run)assert.equal(S.healthSum(s.ruins.run.squad.allies),s.ruins.run.hp);
  }
  assert.ok(actions<240);assert.equal(s.ruins.lastResult.status,'victory');assert.equal(s.ruins.lastResult.cleared,10);
});
test('varied teams and every boss terminate within the original limits with valid saves after every action',()=>{
  for(const team of [['mossfox','axolotl','emberbird'],['pebbleturtle','axolotl','emberbird'],['emberbird'],['pebbleturtle','cottonbun']])for(const id of ['treant','frost','phoenix']){
    const s=squadReady('boss',team,{boss:id});let turns=0;
    while(s.boss.run&&turns++<65){const r=s.boss.run,alive=S.living(r.squad.allies),healer=alive.find(u=>petSkill(u.id,r.members).heal&&!r.tactics.cooldowns[u.id]&&r.focus>=petSkill(u.id,r.members).cost&&alive.some(v=>v.hp<v.maxHp*.6));
      const action=healer?{move:`pet:${healer.id}`,ally:alive.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0].id}:r.focus>=2?'skill':bossIntent(r).danger?'guard':'attack';
      const out=turn(s,'boss',action,'perfect');assert.ok(!out.error,out.error);roundtrip(s);
    }
    assert.ok(turns<=60);assert.ok(['victory','defeat'].includes(s.boss.lastResult.status));
  }
});
test('the starter party can defeat the first guardian with ordinary quick controls and receive one reward',()=>{
  const s=squadGame();B.startBoss(s,1,()=>.38);let n=0;
  while(s.boss.run&&n++<30){const r=s.boss.run,out=turn(s,'boss',r.focus>=2?'skill':bossIntent(r).danger?'guard':'attack');assert.ok(!out.error);roundtrip(s);}
  assert.equal(s.boss.lastResult.status,'victory');assert.equal(s.boss.wins,1);assert.equal(s.forge.items.length,1);const before=clone(s);assert.ok(B.bossBattleTurn(s,'skill').error);assert.deepEqual(s,before);
});
