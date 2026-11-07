import {shinyArt} from './shiny-art.js';
import {shinyOf} from './shiny.js';
import { BY_ID, SHINY_VARIANTS } from './data.js';
import { creatureShape, creatureSignature, rarityArt } from './creature-designs.js';
import { creatureVolume } from './creature-volume.js';
import { creatureFace } from './creature-faces.js';
import { AWAKENINGS, awakenedOf } from './awakening-data.js';
import { awakeningArt } from './awakening-art.js';
import {islandWorldArt,landscapeArt,eggWorldArt} from './world-art.js';

const paths={
  island:'M3 14l9-5 9 5-9 6-9-6Zm0 0v4l9 5 9-5v-4M12 9V2m0 0-4 5m4-5 4 5',
  egg:'M19 14c0 4-3 7-7 7s-7-3-7-7C5 9 9 2 12 2s7 7 7 12ZM8 14l3-3 3 3 3-3',
  paw:'M9 14c-2 2-4 4-2 6 1 1 3 0 5 0s4 1 5 0c2-2 0-4-2-6-2-2-4-2-6 0ZM6 7c-2 0-3 4-1 5 3 2 5-4 1-5Zm5-4c-3 0-3 7 0 7s3-7 0-7Zm6 1c-3 0-4 6-1 7s5-6 1-7Zm4 5c-2-1-5 4-2 5 2 1 5-4 2-5Z',
  compass:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5 5-3Z',
  build:'m14 4 6 6-4 4-6-6 4-4ZM12 10l-8 8 2 2 8-8M16 2l6 6M3 7h5M5 4v6',
  book:'M4 3h6l2 2 2-2h6v16h-6l-2 2-2-2H4V3Zm8 2v16M7 7h2m6 0h2M7 11h2m6 0h2',
  camera:'M3 7h4l2-3h6l2 3h4v13H3V7Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM18 10h.01',
  home:'m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7',
  settings:'m10 2-1 3-3 1-3-1-1 3 2 3v3l-2 2 2 3 3-1 2 1 1 3h4l1-3 3-1 3 1 1-3-2-2v-3l2-3-2-3-3 1-2-1-1-3h-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  coin:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM14 8h-3a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3m2-9v10',
  berry:'M8 9c-5 0-6 5-3 9 3 5 8 5 12 0 3-4 2-9-3-9M12 10c-1-4-5-5-7-4 1 3 4 4 7 4Zm0 0c1-5 4-7 8-7-1 4-4 7-8 7ZM9 14h.01M14 14h.01M12 18h.01',
  gem:'m7 3-5 6 10 13L22 9l-5-6H7Zm-5 6h20M7 3l5 19 5-19M7 9l5-6 5 6',
  wood:'m7 4 13 9-5 8L2 12l5-8Zm0 0c3 0 4 3 3 5s-5 4-8 3m13 9c-3-1-3-4-1-6s4-3 6-2M7 6 4 11m4 3 4 3',
  ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm12 0v2m0 3v2m0 3v4',
  sparkle:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Zm7 0v4m-2-2h4M4 18v4m-2-2h4',
  star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',
  heart:'M20 5c-4-4-8 1-8 1S8 1 4 5c-5 5 8 16 8 16S25 10 20 5Z',
  leaf:'M21 3C5 1 1 10 5 16s16 3 16-13ZM4 21 16 9m-5 5-1-5m5 1 4 1',
  drop:'M12 2C10 7 4 10 4 15a8 8 0 0 0 16 0c0-5-6-8-8-13Zm-4 13c0 2 1 3 3 3',
  flame:'M13 2c3 7-3 7-1 12 3-1 4-3 4-6 9 10 2 15-4 14C1 22 1 12 7 7c-1 5 1 5 1 5 0-4 4-5 5-10Z',
  wind:'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3',
  sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  moon:'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',
  arrow:'M4 12h16m-6-6 6 6-6 6',
  chevron:'m9 5 7 7-7 7',
  close:'m6 6 12 12M6 18 18 6',
  refresh:'M20 7v5h-5M4 17v-5h5M6 8a7 7 0 0 1 12-2l2 3M4 15l2 3a7 7 0 0 0 12-2',
  plus:'M12 5v14M5 12h14',
  check:'m5 12 4 4L19 6',
  lock:'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4',
  gift:'M3 8h18v5H3V8Zm2 5v8h14v-8M12 8v13m0-13C0 8 7-2 12 8Zm0 0c12 0 5-10 0 0Z',
  clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6v6l4 2',
  tree:'m12 2 7 8h-3l5 7h-7v5h-4v-5H3l5-7H5l7-8Z',
  waves:'M2 6c3-4 5 4 10 0s7 4 10 0M2 12c3-4 5 4 10 0s7 4 10 0M2 18c3-4 5 4 10 0s7 4 10 0',
  mountain:'m2 20 8-16 5 9 2-4 5 11H2ZM7 10l3 2 3-2',
  cloud:'M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13 1 5 5 0 0 1 0 9H6Z',
  shield:'M12 2 3 6v7c0 5 9 9 9 9s9-4 9-9V6l-9-4Zm-4 9 3 3 5-5',
  swords:'m3 3 15 15m-2-1-3 4m4-5 4-3M3 3l1 5 4-4-5-1Zm18 0L6 18m-1-2 4 4m12-17-1 5-4-4 5-1ZM3 21l4-4m14 4-4-4',
  chest:'M3 10h18v11H3V10Zm0 0V7c0-3 18-3 18 0v3M10 10v5h4v-5',
  volume:'m3 9 5 0 5-5v16l-5-5H3V9Zm14-2c4 3 4 7 0 10m2-13c6 4 6 12 0 16',
  download:'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5',
  upload:'M12 16V4m-4 4 4-4 4 4M4 16v5h16v-5',
  info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10h.01',
  bolt:'m13 2-9 12h7l-1 8L21 9h-8V2Z',
  trophy:'M7 3h10v7c0 7-10 7-10 0V3Zm0 2H3v3c0 4 4 4 4 4m10-7h4v3c0 4-4 4-4 4m-5 4v5m-5 0h10',
  map:'m3 5 6-3 6 3 6-3v17l-6 3-6-3-6 3V5Zm6-3v17m6-14v17',
  mail:'M3 5h18v14H3V5Zm0 0 9 8 9-8'
  ,fish:'M3 12c4-9 12-9 16 0-4 9-12 9-16 0Zm16 0 3-5v10l-3-5ZM8 10h.01M11 5l2-3 3 5m-5 12 2 3 3-5'
  ,sprout:'M12 22V11M12 14C2 14 2 5 3 3c8 0 10 5 9 11Zm0-3c0-7 5-9 10-8 0 6-3 10-10 8Z'
};
export function icon(name,size=20,extra='') {return `<svg class="icon ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.sparkle}"/></svg>`;}
let artIndex=0;
export function creature(id,options={}) {
  const base=BY_ID[id];if(!base)return '';
  const shiny=!!SHINY_VARIANTS[id]&&(options.shiny===true||options.shiny!==false&&shinyOf(options.source,id));
  const awake=!!AWAKENINGS[id]&&(options.awakened===true||options.awakened!==false&&awakenedOf(options.source,id));
  const awakened=awake?{...base,...AWAKENINGS[id],awakening:true}:base;
  const s=shiny&&SHINY_VARIANTS[id]?{...awakened,...SHINY_VARIANTS[id],id,shiny:true}:awakened;
  const {accent:a,shape}=s;const uid='pet'+(++artIndex);const fancy=s.rarity==='SSR';
  const volume=creatureVolume(s,uid);const c=volume.coat;
  let back='',body='',head='',details='';
  if(['fox','cat'].includes(shape)) {
    back=`<path d="M121 113Q173 116 155 64Q137 89 118 87" fill="${a}"/><path d="M151 66Q160 87 154 97L140 91Z" fill="#fff5de"/>`;
    if(fancy&&shape==='fox')back+=`<path d="M117 111Q170 88 142 38Q132 70 113 78M117 113Q175 147 171 94Q151 105 134 102M117 109Q127 69 114 34Q99 69 102 85" fill="${c}" stroke="${a}" stroke-width="1.5"/>`;
    body=`<ellipse cx="89" cy="112" rx="36" ry="30" fill="${c}"/><ellipse cx="82" cy="117" rx="22" ry="23" fill="#fff4df"/><ellipse cx="69" cy="138" rx="13" ry="7" fill="${a}"/><ellipse cx="108" cy="138" rx="13" ry="7" fill="${a}"/>`;
    head=`<path d="M53 64Q38 14 72 45Q89 35 104 45Q139 17 127 68" fill="${c}" stroke="${a}" stroke-width="1.5"/><path d="m51 42 6 22 13-12m38 0 13-13-1 25" fill="${a}"/><path d="M42 74Q39 45 86 45Q132 42 135 74Q135 102 89 110Q44 102 42 74" fill="${c}"/><path d="M47 81Q58 97 87 96Q118 96 130 80Q121 109 88 109Q56 104 47 81" fill="#fff4df"/>`;
    if(shape==='cat')details=`<path d="m83 48 4 11m8-11-4 11" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`;
  } else if(shape==='rabbit') {
    back=`<circle cx="126" cy="118" r="16" fill="#fff5e5"/>`;
    body=`<ellipse cx="88" cy="116" rx="35" ry="29" fill="${c}"/><ellipse cx="85" cy="120" rx="21" ry="22" fill="#fff2de"/><ellipse cx="64" cy="139" rx="16" ry="7" fill="${a}"/><ellipse cx="110" cy="139" rx="16" ry="7" fill="${a}"/>`;
    head=`<ellipse cx="66" cy="44" rx="14" ry="37" transform="rotate(-12 66 44)" fill="${c}"/><ellipse cx="107" cy="43" rx="14" ry="37" transform="rotate(12 107 43)" fill="${c}"/><ellipse cx="66" cy="40" rx="6" ry="24" transform="rotate(-12 66 40)" fill="${a}" opacity=".55"/><ellipse cx="107" cy="40" rx="6" ry="24" transform="rotate(12 107 40)" fill="${a}" opacity=".55"/><ellipse cx="87" cy="82" rx="43" ry="34" fill="${c}"/>`;
  } else if(shape==='axolotl') {
    back=`<path d="M113 124Q163 132 165 101Q152 114 134 101" fill="${a}"/><g stroke="${a}" stroke-width="8" stroke-linecap="round"><path d="m47 69-19-15m17 26-23 1m25 9-16 17m96-38 19-15m-17 27 23 1m-25 9 16 17"/></g>`;
    body=`<ellipse cx="88" cy="117" rx="37" ry="25" fill="${c}"/><ellipse cx="86" cy="121" rx="25" ry="18" fill="#e8f3e9"/><ellipse cx="62" cy="137" rx="12" ry="6" fill="${a}"/><ellipse cx="113" cy="137" rx="12" ry="6" fill="${a}"/>`;
    head=`<rect x="40" y="49" width="96" height="62" rx="30" fill="${c}"/><path d="M72 48Q62 27 79 34Q90 19 96 47" fill="${a}" opacity=".8"/>`;
  } else if(shape==='bird') {
    back=`<path d="m101 119 37 13-5-31-32 18" fill="${a}"/><path d="m78 134-7 10m28-11 7 11" stroke="${a}" stroke-width="6" stroke-linecap="round"/>`;
    body=`<ellipse cx="88" cy="101" rx="43" ry="39" fill="${c}"/><ellipse cx="83" cy="111" rx="25" ry="25" fill="#fff0cd"/><path d="M114 84q35 15 12 39-25-4-20-25" fill="${a}"/>`;
    head=`<circle cx="83" cy="66" r="32" fill="${c}"/><path d="M69 39Q58 11 82 29Q94 3 99 37" fill="${a}"/>`;
    if(fancy)back+=`<path d="M119 113Q185 105 156 140Q178 154 128 151Q136 136 111 131" fill="${c}" stroke="${a}" stroke-width="2"/>`;
  } else if(shape==='deer') {
    back=`<path d="M115 108q36-14 22 8" fill="${c}"/><g stroke="${a}" stroke-width="5" stroke-linecap="round" fill="none"><path d="M70 48 61 22m5 14-12-5m9 0 5-14m36 31 10-26m-5 14 12-5m-9 0-5-14"/></g>`;
    body=`<ellipse cx="95" cy="112" rx="36" ry="24" fill="${c}"/><path d="m70 120-4 20m22-19-1 20m23-20 5 19m8-24 8 21" stroke="${a}" stroke-width="9" stroke-linecap="round"/>`;
    head=`<path d="M63 59Q32 40 43 69L64 77m48-18q30-19 21 10l-22 9" fill="${c}"/><ellipse cx="87" cy="75" rx="34" ry="33" fill="${c}"/><ellipse cx="87" cy="96" rx="18" ry="13" fill="#fff0d9"/>`;
    details=`<g fill="#fff5d8"><circle cx="105" cy="105" r="4"/><circle cx="117" cy="111" r="3"/><circle cx="98" cy="117" r="3"/></g><g fill="${a}"><circle cx="57" cy="26" r="6"/><circle cx="115" cy="21" r="6"/><circle cx="122" cy="31" r="5"/></g>`;
  } else if(shape==='seal'||shape==='whale') {
    back=`<path d="M126 113Q154 84 166 101L151 115Q172 117 163 133L128 126" fill="${a}"/>`;
    body=`<ellipse cx="87" cy="105" rx="54" ry="36" fill="${c}"/><ellipse cx="81" cy="119" rx="36" ry="19" fill="#f6eed8"/><path d="M65 110q-36 18-17 28l30-13m27-13q30 12 12 22l-20-12" fill="${a}"/>`;
    head=`<ellipse cx="77" cy="78" rx="40" ry="35" fill="${c}"/>`;
    if(shape==='whale')details=`<path d="M72 40Q53 20 68 19Q74 7 80 24Q94 7 98 22Q104 31 86 40" fill="${a}"/><path d="M107 69Q140 46 134 87" fill="${a}"/>`;
  } else if(shape==='mushroom') {
    body=`<path d="M59 80Q60 117 48 134Q89 153 127 133Q114 110 117 80" fill="#f3e8cf"/><ellipse cx="66" cy="138" rx="15" ry="6" fill="${c}"/><ellipse cx="110" cy="138" rx="15" ry="6" fill="${c}"/>`;
    head=`<path d="M24 78Q30 21 87 22Q144 20 154 78Q90 103 24 78" fill="${c}" stroke="${a}" stroke-width="2"/><ellipse cx="88" cy="80" rx="62" ry="13" fill="${a}"/><g fill="#fff0d6" opacity=".9"><ellipse cx="61" cy="48" rx="13" ry="9" transform="rotate(-20 61 48)"/><ellipse cx="111" cy="48" rx="15" ry="11"/><ellipse cx="37" cy="71" rx="7" ry="5"/></g>`;
  } else if(shape==='turtle') {
    back=`<path d="m137 111 19 8-21 6" fill="${a}"/><ellipse cx="65" cy="135" rx="15" ry="8" fill="${a}"/><ellipse cx="120" cy="135" rx="15" ry="8" fill="${a}"/>`;
    body=`<path d="M49 120Q48 59 100 58Q145 60 146 123Z" fill="${a}"/><path d="M57 112Q58 69 99 68Q135 69 138 114" fill="${c}"/><path d="m98 72-20 19 9 24h26l11-24-26-19Zm-20 19-19-3m65 3 13-4m-39-15V61" fill="none" stroke="${a}" stroke-width="3"/>`;
    head=`<ellipse cx="46" cy="111" rx="28" ry="25" fill="${c}"/><path d="M90 62q-15-24 3-21 10-20 17-2 23-3 7 18" fill="#83ac75"/><circle cx="107" cy="39" r="7" fill="#edc0ae"/>`;
  } else if(shape==='dragon') {
    back=`<path d="M114 115Q168 137 161 88Q146 110 131 96" fill="${a}"/><path d="M62 96 26 57 28 100 48 91m63 2 34-40 6 43-22-6" fill="${a}" stroke="${c}" stroke-width="3"/>`;
    body=`<ellipse cx="88" cy="110" rx="36" ry="32" fill="${c}"/><ellipse cx="86" cy="116" rx="21" ry="25" fill="#f5e7cd"/><path d="m75 108 22 1m-24 9 25 1m-22 10h20" stroke="${a}" opacity=".5" stroke-width="2"/><ellipse cx="63" cy="138" rx="15" ry="7" fill="${a}"/><ellipse cx="112" cy="138" rx="15" ry="7" fill="${a}"/>`;
    head=`<path d="m61 56-5-27 18 17m28 1 19-20-4 31" fill="${a}"/><rect x="45" y="43" width="85" height="65" rx="29" fill="${c}"/><ellipse cx="86" cy="94" rx="26" ry="16" fill="#f1e4ca"/>`;
  } else if(shape==='jelly') {
    back=`<g fill="none" stroke-linecap="round" stroke-width="10" stroke="${a}"><path d="M51 99q-15 25 1 36m24-32q-5 28 4 41m22-42q11 30 0 41m25-43q20 18 7 34"/></g>`;
    head=`<path d="M34 95Q28 29 87 27Q147 27 144 95Q126 109 114 99Q101 111 88 101Q73 112 60 101Q45 112 34 95" fill="${c}"/><path d="M52 57q12-15 27-14" stroke="#f3e9ff" stroke-width="8" stroke-linecap="round" opacity=".65"/>`;
    body='';
  }
  const custom=creatureShape(s,c,a);
  if(custom)({back,body,head,details}=custom);
  const signature=creatureSignature(s,c,a);
  back=(s.id==='sunfox'?signature.back:signature.back+back);
  details+=signature.front;
  if(shiny){const variant=shinyArt(id,s);back+=variant.rear;details+=variant.front;}
  if(awake){const extra=awakeningArt(id,c,a);back=extra.replaceRear?extra.rear:back+extra.rear;details+=extra.front;}
  let fx=87,fy=79;if(shape==='bird'){fx=81;fy=66;}if(shape==='mushroom')fy=114;if(shape==='turtle'){fx=44;fy=109;}if(shape==='seal'||shape==='whale'){fx=75;fy=77;}if(shape==='jelly')fy=83;
  if(custom)({fx,fy}=custom);
  const face=creatureFace(s,uid,fx,fy);
  const leaf=s.element==='leaf'&&['fox','cat'].includes(shape)?`<path d="M87 45Q64 25 75 18Q97 20 94 42Q96 20 112 25Q115 42 94 46" fill="${a}"/><path d="m88 43-5-15m11 17 10-13" stroke="#e0edba" stroke-width="1.8"/>`:'';
  const hybrid=s.id==='lotusseal'?'<ellipse cx="76" cy="43" rx="29" ry="8" fill="#7fae85"/><path d="m76 43 17-8-3 12Z" fill="#b5d9bf"/><path d="M75 40q-10-18 1-17 11 1 7 16" fill="#edc4cf"/>':s.id==='mistfox'?'<g fill="#f6f0df"><circle cx="145" cy="82" r="13"/><circle cx="155" cy="93" r="12"/><circle cx="136" cy="97" r="15"/></g><path d="m83 46 5-15 8 16" fill="#d89978"/>':s.id==='nebularabbit'?'<path d="m87 51 3 7 7 2-7 3-3 7-3-7-7-3 7-2Z" fill="#f8e5ab"/><g fill="#f5e6bd"><circle cx="59" cy="25" r="3"/><circle cx="106" cy="19" r="3"/><circle cx="119" cy="115" r="3"/></g>':'';
  const rarity=rarityArt(s,uid);
  const highlight=volume.forehead(head,fx,fy);
  const tide=s.element==='water'&&(options.source?.clears?.reef||0)>=3?'<g class="reef-tide-adornment" aria-label="Vòng Ngọc Triều"><ellipse cx="90" cy="137" rx="59" ry="12" fill="none" stroke="#79c7ce" stroke-width="2.5"/><ellipse cx="90" cy="137" rx="66" ry="17" fill="none" stroke="#d5b479" stroke-width="1" stroke-dasharray="2 8"/><g fill="#fff6d6" stroke="#9fcfcf" stroke-width="1.5"><circle cx="31" cy="137" r="5"/><circle cx="149" cy="137" r="5"/><circle cx="90" cy="149" r="4"/></g></g>':'';
  const ember=s.element==='fire'&&(options.source?.clears?.volcano||0)>=3?'<g class="volcano-ember-adornment" aria-label="Diện mạo Than Hồng"><ellipse cx="90" cy="138" rx="61" ry="12" fill="none" stroke="#f4b374" stroke-width="3"/><path d="m31 134-3-15 12 8-2 12m101-5 3-15-12 8 2 12M76 35l5-13 9 8 9-8 5 13-14 5Z" fill="#ffcc83" stroke="#ac6063" stroke-width="1.5"/><g fill="#fff0b9"><circle cx="37" cy="106" r="3"/><circle cx="145" cy="102" r="3"/><circle cx="121" cy="34" r="2.5"/></g></g>':'';
  const layers=`<g class="pet-volume-rear">${volume.paint(back)}</g><g class="pet-volume-torso">${volume.paint(body)}</g><g class="pet-volume-head">${volume.paint(head)}${highlight.shine}</g><g class="pet-volume-face">${volume.paint(face)}</g><g class="pet-volume-ornaments">${volume.paint(details+leaf+hybrid)}${tide}${ember}</g>`;
  const halo=awake?`<g class="awakening-halo" aria-hidden="true"><ellipse cx="90" cy="86" rx="83" ry="65" fill="none" stroke="${a}" stroke-width="1" stroke-dasharray="3 6" opacity=".45"/><ellipse cx="90" cy="144" rx="64" ry="8" fill="none" stroke="${a}" opacity=".6"/></g>`:'';
  const crown=options.source?.towerAdornment||options.source?.tower?.aura&&options.source?.team?.includes(id)?'<g class="tower-pet-crown"><ellipse cx="88" cy="24" rx="25" ry="9" fill="none" stroke="#e9bd66" stroke-width="2"/><path d="m69 23-5-16 14 8 10-13 10 13 14-8-5 16Z" fill="#ffe3a1" stroke="#c68b47" stroke-width="1.2"/><path d="m88 9 3 5-3 6-3-6Z" fill="#9781d2"/></g>':'';
  const aria=s.shiny?`${SHINY_VARIANTS[id]?.name||s.name} · Shiny`:s.name;
  return `<svg class="creature creature-${s.rarity} ${awake?'creature-awakened ':''}${s.shiny?'creature-shiny ':''}${options.className||''}" viewBox="0 0 180 160" role="img" aria-label="${aria}" data-species="${s.id}" data-rarity="${s.rarity}" data-awakened="${awake}" data-shiny="${!!s.shiny}" data-depth="clay"><defs>${rarity.defs}${volume.defs()}${highlight.clip}</defs>${rarity.aura}${halo}${volume.ground}<g class="pet-body">${layers}${crown}</g>${rarity.sparkles}</svg>`;
}

export function islandArt(level=1,buildings={},options={}) {
  return islandWorldArt(level,buildings,options);
}

export function biomeArt(biome) {
  return landscapeArt(biome.element,{className:'biome-art'});
}

export function eggArt(type='nature',className='') {
  return eggWorldArt(type,className);
}
