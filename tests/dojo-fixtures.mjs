import { E } from './legacy-combat.mjs';
import { D } from './legacy-combat.mjs';
import { CHALLENGES } from '../web/js/dojo-data.js';

export const DOJO_PLANS={
  rhythm:['guard','guard','attack','attack'],
  armor:['pet:emberbird','guard','guard','pet:axolotl'],
  spell:['pet:emberbird','attack','guard'],
  combo:['pet:cottonbun','pet:axolotl','charge','pet:emberbird','attack','skill'],
  underdogs:['charge','skill'],
  roots:['attack','guard','skill','guard','skill','attack'],
  blizzard:['guard','charge','pet:emberbird','attack','skill','charge','pet:emberbird'],
  core:[{move:'charge',stance:'assault'},{move:'skill',stance:'assault'},{move:'attack',stance:'assault'},{move:'skill',stance:'assault',target:'core'},'attack','charge','skill'],
};
export function solveDojo(state,id,{validate=true}={}){
  const started=D.startDojo(state,'challenge',id);if(started.error)throw new Error(started.error);
  for(const order of DOJO_PLANS[id]){
    if(!state.dojo.run)break;
    const result=D.dojoBattleTurn(state,order,Date.now(),'perfect');if(result.error)throw new Error(`${id}: ${result.error}`);
    if(validate)E.validateSave(E.serialize(state));
  }
  if(state.dojo.run)throw new Error(`Unfinished challenge: ${id}`);
  return state.dojo.lastResult;
}
export function dojoProgress(count=8){const s=E.newGame();for(const c of CHALLENGES.slice(0,count))solveDojo(s,c.id);return s;}
