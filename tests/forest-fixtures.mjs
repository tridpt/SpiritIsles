import {E,squadGame} from './squad-fixtures.mjs';
export function forestFixture({travel=false,boss=false,warning=false,team,level=1,motion=false}={}){
  const state=squadGame(team);state.settings.motion=motion;state.settings.sound=false;
  state.pets.forEach(p=>p.level=level);E.startExpedition(state,'forest',()=>.4,1720000000000);
  if(boss)state.expedition.stage=3;
  if(!travel){E.chooseRoute(state,0,()=>.4);state.expedition.battle.focus=3;if(warning)state.expedition.battle.round=2;}
  E.validateSave(E.serialize(state));return state;
}
