import {E,squadGame} from './squad-fixtures.mjs';
export function volcanoFixture({travel=false,boss=false,round=0,level=1,motion=false,choice=0,team}={}){
  const s=squadGame(team);s.settings={motion,sound:false};s.pets.forEach(p=>p.level=level);
  E.startExpedition(s,'volcano',()=>.4,1720000000000);if(boss)s.expedition.stage=4;
  if(!travel){E.chooseRoute(s,choice,()=>.5);s.expedition.battle.focus=3;s.expedition.battle.round=round;}
  E.validateSave(E.serialize(s));return s;
}
