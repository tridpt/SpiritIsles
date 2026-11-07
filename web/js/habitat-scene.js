import { BY_ID } from './data.js';
import { creature, icon } from './art.js';
import { itemThumbnail } from './island-layout-art.js';
import { itemOf } from './island-layout.js';
import { momentStatus, memoryOf } from './habitat-engine.js';

const OBSERVE_MS=2400;
export function createHabitatScene({getState,onRecord,onClose,onBook}) {
  let session=null,root=null,frame=0,last=0;
  const blocked=()=>document.hidden||!!document.querySelector('#game-dialog[open]');
  function pause(){cancelAnimationFrame(frame);frame=0;last=0;root?.classList.add('habitat-paused');}
  function release(){const lobby=root?.closest('.game-lobby');for(const child of lobby?.children||[])child.inert=false;root?.remove();root=null;}
  function close(){if(!session)return;pause();release();session=null;onClose();}
  function open(id,momentId){
    const saved=memoryOf(getState(),id,momentId);
    const status=momentStatus(getState(),id,momentId,null,saved?.partner);if(status.error||!status.canPlay)return {error:status.error||status.reasons.join(' ')};
    close();session={id,momentId,decorationId:status.decoration.id,partnerId:status.partner?.id,elapsed:0,recorded:status.discovered};sync();return {};
  }
  function html(s){
    const m=s.moment;
    return `<header><div><span class="eyebrow">MỘT GÓC ĐẢO, MỘT ĐIỀU BẤT NGỜ</span><h2 id="habitat-scene-title">${m.name}</h2></div><button data-action="habitat-scene-close" aria-label="Đóng góc chơi">${icon('close',21)}</button></header><div class="habitat-stage" data-pose="${m.pose}"><div class="habitat-scene-sky"></div><div class="habitat-scene-ground"></div><div class="habitat-scene-decor">${itemThumbnail(s.decoration.type)}</div>${s.support?`<div class="habitat-scene-support">${itemThumbnail(s.support.type)}</div>`:''}<div class="habitat-scene-pet">${creature(s.pet.species,{source:s.pet})}<span class="habitat-thought">${m.pose==='nap'?'z Z':m.pose==='dream'?'☾':'♪'}</span></div>${s.partner?`<div class="habitat-scene-partner">${creature(s.partner.species,{source:s.partner})}</div>`:''}<div class="habitat-scene-particles" aria-hidden="true">${Array.from({length:7},(_,i)=>`<i style="--i:${i}">${m.pose==='bubbles'?'○':m.pose==='friends'?'♥':'✦'}</i>`).join('')}</div><span class="habitat-scene-caption">${BY_ID[s.pet.species].name}${s.partner?` & ${BY_ID[s.partner.species].name}`:''}</span></div><div class="habitat-scene-story"><p>${m.text}</p><small>${itemOf(s.decoration.type).name}${s.support?` + ${itemOf(s.support.type).name}`:''} · Góc chơi trên đảo của bạn</small></div><div class="habitat-observe"><div><i data-habitat-progress></i></div><p data-habitat-scene-status role="status">Cùng ngắm bạn nhỏ một chút…</p></div><footer><button class="btn secondary" data-action="habitat-scene-book">${icon('book',18)} Về sổ</button><button class="btn primary" data-action="habitat-scene-record" disabled>${icon('heart',18)} Ghi kỷ niệm</button></footer>`;
  }
  function paint(){
    if(!root||!session)return;
    const ready=session.elapsed>=OBSERVE_MS,button=root.querySelector('[data-action="habitat-scene-record"]');
    root.dataset.observed=String(ready);root.dataset.recorded=String(session.recorded);
    root.querySelector('[data-habitat-progress]').style.width=`${Math.min(100,session.elapsed/OBSERVE_MS*100)}%`;
    button.disabled=!ready||session.recorded;
    button.innerHTML=`${icon(session.recorded?'check':'heart',18)} ${session.recorded?'Đã có trong sổ':'Ghi kỷ niệm'}`;
    root.querySelector('[data-habitat-scene-status]').textContent=session.note||(ready?session.recorded?'Kỷ niệm vẫn ở đây. Cứ chơi thêm nếu bạn thích!':'Một khoảnh khắc mới! Ghi vào sổ để nhận gắn bó.':'Cùng ngắm bạn nhỏ một chút…');
  }
  function tick(at){
    frame=0;if(!session||!root?.isConnected||blocked()){pause();return;}
    if(last)session.elapsed+=Math.min(100,Math.max(0,at-last));last=at;paint();
    if(session.elapsed<OBSERVE_MS)frame=requestAnimationFrame(tick);
  }
  function sync(){
    pause();if(!session)return;
    const lobby=document.querySelector('.game-lobby');if(!lobby){close();return;}
    const status=momentStatus(getState(),session.id,session.momentId,session.decorationId,session.partnerId);if(status.error||!status.canPlay){close();return;}
    if(!root?.isConnected){
      root=document.createElement('section');root.className='habitat-scene';root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','habitat-scene-title');root.innerHTML=html(status);lobby.append(root);
      for(const child of lobby.children)if(child!==root)child.inert=true;
      root.focus({preventScroll:true});
    }
    paint();root.classList.toggle('habitat-paused',blocked());if(!blocked()&&session.elapsed<OBSERVE_MS)frame=requestAnimationFrame(tick);
  }
  function action(name){
    if(!session)return;
    if(name==='close'){close();return;}
    if(name==='book'){const id=session.id;close();onBook(id);return;}
    if(name==='record'&&!blocked()&&session.elapsed>=OBSERVE_MS&&!session.recorded){
      const r=onRecord(session.id,session.momentId,session.decorationId,session.partnerId);if(r.error){session.note=r.error;paint();return;}
      session.recorded=true;session.note=r.isNew?`Đã ghi kỷ niệm mới${r.gained?` · +${r.gained} gắn bó`:' · tình bạn đã trọn vẹn'}!`:'Kỷ niệm này đã có trong sổ.';paint();
    }
  }
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&session&&!blocked()){event.preventDefault();close();}});
  return {open,sync,pause,close,action,back:()=>{if(!session)return false;close();return true;}};
}
