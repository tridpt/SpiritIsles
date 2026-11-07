import * as E from '../web/js/engine.js';
import {placeItem} from '../web/js/island-layout.js';

export function picnicFixture(s=E.newGame(),team=['mossfox','emberbird']) {
  s.team=[...team];s.pets.forEach(p=>p.bond=50);
  s.islandLayout={version:1,nextId:1,placed:[]};
  for(const [type,x,y] of [['bench',6,4],['flowers',5,4]]){
    const r=placeItem(s,s.islandLayout,type,x,y);if(r.error)throw new Error(r.error);
  }
  return s;
}
