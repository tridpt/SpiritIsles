import { layoutOf, anchorOf } from './island-layout.js';
import { BY_ID } from './data.js';
import { momentsFor, momentStatus, furnitureDistance } from './habitat-engine.js';

export const ISLAND_OBSERVE_MS=2400;

// Visits are derived from the saved island; only explicitly recording a memory
// changes progress. Only visible, bonded friends may join a visit on the island.
export function islandPartners(state,id,visibleIds=state.team) {
  const pet=state.pets.find(p=>p.id===id);
  return pet?state.pets.filter(p=>visibleIds.includes(p.id)&&p.id!==id&&p.bond>=10&&BY_ID[p.species].element!==BY_ID[pet.species].element):[];
}
export function islandActivities(state,id,visibleIds=state.team) {
  const pet=state.pets.find(p=>p.id===id);
  if(!pet)return [];
  const placed=layoutOf(state).placed;
  return momentsFor(pet.species).flatMap(moment=>{
    const status=momentStatus(state,id,moment.id);
    if(!status.canPlay)return [];
    const partners=moment.buddy?islandPartners(state,id,visibleIds):[null];
    return placed.filter(p=>moment.decor.includes(p.type)).filter(p=>!moment.near||placed.some(q=>q.id!==p.id&&moment.near.includes(q.type)&&furnitureDistance(p,q)<=2))
      .flatMap(decoration=>partners.map(partner=>({moment,decoration,partner,discovered:status.discovered})));
  });
}

export function pairedCornerSpots(decoration,bounds,host,guest) {
  const a=anchorOf(decoration),cx=bounds.x+a.x*bounds.w/1000,cy=bounds.y+a.y*bounds.h/600;
  const width=Math.max(host.w,guest.w),height=Math.max(host.h,guest.h),separation=width*.8+5;
  const spot=(p,x,y)=>({x:x-bounds.x-p.homeX-p.w/2,y:y-bounds.y-p.homeY-p.h*.86});
  return [.38,.56,.74,.12,.64].flatMap(dy=>[0,-.22,.22].flatMap(dx=>[1,-1].map(direction=>({
    host:spot(host,cx+dx*width-direction*separation/2,cy+dy*height),
    guest:spot(guest,cx+dx*width+direction*separation/2,cy+dy*height)
  }))));
}

// Feet, rather than sprite centres, meet the furniture's isometric anchor.
// Several approaches let a visitor use either side of a moved/rotated item.
export function cornerSpots(decoration,bounds,pet) {
  const a=anchorOf(decoration),x=bounds.x+a.x*bounds.w/1000,y=bounds.y+a.y*bounds.h/600;
  const offsets=[[0,.48],[-.55,.35],[.55,.35],[-.72,.06],[.72,.06],[0,.72],[-.48,.62],[.48,.62],[-.48,.8],[.48,.8],[-.4,-.12],[.4,-.12]];
  return offsets.map(([dx,dy])=>({x:x+dx*pet.w-bounds.x-pet.homeX-pet.w/2,y:y+dy*pet.h-bounds.y-pet.homeY-pet.h*.86}));
}

// A tiny visibility graph around inflated obstacle corners. Every segment is
// checked by the caller, including diagonal sweeps and other pets' footprints.
export function findWalkPath(start,goal,waypoints,clear) {
  if(clear(start,goal))return [goal];
  const nodes=[start,goal,...waypoints],distance=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),done=new Set();
  distance[0]=0;
  while(done.size<nodes.length) {
    let at=-1;
    for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(at<0||distance[i]<distance[at]))at=i;
    if(at<0||!Number.isFinite(distance[at]))return null;
    if(at===1){const path=[];for(let i=1;i!==0;i=previous[i])path.unshift(nodes[i]);return path;}
    done.add(at);
    for(let i=1;i<nodes.length;i++)if(!done.has(i)){
      const next=distance[at]+Math.hypot(nodes[i].x-nodes[at].x,nodes[i].y-nodes[at].y);
      if(next<distance[i]&&clear(nodes[at],nodes[i])){distance[i]=next;previous[i]=at;}
    }
  }
  return null;
}
