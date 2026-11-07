import {towerBattleTurn} from './tower-engine.js';
import { battleTurn } from './engine.js';
import { bossBattleTurn } from './boss-engine.js';
import { ruinsBattleTurn } from './ruins-engine.js';
import { dojoBattleTurn } from './dojo-engine.js';

function position(state, mode) {
  if(mode==='dojo'){const r=state.dojo.run;return r?position(r.sandbox,r.mode):null;}
  if (mode === 'boss') {
    const r = state.boss.run;
    return r && { hp: r.hp, enemyHp: r.enemyHp, energy: r.focus, coreHp:r.mechanics?.coreHp||0 };
  }
  if (mode === 'ruins'||mode === 'tower') {
    const r = mode==='tower'?state.tower.run:state.ruins.run;
    return r && { hp: r.hp, enemyHp: r.battle?.hp ?? 0, energy: r.focus };
  }
  const r = state.expedition;
  return r && { hp: r.hp, enemyHp: r.battle?.hp ?? 0, energy: r.battle?.focus ?? r.focus };
}
function squadPosition(state,mode){if(mode==='dojo'){const r=state.dojo.run;return r?squadPosition(r.sandbox,r.mode):null;}return (mode==='boss'?state.boss.run:mode==='ruins'?state.ruins.run:mode==='tower'?state.tower.run:state.expedition)?.squad;}

// Run the real rules on disposable snapshots: opening a preview never advances
// the saved random stream, pays rewards, consumes a buff or changes a cooldown.
export function previewOrder(state, mode, order, grade = 'auto') {
  if (!['explore', 'boss', 'ruins', 'dojo','tower'].includes(mode)) return { error: 'Trận đấu không hợp lệ.' };
  const before = position(state, mode);
  if (!before) return { error: 'Không có trận chiến.' };
  const samples = mode === 'explore' ? [[0, 0], [0, .999999999], [.999999999, 0], [.999999999, .999999999]] : [[0, 0]];
  const outcomes = [];
  for (const draws of samples) {
    const snapshot = structuredClone(state);
    let draw = 0;
    const result = mode === 'dojo' ? dojoBattleTurn(snapshot,order,0,grade) : mode === 'boss' ? bossBattleTurn(snapshot, order, 0, grade)
      : mode === 'tower' ? towerBattleTurn(snapshot,order,0,grade) : mode === 'ruins' ? ruinsBattleTurn(snapshot, order, 0, grade)
        : battleTurn(snapshot, order, () => draws[Math.min(draw++, 1)], grade);
    if (result.error) return { error: result.error };
    const after = position(snapshot, mode);
    const defeat = result.dojoResult?.status==='defeat'||result.result?.status === 'defeat' || result.success === false;
    outcomes.push({
      ...result, defeat,
      victory: !!(result.won || result.result?.status === 'victory' || result.success === true),
      hpAfter: result.squadAfter?.allies.reduce((n,u)=>n+u.hp,0) ?? after?.hp ?? result.dojoResult?.hp ?? (defeat ? 0 : Math.max(0, before.hp + (result.heal || 0) - result.incoming)),
      enemyHpAfter: after?.enemyHp ?? (defeat ? Math.max(0, before.enemyHp - result.damage - (result.reflected || 0) + (result.enemyHeal || 0)) : 0),
      energyAfter: after?.energy ?? before.energy,
      coreHpAfter:after?.coreHp||0,
      squadAfter:result.squadAfter||squadPosition(snapshot,mode),
    });
  }
  const range = key => ({ min: Math.min(...outcomes.map(r => r[key] || 0)), max: Math.max(...outcomes.map(r => r[key] || 0)) });
  const units=outcomes[0].squadAfter;
  const squad=units?Object.fromEntries(['allies','enemies'].map(key=>[key,units[key].map(u=>{const hp=outcomes.map(r=>r.squadAfter?.[key].find(v=>v.id===u.id)?.hp??u.hp);return {...u,hp:{min:Math.min(...hp),max:Math.max(...hp)}};})])):null;
  return {
    exact: mode !== 'explore', grade,squad,
    ...Object.fromEntries(['damage', 'incoming', 'heal', 'ward', 'absorbed', 'reflected', 'enemyHeal', 'rootsCut', 'coreDamage', 'coreHpAfter', 'revived', 'frozenAfter', 'frozenApplied', 'energyBlocked', 'armorBlocked', 'enemyCounter', 'hpAfter', 'enemyHpAfter', 'energyAfter', 'setWard', 'burnApplied', 'burnTurns', 'overhealWard', 'haste'].map(k => [k, range(k)])),
    allyTarget:outcomes[0].allyTarget,hasteTarget:outcomes[0].hasteTarget,taunted:outcomes.every(r=>r.taunted),finisher:outcomes.every(r=>r.finisher),
    staggered: outcomes.every(r => r.rhythm?.staggered),
    parried: outcomes.every(r => r.strategy?.parried),
    interrupted:outcomes.every(r=>r.interrupted),thawed:outcomes.every(r=>r.thawed),coreBroken:outcomes.every(r=>r.coreBroken),enraged:outcomes.every(r=>r.enraged),
    victory: outcomes.every(r => r.victory), mayWin: outcomes.some(r => r.victory),
    defeat: outcomes.every(r => r.defeat), mayLose: outcomes.some(r => r.defeat),
    setBurn: outcomes.every(r=>r.setBurn), eliteShattered:outcomes.every(r=>r.eliteShattered),eliteDisrupted:outcomes.every(r=>r.eliteDisrupted),combo: outcomes[0].combo || '', strategy: outcomes[0].strategy,
  };
}
