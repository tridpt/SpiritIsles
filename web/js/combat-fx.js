import { BY_ID,ELEMENTS } from './data.js';
import { icon,creature } from './art.js';
import { bossArt } from './boss-art.js';
import { castActors,castCaption } from './combat-team.js';
import { enemyTeamArt } from './combat-team-ui.js';

export function playCombatFx(result,action,mode='explore',members=[]){
  const arena=document.querySelector(mode==='boss'?'.guardian-arena':mode==='ruins'?'.ruins-arena':'.battle-arena');
  let host=arena||document.querySelector('.guardian-result,.journey-result,.ruins-blessing-room,.event-illustration');
  if(!host)return;
  document.querySelector('.combat-replay')?.remove();
  host.querySelectorAll('.combat-fx').forEach(e=>e.remove());
  const quiet=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduced-motion');
  const actors=castActors(action,result,members),actor=actors[0]?.id,element=BY_ID[actor]?.element||'light',el=ELEMENTS[element];
  const bounds=arena?.getBoundingClientRect();let replay=null;
  if(arena&&bounds&&(bounds.bottom<120||bounds.top>innerHeight-150)&&actor){
    replay=document.createElement('div');replay.className='combat-replay';replay.setAttribute('aria-hidden','true');
    const enemy=arena.querySelector('.ruins-combat-enemy [data-species],.battle-enemy [data-species]')?.dataset.species;
    const phase=Number(arena.querySelector('.guardian-art')?.getAttribute('class').match(/guardian-phase-(\d)/)?.[1])||1;
    const enemyMembers=[...arena.querySelectorAll('.combat-enemy-member')].map(e=>({id:e.dataset.enemy,species:e.dataset.enemySpecies,name:BY_ID[e.dataset.enemySpecies].name}));
    replay.innerHTML=`<span class="replay-caption">${castCaption(action,result,members)}</span><div class="replay-party" data-cast-count="${actors.length}">${actors.map(m=>creature(m.id,{source:m})).join('')}</div><div class="replay-enemy">${mode==='boss'?bossArt(arena.dataset.boss||'treant',phase):enemyMembers.length?enemyTeamArt(enemyMembers):enemy?creature(enemy):''}</div>`;
    document.body.append(replay);host=replay;
  }
  const fx=document.createElement('div');fx.className=`combat-fx ${quiet?'quiet':''} ${arena?'':'finisher'} fx-${element}`;fx.setAttribute('aria-hidden','true');
  fx.dataset.castCount=String(actors.length);
  fx.style.setProperty('--fx-color',el.color);
  const label=(className,text)=>{const item=document.createElement('span');item.className=className;item.textContent=text;fx.append(item);};
  if(result.damage>0)label('fx-number fx-damage',`−${result.damage}`);
  if(result.heal>0)label('fx-number fx-heal',`+${result.heal} HP`);
  if(result.ward>0||result.absorbed>0)label('fx-number fx-ward',result.ward?`+${result.ward} khiên`:`Chặn ${result.absorbed}`);
  if(result.incoming>0)label('fx-number fx-incoming',`−${result.incoming}`);
  if(result.combo)label('fx-combo',`✦ ${result.combo}`);
  else if(action==='skill')label('fx-combo',`HỢP LỰC · ${actors.length} THÚ`);
  else if(result.finished||result.won)label('fx-combo',result.result?.status==='defeat'||result.success===false?'Cả đội đã cố gắng!':'Vượt qua thử thách!');
  if(arena&&!quiet){
    const party=host.querySelector('.replay-party,.guardian-party,.ruins-combat-party,.battle-party');
    for(const [i,m]of actors.entries()){
      const element=ELEMENTS[BY_ID[m.id].element],projectile=document.createElement('i');projectile.className=action==='guard'?'fx-guard':`fx-projectile ${action==='attack'?'physical':'magical'}`;
      projectile.dataset.caster=m.id;projectile.style.setProperty('--fx-color',element.color);projectile.style.setProperty('--cast-offset',`${i*15}px`);projectile.style.animationDelay=`${i*65}ms`;projectile.innerHTML=icon(action==='guard'?'shield':element.icon,30);fx.prepend(projectile);
      const active=party?.querySelector(`[data-species="${m.id}"]`);
      if(active){active.classList.add('combat-acting');active.style.setProperty('--cast-color',element.color);active.style.setProperty('--cast-delay',`${i*65}ms`);setTimeout(()=>active.classList.remove('combat-acting'),850);}
    }
    if(result.damage){const impact=document.createElement('i');impact.className='fx-impact';fx.prepend(impact);}
  }
  host.append(fx);setTimeout(()=>{fx.remove();replay?.remove();},1800);
}
