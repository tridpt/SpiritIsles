import {E,squadGame} from './squad-fixtures.mjs';
export function reefFixture({travel=false,boss=false,warning=false,level=1,motion=false,choice=0}={}){
  const s=squadGame();s.settings={motion,sound:false};s.pets.forEach(p=>p.level=level);
  E.startExpedition(s,'reef',()=>.4,1720000000000);if(boss)s.expedition.stage=4;
  if(!travel){E.chooseRoute(s,choice,()=>.5);s.expedition.battle.focus=3;if(warning)s.expedition.battle.round=2;}
  E.validateSave(E.serialize(s));return s;
}
