import {BY_ID,BIOMES,RESOURCES,ELEMENTS} from './data.js';
import {campaignBiome} from './campaign-data.js';
import {campaignRunHUD} from './campaign-ui.js';
import {icon} from './art.js';
import {bossArt} from './boss-art.js';
import {petSkill} from './tactics.js';
import {squadUnit,updateSquadUnits} from './squad-ui.js';
import {forestArt} from './forest-art.js';
import {reefArt,reefEnemyArt} from './reef-art.js';
import {reefSkin,reefOpening} from './reef-encounter.js';
import {volcanoArt,volcanoEnemyArt} from './volcano-art.js';
import {volcanoSkin,volcanoOpening,VOLCANO_ARMOR} from './volcano-encounter.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createForestJourney({dialog,getState,quiet}){
  let field=null,audio=null,lastWarning='',lastStage=-1;
  const timers=new Set(),voices=new Set();
  const later=(fn,ms)=>{const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);timers.add(timer);};
  function sound(kind,element='leaf'){
    if(!getState().settings.sound||document.hidden)return;
    try{
      audio||=new(window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended')audio.resume().catch(()=>{});
      const tones=kind==='loot'?[660,880,1100]:kind==='warning'?[130,105]:kind==='evade'?[260,420]:element==='fire'?[140,90]:element==='water'?[460,700]:element==='wind'?[600,900]:element==='shadow'?[180,270]:element==='light'?[740,990]:[230,350];
      tones.forEach((hz,i)=>{
        const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+i*.055;
        oscillator.type=kind==='warning'||element==='fire'?'triangle':'sine';oscillator.frequency.setValueAtTime(hz,start);oscillator.frequency.exponentialRampToValueAtTime(hz*(kind==='evade'?1.6:.7),start+.16);
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(kind==='warning'?.045:.028,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+.19);
        oscillator.connect(gain);gain.connect(audio.destination);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+.2);
      });
    }catch{/* Devices without audio still play the same expedition. */}
  }
  function reset(){
    for(const timer of timers)clearTimeout(timer);timers.clear();
    for(const voice of voices)try{voice.stop();}catch{}voices.clear();
    field=null;lastWarning='';lastStage=-1;dialog.querySelector('.forest-layout')?.remove();dialog.classList.remove('forest-journey','forest-complete','reef-journey','volcano-journey');
  }
  function mount(){
    if(dialog.querySelector('.forest-layout'))return;
    const reef=getState().expedition?.biome==='reef',volcano=getState().expedition?.biome==='volcano';
    dialog.innerHTML=`<div class="forest-layout"><header class="forest-head"></header><div class="forest-auto"></div>
      <section class="duel-arena forest-field duel-theme-${volcano?'fire':reef?'water':'leaf'}" aria-label="${volcano?'Đồi Than Hồng phiêu lưu':reef?'Vịnh Ngọc Lam phiêu lưu':'Khu rừng phiêu lưu'}">
        ${volcano?volcanoArt():reef?reefArt():forestArt()}<div class="forest-road-marks" aria-hidden="true"></div>
        <div class="forest-field-hud"><div class="duel-healths"></div><div class="forest-progress travel-stages" aria-label="Chặng hành trình"></div></div>
        <div class="duel-party"></div><div class="duel-opponent"><div class="combat-enemy-team"></div></div>
        <div class="forest-warning-host"></div><div class="volcano-armor-host"></div><div class="duel-arena-fx" aria-hidden="true"></div>
        <details class="forest-bag"><summary></summary><div></div></details>
        <div class="forest-loot-label" role="status"></div><div class="forest-caption travel-state"></div>
      </section><section class="forest-dock duel-controls"></section></div>`;
    field=dialog.querySelector('.forest-field');
  }
  function updateUnits(s,run,{busy,foe,ally}){
    const fallback=run.members.map((m,i)=>({id:m.id,species:m.id,hp:Math.round(run.hp/run.members.length),maxHp:Math.round(100/run.members.length),ward:0,cover:0,cooldown:0,row:i===0?'front':'back',role:petSkill(m.id,run.members)?.role||'attack'}));
    const allies=s.squad?.allies||fallback,enemies=s.travel?[]:s.squad?.enemies||(s.enemyMembers||[]).map((m,i)=>({...m,hp:Math.max(1,Math.round(s.enemyHp/s.enemyMembers.length)),maxHp:Math.round(100/s.enemyMembers.length),ward:0,cover:0,cooldown:0,row:i===0?'front':'back',role:petSkill(m.species)?.role||'attack'}));
    for(const [side,units,container]of [['ally',allies,field.querySelector('.duel-party')],['enemy',enemies,field.querySelector('.combat-enemy-team')]]){
      const ids=new Set(units.map(u=>u.id));for(const child of [...container.children])if(!ids.has(child.dataset.unit))child.remove();
      for(const [index,u]of units.entries()){
        let button=[...container.children].find(e=>e.dataset.unit===u.id);
        const boss=side==='enemy'&&s.isBoss&&(!run.campaign||u.id==='enemy-0');
        const volcanic=side==='enemy'?volcanoSkin(run,u):null,skin=volcanic||(side==='enemy'?reefSkin(run,u):null);
        const speciesKey=`${u.species}:${boss}:${skin?.kind||''}`;
        if(button&&button.dataset.speciesKey!==speciesKey){button.remove();button=null;}
        if(!button){
          const html=squadUnit(u,run.members,side,index,{html:volcanic?volcanoEnemyArt(skin.kind,skin):skin?reefEnemyArt(skin.kind,skin):boss?(run.biome==='forest'?bossArt('treant',1):undefined):undefined});
          container.insertAdjacentHTML('beforeend',html);button=container.lastElementChild;button.dataset.speciesKey=speciesKey;
        }
        const row=units.filter(v=>v.row===u.row),slot=row.indexOf(u),near=row.length===3?slot===1:u.row==='front';
        const y=s.travel?[40,55,70][index]:units.length===1?58:row.length===1?54:row.length===2?[40,68][slot]:[40,54,68][slot];
        const x=side==='ally'?(s.travel?[22,39,22][index]:near?34:17):(boss?77:near?67:85);
        button.style.setProperty('--unit-left',`${x}%`);button.style.setProperty('--unit-top',`${y}%`);
        button.style.setProperty('--unit-width',boss?'39%':'28%');button.style.setProperty('--unit-height',boss?'52%':'31%');
        button.style.zIndex=String(Math.round(y));button.style.setProperty('--walker',index);
        button.style.setProperty('--hurt-x',side==='enemy'?'9px':'-9px');
        button.classList.remove('is-hurt','is-acting','is-attacking','is-guarding','is-preparing','is-staggered');
        button.dataset.row=u.row;button.dataset.role=u.role;button.disabled=busy||s.travel||!u.hp;
        button.classList.toggle('is-down',!u.hp);button.classList.toggle('is-selected',!s.travel&&u.id===(side==='ally'?ally:foe));
        button.classList.toggle('forest-boss-unit',!!boss);
        button.classList.toggle('forest-shared-health',!s.squad);
        button.setAttribute('aria-pressed',String(!s.travel&&u.id===(side==='ally'?ally:foe)));
        button.setAttribute('aria-label',`${side==='ally'?'Đồng đội':'Mục tiêu'} ${skin?skin.name:boss?run.battle.enemy:BY_ID[u.species].name}, ${u.hp}/${u.maxHp} sinh lực${!u.hp?', đã gục':''}`);
        if(boss||skin)button.querySelector('.squad-unit-info>strong').textContent=skin?.name||run.battle.enemy;
        button.dataset.reefKind=!volcanic&&skin?skin.kind:'';button.dataset.volcanoKind=volcanic?.kind||'';
      }
    }
    updateSquadUnits(field,{allies,enemies});
    field.querySelector('.combat-enemy-team').dataset.enemyCount=String(enemies.length);
  }
  function render(s,{run,controls,panel,enabled,speed,busy,foe,ally,feedback,autoReason}){
    mount();dialog.classList.add('forest-journey');dialog.classList.toggle('reef-journey',run.biome==='reef');dialog.classList.toggle('volcano-journey',run.biome==='volcano');dialog.style.setProperty('--forest-speed',speed);
    const biome=campaignBiome(run),reef=run.biome==='reef',volcano=run.biome==='volcano';
    const stage=run.stage,warning=s.volcanoWarning||s.forestWarning||s.reefWarning,walking=!!s.travel&&enabled,entering=!s.travel&&field.dataset.phase==='travel';
    field.classList.toggle('reef-opening',reefOpening(run));field.dataset.biome=run.biome;
    field.classList.toggle('volcano-opening',!!volcanoOpening(run));field.classList.toggle('volcano-unarmored',!!run.battle?.volcano&&!!run.battle.boss&&!run.battle.volcano.armor);
    const armor=run.battle?.boss&&run.battle.volcano;
    field.querySelector('.volcano-armor-host').innerHTML=armor?`<div class="volcano-armor" role="status" aria-label="Giáp Rồng Đá">${armor.armor?`GIÁP ĐÁ <b>${armor.armor}/${VOLCANO_ARMOR}</b><div><i style="width:${armor.armor/VOLCANO_ARMOR*100}%"></i></div>`:armor.opening?`ĐIỂM YẾU · <b>+60% · ${armor.opening} ĐÒN</b>`:'GIÁP ĐÃ VỠ'}<small>${armor.armor?'Hợp lực / xuyên giáp phá nhanh hơn':''}</small></div>`:'';
    field.classList.toggle('travel-world',!!s.travel);field.classList.toggle('is-walking',walking);field.classList.toggle('has-squad',!s.travel);field.classList.toggle('forest-in-battle',!s.travel);field.classList.toggle('forest-danger',!!warning);field.classList.remove('forest-evading','is-impact','duel-awakening-cast');
    field.dataset.phase=s.travel?'travel':'battle';field.dataset.stage=String(stage);delete field.dataset.evaded;
    field.querySelector('.forest-backdrop').classList.toggle('travel-scenery',!!s.travel);field.querySelector('.forest-backdrop').classList.toggle('duel-scenery',!s.travel);
    field.querySelector('.duel-arena-fx').replaceChildren();
    dialog.querySelector('.forest-head').innerHTML=`<div><small>${icon('map',12)} HÀNH TRÌNH · CHẶNG ${stage+1}/${biome.stages}</small><h2>${biome.name}</h2></div><button data-duel="close" class="forest-exit" aria-label="Rời sàn đấu">${icon('close',20)}</button>`;
    dialog.querySelector('.forest-auto').innerHTML=controls;
    field.querySelector('.duel-healths').innerHTML=`<div class="duel-team-hp"><span>${icon('heart',12)} Đội bạn <b data-duel-hp="team">${s.hp}/100</b></span><div><i style="width:${s.hp}%"></i></div></div>${!s.travel?`<div class="duel-enemy-hp"><span>${s.isBoss?'THỦ LĨNH':'Đội địch'} <b data-duel-hp="enemy">${s.enemyHp}/100</b></span><div><i style="width:${s.enemyHp}%"></i></div></div>`:''}`;
    field.querySelector('.forest-progress').innerHTML=Array.from({length:biome.stages},(_,i)=>`<span class="${i<stage?'passed':i===stage?'current':''}" aria-label="Chặng ${i+1}${i<stage?' đã qua':i===stage?' hiện tại':''}">${icon(i<stage?'check':i===biome.stages-1?'trophy':'paw',12)}</span>`).join('');
    const bag=field.querySelector('.forest-bag'),loot=run.loot||{};
    bag.querySelector('summary').innerHTML=`${icon('chest',18)}<span>Túi hành trình</span><b>${loot.gold||0}</b>${icon('coin',12)}`;
    bag.querySelector('div').innerHTML=Object.entries(loot).filter(([,n])=>n>0).map(([k,n])=>`<span>${icon(RESOURCES[k].icon,14)} ${n} ${RESOURCES[k].name}</span>`).join('')||'<span>Vật phẩm nhặt được sẽ ở đây.</span>';
    updateUnits(s,run,{busy,foe,ally});
    const warningHost=field.querySelector('.forest-warning-host');
    warningHost.innerHTML=warning?`<div class="forest-danger-zone" aria-hidden="true"><i></i><i></i><i></i></div>${volcano?'<div class="volcano-safe-ground" aria-hidden="true">NỀN ĐÁ AN TOÀN</div>':''}<div class="forest-warning" role="status"><strong>${icon(warning.icon||(reef?'waves':'info'),16)} ${warning.title||'RỄ SẮP TRỒI'}</strong><small>${enabled?'AUTO sẽ né · bạn có thể né ngay':reef?'Né giảm 85% sát thương · mở bụng boss':'Né dùng 1 lượt · giảm 85% sát thương'}</small><button data-duel="evade" ${busy?'disabled':''}>${icon('wind',18)} ${warning.button||'Né rễ ngay'}</button></div>`:'';
    const marker=warning?`${run.started}:${stage}:${s.turn}`:'';
    if(marker&&marker!==lastWarning)sound('warning');lastWarning=marker;
    field.querySelector('.forest-caption').textContent=s.travel?(enabled?volcano?'Đang theo lối đá · AUTO ghé suối ấm':reef?'Đang men bờ cát · AUTO chọn đường an toàn':'Đang tìm đường · cả đội cùng tiến bước':'Cả đội đang chờ bạn chọn đường'):volcanoOpening(run)?`RỒNG LỘ ĐIỂM YẾU · ${volcanoOpening(run)} đòn tới +60% sát thương`:reefOpening(run)?'BOSS HỞ BỤNG · Đòn kế tiếp +20% sát thương':s.isBoss?volcano?'Phá giáp Rồng · coi chừng đòn dậm và hơi lửa':reef?'Cua đang giữ rạn · né sóng để mở bụng':'Cổ Thụ đã thức giấc · coi chừng rễ dưới chân':volcano?'Sói săn hàng sau · coi chừng vết nứt dung nham':enabled?'Đang giao chiến · AUTO chọn chiêu theo tình huống':'Chạm đối thủ để nhắm · chọn chiêu bên dưới';
    dialog.querySelector('.forest-dock').innerHTML=panel;
    if(run.campaign)dialog.querySelector('.forest-dock').insertAdjacentHTML('afterbegin',campaignRunHUD(run));
    const warningPanel=warningHost.querySelector('.forest-warning');if(warningPanel)dialog.querySelector('.forest-dock').prepend(warningPanel);
    const note=dialog.querySelector('.duel-feedback');if(note)note.textContent=feedback||'Tiến trình tự lưu sau mỗi lượt.';
    const reason=dialog.querySelector('.auto-action-note');if(reason)reason.textContent=autoReason;
    if((entering||lastStage>=0&&stage!==lastStage)&&!quiet()){field.classList.remove('forest-arriving');void field.offsetWidth;field.classList.add('forest-arriving');later(()=>field?.classList.remove('forest-arriving'),650);}
    lastStage=stage;
  }
  function castUnit(from,to,motion,element,index=0,speed=1){
    if(!field||!from)return;
    from.dataset.forestMotion=motion;
    for(const cls of [...from.classList])if(cls.startsWith('forest-style-'))from.classList.remove(cls);
    from.classList.add(`forest-style-${motion}`);
    from.style.setProperty('--cast-delay',`${index*60}ms`);from.style.setProperty('--cast-color',ELEMENTS[element]?.color||'#adcb78');
    from.style.setProperty('--cast-speed',speed);
    if(to){const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();from.style.setProperty('--dash-x',`${(b.x-a.x)*.74}px`);from.style.setProperty('--dash-y',`${(b.y-a.y)*.74}px`);}
    later(()=>{from.classList.remove(`forest-style-${motion}`);delete from.dataset.forestMotion;},1250/speed);
  }
  function evade(members,speed=1){
    if(!field)return;field.classList.add('forest-evading');field.dataset.evaded='true';
    for(const [i,m]of members.entries()){
      const unit=field.querySelector(`[data-friend="${m.id}"]`);if(unit){unit.style.setProperty('--safe-x',`${field.clientWidth*((14+i*12)-parseFloat(unit.style.getPropertyValue('--unit-left')))/100}px`);unit.style.setProperty('--safe-y',`${field.clientHeight*(80-parseFloat(unit.style.getPropertyValue('--unit-top')))/100}px`);}
      castUnit(unit,null,'evade',BY_ID[m.id].element,i,speed);
    }
    const warningPanel=dialog.querySelector('.forest-warning');warningPanel?.classList.add('is-evaded');const label=warningPanel?.querySelector('strong');if(label)label.textContent=getState().expedition?.biome==='volcano'?'ĐÃ TỚI NỀN ĐÁ · GIẢM 85% SÁT THƯƠNG':getState().expedition?.biome==='reef'?'ĐÃ NÉ · BOSS SẼ HỞ BỤNG':'ĐÃ NÉ · GIẢM 85% SÁT THƯƠNG';sound('evade');
  }
  function impact(target,element){
    if(!field||quiet()||!target)return;
    const a=field.getBoundingClientRect(),b=target.getBoundingClientRect(),slash=document.createElement('i');
    slash.className='forest-slash';slash.style.left=`${b.x+b.width*.5-a.x}px`;slash.style.top=`${b.y+b.height*.5-a.y}px`;slash.style.setProperty('--cast-color',ELEMENTS[element]?.color||'#e4ddab');
    field.querySelector('.duel-arena-fx').append(slash);later(()=>slash.remove(),700);
  }
  function roots(){
    if(!field)return;const burst=document.createElement('div');burst.className='forest-root-burst';burst.innerHTML='<i></i><i></i><i></i><i></i>';
    field.querySelector('.duel-arena-fx').append(burst);sound('warning');later(()=>burst.remove(),800);
  }
  function wave(){
    if(!field)return;const burst=document.createElement('div');burst.className='reef-tidal-burst';burst.innerHTML='<i></i><i></i><i></i>';field.querySelector('.duel-arena-fx').append(burst);sound('cast','water');later(()=>burst.remove(),1100);
  }
  function eruption(kind){
    if(!field)return;const burst=document.createElement('div');burst.className='volcano-burst';burst.dataset.kind=kind;burst.innerHTML='<i></i><i></i><i></i>';field.querySelector('.duel-arena-fx').append(burst);sound('cast','fire');later(()=>burst.remove(),1100);
  }
  function loot(reward,{banked=false}={}){
    if(!field)return;const entries=Object.entries(reward).filter(([k,n])=>n>0&&RESOURCES[k]);if(!entries.length)return;
    const label=field.querySelector('.forest-loot-label');label.textContent=`${banked?'Đã cất vào kho':'Nhặt được'} · ${entries.map(([k,n])=>`${n} ${RESOURCES[k].name.toLowerCase()}`).join(' · ')}`;label.classList.add('visible');
    for(const [i,[k,n]]of entries.entries()){
      const particle=document.createElement('span');particle.className='forest-loot-particle';particle.dataset.resource=k;particle.dataset.amount=String(n);particle.style.setProperty('--loot-i',i);particle.innerHTML=`${icon(RESOURCES[k].icon,21)}<b>+${n}</b>`;field.append(particle);later(()=>particle.remove(),quiet()?1000:1500);
    }
    sound('loot');later(()=>label.classList.remove('visible'),2200);
  }
  function endHost(){
    if(!field)return null;dialog.classList.add('forest-complete');field.classList.remove('is-walking');
    for(const button of dialog.querySelectorAll('.forest-auto button,.forest-auto select'))button.disabled=true;
    const toggle=dialog.querySelector('[data-duel="auto"]');if(toggle){toggle.setAttribute('aria-checked','false');toggle.querySelector('b').textContent='TẮT';}
    const host=document.createElement('div');host.className='forest-result';dialog.querySelector('.forest-layout').append(host);return host;
  }
  function pause(){for(const voice of voices)try{voice.stop();}catch{}voices.clear();}
  return {render,reinforce:updateUnits,castUnit,impact,roots,wave,eruption,evade,loot,endHost,reset,sound,pause};
}
