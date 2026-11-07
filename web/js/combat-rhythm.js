export const RHYTHM_GRADES=['auto','normal','good','perfect'];
export function newRhythm(){return {pressure:0,exposed:0};}
export function rhythmPosition(elapsed){const x=((Math.max(0,elapsed)%2400)+2400)%2400/1200;return x<=1?x:2-x;}
export function rhythmGrade(position){
  if(!Number.isFinite(position)||position<0||position>1)return 'normal';
  const distance=Math.abs(position-.5);
  return distance<=.07+1e-9?'perfect':distance<=.20+1e-9?'good':'normal';
}
export function validateRhythm(battle){
  if(!Object.hasOwn(battle,'rhythm'))battle.rhythm=newRhythm();
  const r=battle.rhythm;
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==2||!Number.isInteger(r.pressure)||r.pressure<0||r.pressure>99||![0,1].includes(r.exposed))throw new Error('Nhịp phá thế trong trận không hợp lệ.');
}
export function prepareRhythm(battle,grade='auto'){
  const r=battle.rhythm||=newRhythm(),exposed=!!r.exposed;
  const gain={auto:0,normal:8,good:20,perfect:34}[grade];
  r.pressure+=gain;const staggered=r.pressure>=100;
  if(staggered)r.pressure-=100;
  r.exposed=staggered?1:0;
  return {grade,staggered,pressure:r.pressure,exposed,
    damage:({auto:1,normal:1,good:1.1,perfect:1.25}[grade])*(exposed?1.2:1),
    support:{auto:1,normal:1,good:1.1,perfect:1.25}[grade],
    guard:{auto:.25,normal:.25,good:.18,perfect:.1}[grade]};
}
export function rhythmCaption(r){return !r?'':r.staggered?' · Phá thế! Địch mất lượt, đòn sau +20%':r.grade==='perfect'?' · Nhịp hoàn hảo!':r.grade==='good'?' · Đúng nhịp!':'';}
