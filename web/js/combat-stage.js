import {fragmentLabel,shinyRewardCard} from './shiny-ui.js';
import {campaignBiome} from './campaign-data.js';
import {campaignResultHTML} from './campaign-ui.js';
import {towerEncounter,towerIntent,towerMaxHp,towerEnemies,towerOmen} from './tower-data.js';
import { awakeningRewardText } from './awakening-data.js';
import { BY_ID,BIOMES,ELEMENTS,RESOURCES } from './data.js';
import { creature,icon } from './art.js';
import {landscapeArt} from './world-art.js';
import { bossArt } from './boss-art.js';
import { bossMechanicCaption } from './boss-engine.js';
import { ENEMY_TACTICS, enemyIntent, enemyCaption } from './enemy-tactics.js';
import { BOSSES,bossId,bossEnemy,bossIntent } from './boss-state.js';
import { ruinsEncounter,ruinsIntent,ruinsMaxHp } from './ruins-data.js';
import { petSkill,skillBlocked,comboFor,skillDescription,setCaption,skillActor } from './tactics.js';
import { COMBAT_ROLES } from './tactics-data.js';
import { rhythmPosition,rhythmGrade,newRhythm } from './combat-rhythm.js';
import { STANCES,newStrategy,offensiveMove,orderCaption } from './combat-orders.js';
import { selectedPath } from './skill-paths.js';
import { GEAR_SETS } from './forge-state.js';
import { previewOrder } from './combat-preview.js';
import { dojoDefinition } from './dojo-data.js';
import { dojoGoals, dojoReport } from './dojo-ui.js';
import { dojoIntent } from './dojo-engine.js';
import { exploreEnemies,ruinsEnemies,castActors,castCaption } from './combat-team.js';
import { enemyTeamArt } from './combat-team-ui.js';
import {squadParty,squadTargetNote,squadIntents,squadPreview,updateSquadUnits,squadRoleGuide} from './squad-ui.js';
import {ROLE_TRAITS} from './role-traits.js';
import {squadCaption} from './squad-combat.js';
import {autoOrder,autoRoute,createAutoRunner} from './auto-play.js';
import {travelScene,renderTravel,autoControls} from './journey-scene.js';
import {combatReportHTML} from './auto-tactics-ui.js';
import {createForestJourney} from './forest-journey.js';
import {forestWarning,forestMotion,forestLootDelta} from './forest-encounter.js';
import {reefWarning,reefOpening,reefPatrol} from './reef-encounter.js';
import {reefEnemyArt} from './reef-art.js';
import {volcanoWarning,volcanoOpening,volcanoPatrol,volcanoCaption} from './volcano-encounter.js';
import {volcanoEnemyArt} from './volcano-art.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(n,max)=>Math.max(0,Math.min(100,n/max*100));
export function activeBattleEntry(mode,battle){
  const strategy=battle?.strategy||newStrategy();
  const note=`${STANCES[strategy.stance].name}${strategy.drive?' · Lấy đà +45%':''}${strategy.riposte?' · Phản kích +25%':''} · Vào sàn để đổi thế, xem trước chiêu`;
  return `<div class="combat-entry"><div><span>${icon('swords',20)}</span><strong>Đọc đòn. Chọn thế. Tung phản kích.</strong><small>${escape(note)}</small></div><button class="btn primary" data-action="active-battle" data-id="${mode}">Vào sàn đấu ${icon('arrow',17)}</button></div>`;
}

export function combatScene(state,mode){
  if(mode==='dojo'&&state.dojo.run){
    const r=state.dojo.run,d=dojoDefinition(r),s=combatScene(r.sandbox,r.mode);
    if(!s)return null;
    return {...s,mode,...(!s.squad?{enemyMembers:[]}:{}),hostMode:r.mode,title:`${r.kind==='awakening'?'Thức tỉnh':'Võ đường'} · ${d.name}`,phase:r.kind==='awakening'?'Thử thách gắn bó · Sức mạnh cân bằng':r.kind==='challenge'?'Đội thú cho mượn':s.squad?'Tập đội hình · Miễn phí':'Phòng tập miễn phí',intent:dojoIntent(r),dojo:r,...(r.kind==='challenge'&&d.species?{enemyHTML:creature(d.species),theme:BY_ID[d.species].element}:r.kind==='awakening'&&r.mode==='explore'?{enemyHTML:creature(d.enemy==='armored'?'ferncat':'flamefox')}:{}),last:r.metrics.turns?s.last:d.guide||d.text};
  }
  if(mode==='boss'&&state.boss.run){
    const r=state.boss.run,id=bossId(r),d=BOSSES[id],e=bossEnemy(r.tier,id);
    return {mode,squad:r.squad?structuredClone(r.squad):null,members:r.members,tactics:r.tactics,rhythm:r.rhythm||newRhythm(),strategy:r.strategy||newStrategy(),hp:r.hp,maxHp:r.maxHp,enemyHp:r.enemyHp,enemyMax:e.maxHp,enemyShield:r.shield,focus:r.focus,turn:r.turn+1,enemyName:d.name,enemyHTML:bossArt(id,r.phase,r.mechanics),intent:bossIntent(r),theme:d.element,title:`${d.name} · Bậc ${r.tier}`,phase:`Giai đoạn ${r.phase} / 3`,bossId:id,mechanics:r.mechanics,core:id==='phoenix'&&r.phase>=2?r.mechanics.coreHp:0,coreMax:70+r.tier*15,roots:r.roots,last:r.log[0]};
  }
  if(mode==='ruins'&&state.ruins.run?.phase==='battle'){
    const r=state.ruins.run,b=r.battle,e=ruinsEncounter(r);
    return {mode,squad:r.squad?structuredClone(r.squad):null,members:r.members,tactics:b.tactics,rhythm:b.rhythm||newRhythm(),strategy:b.strategy||newStrategy(),hp:r.hp,maxHp:ruinsMaxHp(r),enemyHp:b.hp,enemyMax:e.maxHp,enemyShield:b.shield,focus:r.focus,turn:b.turn+1,enemyName:e.name,enemyHTML:creature(e.species),enemyMembers:ruinsEnemies(r,e),intent:ruinsIntent(r),enemyAI:b.enemyAI,isBoss:!!e.boss,theme:e.element,title:`Phế Tích Cổ · Tầng ${r.floor}`,phase:e.boss?'Trận thủ vệ':e.elite?'Tinh anh · '+e.elite.name:'Chuyến đi dưới tán rừng',elite:e.elite,routeCurse:r.route?.curse||0,roots:0,last:r.log[0]};
  }
  if(mode==='tower'&&state.tower.run?.phase==='battle'){
    const r=state.tower.run,b=r.battle,e=towerEncounter(r),members=r.members.map(m=>({...m,towerAdornment:state.tower.aura}));
    return {mode,squad:structuredClone(r.squad),members,tactics:b.tactics,rhythm:b.rhythm,strategy:b.strategy,hp:r.hp,maxHp:towerMaxHp(r),enemyHp:b.hp,enemyMax:e.maxHp,enemyShield:b.shield,focus:r.focus,turn:b.turn+1,enemyName:e.name,enemyHTML:creature(e.species),enemyMembers:towerEnemies(r,e),intent:towerIntent(r),enemyAI:b.enemyAI,isBoss:e.boss,theme:e.element,title:`Tháp Vô Tận · Tầng ${r.floor}/30`,phase:e.boss?'Cổng thủ vệ':e.elite?'Tinh anh':'Thử thách tháp',towerCurse:r.curse,towerOmen:towerOmen(r.season),roots:0,last:r.log[0]};
  }
  if(mode==='explore'&&state.expedition?.battle){
    const r=state.expedition,b=r.battle,biome=campaignBiome(r),danger=(b.round+1)%3===0;
    return {mode,squad:r.squad?structuredClone(r.squad):null,members:r.members,tactics:b.tactics,rhythm:b.rhythm||newRhythm(),strategy:b.strategy||newStrategy(),hp:r.hp,maxHp:100,enemyHp:b.hp,enemyMax:100,enemyShield:b.shield,focus:b.focus,turn:b.round+1,enemyName:b.enemy,enemyHTML:r.biome==='volcano'&&b.volcano&&b.boss?volcanoEnemyArt('dragon',{boss:true}):r.biome==='reef'&&b.boss?reefEnemyArt('crab',{boss:true}):creature(exploreEnemies(r)[0].species),enemyMembers:exploreEnemies(r),enemyAI:b.enemyAI,isBoss:!!b.boss,forestWarning:forestWarning(r),reefWarning:reefWarning(r),reefOpening:reefOpening(r),reefPatrol:reefPatrol(r),volcanoPatrol:volcanoPatrol(r),volcanoWarning:volcanoWarning(r),volcanoArmor:b.volcano?.armor||0,volcanoOpening:volcanoOpening(r),biomeId:r.biome,intent:volcanoWarning(r)||reefWarning(r)||enemyIntent(b,{id:danger?'heavy':'strike',name:danger?'Đối thủ đang dồn sức':'Đối thủ đang thăm dò',text:danger?'Đỡ đúng nhịp, hoặc phá thế để ngắt đòn mạnh.':'Đánh để tích năng lượng, nối chiêu để tạo combo.',danger,icon:danger?'shield':'swords'}),theme:biome.element,title:biome.name,phase:`Chặng ${r.stage+1} / ${biome.stages}`,roots:0,last:r.log[0]};
  }
  return null;
}

export function createCombatStage({getState,act,onRoute,onPlanner}){
  const dialog=document.createElement('dialog');dialog.id='combat-stage';dialog.className='duel-screen';dialog.setAttribute('aria-label','Sàn đấu linh thú');document.body.append(dialog);
  let mode='boss',pending=null,busy=false,frame=0,elapsed=0,started=0,paused=false,timing=true,feedback='',opener=null,stance='balanced',target='body',previewGrade='perfect',foe='',ally='';
  let journey=false,priority=getState().autoTactics?.plan.priority||'smart',autoReason='',plannerOpen=false;
  const scene=()=>combatScene(getState(),mode)||(journey&&mode==='explore'?travelScene(getState()):null);
  const autoAllowed=s=>!!s&&(!s.dojo||s.dojo.kind==='practice');
  const runner=createAutoRunner({ready:()=>dialog.open&&!document.hidden&&!plannerOpen&&!busy&&!pending&&autoAllowed(scene()),step:autoStep,delay:()=>scene()?.travel?2300:900});
  const timers=new Set(),quiet=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||!getState().settings.motion;
  const forest=createForestJourney({dialog,getState,quiet});
  const inForest=()=>journey&&mode==='explore'&&['forest','reef','volcano'].includes(getState().expedition?.biome);
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(dialog.open)fn();},ms);timers.add(id);};
  const stopMeter=()=>{cancelAnimationFrame(frame);frame=0;};
  function close(){runner.stop();journey=false;stopMeter();for(const id of timers)clearTimeout(id);timers.clear();pending=null;busy=false;if(dialog.open)dialog.close();forest.reset();document.body.classList.remove('duel-open');const target=document.querySelector(`[data-action="active-battle"][data-id="${mode}"]`);(target||opener)?.focus?.();}
  function controls(s){return autoControls({enabled:runner.enabled,speed:runner.speed,priority:getState().autoTactics?.plan.priority||priority,busy,allowed:autoAllowed(s),plan:getState().autoTactics?.plan});}
  function refreshAuto(){
    dialog.classList.toggle('auto-running',runner.enabled);
    if(busy){const hud=dialog.querySelector('.auto-hud');if(hud)hud.outerHTML=controls(scene());}
    else render();
  }
  function setAuto(enabled){
    if(enabled&&!autoAllowed(scene()))return;
    stopMeter();pending=null;
    if(enabled&&mode==='explore')journey=true;
    autoReason=enabled?'Đội đang quan sát và chuẩn bị ra chiêu.':'Đã dừng AUTO. Bạn có thể tự chọn nước đi.';
    runner.setEnabled(enabled);refreshAuto();
  }
  function route(choice){
    if(busy||pending||!scene()?.travel||!onRoute)return;
    const carried={...getState().expedition?.loot};
    const r=onRoute(choice);
    if(!r||r.error){runner.stop();feedback=r?.error||'Chưa thể đi tiếp. Hãy thử chọn đường khác.';return render();}
    foe='';ally='';feedback='Cả đội đã gặp đối thủ. Sẵn sàng chiến đấu!';autoReason='Gặp quái — chuẩn bị chiến đấu.';render();
    if(inForest())forest.loot(forestLootDelta(carried,getState().expedition.loot));
  }
  function autoStep(){
    const s=scene();if(!s){runner.stop();return;}
    if(s.travel){const plan=autoRoute(getState());if(!plan){runner.stop();feedback='Hãy chọn đường để tiếp tục hành trình.';render();return;}return route(plan.choice);}
    const order=autoOrder(s,{priority:getState().autoTactics?.plan.priority||priority,plan:getState().autoTactics?.plan});
    if(!order){runner.stop();feedback='AUTO đã dừng. Hãy kiểm tra đội hình.';render();return;}
    autoReason=order.reason;stance=order.stance;target=order.target;foe=order.foe||'';ally=order.ally||'';
    resolve(order.move,'auto');
  }
  function skillCard(m,s){
    const skill=petSkill(m.id,m),path=selectedPath(m.id,m),blocked=skillBlocked(s.tactics,m.id,s.focus,s.members,false,s.squad?.allies),combo=comboFor(s.tactics.mark,m.id),el=ELEMENTS[BY_ID[m.id].element];
    const trait=s.squad?ROLE_TRAITS[skill.role]:null;
    return `<button class="duel-skill ${combo&&!blocked?'duel-combo-ready':''}" data-duel="choose" data-move="pet:${m.id}" ${blocked?'disabled':''} aria-label="Dùng ${BY_ID[m.id].skill} của ${BY_ID[m.id].name}" title="${escape(skillDescription(m.id,false,m)+(trait?' '+trait.text:''))}" style="--pet-color:${el.color};--pet-pale:${el.pale}">${creature(m.id,{source:m})}<span class="duel-skill-energy">${icon('bolt',11)} ${skill.cost}</span><strong>${BY_ID[m.id].skill}</strong>${path?`<span class="skill-branch-tag">${path.name} ${m.training.rank}</span>`:''}<small>${escape(blocked||combo?.name||COMBAT_ROLES[skill.role].name)}</small>${trait?`<span class="role-trait-tag" data-trait="${skill.role}">${trait.name}</span>`:''}</button>`;
  }
  function ultimateHTML(s){return s.members.filter(m=>petSkill(m.id,m,true)).map(m=>{const skill=petSkill(m.id,m,true),blocked=skillBlocked(s.tactics,m.id,s.focus,s.members,true,s.squad?.allies);return `<button class="awakening-ultimate" data-duel="choose" data-move="awaken:${m.id}" ${blocked?'disabled':''} title="${escape(skillDescription(m.id,false,m,true))}">${creature(m.id,{source:m})}<span><small>THỨC TỈNH · 3 NĂNG LƯỢNG</small><strong>${skill.name}</strong><small>${blocked||'Mỗi trận dùng 1 lần'}</small></span>${icon('sparkle',21)}</button>`;}).join('');}
  function makeOrder(move){const s=combatScene(getState(),mode);return {move,stance,target:offensiveMove(move,s?.members)?target:'body',...(s?.squad&&foe?{foe}:{}),...(s?.squad&&ally?{ally}:{})};}
  function statusHTML(s){
    const effects=[];
    if(s.towerOmen)effects.push(['tower-omen',s.towerOmen.name,s.towerOmen.text]);
    if(s.towerCurse)effects.push(['tower-curse',`Nguyền rủa ×${s.towerCurse}`,`Địch gây thêm ${s.towerCurse*8}% sát thương.`]);
    if(s.elite)effects.push(['elite',s.elite.name,s.elite.text]);
    if(s.routeCurse)effects.push(['curse',`Lời nguyền ×${s.routeCurse}`,`Địch gây thêm ${s.routeCurse*15}% sát thương trong chuyến này.`]);
    for(const id of [...new Set(s.members.map(m=>m.gear?.set).filter(Boolean))])effects.push([`set-${id}`,`Bộ ${GEAR_SETS[id].name}`,GEAR_SETS[id].text]);
    if(s.mechanics?.frozen)effects.push(['frozen',`Đóng băng ${s.mechanics.frozen}L`,'Tạm ngừng tích năng lượng. Hỏa, Hợp lực hoặc đỡ hoàn hảo làm tan băng.']);
    if(s.bossId==='phoenix')effects.push(['core',s.mechanics.coreHp?`Lõi ${s.mechanics.coreHp} HP · ${s.mechanics.revives?'Đã tái sinh':'Còn 1 lần tái sinh'}`:'Lõi đã tắt · Chặn tái sinh','Lõi lộ ở 60% HP. Nhắm lõi để chặn tái sinh và hồi phục.']);
    if(s.enemyAI&&s.enemyAI.kind!=='plain')effects.push(['enemy',ENEMY_TACTICS[s.enemyAI.kind].name,ENEMY_TACTICS[s.enemyAI.kind].guide]);
    if(s.strategy.drive)effects.push(['drive','Lấy đà +45%', 'Đòn tấn công tiếp theo mạnh hơn 45%; đỡ và hỗ trợ giữ lại.']);
    if(s.strategy.riposte)effects.push(['riposte','Phản kích +25%','Đỡ hoàn hảo thành công: đòn tấn công tiếp theo mạnh hơn 25%.']);
    if(s.tactics.ward)effects.push(['ward',`Khiên ${s.tactics.ward}`,'Khiên hấp thụ sát thương trước sinh lực.']);
    for(const [id,name]of [['burn','Thiêu đốt'],['regen','Hồi phục'],['weaken','Suy yếu'],['boost','Tăng lực'],['counter','Phản đòn']]){
      const v=s.tactics[id];if(v.turns)effects.push([id,`${name} ${v.amount}${['weaken','boost'].includes(id)?'%':''} · ${v.turns}L`,`${v.turns} lượt còn lại.`]);
    }
    return effects.length?`<div class="duel-statuses" aria-label="Hiệu ứng đang có">${effects.map(([id,name,text])=>`<span data-buff="${id}" title="${escape(text)}">${escape(name)}</span>`).join('')}</div>`:'';
  }
  function stanceHTML(){return `<div class="duel-stances" role="group" aria-label="Chọn thế trận">${Object.entries(STANCES).map(([id,s])=>`<button data-duel="stance" data-stance="${id}" aria-pressed="${stance===id}" title="${s.text}">${icon(s.icon,15)} ${s.name}</button>`).join('')}</div><p class="duel-stance-note">${STANCES[stance].text}</p>`;}
  function targetHTML(s){if(s.core)return `<div class="duel-targets duel-core-target" role="group" aria-label="Chọn mục tiêu"><span>Lõi lửa ${s.core}/${s.coreMax} HP</span><button data-duel="target" data-target="body" aria-pressed="${target==='body'}">Thân phượng hoàng</button><button data-duel="target" data-target="core" aria-pressed="${target==='core'}">Phá lõi lửa</button><small>${target==='core'?'Đánh lõi · Thân nhận kèm 25% sát thương':'Hạ thân khi lõi còn sống: boss tái sinh 1 lần và hồi 45% HP.'}</small></div>`;return s.roots?`<div class="duel-targets" role="group" aria-label="Chọn mục tiêu"><span>Mục tiêu</span><button data-duel="target" data-target="body" aria-pressed="${target==='body'}">Thân cây</button><button data-duel="target" data-target="roots" aria-pressed="${target==='roots'}">Rễ hồi sinh ×${s.roots}</button><small>${target==='roots'?'Chặt hết rễ · Sát thương lên thân còn 50%':'Rễ còn sống sẽ hồi sinh lực cho boss mỗi lượt.'}</small></div>`:'';}
  function previewHTML(){
    const frozen=combatScene(getState(),mode)?.mechanics?.frozen;
    const grade=pending==='charge'||!timing?'auto':previewGrade,p=previewOrder(getState(),mode,makeOrder(pending),grade);
    if(p.error)return `<div class="duel-preview">${escape(p.error)}</div>`;
    const range=v=>v.min===v.max?`${v.min}`:`${v.min}–${v.max}`;
    const notes=[];
    if(p.allyTarget)notes.push(`Người nhận: ${BY_ID[p.allyTarget]?.name||p.allyTarget}`);
    if(p.finisher)notes.push('Săn mồi: chiêu +30% sát thương');
    if(p.taunted)notes.push('Khiêu khích trong lượt này và lượt sau');
    if(p.overhealWard.max)notes.push(`Dưỡng hộ: +${range(p.overhealWard)} khiên từ hồi dư`);
    if(p.haste.max)notes.push(`Tiếp sức: ${BY_ID[p.hasteTarget]?.name} giảm thêm 1 lượt chờ`);
    if(p.staggered)notes.push('Phá thế: ngắt toàn bộ đòn địch');
    if(p.parried)notes.push('Mở phản kích +25% cho đòn sau');
    if(p.setWard.max)notes.push(`Vĩnh Đông: +${range(p.setWard)} khiên sau đòn địch`);
    if(p.burnApplied.max)notes.push(`Thiêu đốt ${range(p.burnApplied)} × ${range(p.burnTurns)} lượt tới${p.setBurn?' · Vũ Hỏa +35%':''}`);
    if(p.rootsCut.max)notes.push(`Chặt ${range(p.rootsCut)} rễ${p.strategy?.target==='roots'?' · Thân chịu 50% sát thương':''}`);
    if(p.strategy?.charged)notes.push('Đòn sau +45% · Lượt này nhận thêm 35%');
    if(p.enemyHeal.max)notes.push(`Địch hồi ${range(p.enemyHeal)} HP`);
    if(p.absorbed.max)notes.push(`Khiên chặn ${range(p.absorbed)}`);
    if(p.reflected.max)notes.push(`Phản ${range(p.reflected)}`);
    if(p.combo)notes.push(p.combo);
    if(p.coreDamage.max)notes.push(`Lõi -${range(p.coreDamage)} HP${p.coreBroken?' · Chặn tái sinh!':''}`);
    if(p.revived.max)notes.push(`Boss tái sinh +${range(p.revived)} HP`);
    if(p.interrupted)notes.push(combatScene(getState(),mode)?.bossId?'Ngắt Bão tuyết':'Ngắt linh chú');
    if(p.thawed)notes.push('Làm tan đóng băng');
    if(p.frozenApplied.max)notes.push('Bị khóa tích năng lượng 2 lượt');
    if(frozen&&!p.thawed)notes.push('Băng khóa tích năng lượng trong lượt này');
    if(p.energyBlocked.max)notes.push(`Băng khóa ${range(p.energyBlocked)} năng lượng`);
    if(p.armorBlocked.max)notes.push(`Giáp chặn ${range(p.armorBlocked)}`);
    if(p.enemyCounter.max)notes.push(`Giáp phản ${range(p.enemyCounter)} (đã tính vào Nhận)`);
    if(p.enraged)notes.push('Địch cuồng nộ +60% sát thương');
    notes.push(`Năng lượng sau: ${range(p.energyAfter)}/3`);
    if(p.mayLose)notes.push(p.defeat?'Đội sẽ gục sau lượt này':'Có nguy cơ đội gục');
    else if(p.mayWin)notes.push(p.victory?'Kết thúc trận này':'Có thể hạ đối thủ');
    let description=skillActor(pending)?skillDescription(skillActor(pending),true,combatScene(getState(),mode)?.members,pending.startsWith('awaken:')):pending==='guard'?'Đỡ hoàn hảo giảm 90% sát thương và mở phản kích nếu địch đánh.':pending==='charge'?`Tốn 1 lượt · ${frozen?'Không tích năng lượng do đóng băng':'+2 năng lượng'} · nhận thêm 35% sát thương · đòn tấn công sau +45%.`:pending==='skill'?'Cả đội còn chiến đấu cùng tung chiêu. Dùng 2 năng lượng một lần, phá khiên, gây sát thương lan và hồi máu các bạn còn đứng vững.':'Tích 1 năng lượng. Dùng đòn đánh để tiêu thụ Lấy đà và Phản kích.';
    const scene=combatScene(getState(),mode),caster=skillActor(pending);if(scene.squad&&caster)description+=' '+ROLE_TRAITS[petSkill(caster,scene.members,pending.startsWith('awaken:')).role].short+'.';
    return `<div class="duel-preview ${p.mayLose?'risky':''}" data-preview-grade="${grade}"><div class="duel-preview-head"><strong>${STANCES[stance].name}${target==='roots'&&offensiveMove(pending,combatScene(getState(),mode)?.members)?' · Nhắm rễ':target==='core'&&offensiveMove(pending,combatScene(getState(),mode)?.members)?' · Nhắm lõi lửa':''}</strong>${pending!=='charge'&&timing?`<div role="group" aria-label="Xem kết quả theo nhịp"><button data-duel="preview" data-grade="normal" aria-pressed="${previewGrade==='normal'}">Chạm thường</button><button data-duel="preview" data-grade="perfect" aria-pressed="${previewGrade==='perfect'}">Hoàn hảo</button></div>`:'<small>Sau khi chốt lượt</small>'}</div><p class="duel-move-description">${escape(description)}</p><div class="duel-preview-stats"><span>Gây <b data-preview="damage">${range(p.damage)}</b></span><span>Nhận <b data-preview="incoming">${range(p.incoming)}</b></span><span>Hồi <b data-preview="heal">${range(p.heal)}</b></span><span>${p.ward.max?'Khiên':'HP sau'} <b data-preview="support">${range(p.ward.max?p.ward:p.hpAfter)}</b></span></div><small class="duel-preview-note">${escape(notes.join(' · ')||(p.exact?'Kết quả nếu chạm nhịp đã chọn.':'Khoảng dự kiến theo dao động sát thương.'))}</small>${squadPreview(p.squad)}</div>`;
  }
  function render(s=scene()){
    stopMeter();if(!s)return close();
    dialog.classList.toggle('tower-combat',mode==='tower');
    dialog.classList.toggle('duel-quiet',quiet());dialog.classList.toggle('duel-aiming',!!pending);dialog.style.setProperty('--duel-tint',ELEMENTS[s.theme].pale);
    dialog.classList.toggle('auto-running',runner.enabled);dialog.classList.toggle('auto-paused',document.hidden);
    if(inForest())return renderForest(s);
    if(s.travel){dialog.innerHTML=renderTravel(s,{state:getState(),enabled:runner.enabled,speed:runner.speed,controls:controls(s),feedback});if(dialog.open)runner.schedule();return;}
    const charged=s.rhythm.exposed,pressure=s.rhythm.pressure;
    if(s.squad){if(!s.squad.enemies.some(u=>u.id===foe&&u.hp))foe=s.squad.enemies.find(u=>u.hp&&u.row==='front')?.id||s.squad.enemies.find(u=>u.hp)?.id||'';if(!s.squad.allies.some(u=>u.id===ally&&u.hp))ally='';}
    if(target==='roots'&&!s.roots||target==='core'&&!s.core)target='body';
    const hint=s.intent.id==='charge'?'Địch đang tụ sức. Lấy đà lúc này không phải chịu đòn; chuẩn bị đỡ đòn nặng kế tiếp.':s.intent.danger?'Đòn mạnh sắp tới. Đỡ hoàn hảo để phản kích, hoặc tích đủ Phá thế để ngắt đòn.':s.strategy.drive||s.strategy.riposte?'Đội đã sẵn sàng. Chọn một chiêu gây sát thương để tung phần sức mạnh tích trữ.':'Đổi thế trận trước khi chọn chiêu. Chọn một chiêu để xem trước kết quả rồi chốt lượt.';
    dialog.innerHTML=`
      <header class="duel-topbar"><div><span>SÀN ĐẤU LINH THÚ</span><h2>${escape(s.title)}</h2></div><span class="duel-turn">Lượt ${s.turn}</span><button class="duel-close" data-duel="close" aria-label="Rời sàn đấu">${icon('close',22)}</button></header>
      ${controls(s)}
      <div class="duel-grid">
        <section class="duel-view">
          <div class="duel-healths">
            <div class="duel-team-hp"><span>${icon('heart',13)} Đội của bạn <b data-duel-hp="team">${s.hp}/${s.maxHp}</b></span><div><i style="width:${pct(s.hp,s.maxHp)}%"></i></div></div>
            <div class="duel-enemy-hp"><span>${s.enemyMembers?.length>1?`Đội địch · ${s.enemyMembers.length} thú`:escape(s.enemyName)} <b data-duel-hp="enemy">${s.enemyHp}/${s.enemyMax}</b></span><div><i style="width:${pct(s.enemyHp,s.enemyMax)}%"></i></div></div>
          </div>
          ${statusHTML(s)}${s.dojo?dojoGoals(s.dojo):''}
          <div class="duel-arena duel-theme-${s.theme} ${s.bossId?'duel-boss-'+s.bossId:''} ${s.mechanics?.frozen?'duel-frozen':''} ${s.squad?'has-squad':''}">
            ${landscapeArt(s.theme,{className:'duel-scenery'})}
            <span class="duel-phase">${escape(s.phase)} · ${s.squad?s.squad.allies.filter(u=>u.hp).length:s.members.length} đấu ${s.squad?s.squad.enemies.filter(u=>u.hp).length:s.enemyMembers?.length||1}${s.roots?` · ${s.roots} rễ hồi sinh`:''}</span>
            <div class="duel-party">${s.squad?squadParty(s.squad,s.members,'ally',ally,!!pending||busy):s.members.map((m,i)=>`<div class="duel-friend friend-${i}" data-friend="${m.id}">${creature(m.id,{source:m})}<span></span></div>`).join('')}</div>
            <div class="duel-opponent">${s.squad?`<div class="combat-enemy-team" data-enemy-count="${s.squad.enemies.length}">${squadParty(s.squad,s.members,'enemy',foe,!!pending||busy,s.enemyHTML)}</div>`:s.enemyMembers?.length>1?enemyTeamArt(s.enemyMembers):s.enemyHTML}<span></span></div><div class="duel-arena-fx" aria-hidden="true"></div>
            ${s.enemyShield?`<span class="duel-enemy-ward">${icon('shield',13)} ${s.enemyShield}</span>`:''}
            <span class="duel-scene-caption">${charged?'Lộ sơ hở · Đòn tiếp theo +20% sát thương':s.strategy.drive?'Đã lấy đà · Đòn tấn công tiếp theo +45%':s.strategy.riposte?'Sẵn sàng phản kích · Đòn tấn công tiếp theo +25%':s.squad?'Mỗi thú có máu riêng · Thú gục ngừng tham gia':'Sinh lực dùng chung theo đội. Cùng một nhịp.'}</span>
          </div>
          ${squadTargetNote(s.squad,foe,ally)}${squadIntents(s.squad,s.turn-1,s.reefPatrol,s.volcanoPatrol)}
          <div class="duel-intent ${s.intent.danger?'danger':''}">${icon(s.intent.icon,21)}<div><small>ĐÒN ĐỊCH SAU NƯỚC ĐI CỦA BẠN</small><strong>${escape(s.intent.name)}</strong><p>${escape(s.intent.text)}</p></div></div>
          <div class="duel-pressure ${charged?'exposed':''}"><div><span>${icon('bolt',13)} PHÁ THẾ</span><b>${pressure}/100${charged?' · Đòn sau +20%':''}</b></div><div class="duel-pressure-track"><i style="width:${pressure}%"></i></div><small>Đúng nhịp +20 · Hoàn hảo +34 · Đầy thanh: ngắt lượt địch</small></div>
        </section>
        <section class="duel-controls">
          <div class="duel-energy"><span>${icon('sparkle',16)} Nước đi của đội</span><b>${icon('bolt',15)} ${s.focus}/3</b></div>
          ${stanceHTML()}${targetHTML(s)}${s.enemyAI&&s.enemyAI.kind!=='plain'?`<p class="duel-enemy-guide">${escape(ENEMY_TACTICS[s.enemyAI.kind].guide)}</p>`:''}
          <p class="duel-skill-guide">Chiêu riêng: chỉ thú bạn chọn ra chiêu.</p><div class="duel-skills">${s.members.map(m=>skillCard(m,s)).join('')}</div>${ultimateHTML(s)}${s.squad?squadRoleGuide(s.members):''}
          ${(s.forestWarning||s.reefWarning||s.volcanoWarning)?`<div class="forest-legacy-warning"><strong>${s.volcanoWarning?s.volcanoWarning.title:s.reefWarning?'Sóng triều đang tới · né để mở bụng boss':'Rễ sắp trồi · đòn boss mạnh thêm 65%'}</strong><button data-duel="evade" ${busy||pending?'disabled':''}>${icon('wind',18)} Né ${s.volcanoWarning?s.volcanoWarning.name:s.reefWarning?'sóng':'rễ'} · dùng 1 lượt, giảm 85% sát thương</button></div>`:''}
          <div class="duel-commands">
            <button data-duel="choose" data-move="attack">${icon('swords',21)}<strong>Đánh thường</strong><small>+1 năng lượng</small></button>
            <button data-duel="choose" data-move="guard">${icon('shield',21)}<strong>Đỡ đòn</strong><small>Chuẩn: mở phản kích</small></button>
            <button data-duel="choose" data-move="charge" ${s.strategy.drive?'disabled':''}>${icon('flame',21)}<strong>Lấy đà</strong><small>${s.strategy.drive?'Đã sẵn sàng':s.mechanics?.frozen?'+0 năng lượng · Đang băng':'+2 năng lượng · Có rủi ro'}</small></button>
            <button data-duel="choose" data-move="skill" ${s.focus<2?'disabled':''}>${icon('sparkle',21)}<strong>Hợp lực</strong><small>2 năng lượng · Cả đội</small></button>
          </div>
          <div class="duel-timing-slot">${pending?`${previewHTML()}${meterHTML()}`:`<div class="duel-ready"><strong>${runner.enabled?'AUTO · Tự chiến đấu':timing?'Chọn nước đi của bạn':'Đánh nhanh đang bật'}</strong><p>${escape(runner.enabled?'Thú tự chọn mục tiêu, dùng chiêu riêng và Hợp lực. Tắt AUTO để tự ra lệnh.':hint)}</p></div>`}</div>
          ${runner.enabled?`<p class="auto-action-note" role="status">${icon('bolt',14)} ${escape(autoReason)}</p>`:''}
          <div class="duel-feedback" role="status">${escape(feedback||s.last||'Quan sát ý định của đối thủ rồi chọn nước đi của đội.')}</div>
          <footer class="duel-footer"><button data-duel="timing" role="switch" aria-checked="${timing}" ${pending?'disabled':''}>${icon(timing?'check':'clock',14)} Canh nhịp: ${timing?'Bật':'Tắt'}</button><small>Từng lượt tự lưu · Rời sàn để tiếp tục sau</small></footer>
        </section>
      </div>`;
    if(pending||busy||runner.enabled)disableChoices(true);
    dialog.querySelector('[data-duel="timing"]').disabled=!!pending||busy||runner.enabled;
    if(pending){if(pending!=='charge')paintMeter();dialog.querySelector('[data-duel="hit"]')?.focus();}
    if(dialog.open&&!busy&&!pending)runner.schedule();
  }
  function renderForest(s){
    if(s.squad&&!s.travel){if(!s.squad.enemies.some(u=>u.id===foe&&u.hp))foe=s.squad.enemies.find(u=>u.hp&&u.row==='front')?.id||s.squad.enemies.find(u=>u.hp)?.id||'';if(!s.squad.allies.some(u=>u.id===ally&&u.hp))ally='';}
    let panel;
    if(s.travel){
      const choices=s.boss?[{text:s.biome.id==='volcano'?'Đánh thức Rồng Đá':s.biome.id==='reef'?'Thách đấu Cua San Hô':'Gặp Cổ Thụ',icon:'swords'}]:s.event.choices;
      panel=`<div class="forest-route-panel"><div class="forest-event-title"><span>${icon(s.boss?'trophy':'compass',18)}</span><div><small>${runner.enabled?'ĐANG TỰ KHÁM PHÁ':'CHỌN ĐƯỜNG ĐI TIẾP'}</small><h3>${escape(s.boss?s.biome.boss:s.event.title)}</h3></div></div><div class="travel-choice-list">${choices.map((c,i)=>`<button data-duel="route" data-choice="${i}" ${runner.enabled?'disabled':''}>${icon(c.icon,16)}<span><strong>${escape(c.text)}</strong><small>${c.cost?'Có dùng tài nguyên · ':''}${Object.entries(c.reward||{}).map(([k,n])=>`${n} ${RESOURCES[k].name.toLowerCase()}`).join(' · ')}${c.detail?` · ${escape(c.detail)}`:c.heal?` · Hồi ${c.heal} HP`:''}</small></span></button>`).join('')}</div><p class="forest-route-note">${escape(runner.enabled?`Đội sẽ chọn: ${autoRoute(getState())?.name||'Chờ bạn'}`:s.event.text)}</p></div>`;
    }else{
      panel=`<div class="duel-energy"><span>${icon('sparkle',14)} Chiêu của đội</span><b>${icon('bolt',14)} ${s.focus}/3</b></div><div class="duel-skills">${s.members.map(m=>skillCard(m,s)).join('')}</div>
        <div class="duel-commands"><button data-duel="choose" data-move="attack">${icon('swords',18)}<strong>Đánh</strong></button><button data-duel="choose" data-move="guard">${icon('shield',18)}<strong>Đỡ</strong></button><button data-duel="choose" data-move="charge" ${s.strategy.drive?'disabled':''}>${icon('flame',18)}<strong>Lấy đà</strong></button><button data-duel="choose" data-move="skill" ${s.focus<2?'disabled':''}>${icon('sparkle',18)}<strong>Hợp lực</strong></button></div>
        <div class="duel-timing-slot">${pending?`${previewHTML()}${meterHTML()}`:''}</div>
        <details class="forest-tactical"><summary>${icon('compass',13)} Thế trận & chi tiết</summary>${stanceHTML()}${targetHTML(s)}${statusHTML(s)}${squadTargetNote(s.squad,foe,ally)}${squadIntents(s.squad,s.turn-1,s.reefPatrol,s.volcanoPatrol)}${ultimateHTML(s)}${squadRoleGuide(s.members)}<footer class="duel-footer"><button data-duel="timing" role="switch" aria-checked="${timing}" ${pending?'disabled':''}>${icon(timing?'check':'clock',14)} Canh nhịp: ${timing?'Bật':'Tắt'}</button></footer></details>
        ${runner.enabled?'<p class="auto-action-note" role="status"></p>':''}<div class="duel-feedback" role="status"></div>`;
    }
    forest.render(s,{run:getState().expedition,controls:controls(s),panel,enabled:runner.enabled,speed:runner.speed,busy,foe,ally,feedback,autoReason});
    if(pending||busy||runner.enabled)disableChoices(true);
    if(pending){if(pending!=='charge')paintMeter();dialog.querySelector('[data-duel="hit"]')?.focus({preventScroll:true});}
    if(dialog.open&&!busy&&!pending)runner.schedule();
  }
  function meterHTML(){
    if(pending==='charge')return `<div class="duel-timing duel-charge-confirm"><strong>${icon('flame',18)} Chuẩn bị cho đòn bùng nổ</strong><p>Không canh nhịp. Giữ Lấy đà qua các lượt đỡ và hỗ trợ; dùng một lần ở đòn tấn công kế tiếp.</p><button class="duel-hit" data-duel="hit">Lấy đà · Chốt lượt ${icon('arrow',19)}</button><div class="duel-timing-actions"><button data-duel="cancel">Đổi chiêu</button><small>${mode==='boss'&&getState().boss.run?.mechanics?.frozen?'Đóng băng: không tích năng lượng':'+2 năng lượng, tối đa 3'}</small></div></div>`;
    const name=pending==='guard'?'Đỡ ngay!':pending?.startsWith('pet:')?BY_ID[pending.slice(4)].skill:pending==='skill'?'Hợp lực!':'Ra đòn!';
    return `<div class="duel-timing"><div class="duel-timing-heading"><strong>${pending==='guard'?'Chặn cú đánh đang tới':'Đưa chiêu vào đúng nhịp'}</strong><span>Chạm khi kim vào vàng</span></div><div class="duel-meter" role="img" aria-label="Vùng xanh từ 30 đến 70 phần trăm; hoàn hảo từ 43 đến 57 phần trăm"><span class="duel-good-zone"></span><span class="duel-perfect-zone"></span><i data-duel-cursor></i></div><div class="duel-meter-labels"><span>Đòn thường</span><strong>Hoàn hảo</strong><span>Đòn thường</span></div><button class="duel-hit" data-duel="hit">${icon(pending==='guard'?'shield':'swords',22)} ${escape(name)} <small>Chạm / phím cách</small></button><div class="duel-timing-actions"><button data-duel="cancel">Đổi chiêu</button><button data-duel="skip">Bỏ canh nhịp</button></div></div>`;
  }
  function disableChoices(value){dialog.querySelectorAll('[data-duel="choose"],[data-duel="stance"],[data-duel="target"],[data-duel="unit"]').forEach(b=>{if(value)b.disabled=true;});}
  function meterElapsed(){return elapsed+(!paused?performance.now()-started:0);}
  function paintMeter(){
    stopMeter();if(!pending||pending==='charge'||paused||document.hidden||!dialog.open)return;
    const paint=()=>{const cursor=dialog.querySelector('[data-duel-cursor]');if(!pending||paused||document.hidden||!cursor)return;const position=rhythmPosition(meterElapsed());cursor.style.left=`${position*100}%`;cursor.dataset.position=String(position);frame=requestAnimationFrame(paint);};paint();
  }
  function choose(action){
    if(pending||busy||runner.enabled)return;const s=combatScene(getState(),mode);if(!s)return close();
    if(!['attack','guard','skill','charge'].includes(action)&&!s.members.some(m=>`pet:${m.id}`===action||`awaken:${m.id}`===action))return;
    if(action==='skill'&&s.focus<2||skillActor(action)&&skillBlocked(s.tactics,skillActor(action),s.focus,s.members,action.startsWith('awaken:'),s.squad?.allies))return;
    if(action==='charge'&&s.strategy.drive)return;
    if(!offensiveMove(action,combatScene(getState(),mode)?.members))target='body';
    if(!timing&&action!=='charge')return resolve(action,'auto');
    pending=action;previewGrade='perfect';elapsed=0;paused=false;started=performance.now();render(s);
  }
  function floatNumber(arena,text,side,kind='damage'){
    const el=document.createElement('span');el.className=`duel-number ${side} ${kind}`;el.textContent=text;arena.querySelector('.duel-arena-fx').append(el);
  }
  function unitElement(arena,side,id){return arena.querySelector(`[data-side="${side}"][data-unit="${id}"]`);}
  function animateUnitEvents(arena,events,snapshot){
    updateSquadUnits(arena,snapshot);
    const totals=new Map();
    for(const e of events){
      if(!['damage','heal','ward','revive','finisher','taunt','haste'].includes(e.kind))continue;
      const key=`${e.side}:${e.target}:${e.kind}`,v=totals.get(key)||{...e,amount:0,absorbed:0};v.amount+=e.amount;v.absorbed+=e.absorbed||0;totals.set(key,v);
    }
    const bounds=arena.getBoundingClientRect(),offsets=new Map();
    for(const e of totals.values()){
      const unit=unitElement(arena,e.side,e.target),rect=unit?.getBoundingClientRect();if(!rect)continue;
      if(e.kind==='damage'&&e.amount)unit.classList.add('is-hurt');
      const el=document.createElement('span'),key=`${e.side}:${e.target}`,offset=offsets.get(key)||0;offsets.set(key,offset+1);
      el.className=`duel-unit-number ${e.kind}`;el.dataset.floatTarget=e.target;el.dataset.floatSide=e.side;
      el.textContent=e.kind==='finisher'?'SĂN MỒI +30%':e.kind==='taunt'?'KHIÊU KHÍCH':e.kind==='haste'?'CHIÊU −1 LƯỢT':e.kind==='damage'?(e.amount?`−${e.amount}`:`Chặn ${e.absorbed}`):e.kind==='ward'?`+${e.amount} khiên`:`+${e.amount}`;
      if(!e.amount&&!e.absorbed)continue;
      el.style.left=`${Math.max(28,Math.min(bounds.width-38,rect.x+rect.width*.5-bounds.x))}px`;el.style.top=`${Math.max(42,rect.y+rect.height*.32-bounds.y+offset*18)}px`;
      arena.querySelector('.duel-arena-fx').append(el);
    }
  }
  function updateHealth(side,value,max){
    const label=dialog.querySelector(`[data-duel-hp="${side}"]`);if(!label)return;label.textContent=`${Math.max(0,value)}/${max}`;label.parentElement.nextElementSibling.firstElementChild.style.width=`${pct(value,max)}%`;
  }
  function projectile(arena,from,to,element,index=0,kind='strike'){
    if(quiet())return;
    const bounds=arena.getBoundingClientRect(),a=from?.getBoundingClientRect(),b=to?.getBoundingClientRect(),el=ELEMENTS[element]||ELEMENTS.light;
    if(!a||!b)return;
    const x=r=>Math.max(8,Math.min(bounds.width-24,r.x+r.width*.5-bounds.x-15)),y=r=>Math.max(35,Math.min(bounds.height-35,r.y+r.height*.55-bounds.y-15));
    const shot=document.createElement('i');shot.className=`duel-projectile duel-team-projectile element-${element} ${kind==='counter'?'from-enemy':''} ${kind==='guard'||kind==='charge'||kind==='heal'?'duel-team-aura':''}`;
    if(kind!=='counter'&&from.querySelector('.creature-shiny'))shot.classList.add('prism-projectile');
    shot.dataset.recipient=to.dataset.unit||'';shot.dataset.recipientSide=to.dataset.side||'';shot.dataset.effect=kind;
    shot.dataset.caster=from.dataset.friend||from.dataset.enemy||'boss';shot.style.setProperty('--shot-x',`${x(a)}px`);shot.style.setProperty('--shot-y',`${y(a)}px`);shot.style.setProperty('--shot-end-x',`${x(b)}px`);shot.style.setProperty('--shot-end-y',`${y(b)}px`);shot.style.setProperty('--cast-color',el.color);shot.style.animationDelay=`${index*60}ms`;
    shot.innerHTML=icon(kind==='guard'?'shield':kind==='charge'?'flame':el.icon,27);arena.querySelector('.duel-arena-fx').append(shot);
  }
  function animate(before,after,r,action,loot={}){
    const arena=dialog.querySelector('.duel-arena');if(!arena)return;
    const actors=castActors(action,r,before.members),enemy=arena.querySelector('.duel-opponent'),guard=action==='guard',charging=action==='charge';
    const foes=[...enemy.querySelectorAll('.combat-enemy-member')];if(!foes.length)foes.push(enemy);
    arena.dataset.castCount=String(actors.length);arena.dataset.castKind=action==='skill'?'unison':actors.length>1?'team':'solo';
    arena.style.setProperty('--hit-color',ELEMENTS[BY_ID[actors[0]?.id]?.element||'light'].color);arena.classList.toggle('duel-awakening-cast',!!r.awakenedSkill);
    const forestView=dialog.classList.contains('forest-journey');
    if(forestView){if(action==='evade')forest.evade(actors,runner.enabled?runner.speed:1);else forest.sound('cast',BY_ID[actors[0]?.id]?.element);}
    for(const [i,m]of actors.entries()){
      if(action==='evade')continue;
      const ally=arena.querySelector(`[data-friend="${m.id}"]`);ally?.classList.add(charging?'is-preparing':guard?'is-guarding':'is-acting');ally?.style.setProperty('--cast-color',ELEMENTS[BY_ID[m.id].element].color);ally?.style.setProperty('--cast-delay',`${i*60}ms`);
      ally?.classList.toggle('prism-caster',!!ally.querySelector('.creature-shiny'));
      const events=before.squad?(r.unitEvents||[]).filter(e=>e.actor===m.id&&['damage','heal','ward','haste'].includes(e.kind)):[];
      const role=skillActor(action)?petSkill(m.id,before.members,action.startsWith('awaken:')).role:'attack';
      const event=(role==='attack'?events.find(e=>e.side==='enemy'):events.find(e=>e.side==='ally'))||events[0];
      const destination=before.squad?(event?unitElement(arena,event.side,event.target):r.damage?unitElement(arena,'enemy',foe)||foes[0]:ally):foes[i%foes.length];
      const motion=forestMotion(m,action);
      if(forestView)forest.castUnit(ally,guard||charging?ally:destination,motion,BY_ID[m.id].element,i,runner.enabled?runner.speed:1);
      if(!forestView||motion!=='melee')projectile(arena,ally,guard||charging?ally:destination,BY_ID[m.id].element,i,charging?'charge':guard?'guard':event?.side==='ally'||!r.damage?'heal':'strike');
      const secondary=events.find(e=>e.kind==='damage'&&event?.side==='ally');if(secondary)projectile(arena,ally,unitElement(arena,secondary.side,secondary.target),BY_ID[m.id].element,i+1,'strike');
    }
    const banner=document.createElement('div');banner.className=`duel-callout ${r.rhythm?.grade||'auto'}`;banner.textContent=action==='evade'?(r.volcanoWarning?'NÉ TỚI NỀN ĐÁ AN TOÀN':r.reefWarning?'NÉ SÓNG · MỞ BỤNG BOSS':'NÉ RỄ · GIẢM 85% SÁT THƯƠNG'):action==='skill'?`HỢP LỰC · ${actors.length} THÚ${r.rhythm?.grade==='perfect'?' · HOÀN HẢO!':''}`:r.awakenedSkill?`THỨC TỈNH · ${r.skill}`:charging?'CẢ ĐỘI LẤY ĐÀ +45%':r.rhythm?.staggered?'PHÁ THẾ!':r.rhythm?.grade==='perfect'?'HOÀN HẢO!':r.rhythm?.grade==='good'?'ĐÚNG NHỊP!':r.strategy?.driveUsed?'BUNG LỰC!':r.strategy?.riposteUsed?'PHẢN KÍCH!':r.skill|| (guard?'BẢO VỆ CẢ ĐỘI':'CẢ ĐỘI RA ĐÒN!');arena.querySelector('.duel-arena-fx').append(banner);
    const roster=document.createElement('div');roster.className='duel-cast-roster';roster.setAttribute('aria-label',castCaption(action,r,before.members));roster.innerHTML=actors.map(m=>`<span style="--cast-color:${ELEMENTS[BY_ID[m.id].element].color}">${icon(ELEMENTS[BY_ID[m.id].element].icon,12)} ${BY_ID[m.id].name}</span>`).join('');arena.querySelector('.duel-arena-fx').append(roster);
    const speed=runner.enabled?runner.speed:1;
    const impact=(quiet()?15:actors.length>1?510:370)/speed,counter=(quiet()?30:760)/speed,finish=(quiet()?60:1120)/speed;
    if(speed!==1)for(const animation of arena.getAnimations({subtree:true}))animation.playbackRate=speed;
    later(()=>{
      if(forestView&&r.summoned&&after&&getState().expedition){forest.reinforce({...after,squad:r.squadImpact||r.squadAfter},getState().expedition,{busy:true,foe,ally});floatNumber(arena,'PHA 2 · GỌI ĐỒNG ĐỘI!','enemy','ward');}
      if(forestView&&r.damage)for(const m of actors){if(forestMotion(m,action)==='melee'){const event=(r.unitEvents||[]).find(e=>e.actor===m.id&&e.side==='enemy'&&e.kind==='damage');forest.impact(event?unitElement(arena,'enemy',event.target):foes[0],BY_ID[m.id].element);}}
      if(before.squad){animateUnitEvents(arena,(r.unitEvents||[]).slice(0,r.squadImpactEventCount??r.unitEvents?.length),r.squadImpact||r.squadAfter);if(r.damage)arena.classList.add('is-impact');}
      else{
        if(r.damage){enemy.classList.add('is-hurt');arena.classList.add('is-impact');floatNumber(arena,`−${r.damage}`,'enemy');}
        if(r.heal)floatNumber(arena,`+${r.heal}`,'party','heal');
        if(r.ward)floatNumber(arena,`+${r.ward} khiên`,'party','ward');
      }
      if(r.volcanoArmorDamage)floatNumber(arena,r.volcanoArmorBroken?'VỠ GIÁP · +60%':`Giáp −${r.volcanoArmorDamage}`,'enemy','ward');
      if(r.volcanoWeakness)floatNumber(arena,'TRÚNG ĐIỂM YẾU!','enemy','ward');
      if(r.coreDamage)floatNumber(arena,r.coreBroken?'LÕI ĐÃ TẮT':`Lõi −${r.coreDamage}`,'enemy','ward');
      if(r.interrupted)floatNumber(arena,before.bossId?'NGẮT BÃO!':'NGẮT PHÉP!','enemy','ward');
      if(r.rootsCut)floatNumber(arena,`−${r.rootsCut} rễ`,'enemy','ward');
      if(r.combo){const combo=document.createElement('strong');combo.className='duel-combo-label';combo.textContent=`${r.combo}!`;arena.querySelector('.duel-arena-fx').append(combo);}
      if(r.rhythm?.staggered)enemy.classList.add('is-staggered');
      if(!quiet()&&r.damage)for(let i=0;i<8;i++){const spark=document.createElement('i');spark.className='duel-spark';spark.style.setProperty('--spark-angle',`${i*45}deg`);arena.querySelector('.duel-arena-fx').append(spark);}
      updateHealth('enemy',before.squad&&r.squadImpact?r.squadImpact.enemies.reduce((n,u)=>n+u.hp,0):after?.enemyHp??(r.enemyHeal?before.enemyHp-r.damage+r.enemyHeal:Math.max(0,before.enemyHp-r.damage-r.reflected)),before.enemyMax);
      if(before.squad&&r.squadImpact)updateHealth('team',r.squadImpact.allies.reduce((n,u)=>n+u.hp,0),before.maxHp);
    },impact);
    later(()=>{
      if(forestView&&r.forestWarning)forest.roots();
      if(forestView&&r.reefWarning)forest.wave();
      if(forestView&&r.volcanoWarning&&(r.volcanoWarning==='lava-eruption'||r.enemyAttacked))forest.eruption(r.volcanoWarning);
      if(before.squad){
        const events=(r.unitEvents||[]).slice(r.squadImpactEventCount??r.unitEvents?.length),actions=new Map();
        for(const e of events)if(e.actor?.startsWith('enemy-')&&['damage','heal','ward','charge'].includes(e.kind)&&!actions.has(e.actor))actions.set(e.actor,e);
        let i=0;
        for(const [id,e]of actions){const unit=(r.squadAfter||r.squadImpact||before.squad).enemies.find(u=>u.id===id);if(!unit)continue;const el=unitElement(arena,'enemy',id),recipient=unitElement(arena,e.side,e.target),motion=e.kind==='charge'?'charge':forestMotion({id:unit.species},e.kind==='damage'?'attack':`pet:${unit.species}`);el?.classList.add(e.kind==='damage'?'is-attacking':'is-acting');el?.style.setProperty('--cast-delay',`${i*60}ms`);const element=before.volcanoPatrol?'fire':BY_ID[unit.species].element;if(forestView)forest.castUnit(el,recipient,motion,element,i,speed);if(!forestView||motion!=='melee')projectile(arena,el,recipient,element,i,e.kind==='damage'?'counter':e.kind==='charge'?'charge':e.kind==='ward'?'guard':'heal');i++;}
        if(actions.size){const label=document.createElement('small');label.className='duel-counter-callout';label.textContent=`Địch hành động · ${actions.size} thú`;arena.querySelector('.duel-arena-fx').append(label);}
        animateUnitEvents(arena,events,r.squadAfter||after?.squad);updateHealth('enemy',r.squadAfter?.enemies.reduce((n,u)=>n+u.hp,0)??after?.enemyHp??0,before.enemyMax);
        if(r.setWard)floatNumber(arena,`+${r.setWard} khiên đội`,'party','ward');
      }else if(r.incoming||r.absorbed){
        for(const [i,foe]of foes.entries()){
          foe.classList.add('is-attacking');foe.style.setProperty('--cast-delay',`${i*60}ms`);
          const member=before.members[i%before.members.length],element=before.enemyMembers?.[i]?.element||before.theme;
          projectile(arena,foe,arena.querySelector(`[data-friend="${member.id}"]`),element,i,'counter');
        }
        const label=document.createElement('small');label.className='duel-counter-callout';label.textContent=`Địch phản công · ${foes.length} ${foes.length>1?'thú':'đối thủ'}`;arena.querySelector('.duel-arena-fx').append(label);
        if(r.incoming){arena.querySelector('.duel-party')?.classList.add('is-hurt');floatNumber(arena,`−${r.incoming}`,'party');}if(r.absorbed)floatNumber(arena,`Chặn ${r.absorbed}`,'party','ward');
      }
      if(r.reflected&&!before.squad)floatNumber(arena,`−${r.reflected} phản`,'enemy','ward');
      if(r.revived)floatNumber(arena,`TÁI SINH +${r.revived}`,'enemy','heal');
      if(r.frozenApplied)floatNumber(arena,'ĐÓNG BĂNG!','party','ward');
      if(r.thawed)floatNumber(arena,'TAN BĂNG','party','heal');
      if(r.enemyHeal&&!before.squad)floatNumber(arena,`+${r.enemyHeal}`,'enemy','heal');
      if(r.strategy?.parried){const label=document.createElement('strong');label.className='duel-combo-label';label.textContent='SẴN SÀNG PHẢN KÍCH';arena.querySelector('.duel-arena-fx').append(label);}
      updateHealth('team',after?.hp??Math.max(0,before.hp+r.heal-r.incoming),before.maxHp);
      if(forestView&&(r.won||r.finished))forest.loot(r.finished?r.reward||{}:loot,{banked:!!r.finished});
    },counter);
    later(()=>{busy=false;const next=scene();if(next)render(next);else showResult(r,before);},finish);
  }
  function resolve(action,grade){
    if(busy)return;const before=combatScene(getState(),mode);if(!before)return close();
    stopMeter();pending=null;busy=true;render(before);disableChoices(true);dialog.querySelector('[data-duel="timing"]').disabled=true;
    const carried={...getState().expedition?.loot};
    const r=act(mode,makeOrder(action),grade);
    if(!r||r.error){busy=false;feedback=r?.error||'Chưa thể ra chiêu. Hãy chọn lại nhé.';return render();}
    feedback=`${castCaption(action,r,before.members)}. ${r.rhythm?.staggered?'Phá thế! Ngắt phản công. ':r.rhythm?.grade==='perfect'?'Hoàn hảo! ':r.rhythm?.grade==='good'?'Đúng nhịp! ':''}${r.combo?`${r.combo} · `:''}Gây ${r.damage||0}${r.heal?` · hồi ${r.heal}`:''}${r.ward?` · thêm ${r.ward} khiên`:''}${r.rootsCut?` · chặt ${r.rootsCut} rễ`:''}${r.enemyHeal?` · địch hồi ${r.enemyHeal}`:''} · nhận ${r.incoming||0} sát thương.${orderCaption(r)}${setCaption(r)}${before.bossId?bossMechanicCaption(r):enemyCaption(r)}${volcanoCaption(r)}${r.eliteShattered?' · Khiên tinh anh đã vỡ!':''}${r.eliteDisrupted?' · Ngắt tinh anh: +1 năng lượng, +12 khiên':''}${squadCaption(r)?' · '+squadCaption(r):''}`;
    const after=scene();if(before.squad&&!dialog.classList.contains('forest-journey'))dialog.scrollTo({top:0,behavior:'instant'});animate(before,after,r,action,forestLootDelta(carried,getState().expedition?.loot));
  }
  function showResult(r,before){
    runner.stop();dialog.classList.remove('auto-running');
    const won=r.dojoResult?r.dojoResult.status==='victory':r.result?r.result.status==='victory':r.success!==false;dialog.classList.add('duel-ended');
    if(r.dojoResult){dialog.innerHTML=`<div class="duel-dojo-end"><button class="duel-close" data-duel="close" aria-label="Rời sàn đấu">${icon('close',22)}</button>${dojoReport(r.dojoResult)}${r.combatReport?combatReportHTML(r.combatReport):''}<button class="btn secondary" data-duel="close">${r.dojoResult.kind==='awakening'?'Về Đền Thức tỉnh':'Về Võ đường'} ${icon('arrow',17)}</button></div>`;dialog.querySelector('[data-duel="close"]')?.focus();return;}

    const resultHost=dialog.classList.contains('forest-journey')?forest.endHost():dialog;
    if(r.campaign){resultHost.innerHTML=campaignResultHTML(r);resultHost.querySelector('.btn')?.focus();return;}
    resultHost.innerHTML=`<div class="duel-end"><button class="duel-close" data-duel="close" aria-label="Rời sàn đấu">${icon('close',22)}</button><span class="duel-end-emblem">${icon(won?'trophy':'heart',40)}</span><span class="eyebrow">${won?'CÙNG NHAU VƯỢT QUA':'MÌNH LẠI TRỞ VỀ ĐẢO'}</span><h2>${won?'Một trận đấu ra trò.':'Nghỉ một chút, rồi trở lại.'}</h2><div class="duel-end-party">${before.members.map(m=>creature(m.id,{source:m})).join('')}</div><p>${escape(feedback)}</p>${r.combatReport?`<details class="auto-end-report" open><summary>Báo cáo trận vừa rồi</summary>${combatReportHTML(r.combatReport)}</details>`:''}${r.awakeningMaterials||r.result?.awakeningMaterials?`<p class="awakening-material">${awakeningRewardText(r.awakeningMaterials||r.result.awakeningMaterials)}</p>`:''}<small>${won?(mode==='boss'?'Trang bị và nguyên liệu đã cất vào kho.':mode==='tower'?'Bụi tháp và thưởng đã cất. Chọn phước lành cho tầng tiếp theo.':mode==='ruins'?'Bụi cổ đã được cất. Chọn phép cho chặng tiếp theo.':'Đường phía trước đã mở. Cùng đi tiếp nào!'):'Thú và trang bị đều về an toàn.'}</small><button class="btn primary" data-duel="close">${won?mode==='boss'?'Xem chiến lợi phẩm':'Tiếp tục hành trình':'Về hành trình'} ${icon('arrow',17)}</button></div>`;
    if(mode==='explore'&&r.finished){
      dialog.querySelector('.duel-end h2').textContent=won?'Đã hoàn thành hành trình!':'Cả đội đã trở về an toàn.';
      const note=dialog.querySelector('.duel-end>small');note.textContent='AUTO đã dừng. Chiến lợi phẩm đã cất vào kho; bạn chọn chuyến mới khi sẵn sàng.';
      const loot=document.createElement('div');loot.className='auto-result-loot';loot.setAttribute('aria-label','Chiến lợi phẩm hành trình');
      loot.innerHTML=Object.entries(r.reward||{}).filter(([,n])=>n>0).map(([k,n])=>`<span>${icon(RESOURCES[k].icon,18)} <b>${n}</b> ${RESOURCES[k].name}</span>`).join('');note.before(loot);
    }
    const prismLoot=r.shinyReward?.fragments||r.shinyFragments||r.result?.shinyFragments||0;
    if(prismLoot||r.shinyReward?.encounter){const block=document.createElement('div');block.className='prism-combat-loot';block.innerHTML=(prismLoot?`<p class="prism-loot-note">${fragmentLabel(prismLoot)}</p>`:'')+shinyRewardCard(r.shinyReward?.encounter);resultHost.querySelector('.duel-end>small')?.before(block);}
    dialog.querySelector('.btn').focus();
  }
  // Game controls respond on contact. A turn may replace its DOM before release.
  // Keep keyboard/assistive clicks working, without toggling twice on pointer-up.
  dialog.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    const button=event.target.closest('[data-duel]');if(!button||button.disabled)return;
    if(button.dataset.duel==='auto'){event.preventDefault();setAuto(!runner.enabled);}
    else if(button.dataset.duel==='speed'){event.preventDefault();runner.setSpeed(runner.speed===1?2:1);refreshAuto();}
    else if(button.dataset.duel==='evade'&&!busy&&!pending&&(scene()?.forestWarning||scene()?.reefWarning||scene()?.volcanoWarning)){event.preventDefault();resolve('evade','auto');}
  });
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('[data-duel]');if(!button||button.disabled)return;
    const a=button.dataset.duel;
    if(a==='auto'){if(!event.detail)setAuto(!runner.enabled);return;}
    if(a==='speed'){if(!event.detail){runner.setSpeed(runner.speed===1?2:1);refreshAuto();}return;}
    if(a==='evade'){if(!event.detail&&!busy&&!pending&&(scene()?.forestWarning||scene()?.reefWarning||scene()?.volcanoWarning))resolve('evade','auto');return;}
    if(a==='route'&&!runner.enabled){route(Number(button.dataset.choice));return;}
    if(a==='unit'&&!busy&&!pending&&!runner.enabled){const s=combatScene(getState(),mode),units=button.dataset.side==='ally'?s?.squad?.allies:s?.squad?.enemies;if(units?.some(u=>u.id===button.dataset.unit&&u.hp)){if(button.dataset.side==='ally')ally=button.dataset.unit;else foe=button.dataset.unit;render();}return;}
    if(a==='planner'||a==='reports'){onPlanner?.(a==='reports'?'reports':'plan',{mode});return;}
    if(a==='close')close();
    else if(a==='choose')choose(button.dataset.move);
    else if(a==='stance'&&!pending&&!busy&&!runner.enabled&&Object.hasOwn(STANCES,button.dataset.stance)){stance=button.dataset.stance;render();}
    else if(a==='target'&&!pending&&!busy&&!runner.enabled){target=button.dataset.target;render();}
    else if(a==='preview'&&pending&&!busy){previewGrade=button.dataset.grade;render();}
    else if(a==='hit'&&pending)resolve(pending,pending==='charge'?'auto':rhythmGrade(rhythmPosition(meterElapsed())));
    else if(a==='skip'&&pending)resolve(pending,'auto');
    else if(a==='cancel'&&pending){stopMeter();pending=null;render();}
    else if(a==='timing'&&!busy&&!pending&&!runner.enabled){timing=!timing;render();}
  });
  dialog.addEventListener('change',event=>{if(event.target.matches('[data-auto-priority]')){priority=event.target.value==='weak'?'weak':'smart';if(getState().autoTactics){getState().autoTactics.plan.priority=priority;window.dispatchEvent(new Event('spirit-tactics-change'));}}});
  dialog.addEventListener('keydown',event=>{if(event.code==='Space'&&pending&&!event.target.closest('[data-duel="preview"],[data-duel="cancel"],[data-duel="skip"]')){event.preventDefault();if(!event.repeat)resolve(pending,pending==='charge'?'auto':rhythmGrade(rhythmPosition(meterElapsed())));}});
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(runner.enabled)setAuto(false);else if(pending){stopMeter();pending=null;render();}else close();});
  function pauseMeter(){if(!pending||!dialog.open||paused)return;elapsed+=performance.now()-started;paused=true;stopMeter();}
  function resumeMeter(){if(!pending||!dialog.open||document.hidden||!paused)return;started=performance.now();paused=false;paintMeter();}
  function suspend(){pauseMeter();runner.suspend();forest.pause();dialog.classList.add('auto-paused');}
  function resume(){if(document.hidden||!dialog.open||plannerOpen)return;resumeMeter();runner.resume();dialog.classList.remove('auto-paused');}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else resume();});
  window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',resume);window.addEventListener('spirit-resume',resume);
  return {open(nextMode,options={}){const s=combatScene(getState(),nextMode)||(options.journey&&nextMode==='explore'?travelScene(getState()):null);if(!s)return false;const focus=document.activeElement;close();opener=focus;mode=nextMode;journey=!!options.journey;stance=s.strategy?.stance||'balanced';target='body';foe='';ally='';feedback='';autoReason='Đội đang quan sát và chuẩn bị ra chiêu.';dialog.classList.remove('duel-ended');render();dialog.showModal();dialog.scrollTop=0;document.body.classList.add('duel-open');if(!document.hidden)runner.resume();if(options.auto)setAuto(true);dialog.querySelector(options.auto?'[data-duel="auto"]':'[data-move="attack"]')?.focus({preventScroll:true});return true;},isOpen:()=>dialog.open,suspendAuto(){plannerOpen=true;suspend();},resumeAuto(){plannerOpen=false;if(dialog.open&&!dialog.classList.contains('duel-ended')){priority=getState().autoTactics?.plan.priority||priority;refreshAuto();resume();}},back(){if(!dialog.open)return false;if(runner.enabled)setAuto(false);else if(pending){stopMeter();pending=null;render();}else close();return true;},close};
}
