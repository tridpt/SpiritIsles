import { petSkill,skillActor } from './tactics.js';
import { newRhythm, prepareRhythm } from './combat-rhythm.js';

export const STANCES = {
  balanced: { name: 'Cân bằng', icon: 'compass', damage: 1, incoming: 1, text: 'Sát thương và phòng ngự bình thường.' },
  assault: { name: 'Tấn công', icon: 'swords', damage: 1.25, incoming: 1.25, text: 'Gây thêm 25%, nhận thêm 25% sát thương.' },
  guarded: { name: 'Phòng bị', icon: 'shield', damage: .8, incoming: .8, text: 'Gây ít hơn 20%, nhận ít hơn 20% sát thương.' },
};

export function newStrategy() { return { stance: 'balanced', drive: 0, riposte: 0 }; }

export function validateStrategy(battle) {
  if (!Object.hasOwn(battle, 'strategy')) battle.strategy = newStrategy();
  const s = battle.strategy;
  if (!s || typeof s !== 'object' || Array.isArray(s) || Object.keys(s).length !== 3 || !Object.hasOwn(STANCES, s.stance) || ![0, 1].includes(s.drive) || ![0, 1].includes(s.riposte)) {
    throw new Error('Thế trận, lấy đà hoặc phản kích không hợp lệ.');
  }
}

export function offensiveMove(move,members) {
  return move === 'attack' || move === 'skill' || (!!skillActor(move)&&petSkill(skillActor(move),members,move.startsWith('awaken:'))?.power > 0);
}

// Decode and reject before status ticks, random draws or any other mutation.
export function readOrder(input, battle, { mode = 'explore', roots = 0, core = 0, members=battle?.members,squad=battle?.squad } = {}) {
  const object = input && typeof input === 'object' && !Array.isArray(input);
  if (typeof input !== 'string' && !object) return { error: 'Lệnh chiến đấu không hợp lệ.' };
  if (object && (Object.keys(input).some(k => !['move', 'stance', 'target',...(squad?['foe','ally']:[])].includes(k)) || typeof input.move !== 'string')) return { error: 'Lệnh chiến đấu không hợp lệ.' };
  const move = object ? input.move : input;
  const stance = object && Object.hasOwn(input, 'stance') ? input.stance : battle?.strategy?.stance || 'balanced';
  const target = object && Object.hasOwn(input, 'target') ? input.target : 'body';
  if (!Object.hasOwn(STANCES, stance) || !['body', 'roots', 'core'].includes(target)) return { error: 'Thế trận hoặc mục tiêu không hợp lệ.' };
  if (target === 'roots' && (mode !== 'boss' || roots <= 0 || !offensiveMove(move,members))) return { error: 'Chỉ chọn rễ hồi sinh đang sống bằng một chiêu gây sát thương.' };
  if (target === 'core' && (mode !== 'boss' || core <= 0 || !offensiveMove(move,members))) return { error: 'Chỉ nhắm lõi lửa đã lộ bằng một chiêu gây sát thương.' };
  if (move === 'charge' && battle?.strategy?.drive) return { error: 'Đã lấy đà. Hãy dùng một đòn tấn công trước khi lấy đà tiếp.' };
  if(squad){
    const caster=skillActor(move);if(caster&&squad.allies.some(u=>u.id===caster&&u.hp===0))return {error:'Linh thú này đã gục, chưa thể ra chiêu.'};
    for(const [key,list]of [['foe',squad.enemies],['ally',squad.allies]])if(object&&Object.hasOwn(input,key)&&(typeof input[key]!=='string'||!list.some(u=>u.id===input[key]&&u.hp>0)))return {error:'Mục tiêu đã gục hoặc không ở trong trận.'};
  }
  return { move, stance, target,...(object&&Object.hasOwn(input,'foe')?{foe:input.foe}:{}),...(object&&Object.hasOwn(input,'ally')?{ally:input.ally}:{}) };
}

export function beginOrder(battle, order, members=battle?.members) {
  const s = battle.strategy ||= newStrategy(), offensive = offensiveMove(order.move,members);
  const driveUsed = offensive && !!s.drive, riposteUsed = offensive && !!s.riposte;
  s.stance = order.stance;
  if (offensive) { s.drive = 0; s.riposte = 0; }
  if (order.move === 'charge') s.drive = 1;
  return {
    stance: order.stance, target: order.target, driveUsed, riposteUsed, charged: order.move === 'charge', parried: false,
    damage: STANCES[order.stance].damage * (driveUsed ? 1.45 : 1) * (riposteUsed ? 1.25 : 1) * (order.target === 'roots' ? .5 : 1),
    incoming: STANCES[order.stance].incoming * (order.move === 'charge' ? 1.35 : 1),
    energyGain: order.move === 'charge' ? 2 : 1,
  };
}

export function orderRhythm(battle, order, grade) {
  if (!['charge','evade'].includes(order.move)) return prepareRhythm(battle, grade);
  const rhythm = battle.rhythm ||= newRhythm();
  // Preparing a move cannot build pressure, trigger a break or spend exposure.
  return { grade: 'auto', staggered: false, pressure: rhythm.pressure, exposed: false, damage: 1, support: 1, guard: .25 };
}

export function finishOrder(battle, order, result, attacked) {
  if (order.move === 'guard' && result.rhythm?.grade === 'perfect' && !result.rhythm.staggered && attacked) {
    battle.strategy.riposte = 1;
    result.strategy.parried = true;
  }
}

export function orderCaption(result) {
  const s = result.strategy;
  if (!s) return '';
  return `${s.charged ? ' · Lấy đà: đòn sau +45%' : ''}${s.driveUsed ? ' · Bung lực' : ''}${s.riposteUsed ? ' · Phản kích +25%' : ''}${s.parried ? ' · Sẵn sàng phản kích' : ''}${s.target === 'roots' ? ' · Nhắm rễ' : ''}${s.target === 'core' ? ' · Nhắm lõi lửa' : ''}`;
}
