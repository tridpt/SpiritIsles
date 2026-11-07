import test from 'node:test';
import assert from 'node:assert/strict';
import { E } from './legacy-combat.mjs';
import {DECORATIONS,ISLAND_ITEMS,project,unproject,newIslandLayout,validateLayout,placementError,placeItem,storeItem,commitLayout,available} from '../web/js/island-layout.js';
import {eventFixture} from './ruins-route-fixtures.mjs';
const clone=structuredClone;
test('29 different decorations and all built structures have valid bounded default layouts',()=>{
  assert.equal(DECORATIONS.length,29);assert.equal(new Set(ISLAND_ITEMS.map(i=>i.id)).size,ISLAND_ITEMS.length);
  const s=E.newGame();assert.equal(validateLayout(s),s.islandLayout);
  for(const id of ['sawmill','observatory','sanctuary'])s.buildings[id]={level:1,lastCollect:Date.now()};
  s.islandLayout=newIslandLayout(s);assert.equal(validateLayout(s),s.islandLayout);
  for(const [x,y] of [[0,0],[8,6],[4.5,2.5],[-1,9]]){const p=project(x,y);assert.deepEqual(unproject(p.x,p.y),{x,y});}
});
test('object footprints collide and stay on the island; rotating swaps rectangular dimensions',()=>{
  const s=E.newGame(),d=clone(s.islandLayout),before=clone(d);
  for(const p of [{type:'pond',x:4,y:2},{type:'pond',x:8,y:6},{type:'sapling',x:-1,y:0},{type:'sapling',x:1.2,y:1},{type:'fence',x:8,y:5}])assert.ok(placementError(s,d,{rotation:0,...p}));
  assert.deepEqual(d,before);
  assert.ok(!placeItem(s,d,'fence',8,4,1).error);assert.equal(validateLayout(s,d),d);
  assert.ok(placeItem(s,d,'fence',8,4,0,d.placed.at(-1).id).error);
});
test('ground paths can go under objects but cannot overlap other paths',()=>{
  const s=E.newGame(),d=clone(s.islandLayout);
  assert.ok(!placeItem(s,d,'path',4,2).error);assert.ok(placeItem(s,d,'stepping',4,2).error);
  assert.ok(!placeItem(s,d,'stepping',5,2).error);validateLayout(s,d);
});
test('quantities, progression locks and unavailable buildings cannot be bypassed',()=>{
  const s=E.newGame(),d=clone(s.islandLayout);
  assert.ok(!placeItem(s,d,'sapling',6,5).error);assert.ok(placeItem(s,d,'sapling',8,6).error);
  for(const type of ['moonlamp','guardian','relicgate','sawmill','__proto__','constructor','toString'])assert.ok(placeItem(s,d,type,8,6).error);
  s.level=3;s.boss.best=1;s.ruins.best=5;
  for(const type of ['moonlamp','guardian','relicgate'])assert.equal(available(s,type),true);
  assert.ok(!placeItem(s,d,'moonlamp',8,6).error);
});
test('storing and moving buildings changes only cosmetic placements, never production or progress',()=>{
  const s=E.newGame(),before=clone(s),d=clone(s.islandLayout);
  storeItem(d,'base-lodge');assert.ok(!placeItem(s,d,'lodge',5,0).error);
  assert.deepEqual(s,before);assert.ok(!commitLayout(s,d).error);
  assert.deepEqual({...s,islandLayout:before.islandLayout},before);
  assert.deepEqual(E.pendingProduction(s,Date.now()+600000),E.pendingProduction(before,Date.now()+600000));
  d.placed.length=0;assert.notEqual(s.islandLayout.placed.length,0);
  const empty={version:1,nextId:1,placed:[]};assert.ok(!commitLayout(s,empty).error);assert.deepEqual(s.buildings,before.buildings);
});
test('save round trip keeps placements and legacy saves migrate built structures without altering progress',()=>{
  const s=E.newGame();placeItem(s,s.islandLayout,'pond',6,5);assert.deepEqual(E.validateSave(E.serialize(s)).islandLayout,s.islandLayout);
  const old=clone(s);delete old.islandLayout;const imported=E.validateSave(E.serialize(old));
  assert.deepEqual(imported.islandLayout,newIslandLayout(old));assert.deepEqual(imported.pets,old.pets);assert.deepEqual(imported.resources,old.resources);
});
test('malformed and malicious imported layouts are rejected atomically',()=>{
  const base=E.newGame();
  const bad=[null,[],{}, {...base.islandLayout,version:2},{...base.islandLayout,nextId:0},{...base.islandLayout,nextId:1.5},{...base.islandLayout,placed:Array(101).fill(base.islandLayout.placed[0])}];
  for(const patch of [{id:'<img src=x>'},{id:'base-lodge'},{type:'__proto__'},{type:'constructor'},{x:Infinity},{rotation:2},{type:'pond',x:8,y:6},{type:'moonlamp'},{x:4,y:2}]){
    const d=clone(base.islandLayout);d.placed.push({id:'extra',type:'sapling',x:8,y:6,rotation:0,...patch});bad.push(d);
  }
  for(const d of bad){const s=clone(base);s.islandLayout=d;assert.throws(()=>E.validateSave(E.serialize(s)),/Bố cục/);assert.ok(commitLayout(base,d).error);}
});
test('layout edits preserve active route events, combat snapshots, resources and RNG exactly',()=>{
  const s=eventFixture('chest'),before=clone(s),d=clone(s.islandLayout);storeItem(d,'base-nursery');placeItem(s,d,'lantern',8,6);assert.ok(!commitLayout(s,d).error);
  assert.deepEqual(s.ruins,before.ruins);assert.deepEqual(s.resources,before.resources);assert.deepEqual(s.pets,before.pets);assert.deepEqual(E.validateSave(E.serialize(s)).ruins,before.ruins);
});
