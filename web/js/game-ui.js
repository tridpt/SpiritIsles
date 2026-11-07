import { BY_ID, SPECIES, RESOURCES, QUESTS } from './data.js';
import { icon, creature, islandArt } from './art.js';
import * as E from './engine.js';
import { remainingTime } from './activities-ui.js';
import { DOJO_TITLES,totalStars } from './dojo-data.js';
import { lifeProfile } from './island-care.js';
import { layoutOf, anchorOf } from './island-layout.js';
import { renderLayout } from './island-layout-art.js';
import { seasonalNotice } from './seasonal-engine.js';
import { dailyHabitatHint } from './habitat-engine.js';

const NAV = [
  ['island', 'island', 'Đảo của bạn', 'Đảo nhỏ'],
  ['hatch', 'egg', 'Ấp trứng', 'Ấp trứng'],
  ['pets', 'paw', 'Linh thú', 'Linh thú'],
  ['explore', 'compass', 'Thám hiểm', 'Thám hiểm'],
  ['campaign','map','Chiến dịch','Chiến dịch'],
  ['build', 'build', 'Xây dựng', 'Xây đảo'],
  ['journal', 'book', 'Nhật ký', 'Nhật ký'],
  ['habitat', 'heart', 'Sổ Kỷ Niệm', 'Kỷ niệm'],
  ['tower','trophy','Tháp Vô Tận','Tháp Vô Tận'],
  ['shiny','sparkle','Sổ Hào Quang','Shiny'],
  ['seasonal','gift','Lễ Hội Sao Rơi','Lễ hội'],
];

function activePage(page) {
  return ({ tower:'tower', decorate:'island', fishing: 'island', ruins: 'explore', boss: 'explore', forge: 'pets', awaken:'pets', dojo:'explore' })[page] || page;
}

export function renderGameMenu(state, ui) {
  const current = activePage(ui.page);
  const ready = QUESTS.some(q => !state.claimed.includes(q.id) && E.questProgress(state, q) >= q.target);
  const habitatHint=dailyHabitatHint(state);
  return `<p class="game-menu-intro">Chọn nơi muốn ghé, rồi tiếp tục cuộc phiêu lưu.</p><nav class="game-menu-grid" aria-label="Chức năng trên đảo">${NAV.map(([page, art, label, short]) => `<button data-action="nav" data-page="${page}" aria-label="${label}" ${current === page ? 'aria-current="page"' : ''} class="game-menu-item ${current === page ? 'active' : ''}"><span class="menu-token">${icon(art, 29)}${(page === 'journal' && ready || page === 'habitat' && habitatHint?.ready || page === 'seasonal' && seasonalNotice(state)) ? '<i class="game-notice"></i>' : ''}</span><strong>${short}</strong>${current === page ? '<small>Đang ở đây</small>' : page==='seasonal'?'<small>30 ngày · quà & kỷ vật</small>':page==='habitat'?'<small>Hành vi & kỷ niệm</small>':'<small>Ghé thăm</small>'}</button>`).join('')}</nav><button class="game-menu-settings" data-action="settings" aria-label="Cài đặt">${icon('settings',20)}<span>Cài đặt<small>Âm thanh, chuyển động & bản lưu</small></span>${icon('chevron',17)}</button>`;
}

export function renderGameShell(state, ui, content, h) {
  const compact = n => n >= 100000 ? new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(n) : h.fmt(n);
  return `<div class="app-shell game-shell" data-screen="${ui.page}">
    <header class="topbar game-hud">
      <button class="player-hud ${state.shiny?.profile?'prism-profile':''}" data-action="nav" data-page="journal" aria-label="Hồ sơ đảo cấp ${state.level}">
        <span class="player-medal"><img src="assets/icon.svg" width="42" height="42" alt=""><b>${state.level}</b></span>
        <span class="player-details"><strong>${DOJO_TITLES[state.dojo.cosmetics.title]||'Người giữ đảo'}</strong><small>Đảo cấp ${state.level} <span>${state.xp}/${state.level * 110} XP</span></small>${h.progress(state.xp, state.level * 110, 'player-xp')}</span>
      </button>
      <div class="hud-wordmark">Đảo Linh Thú<small>SPIRIT ISLES</small></div>
      <div class="wallet" aria-label="Kho tài nguyên">${['gold', 'food', 'crystals', 'tickets'].map(k => `<button class="wallet-item wallet-${k}" data-action="resource-info" data-id="${k}" aria-label="${RESOURCES[k].name}: ${h.fmt(state.resources[k])}"><span class="wallet-symbol">${icon(RESOURCES[k].icon, 20)}</span><span>${compact(state.resources[k])}</span><i>+</i></button>`).join('')}</div>
      <button class="top-settings game-menu-toggle" data-action="game-menu" aria-label="Mở menu đảo" aria-haspopup="dialog"><span class="menu-grid-symbol" aria-hidden="true"><i></i><i></i><i></i><i></i></span><small>Menu</small></button>
    </header>
    <div class="workspace"><main id="main" class="main-content ${ui.page === 'decorate' ? 'editor-main' : ui.page === 'island' ? 'lobby-main' : 'game-page'}">${content}</main></div>
  </div>`;
}

function activity({ cls, art, label, status, page, action = 'nav', notice = false }) {
  return `<button class="lobby-activity ${cls}" data-action="${action}" ${page ? `data-page="${page}"` : ''} aria-label="${label}"><span class="activity-token">${icon(art, 29)}${notice ? '<i class="game-notice"></i>' : ''}</span><strong>${label}</strong><small${cls === 'breeding-entry' ? ' data-breed-home-label' : ''}>${status}</small></button>`;
}

export function renderHabitatLobbyHint(state) {
  const hint=dailyHabitatHint(state);
  if(!hint)return '';
  const name=BY_ID[hint.pet.species].name;
  return `<button class="lobby-habitat-hint ${hint.ready?'ready':''}" data-action="habitat-open" data-habitat-day="${hint.date}" data-id="${hint.pet.id}" ${hint.moment?`data-moment="${hint.moment.id}"`:''} aria-label="Mở Hành vi hôm nay${hint.moment?`: ${name} · ${hint.moment.name}`:''}"><span class="habitat-hint-token">${icon(hint.complete?'book':'heart',21)}${hint.ready?'<i class="game-notice"></i>':''}</span><span class="habitat-hint-copy"><small>HÀNH VI HÔM NAY</small><strong>${hint.complete?'Thêm bạn, thêm kỷ niệm':hint.moment.name}</strong><em>${hint.complete?'Bạn đã ghi đủ kỷ niệm của thú đang có':`${name} · ${hint.ready?'Sẵn sàng cùng chơi':'Xem điều kiện'}`}</em></span>${icon('chevron',17)}</button>`;
}

export function renderIslandLobby(state, h) {
  const team = state.team.map(id => state.pets.find(p => p.id === id)).filter(Boolean);
  const egg = state.breeding.egg;
  const quests = QUESTS.filter(q => !state.claimed.includes(q.id));
  const quest = quests.find(q => E.questProgress(state, q) >= q.target) || quests[0];
  const questReady = quest && E.questProgress(state, quest) >= quest.target;
  const questValue = quest ? Math.min(quest.target, E.questProgress(state, quest)) : 0;
  const questAction = quest ? questReady ? 'claim-quest' : 'quest-go' : 'nav';
  const questAttrs = quest ? `data-id="${quest.id}"` : 'data-page="journal"';
  const journeyPage = state.tower.run ? 'tower' : state.boss.run ? 'boss' : state.ruins.run ? 'ruins' : 'explore';
  const continuing = !!(state.expedition || state.ruins.run || state.boss.run || state.tower.run);
  const ready = QUESTS.some(q => !state.claimed.includes(q.id) && E.questProgress(state, q) >= q.target);
  const layout=layoutOf(state);
  const spot=(type,cls,attrs,body)=>{const p=layout.placed.find(p=>p.type===type);if(!p)return '';const a=anchorOf(p);return `<button class="map-hotspot placed-hotspot ${cls}" style="left:${a.x/10}%;top:${a.y/6-4}%" ${attrs}>${body}</button>`;};
  return `<section class="game-lobby" aria-label="Đảo Bình Yên">
    <div class="world-sun" aria-hidden="true"></div><div class="world-mist mist-left" aria-hidden="true"></div><div class="world-mist mist-right" aria-hidden="true"></div>
    <header class="lobby-location"><div><span class="location-kicker">${icon(state.dojo.cosmetics.title?'trophy':'island', 15)} ${DOJO_TITLES[state.dojo.cosmetics.title]?.toLocaleUpperCase('vi-VN')||'QUẦN ĐẢO LINH THÚ'}</span><h1>Đảo Bình Yên</h1><span class="location-meta"><span class="live-dot"></span>${state.pets.length}/${SPECIES.length} linh thú <i>·</i> ${icon('sun', 14)} Nắng ấm</span></div><button class="daily-treasure ${state.daily.checkin ? 'claimed' : ''}" data-action="${state.daily.checkin ? 'nav' : 'checkin'}" ${state.daily.checkin ? 'data-page="journal"' : ''} aria-label="${state.daily.checkin ? 'Xem quà và nhiệm vụ' : 'Nhận quà hôm nay'}"><span>${icon(state.daily.checkin ? 'chest' : 'gift', 29)}${state.daily.checkin ? '' : '<i class="game-notice"></i>'}</span><strong>${state.daily.checkin ? 'Nhiệm vụ' : 'Quà mỗi ngày'}</strong></button></header>
    <div class="lobby-map"><div class="island-world"><div class="island-scene">${islandArt(state.level, state.buildings,{bare:true})}${renderLayout(layout)}
      ${spot('nursery','nursery-hotspot','data-action="nav" data-page="hatch" aria-label="Đến vườn ấp trứng"',`${icon('egg',17)}<span>Vườn ấp</span><i>${state.resources.tickets}</i>`)}
      ${spot('lodge','home-hotspot','data-action="building" data-id="lodge" aria-label="Nhà cây"',`${icon('home',16)}<span>Nhà cây</span><i>${state.buildings.lodge?.level||1}</i>`)}
      ${spot('garden','garden-hotspot','data-action="collect-one" data-id="garden" aria-label="Thu hoạch vườn quả"',`${icon('berry',17)}<span>Vườn quả</span><span class="harvest-dot" data-garden-ready></span>`)}
      ${team.map((p, i) => `<button class="island-pet island-pet-${i}" data-action="island-pet" data-id="${p.id}" data-gait="${lifeProfile(BY_ID[p.species]).gait}" data-behavior="idle" aria-label="Chăm sóc ${BY_ID[p.species].name}" aria-expanded="false" aria-controls="island-care"><div class="island-pet-body">${creature(p.species,{source:state})}</div><span class="island-pet-name">${BY_ID[p.species].name}</span><i class="pet-thought" aria-hidden="true"></i><i class="pet-reaction" aria-hidden="true"></i><i class="pet-life-effects" aria-hidden="true"></i></button>`).join('')}
      <button class="firefly" data-action="firefly" aria-label="Bắt đom đóm nhận quà">${icon('sparkle', 23)}</button>
    </div></div></div>
    <div class="island-activities lobby-activities" aria-label="Hoạt động trên đảo">
      ${activity({ cls: 'fishing-entry', art: 'fish', label: 'Bến câu', status: state.fishing.session ? 'Đang câu' : `Cấp câu ${state.fishing.level}`, page: 'fishing' })}
      ${activity({ cls: 'breeding-entry', art: 'sprout', label: 'Lai tạo', status: egg ? Date.now() >= egg.readyAt ? 'Đã ấp xong' : remainingTime(egg.readyAt) : state.level < 2 ? 'Cấp đảo 2' : 'Ghép hệ thú', action: 'go-breeding', notice: egg && Date.now() >= egg.readyAt })}
      ${activity({ cls: 'ruins-entry', art: 'compass', label: 'Phế tích', status: state.level < 2 ? 'Cấp đảo 2' : state.ruins.run ? `Tầng ${state.ruins.run.floor}` : `${state.ruins.best}/50 tầng`, page: 'ruins' })}
      ${activity({ cls: 'guardian-entry', art: 'shield', label: 'Thủ vệ', status: state.level < 2 ? 'Cấp đảo 2' : state.boss.run ? 'Đang giao đấu' : `${state.boss.best+state.boss.rivals.frost.best+state.boss.rivals.phoenix.best}/15 bậc`, page: 'boss' })}
    </div>
    <button class="lobby-awakening" data-action="awaken-open" aria-label="Vào Đền Thức tỉnh">${icon('sparkle',18)}<span>Thức tỉnh<small>${state.pets.filter(p=>p.awakened).length}/6 dạng mới</small></span></button><button class="lobby-dojo" data-action="nav" data-page="dojo" aria-label="Vào Võ đường linh thú">${icon('swords',18)}<span>Võ đường<small>${state.dojo.run?'Đang luyện tập':`${totalStars(state)}/24 sao`}</small></span></button>
    ${state.dojo.cosmetics.decoration?`<div class="dojo-island-monument" aria-label="Bia chiến công Võ đường"><span>${icon('trophy',27)}</span><small>${totalStars(state)} ★</small></div>`:''}
    <nav class="island-shortcuts" aria-label="Chức năng ngay trên đảo">${['hatch','pets','build','journal'].map(id=>{const [,art,label,short]=NAV.find(n=>n[0]===id);return `<button class="island-shortcut shortcut-${id}" data-action="nav" data-page="${id}" aria-label="${label}"><span class="shortcut-token">${icon(art,27)}${id==='journal'&&ready?'<i class="game-notice"></i>':''}</span><strong>${short}</strong></button>`;}).join('')}</nav>
    <aside id="island-care" class="island-care" hidden role="group" aria-label="Chăm sóc ngay trên đảo"></aside>
    <aside id="island-memory" class="island-memory" hidden role="group" aria-label="Khoảnh khắc trên đảo"></aside>
    <div class="lobby-bottom">
      <div class="lobby-cozy-actions">${renderHabitatLobbyHint(state)}<button class="island-edit-entry" data-action="island-edit-open" aria-label="Chỉnh đảo">${icon('build',18)}<strong>Chỉnh đảo</strong><span>✦</span></button></div>
      <button class="lobby-quest ${questReady ? 'quest-ready' : ''}" data-action="${questAction}" ${questAttrs} aria-label="${questReady ? 'Nhận thưởng' : 'Xem nhiệm vụ'} ${quest ? h.escape(quest.title) : 'hằng ngày'}"><span class="quest-seal">${icon(questReady ? 'gift' : 'book', 25)}</span><span class="quest-copy"><small>${questReady ? 'ĐÃ HOÀN THÀNH' : 'NHIỆM VỤ ĐẢO'}</small><strong>${quest ? h.escape(quest.title) : 'Khám phá thử thách mỗi ngày'}</strong>${quest ? h.progress(questValue, quest.target) : ''}</span><span class="quest-counter">${quest ? `${questValue}/${quest.target}` : ''}${icon(questReady ? 'gift' : 'chevron', 17)}</span></button>
      <div class="lobby-harvest"><span class="harvest-symbol">${icon('chest', 26)}</span><div><strong>Kho tài nguyên</strong><small data-production-label>Vườn quả đang tích lũy…</small></div>${h.button(`${icon('leaf', 17)}<span>Thu hoạch</span>`, 'collect', 'primary', 'data-collect-button')}</div>
      <button class="journey-launch" data-action="nav" data-page="${journeyPage}" aria-label="${continuing ? 'Tiếp tục hành trình' : 'Mở bản đồ thám hiểm'}"><span class="journey-compass">${icon('compass', 34)}</span><span><small>${continuing ? 'ĐỘI ĐANG CHỜ BẠN' : 'CÙNG ĐỘI LINH THÚ'}</small><strong>${continuing ? 'Tiếp tục' : 'Thám hiểm'}</strong></span>${icon('arrow', 23)}</button>
    </div>
  </section>`;
}
