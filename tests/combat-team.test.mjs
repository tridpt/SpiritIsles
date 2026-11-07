import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import {BIOMES,BY_ID} from '../web/js/data.js';
import {ruinsEncounter} from '../web/js/ruins-data.js';
import {enemyTeam,exploreEnemies,ruinsEnemies,castActors,castCaption} from '../web/js/combat-team.js';
import {combatScene} from '../web/js/combat-stage.js';
import {battleFixture} from './ruins-route-fixtures.mjs';

test('every region has distinct normal opponents, a single ruler and stable formations after a save round trip',()=>{
  for(const biome of BIOMES){
    const s=E.newGame();s.level=20;s.resources.food=5000;E.startExpedition(s,biome.id,()=>.1);E.chooseRoute(s,0,()=>.1);
    for(const stage of [0,1,biome.stages-1]){
      s.expedition.stage=stage;s.expedition.battle.boss=stage===biome.stages-1;
      const before=structuredClone(s),members=exploreEnemies(s.expedition),n=s.expedition.battle.boss?1:stage===0?2:3;
      assert.equal(members.length,n,biome.id);assert.equal(new Set(members.map(m=>m.species)).size,n);assert.ok(members.every(m=>BY_ID[m.species]));
      assert.deepEqual(exploreEnemies(E.validateSave(E.serialize(s)).expedition),members);assert.deepEqual(s,before);
      s.expedition.battle.round++;s.expedition.battle.hp=37;assert.deepEqual(exploreEnemies(s.expedition),members);
    }
  }
});

test('ruins groups vary by room and chapter while bosses remain single and previews never change the run RNG',()=>{
  const s=E.newGame();s.level=2;s.resources.food=5000;R.startRuins(s,1,()=>.4);R.chooseRuinsPath(s,s.ruins.run.paths.find(id=>id!=='spring'));
  for(let floor=1;floor<=50;floor++){
    s.ruins.run.floor=floor;const before=structuredClone(s),e=ruinsEncounter(s.ruins.run),members=ruinsEnemies(s.ruins.run,e);
    assert.equal(members.length,e.boss?1:floor===1?2:3);assert.equal(members[0].species,e.species);assert.equal(new Set(members.map(m=>m.species)).size,members.length);
    combatScene(s,'ruins');assert.deepEqual(s,before);
  }
  const active=battleFixture(),before=structuredClone(active),scene=combatScene(active,'ruins');assert.ok(scene.enemyMembers.length>=2);assert.deepEqual(active,before);
  assert.deepEqual(ruinsEnemies(E.validateSave(E.serialize(active)).ruins.run,ruinsEncounter(active.ruins.run)),scene.enemyMembers);
});

test('Hợp lực, team attacks and defense include every actual member; individual skills include only their caster',()=>{
  const full=E.newGame().pets.map(p=>({id:p.id,power:30}));
  for(const members of [full,full.slice(1),full.slice(2)]){
    for(const move of ['attack','skill','guard','charge'])assert.deepEqual(castActors(move,{actor:'mossfox'},members),members);
    for(const m of members){assert.deepEqual(castActors(`pet:${m.id}`,{},members),[m]);assert.deepEqual(castActors(`awaken:${m.id}`,{},members),[m]);}
    assert.match(castCaption('skill',{},members),new RegExp(`Hợp lực ${members.length} thú`));
  }
  assert.deepEqual(castActors('pet:phoenix',{},full),[]);assert.equal(castActors('skill',{},[...full,full[0]]).length,3);
  assert.deepEqual(enemyTeam({primary:'__proto__',element:'invalid'}).map(m=>m.species),['mossfox']);
});
