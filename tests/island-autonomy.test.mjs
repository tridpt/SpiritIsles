import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../web/js/engine.js';
import {islandActivities,islandPartners,cornerSpots,pairedCornerSpots,findWalkPath} from '../web/js/island-autonomy.js';
import {momentStatus,discoverMoment} from '../web/js/habitat-engine.js';
import {placeItem,anchorOf} from '../web/js/island-layout.js';

const empty=()=>({version:1,nextId:1,placed:[]});
test('automatic visits use owned, eligible, saved furniture and never change progress',()=>{
  const s=E.newGame(),before=structuredClone(s);
  const choices=islandActivities(s,'mossfox');
  assert.ok(choices.some(a=>a.moment.id==='flower-sniff'));
  assert.ok(choices.some(a=>a.moment.id==='shade-nap'));
  assert.ok(!choices.some(a=>a.moment.id==='pond-bubbles'||a.moment.id==='bench-rest'||a.moment.buddy));
  assert.ok(choices.every(a=>s.islandLayout.placed.some(p=>p.id===a.decoration.id)));
  assert.deepEqual(islandActivities(s,'missing'),[]);assert.deepEqual(s,before);
  s.islandLayout=empty();assert.deepEqual(islandActivities(s,'mossfox'),[]);
});
test('species, bond and discovered memories are reflected without removing replayable behaviors',()=>{
  const s=E.newGame();s.islandLayout=empty();placeItem(s,s.islandLayout,'pond',4,3);placeItem(s,s.islandLayout,'lantern',1,4);
  assert.ok(islandActivities(s,'axolotl').some(a=>a.moment.id==='pond-bubbles'));
  assert.ok(!islandActivities(s,'mossfox').some(a=>a.moment.id==='pond-bubbles'));
  assert.ok(!islandActivities(s,'mossfox').some(a=>a.moment.id==='lantern-chase'));
  s.pets[0].bond=5;assert.ok(islandActivities(s,'mossfox').some(a=>a.moment.id==='lantern-chase'));
  discoverMoment(s,'axolotl','pond-bubbles');assert.equal(islandActivities(s,'axolotl').find(a=>a.moment.id==='pond-bubbles').discovered,true);
});
test('nearby combinations select only the actual qualifying primary, including rotated footprints',()=>{
  const s=E.newGame();s.pets[2].bond=50;s.islandLayout=empty();
  placeItem(s,s.islandLayout,'lantern',0,0);const near=placeItem(s,s.islandLayout,'lantern',6,4).item;
  placeItem(s,s.islandLayout,'bench',8,4,1);
  const list=islandActivities(s,'emberbird').filter(a=>a.moment.id==='warm-light');
  assert.deepEqual(list.map(a=>a.decoration.id),[near.id]);
  assert.equal(momentStatus(s,'emberbird','warm-light',s.islandLayout.placed[0].id).canPlay,false);
});
test('recording uses the furniture actually visited and rejects a removed or unsuitable corner',()=>{
  const s=E.newGame();s.islandLayout=empty();placeItem(s,s.islandLayout,'sapling',0,0);const palm=placeItem(s,s.islandLayout,'palm',5,5).item;
  const before=structuredClone(s);
  assert.ok(discoverMoment(s,'mossfox','shade-nap',Date.now(),'missing').error);assert.deepEqual(s,before);
  const r=discoverMoment(s,'mossfox','shade-nap',Date.now(),palm.id);assert.equal(r.entry.decoration,'palm');assert.equal(r.gained,2);
  assert.equal(discoverMoment(s,'mossfox','shade-nap',Date.now(),palm.id).gained,0);assert.equal(s.pets[0].bond,2);
});
test('approach spots track the moved and rotated isometric anchor rather than a preset screen position',()=>{
  const bounds={x:-40,y:100,w:600,h:360},pet={homeX:200,homeY:180,w:80,h:70},decor={id:'s',type:'swing',x:6,y:3,rotation:1};
  const spots=cornerSpots(decor,bounds,pet),a=anchorOf(decor);
  assert.ok(spots.length>=8);assert.ok(spots.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  assert.equal(spots[0].x+pet.homeX+pet.w/2,a.x*.6);
  assert.ok(Math.abs(spots[0].y+pet.homeY+pet.h*.86-(a.y*.6+pet.h*.48))<1e-8);
  assert.notDeepEqual(spots,cornerSpots({...decor,x:2,y:2,rotation:0},bounds,pet));
});
test('the walking planner takes clear segments around a label and refuses sealed corners',()=>{
  const obstacle={x:40,y:20,w:20,h:60},hits=(a,b)=>Math.min(a.x,b.x)<obstacle.x+obstacle.w&&Math.max(a.x,b.x)>obstacle.x&&Math.min(a.y,b.y)<obstacle.y+obstacle.h&&Math.max(a.y,b.y)>obstacle.y;
  const start={x:10,y:50},goal={x:90,y:50},corners=[{x:39,y:19},{x:61,y:19},{x:39,y:81},{x:61,y:81}],clear=(a,b)=>!hits(a,b);
  const path=findWalkPath(start,goal,corners,clear);assert.ok(path.length>1);assert.deepEqual(path.at(-1),goal);
  let previous=start;for(const p of path){assert.ok(clear(previous,p));previous=p;}
  assert.equal(findWalkPath(start,goal,[],clear),null);assert.deepEqual(findWalkPath(start,goal,[],()=>true),[goal]);
});

test('a picnic invites only a visible, bonded friend of another element without changing the save',()=>{
  const s=E.newGame();s.pets.forEach(p=>p.bond=50);s.team=['mossfox','emberbird'];s.islandLayout=empty();
  placeItem(s,s.islandLayout,'bench',6,4);placeItem(s,s.islandLayout,'flowers',5,4);
  const before=structuredClone(s);
  assert.deepEqual(islandPartners(s,'mossfox').map(p=>p.id),['emberbird']);
  assert.deepEqual(islandActivities(s,'mossfox').filter(a=>a.moment.buddy).map(a=>a.partner.id),['emberbird']);
  assert.deepEqual(islandPartners(s,'missing'),[]);assert.deepEqual(s,before);
  assert.deepEqual(islandActivities(s,'mossfox',['mossfox']).filter(a=>a.moment.buddy),[]);
  s.pets[2].bond=9;assert.deepEqual(islandPartners(s,'mossfox'),[]);
  s.pets[2].bond=10;s.pets[0].bond=19;assert.deepEqual(islandActivities(s,'mossfox').filter(a=>a.moment.buddy),[]);
});

test('recording a picnic stores the actual invited friend and rejects invalid partner substitutions',()=>{
  const s=E.newGame();s.pets.forEach(p=>p.bond=50);s.islandLayout=empty();
  const bench=placeItem(s,s.islandLayout,'bench',6,4).item;placeItem(s,s.islandLayout,'flowers',5,4);
  const before=structuredClone(s);
  for(const id of ['missing','mossfox']){
    assert.equal(momentStatus(s,'mossfox','picnic-friends',bench.id,id).canPlay,false);
    assert.ok(discoverMoment(s,'mossfox','picnic-friends',Date.now(),bench.id,id).error);
    assert.deepEqual(s,before);
  }
  assert.equal(momentStatus(s,'mossfox','picnic-friends').partner.id,'axolotl');
  const r=discoverMoment(s,'mossfox','picnic-friends',Date.now(),bench.id,'emberbird');
  assert.equal(r.entry.partner,'emberbird');assert.equal(r.gained,2);
  assert.equal(s.pets[0].bond,52);assert.equal(s.pets[2].bond,50);
  const saved=structuredClone(s);assert.equal(discoverMoment(s,'mossfox','picnic-friends',Date.now(),bench.id,'axolotl').gained,0);assert.deepEqual(s,saved);
  assert.deepEqual(E.validateSave(E.serialize(s)).habitat,s.habitat);
});

test('a picnic still requires the nearby flowers at the exact bench that was visited',()=>{
  const s=E.newGame();s.pets.forEach(p=>p.bond=50);s.islandLayout=empty();
  const far=placeItem(s,s.islandLayout,'bench',0,0).item,near=placeItem(s,s.islandLayout,'bench',6,4).item;
  placeItem(s,s.islandLayout,'flowers',5,4);
  const choices=islandActivities(s,'mossfox');assert.ok(choices.some(a=>a.partner));
  assert.ok(choices.filter(a=>a.partner).every(a=>a.decoration.id===near.id));
  assert.ok(discoverMoment(s,'mossfox','picnic-friends',Date.now(),far.id,'emberbird').error);
  s.islandLayout.placed=s.islandLayout.placed.filter(p=>p.type!=='flowers');
  assert.ok(discoverMoment(s,'mossfox','picnic-friends',Date.now(),near.id,'emberbird').error);
});

test('paired seats follow the furniture anchor with separate pet centres on either side',()=>{
  const bounds={x:-60,y:90,w:700,h:420},host={homeX:120,homeY:170,w:80,h:70},guest={homeX:270,homeY:190,w:70,h:80},decor={id:'b',type:'bench',x:6,y:4,rotation:0};
  const spots=pairedCornerSpots(decor,bounds,host,guest);
  for(const s of spots){
    const ax=host.homeX+s.host.x+host.w/2,bx=guest.homeX+s.guest.x+guest.w/2;
    assert.ok(Math.abs(ax-bx)>Math.max(host.w,guest.w)*.6);
    assert.ok(Object.values(s).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  }
  assert.ok(spots.length>=8);assert.notDeepEqual(spots,pairedCornerSpots({...decor,x:2,y:1,rotation:1},bounds,host,guest));
});
