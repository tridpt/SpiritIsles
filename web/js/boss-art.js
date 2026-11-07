import { guardianArt } from './guardian-art.js';

let serial=0;
export function bossArt(boss='treant',phase=1,mechanics={}){
  if(boss==='treant')return guardianArt(phase);
  const id=`boss-${++serial}`,ice=boss==='frost',hot=phase===3;
  const palette=ice?['#edfaff','#9dd9e9','#4386ac','#234563']:['#fff2be','#edb168','#ce684b','#793c4c'];
  const defs=`<defs><linearGradient id="${id}-body" x1="140" y1="120" x2="255" y2="300" gradientUnits="userSpaceOnUse"><stop stop-color="${palette[0]}"/><stop offset=".48" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient><linearGradient id="${id}-wing" x1="100" y1="60" x2="165" y2="250" gradientUnits="userSpaceOnUse"><stop stop-color="${palette[1]}"/><stop offset=".55" stop-color="${palette[2]}"/><stop offset="1" stop-color="${palette[3]}"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="${palette[0]}"/><stop offset=".4" stop-color="${palette[1]}" stop-opacity=".5"/><stop offset="1" stop-color="${palette[2]}" stop-opacity="0"/></radialGradient></defs>`;
  const background=`<ellipse cx="200" cy="329" rx="118" ry="14" fill="${palette[3]}" opacity=".18"/><circle class="boss-halo" cx="202" cy="188" r="132" fill="url(#${id}-glow)" opacity="${hot?.7:.35}"/><circle cx="202" cy="188" r="128" stroke="${palette[1]}" stroke-opacity=".22" stroke-dasharray="3 13"/>`;
  let shape;
  if(ice){
    const wing=`<path d="M178 206C134 165 105 103 39 64l14 82-26 35 60 1 30 43 19-27 42 8Z" fill="url(#${id}-wing)" stroke="#5489a5" stroke-width="2"/><path d="m39 64 48 118 49 16m-83-52 83 52-31-95m31 95 42 8" stroke="#bfeaf4" stroke-width="3" opacity=".7"/><path d="m39 64 21 27-7 55m34 36-25-48m55 91 1-37" stroke="#e0f8fb" stroke-width="2"/>`;
    shape=`<g class="boss-wings">${wing}<g transform="translate(400 0) scale(-1 1)">${wing}</g></g>
      <path d="M233 273c57 5 65 51 103 23-1 28-28 41-55 26l-55-24" fill="url(#${id}-body)" stroke="#5386a2" stroke-width="2"/>
      <path d="m323 312 12-28 15 13-6 23" fill="#bde9f5" stroke="#6fadc9" stroke-width="2"/>
      <path d="M176 171c-19 32-37 65-28 104 11 41 90 48 108 6 14-34-5-86-35-111" fill="url(#${id}-body)" stroke="#5188a5" stroke-width="2.5"/>
      <path d="M195 194c-20 26-26 62-11 89 9 16 29 17 40 1 17-27 0-61-13-89" fill="#e3f3f3" opacity=".8"/>
      <path d="m181 218 35 5m-40 13 45 4m-44 13 47 3m-42 13 39 1" stroke="#9bc6d4" stroke-width="2"/>
      <path d="m154 245-26 22 11 16 24-20m85-18 24 19-9 18-22-20" fill="url(#${id}-body)" stroke="#5386a2" stroke-width="3"/>
      <path d="m159 277-18 33 24 6 15-24m56-15 17 32-25 6-13-23" fill="url(#${id}-body)" stroke="#5386a2" stroke-width="3"/>
      <path d="m141 311 9-7 5 9 8-5m66 5 5-9 8 7 8-4" stroke="#f3ffff" stroke-width="4" stroke-linecap="round"/>
      <path d="m171 135-10-51 24 30m38 16 21-48-4 53" fill="#c7edf7" stroke="#66a4bf" stroke-width="2"/>
      <path d="m189 110 10-40 15 38-5 21" fill="#edfaff" stroke="#75afc8" stroke-width="2"/>
      <path d="M165 129c5-23 65-24 73 5l-2 32-20 31-28 2-27-29 4-41Z" fill="url(#${id}-body)" stroke="#548ba5" stroke-width="2.5"/>
      <path d="m163 149-16-10 3 28 19 7m67-25 17-12-2 29-19 9" fill="#a2d7e6" stroke="#639fba" stroke-width="2"/>
      <path d="m174 143 16 3m23 0 15-4" stroke="#375670" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="181" cy="154" rx="6" ry="8" fill="#29455d"/><ellipse cx="220" cy="154" rx="6" ry="8" fill="#29455d"/><circle cx="183" cy="151" r="2" fill="#fff"/><circle cx="222" cy="151" r="2" fill="#fff"/>
      <path d="m181 178 19 8 20-9" stroke="#46718a" stroke-width="3" stroke-linecap="round"/><path d="m190 181 3 7 4-5m10 0 3 5 3-8" fill="#fff"/>
      <g class="boss-crystals" fill="#d9f5fd" stroke="#8bc7dd"><path d="m97 267 6-23 9 22-7 19Z"/><path d="m299 218 7-29 10 27-9 17Z"/><path d="m77 111 5-17 7 16-6 11Z"/><path d="m286 84 7-23 8 23-7 14Z"/></g>`;
  }else{
    const feathers=Array.from({length:7},(_,i)=>`<path d="M183 ${166+i*5}Q${94-i*8} ${132+i*11} ${42+i*5} ${54+i*24}Q${56+i*7} ${211+i*9} ${177+i*2} ${221+i*3}Z" fill="${['#f0bd70','#dd9660','#e7a55e','#d98152','#d47550','#b95f4f','#a55551'][i]}" stroke="#9f5a48" stroke-width="1.4"/><path d="M${56+i*5} ${83+i*24}Q${98+i*3} ${169+i*9} 183 ${201+i*4}" stroke="#ffe0a0" stroke-width="2" opacity=".65"/>`).join('');
    shape=`<g class="boss-wings">${feathers}<g transform="translate(400 0) scale(-1 1)">${feathers}</g></g>
      <g class="boss-tail" fill="url(#${id}-wing)" stroke="#b57151" stroke-width="2"><path d="M188 249Q109 299 135 341q38-13 68-75"/><path d="M211 247q78 50 53 94-40-13-67-75"/><path d="M190 254q-17 56 11 97 27-48 9-95"/></g>
      <path d="m201 278-1 55m-14-62-38 52m66-52 37 52" stroke="#f8d58a" stroke-width="4" stroke-linecap="round"/>
      <path d="M179 151c-26 32-36 87-14 112 17 24 52 25 71 1 20-28 7-82-17-113Z" fill="url(#${id}-body)" stroke="#b8754e" stroke-width="2.5"/>
      <path d="M198 168c-20 32-21 68 3 90 22-27 20-57-3-90Z" fill="#fff0b2" opacity=".7"/>
      <circle class="boss-core-light" cx="201" cy="228" r="${hot?42:31}" fill="url(#${id}-glow)" opacity="${mechanics.coreHp===0?.15:1}"/>
      <path d="M202 207q-15 15-11 26 7 17 20 2 6-10-2-16l-4 10q-6-8-3-22Z" fill="${mechanics.coreHp===0?'#957c71':'#fff6c8'}" stroke="${mechanics.coreHp===0?'#ad8b76':'#e8b063'}" stroke-width="2"/>
      <path d="m182 263-8 24m42-24 10 24m-60 0h18m33 0h18" stroke="#a97149" stroke-width="5" stroke-linecap="round"/>
      <path d="M174 120q-2-21 11-30l14 24 14-26 10 29 15-9-8 33" fill="#e3a35e" stroke="#b5754e" stroke-width="2"/>
      <path d="M173 132c-2-26 54-28 57-1 5 23-5 40-28 48-25-9-33-25-29-47Z" fill="url(#${id}-body)" stroke="#b5754e" stroke-width="2"/>
      <path d="m176 132 17 7m17 0 17-8" stroke="#905b48" stroke-width="3" stroke-linecap="round"/><ellipse cx="185" cy="143" rx="5" ry="7" fill="#593e3b"/><ellipse cx="219" cy="143" rx="5" ry="7" fill="#593e3b"/><circle cx="187" cy="140" r="1.7" fill="#fff"/><circle cx="221" cy="140" r="1.7" fill="#fff"/>
      <path d="m201 147 10 10-10 14-9-14 9-10Z" fill="#bb7c47" stroke="#996047" stroke-width="1.5"/><path d="m201 150 2 9" stroke="#ffe4a1" stroke-width="2"/>
      <g class="boss-embers" fill="#ffe2a0">${[[74,222],[111,81],[312,267],[287,108],[158,48],[258,40]].map(([x,y],i)=>`<path d="m${x} ${y}q-9 13 0 20 9-7 0-20Z" opacity="${.5+i*.07}"/>`).join('')}</g>`;
  }
  return `<svg class="guardian-art guardian-phase-${phase} boss-art boss-${boss}" viewBox="0 0 400 360" fill="none" aria-hidden="true">${defs}${background}${shape}</svg>`;
}
