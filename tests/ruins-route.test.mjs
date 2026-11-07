import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import { R } from './legacy-combat.mjs';
import {ruinsRouteMap,ruinsRouteNext,ROUTE_EVENTS,ROUTE_BUILD_IDS} from '../web/js/ruins-route.js';
import {ruinsMaxHp,ruinsIntent} from '../web/js/ruins-data.js';
import {previewOrder} from '../web/js/combat-preview.js';
import {journey,settleRoom,eventFixture,battleFixture} from './ruins-route-fixtures.mjs';
const copy=s=>structuredClone(s);
test('a seeded ten-room map has real connected branches, two guardians and no read-time random draws',()=>{
  const s=journey(),r=s.ruins.run,before=copy(s);const map=ruinsRouteMap(r);
  assert.equal(map.length,10);assert.equal(map.flat().length,26);assert.deepEqual(map[4].map(n=>n.kind),['boss']);assert.deepEqual(map[9].map(n=>n.kind),['boss']);
  for(let i=0;i<20;i++)assert.deepEqual(ruinsRouteMap(r),map);assert.deepEqual(s,before);
  assert.notDeepEqual(ruinsRouteMap(journey(.55).ruins.run),map);
  const edge=map[0].find(n=>n.lane===0);R.chooseRuinsPath(s,edge.id);settleRoom(s);assert.ok(ruinsRouteNext(r).every(n=>n.lane<2));const locked=map[1].find(n=>n.lane===2),snapshot=copy(s);assert.ok(R.chooseRuinsPath(s,locked.id).error);assert.deepEqual(s,snapshot);
});
test('entry and legacy runs preserve the old map, balances and current battle exactly',()=>{
  const s=E.newGame();s.level=2;s.resources.food=100;R.startRuins(s,1,()=>.2);const path=s.ruins.run.paths.find(p=>p!=='spring');R.chooseRuinsPath(s,path);R.ruinsBattleTurn(s,'guard');const old=copy(s),loaded=E.validateSave(E.serialize(s));assert.deepEqual(loaded,old);assert.equal(Object.hasOwn(loaded.ruins.run,'route'),false);assert.ok(R.startRuinsJourney(s).error);assert.deepEqual(s,old);
  const locked=E.newGame(),before=copy(locked);assert.ok(R.startRuinsJourney(locked).error);assert.deepEqual(locked,before);
});
test('all events offer explicit, deterministic choices that can be saved before and after resolving',()=>{
  for(const type of Object.keys(ROUTE_EVENTS)){
    const base=eventFixture(type);base.ruins.run.hp=80;base.ruins.run.potions=0;
    const before=copy(base),a=R.ruinsEventContext(base);assert.ok(a.choices.length>=2);assert.ok(a.choices.every(c=>!c.error));assert.deepEqual(R.ruinsEventContext(base),a);assert.deepEqual(base,before);
    for(const c of a.choices){const s=E.validateSave(E.serialize(base)),floor=s.ruins.run.floor,cleared=s.ruins.run.cleared;const out=R.chooseRuinsEvent(s,c.id);assert.ok(!out.error,out.error);assert.equal(s.ruins.run.floor,floor+1);assert.equal(s.ruins.run.cleared,cleared+1);assert.equal(s.ruins.run.route.history.at(-1).choice,c.id);assert.equal(s.ruins.run.battle,null);E.validateSave(E.serialize(s));const once=copy(s);assert.ok(R.chooseRuinsEvent(s,c.id).error);assert.deepEqual(s,once);}
  }
});
test('insufficient food, gold, life, full potions and invalid events cannot mutate, spend or redraw',()=>{
  for(const [type,id,change]of [
    ['rescue','feed',s=>s.resources.food=0],['rescue','lift',s=>s.ruins.run.hp=1],['altar','offer',s=>s.ruins.run.hp=1],['trader','flask',s=>{s.resources.gold=0;s.ruins.run.potions=0;}],['trader','flask',()=>{}],['trader','tea',s=>s.ruins.run.hp=ruinsMaxHp(s.ruins.run)],['rest','refill',()=>{}]
  ]){const s=eventFixture(type);change(s);const before=copy(s);assert.ok(R.chooseRuinsEvent(s,id).error,`${type}:${id}`);assert.deepEqual(s,before);}
  const s=eventFixture('chest'),before=copy(s);assert.ok(R.chooseRuinsEvent(s,'__proto__').error);assert.deepEqual(s,before);assert.ok(R.useRuinsPotion(s).error);assert.deepEqual(s,before);
});
test('a cursed chest pays once, records the curse and increases actual incoming damage until return',()=>{
  const s=eventFixture('chest'),before=copy(s),c=R.ruinsEventContext(s).choices.find(c=>c.id==='unseal');const out=R.chooseRuinsEvent(s,c.id);assert.ok(!out.error);assert.equal(s.resources.gold,before.resources.gold+120);assert.equal(s.ruins.dust-before.ruins.dust,26);assert.equal(s.ruins.run.route.curse,1);assert.equal(s.ruins.run.blessings[c.blessingId],(before.ruins.run.blessings[c.blessingId]||0)+1);E.validateSave(E.serialize(s));
  const battle=battleFixture(),plain=copy(battle);battle.ruins.run.route.curse=2;for(const st of [battle,plain]){st.ruins.run.shield=0;st.ruins.run.battle.tactics.ward=0;st.ruins.run.battle.turn=2;}
  const normal=R.ruinsBattleTurn(plain,'charge'),cursed=R.ruinsBattleTurn(battle,'charge');assert.equal(cursed.incoming,Math.round(normal.incoming*1.3));R.retreatRuins(s);assert.equal(s.ruins.lastResult.journey.curse,1);assert.ok(!R.startRuinsJourney(s).error);assert.equal(s.ruins.run.route.curse,0);
});
test('rest and merchant choices respect capacity, exact costs and the current maximum life',()=>{
  const s=eventFixture('rest');s.ruins.run.hp=30;s.ruins.run.focus=1;const max=ruinsMaxHp(s.ruins.run);R.chooseRuinsEvent(s,'rest');assert.equal(s.ruins.run.hp,30+Math.round(max*.45));assert.equal(s.ruins.run.focus,2);E.validateSave(E.serialize(s));
  const t=eventFixture('trader');t.ruins.run.potions=0;const gold=t.resources.gold;R.chooseRuinsEvent(t,'flask');assert.equal(t.resources.gold,gold-90);assert.equal(t.ruins.run.potions,1);E.validateSave(E.serialize(t));
});
test('route victory offers include a build fragment, useful choices and a durable elite reroll',()=>{
  const s=battleFixture(2,'sentinel');while(s.ruins.run.phase==='battle')R.ruinsBattleTurn(s,s.ruins.run.focus>=2?'skill':'attack');const r=s.ruins.run;assert.equal(r.phase,'blessing');assert.ok(r.offers.some(id=>ROUTE_BUILD_IDS.includes(id)));const first=[...r.offers];assert.ok(!R.rerollRuinsBlessings(s).error);assert.ok(r.offers.every(id=>!first.includes(id)));E.validateSave(E.serialize(s));const once=copy(s);assert.ok(R.rerollRuinsBlessings(s).error);assert.deepEqual(s,once);
});
test('burn builds amplify new burn once, heal only on damaging ticks and keep exact previews',()=>{
  const base=battleFixture();for(const s of [base]){s.ruins.run.blessings={};s.ruins.run.focus=3;s.ruins.run.hp=50;}
  const boosted=copy(base);boosted.ruins.run.blessings={wildfire:2,fireheart:2};
  const a=R.ruinsBattleTurn(base,'pet:emberbird'),b=R.ruinsBattleTurn(boosted,'pet:emberbird');assert.ok(b.burnApplied>a.burnApplied*1.5);assert.equal(a.damage,b.damage);
  if(boosted.ruins.run.phase==='battle'){const before=copy(boosted),preview=previewOrder(boosted,'ruins','guard','auto'),next=copy(boosted);const hit=R.ruinsBattleTurn(next,'guard',0);assert.equal(hit.heal,6);assert.equal(preview.heal.min,hit.heal);assert.deepEqual(boosted,before);assert.equal(next.ruins.run.battle?.tactics.burn.amount||0,b.burnApplied);E.validateSave(E.serialize(next));}
});
test('ward builds heal from actual new ward and reflect actual absorbed damage, without phantom reflection',()=>{
  const s=battleFixture();s.ruins.run.blessings={mirror:2,wardflow:2};s.ruins.run.focus=3;s.ruins.run.hp=45;s.ruins.run.shield=0;s.ruins.run.battle.tactics.ward=0;s.ruins.run.battle.turn=2;s.ruins.run.members[0].training={branch:'shelter',rank:1};s.pets[0].training={branch:'shelter',rank:1};
  const normal=copy(s);normal.ruins.run.blessings={};const a=R.ruinsBattleTurn(normal,'pet:mossfox'),b=R.ruinsBattleTurn(s,'pet:mossfox');assert.ok(b.ward>0);assert.equal(b.heal-a.heal,12);assert.equal(b.reflected-a.reflected,Math.round(b.absorbed*.7));assert.ok(b.absorbed>0);E.validateSave(E.serialize(s));
  const empty=battleFixture();empty.ruins.run.blessings={mirror:2};empty.ruins.run.shield=0;empty.ruins.run.battle.tactics.ward=0;empty.ruins.run.battle.turn=2;assert.equal(R.ruinsBattleTurn(empty,'attack').reflected,0);
});
test('combo builds reward switching actors and do not grant energy or shields to repeated actors',()=>{
  const s=battleFixture();s.ruins.run.blessings={relay:2,continuum:1};s.ruins.run.focus=3;s.ruins.run.battle.tactics.mark='axolotl';s.ruins.run.battle.turn=0;s.ruins.run.shield=0;s.ruins.run.battle.tactics.ward=0;
  const without=copy(s);without.ruins.run.blessings={};const a=R.ruinsBattleTurn(without,'pet:emberbird'),b=R.ruinsBattleTurn(s,'pet:emberbird');assert.ok(b.combo);assert.ok(b.damage>=a.damage*1.35);assert.equal(s.ruins.run.focus,without.ruins.run.focus+1);assert.equal(b.ward-a.ward,16);E.validateSave(E.serialize(s));
  const same=battleFixture();same.ruins.run.blessings={relay:2,continuum:1};same.ruins.run.focus=3;same.ruins.run.battle.tactics.mark='emberbird';const c=R.ruinsBattleTurn(same,'pet:emberbird');assert.equal(c.combo,null);assert.equal(c.ward,0);assert.equal(same.ruins.run.focus,1);
});
test('mirror sentinel armor, counter and perfect-guard shield break follow the telegraphed rules',()=>{
  const s=battleFixture(8,'sentinel');s.ruins.run.blessings={};s.ruins.run.focus=3;const b=s.ruins.run.battle;b.shield=30;b.turn=0;assert.match(ruinsIntent(s.ruins.run).text,/50%/);const basic=copy(s),guarded=copy(s);const hit=R.ruinsBattleTurn(basic,'attack');assert.ok(hit.armorBlocked>0);assert.equal(hit.enemyCounter,14);
  const shield=R.ruinsBattleTurn(guarded,'guard',0,'perfect');assert.equal(shield.eliteShattered,true);assert.equal(guarded.ruins.run.battle.shield,0);assert.equal(guarded.ruins.run.battle.strategy.riposte,1);E.validateSave(E.serialize(guarded));
  const bypass=R.ruinsBattleTurn(s,'skill');assert.equal(bypass.armorBlocked,0);assert.equal(bypass.enemyCounter,0);
});
test('star oracle rewards interruption, exposes its stronger spell, and resumes its casting state',()=>{
  const s=battleFixture(8,'oracle');s.ruins.run.blessings={};s.ruins.run.focus=3;const b=s.ruins.run.battle;b.turn=0;s.ruins.run.shield=0;
  const channel=copy(s);R.ruinsBattleTurn(channel,'guard');assert.equal(channel.ruins.run.battle.enemyAI.casting,true);assert.match(ruinsIntent(channel.ruins.run).text,/2,4/);assert.deepEqual(E.validateSave(E.serialize(channel)).ruins.run,channel.ruins.run);
  const hit=R.ruinsBattleTurn(s,'skill');assert.equal(hit.eliteDisrupted,true);assert.equal(hit.interrupted,true);assert.equal(hit.incoming,0);assert.equal(s.ruins.run.focus,2);assert.equal(s.ruins.run.shield,12);E.validateSave(E.serialize(s));
});
test('a ten-room chapter ends at its own guardian, banks awakening materials and opens the next checkpoint',()=>{
  for(const start of [1,11,21,31,41]){
    const s=journey(.21,true,start);let steps=0;
    while(s.ruins.run&&steps++<11){const r=s.ruins.run,choices=ruinsRouteNext(r);const node=choices.find(n=>n.kind==='trail')||choices.find(n=>n.kind==='spring')||choices[0];assert.ok(!R.chooseRuinsPath(s,node.id).error);settleRoom(s);}
    assert.equal(s.ruins.run,null);assert.equal(s.ruins.best,start+9);assert.equal(s.ruins.lastResult.status,'victory');assert.equal(s.ruins.lastResult.cleared,10);assert.equal(s.ruins.lastResult.journey.rooms,10);assert.equal(s.awakening.materials.relic,2+(start+4)/5+2+(start+9)/5);E.validateSave(E.serialize(s));
    const bank=copy(s);assert.ok(R.chooseRuinsEvent(s,'rest').error);assert.ok(R.ruinsBattleTurn(s,'skill').error);assert.deepEqual(s,bank);if(start<41)assert.ok(!R.startRuinsJourney(s,start+10,()=>.3).error);
  }
});
test('path, event, active ultimate and future draws survive a real save round trip',()=>{
  for(const type of ['rescue','chest','altar','trader','rest']){
    const s=eventFixture(type),loaded=E.validateSave(E.serialize(s));assert.deepEqual(loaded.ruins.run,s.ruins.run);const c=R.ruinsEventContext(s).choices.find(c=>!c.error);assert.deepEqual(R.chooseRuinsEvent(s,c.id,1000),R.chooseRuinsEvent(loaded,c.id,1000));assert.deepEqual(s,loaded);
  }
  const s=battleFixture();s.ruins.run.members[0].awakened=true;s.pets.find(p=>p.id===s.ruins.run.members[0].id).awakened=true;s.awakening.trials.mossfox={wins:1,bestTurns:5};s.ruins.run.focus=3;R.ruinsBattleTurn(s,'awaken:mossfox');const loaded=E.validateSave(E.serialize(s));assert.deepEqual(loaded,s);assert.ok(R.ruinsBattleTurn(loaded,'awaken:mossfox').error);
});
test('corrupt route histories, unreachable edges, events, curses and result summaries are rejected',()=>{
  const s=eventFixture('chest');const mutations=[r=>r.route=null,r=>r.route.version=2,r=>r.route.position='99:0',r=>r.route.curse=1,r=>r.route.history.push({node:'1:0',choice:'unseal'}),r=>r.path='spring',r=>r.paths=['1:0'],r=>r.battle={},r=>r.offers=['might'],r=>delete r.route,r=>r.floor=30];
  for(const fn of mutations){const bad=copy(s);fn(bad.ruins.run);assert.throws(()=>E.validateSave(E.serialize(bad)));}
  const end=journey();R.retreatRuins(end);for(const badValue of [null,{rooms:10,events:99,elites:0,curse:0},{rooms:9,events:0,elites:0,curse:0}]){const bad=copy(end);bad.ruins.lastResult.journey=badValue;assert.throws(()=>E.validateSave(E.serialize(bad)));}
});
