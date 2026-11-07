import {BY_ID} from './data.js';
import {creature,icon} from './art.js';
import {COMBAT_ROLES} from './tactics-data.js';
import {enemySquadPlans} from './squad-combat.js';
import {ROLE_TRAITS} from './role-traits.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=u=>BY_ID[u.species]?.name||u.species;
const unitStatus=u=>!u.hp?'ĐÃ GỤC':u.cover&&u.row==='front'?`KHIÊU KHÍCH · ${u.cover}L`:'';
const hp=u=>`<span class="squad-unit-health"><i style="width:${100*u.hp/u.maxHp}%"></i></span><small data-unit-hp>${u.hp}/${u.maxHp}${u.ward?` · 🛡 ${u.ward}`:''}</small>`;
export function squadUnit(u,members,side,index,{selected=false,busy=false,html,placement=''}={}){
  const source=members.find(m=>m.id===u.id),role=COMBAT_ROLES[u.role],cls=side==='ally'?`duel-friend friend-${index}`:`combat-enemy-member enemy-slot-${index}`;
  return `<button type="button" class="${cls} squad-unit ${!u.hp?'is-down':''} ${selected?'is-selected':''}" style="${placement}" data-duel="unit" data-side="${side}" data-unit="${u.id}" data-row="${u.row}" ${side==='ally'?`data-friend="${u.id}"`:`data-enemy="${u.id}" data-enemy-species="${u.species}"`} aria-pressed="${selected}" aria-label="${side==='ally'?'Đồng đội':'Mục tiêu'} ${escape(name(u))}, ${u.hp}/${u.maxHp} sinh lực, ${u.row==='front'?'hàng trước':'hàng sau'}${!u.hp?', đã gục':''}" ${!u.hp||busy?'disabled':''}>
    <span class="squad-role" style="--role:${role.color}">${icon(role.icon,10)} ${u.row==='front'?'TRƯỚC':'SAU'}</span>${html||creature(u.species,{source})}
    <span class="squad-unit-info"><strong>${escape(name(u))}</strong>${hp(u)}<em data-unit-status>${unitStatus(u)}</em></span>
  </button>`;
}
export function squadParty(s,members,side,selected,busy=false,html){
  const units=[...(side==='ally'?s.allies:s.enemies)].sort((a,b)=>(a.row==='front'?0:1)-(b.row==='front'?0:1));
  return units.map((u,i)=>{
    const row=units.filter(v=>v.row===u.row),slot=row.indexOf(u),count=row.length,single=units.length===1;
    const x=single?50:units.length===count?50:side==='ally'?(u.row==='front'?70:32):(u.row==='front'?29:72),y=count===1?46:count===2?[22,80][slot]:[18,50,82][slot];
    const w=single?82:54,h=single?90:count===1?62:count===2?43:30;
    const placement=`--unit-left:${x-w/2}%;--unit-top:${single?0:y-h/2}%;--unit-width:${w}%;--unit-height:${h}%`;
    return squadUnit(u,members,side,i,{selected:u.id===selected,busy,placement,html:single?html:undefined});
  }).join('');
}
export function squadTargetNote(s,foe,ally){
  if(!s)return '';
  const target=s.enemies.find(u=>u.id===foe&&u.hp)||s.enemies.find(u=>u.hp&&u.row==='front')||s.enemies.find(u=>u.hp),friend=s.allies.find(u=>u.id===ally&&u.hp);
  return `<div class="squad-target-note"><span>${icon('swords',13)} Nhắm: <b>${target?escape(name(target)):'Đối thủ'}</b></span><span>${icon('heart',13)} Hỗ trợ: <b>${friend?escape(name(friend)):'Tự chọn theo chiêu'}</b></span><small>Chạm thú để chọn. Hợp lực đánh lan; xuyên giáp vượt Khiêu khích. Tiếp sức tự chọn bạn chờ chiêu lâu nhất.</small></div>`;
}
export function squadRoleGuide(){
  return `<details class="squad-role-guide"><summary>${icon('paw',15)} Chiêu riêng theo vai trò <span>4 nội tại</span></summary>${Object.entries(ROLE_TRAITS).map(([id,t])=>`<div data-role-trait="${id}">${icon(COMBAT_ROLES[id].icon,17)}<p><strong>${COMBAT_ROLES[id].name} · ${t.name}</strong><small>${t.text}</small></p></div>`).join('')}<small>Áp dụng trong trận từng thú. Vai trò đi theo nhánh kỹ năng đang dùng.</small></details>`;
}
export function squadIntents(s,round,reef=false,volcano=false){
  if(!s||s.enemies.length===1)return '';
  return `<div class="squad-intents" aria-label="Dự định từng đối thủ">${enemySquadPlans(s,round,reef,volcano).map(p=>{const u=s.enemies.find(u=>u.id===p.actor),target=[...s.allies,...s.enemies].find(u=>u.id===p.target),label=unit=>(reef||volcano)&&unit.id.startsWith('enemy-')?(volcano?['Hộ Vệ Đá','Sói Than Hồng','Chim Tro Lửa']:['Cua Đá','Sứa Tích Điện','Sò Ngọc Chữa Lành'])[Number(unit.id.slice(6))]||name(unit):name(unit);return `<span data-intent-actor="${u.id}">${icon(p.kind==='heal'?'heart':p.kind==='guard'?'shield':p.kind==='charge'?'bolt':'swords',12)} <b>${escape(label(u))}</b> · ${p.name}${target?` → ${escape(label(target))}`:''}</span>`;}).join('')}<small>${volcano?'Sói vượt hàng trước để săn thú yếu phía sau. Hạ sói hoặc dựng khiên, hồi phục cho mục tiêu.':'Địch điều chỉnh sau nước đi của bạn. Hạ thú hỗ trợ để chặn hồi phục.'}</small></div>`;
}
export function squadQuickPanel(run,mode){
  if(!run.squad)return '';
  return `<section class="squad-quick-panel" aria-label="Sinh lực từng linh thú"><div><strong>${icon('paw',15)} Từng thú · từng vai trò</strong><small>Thú gục ngừng đánh. Chiêu hồi máu không hồi sinh giữa trận.</small></div>${[['allies','Đội bạn'],['enemies','Đội địch']].map(([key,label])=>`<div class="squad-quick-side"><b>${label}</b>${run.squad[key].map(u=>`<span class="${!u.hp?'is-down':''}" data-quick-unit="${u.id}"><strong>${escape(name(u))}</strong>${hp(u)}</span>`).join('')}</div>`).join('')}<small>Vào sàn đấu để chọn mục tiêu và người nhận hỗ trợ.</small></section>`;
}
export function squadMembersArt(run){return run.members.map(m=>creature(m.id,{source:m,className:run.squad?.allies.find(u=>u.id===m.id)?.hp===0?'squad-quick-down':''})).join('');}
export function squadPreview(s){
  if(!s)return '';return `<details class="squad-preview"><summary>Sinh lực từng thú sau lượt này</summary>${[['allies','Đội bạn'],['enemies','Đội địch']].map(([key,label])=>`<div><strong>${label}</strong>${s[key].map(u=>`<span>${escape(name(u))}<b>${u.hp.min===u.hp.max?u.hp.min:`${u.hp.min}–${u.hp.max}`}/${u.maxHp}${u.hp.max===0?' · Gục':''}</b></span>`).join('')}</div>`).join('')}</details>`;
}
export function updateSquadUnits(arena,s){
  if(!s)return;
  for(const [side,units]of [['ally',s.allies],['enemy',s.enemies]])for(const u of units){
    const el=arena.querySelector(`[data-side="${side}"][data-unit="${u.id}"]`);if(!el)continue;
    el.classList.toggle('is-down',!u.hp);if(!u.hp)el.disabled=true;
    const label=el.querySelector('[data-unit-hp]'),bar=el.querySelector('.squad-unit-health>i');if(label)label.textContent=`${u.hp}/${u.maxHp}${u.ward?` · 🛡 ${u.ward}`:''}`;if(bar)bar.style.width=`${100*u.hp/u.maxHp}%`;
    const status=el.querySelector('[data-unit-status]');if(status)status.textContent=unitStatus(u);
  }
}
