import { BY_ID } from './data.js';
import { icon } from './art.js';
import { careStatus, lifeProfile } from './island-care.js';
import { momentsFor, momentStatus } from './habitat-engine.js';
import { itemOf, layoutOf } from './island-layout.js';
import { islandActivities, islandPartners, cornerSpots, pairedCornerSpots, findWalkPath, ISLAND_OBSERVE_MS } from './island-autonomy.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const box=r=>({x:r.left,y:r.top,w:r.width,h:r.height});
const sweep=(a,b)=>({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.max(a.x+a.w,b.x+b.w)-Math.min(a.x,b.x),h:Math.max(a.y+a.h,b.y+b.h)-Math.min(a.y,b.y)});
const core=r=>({x:r.x+r.w*.2,y:r.y+r.h*.2,w:r.w*.6,h:r.h*.65});

// One small animation loop for the visible island. Positions are visual state only;
// timers use active time, so foregrounding never fast-forwards a sleeping pet.
export function createIslandLife({getState,onPat,onFeed,onInspect,onRecord,onBook}) {
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const pets=new Map();
  let scene=null,lobby=null,panel=null,observer=null,frame=0,last=0,time=0,selected=null,message='',drag=null,suppressUntil=0,reactionTimer=0;
  let bounds=null,obstacles=[],lastWidth=0,lastHeight=0,memory=null,visit=null,nextVisitAt=1600,visitorIndex=0,layoutKey='';
  const visits=new Map();
  const state=()=>getState();
  const petById=id=>state().pets.find(p=>p.id===id);
  const blocked=()=>!scene||!scene.isConnected||document.hidden||!!document.querySelector('#game-dialog[open],.habitat-scene');
  const motion=()=>state().settings.motion&&!media.matches;
  const rect=(p,x=p.x,y=p.y)=>({x:bounds.x+p.homeX+x,y:bounds.y+p.homeY+y,w:p.w,h:p.h+6});
  const member=p=>!!visit&&(visit.id===p.id||visit.partner?.id===p.id);
  const actors=()=>visit?[pets.get(visit.id),pets.get(visit.partner?.id)].filter(Boolean):[];
  const positioned=(p,positions)=>{const at=positions?.get(p.id)||p;return rect(p,at.x,at.y);};
  const pose=p=>{p.el.style.transform=`translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0)`;};
  function behavior(p,kind,duration) {
    p.kind=kind;p.until=time+duration;p.el.dataset.behavior=kind;
    p.el.querySelector('.pet-thought').textContent=kind==='nap'?'z Z':kind==='play'?'♫':kind==='sniff'?'?':'';
  }
  function canStand(p,x,y,positions=null) {
    const end=rect(p,x,y);
    if(end.x<8||end.x+end.w>innerWidth-8||end.y<bounds.y+bounds.h*.32||end.y+end.h>bounds.y+bounds.h*.9)return false;
    if(obstacles.some(o=>overlap(end,o)))return false;
    return ![...pets.values()].some(other=>other!==p&&overlap(core(end),core(positioned(other,positions))));
  }
  function clearPath(p,from,to,stationary=false,positions=null) {
    if(!canStand(p,to.x,to.y,positions))return false;
    const path=sweep(rect(p,from.x,from.y),rect(p,to.x,to.y));
    if(obstacles.some(o=>overlap(path,o)))return false;
    if(!member(p)&&memory&&!memory.hidden&&overlap(path,box(memory.getBoundingClientRect())))return false;
    return ![...pets.values()].some(other=>other!==p&&overlap(core(path),core(stationary?positioned(other,positions):sweep(rect(other),rect(other,other.tx,other.ty)))));
  }
  const allowed=(p,x,y)=>clearPath(p,p,{x,y});
  function configurationCorners(p,positions=null) {
    const origin={x:bounds.x+p.homeX,y:bounds.y+p.homeY},h=p.h+6;
    const blocks=obstacles.map(o=>({x:o.x-origin.x-p.w-.5,y:o.y-origin.y-h-.5,w:o.w+p.w+1,h:o.h+h+1}));
    for(const other of pets.values())if(other!==p){
      const o=core(positioned(other,positions));
      blocks.push({x:o.x-origin.x-p.w*.8-.5,y:o.y-origin.y-h*.85-.5,w:o.w+p.w*.6+1,h:o.h+h*.65+1});
    }
    return blocks.flatMap(o=>[{x:o.x,y:o.y},{x:o.x+o.w,y:o.y},{x:o.x,y:o.y+o.h},{x:o.x+o.w,y:o.y+o.h}]);
  }
  function route(p,goal,positions=null) {
    const points=configurationCorners(p,positions).filter(n=>canStand(p,n.x,n.y,positions));
    const path=findWalkPath({x:p.x,y:p.y},goal,points,(from,to)=>clearPath(p,from,to,true,positions));
    return path?{id:p.id,path}:null;
  }
  function planPair(p,a) {
    const guest=pets.get(a.partner.id);if(!guest)return null;
    const goals=pairedCornerSpots(a.decoration,bounds,p,guest).sort((a,b)=>
      Math.hypot(a.host.x-p.x,a.host.y-p.y)+Math.hypot(a.guest.x-guest.x,a.guest.y-guest.y)-Math.hypot(b.host.x-p.x,b.host.y-p.y)-Math.hypot(b.guest.x-guest.x,b.guest.y-guest.y));
    for(const goal of goals){
      const final=new Map([[p.id,goal.host],[guest.id,goal.guest]]);
      if(!canStand(p,goal.host.x,goal.host.y,final)||!canStand(guest,goal.guest.x,goal.guest.y,final))continue;
      if(!motion())return {...a,routes:[{id:p.id,path:[goal.host]},{id:guest.id,path:[goal.guest]}]};
      // One friend walks at a time. Plan the second route against the first
      // friend's parked position, so neither route crosses the other actor.
      for(const order of [[p,guest],[guest,p]]){
        const first=route(order[0],final.get(order[0].id));if(!first)continue;
        const second=route(order[1],final.get(order[1].id),new Map([[order[0].id,final.get(order[0].id)]]));
        if(second)return {...a,routes:[first,second]};
      }
    }
    return null;
  }
  function planVisit(p,buddyOnly=false) {
    const options=islandActivities(state(),p.id,[...pets.keys()]).filter(a=>!buddyOnly||a.partner).map(a=>({...a,seen:visits.get(`${p.id}:${a.moment.id}:${a.decoration.id}`)||0}));
    options.sort((a,b)=>Number(a.discovered)-Number(b.discovered)||a.seen-b.seen||Number(!!b.partner)-Number(!!a.partner)||Math.hypot(cornerSpots(a.decoration,bounds,p)[0].x-p.x,cornerSpots(a.decoration,bounds,p)[0].y-p.y)-Math.hypot(cornerSpots(b.decoration,bounds,p)[0].x-p.x,cornerSpots(b.decoration,bounds,p)[0].y-p.y));
    for(const a of options){
      if(a.partner){const pair=planPair(p,a);if(pair)return pair;continue;}
      const goals=cornerSpots(a.decoration,bounds,p).filter(n=>canStand(p,n.x,n.y)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      for(const goal of goals){
        const walk=route(p,goal);if(walk)return {...a,routes:[walk]};
      }
    }
    return null;
  }
  function endVisit(delay=7000) {
    for(const p of actors()){
      for(const key of ['habitatPose','lifeMoment','lifeDecoration','lifePartner','lifeRole','lifeStage','friendBeat'])delete p.el.dataset[key];
      p.el.style.removeProperty('--life-friend-side');p.el.querySelector('.pet-life-effects').textContent='';
      const pet=petById(p.id);if(pet)p.el.setAttribute('aria-label',`Chăm sóc ${BY_ID[pet.species].name}`);
      p.tx=p.x;p.ty=p.y;behavior(p,'idle',1800);
    }
    lobby?.querySelector('.island-picnic')?.remove();
    lobby?.querySelectorAll('.life-corner').forEach(el=>el.classList.remove('life-corner'));
    lobby?.querySelector('.life-hint-covered')?.classList.remove('life-hint-covered');
    visit=null;if(memory)memory.hidden=true;nextVisitAt=time+delay;
  }
  function arrive() {
    visit.stage='playing';visit.elapsed=0;visit.until=time+26000;
    paintVisit();paintMemory();
  }
  function paintVisit() {
    const m=visit.moment;
    for(const p of actors()){
      behavior(p,'habitat',Math.max(1,visit.until-time));
      p.el.dataset.lifeMoment=m.id;p.el.dataset.lifeDecoration=visit.decoration.id;p.el.dataset.habitatPose=m.pose;p.el.dataset.lifeStage='playing';
      if(visit.partner){p.el.dataset.lifePartner=p.id===visit.id?visit.partner.id:visit.id;p.el.dataset.lifeRole=p.id===visit.id?'host':'guest';}
      p.el.querySelector('.pet-thought').textContent=['nap','dream'].includes(m.pose)?'z Z':m.pose==='sniff'?'❀':'♪';
      p.el.querySelector('.pet-life-effects').textContent=m.pose==='bubbles'?'○  ◦  ○':['bloom','glide','dance','sniff'].includes(m.pose)?'✿  ·  ✧':m.pose==='aurora'?'✧  ✦  ✧':['warm','wonder'].includes(m.pose)?'✦  ·  ✦':'';
      const friend=actors().find(a=>a!==p);
      p.el.setAttribute('aria-label',`Chăm sóc ${BY_ID[petById(p.id).species].name} · ${m.name}${friend?` cùng ${BY_ID[petById(friend.id).species].name}`:''}`);
      if(friend)p.el.style.setProperty('--life-friend-side',rect(friend).x>rect(p).x?'1':'-1');
    }
    lobby.querySelector(`[data-layout-id="${visit.decoration.id}"]`)?.classList.add('life-corner');
    paintPair();
  }
  function paintPair() {
    if(!visit?.partner||visit.stage!=='playing')return;
    const beat=Math.floor(visit.elapsed/1600)%3;
    for(const p of actors()){
      p.el.dataset.friendBeat=String(beat);
      p.el.querySelector('.pet-thought').textContent=p.id===visit.id?['Mời bạn ♡','Hihi ♪','♡'][beat]:['Cho tớ à?','Ngon quá!','♡'][beat];
      p.el.querySelector('.pet-life-effects').textContent=beat===2?'♥ · ♥':'';
    }
    let prop=lobby.querySelector('.island-picnic');
    if(!prop){prop=document.createElement('div');prop.className='island-picnic';prop.setAttribute('aria-hidden','true');prop.innerHTML=`<i class="picnic-cloth"></i><span class="picnic-basket">${icon('berry',23)}</span><span class="picnic-share">${icon('berry',15)}</span>`;scene.append(prop);}
    const [a,b]=actors().map(p=>rect(p));
    prop.style.left=`${(a.x+a.w/2+b.x+b.w/2)/2-bounds.x}px`;prop.style.top=`${Math.max(a.y+a.h*.86,b.y+b.h*.86)-bounds.y}px`;
    prop.style.width=`${Math.abs(a.x+a.w/2-b.x-b.w/2)+Math.max(a.w,b.w)*.7}px`;
    prop.style.setProperty('--picnic-direction',a.x<b.x?'1':'-1');prop.dataset.beat=String(beat);
  }
  function paintJourney() {
    for(const p of actors()){
      p.el.dataset.lifeMoment=visit.moment.id;p.el.dataset.lifeDecoration=visit.decoration.id;
      if(visit.partner){p.el.dataset.lifePartner=p.id===visit.id?visit.partner.id:visit.id;p.el.dataset.lifeRole=p.id===visit.id?'host':'guest';}
      const walking=visit.routes[visit.routeIndex]?.id===p.id;
      p.el.dataset.lifeStage=walking?'walking':'waiting';
      if(walking)delete p.el.dataset.habitatPose;
      else if(visit.partner)p.el.dataset.habitatPose='waiting';
      p.el.querySelector('.pet-thought').textContent=visit.partner?(walking?'♪':visit.routes.slice(0,visit.routeIndex).some(r=>r.id===p.id)?'Ở đây nè!':'Chờ tớ!'):'';
    }
  }
  function nextRoute() {
    while(visit.routeIndex<visit.routes.length){
      const route=visit.routes[visit.routeIndex],p=pets.get(route.id);
      if(!motion()){
        const goal=route.path.at(-1);p.x=p.tx=goal.x;p.y=p.ty=goal.y;pose(p);route.path=[];
      }
      while(route.path.length&&Math.hypot(route.path[0].x-p.x,route.path[0].y-p.y)<=.1)route.path.shift();
      if(route.path.length){p.tx=route.path[0].x;p.ty=route.path[0].y;behavior(p,'walk',0);paintJourney();return;}
      behavior(p,'idle',30000);visit.routeIndex++;
    }
    arrive();
  }
  function beginVisit(p,plan) {
    clearTimeout(reactionTimer);for(const a of pets.values())a.el.classList.remove('life-reaction');
    visit={...plan,decoration:{...plan.decoration},id:p.id,stage:'walking',routeIndex:0,elapsed:0,ready:false,recorded:false};
    visits.set(`${p.id}:${plan.moment.id}:${plan.decoration.id}`,time+1);
    for(const a of actors()){
      a.el.dataset.lifeMoment=plan.moment.id;a.el.dataset.lifeDecoration=plan.decoration.id;
      if(plan.partner){a.el.dataset.lifePartner=a.id===p.id?plan.partner.id:p.id;a.el.dataset.lifeRole=a.id===p.id?'host':'guest';}
    }
    for(const a of pets.values()){a.tx=a.x;a.ty=a.y;behavior(a,'idle',2400+a.index*400);}
    nextRoute();
  }
  function validVisit() {
    if(!visit||!pets.has(visit.id)||visit.partner&&!pets.has(visit.partner.id))return false;
    const s=momentStatus(state(),visit.id,visit.moment.id,visit.decoration.id,visit.partner?.id);
    return s.canPlay&&layoutOf(state()).placed.some(p=>p.id===visit.decoration.id&&p.type===visit.decoration.type&&p.x===visit.decoration.x&&p.y===visit.decoration.y&&p.rotation===visit.decoration.rotation);
  }
  function paintMemory() {
    if(!memory)return;
    memory.hidden=!visit||visit.stage!=='playing'||blocked()||!!selected;
    if(memory.hidden)return;
    const s=momentStatus(state(),visit.id,visit.moment.id,visit.decoration.id,visit.partner?.id),known=s.discovered,ready=visit.elapsed>=ISLAND_OBSERVE_MS;
    const names=`${BY_ID[s.pet.species].name}${s.partner?` & ${BY_ID[s.partner.species].name}`:''}`;
    const action=known&&!visit.recorded?'island-memory-open':'island-memory-record';
    const note=visit.note||(known?'Đã có trong Sổ Kỷ Niệm':ready?'Ghi kỷ niệm mới':s.partner?'Cùng ngắm hai người bạn…':'Cùng ngắm bạn nhỏ…');
    memory.innerHTML=`<button data-action="${action}" data-id="${visit.id}" data-moment="${visit.moment.id}" ${s.partner?`data-partner="${s.partner.id}"`:''} aria-label="${known?'Xem':'Ghi'} kỷ niệm ${visit.moment.name} của ${names}" ${visit.recorded||!known&&!ready?'disabled':''}><span class="island-memory-token">${icon(visit.recorded?'check':known?'book':'camera',22)}</span><span class="island-memory-copy"><small>${names}${s.partner?'':` · ${itemOf(visit.decoration.type).name}`}</small><strong>${visit.moment.name}</strong><em role="status">${note}</em></span><i class="island-memory-progress" aria-hidden="true"><b style="width:${Math.min(100,visit.elapsed/ISLAND_OBSERVE_MS*100)}%"></b></i></button>`;
    memory.dataset.ready=String(ready);memory.dataset.recorded=String(known);placeMemory();
  }
  function placeMemory() {
    if(!memory||!bounds||!visit||visit.stage!=='playing'||blocked()||selected)return;
    memory.hidden=false;
    lobby.querySelector('.life-hint-covered')?.classList.remove('life-hint-covered');
    memory.classList.remove('compact','in-hint-slot');memory.style.width='';memory.style.height='';
    const p=pets.get(visit.id);if(!p)return;
    const r=rect(p),lb=box(lobby.getBoundingClientRect()),w=memory.offsetWidth,h=memory.offsetHeight;
    const xs=[r.x+r.w/2-w/2,r.x-w-8,r.x+r.w+8],ys=[r.y-h-9,r.y+r.h+8,r.y+r.h/2-h/2];
    for(const o of obstacles)ys.push(o.y+o.h+4,o.y-h-4);
    xs.push((innerWidth-w)/2);
    const choices=ys.flatMap(y=>xs.map(x=>({x:clamp(x,8,innerWidth-w-8),y:clamp(y,lb.y+100,lb.y+lb.h-h-8),w,h})));
    // Small displays have more space above the island than beside its actors.
    for(let y=lb.y+110;y<lb.y+lb.h-h-8;y+=18)choices.push({x:clamp(r.x+r.w/2-w/2,8,innerWidth-w-8),y,w,h});
    const coversActor=(b,a)=>visit.partner&&member(a)?overlap(b,rect(a))||overlap(b,box(a.el.querySelector('.pet-thought').getBoundingClientRect())):overlap(b,core(rect(a)));
    const free=choices.filter(b=>!obstacles.some(o=>overlap(b,o))&&![...pets.values()].some(a=>coversActor(b,a)));
    let at=free.sort((a,b)=>Math.hypot(a.x+w/2-(r.x+r.w/2),a.y+h/2-(r.y+r.h/2))-Math.hypot(b.x+w/2-(r.x+r.w/2),b.y+h/2-(r.y+r.h/2)))[0];
    const hint=lobby.querySelector('.lobby-habitat-hint');
    if(!at&&hint){
      at=box(hint.getBoundingClientRect());hint.classList.add('life-hint-covered');memory.classList.add('in-hint-slot');memory.style.width=`${at.w}px`;memory.style.height=`${at.h}px`;
    }
    if(!at){
      memory.classList.add('compact');
      const size=44,spots=[.65,.4,.85].flatMap(y=>[.5,.25,.75].map(x=>({x:clamp(r.x+r.w*x-size/2,8,innerWidth-size-8),y:r.y+p.h*y-size/2,w:size,h:size})));
      at=spots.find(b=>!obstacles.some(o=>overlap(b,o))&&![...pets.values()].some(a=>a!==p&&overlap(b,core(rect(a)))));
    }
    if(!at){memory.hidden=true;return;}
    memory.style.left=`${at.x-lb.x}px`;memory.style.top=`${at.y-lb.y}px`;
  }
  function invite(id,buddyOnly=false) {
    const p=pets.get(id);if(!p||blocked())return;
    endVisit();layout();const plan=planVisit(p,buddyOnly);
    if(!plan){
      const s=momentStatus(state(),id,'picnic-friends');
      message=!buddyOnly?'Chưa có chỗ trống cạnh đồ trang trí phù hợp. Chỉnh đảo hoặc mở Sổ Kỷ Niệm để rủ chơi nhé.':!s.canPlay?s.reasons.join(' '):!islandPartners(state(),id,[...pets.keys()]).length?'Đưa một bạn khác hệ, ít nhất 10 gắn bó vào đội hình để cùng picnic nhé.':'Cần chỗ trống cho cả hai cạnh ghế. Chỉnh đảo để các bạn tới chơi nhé.';
      paintPanel();return;
    }
    cancelDrag();selected=null;message='';paintPanel();beginVisit(p,plan);start();
  }
  function record(id,momentId) {
    if(blocked()||selected||!visit||visit.id!==id||visit.moment.id!==momentId||visit.stage!=='playing'||visit.elapsed<ISLAND_OBSERVE_MS||visit.recorded)return;
    if(!validVisit()){endVisit();return;}
    const r=onRecord(id,momentId,visit.decoration.id,visit.partner?.id);
    visit.recorded=!r.error;visit.note=r.error||(r.isNew?`Đã ghi${r.gained?` · +${r.gained} gắn bó`:' · tình bạn trọn vẹn'}`:'Kỷ niệm đã có trong sổ');visit.until=time+5000;paintMemory();
  }
  function destination(p) {
    for(let i=0;i<28;i++) {
      const x=(Math.random()-.5)*Math.min(bounds.w*.22,150),y=(Math.random()-.5)*Math.min(bounds.h*.16,70);
      if(Math.hypot(x-p.x,y-p.y)>12&&allowed(p,x,y)){p.tx=x;p.ty=y;return true;}
    }
    return false;
  }
  function layout() {
    if(!scene?.isConnected)return;
    bounds=box(scene.getBoundingClientRect());
    const resized=lastWidth!==bounds.w||lastHeight!==bounds.h;
    lastWidth=bounds.w;lastHeight=bounds.h;
    obstacles=[...lobby.querySelectorAll('.map-hotspot,.island-edit-entry,.island-shortcut,.lobby-activity,.lobby-dojo,.lobby-awakening,.lobby-bottom>:not(.lobby-cozy-actions),.lobby-cozy-actions>button,.lobby-location,.firefly')].map(el=>box(el.getBoundingClientRect()));
    const key=JSON.stringify(layoutOf(state()));
    if(resized||layoutKey!==key)endVisit(600);layoutKey=key;
    for(const p of pets.values()) {
      const style=getComputedStyle(p.el);
      p.homeX=parseFloat(style.left);p.homeY=parseFloat(style.top);p.w=parseFloat(style.width);p.h=parseFloat(style.height);
      if(resized){p.x=0;p.y=0;p.tx=0;p.ty=0;behavior(p,'idle',800+p.index*600);}
      pose(p);
    }
    // A moved building label may occupy a pet's former spot. Start on nearby
    // clear grass so its first walking path is not trapped inside the label.
    const offsets=[0,-12,12,-24,24,-36,36,-48,48,-60,60,-78,78,-96,96,-120,120];
    for(const p of pets.values())if(!canStand(p,p.x,p.y)){
      const candidates=[...offsets.flatMap(x=>offsets.filter(y=>Math.abs(y)<=70).map(y=>({x,y}))),...configurationCorners(p).flatMap(n=>[n,{x:p.x,y:n.y},{x:n.x,y:p.y}])].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      const free=candidates.find(({x,y})=>canStand(p,x,y));
      if(free){p.x=p.tx=free.x;p.y=p.ty=free.y;behavior(p,'idle',800+p.index*600);pose(p);}
    }
    placePanel();placeMemory();
  }
  function paintPanel() {
    if(!panel)return;
    const pet=petById(selected);
    panel.hidden=!pet||blocked();
    for(const p of pets.values()){p.el.classList.toggle('life-selected',p.id===selected);p.el.setAttribute('aria-expanded',String(p.id===selected));}
    if(panel.hidden)return;
    const s=BY_ID[pet.species],status=careStatus(pet),cost=8+pet.level*2;
    const ready=momentsFor(s).map(m=>momentStatus(state(),pet.id,m.id)).filter(m=>m.canPlay&&!m.discovered).length;
    const note=message||(status.full?'Tình bạn đã trọn vẹn ♥':!status.remaining?'Đã nhận đủ 3 gắn bó hôm nay':status.wait?`Đang vui lắm · thêm gắn bó sau ${Math.ceil(status.wait/60000)} phút`:`Vuốt ve +1 gắn bó · còn ${status.remaining}/3 hôm nay`);
    panel.innerHTML=`<div class="island-care-heading"><div><strong>${s.name}</strong><small>${lifeProfile(s).trait} · ${icon('heart',11)} ${pet.bond}/100</small></div><button data-action="island-care-close" aria-label="Đóng chăm sóc">${icon('close',15)}</button></div><p class="island-care-message" role="status">${note}</p><div class="island-care-actions"><button data-action="island-pat" data-id="${pet.id}" aria-label="Vuốt ve ${s.name}">${icon('heart',20)}<span>Vuốt ve</span></button><button class="island-food" data-action="island-feed" data-id="${pet.id}" aria-label="Cho ${s.name} ăn, ${cost} quả mọng" ${pet.level>=30||state().resources.food<cost?'disabled':''}>${icon('berry',21)}<span>${pet.level>=30?'Cấp tối đa':`Cho ăn · ${cost}`}</span></button><button data-action="island-inspect" data-id="${pet.id}" aria-label="Xem chi tiết ${s.name}">${icon('paw',20)}<span>Xem thú</span></button></div><div class="island-care-outings"><button class="island-care-invite" data-action="island-invite" data-id="${pet.id}" aria-label="Đưa ${s.name} tới góc chơi trên đảo">${icon('leaf',17)}<span>Đến góc chơi</span></button><button class="island-care-invite island-care-friend" data-action="island-invite-friend" data-id="${pet.id}" aria-label="Rủ bạn picnic cùng ${s.name}">${icon('heart',17)}<span>Rủ bạn picnic</span></button></div><button class="island-care-play" data-action="habitat-open" data-id="${pet.id}" aria-label="Rủ ${s.name} chơi với đồ trang trí">${icon('book',17)} ${ready?`Sổ kỷ niệm · ${ready} mới`:'Sổ Kỷ Niệm'}</button><small class="island-care-hint">${pet.level>=30?'Bạn nhỏ đã đạt cấp 30':state().resources.food<cost?'Hết quả mọng rồi, ghé vườn thu hoạch nhé':'Giữ quả mọng, kéo đến bạn nhỏ để cho ăn'}</small>`;
    placePanel();
  }
  function placePanel() {
    if(!panel||panel.hidden||!bounds)return;
    const p=pets.get(selected);if(!p)return;
    const actor=rect(p),lb=lobby.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight;
    panel.style.left=`${clamp(actor.x+actor.w/2-lb.left-w/2,8,lb.width-w-8)}px`;
    panel.style.top=`${clamp(actor.y-lb.top-h-12,112,lb.height-h-12)}px`;
  }
  function stop() {cancelAnimationFrame(frame);frame=0;last=0;}
  function start() {
    stop();if(!lobby)return;
    const active=!blocked()&&!selected&&(motion()||!!visit);
    lobby.dataset.islandLife=blocked()?'paused':selected?'interacting':motion()?'roaming':'still';
    lobby.classList.toggle('island-life-still',!motion());
    lobby.classList.toggle('island-life-paused',blocked());
    if(memory&&(blocked()||selected||!visit||visit.stage!=='playing'))memory.hidden=true;
    if(active)frame=requestAnimationFrame(animate);
  }
  function animate(at) {
    frame=0;if(blocked()||selected||!motion()&&!visit){start();return;}
    if(last&&at-last<40){frame=requestAnimationFrame(animate);return;}
    const dt=last?Math.min(at-last,80):0;last=at;time+=dt;
    if(visit&&(!validVisit()||visit.stage==='walking'&&!motion()))endVisit();
    if(!visit&&motion()&&time>=nextVisitAt){
      const list=[...pets.values()];
      for(let i=0;i<list.length;i++){const p=list[(visitorIndex+i)%list.length],plan=planVisit(p);if(plan){visitorIndex=(p.index+1)%list.length;beginVisit(p,plan);break;}}
      if(!visit)nextVisitAt=time+8000;
    }
    if(visit?.stage==='playing'){
      visit.elapsed+=dt;
      const progress=memory?.querySelector('.island-memory-progress>b');if(progress)progress.style.width=`${Math.min(100,visit.elapsed/ISLAND_OBSERVE_MS*100)}%`;
      if(!visit.ready&&visit.elapsed>=ISLAND_OBSERVE_MS){visit.ready=true;paintMemory();}
      if(visit.partner&&actors().some(p=>p.el.dataset.friendBeat!==String(Math.floor(visit.elapsed/1600)%3)))paintPair();
      if(time>=visit.until&&!actors().some(p=>p.el.matches(':hover,:focus-visible'))&&!memory?.matches(':hover,:focus-within'))endVisit();
    }
    for(const p of pets.values()) {
      if(member(p)&&(visit.stage==='playing'||visit.routes[visit.routeIndex]?.id!==p.id))continue;
      if(p.el.matches(':hover,:focus-visible')||p.pressed)continue;
      if(p.kind==='walk') {
        const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),step=p.profile.speed*(member(p)?2.4:1)*dt/1000;
        if(d<=step){p.x=p.tx;p.y=p.ty;if(member(p)){const route=visit.routes[visit.routeIndex];route.path.shift();nextRoute();}else behavior(p,'idle',2000+Math.random()*2500);}
        else {p.x+=dx/d*step;p.y+=dy/d*step;p.el.style.setProperty('--life-facing',dx<0?'-1':'1');}
        pose(p);
      } else if(time>=p.until) {
        const roll=Math.random();
        if(roll<.62&&motion()&&visit?.stage!=='walking'&&destination(p))behavior(p,'walk',0);
        else if(roll<.78)behavior(p,'nap',4500+Math.random()*4000);
        else behavior(p,roll<.9?'play':'sniff',2000+Math.random()*1800);
      }
    }
    frame=requestAnimationFrame(animate);
  }
  function cancelDrag() {
    if(drag){const previous=drag;drag=null;try{previous.button.releasePointerCapture(previous.pointer);}catch{}}
    document.querySelector('.island-food-ghost')?.remove();lobby?.classList.remove('island-food-dragging');
    for(const p of pets.values())p.el.classList.remove('life-drop-target');
  }
  function sync() {
    stop();cancelDrag();observer?.disconnect();
    lobby=document.querySelector('.game-lobby');scene=lobby?.querySelector('.island-scene');panel=lobby?.querySelector('#island-care');memory=lobby?.querySelector('#island-memory');
    if(!scene){visit=null;selected=null;pets.clear();visits.clear();lastWidth=0;nextVisitAt=time+1600;return;}
    const ids=new Set();
    [...scene.querySelectorAll('.island-pet')].forEach((el,index)=>{
      const id=el.dataset.id;ids.add(id);
      const p=pets.get(id)||{id,index,x:0,y:0,tx:0,ty:0,kind:'idle',until:time+800+index*600};
      p.el=el;p.profile=lifeProfile(BY_ID[petById(id).species]);p.pressed=false;p.index=index;pets.set(id,p);
      behavior(p,p.kind,Math.max(500,p.until-time));
    });
    for(const id of pets.keys())if(!ids.has(id))pets.delete(id);
    if(!pets.has(selected)||blocked())selected=null;
    if(visit&&!validVisit())endVisit();
    layout();if(visit?.stage==='playing')paintVisit();else if(visit)paintJourney();paintPanel();paintMemory();start();
    observer=new ResizeObserver(()=>{cancelDrag();layout();});observer.observe(scene);
    for(const el of lobby.querySelectorAll('.map-hotspot,.lobby-cozy-actions,.lobby-location'))observer.observe(el);
  }
  function close() {cancelDrag();endVisit();selected=null;message='';paintPanel();for(const p of pets.values())behavior(p,'idle',800+p.index*600);start();}
  function select(id) {
    if(!pets.has(id)||blocked())return;
    cancelDrag();endVisit();selected=id;message='';for(const p of pets.values()){p.tx=p.x;p.ty=p.y;behavior(p,'idle',1200);}
    paintPanel();start();
  }
  function react(id,text,kind) {
    const p=pets.get(id);if(!p)return;
    behavior(p,kind,1900);p.el.querySelector('.pet-reaction').textContent=text;p.el.classList.remove('life-reaction');
    void p.el.offsetWidth;p.el.classList.add('life-reaction');
    clearTimeout(reactionTimer);reactionTimer=setTimeout(()=>{for(const a of pets.values()){a.el.classList.remove('life-reaction');behavior(a,'idle',1200);}},1900);
  }
  function pat(id) {
    const r=onPat(id);if(r.error){message=r.error;paintPanel();return;}
    message=r.gained?'+1 gắn bó · Bạn nhỏ dụi đầu vào tay bạn':r.full?'Thân thiết tối đa, vẫn thích được vuốt ve ♥':!r.remaining?'Vẫn thích lắm! Mai lại thêm gắn bó nhé':`Đang rất vui! Thêm gắn bó sau ${Math.ceil(r.wait/60000)} phút`;
    react(id,r.gained?'+1 ♥':'♥','happy');paintPanel();
  }
  function feed(id) {
    const r=onFeed(id);if(r.error){message=r.error;paintPanel();return;}
    selected=id;message=r.leveled?`Lên cấp ${r.pet.level}! +3 gắn bó`:'Ngon quá! +35 XP · +3 gắn bó';
    react(id,'♥ +3','eat');paintPanel();start();
  }
  document.addEventListener('pointerdown',event=>{
    const target=event.target instanceof Element?event.target:null;if(!target||blocked())return;
    const food=target.closest('.island-food');
    if(food&&!food.disabled&&event.button===0&&event.isPrimary){drag={button:food,pointer:event.pointerId,x:event.clientX,y:event.clientY,moving:false};food.setPointerCapture(event.pointerId);return;}
    const actor=target.closest('.island-pet');if(actor){const p=pets.get(actor.dataset.id);if(p)p.pressed=true;}
    if(selected&&!target.closest('.island-care,.island-pet'))close();
  });
  document.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointer)return;
    if(!drag.moving&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<9)return;
    event.preventDefault();
    if(!drag.moving){drag.moving=true;lobby.classList.add('island-food-dragging');const ghost=document.createElement('div');ghost.className='island-food-ghost';ghost.innerHTML=icon('berry',30);ghost.setAttribute('aria-hidden','true');document.body.append(ghost);}
    const ghost=document.querySelector('.island-food-ghost');ghost.style.left=`${event.clientX}px`;ghost.style.top=`${event.clientY}px`;
    const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('.island-pet');
    for(const p of pets.values())p.el.classList.toggle('life-drop-target',hit===p.el);
  },{passive:false});
  document.addEventListener('pointerup',event=>{
    for(const p of pets.values())p.pressed=false;
    if(!drag||event.pointerId!==drag.pointer)return;
    const moved=drag.moving,hit=moved?document.elementFromPoint(event.clientX,event.clientY)?.closest('.island-pet'):null;
    if(moved){event.preventDefault();suppressUntil=performance.now()+700;}
    cancelDrag();
    if(moved){if(hit&&pets.has(hit.dataset.id))feed(hit.dataset.id);else{message='Kéo quả mọng đến đúng bạn nhỏ nhé';paintPanel();}}
  });
  document.addEventListener('pointercancel',()=>{for(const p of pets.values())p.pressed=false;cancelDrag();});
  document.addEventListener('lostpointercapture',event=>{if(drag?.pointer===event.pointerId)cancelDrag();});
  document.addEventListener('click',event=>{if(event.detail&&performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selected&&!document.querySelector('#game-dialog[open]')){event.preventDefault();close();}});
  media.addEventListener('change',sync);
  document.fonts.ready.then(()=>{if(scene?.isConnected){layout();paintPanel();paintMemory();}});
  return {sync,select,pat,feed,invite,record,book:(id,moment)=>onBook(id,moment),inspect:id=>{close();onInspect(id);},close,back:()=>{if(!selected&&!drag)return false;close();return true;},pause:()=>{stop();cancelDrag();clearTimeout(reactionTimer);if(memory)memory.hidden=true;if(lobby){lobby.dataset.islandLife='paused';lobby.classList.add('island-life-paused');}}};
}
