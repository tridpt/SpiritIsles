import {creature} from './art.js';
import {BY_ID} from './data.js';

export function enemyTeamArt(members){
  const individual=members.some(m=>Object.hasOwn(m,'hp'));
  return `<div class="combat-enemy-team" data-enemy-count="${members.length}" role="group" aria-label="Đội địch ${members.length} thú${individual?', sinh lực riêng':', dùng chung sinh lực'}">${members.map((m,i)=>`<div class="combat-enemy-member enemy-slot-${i} ${m.hp===0?'squad-quick-down':''}" data-enemy="${m.id}" data-enemy-species="${m.species}" title="${m.name||BY_ID[m.species].name}">${creature(m.species)}<span class="enemy-member-name">${m.name||BY_ID[m.species].name}${individual?` · ${m.hp}/${m.maxHp}`:''}</span></div>`).join('')}</div>`;
}
