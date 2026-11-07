import { E } from './legacy-combat.mjs';
import { D } from './legacy-combat.mjs';
import { AWAKENING_IDS } from '../web/js/awakening-data.js';
export const AWAKENING_PLANS={
 mossfox:[['pet:mossfox','balanced'],['charge','guarded'],['pet:axolotl','guarded'],['charge','guarded'],['pet:emberbird','balanced']],
 axolotl:[['pet:axolotl','assault'],['attack','assault'],['attack','assault'],['skill','assault'],['attack','balanced']],
 emberbird:[['pet:emberbird','balanced'],['guard','assault'],['guard','assault'],['pet:emberbird','balanced']],
 sunfox:[['charge','guarded'],['guard','assault'],['pet:sunfox','assault'],['attack','balanced']],
 phoenix:[['attack','assault'],['attack','assault'],['pet:phoenix','assault'],['charge','guarded'],['attack','assault']],
 voiddragon:[['charge','guarded'],['pet:voiddragon','assault'],['attack','guarded','core'],['attack','assault','core'],['skill','assault'],['attack','balanced']]
};
export const awakeningOrder=([move,stance,target='body'])=>({move,stance,target});
export function awakeningFixture(awakened=false){
 const s=E.newGame();s.level=10;s.resources={...s.resources,gold:50000,food:10000,essence:500};s.pets=AWAKENING_IDS.map(id=>({...E.makePet(id),level:30,stars:3,awakened}));s.awakening.materials={sigil:100,relic:150};
 if(awakened)for(const id of AWAKENING_IDS)s.awakening.trials[id]={wins:1,bestTurns:5};return s;
}
export function clearAwakening(s,id,validate=true){
 const r=D.startDojo(s,'awakening',id);if(r.error)throw Error(r.error);
 for(const step of AWAKENING_PLANS[id]){const r=D.dojoBattleTurn(s,awakeningOrder(step),Date.now(),'perfect');if(r.error)throw Error(r.error);if(validate)E.validateSave(E.serialize(s));}
 return s.dojo.lastResult;
}
