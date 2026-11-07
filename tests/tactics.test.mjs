import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import * as T from '../web/js/tactics.js';
import { PET_SKILLS } from '../web/js/tactics-data.js';
import { SPECIES, BY_ID } from '../web/js/data.js';
import { ruinsIntent, ruinsMaxHp } from '../web/js/ruins-data.js';

const clone=x=>structuredClone(x);
const roundtrip=s=>E.validateSave(E.serialize(s));
function battle(ids=['mossfox','axolotl','emberbird'],mode='explore'){
  const s=E.newGame();s.level=2;s.resources.food=10000;s.team=ids;s.pets=ids.map(id=>E.makePet(id));
  if(mode==='explore'){
    E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);
    s.expedition.power=100;s.expedition.hp=60;s.expedition.members.forEach(m=>m.power=20);
    s.expedition.battle.power=100;s.expedition.battle.focus=3;s.expedition.battle.tactics.ward=0;
  }else{
    R.startRuins(s,1,()=>.38);const r=s.ruins.run;r.floor=5;r.cleared=4;r.paths=['boss'];s.ruins.best=4;s.ruins.clears=4;
    r.members.forEach(m=>m.power=20);R.chooseRuinsPath(s,'boss');r.hp=60;r.focus=3;r.battle.tactics.ward=0;
  }
  return s;
}
const turn=(s,action,mode='explore')=>mode==='explore'?E.battleTurn(s,action,()=>.5):R.ruinsBattleTurn(s,action,123456);
const arena=(s,mode='explore')=>mode==='explore'?s.expedition.battle:s.ruins.run.battle;

test('all 58 creatures have explicit, usable skills in both expedition and ruins battles',()=>{
  assert.deepEqual(Object.keys(PET_SKILLS).sort(),SPECIES.map(s=>s.id).sort());
  assert.equal(new Set(SPECIES.map(s=>s.skill)).size,58);
  for(const species of SPECIES)for(const mode of ['explore','ruins']){
    const ids=[species.id,...['mossfox','axolotl','emberbird'].filter(id=>id!==species.id)].slice(0,3);
    const s=battle(ids,mode),b=arena(s,mode),kit=T.petSkill(species.id),before=clone(s.resources);
    const r=turn(s,'pet:'+species.id,mode);
    assert.ok(!r.error,`${species.id} ${mode}`);assert.equal(r.actor,species.id);assert.equal(r.skill,species.skill);
    assert.equal(b.tactics.cooldowns[species.id],kit.cooldown);assert.equal(b.tactics.mark,species.id);
    assert.ok(Number.isFinite(r.damage)&&r.damage>=0);assert.ok(Number.isFinite(r.heal)&&r.heal>=0);
    assert.ok(r.heal||r.damage||r.ward||r.gain,'a skill must affect the fight');
    assert.deepEqual(s.resources,before);roundtrip(s);
  }
});

test('healing, guarding and burning create different outcomes for the same starting fight',()=>{
  const healed=battle(),guarded=battle(['pebbleturtle','axolotl','emberbird']),burned=battle();
  const h=turn(healed,'pet:axolotl'),g=turn(guarded,'pet:pebbleturtle'),f=turn(burned,'pet:emberbird');
  assert.equal(h.heal,34);assert.ok(g.ward>=34);assert.ok(g.absorbed>0);assert.equal(f.heal,0);
  assert.equal(burned.expedition.battle.tactics.burn.turns,3);assert.ok(burned.expedition.battle.tactics.burn.amount>0);
  assert.ok(h.damage<f.damage);assert.ok(guarded.expedition.battle.tactics.ward>0);
});

test('energy, actor membership and cooldown failures leave every field and RNG untouched',()=>{
  for(const mode of ['explore','ruins']){
    const s=battle(undefined,mode),b=arena(s,mode);if(mode==='explore')b.focus=0;else s.ruins.run.focus=0;
    let before=clone(s);assert.ok(turn(s,'pet:mossfox',mode).error);assert.deepEqual(s,before);
    assert.ok(turn(s,'pet:voiddragon',mode).error);assert.deepEqual(s,before);
    if(mode==='explore')b.focus=3;else s.ruins.run.focus=3;
    turn(s,'pet:mossfox',mode);before=clone(s);
    assert.ok(turn(s,'pet:mossfox',mode).error);assert.deepEqual(s,before);
    assert.ok(turn(s,'pet:__proto__',mode).error);assert.deepEqual(s,before);
  }
});

test('cooldowns count other completed actions and a different pet can act while the first waits',()=>{
  const s=battle(undefined,'ruins'),r=s.ruins.run;
  turn(s,'pet:mossfox','ruins');assert.equal(r.battle.tactics.cooldowns.mossfox,3);
  turn(s,'guard','ruins');assert.equal(r.battle.tactics.cooldowns.mossfox,2);
  r.focus=3;turn(s,'pet:axolotl','ruins');assert.equal(r.battle.tactics.cooldowns.mossfox,1);assert.equal(r.battle.tactics.cooldowns.axolotl,2);
  turn(s,'guard','ruins');assert.equal(r.battle.tactics.cooldowns.mossfox,0);roundtrip(s);
});

test('leaf and water skills form a real healing combo in either order and ordinary moves keep the mark',()=>{
  for(const [first,second]of [['mossfox','axolotl'],['axolotl','mossfox']]){
    const s=battle(undefined,'ruins'),r=s.ruins.run;r.hp=20;r.battle.tactics.mark=first;
    const ordinary=clone(s);ordinary.ruins.run.battle.tactics.mark=null;
    const combo=turn(s,'pet:'+second,'ruins'),plain=turn(ordinary,'pet:'+second,'ruins');
    assert.equal(combo.combo,'Nảy mầm');assert.equal(combo.heal-plain.heal,12);
  }
  const s=battle(undefined,'ruins');s.ruins.run.battle.tactics.mark='mossfox';turn(s,'guard','ruins');
  assert.equal(s.ruins.run.battle.tactics.mark,'mossfox');
  s.ruins.run.focus=3;const r=turn(s,'pet:mossfox','ruins');assert.equal(r.combo,null);
});

test('water and fire combo boosts the followup hit and pierces an intact enemy shield',()=>{
  const s=battle(undefined,'ruins'),plain=clone(s);
  s.ruins.run.battle.tactics.mark='axolotl';s.ruins.run.battle.shield=60;plain.ruins.run.battle.shield=60;
  const combo=turn(s,'pet:emberbird','ruins'),normal=turn(plain,'pet:emberbird','ruins');
  assert.equal(combo.combo,'Hơi nước');assert.ok(combo.damage>normal.damage);assert.equal(s.ruins.run.battle.shield,60);
});

test('fire/wind adds a real burn, leaf/wind shields, and light/shadow shatters and weakens',()=>{
  const members=['emberbird','cottonbun','mossfox'].map(id=>({id,power:20}));
  let tactics=T.newTactics(members);tactics.mark='emberbird';
  let result=T.castPetSkill(tactics,'cottonbun',{members,baseDamage:30,maxHp:100});
  assert.equal(result.combo,'Hỏa phong');assert.deepEqual(tactics.burn,{amount:12,turns:2});
  tactics=T.newTactics(members);tactics.mark='cottonbun';
  result=T.castPetSkill(tactics,'mossfox',{members,baseDamage:30,maxHp:100});
  assert.equal(result.combo,'Tán lá');assert.equal(result.ward,18);
  const s=battle(['sunseal','nightcat','emberbird'],'ruins');s.ruins.run.battle.tactics.mark='sunseal';s.ruins.run.battle.shield=60;
  result=turn(s,'pet:nightcat','ruins');assert.equal(result.combo,'Nhật thực');assert.equal(s.ruins.run.battle.shield,0);assert.ok(s.ruins.run.battle.tactics.weaken.amount>=25);
});

test('unspent energy carries to the next expedition fight while all temporary effects reset',()=>{
  const s=E.newGame();E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);
  let result;for(let i=0;i<5&&s.expedition.battle;i++)result=turn(s,'attack');
  assert.ok(result.won);assert.ok(s.expedition.focus>=2);
  const energy=s.expedition.focus;const saved=roundtrip(s);E.chooseRoute(saved,0,()=>.1);
  assert.equal(saved.expedition.battle.focus,energy);assert.equal(saved.expedition.battle.tactics.mark,null);
  assert.deepEqual(saved.expedition.battle.tactics.cooldowns,{mossfox:0,axolotl:0,emberbird:0});
  assert.ok(!turn(saved,'pet:emberbird').error);roundtrip(saved);
});

test('matching roles change shield and damage values and opening formation grants a bounded shield',()=>{
  const protectedTeam=battle(['pebbleturtle','axolotl','emberbird']),plain=battle(['pebbleturtle','cottonbun','emberbird']);
  const protectedCast=turn(protectedTeam,'pet:pebbleturtle'),plainCast=turn(plain,'pet:pebbleturtle');
  assert.equal(protectedCast.ward,41);assert.equal(plainCast.ward,34);
  const tempo=battle(['emberbird','cottonbun','axolotl']),basic=battle();
  assert.ok(turn(tempo,'pet:emberbird').damage>turn(basic,'pet:emberbird').damage);
  const s=E.newGame();s.team=['emberbird','axolotl','cottonbun'];s.pets.push(E.makePet('cottonbun'));
  E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);assert.equal(s.expedition.battle.tactics.ward,6);
});

test('weakening reduces incoming attacks and a counter can finish once without double rewards',()=>{
  const weakened=battle(['nightcat','axolotl','emberbird']),normal=clone(weakened);
  assert.ok(turn(weakened,'pet:nightcat').incoming<turn(normal,'attack').incoming);
  const s=battle(['cinderhog','axolotl','emberbird']);s.expedition.battle.hp=30;
  const r=turn(s,'pet:cinderhog');assert.ok(r.won);assert.ok(r.reflected>0);
  const after=clone(s);assert.ok(turn(s,'pet:cinderhog').error);assert.deepEqual(s,after);
});

test('burn and regeneration tick on subsequent turns, expire, and do not run on a blocked click',()=>{
  const s=battle(undefined,'ruins'),r=s.ruins.run;
  r.battle.tactics.burn={amount:3,turns:2};r.battle.tactics.regen={amount:5,turns:2};r.focus=0;
  const before=clone(s);assert.ok(turn(s,'pet:mossfox','ruins').error);assert.deepEqual(s,before);
  let result=turn(s,'guard','ruins');assert.ok(result.damage>=3);assert.equal(result.heal,5);assert.equal(r.battle.tactics.burn.turns,1);
  result=turn(s,'guard','ruins');assert.equal(result.heal,5);assert.deepEqual(r.battle.tactics.burn,{amount:0,turns:0});roundtrip(s);
});

test('loading a battle preserves cooldowns, statuses, marks and seeded future outcomes exactly',()=>{
  const a=battle(undefined,'ruins');turn(a,'pet:mossfox','ruins');const b=roundtrip(a);
  for(const move of ['guard','guard','pet:axolotl','guard']){
    const x=turn(a,move,'ruins'),y=turn(b,move,'ruins');assert.deepEqual(x,y);assert.deepEqual(a,b);roundtrip(a);
  }
});

test('legacy active fights gain empty skill state without losing progress or existing shields',()=>{
  const old=battle();delete old.expedition.members;delete old.expedition.battle.tactics;delete old.expedition.battle.shield;
  const modern=roundtrip(old);assert.equal(modern.expedition.hp,old.expedition.hp);assert.equal(modern.expedition.power,old.expedition.power);assert.deepEqual(modern.pets,old.pets);assert.deepEqual(modern.resources,old.resources);
  assert.equal(modern.expedition.battle.tactics.mark,null);assert.equal(modern.expedition.battle.tactics.ward,0);
  const ruins=battle(undefined,'ruins');ruins.ruins.run.shield=30;delete ruins.ruins.run.battle.tactics;
  const restored=roundtrip(ruins);assert.equal(restored.ruins.run.shield,30);assert.equal(restored.ruins.run.focus,3);assert.equal(restored.ruins.run.battle.tactics.mark,null);
});

test('malformed present skill data is rejected instead of restoring energy or clearing cooldowns',()=>{
  const mutations=[
    b=>b.tactics=null,b=>b.tactics={},b=>b.tactics.version=2,
    b=>b.tactics.cooldowns.mossfox=-1,b=>b.tactics.cooldowns.mossfox=99,
    b=>delete b.tactics.cooldowns.mossfox,b=>b.tactics.cooldowns.unknown=0,
    b=>b.tactics.mark='voiddragon',b=>b.tactics.burn={amount:20,turns:99},
    b=>b.tactics.weaken={amount:100,turns:2},b=>b.tactics.regen={amount:0,turns:2},b=>b.tactics.ward=61
  ];
  for(const mode of ['explore','ruins'])for(const mutate of mutations){const s=battle(undefined,mode);mutate(arena(s,mode));assert.throws(()=>roundtrip(s),/kỹ năng|Phế Tích/);}
});

test('team replacements are atomic, use owned creatures, and stay locked throughout both journeys',()=>{
  const s=E.newGame();s.pets.push(E.makePet('pebbleturtle'));
  assert.ok(!E.setTeamSlot(s,0,'pebbleturtle').error);assert.deepEqual(s.team,['pebbleturtle','axolotl','emberbird']);
  for(const [slot,id]of [[1,'pebbleturtle'],[3,'mossfox'],[-1,'mossfox'],[0,'voiddragon']]){const before=clone(s);assert.ok(E.setTeamSlot(s,slot,id).error);assert.deepEqual(s,before);}
  E.startExpedition(s,'forest',()=>.1);let before=clone(s);assert.ok(E.setTeamSlot(s,0,'mossfox').error);assert.deepEqual(s,before);
  s.expedition=null;s.level=2;R.startRuins(s);before=clone(s);assert.ok(E.setTeamSlot(s,0,'mossfox').error);assert.deepEqual(s,before);
});

test('feeding during a journey cannot change the snapshotted damage contribution of a skill',()=>{
  for(const mode of ['explore','ruins']){
    const s=battle(undefined,mode),a=clone(s);for(let i=0;i<6;i++)E.feed(s,'emberbird');
    assert.deepEqual(turn(s,'pet:emberbird',mode),turn(a,'pet:emberbird',mode));roundtrip(s);
  }
});

test('varied long ruins runs using individual skills stay bounded and saveable on every turn',()=>{
  let casts=0,combos=0;
  for(let seed=1;seed<=8;seed++){
    const s=E.newGame();s.level=10;s.resources.food=10000;s.team=['forestking','worldturtle','solarkirin'];s.pets=s.team.map(id=>({...E.makePet(id),level:30,stars:3,bond:100}));s.ruins.relics={lantern:5,compass:5,flask:3};
    R.startRuins(s,1,()=>seed/11);let steps=0;
    while(s.ruins.run&&steps++<1000){
      const run=s.ruins.run;let r;
      if(run.phase==='path')r=R.chooseRuinsPath(s,run.paths.includes('trail')?'trail':run.paths[0]);
      else if(run.phase==='blessing')r=R.chooseRuinsBlessing(s,run.offers[0]);
      else{
        const order=run.hp<ruinsMaxHp(run)*.65?['forestking','worldturtle','solarkirin']:seed%2&&run.battle.tactics.mark===null?['worldturtle','solarkirin','forestking']:['solarkirin','worldturtle','forestking'];
        const available=order.filter(id=>!T.skillBlocked(run.battle.tactics,id,run.focus,run.members));
        const id=available.find(id=>id!==run.battle.tactics.mark)||available[0];
        r=R.ruinsBattleTurn(s,id?'pet:'+id:ruinsIntent(run).danger?'guard':'attack');if(r.actor)casts++;if(r.combo)combos++;
      }
      assert.ok(!r.error);roundtrip(s);assert.ok(Object.values(s.resources).every(n=>n>=0));
    }
    assert.ok(steps<1000);assert.ok(s.ruins.best>=10);
  }
  assert.ok(casts>20);assert.ok(combos>10);
});
