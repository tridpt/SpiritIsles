import { SPECIES, GACHA_SPECIES, RARITIES, ELEMENTS } from './data.js';
import { NEW_SPECIES } from './creature-catalog.js';
import { creature, icon } from './art.js';

export function rarityFilters(ui) {
  return `<div class="rarity-toolbar"><div class="rarity-filters" role="group" aria-label="Lọc độ hiếm"><button class="rarity-filter ${ui.rarity==='all'?'active':''}" data-action="rarity-filter" data-id="all" aria-pressed="${ui.rarity==='all'}">Mọi độ hiếm</button>${Object.entries(RARITIES).map(([id,r])=>`<button class="rarity-filter ${ui.rarity===id?'active':''}" data-action="rarity-filter" data-id="${id}" aria-label="Lọc ${id}" aria-pressed="${ui.rarity===id}"><span class="rarity rarity-${id}">${id}</span><span>${r.name}</span></button>`).join('')}</div><label class="creature-sort"><span>Sắp xếp</span><select id="creature-sort" aria-label="Sắp xếp linh thú"><option value="rarity" ${ui.sort==='rarity'?'selected':''}>Độ hiếm cao nhất</option><option value="name" ${ui.sort==='name'?'selected':''}>Tên A → Z</option></select></label></div>`;
}

export function legendGallery(state,{badge,elementBadge}) {
  const fresh=new Set(NEW_SPECIES.map(s=>s.id));
  const legends=SPECIES.filter(s=>s.rarity==='SSR').sort((a,b)=>Number(fresh.has(b.id))-Number(fresh.has(a.id)));
  return `<section class="legend-gallery" aria-labelledby="legend-gallery-title"><div class="section-line"><div><span class="eyebrow">${legends.length} HUYỀN THOẠI · ${Object.keys(ELEMENTS).length} HỆ LINH THÚ</span><h2 id="legend-gallery-title">Những huyền thoại đang chờ.</h2><p>${GACHA_SPECIES.length} loài từ trứng, ${SPECIES.length-GACHA_SPECIES.length} loài từ lai tạo. Chạm vào một bạn để ngắm kỹ hơn.</p></div><span class="legend-scroll-hint">Lướt để khám phá ${icon('arrow',17)}</span></div><div class="legend-shelf" tabindex="0" aria-label="Bộ sưu tập ${legends.length} linh thú SSR">${legends.map(s=>`<button class="legend-card" data-action="${state.pets.some(p=>p.id===s.id)?'pet':'species'}" data-id="${s.id}" aria-label="Ngắm ${s.name}">${badge(s)}${creature(s.id,{source:state})}<strong>${s.name}</strong>${elementBadge(s.element)}<span class="legend-card-caption">${state.pets.some(p=>p.id===s.id)?'Đã kết bạn':'Đang chờ trong trứng'}</span></button>`).join('')}</div><div class="rarity-guide"><span><i class="rarity rarity-N">N</i> Nhỏ xinh</span><span><i class="rarity rarity-R">R</i> Hoa văn riêng</span><span><i class="rarity rarity-SR">SR</i> Sắc màu & ánh sáng</span><span><i class="rarity rarity-SSR">SSR</i> Dáng thần thú & hào quang</span></div></section>`;
}
