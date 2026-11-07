// Fixtures for regression tests of pre-1.17 shared-health saves. These wrappers
// remove only the new extension when creating an old encounter; all actions,
// validation, RNG, rewards and assertions still execute the production code.
import * as Engine from '../web/js/engine.js';
import * as Ruins from '../web/js/ruins-engine.js';
import * as Boss from '../web/js/boss-engine.js';
import * as Dojo from '../web/js/dojo-engine.js';
export function legacyState(state){
  for(const run of [state.expedition,state.ruins?.run,state.boss?.run])if(run)delete run.squad;
  if(state.dojo?.run)legacyState(state.dojo.run.sandbox);return state;
}
const wrap=(fn)=>(state,...args)=>{const r=fn(state,...args);legacyState(state);return r;};
export const E={...Engine,startExpedition:wrap(Engine.startExpedition),chooseRoute:wrap(Engine.chooseRoute)};
export const R={...Ruins,startRuins:wrap(Ruins.startRuins),startRuinsJourney:wrap(Ruins.startRuinsJourney),chooseRuinsPath:wrap(Ruins.chooseRuinsPath)};
export const B={...Boss,startBoss:wrap(Boss.startBoss)};
export const D={...Dojo,startDojo:wrap(Dojo.startDojo)};
