import * as C from './campaign-engine.js';
import {CAMPAIGN_CHAPTERS,campaignStage,campaignBiome,campaignEvent} from './campaign-data.js';
import {renderCampaign,campaignEntry,campaignBrief,campaignResultHTML,campaignRunHUD} from './campaign-ui.js';
import * as S from './shiny.js';
import {renderShiny,shinyEntry,shinyHelp,shinyPreview,shinyRewardCard,fragmentLabel} from './shiny-ui.js';
import * as T from './tower-engine.js';
import {renderTower,towerEntry} from './tower-ui.js';
import {reefEvent,reefWarning,reefOpening} from './reef-encounter.js';
import {reefRewardEntry} from './reef-rewards.js';
import {volcanoEvent,volcanoWarning} from './volcano-encounter.js';
import {volcanoRewardEntry} from './volcano-rewards.js';
import { squadQuickPanel,squadMembersArt } from './squad-ui.js';
import { SPECIES, GACHA_SPECIES, SHINY_SPECIES, SHINY_VARIANTS, SHINY_RATE, SHINY_PITY_MAX, BY_ID, RARITIES, ELEMENTS, BUILDINGS, BIOMES, QUESTS, RESOURCES, EVENTS } from './data.js';
import * as E from './engine.js';
import { enableCreatureViewing } from './depth-interaction.js';
import { roleBadge, skillDetails, teamPanel, teamPicker, battleSkills, battleEffects, formationSummary, tacticsHelp } from './tactics-ui.js';
import { legendGallery, rarityFilters } from './creature-ui.js';
import { icon, creature, islandArt, biomeArt, eggArt } from './art.js';
import { FISH_SPOTS, FISH_BY_ID } from './activities-data.js';
import { eggTabs, renderBreeding, renderFishing, remainingTime } from './activities-ui.js';
import * as R from './ruins-engine.js';
import { renderRuins, ruinsEntry, ruinsExploreTabs, ruinsDust } from './ruins-ui.js';
import { RUINS_BLESSING_BY_ID } from './ruins-data.js';
import * as B from './boss-engine.js';
import { enemyIntent } from './enemy-tactics.js';
import { BOSSES,bossId,bossProgress,bossRequiredLevel } from './boss-state.js';
import * as F from './forge-engine.js';
import { chooseSkillBranch, upgradeSkillRank } from './skill-training.js';
import { trainingPanel } from './skill-training-ui.js';
import { renderBoss,bossEntry } from './boss-ui.js';
import { renderForge,forgeEntry,petGear,gearManager,gearDetail,materialRow } from './forge-ui.js';
import { GEAR_BY_ID } from './forge-state.js';
import { gearArt } from './guardian-art.js';
import { playCombatFx } from './combat-fx.js';
import { exploreEnemies } from './combat-team.js';
import { enemyTeamArt } from './combat-team-ui.js';
import { createCombatStage,activeBattleEntry } from './combat-stage.js';
import {createAutoPlanner} from './auto-tactics-ui.js';
import { journeyEntry } from './journey-scene.js';
import { renderGameShell, renderIslandLobby, renderGameMenu, renderHabitatLobbyHint } from './game-ui.js';
import * as D from './dojo-engine.js';
import { renderDojo } from './dojo-ui.js';
import { renderAwakening, awakeningEntry, awakeningReveal } from './awakening-ui.js';
import { awakeningRewardText } from './awakening-data.js';
import { awakenPet } from './awakening-state.js';
import { createIslandLife } from './island-life.js';
import { createIslandEditor } from './island-editor.js';
import { commitLayout } from './island-layout.js';
import * as H from './habitat-engine.js';
import { habitatEntry, renderHabitat } from './habitat-ui.js';
import { createHabitatScene } from './habitat-scene.js';
import { renderSeasonal, seasonalHelp, festivalCountdown } from './seasonal-ui.js';
import { itemThumbnail } from './island-layout-art.js';

const $=s=>document.querySelector(s);
const fmt=n=>new Intl.NumberFormat('vi-VN').format(Math.floor(n));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saveWarning=false,loadWarning=false;
function loadGame(){
  const candidates=[];
  try{const raw=localStorage.getItem(E.SAVE_KEY);if(raw)candidates.push(raw);}catch{}
  try{const raw=window.AndroidApp?.readSave();if(raw)candidates.push(raw);}catch{}
  const valid=[];
  for(const [priority,raw] of candidates.entries()){
    try{const envelope=JSON.parse(raw);const saved=E.validateSave(envelope);const at=Number.isFinite(envelope.savedAt)&&envelope.savedAt>=0&&envelope.savedAt<=Date.now()+86400000?envelope.savedAt:saved.lastSeen;valid.push({state:saved,at,priority});}
    catch{loadWarning=true;}
  }
  valid.sort((a,b)=>b.at-a.at||b.priority-a.priority);
  return valid[0]?.state||E.newGame();
}
enableCreatureViewing();
let state=loadGame();
const ui={awakenId:state.dojo.run?.kind==='awakening'?state.dojo.run.id:'mossfox',dojoTab:'challenges',practiceEnemy:'plain',practicePaths:{},dojoReport:false,towerTab:'climb',page:state.tower.run?'tower':state.dojo.run?state.dojo.run.kind==='awakening'?'awaken':'dojo':state.boss.run?'boss':state.ruins.run?'ruins':state.expedition?state.expedition.campaign?'campaign':'explore':'island',filter:'all',rarity:'all',sort:'rarity',search:'',book:false,egg:'nature',questTab:'story',modal:null,hatch:null,hatchTimer:null,fireflyUntil:0,fishTab:'play',fishSpot:state.fishing.session?.spot||'pond',fishResult:null,breedFish:'',ruinsTab:'journey',ruinsChapter:null,forgeTab:'craft',bossId:bossId(state.boss.run||state.boss.lastResult),bossTier:Math.min(5,bossProgress(state,bossId(state.boss.run||state.boss.lastResult)).best+1,Math.max(1,state.level-BOSSES[bossId(state.boss.run||state.boss.lastResult)].unlock+1))};
let fishingFrame=0;
function recordIslandMemory(id,moment,decorationId=null,partnerId=null){const r=H.discoverMoment(state,id,moment,Date.now(),decorationId,partnerId);if(r.isNew){save();refreshHabitatLobbyHint();sound('reward');}return r;}
const islandLife=createIslandLife({getState:()=>state,onPat:id=>{const r=E.patPet(state,id);if(r.gained){save();refreshHabitatLobbyHint();}if(!r.error)sound('reward');return r;},onFeed:id=>{const r=E.feed(state,id);if(!r.error){changed();sound('reward');}return r;},onInspect:openPet,onRecord:recordIslandMemory,onBook:openHabitat});
const habitatScene=createHabitatScene({getState:()=>state,onRecord:recordIslandMemory,onClose:()=>islandLife.sync(),onBook:openHabitat});
const islandEditor=createIslandEditor({getState:()=>state,onSave:draft=>{const r=commitLayout(state,draft);if(!r.error){islandEditor.end();ui.page='island';changed();sound('reward');toast('Đã lưu góc đảo của bạn!');}return r;},onExit:page=>{closeModal();navigate(page);},onDialog:(kind,html)=>{openModal(kind==='catalog'?'Kho đồ trang trí':'Giữ bố cục mới?',html,kind==='catalog'?'island-catalog':'island-discard');ui.modal={kind:`island-${kind}`};}});
const autoPlanner=createAutoPlanner({getState:()=>state,onChange:changed,onOpen:()=>combatStage.suspendAuto(),onClose:()=>combatStage.resumeAuto()});
const combatStage=createCombatStage({getState:()=>state,onPlanner:(tab,context)=>autoPlanner.open(tab,context),act:(mode,action,grade)=>{
  const r=mode==='tower'?T.towerBattleTurn(state,action,Date.now(),grade):mode==='dojo'?D.dojoBattleTurn(state,action,Date.now(),grade):mode==='boss'?B.bossBattleTurn(state,action,Date.now(),grade):mode==='ruins'?R.ruinsBattleTurn(state,action,Date.now(),grade):E.battleTurn(state,action,Math.random,grade);
  if(!r.error){changed();if(!document.querySelector('#combat-stage.forest-journey'))sound(r.finished||r.won?'reward':'battle');if(mode!=='dojo'){const mats=r.awakeningMaterials||r.result?.awakeningMaterials;if(mats&&Object.keys(mats).length)toast(awakeningRewardText(mats));}}
  return r;
},onRoute:choice=>{const r=E.chooseRoute(state,choice);if(!r.error){changed();sound();}return r;}});
if(state.fishing.session?.pausedAt===null)E.pauseFishing(state,Math.max(state.lastSeen,state.fishing.session.started));
function save(){
  E.refreshSeason(state);
  state.lastSeen=Date.now();const raw=E.serialize(state);let stored=false;
  try{localStorage.setItem(E.SAVE_KEY,raw);stored=true;}catch{}
  try{if(window.AndroidApp&&window.AndroidApp.storeSave(raw)!==false)stored=true;}catch{}
  if(!stored&&!saveWarning){saveWarning=true;toast('Không thể tự lưu trên thiết bị này. Hãy xuất bản lưu trong Cài đặt.','info');}
}
function resource(k,n,cls=''){return `<span class="resource ${cls}" title="${RESOURCES[k].name}">${icon(RESOURCES[k].icon,17)}<b>${fmt(n)}</b></span>`;}
function rewards(reward){return Object.entries(reward).filter(([,v])=>v>0).map(([k,v])=>resource(k,v)).join('');}
function badge(s){return `<span class="rarity rarity-${s.rarity}">${s.rarity}</span>`;}
function shinyBadge(){return '<span class="shiny-badge">✦ SHINY</span>';}
function speciesName(id,shiny=false){const s=BY_ID[id];return shiny&&SHINY_VARIANTS[id]?.name||s?.name||id;}
function elementBadge(element){const el=ELEMENTS[element];return `<span class="element" style="--element:${el.color};--pale:${el.pale}">${icon(el.icon,13)}${el.name}</span>`;}
function button(label,action,cls='primary',attrs=''){return `<button class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;}
function progress(value,max,cls=''){return `<div class="progress ${cls}"><span style="width:${Math.max(0,Math.min(100,value/max*100))}%"></span></div>`;}
const activityHelpers={pageHeading,button,resource,rewards,progress,badge,elementBadge,fmt,escape};
function miniQuest(q){const current=E.questProgress(state,q);const done=current>=q.target;return `<div class="mini-quest"><span class="quest-check ${done?'complete':''}">${icon(done?'check':q.metric==='feeds'?'berry':q.metric==='expeditions'?'compass':'egg',17)}</span><div><strong>${q.title}</strong><small>${q.description}</small>${progress(current,q.target)}</div><button class="quest-go ${done?'ready':''}" data-action="${done?'claim-quest':'quest-go'}" data-id="${q.id}" aria-label="${done?'Nhận thưởng':'Xem nhiệm vụ'} ${q.title}">${icon(done?'gift':'chevron',17)}</button></div>`;}

function render(){
  E.refreshDaily(state);
  T.refreshTower(state);
  E.refreshSeason(state);
  $('#app').innerHTML=renderGameShell(state,ui,renderPage(),activityHelpers);
  document.body.classList.toggle('reduced-motion',!state.settings.motion);
  document.body.classList.toggle('dojo-aura',state.dojo.cosmetics.aura);
  tick();
  syncFishing();
  habitatScene.sync();
  islandLife.sync();
  islandEditor.sync();
}
function renderPage(){return ui.page==='seasonal'?renderSeasonal(state,ui,activityHelpers):ui.page==='campaign'?(state.expedition?.campaign?renderJourney():renderCampaign(state,ui,activityHelpers)):ui.page==='shiny'?renderShiny(state,ui,activityHelpers):ui.page==='tower'?renderTower(state,ui,activityHelpers):ui.page==='habitat'?renderHabitat(state,ui,activityHelpers):ui.page==='decorate'?islandEditor.html():ui.page==='awaken'?renderAwakening(state,ui,activityHelpers):ui.page==='dojo'?renderDojo(state,ui,activityHelpers):ui.page==='boss'?renderBoss(state,ui,activityHelpers):ui.page==='forge'?renderForge(state,ui,activityHelpers):ui.page==='ruins'?renderRuins(state,ui,activityHelpers):ui.page==='fishing'?renderFishing(state,ui,activityHelpers):({island:renderIsland,hatch:renderHatch,pets:renderPets,explore:renderExplore,build:renderBuild,journal:renderJournal}[ui.page])();}
function pageHeading(kicker,title,subtitle,extra=''){return `<div class="page-heading"><div class="screen-title"><button class="screen-back" data-action="nav" data-page="island" aria-label="Về đảo">${icon('arrow',19)}</button><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${subtitle}</p></div></div>${extra}</div>`;}

function renderIsland(){return renderIslandLobby(state,activityHelpers);}
function refreshHabitatLobbyHint(){const hint=$('.lobby-habitat-hint');if(hint)hint.outerHTML=renderHabitatLobbyHint(state);}
function openHabitat(id,momentId='') {
  closeModal();habitatScene.close();
  const pet=state.pets.find(p=>p.id===id)||state.pets.find(p=>p.id===ui.habitatPet)||state.pets[0];
  const status=momentId?H.momentStatus(state,pet.id,momentId):null;
  ui.habitatPet=pet.id;ui.habitatFocus=status&&!status.error?momentId:null;
  ui.habitatFilter=status?.discovered?'found':'new';navigate('habitat');
  if(ui.habitatFocus){
    const card=$('.habitat-card.featured');
    card?.scrollIntoView({block:'center',behavior:'instant'});card?.focus({preventScroll:true});
  }
}

function petCard(p,compact=false){const s=BY_ID[p.species],name=speciesName(p.species,p.shiny);return `<article class="pet-card tier-${s.rarity} ${p.shiny?'is-shiny':''} ${compact?'compact':''}" style="--pet-tint:${ELEMENTS[s.element].pale}"><button class="pet-visual" data-action="pet" data-id="${p.id}" aria-label="Xem ${name}">${badge(s)}${p.shiny?shinyBadge():''}<span class="pet-level">Lv.${p.level}</span>${creature(p.species,{source:p})}${p.stars?`<span class="pet-stars">${'★'.repeat(p.stars)}</span>`:''}</button><div class="pet-card-bottom"><div><button class="pet-name" data-action="pet" data-id="${p.id}">${name}</button><div class="pet-meta">${elementBadge(s.element)}<span>${icon('bolt',12)} ${E.petPower(p,state)}</span></div>${roleBadge(p.id,p)}</div><button class="feed-mini" data-action="feed" data-id="${p.id}" aria-label="Cho ${name} ăn">${icon('berry',18)}</button></div></article>`;}

function renderHatch(){
  if(ui.egg==='breed')return renderBreeding(state,ui,activityHelpers);
  const star=ui.egg==='star';const tickets=state.resources.tickets;
  const singleCost=star?resource('crystals',150):tickets>=1?resource('tickets',1):resource('crystals',80);
  const tenCost=star?resource('crystals',1500):tickets>=10?resource('tickets',10):resource('crystals',800);
  const shinyCount=state.pets.filter(p=>p.shiny).length;
  return `${pageHeading('VƯỜN ẤP GIẤC MƠ','Vườn ấp','Điều kỳ diệu đôi khi bắt đầu từ một tiếng “tách”.',button(`${icon('info',17)} Tỷ lệ & bảo hiểm`,'rates','secondary small'))}<div class="hatch-layout"><section class="hatch-sanctuary">${eggTabs(ui.egg)}<div class="hatch-stage ${star?'star-stage':''}"><div class="hatch-orbit orbit-one"></div><div class="hatch-orbit orbit-two"></div><span class="hatch-float float-one">${icon('sparkle',23)}</span><span class="hatch-float float-two">${icon('leaf',26)}</span><span class="hatch-float float-three">${icon('star',18)}</span>${eggArt(ui.egg)}<span class="egg-pedestal"></span><span class="hatch-caption">${star?'MANG THEO ÁNH SÁNG CỦA NGÀN VÌ SAO':'ẤP MỘT MẦM NHỎ, ĐÓN MỘT TÌNH BẠN'}</span></div><div class="hatch-description"><span class="eyebrow">${star?'BẢN GIAO HƯỞNG CỦA BẦU TRỜI':'MÓN QUÀ TỪ KHU RỪNG'}</span><h2>${star?'Trứng Ánh Sao':'Trứng Mầm Xanh'}</h2><p>${star?'Những linh thú hiếm đang lắng nghe lời gọi từ các vì sao.':'Mỗi quả trứng ôm một giấc mơ. Bạn sẽ gặp người bạn nào hôm nay?'}</p><div class="hatch-buttons">${button(`<span>Ấp 1 trứng</span>${singleCost}`,'hatch','secondary','data-count="1"')}${button(`<span>Ấp 10 trứng</span>${tenCost}`,'hatch','primary','data-count="10"')}</div><small class="hatch-guarantee">${icon('shield',14)} Tối đa 10 lượt có SR trở lên · 50 lượt chắc chắn có SSR · Shiny ${Math.round(SHINY_RATE*1000)/10}%</small></div></section><aside class="hatch-sidebar"><section class="pity-card"><span class="icon-circle">${icon('sparkle',23)}</span><h3>Phép màu đang đến gần</h3><p>Mỗi lần ấp đều đưa bạn gần hơn đến một người bạn huyền thoại.</p><div class="section-line"><span>Bảo hiểm SSR</span><strong>${state.pity}<small> / 50</small></strong></div>${progress(state.pity,50,'gold-progress')}<small>Còn tối đa ${50-state.pity} trứng tới SSR tiếp theo</small><div class="pity-divider"></div><div class="section-line"><span>Bảo hiểm SR</span><strong>${state.srPity}<small> / 10</small></strong></div>${progress(state.srPity,10)}<small>Bộ đếm dùng chung cho cả hai loại trứng.</small><div class="pity-divider"></div><div class="section-line shiny-pity-line"><span>${shinyBadge()} Bảo hiểm Shiny</span><strong>${state.shiny.pity}<small> / ${SHINY_PITY_MAX}</small></strong></div>${progress(state.shiny.pity,SHINY_PITY_MAX,'shiny-progress')}<small>Còn tối đa ${SHINY_PITY_MAX-state.shiny.pity} lượt để chắc chắn gặp Shiny.</small></section><section class="collection-tease"><div class="section-line"><h3>Một cuốn sổ đang đầy</h3>${icon('book',20)}</div><div class="collection-faces">${['mossfox','blossomdeer','oceandragon'].map(id=>creature(id)).join('')}</div><strong>${state.pets.length} / ${SPECIES.length} loài đã kết bạn</strong><p>${shinyBadge()} ${shinyCount} / ${SHINY_SPECIES.length} biến thể Hào Quang đã mở.</p><button class="text-btn" data-action="book">Mở sổ linh thú ${icon('arrow',15)}</button></section><div class="gentle-note">${icon('heart',18)} Vé và ngọc đều kiếm được khi chơi. Hãy khám phá theo nhịp của bạn.</div></aside></div>${shinyEntry(state)}${legendGallery(state,activityHelpers)}`;
}

function renderPets(){const shinyCount=state.pets.filter(p=>p.shiny).length;return `${pageHeading('NHỮNG TÌNH BẠN ĐANG LỚN','Đội hình & linh thú','Chăm sóc, tiến hóa và tìm đội hình hợp với bạn.',`<span class="collection-total">${icon('paw',22)}<strong>${state.pets.length}</strong><span>/ ${SPECIES.length} loài</span><em>${shinyBadge()} ${shinyCount}/${SHINY_SPECIES.length}</em></span>`)}${teamPanel(state)}${shinyEntry(state)}${awakeningEntry(state)}${habitatEntry(state)}${forgeEntry(state)}<div class="collection-toolbar"><div class="segmented"><button class="${!ui.book?'active':''}" data-action="collection-mode" data-id="owned">Linh thú của bạn</button><button class="${ui.book?'active':''}" data-action="collection-mode" data-id="book">Sổ linh thú</button></div><label class="search-box">${icon('compass',17)}<input type="search" id="pet-search" placeholder="Tìm một người bạn…" value="${escape(ui.search)}" aria-label="Tìm linh thú"></label></div><div class="filter-row"><button data-action="filter" data-id="all" class="filter-chip ${ui.filter==='all'?'active':''}">Tất cả</button>${Object.entries(ELEMENTS).map(([id,el])=>`<button data-action="filter" data-id="${id}" class="filter-chip ${ui.filter===id?'active':''}" style="--element:${el.color}">${icon(el.icon,15)} ${el.name}</button>`).join('')}</div>${rarityFilters(ui)}<div id="pet-grid" class="pet-grid">${renderPetGrid()}</div>`;}
function renderPetGrid(){
  const list=(ui.book?SPECIES:state.pets.map(p=>BY_ID[p.species])).filter(s=>(ui.filter==='all'||s.element===ui.filter)&&(ui.rarity==='all'||s.rarity===ui.rarity)&&s.name.toLocaleLowerCase('vi').includes(ui.search.toLocaleLowerCase('vi'))).sort((a,b)=>ui.sort==='name'?a.name.localeCompare(b.name,'vi'):RARITIES[b.rarity].power-RARITIES[a.rarity].power||a.name.localeCompare(b.name,'vi'));
  if(!list.length)return `<div class="empty-state">${icon('paw',40)}<h3>Chưa thấy người bạn nào ở đây</h3><p>Thử tìm tên khác hoặc ghé vườn ấp trứng nhé.</p>${button('Đến vườn ấp','nav','primary','data-page="hatch"')}</div>`;
  return list.map(s=>{const p=state.pets.find(p=>p.species===s.id);return p?petCard(p):`<article class="pet-card undiscovered tier-${s.rarity}" style="--pet-tint:${ELEMENTS[s.element].pale}"><button class="pet-visual" data-action="species" data-id="${s.id}" aria-label="Ngắm ${s.name}">${badge(s)}${creature(s.id)}</button><div class="pet-card-bottom"><div><strong>${s.name}</strong><div class="pet-meta">${elementBadge(s.element)}<span>Chưa kết bạn</span></div></div></div></article>`;}).join('');
}

function renderBuild(){return `${pageHeading('TỪ MỘT HẠT MẦM NHỎ','Xây dựng đảo','Công trình tạo tài nguyên kể cả khi bạn nghỉ chơi, tối đa 8 giờ.',`<div class="building-wallet">${resource('gold',state.resources.gold)}${resource('wood',state.resources.wood)}</div>`)}<div class="build-summary"><span class="icon-circle">${icon('home',25)}</span><div><strong>Đảo Bình Yên · Cấp ${state.level}</strong><p>${Object.keys(state.buildings).length} công trình đang góp một chút phép màu cho đảo.</p></div><span class="build-xp">${state.xp} / ${state.level*110} XP${progress(state.xp,state.level*110)}</span></div><button class="island-decoration-link" data-action="island-edit-open">${icon('island',32)}<span><strong>Trang trí đảo theo ý bạn</strong><small>Kéo thả công trình · 15 loại đồ trang trí · Không tốn tài nguyên</small></span>${icon('chevron',20)}</button>${habitatEntry(state)}<div class="building-grid">${BUILDINGS.map(b=>buildingCard(b)).join('')}</div><div class="gentle-note wide-note">${icon('leaf',20)} Linh thú có nội tại hỗ trợ công trình tương ứng. Sưu tầm thêm bạn mới để đảo sản xuất tốt hơn.</div>`;}
function buildingCard(b){const current=state.buildings[b.id];const locked=state.level<b.unlock;const cost=E.buildingCost(state,b.id);const capped=current?.level>=b.max;return `<article class="building-card ${locked?'locked':''}"><div class="building-art building-art-${b.id}"><span class="building-level">${locked?`${icon('lock',13)} Cấp đảo ${b.unlock}`:current?`Cấp ${current.level} / ${b.max}`:'Công trình mới'}</span>${buildingIllustration(b.id)}</div><div class="building-body"><h3>${b.name}</h3><p>${b.description}</p><div class="production-line">${icon(RESOURCES[b.resource].icon,18)}<strong>${Math.floor(b.amount*(current?.level||1)*E.productionBonus(state,b))}</strong><span>${RESOURCES[b.resource].name.toLowerCase()} / ${b.interval/60} phút</span></div>${!capped?`<div class="building-cost">${rewards(cost)}</div>`:'<div class="building-max">Đã đạt cấp tối đa</div>'}${button(locked?`${icon('lock',16)} Mở ở cấp ${b.unlock}`:capped?`${icon('check',16)} Đã hoàn thiện`:current?`${icon('plus',16)} Nâng lên cấp ${current.level+1}`:`${icon('build',16)} Xây công trình`,'upgrade','full '+(locked||capped?'disabled-style':'secondary'),`data-id="${b.id}" ${locked||capped?'disabled':''}`)}</div></article>`;}
function buildingIllustration(id){
  const drawings={garden:'<path d="m28 102 74-34 72 35-73 34Z" fill="#af966c"/><path d="m44 102 57-25m-32 37 57-26m-31 38 57-26" stroke="#d4b98c" stroke-width="6"/><g fill="#7ca26e"><ellipse cx="65" cy="90" rx="18" ry="11"/><ellipse cx="105" cy="73" rx="18" ry="11"/><ellipse cx="108" cy="109" rx="18" ry="11"/><ellipse cx="148" cy="92" rx="18" ry="11"/></g><g fill="#d69885"><circle cx="65" cy="84" r="7"/><circle cx="105" cy="67" r="7"/><circle cx="108" cy="103" r="7"/><circle cx="148" cy="86" r="7"/></g>',lodge:'<path d="m49 74 50-27 52 27v56l-52 27-50-27Z" fill="#dfcfaa"/><path d="m99 47 52 27v56l-52 27V98" fill="#cdb98f"/><path d="m32 76 67-60 72 59-72 34Z" fill="#739d87"/><path d="m99 16 72 59-72 34Z" fill="#8cb09b"/><path d="m111 111 22-11v40l-22 11Z" fill="#967e59"/><path d="m65 93 20 10v22l-20-10Z" fill="#f1e1b4"/>',sawmill:'<path d="m35 90 50-24 70 34-49 27Z" fill="#d8bd90"/><path d="m35 90 71 37v26l-71-36Zm71 37 49-27v26l-49 27Z" fill="#bca075"/><path d="m56 67 64-30 11 19-64 31Z" fill="#b28e64"/><ellipse cx="63" cy="77" rx="13" ry="12" fill="#e4c99c"/><ellipse cx="63" cy="77" rx="6" ry="6" fill="none" stroke="#ba9468" stroke-width="2"/><path d="m99 56 28-29 17 17-30 29Z" fill="#c0c7b3"/>',observatory:'<path d="m56 133 43-23 47 24-45 25Z" fill="#c5b99b"/><path d="M70 126V67l31-17 31 17v60l-31 17Z" fill="#cbd2bc"/><path d="m70 67 31-17 31 17-31 16Z" fill="#e0e3cc"/><path d="m84 55 17-36 21 38" fill="#9db5a1"/><circle cx="101" cy="104" r="13" fill="#eee2b0"/><path d="m101 94 2 8 8 3-8 2-2 8-2-8-8-2 8-3Z" fill="#c2ab74"/>',sanctuary:'<path d="m35 129 63-31 65 31-65 31Z" fill="#c9c0a4"/><path d="m58 118 40-19 41 19-41 22Z" fill="#e5dac0"/><path d="M76 113V47l22-12 26 12v65l-26 15Z" fill="#c0ccbc"/><path d="m98 35 26 12-26 14-22-14Z" fill="#dee4cc"/><path d="m98 15 14 22-14 23-13-23Z" fill="#c7b4d9"/><path d="m98 16 1 43 13-22Z" fill="#a997bf"/>'};
  return `<svg viewBox="0 0 200 180" aria-hidden="true"><ellipse cx="100" cy="151" rx="71" ry="11" fill="#53664d" opacity=".08"/>${drawings[id]}<path d="m32 133-2-9m2 9 5-6m128 10-1-10m1 10 5-7" stroke="#8daa7d" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function renderExplore(){
  if(state.expedition)return ruinsExploreTabs()+renderJourney();
  const team=E.teamPower(state);
  return `${ruinsExploreTabs()}${pageHeading('NHỮNG VÙNG ĐẤT CHƯA KỂ','Thám hiểm','Chọn bạn đồng hành. Chọn một con đường. Mang những câu chuyện về đảo.',`<span class="power-pill">${icon('bolt',19)} Sức mạnh đội <b>${team.power}</b></span>`)}${campaignEntry(state)}${towerEntry(state)}${ruinsEntry(state)}${volcanoRewardEntry(state)}${reefRewardEntry(state)}<section class="explore-team"><div><span class="eyebrow">NHỮNG NGƯỜI BẠN ĐỒNG HÀNH</span><h3>Đi cùng nhau, đi xa hơn</h3><p>${team.synergy}</p></div><div class="explore-team-pets">${state.team.map(id=>`<button data-action="pet" data-id="${id}" aria-label="Đổi ${BY_ID[id].name}">${creature(id,{source:state})}<span>${BY_ID[id].name}</span></button>`).join('')}<button class="change-team" data-action="nav" data-page="pets">${icon('plus',21)}<span>Đổi đội</span></button></div></section><div class="explore-formation">${formationSummary(E.combatMembers(state))}</div><div class="section-line regions-heading"><div><h2>Bản đồ quần đảo</h2><p>Mỗi lần trở lại, thử thách lớn thêm và phần thưởng cũng vậy.</p></div><span class="subtle-label">${BIOMES.filter(b=>state.level>=b.unlock).length} / ${BIOMES.length} vùng đất</span></div><div class="biome-grid">${BIOMES.map(b=>{const locked=state.level<b.unlock;const busy=!!(state.ruins.run||state.boss.run||state.tower.run);const threat=Math.round(b.power*(1+Math.min(state.clears[b.id]||0,30)*0.07));const power=E.teamPower(state,b).power;const difficulty=power>=threat*1.3?'Thảnh thơi':power>=threat*0.8?'Vừa sức':'Thử thách';return `<article class="biome-card ${locked?'locked':''}"><div class="biome-picture">${biomeArt(b)}<span class="biome-status">${locked?`${icon('lock',13)} Cấp đảo ${b.unlock}`:state.clears[b.id]?`${icon('check',13)} Đã vượt ${state.clears[b.id]} lần`:`${icon('compass',13)} Chưa khám phá`}</span>${!locked?`<span class="difficulty ${difficulty==='Thử thách'?'hard':''}">${difficulty}</span>`:''}</div><div class="biome-body"><div class="section-line"><h3>${b.name}</h3>${elementBadge(b.element)}</div><p>${b.subtitle}</p><div class="biome-stats"><span>${icon('swords',15)} ${threat} sức mạnh</span><span>${icon('map',15)} ${b.stages} chặng</span></div><div class="biome-rewards">${rewards({gold:b.rewards.gold,crystals:b.rewards.crystals,...(!state.clears[b.id]?{tickets:2}:{})})}</div>${button(`AUTO · Khởi hành ${resource('food',8+b.unlock*2)}`,'auto-expedition','primary full auto-start',`data-id="${b.id}" ${locked||busy?'disabled':''}`)}${button(busy?'Đội đang khám phá':locked?`${icon('lock',16)} Mở ở cấp đảo ${b.unlock}`:`Khởi hành ${resource('food',8+b.unlock*2)} ${icon('arrow',16)}`,'start-expedition',locked||busy?'disabled-style full':'secondary full',`data-id="${b.id}" ${locked||busy?'disabled':''}`)}</div></article>`;}).join('')}</div><div class="gentle-note wide-note">${icon('shield',20)} Mỗi đòn thứ ba của đối thủ là đòn mạnh. Phòng thủ đúng lúc, tích năng lượng rồi dùng tuyệt kỹ để hồi phục và phản công.</div>`;
}
function renderJourney(){
  const ex=state.expedition;const biome=campaignBiome(ex);const b=ex.battle;const intention=b&&(volcanoWarning(ex)||reefWarning(ex)||enemyIntent(b,{id:(b.round+1)%3===0?'heavy':'strike',name:(b.round+1)%3===0?'Đòn dồn sức':'Đòn thăm dò',text:(b.round+1)%3===0?'Đòn mạnh gấp 1,8 lần. Phòng thủ hoặc Phá thế.':'Một đòn thường. Tích năng lượng và nối chiêu.',icon:'swords',danger:(b.round+1)%3===0}));if(intention&&!intention.icon)intention.icon='waves';const event=campaignEvent(ex)||volcanoEvent(ex)||reefEvent(ex)||EVENTS[ex.event];const boss=ex.stage===biome.stages-1&&(!ex.campaign||campaignStage(ex.campaign.id).boss);
  const enemies=exploreEnemies(ex);
  return `${pageHeading('MỘT CÂU CHUYỆN ĐANG VIẾT',biome.name,`Chặng ${ex.stage+1} / ${biome.stages} · ${biome.subtitle}`,button(`${icon('home',16)} Trở về đảo`,'retreat','secondary small'))}${ex.campaign?campaignRunHUD(ex):''}${journeyEntry(ex.biome)}${ex.biome==='volcano'&&!ex.campaign?volcanoRewardEntry(state):ex.biome==='reef'&&!ex.campaign?reefRewardEntry(state):''}<div class="journey-path">${Array.from({length:biome.stages},(_,i)=>`<div class="path-stop ${i<ex.stage?'passed':i===ex.stage?'current':''}"><span>${icon(i<ex.stage?'check':i===biome.stages-1?'trophy':'compass',19)}</span><small>${i===biome.stages-1?'Thủ lĩnh':`Chặng ${i+1}`}</small></div>`).join('')}</div><div class="journey-layout"><section class="journey-main"><div class="journey-health"><span>${icon('heart',18)} Sinh lực đội</span><strong>${Math.ceil(ex.hp)} / 100</strong>${progress(ex.hp,100,'health-progress')}</div>${b?`${activeBattleEntry('explore',b)}${squadQuickPanel(ex,'explore')}<div class="battle-arena" style="--arena:${biome.color}"><div class="arena-hills"></div><div class="battle-party">${squadMembersArt(ex)}</div><span class="battle-vs">VS</span><div class="battle-enemy">${enemyTeamArt(ex.squad?.enemies||enemies)}<div class="enemy-name">${enemies.length>1?`Đội địch · ${enemies.length} thú`:escape(b.enemy)}</div>${progress(b.hp,100,'enemy-progress')}<small>${b.hp} / 100</small></div><div class="battle-round">Lượt ${b.round+1} ${b.boss?'· THỦ LĨNH':''}</div></div><div class="battle-status"><span class="focus-pips">${Array.from({length:3},(_,i)=>`<i class="${i<b.focus?'charged':''}">${icon('bolt',16)}</i>`).join('')}<small>Năng lượng ${b.focus}/3</small></span><span class="attack-forecast ${intention.danger?'warning':''}" title="${intention.text}">${icon(intention.icon,16)} ${intention.name}</span></div><p class="duel-enemy-guide expedition-intent">${intention.text}</p><div class="battle-actions">${button(`${icon('swords',21)}<strong>Tấn công</strong><small>+1 năng lượng</small>`,'battle','secondary','data-id="attack"')}${button(`${icon('shield',21)}<strong>Phòng thủ</strong><small>Giảm 75% sát thương</small>`,'battle','secondary','data-id="guard"')}${button(`${icon('sparkle',21)}<strong>Tuyệt kỹ hợp lực</strong><small>2 năng lượng · đánh + hồi máu</small>`,'battle','primary',`data-id="skill" ${b.focus<2?'disabled':''}`)}</div>${battleEffects(b.tactics)}${battleSkills(ex.members,b.tactics,b.focus,'battle',true,ex.squad)}`:`<div class="event-illustration">${biomeArt(biome)}<div class="event-pet">${creature(ex.members[0].id,{source:ex.members[0]})}</div><span class="event-marker">${icon(boss?'trophy':'compass',27)}</span></div><div class="event-body"><span class="eyebrow">${boss?'CUỘC GẶP Ở CUỐI CON ĐƯỜNG':'BẠN MUỐN ĐI THEO LỐI NÀO?'}</span><h2>${boss?biome.boss:event.title}</h2><p>${boss?'Người giữ vùng đất đang chờ. Cả đội siết chặt tay nhau, sẵn sàng cho thử thách cuối cùng.':event.text}</p><div class="route-choices">${boss?button(`${icon('swords',20)} Gặp người giữ vùng đất ${icon('arrow',17)}`,'route','primary full','data-id="0"'):event.choices.map((c,i)=>`<button class="route-choice" data-action="route" data-id="${i}"><span class="route-icon">${icon(c.icon,22)}</span><div><strong>${c.text}</strong><small>${c.cost?'Dùng '+rewards(c.cost)+' · ':''}${rewards(c.reward)}${c.heal?`<span class="heal-label">${icon('heart',13)} +${c.heal}</span>`:''}</small></div>${icon('chevron',18)}</button>`).join('')}</div></div>`}</section><aside class="journey-aside"><section class="loot-card"><span class="icon-circle">${icon('chest',25)}</span><h3>Chiếc túi phiêu lưu</h3><p>Những món quà nhặt được trên đường.</p><div class="loot-resources">${Object.keys(ex.loot).length?rewards(ex.loot):'<span class="muted">Chưa có vật phẩm. Cuộc vui mới bắt đầu!</span>'}</div><small>Thắng thủ lĩnh để nhận toàn bộ phần thưởng. Trở về sớm giữ 80% đồ nhặt được.</small></section><section class="journey-notes"><h3>Những dấu chân nhỏ</h3>${ex.log.slice(0,4).map(t=>`<p>${icon('leaf',13)} ${escape(t)}</p>`).join('')}</section><div class="gentle-note">${icon('info',18)} Tiến trình được lưu sau mỗi lượt. Bạn có thể đóng game và tiếp tục sau.</div></aside></div>`;
}

function renderJournal(){
  const daily=ui.questTab==='daily';const history=ui.questTab==='history';const list=daily?E.DAILY_QUESTS:QUESTS;
  return `${pageHeading('TỪNG NGÀY MỘT CHÚT PHÉP MÀU','Nhiệm vụ & cột mốc','Nhận phần thưởng từ những điều bạn yêu thích trên đảo.',button(`${icon('gift',17)} Quà ngày mới`,'checkin','secondary small'))}${habitatEntry(state)}<div class="journal-overview"><div><span class="icon-circle">${icon('egg',24)}</span><strong>${state.stats.hatches}</strong><small>Trứng đã ấp</small></div><div><span class="icon-circle">${icon('paw',24)}</span><strong>${state.pets.length}</strong><small>Loài đã kết bạn</small></div><div><span class="icon-circle">${icon('compass',24)}</span><strong>${state.stats.expeditions}</strong><small>Chuyến đi trọn vẹn</small></div><div><span class="icon-circle">${icon('heart',24)}</span><strong>${state.stats.feeds}</strong><small>Bữa ăn yêu thương</small></div></div><div class="journal-tabs segmented"><button data-action="quest-tab" data-id="story" class="${!daily&&!history?'active':''}">Cột mốc của đảo</button><button data-action="quest-tab" data-id="daily" class="${daily?'active':''}">Mỗi ngày một chút</button><button data-action="quest-tab" data-id="history" class="${history?'active':''}">Kỷ niệm</button></div>${history?`<section class="history-list">${state.history.length?state.history.map(h=>`<div><span class="icon-circle">${icon(h.type==='hatch'?'egg':'compass',19)}</span><p>${escape(h.text)}<small>${new Date(h.time).toLocaleString('vi-VN')}</small></p></div>`).join(''):'<div class="empty-state"><h3>Cuốn nhật ký còn thơm mùi giấy mới</h3><p>Ấp quả trứng đầu tiên để viết nên câu chuyện của bạn.</p></div>'}</section>`:`${daily?'<p class="daily-reset-note">Nhiệm vụ và quà ngày mới làm mới theo ngày trên thiết bị.</p>':''}<div class="quest-list">${list.map(q=>{const current=daily?state.daily[q.metric]:E.questProgress(state,q);const claimed=(daily?state.daily.claimed:state.claimed).includes(q.id);const done=current>=q.target;return `<article class="quest-row ${claimed?'claimed':''}"><span class="quest-row-icon">${icon(claimed?'check':q.metric==='hatches'?'egg':q.metric==='feeds'?'berry':q.metric==='species'?'paw':q.metric==='builds'?'build':q.metric==='evolutions'?'sparkle':'compass',25)}</span><div class="quest-row-main"><h3>${q.title}</h3><p>${q.description||`${q.target} lần · Hoàn thành trong ngày`}</p><div class="quest-row-progress">${progress(current,q.target)}<small>${Math.min(current,q.target)} / ${q.target}</small></div></div><div class="quest-row-rewards">${rewards(q.reward)}</div>${button(claimed?`${icon('check',16)} Đã nhận`:done?'Nhận quà':'Đang thực hiện',daily?'claim-daily':'claim-quest',`small ${done&&!claimed?'primary':'secondary'}`,`data-id="${q.id}" ${!done||claimed?'disabled':''}`)}</article>`;}).join('')}</div>`}`;
}

function openModal(title,body,cls=''){
  const previous=$('#game-dialog');if(previous)previous.close();
  $('#overlay-root').innerHTML=`<dialog id="game-dialog" class="game-dialog ${cls}" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon('close',21)}</button></div><div class="modal-body">${body}</div></dialog>`;
  const dialog=$('#game-dialog');dialog.showModal();
  syncFishing();
  habitatScene.sync();
  islandLife.sync();
  islandEditor.pause();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();}});
  dialog.addEventListener('close',()=>{if(!$('#game-dialog')?.open)ui.modal=null;});
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeModal();});
}
function closeModal(){if(ui.hatch){revealHatch();return;}$('#game-dialog')?.close();$('#overlay-root').innerHTML='';ui.modal=null;syncFishing();habitatScene.sync();islandLife.sync();islandEditor.sync();}
function openPet(id){
  const p=state.pets.find(p=>p.id===id);if(!p)return;const s=BY_ID[p.species],name=speciesName(p.species,p.shiny);ui.modal={kind:'pet',id};
  const cost=E.evolveCost(p);cost.essence=Math.max(0,cost.essence-p.shards);
  openModal(name,`<div class="pet-detail-hero creature-stage ${p.shiny?'is-shiny':''}" data-creature-stage tabindex="0" role="group" aria-label="Góc ngắm ${name}. Dùng phím mũi tên hoặc kéo nhẹ để ngắm." style="--pet-tint:${ELEMENTS[s.element].pale}">${badge(s)}${p.shiny?shinyBadge():''}${creature(s.id,{source:p})}<span class="creature-view-hint">Kéo nhẹ để ngắm</span><span class="detail-stars">${p.stars?'★'.repeat(p.stars):'MỘT TÌNH BẠN MỚI BẮT ĐẦU'}</span></div><div class="pet-detail-meta">${elementBadge(s.element)}${p.shiny?`<span>${shinyBadge()}</span>`:''}<span>${RARITIES[s.rarity].name}</span><strong>${icon('bolt',16)} ${E.petPower(p,state)} sức mạnh</strong></div>${p.shiny?`<p class="shiny-story">${SHINY_VARIANTS[p.species].tag} · ${button(S.shinyOf(p,id)?'Dùng hình hài gốc':'Dùng diện mạo Shiny','shiny-appearance','secondary small',`data-id="${id}" data-enabled="${!S.shinyOf(p,id)}" ${state.expedition||state.boss.run||state.ruins.run||state.tower.run||state.dojo.run?'disabled':''}`)}</p>`:''}<p class="pet-story">${s.description}</p><div class="pet-detail-bars"><div><span>Cấp ${p.level} / 30</span><small>${p.level===30?'Tối đa':`${p.xp} / ${p.level*45} XP`}</small>${progress(p.xp,p.level*45)}</div><div><span>${icon('heart',14)} Gắn bó</span><small>${p.bond} / 100</small>${progress(p.bond,100,'bond-progress')}</div></div>${awakeningEntry(state,id)}${skillDetails(s.id,p)}${trainingPanel(state,id)}<div class="pet-skill"><span class="icon-circle">${icon(ELEMENTS[s.element].icon,21)}</span><div><strong>Nội tại trên đảo</strong><p>${s.perk} · Gắn bó tăng sức mạnh đội.</p></div></div>${petGear(state,id)}${habitatEntry(state,id)}<div class="pet-detail-actions">${button(`${icon('berry',18)} Cho ăn ${resource('food',8+p.level*2)}`,'feed','primary full',`data-id="${id}" ${p.level>=30?'disabled':''}`)}${button(`${icon('compass',17)} ${state.team.includes(id)?'Rời đội thám hiểm':'Thêm vào đội'}`,'toggle-team','secondary full',`data-id="${id}" ${state.expedition||state.ruins.run||state.boss.run||state.tower.run?'disabled':''}`)}</div><div class="evolve-section"><div><strong>${icon('sparkle',18)} Tiến hóa ${p.stars<3?'★'.repeat(p.stars+1):'tối đa'}</strong><p>${p.stars<3?`Cần cấp ${5+p.stars*5} · +38% sức mạnh gốc mỗi sao`:'Bạn nhỏ đã tỏa sáng hết mình.'}</p><small>${p.shards} mảnh linh thú · Mỗi mảnh thay 1 tinh hoa</small></div>${button(p.stars>=3?'Đã tối đa':`Tiến hóa ${rewards(cost)}`,'evolve','secondary small',`data-id="${id}" ${p.stars>=3?'disabled':''}`)}</div>`,'pet-dialog');
  ui.modal={kind:'pet',id};
}
function openGear(id=state.team[0]){if(!state.pets.some(p=>p.id===id))id=state.team[0];openModal('Trang bị cho người bạn',gearManager(state,id,activityHelpers));ui.modal={kind:'gear',id};}
function openGearDetail(id){const item=state.forge.items.find(i=>i.id===id);if(!item)return;openModal(GEAR_BY_ID[item.recipe].name,gearDetail(state,id,activityHelpers));ui.modal={kind:'gear-detail',id};}
function openRates(){
  const star=ui.egg==='star';
  openModal('Mỗi điều kỳ diệu đều minh bạch',`<p class="modal-intro">Tỷ lệ cơ bản của ${star?'Trứng Ánh Sao':'Trứng Mầm Xanh'}. Có ${GACHA_SPECIES.length} loài trong trứng; mọi linh thú cùng bậc có cơ hội như nhau. Ba loài lai đặc biệt chỉ xuất hiện qua lai tạo.</p><div class="rates-table">${Object.entries(RARITIES).map(([id,r])=>`<div><span class="rarity rarity-${id}">${id}</span><span>${r.name}</span><strong>${star?({N:0,R:60,SR:34,SSR:6}[id]):r.chance}%</strong></div>`).join('')}<div class="rates-shiny-row"><span class="shiny-badge">✦</span><span>Thưởng thêm Shiny</span><strong>${(SHINY_RATE*100).toFixed(1)}%</strong></div></div><div class="info-box">${icon('shield',21)}<p>Trong tối đa <b>10 lượt</b>, chắc chắn có SR hoặc SSR. Trong tối đa <b>50 lượt</b>, chắc chắn có SSR. Mỗi lượt ấp có thêm <b>${(SHINY_RATE*100).toFixed(1)}%</b> gặp Shiny; lượt thứ <b>${SHINY_PITY_MAX}</b> chắc chắn có một biến thể Hào Quang.</p></div><p class="muted">Có 6 Shiny đặc biệt trong sổ. Thưởng Shiny không thay thế thú thường, ưu tiên biến thể chưa có. Đã đủ sáu: Shiny trùng tặng 10 mảnh. Mỗi chuyến khám phá thắng cho 1 mảnh và 4% gặp Shiny; boss/tháp cũng cho mảnh. Đủ 30 mảnh chọn biến thể trong Sổ Hào Quang. Shiny giữ nguyên sức mạnh. Linh thú trùng tặng mảnh theo bậc và tinh hoa.</p>`);
}
function openFishingHelp(){
  const odds=E.fishingOdds(state);
  openModal('Một chiếc phao, ba nhịp nhỏ',`<p class="modal-intro">Thả câu tốn <b>4 quả mọng</b>. Trong mỗi nhịp, bấm <b>Giật cần</b> khi kim vào vùng xanh. Có thể chờ kim quay lại bao lâu cũng được. Trúng ít nhất <b>2 trong 3 nhịp</b> để bắt cá; vùng vàng cho một nhịp hoàn hảo.</p><div class="info-box">${icon('fish',23)}<p>Câu được cá nhận vàng, quả mọng và kinh nghiệm. Ba lần thành công liên tiếp tặng thêm 2 tinh hoa; ba nhịp hoàn hảo thưởng thêm 30 vàng. Loài mới tặng 10 ngọc sao.</p></div><p class="modal-intro">Tỷ lệ cá theo cần cấp ${state.fishing.rod}. Mỗi bến có bốn loài, mỗi bậc một loài. Nâng cần tăng tỷ lệ cá hiếm và mở rộng vùng xanh.</p><div class="rates-table">${Object.entries(odds).map(([r,n])=>`<div><span class="rarity rarity-${r}">${r}</span><span>${RARITIES[r].name}</span><strong>${n.toLocaleString('vi-VN')}%</strong></div>`).join('')}</div><p class="muted">Cá trong giỏ dùng hỗ trợ lai tạo hoặc đổi quả mọng và tinh hoa trong Sổ thủy sinh. Đổi cá không xóa sưu tầm. Đổi trang, mở hộp thoại hay rời ứng dụng sẽ tạm dừng kim. Thu cần kết thúc lượt và dùng hết mồi.</p>${button('Ra bến câu nào','close-modal','primary full')}`);
}
function openSettings(){
  openModal('Góc nhỏ của bạn',`<div class="settings-brand"><img src="assets/icon.svg" width="64" height="64" alt=""><div><h3>Đảo Linh Thú</h3><p>Một thế giới nhỏ, ngàn điều kỳ diệu.</p><small>Phiên bản 1.31.0 · Chơi offline</small></div></div><div class="setting-row"><div><strong>Âm thanh</strong><small>Những tiếng ngân nhỏ khi chơi</small></div><button class="toggle ${state.settings.sound?'on':''}" data-action="setting" data-id="sound" role="switch" aria-checked="${state.settings.sound}" aria-label="Âm thanh"><i></i></button></div><div class="setting-row"><div><strong>Chuyển động</strong><small>Linh thú, mây và hiệu ứng ấp trứng</small></div><button class="toggle ${state.settings.motion?'on':''}" data-action="setting" data-id="motion" role="switch" aria-checked="${state.settings.motion}" aria-label="Chuyển động"><i></i></button></div><div class="backup-section"><h3>Giữ lại những tình bạn</h3><p>Game tự lưu trên thiết bị. Xuất thêm bản lưu trước khi đổi máy hoặc gỡ ứng dụng.</p><div>${button(`${icon('download',17)} Xuất bản lưu`,'export','secondary')}${button(`${icon('upload',17)} Nhập bản lưu`,'import','secondary')}</div><input type="file" id="import-file" accept=".json,application/json" hidden></div><div class="howto-section"><h3>Nhịp sống trên đảo</h3><p>Ấp trứng để kết bạn → cho ăn để tăng cấp → chọn đội đi khám phá → dùng tài nguyên xây đảo và tiến hóa.</p><p>Đội 3 hệ khác nhau được +12% sức mạnh; 3 bạn cùng hệ được +20%. Hệ khắc chế vùng đất được +30% sức mạnh cá nhân.</p><p>Mỗi đối thủ có chiến thuật riêng: giáp phản đòn, tụ phép hoặc cuồng nộ. Đọc ý định trước mỗi lượt. Tích năng lượng để chọn chiêu riêng của từng thú, hoặc dùng 2 năng lượng tung tuyệt kỹ hợp lực. Nối chiêu giữa hai bạn khác nhau để tạo combo hệ.</p><button class="text-btn" data-action="tactics-help">Xem kỹ năng & phối đội</button></div><div class="settings-level">${icon('island',18)} Đảo cấp ${state.level} · ${state.pets.length} bạn nhỏ · ${state.stats.expeditions} chuyến đi</div>`);
  ui.modal={kind:'settings'};
}
function showHatch(result){
  ui.hatch=result;ui.modal={kind:'hatch'};
  openModal('Một điều kỳ diệu đang thức giấc…',`<div class="reveal-stage ${(result.shinyResults||[]).length?'prism-egg-reveal':''}"><div class="reveal-glow"></div><button class="egg-reveal-button" data-action="reveal-egg" aria-label="Chạm để mở trứng">${eggArt(ui.egg,'cracking')}${(result.shinyResults||[]).length?'<span class="prism-egg-star">✦</span>':''}</button><h3>Chạm nhẹ để chào bạn mới</h3><p>Bên trong là ${result.results.length===1?'một lời chào':result.results.length+' lời chào'} dành riêng cho bạn.</p>${button('Mở trứng ngay','reveal-egg','secondary small')}</div>`,'hatch-dialog');
  ui.modal={kind:'hatch'};ui.hatchTimer=setTimeout(revealHatch,state.settings.motion?1800:100);
}
function revealHatch(){
  if(!ui.hatch)return;clearTimeout(ui.hatchTimer);const result=ui.hatch;ui.hatch=null;
  const bonus=result.shinyResults||[],fresh=result.results.filter(r=>r.isNew).length;
  sound(bonus.length||result.results.some(r=>BY_ID[r.species].rarity==='SSR')?'legendary':'hatch');
  openModal(bonus.length?'Một ánh sáng hiếm có đã thức giấc!':fresh?'Chào những người bạn mới!':'Thêm một chút gắn bó',`${bonus.length?'<div class="prism-bonus-title">✦ PHẦN THƯỞNG SHINY</div>'+bonus.map(shinyRewardCard).join(''):''}<div class="hatch-results ${result.results.length===1?'single-result':''}">${result.results.map(r=>{const s=BY_ID[r.species];return `<div class="hatch-result tier-${s.rarity}" style="--pet-tint:${ELEMENTS[s.element].pale}">${badge(s)}<span class="result-tag ${r.isNew?'new':''}">${r.isNew?'BẠN MỚI':'+ '+r.shards+' MẢNH'}</span>${creature(s.id,{source:state,shiny:false})}<strong>${s.name}</strong>${elementBadge(s.element)}</div>`}).join('')}</div><p class="result-summary">${fresh?fresh+' tình bạn mới đã đến với Đảo Bình Yên.':'Những cuộc gặp lại tặng mảnh tiến hóa và tinh hoa.'}</p><div class="result-buttons">${bonus.length?button('Mở Sổ Hào Quang','shiny-open','primary'):button(icon('paw',17)+' Gặp các bạn nhỏ','nav','primary','data-page="pets"')}${button('Ở lại vườn ấp','close-modal','secondary')}</div>`,'hatch-dialog results-dialog');
  ui.modal={kind:'results'};
}
function openShinyReward(r){openModal('Một hình hài mới đã đến đảo',shinyRewardCard(r)+`<div class="result-buttons">${button('Chăm sóc bạn nhỏ','pet','primary',`data-id="${r.species}"`)}${button('Về Sổ Hào Quang','shiny-open','secondary')}</div>`,'prism-reveal-dialog');}

function showReward(result){
  if(result.campaign){openModal('Chiến dịch · '+result.campaign.label,campaignResultHTML(result),'campaign-result-dialog');return;}
  const b=BIOMES.find(b=>b.id===result.biome);
  openModal(result.success?'Một chuyến đi đầy kỷ niệm':result.retreat?'Trở về cũng là một hành trình':'Nghỉ một chút, rồi lại đi',`<div class="journey-result"><span class="result-emblem">${icon(result.success?'trophy':'heart',38)}</span><h3>${result.success?'Bạn đã làm được rồi!':'Các bạn nhỏ đã về đảo an toàn.'}</h3><p>${result.success?`Thêm một câu chuyện từ ${b.name} vào cuốn nhật ký của đảo.`:result.retreat?'Bạn giữ 80% vật phẩm đã nhặt. Hẹn gặp lại ở chuyến đi tới.':'Bạn giữ 50% vật phẩm đã nhặt. Cho các bạn ăn, tăng cấp và thử một chiến thuật mới nhé.'}</p><div class="reward-box">${Object.keys(result.reward).length?rewards(result.reward):'<span>Chuyến đi này mang về một chút kinh nghiệm.</span>'}</div>${result.shinyReward?`<p class="prism-loot-note">${fragmentLabel(result.shinyReward.fragments)}</p>${shinyRewardCard(result.shinyReward.encounter)}`:''}<div class="result-buttons">${button(`${icon('egg',17)} Đến vườn ấp`,'nav','primary','data-page="hatch"')}${button('Về đảo nhỏ','nav','secondary','data-page="island"')}</div></div>`);
}

function toast(message,type='success'){
  const item=document.createElement('div');item.className=`toast ${type}`;item.innerHTML=`${icon(type==='error'?'info':type==='info'?'leaf':'check',19)}<span>${escape(message)}</span>`;
  $('#toasts').append(item);while($('#toasts').children.length>3)$('#toasts').firstElementChild.remove();setTimeout(()=>{item.classList.add('toast-out');setTimeout(()=>item.remove(),250);},3400);
}
let audio;
function sound(type='tap'){
  if(!state.settings.sound)return;
  try{audio ||= new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const notes=type==='legendary'?[523,659,784,1047]:type==='hatch'?[440,554,659]:type==='reward'?[523,784]:type==='battle'?[180,260]:[420];notes.forEach((hz,i)=>{const oscillator=audio.createOscillator();const gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(0,audio.currentTime+i*.09);gain.gain.linearRampToValueAtTime(.045,audio.currentTime+i*.09+.015);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.09+.24);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(audio.currentTime+i*.09);oscillator.stop(audio.currentTime+i*.09+.25);});}catch{}
}
function changed(){save();render();}
function showFestivalReward(title,result){
  const hasDecoration=!!result.decoration||result.decorations?.includes('starlitlantern');
  openModal(title,`<div class="festival-reward-reveal">${hasDecoration?itemThumbnail('starlitlantern'):`<span class="result-emblem">${icon('gift',39)}</span>`}<h3>${hasDecoration?'Cổng Sao Rơi đã mở!':'Món quà đã cất vào kho'}</h3><p>${hasDecoration?'Đặt kỷ vật trong kho Báu vật để mang đêm hội về đảo.':'Sao còn lại và các kỷ vật được giữ qua mỗi mùa.'}</p><div class="reward-box">${rewards(result.reward||{})}${result.fragments?`<span class="festival-fragments">✦ ${result.fragments} mảnh Hào Quang</span>`:''}${result.stars?`<span>+${result.stars} sao lễ hội</span>`:''}</div><div class="result-buttons">${hasDecoration?button('Đặt trên đảo','seasonal-place','primary'):''}${button('Tiếp tục lễ hội','close-modal','secondary')}</div></div>`);
}
function scrollRuins(){const health=ui.page==='ruins'&&ui.ruinsTab==='journey'&&state.ruins.run&&window.innerWidth<=700?$('.ruins-team-health'):null;if(health)health.scrollIntoView({block:'start',behavior:'instant'});else window.scrollTo({top:0,behavior:'instant'});}
function openRuinsHelp(){
  openModal('Cùng khám phá Phế Tích Cổ',`<div class="ruins-help-copy"><p><strong>Chuyến rẽ nhánh · 10 điểm dừng.</strong> Chọn chuyến mới ở đầu trang để nhìn bản đồ ba hướng. Các đường nối quyết định lối đi tiếp theo; thủ vệ chờ ở điểm 5 và 10. Cứu bạn nhỏ, ghé trạm nghỉ hoặc khám phá cuộc gặp. Mỗi lựa chọn cho xem chi phí và phước lành trước khi chốt. Lời nguyền tăng sát thương địch 15% mỗi bậc, tối đa 3 bậc, và hết khi về đảo.</p><p><strong>Ba bộ phước lành mới.</strong> Hỏa triều ghép đốt mạnh với hồi theo lượt đốt; Gương thành ghép hồi khi tạo khiên với phản sát thương bị chặn; Liên tinh ghép combo tăng lực/khiên với hoàn năng lượng. Mỗi bộ có hai mảnh ghép. Tinh anh Gương Rêu bị vỡ khiên khi đỡ hoàn hảo; ngắt phép Tư Tế Sao Lạc được hoàn năng lượng và khiên. Thắng một khu mở điểm khởi hành kế tiếp như hành trình dài.</p><p><strong>50 tầng, 5 ngọn đèn.</strong> Mở ở cấp đảo 2. Mỗi chuyến dùng 12 quả mọng, một đội tối đa 3 linh thú và ít nhất 1 bình sương. Vượt hết một khu 10 tầng để mở điểm khởi hành mới.</p><div class="ruins-help-list"><div>${icon('compass',21)}<p><strong>Chọn lối đi.</strong> Đường thường cho một trận đấu; tinh anh mạnh hơn nhưng nhiều bụi cổ và được đổi bộ phép một lần; kho báu có đối thủ mang khiên; suối hồi 30% sinh lực và thêm 1 năng lượng nhưng không cho phép bổ trợ.</p></div><div>${icon('sparkle',21)}<p><strong>Ghép phép thành bộ.</strong> Thắng trận chọn một phép trong bộ phép ngẫu nhiên, cộng dồn theo bậc. Có bộ riêng cho từng hệ, đội đa dạng và cả thú N / R. Các phép kết thúc khi bạn trở về; di vật giữ sức mạnh lâu dài.</p></div><div>${icon('shield',21)}<p><strong>Đọc ý định của thủ vệ.</strong> Phòng thủ giảm 75% sát thương. Tích 2 năng lượng để dùng tuyệt kỹ, phá khiên và hồi máu. Dùng bình sương hồi 35% sinh lực, không tốn lượt. Sau lượt 9, đối thủ mạnh dần.</p></div><div>${icon('chest',21)}<p><strong>Mỗi bước chân đều được giữ.</strong> Bụi cổ, tài nguyên và mốc tầng được lưu ngay sau khi vượt tầng. Thua hoặc rút lui vẫn giữ các món đã kiếm. Nâng di vật, đổi vé ấp và nhận rương sau mỗi 5 tầng ở mục Di vật & phần thưởng.</p></div></div><p>Sức mạnh đội được chốt khi khởi hành. Có thể ghé đảo, tắt ứng dụng hoặc xuất bản lưu để tiếp tục đúng lượt đang chơi. Cả đội chỉ tham gia một chuyến phế tích hoặc quần đảo cùng lúc.</p></div>${button('Thắp ngọn đèn đầu tiên','close-modal','primary full')}`);
}
function outcome(result,onSuccess){if(result?.error){toast(result.error,'error');return false;}onSuccess?.(result);return true;}
function navigate(page){if(!['island','hatch','pets','explore','build','journal','fishing','ruins','boss','forge','dojo','awaken','habitat','tower','shiny','campaign','seasonal'].includes(page))return;if(islandEditor.active()){closeModal();islandEditor.requestExit(page);return;}habitatScene.close();if(page==='ruins')ui.ruinsTab='journey';clearTimeout(ui.hatchTimer);ui.hatch=null;closeModal();ui.page=page;ui.search='';render();window.scrollTo({top:0,behavior:'instant'});}
function collectAll(id=null){const reward=E.collect(state,Date.now(),id);if(!Object.keys(reward).length){toast('Vườn đang lớn. Mỗi phút sẽ có một đợt tài nguyên mới.','info');return;}changed();sound('reward');toast('Thu hoạch: '+Object.entries(reward).map(([k,v])=>`${fmt(v)} ${RESOURCES[k].name.toLowerCase()}`).join(', '));}
function handleFeed(id){const detail=ui.modal?.kind==='pet';const r=E.feed(state,id);if(!outcome(r))return;changed();if(detail)openPet(id);sound('reward');toast(r.leveled?`${BY_ID[id].name} lên cấp ${r.pet.level}!`:`${BY_ID[id].name} rất thích bữa ăn này. +3 gắn bó`);}

document.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');if(!target||target.disabled)return;event.preventDefault();const a=target.dataset.action;const id=target.dataset.id;
  E.refreshSeason(state);
  if(a==='seasonal-tab'){if(['journey','prizes','shop'].includes(id)){ui.seasonalTab=id;render();$('.festival-tabs')?.scrollIntoView({block:'start',behavior:'instant'});}return;}
  if(a==='seasonal-week'){const week=Number(id);if(Number.isInteger(week)&&week>=0&&week<4){ui.seasonalWeek=week;render();}return;}
  if(a==='seasonal-mission'||a==='seasonal-challenge'){const r=a==='seasonal-mission'?E.claimSeasonalMission(state,id):E.claimSeasonalChallenge(state,id);if(outcome(r)){changed();sound('reward');toast(`+${r.stars} sao lễ hội! Mốc quà đã được cập nhật.`);}return;}
  if(a==='seasonal-prize'){const r=E.claimSeasonalMilestone(state,id);if(outcome(r)){changed();sound(r.decoration?'legendary':'reward');showFestivalReward(r.milestone.title,r);}return;}
  if(a==='seasonal-shop'){const r=E.buySeasonalShop(state,id);if(outcome(r)){changed();sound('reward');if(r.decoration)showFestivalReward(r.item.title,r);else toast(`Đã đổi ${r.item.title}. Sao tích lũy vẫn được giữ.`);}return;}
  if(a==='seasonal-next'){const r=E.startNextSeason(state);if(outcome(r)){ui.seasonalWeek=null;ui.seasonalTab='journey';changed();sound('reward');showFestivalReward(`Chào mùa hội thứ ${r.cycle}`,r);window.scrollTo({top:0,behavior:'instant'});}return;}
  if(a==='seasonal-place'){if(state.seasonal.unlockedDecorations.includes('starlitlantern')){closeModal();islandLife.close();islandEditor.begin();ui.page='decorate';render();islandEditor.action('island-edit-category',{id:'treasure'});}return;}
  if(a==='seasonal-help'){openModal('Cùng thắp sáng Lễ Hội Sao Rơi',seasonalHelp()+button('Bắt đầu gom ánh sao','close-modal','primary full'));return;}
  if(a==='campaign-chapter'){if(CAMPAIGN_CHAPTERS.some(c=>c.id===id)){ui.campaignChapter=id;render();}return;}
  if(a==='campaign-brief'){const s=campaignStage(id);if(s)openModal('Ải '+s.label,campaignBrief(state,id,activityHelpers),'campaign-brief-dialog');return;}
  if(a==='campaign-map'){combatStage.close();navigate('campaign');return;}
  if(a==='campaign-next'){combatStage.close();const s=campaignStage(id);if(s){ui.campaignChapter=s.chapter;navigate('campaign');openModal('Ải '+s.label,campaignBrief(state,id,activityHelpers),'campaign-brief-dialog');}return;}
  if(a==='campaign-resume'){navigate('campaign');if(state.expedition?.campaign)combatStage.open('explore',{journey:true});return;}
  if(a==='campaign-auto'||a==='campaign-start'){const r=C.startCampaign(state,id);if(outcome(r)){closeModal();ui.page='campaign';ui.campaignChapter=campaignStage(id).chapter;changed();combatStage.open('explore',{journey:true,auto:a==='campaign-auto'});sound();}return;}
  if(a==='campaign-chest'){const r=C.claimCampaignChest(state,id,Number(target.dataset.stars));if(outcome(r)){changed();sound('reward');openModal('Rương '+r.stars+' sao',`<div class="journey-result"><span class="result-emblem">${icon('chest',38)}</span><h3>Những ngôi sao đã thành quà!</h3><div class="reward-box">${rewards(r.reward)}</div>${button('Tiếp tục chiến dịch','close-modal','primary full')}</div>`);}return;}
  if(a==='campaign-sweep'){const r=C.sweepCampaign(state,id,Number(target.dataset.count));if(outcome(r)){changed();sound('reward');openModal('Quét nhanh ×'+r.count,`<div class="journey-result"><span class="result-emblem">${icon('bolt',38)}</span><h3>Chiến lợi phẩm đã cất vào kho</h3><p>Đã dùng ${r.cost.food} quả mọng. Thưởng lần đầu và sao được giữ nguyên.</p><div class="reward-box">${rewards(r.reward)}</div>${button('Về bản đồ','campaign-map','primary full')}</div>`);}return;}
  if(a==='auto-planner'||a==='combat-reports'){autoPlanner.open(a==='combat-reports'?'reports':'plan');return;}
  if(a==='island-edit-open'){closeModal();islandLife.close();islandEditor.begin();ui.page='decorate';render();window.scrollTo({top:0,behavior:'instant'});return;}
  if(a.startsWith('island-edit-')){islandEditor.action(a,target.dataset);if(a==='island-edit-choose')closeModal();return;}
  if(a==='island-pet'){islandLife.select(id);return;}
  if(a==='island-pat'){islandLife.pat(id);return;}
  if(a==='island-feed'){islandLife.feed(id);return;}
  if(a==='island-inspect'){islandLife.inspect(id);return;}
  if(a==='island-care-close'){islandLife.close();return;}
  if(a==='island-invite'){islandLife.invite(id);return;}
  if(a==='island-invite-friend'){islandLife.invite(id,true);return;}
  if(a==='island-memory-record'){islandLife.record(id,target.dataset.moment);return;}
  if(a==='island-memory-open'){islandLife.book(id,target.dataset.moment);return;}
  if(a==='habitat-open'){openHabitat(id,target.dataset.moment);return;}
  if(a==='habitat-filter'){ui.habitatFilter=id;render();return;}
  if(a==='habitat-care'){openPet(id);return;}
  if(a==='habitat-play'){const status=H.momentStatus(state,id,target.dataset.moment);if(status.error||!status.canPlay){toast(status.error||status.reasons.join(' '),'info');return;}islandLife.close();navigate('island');const r=habitatScene.open(id,target.dataset.moment);if(r.error)toast(r.error,'info');islandLife.sync();return;}
  if(a.startsWith('habitat-scene-')){habitatScene.action(a.slice('habitat-scene-'.length));return;}
  if(a==='habitat-claim'){const r=H.claimHabitatMilestone(state,id);if(outcome(r)){changed();sound('reward');openModal(r.milestone.name,`<div class="journey-result"><span class="result-emblem">${icon('gift',38)}</span><h3>Đảo nhỏ đã có thêm ${r.milestone.target} kỷ niệm!</h3><p>Những góc chơi thân thuộc đã giúp bạn hiểu các linh thú hơn. Mang món quà này đi gặp thêm những người bạn mới nhé.</p><div class="reward-box">${rewards(r.reward)}</div><div class="result-buttons">${button(`${icon('egg',17)} Đến vườn ấp`,'nav','primary','data-page="hatch"')}${button('Tiếp tục khám phá','close-modal','secondary')}</div></div>`);}return;}
  if(a==='game-menu'){openModal('Một vòng quanh đảo',renderGameMenu(state,ui),'island-menu');ui.modal={kind:'game-menu'};return;}
  if(a==='awaken-open'){combatStage.close();if(id)ui.awakenId=id;navigate('awaken');return;}
  if(a==='awaken-select'){ui.awakenId=id;render();return;}
  if(a==='awaken-confirm'){const r=awakenPet(state,id);if(outcome(r)){state.history.unshift({type:'evolve',time:Date.now(),text:`${r.awakening.name} đã thức tỉnh!`});state.history=state.history.slice(0,40);changed();sound('legendary');openModal('Một hình hài mới đã thức giấc',awakeningReveal(id),'awakening-dialog');}return;}
  if(a==='active-battle'){combatStage.open(id,state.expedition?.campaign&&id==='explore'?{journey:true}:{});return;}
  if(a==='journey-auto'||a==='journey-open'){combatStage.open('explore',{journey:true,auto:a==='journey-auto'});return;}
  if(a==='dojo-tab'){if(['challenges','practice','rewards'].includes(id)){ui.dojoTab=id;ui.dojoReport=false;render();}return;}
  if(a==='dojo-enemy'){ui.practiceEnemy=id;render();return;}
  if(a==='dojo-path'){ui.practicePaths[id]=target.dataset.branch==='base'?null:target.dataset.branch;render();return;}
  if(a==='dojo-start'||a==='dojo-retry'){
    const last=state.dojo.lastResult,kind=target.dataset.kind,enemy=a==='dojo-retry'?id:kind==='practice'?ui.practiceEnemy:id;
    const paths=a==='dojo-retry'&&kind==='practice'?Object.fromEntries(Object.entries(last?.actors||{}).filter(([pet,m])=>state.team.includes(pet)&&(!m.training?.rank||m.training.rank===3)).map(([pet,m])=>[pet,m.training?.branch||null])):Object.fromEntries(Object.entries(ui.practicePaths).filter(([pet])=>state.team.includes(pet)));
    const r=D.startDojo(state,kind,enemy,kind==='practice'?paths:{});
    if(outcome(r)){combatStage.close();ui.page=kind==='awakening'?'awaken':'dojo';if(kind==='awakening')ui.awakenId=enemy;ui.dojoReport=false;changed();combatStage.open('dojo');sound();}return;
  }
  if(a==='dojo-stop'){if(outcome(D.stopDojo(state))){ui.dojoReport=true;changed();}return;}
  if(a==='dojo-claim'){const r=D.claimDojoMilestone(state,Number(id));if(outcome(r)){changed();sound('reward');toast(`Đã nhận mốc ${id} sao${r.cosmetic?' · '+r.name:''}!`);}return;}
  if(a==='dojo-cosmetic'){const key=target.dataset.key,value=key==='title'?(target.dataset.value==='none'?null:target.dataset.value):!state.dojo.cosmetics[key];if(outcome(D.setDojoCosmetic(state,key,value))){changed();sound();}return;}

  if(a==='nav'){if(target.dataset.page==='habitat')openHabitat(H.dailyHabitatHint(state)?.pet.id);else navigate(target.dataset.page);return;}
  if(a==='close-modal'){closeModal();return;}
  if(a==='pet'){openPet(id);return;}
  if(a==='shiny-open'){navigate('shiny');return;}
  if(a==='shiny-help'){openModal('Tìm những ánh sáng hiếm có',shinyHelp(activityHelpers));return;}
  if(a==='shiny-preview'){if(SHINY_VARIANTS[id])openModal(SHINY_VARIANTS[id].name,shinyPreview(state,id,activityHelpers),'prism-preview-dialog');return;}
  if(a==='shiny-craft'){const r=S.craftShiny(state,id);if(outcome(r)){changed();sound('legendary');openShinyReward(r);}return;}
  if(a==='shiny-appearance'){const detail=ui.modal?.kind==='pet',r=S.setShinyAppearance(state,id,target.dataset.enabled==='true');if(outcome(r)){changed();if(detail)openPet(id);sound();toast(r.enabled?'Đã dùng diện mạo Shiny.':'Đã dùng hình hài gốc.');}return;}
  if(a==='shiny-milestone'){const r=S.claimShinyMilestone(state,Number(id));if(outcome(r)){changed();sound('reward');toast(Number(id)===1?'Tượng Cáo Hào Quang đã mở trong Chỉnh đảo!':Number(id)===3?'Nền hồ sơ Tinh Vân đã mở!':'Cổng Cực Quang đã mở trong Chỉnh đảo!');}return;}
  if(a==='shiny-profile'){if(outcome(S.setShinyProfile(state,!state.shiny.profile))){changed();sound();}return;}
  if(a==='shiny-exchange'){if(outcome(S.exchangeShinyFragments(state))){changed();sound('reward');toast('Đã đổi 10 mảnh thành 2 vé ấp.');}return;}
  if(a==='forge-tab'){ui.forgeTab=id==='bag'?'bag':'craft';render();return;}
  if(a==='forge-kit'){const r=F.claimForgeKit(state);if(outcome(r)){changed();sound('reward');toast('Đã nhận 9 nhựa cổ và 6 đá rễ. Cùng chế món đầu tiên nhé!');}return;}
  if(a==='gear-craft'){const r=F.craftGear(state,id);if(outcome(r)){changed();sound('reward');openGearDetail(r.item.id);toast(`Đã chế ${GEAR_BY_ID[r.item.recipe].name}!`);}return;}
  if(a==='gear-manage'){openGear(id);return;}
  if(a==='gear-detail'){openGearDetail(id);return;}
  if(a==='gear-equip'){const r=F.equipGear(state,target.dataset.pet,id);if(outcome(r)){changed();openGear(target.dataset.pet);sound();toast('Trang bị đã sẵn sàng cho chuyến đi tiếp theo.');}return;}
  if(a==='gear-unequip'){if(outcome(F.unequipGear(state,target.dataset.pet,id))){changed();openGear(target.dataset.pet);}return;}
  if(a==='gear-upgrade'||a==='gear-fuse-confirm'){const r=F.upgradeGear(state,id,a==='gear-fuse-confirm'?target.dataset.donor:null);if(outcome(r)){changed();openGearDetail(id);sound('reward');toast(`${GEAR_BY_ID[r.item.recipe].name} đã lên cấp ${r.item.level}!`);}return;}
  if(a==='gear-fuse-preview'){const item=state.forge.items.find(i=>i.id===id);if(!item)return;openModal('Ghép bản trùng để nâng?',`<div class="gear-fuse-preview">${gearArt(item.recipe,1)}${icon('arrow',22)}${gearArt(item.recipe,item.level+1)}</div><p class="modal-intro">Một bản trùng cấp 1 chưa mang sẽ được dùng hết để nâng <b>${GEAR_BY_ID[item.recipe].name}</b> lên cấp ${item.level+1}. Chi phí: ${resource('gold',F.upgradeCost(item,true).gold)} ${materialRow({heart:F.upgradeCost(item,true).heart})}.</p><div class="result-buttons">${button('Ghép và nâng','gear-fuse-confirm','primary',`data-id="${id}" data-donor="${target.dataset.donor}"`)}${button('Giữ lại đồ','gear-detail','secondary',`data-id="${id}"`)}</div>`);return;}
  if(a==='gear-recycle-preview'){const item=state.forge.items.find(i=>i.id===id);if(!item)return;openModal('Tái chế món trang bị?',`<div class="gear-fuse-preview">${gearArt(item.recipe,item.level)}</div><p class="modal-intro">Dùng hết <b>${GEAR_BY_ID[item.recipe].name} · cấp ${item.level}</b> để nhận ${materialRow({sap:item.level*2,ore:item.level})}. Món đồ sẽ rời túi.</p><div class="result-buttons">${button('Tái chế','gear-recycle-confirm','primary',`data-id="${id}"`)}${button('Giữ lại món đồ','gear-detail','secondary',`data-id="${id}"`)}</div>`);return;}
  if(a==='gear-set-hunt'){if(['frost','phoenix'].includes(id)){ui.bossId=id;ui.bossTier=Math.max(1,Math.min(5,bossProgress(state,id).best+1));closeModal();navigate('boss');}return;}
  if(a==='gear-recycle-confirm'){const r=F.recycleGear(state,id);if(outcome(r)){closeModal();ui.forgeTab='bag';ui.page='forge';changed();toast('Đã cất nguyên liệu tái chế vào xưởng.');}return;}
  if(a==='boss-select'){if(Object.hasOwn(BOSSES,id)&&!state.boss.run){ui.bossId=id;ui.bossTier=Math.max(1,Math.min(5,bossProgress(state,id).best+1,state.level-bossRequiredLevel(id)+1));render();}return;}
  if(a==='boss-tier'){const tier=Number(id);if(Number.isInteger(tier)&&tier>=1&&tier<=5){ui.bossTier=tier;render();}return;}
  if(a==='boss-start'){const r=B.startBoss(state,Number(id),Math.random,Date.now(),ui.bossId);if(outcome(r)){ui.page='boss';changed();window.scrollTo({top:0,behavior:'instant'});sound();}return;}
  if(a==='boss-battle'){
    const members=state.boss.run?.members||[],r=B.bossBattleTurn(state,id==='core'?{move:'attack',target:'core'}:id);if(!outcome(r))return;
    changed();sound(r.finished?'reward':'battle');if(r.result?.awakeningMaterials&&Object.keys(r.result.awakeningMaterials).length)toast(awakeningRewardText(r.result.awakeningMaterials));
    if(r.finished){window.scrollTo({top:0,behavior:'instant'});toast(r.result.status==='victory'?'Đã vượt qua thủ vệ! Trang bị và nguyên liệu đã cất vào kho.':'Cả đội đã về an toàn. Thử đổi chiến thuật và trở lại nhé.');}
    playCombatFx(r,id,'boss',members);return;
  }
  if(a==='boss-retreat'){openModal('Rời trận thủ vệ một lúc?',`<p class="modal-intro">Hành trang đã dùng. Rút lui sẽ kết thúc trận và không nhận phần thưởng; thú cùng trang bị vẫn về đảo an toàn.</p><div class="result-buttons">${button('Rút lui cùng cả đội','boss-confirm-retreat','primary')}${button('Mình chiến đấu tiếp','close-modal','secondary')}</div>`);return;}
  if(a==='boss-confirm-retreat'){const r=B.retreatBoss(state);if(outcome(r)){closeModal();changed();window.scrollTo({top:0,behavior:'instant'});}return;}
  if(a==='settings'){openSettings();return;}
  if(a==='skill-branch'||a==='skill-rank'){const scroll=document.querySelector('.pet-dialog')?.scrollTop||0;const r=a==='skill-rank'?upgradeSkillRank(state,id):chooseSkillBranch(state,id,target.dataset.branch==='base'?null:target.dataset.branch);if(outcome(r)){changed();openPet(id);document.querySelector('.pet-dialog').scrollTop=scroll;sound('reward');toast(a==='skill-rank'?`Kỹ năng lên bậc ${r.pet.training.rank}!`:'Đã đổi cách ra chiêu. Cùng thử đội hình mới nhé!');}return;}
  if(a==='tactics-help'){openModal('Chiến đấu cùng nhau',tacticsHelp());return;}
  if(a==='combat-row'){const r=E.setCombatRow(state,id,target.dataset.row);if(outcome(r)){changed();sound();}return;}
  if(a==='team-picker'){if(!state.expedition&&!state.ruins.run&&!state.boss.run&&!state.tower.run)openModal('Chọn bạn đồng hành',teamPicker(state,Number(id)));return;}
  if(a==='team-pick'){const r=E.setTeamSlot(state,Number(target.dataset.slot),id);if(outcome(r)){closeModal();changed();sound();toast('Đã đổi bạn đồng hành. Cùng thử cách phối hợp mới nhé!');}return;}
  if(a==='tower-tab'){if(['climb','rewards'].includes(id)){ui.towerTab=id;render();}return;}
  if(a==='tower-start'){const r=T.startTower(state);if(outcome(r)){ui.page='tower';ui.towerTab='climb';changed();window.scrollTo({top:0,behavior:'instant'});sound();}return;}
  if(a==='tower-path'||a==='tower-blessing'){const r=a==='tower-path'?T.chooseTowerPath(state,id):T.chooseTowerBlessing(state,id);if(outcome(r)){changed();document.querySelector('#tower-decision')?.scrollIntoView({block:'start',behavior:'instant'});sound(r.battle?'tap':'reward');}return;}
  if(a==='tower-fight'){combatStage.open('tower',{auto:target.dataset.auto==='1'});return;}
  if(a==='tower-potion'){const r=T.useTowerPotion(state);if(outcome(r)){changed();sound('reward');toast(`Bình sương hồi ${r.heal} sinh lực.`);}return;}
  if(a==='tower-retreat'){const run=state.tower.run;if(run)openModal('Trở về từ Tháp Vô Tận?',`<p class="modal-intro">Đội đã vượt <b>${run.cleared} tầng</b> và giữ <b>${run.dustEarned} bụi tháp</b>. Mọi tài nguyên đã cất vào kho. Phước lành và lời nguyền kết thúc khi rời tháp.</p><div class="result-buttons">${button('Rời tháp cùng cả đội','tower-confirm-retreat','primary')}${button('Tiếp tục leo','close-modal','secondary')}</div>`);return;}
  if(a==='tower-confirm-retreat'){if(outcome(T.retreatTower(state))){closeModal();changed();window.scrollTo({top:0,behavior:'instant'});}return;}
  if(a==='tower-milestone'||a==='tower-weekly'){const r=a==='tower-weekly'?T.claimTowerWeekly(state,Number(id)):T.claimTowerMilestone(state,Number(id));if(outcome(r)){changed();sound('reward');toast(a==='tower-weekly'?'Đã nhận rương tuần!':Number(id)===30?'Đã nhận Tượng Tháp Sao và mở trang sức Tinh Quan!':Number(id)===10?'Đèn Thiên Tinh đã mở trong kho trang trí đảo!':'Đã nhận phần thưởng mốc tháp!');}return;}
  if(a==='tower-exchange'){const r=T.exchangeTowerDust(state,id);if(outcome(r)){changed();sound('reward');toast('Đã đổi bụi tháp thành vật phẩm.');}return;}
  if(a==='tower-aura'){if(outcome(T.setTowerAura(state,!state.tower.aura))){changed();sound();}return;}
  if(a==='tower-help'){openModal('Cùng leo Tháp Vô Tận',`<div class="ruins-help-copy"><p><strong>30 tầng, 6 thủ vệ.</strong> Mở ở cấp đảo 2, tốn 10 quả mọng mỗi chuyến. Dùng đội thú bạn đã sưu tầm; mỗi thú có máu, hàng đứng và kỹ năng riêng. Sức mạnh chốt khi bắt đầu.</p><p><strong>Chọn con đường và xây bộ phép.</strong> Trận thường, tinh anh, suối nghỉ, kho báu hoặc điện phước lành. Tinh anh tăng một bậc lời nguyền (+8% sát thương địch, tối đa 3) đổi lấy nhiều bụi. Phước lành cộng dồn, chỉ có hiệu lực trong chuyến.</p><p><strong>AUTO trong trận.</strong> Tự chọn mục tiêu, dùng chiêu riêng, hồi phục, phòng thủ và hợp lực. AUTO dừng sau trận để bạn chọn phước lành và lối đi. Có 2 bình sương cho mỗi chuyến.</p><p><strong>Thưởng được cất ngay.</strong> Thua hoặc rời tháp vẫn giữ bụi, tài nguyên và kỷ lục. Đổi bụi lấy vé và tinh hoa. Nhận rương mốc 10/30 để mở đồ trang trí và trang sức Tinh Quan.</p><p><strong>Thử thách tuần.</strong> 00:00 thứ Hai giờ Việt Nam: hiệu ứng tháp và rương tuần đổi mới. Giữ mọi sưu tầm, kỷ lục và đồ đã mở. Chuyến đang leo được tiếp tục theo tuần cũ, không cộng vào kỷ lục tuần mới.</p></div>${button('Bước vào tháp','close-modal','primary full')}`);return;}
  if(a==='ruins-help'){openRuinsHelp();return;}
  if(a==='ruins-tab'){if(['journey','relics'].includes(id)){ui.ruinsTab=id;render();scrollRuins();}return;}
  if(a==='ruins-chapter'){ui.ruinsChapter=Number(id);render();return;}
  if(a==='ruins-start'){const r=R.startRuins(state,Number(id));if(outcome(r)){ui.page='ruins';ui.ruinsTab='journey';changed();scrollRuins();sound();toast('Ngọn đèn đầu tiên đã sáng. Cùng đi nhé!');}return;}
  if(a==='ruins-journey'){const r=R.startRuinsJourney(state,Number(id));if(outcome(r)){ui.page='ruins';ui.ruinsTab='journey';changed();scrollRuins();sound();toast('Bản đồ đã mở. Chọn dấu chân đầu tiên của cả đội nhé!');}return;}
  if(a==='ruins-event'){const r=R.chooseRuinsEvent(state,id);if(outcome(r)){changed();scrollRuins();sound('reward');toast(r.blessing?`Nhận ${r.blessing.name}. Cuộc gặp đã được ghi lại.`:'Đã tiếp sức và ghi lại lựa chọn. Cùng đi tiếp nhé!');}return;}
  if(a==='ruins-path'){const r=R.chooseRuinsPath(state,id);if(outcome(r)){changed();scrollRuins();sound(r.spring?'reward':'tap');if(r.spring)toast(`Nghỉ bên suối · hồi ${r.heal} sinh lực.`);}return;}
  if(a==='ruins-blessing'){const r=R.chooseRuinsBlessing(state,id);if(outcome(r)){changed();scrollRuins();sound('reward');toast(`Đã đánh thức ${r.blessing.name}.`);}return;}
  if(a==='ruins-reroll'){if(outcome(R.rerollRuinsBlessings(state))){changed();sound();toast('Đã đổi bộ lựa chọn. Chọn lời chúc phù hợp với đội nhé.');}return;}
  if(a==='ruins-potion'){const r=R.useRuinsPotion(state);if(outcome(r)){changed();sound('reward');toast(`Bình sương hồi ${r.heal} sinh lực.`);}return;}
  if(a==='ruins-battle'){
    const members=state.ruins.run?.members||[],r=R.ruinsBattleTurn(state,id);if(!outcome(r))return;
    changed();sound(r.finished||r.won?'reward':'battle');if(r.awakeningMaterials&&Object.keys(r.awakeningMaterials).length)toast(awakeningRewardText(r.awakeningMaterials));
    if(r.finished){scrollRuins();toast(r.result.status==='victory'?'Bạn đã đánh thức trái tim của phế tích!':'Cả đội đã về an toàn. Bụi cổ và mốc đã vượt vẫn được giữ.');}
    else if(r.won){scrollRuins();toast(`${r.combo?`${r.combo}! `:''}Vượt tầng thành công! +${r.dust} bụi cổ. Chọn phép bổ trợ cho chặng tiếp theo nhé.`);}
    playCombatFx(r,id,'ruins',members);return;
  }
  if(a==='ruins-retreat'){const run=state.ruins.run;if(run)openModal('Mang những câu chuyện về đảo?',`<p class="modal-intro">Bạn đã vượt <b>${run.cleared} tầng</b> và kiếm ${ruinsDust(run.dustEarned)} trong chuyến đi này. Bụi cổ, tài nguyên và mốc đã vượt đều đã được cất giữ. Các phép bổ trợ sẽ kết thúc khi trở về.</p><div class="result-buttons">${button('Trở về cùng cả đội','ruins-confirm-retreat','primary')}${button('Mình đi tiếp nhé','close-modal','secondary')}</div>`);return;}
  if(a==='ruins-confirm-retreat'){const r=R.retreatRuins(state);if(outcome(r)){closeModal();changed();scrollRuins();sound('reward');}return;}
  if(a==='ruins-upgrade'){const r=R.upgradeRuinsRelic(state,id);if(outcome(r)){changed();sound('reward');toast(`${r.relic.name} lên bậc ${r.level}. Sẵn sàng cho chuyến đi xa hơn!`);}return;}
  if(a==='ruins-exchange'){const r=R.exchangeRuinsDust(state,id);if(outcome(r)){changed();sound('reward');toast('Đã đổi quà từ phế tích.');}return;}
  if(a==='ruins-milestone'){const r=R.claimRuinsMilestone(state,Number(id));if(outcome(r)){changed();sound(r.title?'legendary':'reward');openModal(r.title?'Một lời hứa đã thức giấc':'Quà từ phế tích',`<div class="checkin-reward"><span class="result-emblem">${icon(r.title?'trophy':'chest',39)}</span><h3>${r.title||`Vượt tầng ${id}!`}</h3><p>Những dấu chân nhỏ đã mang về một món quà.</p><div class="reward-box">${rewards(r.reward)}</div>${button('Cất vào kho báu','close-modal','primary full')}</div>`);}return;}
  if(a==='ruins-blessing-info'){const b=RUINS_BLESSING_BY_ID[id];const level=state.ruins.run?.blessings[id];if(b&&level)openModal(b.name,`<div class="ruins-relic-intro"><span class="ruins-medallion">${icon(b.icon,28)}</span><div><span class="eyebrow">${b.tag} · BẬC ${level} / ${b.max}</span><p>${b.text}</p></div></div><p class="modal-intro">Phép đang đồng hành cùng đội trong chuyến đi này. Hiệu lực kết thúc khi trở về đảo.</p>${button('Tiếp tục khám phá','close-modal','primary full')}`);return;}
  if(a==='feed'){handleFeed(id);return;}
  if(a==='book'){ui.book=true;navigate('pets');return;}
  if(a==='egg-type'){ui.egg=id;render();return;}
  if(a==='go-breeding'){ui.egg='breed';navigate('hatch');return;}
  if(a==='start-breed'){const r=E.startBreeding(state,...ui.breedParents,ui.breedFish||null);if(outcome(r)){ui.breedFish='';changed();sound('hatch');toast('Tổ trứng đã ấm lên. Đảo sẽ chăm trứng khi bạn nghỉ.');}return;}
  if(a==='claim-breed'){const r=E.claimBreeding(state);if(outcome(r)){changed();showHatch(r);}return;}
  if(a==='fish-tab'){ui.fishTab=id;render();return;}
  if(a==='fish-spot'){if(!state.fishing.session&&FISH_SPOTS.some(p=>p.id===id&&state.fishing.level>=p.level)){ui.fishSpot=id;ui.fishResult=null;render();}return;}
  if(a==='fish-cast'){const r=E.castLine(state,ui.fishSpot);if(outcome(r)){ui.fishResult=null;ui.lastFishHit=null;changed();sound();}return;}
  if(a==='fish-hit'){const r=E.reelFish(state);if(outcome(r)){ui.lastFishHit=r.hit;if(r.finished)ui.fishResult=r;changed();sound(r.success?'reward':r.hit?'hatch':'tap');}return;}
  if(a==='fish-cancel'){if(outcome(E.cancelFishing(state))){ui.fishResult=null;changed();toast('Đã thu cần. Mồi câu đã dùng hết.','info');}return;}
  if(a==='upgrade-rod'){const r=E.upgradeRod(state);if(outcome(r)){changed();sound('reward');toast(`Cần câu lên cấp ${r.level}! Vùng trúng rộng hơn, cá hiếm gần hơn.`);}return;}
  if(a==='cook-fish'){const r=E.cookFish(state,id);if(outcome(r)){changed();sound('reward');toast('Đã đổi cá: '+Object.entries(r.reward).map(([k,n])=>`${n} ${RESOURCES[k].name.toLowerCase()}`).join(', '));}return;}
  if(a==='fish-milestone'){const r=E.claimFishMilestone(state,Number(id));if(outcome(r)){changed();sound('reward');toast('Đã nhận quà sưu tầm thủy sinh!');}return;}
  if(a==='fishing-help'){openFishingHelp();return;}
  if(a==='rates'){openRates();return;}
  if(a==='hatch'){if(ui.hatch)return;const r=E.hatch(state,Number(target.dataset.count),ui.egg);if(outcome(r)){changed();sound();showHatch(r);}return;}
  if(a==='reveal-egg'){revealHatch();return;}
  if(a==='filter'){ui.filter=id;render();return;}
  if(a==='rarity-filter'){ui.rarity=id;render();return;}
  if(a==='collection-mode'){ui.book=id==='book';render();return;}
  if(a==='species'){const s=BY_ID[id];openModal('Một tình bạn đang chờ',`<div class="unowned-preview creature-stage" data-creature-stage tabindex="0" role="group" aria-label="Góc ngắm ${s.name}. Dùng phím mũi tên hoặc kéo nhẹ để ngắm.">${creature(id)}${badge(s)}${elementBadge(s.element)}<span class="creature-view-hint">Kéo nhẹ để ngắm</span></div><h3>${s.name}</h3><p>${s.description}</p>${skillDetails(id)}<p class="muted">${s.source==='breeding'?'Người bạn này chỉ xuất hiện qua lai tạo. Ghép hai hệ trong bảng công thức và thêm cá để tăng cơ hội nhé.':`Bạn có thể gặp linh thú này trong vườn ấp trứng, ở bậc ${s.rarity}.`}</p>${s.source==='breeding'?button('Ghé vườn lai tạo','go-breeding','primary full'):button('Đến vườn ấp','nav','primary full','data-page="hatch"')}`);return;}
  if(a==='toggle-team'){if(outcome(E.toggleTeam(state,id))){changed();openPet(id);toast('Đã cập nhật đội thám hiểm.');}return;}
  if(a==='evolve'){const r=E.evolve(state,id);if(outcome(r)){changed();openPet(id);sound('legendary');toast(`${BY_ID[id].name} đã tiến hóa ${'★'.repeat(r.pet.stars)}!`);}return;}
  if(a==='collect'){collectAll();return;}
  if(a==='collect-one'){collectAll(id);return;}
  if(a==='building'){navigate('build');return;}
  if(a==='upgrade'){const isNew=!state.buildings[id];const r=E.upgradeBuilding(state,id);if(outcome(r)){changed();sound('reward');toast(isNew?`${r.building.name} đã hoạt động! Vào Chỉnh đảo → Kho đồ để đặt lên đảo.`:`${r.building.name} đã lên cấp ${r.level}!`);}return;}
  if(a==='quest-go'){const q=QUESTS.find(q=>q.id===id);if(q.metric==='breeds'){ui.egg='breed';navigate('hatch');}else navigate(['catches','fishSpecies'].includes(q.metric)?'fishing':q.metric==='hatches'?'hatch':q.metric==='feeds'||q.metric==='evolutions'||q.metric==='species'?'pets':q.metric==='builds'?'build':'explore');return;}
  if(a==='claim-quest'||a==='claim-daily'){const r=a==='claim-quest'?E.claimQuest(state,id):E.claimDaily(state,id);if(outcome(r)){changed();sound('reward');toast('Đã nhận quà. Một chút phép màu cho hòn đảo!');}return;}
  if(a==='quest-tab'){ui.questTab=id;render();return;}
  if(a==='checkin'){const r=E.checkIn(state);if(!outcome(r))return;changed();sound('reward');openModal(`Ngày thứ ${r.day} · Rất vui được gặp bạn`, `<div class="checkin-reward"><span class="result-emblem">${icon('gift',39)}</span><h3>Hòn đảo nhớ bạn đấy.</h3><p>Một món quà nhỏ để bắt đầu ngày mới.</p><div class="reward-box">${rewards(r.reward)}</div><div class="checkin-days">${Array.from({length:7},(_,i)=>`<span class="${i<r.day?'checked':''}">${i<r.day?icon('check',15):i===6?icon('gift',15):i+1}<small>Ngày ${i+1}</small></span>`).join('')}</div>${button('Bắt đầu một ngày đẹp','close-modal','primary full')}</div>`);return;}
  if(a==='start-expedition'||a==='auto-expedition'){const r=E.startExpedition(state,id);if(outcome(r)){changed();sound();if(a==='auto-expedition')combatStage.open('explore',{journey:true,auto:true});}return;}
  if(a==='route'){const r=E.chooseRoute(state,Number(id));if(outcome(r)){changed();sound();}return;}
  if(a==='battle'){
    const members=state.expedition?.members||[],r=E.battleTurn(state,id);if(!outcome(r))return;
    changed();sound(r.finished?'reward':'battle');if(r.result?.awakeningMaterials&&Object.keys(r.result.awakeningMaterials).length)toast(awakeningRewardText(r.result.awakeningMaterials));
    if(r.finished)showReward(r);
    else toast(`${r.combo?`${r.combo}! `:''}${r.won?'Đã vượt qua thử thách. Tiếp tục hành trình nào!':`Gây ${r.damage} sát thương${r.heal?` · hồi ${r.heal} sinh lực`:''}${r.incoming?` · nhận ${r.incoming} sát thương`:''}`}`,r.won?'success':'info');
    playCombatFx(r,id,'explore',members);return;
  }
  if(a==='retreat'){openModal('Trở về đảo nhỏ?',`<p class="modal-intro">Bạn sẽ giữ 80% đồ nhặt được trên đường. Các bạn nhỏ luôn có thể quay lại trong một chuyến đi mới.</p><div class="result-buttons">${button('Trở về an toàn','confirm-retreat','primary')}${button('Tiếp tục chuyến đi','close-modal','secondary')}</div>`);return;}
  if(a==='confirm-retreat'){const r=E.finishExpedition(state,false,Math.random,Date.now(),true);if(outcome(r)){changed();showReward(r);}return;}
  if(a==='firefly'){if(Date.now()<ui.fireflyUntil)return;E.catchFirefly(state);ui.fireflyUntil=Date.now()+18000;changed();sound('reward');toast('Bắt được đom đóm! +3 quả mọng, +5 vàng.');return;}
  if(a==='setting'){state.settings[id]=!state.settings[id];save();document.body.classList.toggle('reduced-motion',!state.settings.motion);openSettings();if(state.settings.sound)sound();return;}
  if(a==='resource-info'){const text={gold:'Dùng để xây công trình và tiến hóa. Kiếm từ nhà cây, thám hiểm và nhiệm vụ.',food:'Dùng cho linh thú ăn và chuẩn bị chuyến đi. Thu hoạch ở vườn quả hoặc bắt đom đóm trên đảo.',wood:'Dùng để xây và nâng công trình. Kiếm từ thám hiểm và xưởng gỗ.',crystals:'Dùng để ấp trứng khi bạn muốn. Kiếm từ thám hiểm, nhiệm vụ và đài ngắm sao.',tickets:'Mỗi vé ấp một Trứng Mầm Xanh. Kiếm vé từ nhiệm vụ, lên cấp đảo, quà ngày mới và thám hiểm.',essence:'Dùng để tiến hóa linh thú. Kiếm từ thú trùng, thủ lĩnh vùng đất và đền cộng hưởng.'};openModal(RESOURCES[id].name,`<div class="resource-explain">${icon(RESOURCES[id].icon,44)}<strong>${fmt(state.resources[id])}</strong></div><p class="modal-intro">${text[id]}</p>${button('Đã hiểu rồi','close-modal','primary full')}`);return;}
  if(a==='export'){const raw=E.serialize(state);if(window.AndroidApp?.saveBackup){window.AndroidApp.saveBackup(raw);return;}const blob=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`dao-linh-thu-${E.dayKey()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản lưu. Hãy giữ tệp ở nơi dễ tìm nhé.');return;}
  if(a==='import'){$('#import-file')?.click();return;}
  if(a==='confirm-import'){if(!ui.importState)return;habitatScene.close();islandEditor.end();state=ui.importState;ui.importState=null;ui.breedParents=null;ui.breedFish='';ui.fishResult=null;ui.fishSpot=state.fishing.session?.spot||'pond';closeModal();ui.ruinsTab='journey';ui.ruinsChapter=null;ui.practicePaths={};ui.dojoReport=false;ui.awakenId=state.dojo.run?.kind==='awakening'?state.dojo.run.id:ui.awakenId;ui.page=state.tower.run?'tower':state.dojo.run?state.dojo.run.kind==='awakening'?'awaken':'dojo':state.boss.run?'boss':state.ruins.run?'ruins':state.expedition?state.expedition.campaign?'campaign':'explore':'island';changed();toast('Đã khôi phục hòn đảo và những người bạn!');return;}
});
document.addEventListener('input',event=>{if(event.target.id==='pet-search'){ui.search=event.target.value;$('#pet-grid').innerHTML=renderPetGrid();}});
document.addEventListener('change',async event=>{
  if(event.target.id==='habitat-pet'){ui.habitatPet=event.target.value;ui.habitatFocus=null;render();return;}
  if(event.target.id==='gear-pet'){openGear(event.target.value);return;}
  if(event.target.id==='breed-parent-a'||event.target.id==='breed-parent-b'){ui.breedParents[event.target.id.endsWith('-a')?0:1]=event.target.value;render();return;}
  if(event.target.id==='creature-sort'){ui.sort=event.target.value;render();return;}
  if(event.target.id==='breed-fish'){ui.breedFish=event.target.value;render();return;}
  if(event.target.id!=='import-file')return;const file=event.target.files?.[0];if(!file)return;
  if(file.size>2*1024*1024){toast('Bản lưu quá lớn. Giới hạn 2 MB.','error');return;}
  try{const imported=E.validateSave(await file.text());ui.importState=imported;openModal('Khôi phục hòn đảo này?',`<p class="modal-intro">Bản lưu có <b>${imported.pets.length} linh thú</b>, đảo cấp <b>${imported.level}</b> và <b>${imported.stats.expeditions} chuyến thám hiểm</b>.</p><div class="info-box">${icon('info',21)}<p>Khôi phục sẽ thay tiến trình hiện tại trên thiết bị. Bạn có thể xuất bản lưu hiện tại trước khi nhập.</p></div><div class="result-buttons">${button('Khôi phục bản lưu','confirm-import','primary')}${button('Giữ đảo hiện tại','close-modal','secondary')}</div>`);}catch(err){toast('Không thể đọc bản lưu: '+err.message,'error');}
});
function tick(){
  const now=Date.now();const ready=E.pendingProduction(state,now);const label=$('[data-production-label]');if(label)label.textContent=Object.keys(ready).length?Object.entries(ready).map(([k,n])=>`${fmt(n)} ${RESOURCES[k].name.toLowerCase()}`).join(' · '):'Vườn quả đang tích lũy tài nguyên…';
  const season=E.refreshSeason(state,now),seasonStamp=`${season.id}:${E.seasonDay(state,now)}:${season.closed}`;
  const countdown=$('[data-festival-countdown]');if(countdown)countdown.textContent=festivalCountdown(E.seasonRemaining(state,now));
  if(ui.seasonStamp!==seasonStamp){const previous=ui.seasonStamp;ui.seasonStamp=seasonStamp;if(previous){save();if(ui.page==='seasonal'&&!$('#game-dialog')?.open)render();}}
  $('[data-collect-button]')?.classList.toggle('has-harvest',Object.keys(ready).length>0);
  $('[data-garden-ready]')?.classList.toggle('visible',!!E.pendingProduction(state,now,'garden').food);
  $('.firefly')?.classList.toggle('firefly-hidden',now<ui.fireflyUntil);
  const egg=state.breeding.egg;
  if(egg){
    const countdown=$('[data-breed-countdown]');if(countdown)countdown.textContent=remainingTime(egg.readyAt,now);
    const claim=$('[data-breed-claim]');if(claim)claim.disabled=now<egg.readyAt;
    const bar=$('.breed-timer-bar .progress>span');if(bar)bar.style.width=`${Math.min(100,Math.max(0,(now-egg.started)/(egg.readyAt-egg.started)*100))}%`;
    const home=$('[data-breed-home-label]');if(home)home.textContent=now>=egg.readyAt?'Đã ấp xong':remainingTime(egg.readyAt,now);
    $('.breeding-entry')?.setAttribute('data-ready',String(now>=egg.readyAt));
    $('.breeding-incubator')?.classList.toggle('egg-ready',now>=egg.readyAt);
  }
  const today=E.dayKey(now);const hint=$('.lobby-habitat-hint');if(hint&&hint.dataset.habitatDay!==today)hint.outerHTML=renderHabitatLobbyHint(state);if(ui.page==='habitat'&&!ui.modal&&$('.habitat-daily')?.dataset.habitatDay!==today)render();if(state.daily.date!==today){E.refreshDaily(state,now);save();if(!ui.modal)render();}
}
function syncFishing(){
  cancelAnimationFrame(fishingFrame);
  const playing=ui.page==='fishing'&&ui.fishTab==='play'&&!document.hidden&&!$('#game-dialog')?.open;
  const changed=playing?E.resumeFishing(state):E.pauseFishing(state);
  if(changed)save();
  if(!playing||!state.fishing.session)return;
  const paint=()=>{
    const cursor=$('[data-fishing-cursor]');const meter=E.fishingMeter(state);
    if(!cursor||!meter||state.fishing.session.pausedAt!==null||document.hidden)return;
    cursor.style.left=`${meter.position*100}%`;
    const reel=$('[data-action="fish-hit"]');if(reel)reel.disabled=!meter.ready;
    fishingFrame=requestAnimationFrame(paint);
  };
  paint();
}
window.spiritBack=()=>{if(autoPlanner.back())return true;if(combatStage.back())return true;if($('#game-dialog')?.open){closeModal();return true;}if(habitatScene.back())return true;if(islandEditor.active()){islandEditor.back();return true;}if(islandLife.back())return true;if(ui.page!=='island'){navigate('island');return true;}return false;};
window.addEventListener('spirit-tactics-change',save);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#game-dialog')?.open&&islandEditor.active()){event.preventDefault();islandEditor.back();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){syncFishing();habitatScene.pause();islandLife.pause();islandEditor.pause();save();audio?.suspend();}else{E.refreshDaily(state);render();}});
window.addEventListener('pagehide',()=>{E.pauseFishing(state);habitatScene.pause();islandLife.pause();islandEditor.pause();save();});
window.addEventListener('spirit-resume',()=>{E.refreshDaily(state);render();});
window.addEventListener('error',event=>console.error('Spirit Isles:',event.message));
render();
setInterval(tick,1000);setInterval(save,15000);
if(loadWarning)toast('Bản lưu chính gặp lỗi. Đã dùng bản dự phòng nếu có.','info');
const away=Date.now()-state.lastSeen;
if(away>300000){const pending=E.pendingProduction(state);if(Object.keys(pending).length)setTimeout(()=>{openModal('Hòn đảo vẫn đang lớn lên',`<div class="offline-welcome">${icon('leaf',45)}<h3>Chào mừng bạn trở về.</h3><p>Trong lúc bạn nghỉ, các công trình đã chuẩn bị những món quà này. Tích lũy tối đa 8 giờ.</p><div class="reward-box">${rewards(pending)}</div>${button('Thu hoạch và về đảo','offline-collect','primary full')}</div>`);},450);}
document.addEventListener('click',event=>{if(event.target.closest('[data-action="offline-collect"]')){closeModal();collectAll();}});
save();
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.AndroidApp)navigator.serviceWorker.register('sw.js').catch(()=>{});
