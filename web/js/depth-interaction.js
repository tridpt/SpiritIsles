// Only an inspected creature responds to the pointer; the collection has no render loop.
export function enableCreatureViewing() {
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null;
  const allowed=()=>!media.matches&&!document.body.classList.contains('reduced-motion');
  const stageFor=target=>target instanceof Element?target.closest('[data-creature-stage]'):null;
  const pose=(stage,x,y)=>{
    stage.style.setProperty('--look-x',x.toFixed(3));
    stage.style.setProperty('--look-y',y.toFixed(3));
    stage.classList.toggle('is-viewing',Math.abs(x)+Math.abs(y)>.01);
  };
  const reset=()=>{if(active){pose(active,0,0);active=null;}};
  const move=event=>{
    if(!allowed()){reset();return;}
    const stage=stageFor(event.target);
    if(!stage||(event.pointerType!=='mouse'&&!stage.hasPointerCapture(event.pointerId)))return;
    if(active!==stage)reset();active=stage;
    const box=stage.getBoundingClientRect();
    pose(stage,Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1)),Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1)));
  };
  document.addEventListener('pointerdown',event=>{
    const stage=stageFor(event.target);if(!stage||!allowed()||event.button!==0)return;
    stage.setPointerCapture(event.pointerId);move(event);
  });
  document.addEventListener('pointermove',move);
  document.addEventListener('pointerup',reset);
  document.addEventListener('pointercancel',reset);
  document.addEventListener('pointerout',event=>{if(active&&(!(event.relatedTarget instanceof Node)||!active.contains(event.relatedTarget)))reset();});
  document.addEventListener('keydown',event=>{
    const stage=stageFor(event.target);if(!stage||!allowed())return;
    const directions={ArrowLeft:[-.8,0],ArrowRight:[.8,0],ArrowUp:[0,-.8],ArrowDown:[0,.8],Home:[0,0],Escape:[0,0]};
    if(!directions[event.key])return;
    if(event.key!=='Escape')event.preventDefault();
    if(active!==stage)reset();active=stage;pose(stage,...directions[event.key]);
  });
  document.addEventListener('focusout',event=>{if(active===event.target)reset();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  media.addEventListener('change',()=>{if(media.matches)reset();});
}
