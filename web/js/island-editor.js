import { icon, islandArt } from './art.js';
import { ISLAND_ITEMS, itemOf, available, layoutOf, anchorOf, unproject, sizeOf, placementError, placeItem, storeItem } from './island-layout.js';
import { renderLayout, renderGrid, layoutPiece, footprint, itemThumbnail } from './island-layout-art.js';
import { decorMomentHint } from './habitat-engine.js';

const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const CATEGORIES=[['all','Tất cả'],['building','Công trình'],['garden','Cây & hoa'],['path','Đường đi'],['cozy','Góc vui'],['treasure','Báu vật']];

export function createIslandEditor({getState,onSave,onExit,onDialog}) {
  let draft=null,original='',selected=null,pending=null,category='all',notice='',history=[],future=[];
  let root=null,viewport=null,world=null,events=null,observer=null,drag=null,view=null,pinch=null,exitPage='island';
  const pointers=new Map();
  const state=()=>getState();
  const dirty=()=>draft&&JSON.stringify(draft)!==original;
  const current=()=>draft?.placed.find(p=>p.id===selected);
  const count=type=>draft.placed.filter(p=>p.type===type).length;
  function remember(){history.push(clone(draft));if(history.length>30)history.shift();future=[];}
  function begin(){draft=clone(layoutOf(state()));original=JSON.stringify(draft);selected=null;pending=null;notice='Kéo đồ để di chuyển · Vuốt nền để nhìn quanh';history=[];future=[];view=null;}
  function end(){pause();events?.abort();observer?.disconnect();draft=null;root=null;selected=null;pending=null;view=null;}
  function html(){
    if(!draft)begin();
    return `<section class="island-editor" aria-label="Xưởng trang trí đảo"><div class="editor-viewport" tabindex="0" role="group" aria-label="Bãi cỏ chỉnh đảo. Kéo đồ để di chuyển, vuốt nền để nhìn quanh, dùng phím mũi tên để di chuyển đồ đã chọn."><div class="editor-world">${islandArt(state().level,state().buildings,{bare:true})}${renderGrid()}${renderLayout(draft,true)}<svg class="editor-placement-preview" viewBox="0 0 1000 600" aria-hidden="true"></svg></div></div>
      <header class="editor-heading"><button class="editor-round editor-exit" data-action="island-edit-exit" aria-label="Rời chế độ chỉnh đảo">${icon('arrow',19)}</button><div><small>GÓC ĐẢO CỦA RIÊNG BẠN</small><h1>Chỉnh đảo</h1><span data-editor-saved>Lưu để giữ bố cục</span></div><button class="editor-save" data-action="island-edit-save">${icon('check',19)}<strong>Lưu</strong></button></header>
      <div class="editor-tools" role="group" aria-label="Dụng cụ chỉnh đảo"><button class="editor-round" data-action="island-edit-zoom-in" aria-label="Phóng to đảo">${icon('plus',21)}<small>Phóng</small></button><button class="editor-round" data-action="island-edit-zoom-out" aria-label="Thu nhỏ đảo"><b>−</b><small>Thu</small></button><button class="editor-round" data-action="island-edit-overview" aria-label="Xem toàn đảo">${icon('island',20)}<small>Toàn đảo</small></button><button class="editor-round" data-action="island-edit-undo" aria-label="Hoàn tác" ${history.length?'':'disabled'}>${icon('arrow',20)}<small>Hoàn tác</small></button><button class="editor-round" data-action="island-edit-redo" aria-label="Làm lại" ${future.length?'':'disabled'}>${icon('arrow',20,'redo-icon')}<small>Làm lại</small></button></div>
      <p class="editor-notice" role="status" data-editor-notice>${notice}</p><div class="editor-inspector" data-editor-inspector></div>
    </section>`;
  }
  function catalog(){
    const list=ISLAND_ITEMS.filter(d=>category==='all'||d.kind===category);
    return `<p class="editor-catalog-intro">Bộ đồ đảo nhỏ có sẵn để bạn sáng tạo. Chọn một món, rồi chạm ô trên bãi cỏ để đặt.</p><div class="editor-categories" role="group" aria-label="Loại đồ trang trí">${CATEGORIES.map(([id,label])=>`<button data-action="island-edit-category" data-id="${id}" aria-pressed="${category===id}" class="${category===id?'active':''}">${label}</button>`).join('')}</div><div class="editor-catalog-grid">${list.map(d=>{const unlocked=available(state(),d.id),left=d.quantity-count(d.id);return `<button class="editor-catalog-item ${unlocked?'':'item-locked'} ${d.kind==='treasure'?'item-treasure':''}" data-action="island-edit-choose" data-id="${d.id}" ${unlocked&&left>0?'':'disabled'} aria-label="${d.name}${unlocked?`, còn ${left}`:`, ${d.building?'Xây công trình trước':d.unlockText}`}">${itemThumbnail(d.id)}<strong>${d.name}</strong><small>${unlocked?left?`Còn ${left} · ${d.w}×${d.h} ô`:'Đã đặt hết':d.building?'Xây công trình trước':d.unlockText}</small>${decorMomentHint(d.id)?`<small class="editor-moment-hint">${decorMomentHint(d.id)}</small>`:''}${d.kind==='treasure'?'<i>✦</i>':''}</button>`;}).join('')}</div><p class="editor-catalog-note">Cất đồ sẽ trả về kho. Công trình vẫn sản xuất khi được di chuyển hoặc cất.</p>`;
  }
  function openCatalog(){pause();onDialog('catalog',catalog());}
  function setNotice(text,error=false){notice=text;if(root){root.querySelector('[data-editor-notice]').textContent=text;root.querySelector('[data-editor-notice]').classList.toggle('error',error);}}
  function paintInspector(){
    if(!root||!draft)return;
    const p=current(),d=itemOf(pending?.type||p?.type),host=root.querySelector('[data-editor-inspector]');
    host.innerHTML=d?`<div class="editor-selected-art">${itemThumbnail(d.id)}</div><div class="editor-selected-copy"><strong>${d.name}</strong><small>${pending?'Chạm ô để đặt':`Ô ${p.x+1} · ${p.y+1}`} · ${sizeOf(pending||p).w}×${sizeOf(pending||p).h}</small></div><button class="editor-item-action" data-action="island-edit-rotate" aria-label="Xoay đồ đã chọn">${icon('refresh',20)}<small>Xoay</small></button><button class="editor-item-action" data-action="island-edit-store" aria-label="${pending?'Hủy đặt đồ':'Cất đồ đã chọn'}">${icon(pending?'close':'chest',20)}<small>${pending?'Hủy':'Cất'}</small></button><button class="editor-item-action editor-catalog-button" data-action="island-edit-catalog" aria-label="Mở kho đồ trang trí">${icon('build',20)}<small>Kho đồ</small></button>`:`<div class="editor-empty-copy"><strong>Một hòn đảo theo ý bạn</strong><small>Chạm chọn đồ · Kéo để dời · Hai ngón để phóng</small></div><button class="editor-open-catalog" data-action="island-edit-catalog">${icon('build',21)}<strong>Kho đồ</strong></button>`;
    root.querySelector('[data-editor-saved]').textContent=dirty()?'Có thay đổi chưa lưu':'Bố cục đã lưu';
    root.querySelector('[data-action="island-edit-undo"]').disabled=!history.length;root.querySelector('[data-action="island-edit-redo"]').disabled=!future.length;
    for(const el of root.querySelectorAll('.layout-piece'))el.classList.toggle('layout-selected',el.dataset.layoutId===selected);
  }
  function paintPieces(){
    if(!root)return;
    const focused=document.activeElement?.closest?.('.layout-piece')?.dataset.layoutId;
    root.querySelector('.island-layout-layer').outerHTML=renderLayout(draft,true);paintInspector();
    if(focused)root.querySelector(`[data-layout-id="${focused}"]`)?.focus({preventScroll:true});
  }
  function paintPreview(p=null){
    if(!root)return;
    const svg=root.querySelector('.editor-placement-preview');
    if(!p){svg.innerHTML='';root.removeAttribute('data-placement-valid');return;}
    const error=placementError(state(),draft,p);
    root.dataset.placementValid=String(!error);
    svg.innerHTML=`<g class="placement-ghost ${error?'placement-invalid':'placement-valid'}">${footprint(p,'preview-cell')}${layoutPiece({...p,id:'preview'})}</g>`;
    setNotice(error||`${itemOf(p.type).name} · Thả tay để đặt ở ô ${p.x+1}, ${p.y+1}`,!!error);
  }
  function updateView(){
    if(!world||!view)return;
    const b=viewport.getBoundingClientRect();
    view.panX=clamp(view.panX,-500*view.zoom,500*view.zoom);view.panY=clamp(view.panY,-300*view.zoom,300*view.zoom);
    world.style.transform=`translate3d(${b.width/2+view.panX}px,${b.height*.48+view.panY}px,0) scale(${view.zoom}) translate(-500px,-300px)`;
    root.dataset.zoom=view.zoom.toFixed(2);
  }
  function worldPoint(x,y){const b=world.getBoundingClientRect();return {x:(x-b.left)/view.zoom,y:(y-b.top)/view.zoom};}
  function gridPoint(event){const p=worldPoint(event.clientX,event.clientY);return unproject(p.x,p.y);}
  function zoomTo(zoom,x,y){
    const b=viewport.getBoundingClientRect();x??=b.x+b.width/2;y??=b.y+b.height*.48;
    const at=worldPoint(x,y);view.zoom=clamp(zoom,.4,1.7);view.panX=x-b.x-b.width/2-(at.x-500)*view.zoom;view.panY=y-b.y-b.height*.48-(at.y-300)*view.zoom;updateView();
  }
  function fit(){const b=viewport.getBoundingClientRect();view={zoom:Math.min(1.2,Math.max(.4,Math.min((b.width-20)/760,(b.height-180)/440))),panX:0,panY:15};updateView();}
  function choose(type){
    if(!itemOf(type)||!available(state(),type)||count(type)>=itemOf(type).quantity)return;
    selected=null;pending={type,x:4,y:4,rotation:0};paintInspector();paintPreview(pending);setNotice('Chạm một ô trống để đặt. Kéo đồ đã đặt để di chuyển.');
  }
  function apply(p){
    const error=placementError(state(),draft,p);if(error){setNotice(error,true);return false;}
    const previous=current();
    if(p.id&&previous&&previous.x===p.x&&previous.y===p.y&&previous.rotation===p.rotation)return true;
    remember();const r=placeItem(state(),draft,p.type,p.x,p.y,p.rotation,p.id||null);
    if(r.error){history.pop();setNotice(r.error,true);return false;}
    selected=r.item.id;pending=null;paintPieces();setNotice('Đã đặt. Nhấn Lưu khi bạn hài lòng.');return true;
  }
  function pause(){
    const previous=drag;drag=null;pinch=null;pointers.clear();
    if(previous){try{viewport?.releasePointerCapture(previous.pointer);}catch{}}
    root?.querySelector('.is-moving')?.classList.remove('is-moving');paintPreview();
  }
  function requestExit(destination='island'){
    pause();exitPage=destination;
    if(dirty())onDialog('discard',`<div class="editor-discard-art">${icon('island',44)}</div><p class="modal-intro">Bố cục mới chưa được lưu. Bạn có thể quay lại chỉnh tiếp hoặc bỏ thay đổi để rời đảo.</p><div class="result-buttons"><button class="btn primary" data-action="close-modal">Chỉnh tiếp</button><button class="btn secondary" data-action="island-edit-discard">Bỏ thay đổi</button></div>`);
    else{end();onExit(destination);}
  }
  function sync(){
    pause();events?.abort();observer?.disconnect();root=document.querySelector('.island-editor');
    if(!root)return;
    viewport=root.querySelector('.editor-viewport');world=root.querySelector('.editor-world');events=new AbortController();const signal=events.signal;
    if(!view)view={zoom:Math.max(.68,Math.min(1.1,viewport.clientWidth/1000)),panX:0,panY:12};updateView();paintInspector();if(pending)paintPreview(pending);
    observer=new ResizeObserver(updateView);observer.observe(viewport);
    viewport.addEventListener('contextmenu',e=>e.preventDefault(),{signal});
    viewport.addEventListener('wheel',e=>{e.preventDefault();pause();zoomTo(view.zoom+(e.deltaY<0?.12:-.12),e.clientX,e.clientY);},{signal,passive:false});
    viewport.addEventListener('pointerdown',e=>{
      if(e.button!==0||document.querySelector('#game-dialog[open]'))return;e.preventDefault();viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){root.querySelector('.is-moving')?.classList.remove('is-moving');drag=null;paintPreview();const a=[...pointers.values()];pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),zoom:view.zoom};return;}
      const el=e.target.closest?.('[data-layout-id]'),p=el?draft.placed.find(p=>p.id===el.dataset.layoutId):null;
      const pos=gridPoint(e);
      if(pending)drag={mode:'new',original:{...pending},...pending};
      else if(p){selected=p.id;drag={mode:'item',original:{...p},...p};paintInspector();}
      else{selected=null;drag={mode:'pan',panX:view.panX,panY:view.panY};paintInspector();}
      Object.assign(drag,{pointer:e.pointerId,startX:e.clientX,startY:e.clientY,grid:pos,moved:false});
    },{signal});
    viewport.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pinch&&pointers.size===2){const a=[...pointers.values()],distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch.distance>0)zoomTo(pinch.zoom*distance/pinch.distance,(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);return;}
      if(!drag||e.pointerId!==drag.pointer)return;
      if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6)drag.moved=true;
      if(drag.mode==='pan'){view.panX=drag.panX+e.clientX-drag.startX;view.panY=drag.panY+e.clientY-drag.startY;updateView();return;}
      if(!drag.moved&&drag.mode==='item')return;
      const pos=gridPoint(e),size=sizeOf(drag);
      drag.x=drag.mode==='new'?Math.round(pos.x-(size.w-1)/2):drag.original.x+Math.round(pos.x-drag.grid.x);
      drag.y=drag.mode==='new'?Math.round(pos.y-(size.h-1)/2):drag.original.y+Math.round(pos.y-drag.grid.y);
      if(drag.mode==='item')root.querySelector(`[data-layout-id="${drag.id}"]`)?.classList.add('is-moving');paintPreview(drag);
    },{signal,passive:false});
    viewport.addEventListener('pointerup',e=>{
      pointers.delete(e.pointerId);
      if(pinch){pinch=null;drag=null;pointers.clear();return;}
      if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();const ended=drag;drag=null;
      root.querySelector('.is-moving')?.classList.remove('is-moving');
      if(ended.mode==='new'&&!ended.moved){const pos=gridPoint(e),size=sizeOf(ended);ended.x=Math.round(pos.x-(size.w-1)/2);ended.y=Math.round(pos.y-(size.h-1)/2);}
      if(ended.mode==='new'||ended.mode==='item'&&ended.moved)apply({...(ended.id?{id:ended.id}:{}),type:ended.type,x:ended.x,y:ended.y,rotation:ended.rotation});
      else if(ended.mode==='item')setNotice('Kéo để dời · Xoay để đổi hướng · Cất để trả về kho');
      paintPreview();try{viewport.releasePointerCapture(e.pointerId);}catch{}
    },{signal});
    viewport.addEventListener('pointercancel',pause,{signal});viewport.addEventListener('lostpointercapture',e=>{if(drag?.pointer===e.pointerId)pause();},{signal});
    viewport.addEventListener('keydown',e=>{
      const id=e.target.closest?.('[data-layout-id]')?.dataset.layoutId;
      if(id&&['Enter',' '].includes(e.key)){e.preventDefault();pending=null;selected=id;paintInspector();return;}
      const p=current(),steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(p&&steps[e.key]){e.preventDefault();const [dx,dy]=steps[e.key];apply({...p,x:p.x+dx,y:p.y+dy});}
    },{signal});
  }
  function action(name,data={}){
    if(!draft)return;
    if(name==='island-edit-catalog')openCatalog();
    else if(name==='island-edit-category'){if(CATEGORIES.some(([id])=>id===data.id)){category=data.id;openCatalog();}}
    else if(name==='island-edit-choose')choose(data.id);
    else if(name==='island-edit-exit')requestExit();
    else if(name==='island-edit-discard'){const destination=exitPage;end();onExit(destination);}
    else if(name==='island-edit-save'){pause();const r=onSave(clone(draft));if(r?.error)setNotice(r.error,true);}
    else if(name==='island-edit-zoom-in')zoomTo(view.zoom+.15);
    else if(name==='island-edit-zoom-out')zoomTo(view.zoom-.15);
    else if(name==='island-edit-overview')fit();
    else if(name==='island-edit-rotate'){if(pending){pending.rotation=1-pending.rotation;paintPreview(pending);paintInspector();}else if(current())apply({...current(),rotation:1-current().rotation});}
    else if(name==='island-edit-store'){if(pending){pending=null;paintPreview();paintInspector();setNotice('Đã hủy đặt đồ.');}else if(current()){remember();storeItem(draft,selected);selected=null;paintPieces();setNotice('Đã cất về kho. Bạn có thể đặt lại bất cứ lúc nào.');}}
    else if(name==='island-edit-undo'&&history.length){pause();future.push(clone(draft));draft=history.pop();selected=null;pending=null;paintPieces();setNotice('Đã hoàn tác một bước.');}
    else if(name==='island-edit-redo'&&future.length){pause();history.push(clone(draft));draft=future.pop();selected=null;pending=null;paintPieces();setNotice('Đã làm lại một bước.');}
  }
  return {begin,end,html,sync,pause,action,requestExit,active:()=>!!draft,back:()=>{if(pending){pending=null;paintPreview();paintInspector();setNotice('Đã hủy chọn món đồ.');}else requestExit();}};
}
