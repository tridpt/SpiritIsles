import {campaignStage,campaignEnemies,chapterOf} from './campaign-data.js';
import {squadUnits,healthSum} from './squad-state.js';

// Phase changes are saved combat transitions. A lethal hit still wakes the
// guardian; reloading cannot skip or repeat its one reinforcement wave.
export function campaignBossPhase(run,b,result){
  if(!run.campaign||!b.boss||b.campaignPhase!==1||b.hp>55)return false;
  const ch=chapterOf(campaignStage(run.campaign.id)),fraction=Math.max(.3,b.hp/100);
  b.campaignPhase=2;const units=squadUnits(campaignEnemies(run),100);
  units[0].hp=Math.max(1,Math.round(units[0].maxHp*fraction));
  run.squad.enemies=units;run.squad.effects.burn=null;b.tactics.burn={amount:0,turns:0};
  b.hp=healthSum(units);result.campaignPhase=2;result.summoned=2;
  result.unitEvents.push(...units.slice(1).map(u=>({side:'enemy',kind:'summon',actor:u.id,target:u.id,amount:u.hp})));
  run.log.unshift(`${ch.boss} thức giấc · Pha 2! Hai đồng đội xuất hiện, sát thương địch tăng 15%.`);
  return true;
}
