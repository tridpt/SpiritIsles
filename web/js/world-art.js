import {STRUCTURE_MODELS} from './island-structures.js';

// Self-contained vector scenery: no remote textures, canvas scaling or bitmap blur.
let serial=0;
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const oval=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const line=(d,color,width=2,extra='')=>path(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}`);
const star=(x,y,r=4,c='#ffe5a0')=>path(`M${x} ${y-r}l${r*.28} ${r*.72} ${r*.72} ${r*.28}-${r*.72} ${r*.28}-${r*.28} ${r*.72}-${r*.28}-${r*.72}-${r*.72}-${r*.28} ${r*.72}-${r*.28}Z`,c);
const linear=(id,colors,x2='.2',y2='1')=>`<linearGradient id="${id}" x2="${x2}" y2="${y2}">${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const radial=(id,center,edge)=>`<radialGradient id="${id}"><stop stop-color="${center}"/><stop offset="1" stop-color="${edge}" stop-opacity="0"/></radialGradient>`;
const mix=(a,b,t)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-t)+parseInt(b.slice(1).match(/../g)[i],16)*t).toString(16).padStart(2,'0')).join('');
function foliage(x,y,scale=1,colors=['#205e55','#398570','#71b17d'],id='') {
  const gradient=id||`canopy-${++serial}`;
  return `<g class="scenery-foliage" transform="translate(${x} ${y}) scale(${scale})"><defs><radialGradient id="${gradient}" cx=".28" cy=".2" r=".9"><stop stop-color="${colors[2]}"/><stop offset=".4" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[0]}"/></radialGradient></defs>${oval(5,5,31,9,'#174a4133')}${path('M-7 3-4-67H6L10 3 0 8Z','#795c42')}${path('M0-9 1-53 7-51 10 3Z','#b28a59')}${line('M1-38-19-56m22 9 18-21','#725842',5)}${line('M-2-12v-14m7-7v-10','#d2ae70',1.3)}${path('M-41-48Q-56-79-25-89Q-29-116 2-114Q30-119 40-93Q65-88 53-60Q41-36 11-41Q-17-25-41-48Z',`url(#${gradient})`,'stroke="#245e55" stroke-width="1.4"')}${path('M-32-77q3-20 22-19 5-17 25-11-13-12-30-1-16-1-17 17Z',colors[2],'opacity=".8"')}${path('M-43-58q15 12 26 0 13 12 26 2 17 10 34-6-8 22-32 21-28 13-52-7Z',colors[0],'opacity=".5"')}${line('M-25-84q4-7 13-6m15-9q9-3 15 2m6 30q11 3 18-5',colors[2],2.5)}${path('m-36-71 7-5 7 2-7 5Zm40-31 9-4 7 3-9 4Zm21 24 8-4 5 3-7 4Z',mix(colors[2],'#fff1b5',.2))}<g fill="#e5e9aa" opacity=".7"><circle cx="-26" cy="-83" r="1.8"/><circle cx="19" cy="-95" r="1.7"/><circle cx="8" cy="-62" r="1.6"/></g></g>`;
}
export function islandTree(pink=false) {return foliage(0,-4,.9,pink?['#a35e7c','#d28c9a','#f2c4b1']:['#236251','#4f9570','#9ac47f']);}
function fern(x,y,s=1,c='#247467') {
  return `<g transform="translate(${x} ${y}) scale(${s})">${line('M0 5Q-3-21-24-34M0 5Q10-24 35-27M0 5Q1-35 9-48',c,2)}${['M-3-3Q-25 0-29-16Q-10-20-3-3','M-11-18Q-31-14-35-30Q-16-33-11-18','M3-5Q25-10 29-2Q15 9 3-5','M10-20Q30-29 40-20Q31-7 10-20','M3-21Q-9-37-1-46Q11-39 3-21','M7-32Q13-52 24-48Q25-35 7-32'].map((d,i)=>path(d,i%2?'#69ab7c':c)).join('')}</g>`;
}
function crystal(x,y,s=1,colors=['#c0f5ef','#55bdbd','#2b6984']) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${oval(0,4,14,5,'#163e4d25')}${path('m-13-3 2-29 10-23 14 21 2 28-15 12Z',colors[1],`stroke="${colors[2]}" stroke-width="1.2"`)}${path('m-11-32 10-23 2 39-14 13Z',colors[0])}${path('m1-16 12-18 2 28-13 12Z',colors[2])}${line('M-1-50 1-18',colors[0],2)}</g>`;
}
function rock(x,y,s=1,c=['#557a75','#9db7a0','#355e5c']) {
  return `<g transform="translate(${x} ${y}) scale(${s})">${path('m-24 0 9-21 25-6 22 25-8 11-39-1Z',c[0])}${path('m-15-21 25-6 22 25L0-6Z',c[1])}${path('M0-6 32-2 24 9-15 8Z',c[2])}${line('m-10-17 17-4',c[1],2)}</g>`;
}

const PALETTES={
  leaf:{sky:['#174a52','#65ae9a','#e8e4ae'],far:'#659b86',near:'#397d68',land:['#b1c783','#6d9f66','#386e55'],light:'#fff1ba',trunk:'#255e57'},
  water:{sky:['#176179','#78c4cd','#e3e9c3'],far:'#6eaaa8',near:'#397e88',land:['#ddcf9a','#a8b77e','#4f8b7e'],light:'#fff5ce',trunk:'#296b76'},
  fire:{sky:['#763d5c','#df9571','#f9d894'],far:'#ad746f',near:'#765467',land:['#ca9473','#916c67','#4f4857'],light:'#ffd48b',trunk:'#4f4054'},
  wind:{sky:['#568da9','#a8d5d1','#f5edc2'],far:'#8cb9b0',near:'#5d998d',land:['#d4d59c','#96b380','#53877a'],light:'#fff4cf',trunk:'#4d847d'},
  shadow:{sky:['#242e58','#5c6588','#aaa7b2'],far:'#666d8f',near:'#3e526e',land:['#8b9a9a','#597a86','#2c4c63'],light:'#e3ecff',trunk:'#314864'},
  light:{sky:['#ab9364','#e5ca8f','#fff0c6'],far:'#bcb789',near:'#8b9d79',land:['#e2d39a','#b6b681','#6c8e77'],light:'#fff5c5',trunk:'#6c896d'}
};

export function landscapeArt(theme='leaf',{className='',travel=false}={}) {
  const p=PALETTES[theme]||PALETTES.leaf,id=`landscape-${++serial}`;
  const defs=linear(`${id}-sky`,p.sky,'0')+linear(`${id}-land`,p.land,'0')+radial(`${id}-sun`,p.light,p.light)+linear(`${id}-water`,['#a5e7d3','#399eaa','#246c86'],'0');
  const mountains=`<g class="scenery-distant">${path('M0 214 65 145 129 182 209 100 296 170 376 121 467 179 553 90 636 155 720 120V350H0Z',p.far)}${path('M0 253Q94 169 197 225T407 214T720 211V400H0Z',p.near)}</g>`;
  const ground=path('M0 291Q156 247 340 288Q548 234 720 278V400H0Z',`url(#${id}-land)`)+path('M280 268Q410 263 456 303Q476 326 334 400H616Q670 341 525 291Q438 252 280 268Z',theme==='fire'?'#ce8067':theme==='shadow'?'#95aaa1':'#d8c38d');
  let landmarks='',frame='';
  if(theme==='leaf') {
    landmarks=`${foliage(126,272,1.3,['#2b695b','#44886b','#85b67a'])}${foliage(567,270,1.55,['#205951','#397c65','#78ab77'])}${foliage(472,259,.7)}${path('M332 272q-17-78 5-125l-9-5q-30 54-13 130Z','#6a7151')}${line('M332 193q46-30 76-4','#587a55',8)}${oval(414,187,49,15,'#719e68')}${path('M575 191q23 8 28 28l-8 40-10 14h-16l15-31Z',`url(#${id}-water)`)}${line('m587 210-4 30', '#d0f2d7',3)}`;
    frame=`${path('M0 0h84q-34 63-27 148L25 299H0Z','#194e4e')}${path('M720 0h-81q41 60 26 154l35 135h20Z','#204f4d')}${line('M18 64Q148 92 216 3m468 74Q593 81 545 0','#235d52',18)}${foliage(25,150,1.5)}${foliage(700,146,1.6)}${fern(50,382,1.6)}${fern(676,385,1.7)}${rock(648,365,.8)}`;
  } else if(theme==='water') {
    landmarks=`${path('M440 151 506 103 580 137 623 206 720 189V303H446Z','#4e9a98')}${path('m508 119 29 15-4 90 34 53-36 21-37-61Z',`url(#${id}-water)`)}${line('M518 145v70l20 48','#c3f1dc',5)}${path('M0 289Q144 248 329 292T720 283V400H0Z',`url(#${id}-water)`)}${path('M0 333Q135 283 226 310L330 400H0Z','#dccb95')}${line('M321 323q75-23 154-5m61 27 99-16M52 287l94-9','#daf3dc',3)}${rock(560,290,1.4)}${rock(165,305,.8)}`;
    frame=`${fern(31,382,1.4,'#367d73')}${fern(684,382,1.4,'#31858b')}${crystal(617,351,1.1)}${crystal(652,374,.55)}${line('M61 325q-34-80-13-133m-2 38-30-26m31 58 29-29m-29 66-27-17','#c38381',9)}${path('M700 0h-34l-30 43 58 21-22 55 48 40Z','#347d88')}`;
  } else if(theme==='fire') {
    landmarks=`${path('M153 277 271 101 393 281Z','#6e4e5d')}${path('m247 137 24-36 33 49-24-9-12 19-9-23Z','#e4ad7e')}${path('m269 157 18 46-12 23 32 42-19 21-38-65 13-31Z','#f6ad66')}${path('M510 154 573 199 554 272l-83 16Z','#614954')}${path('M329 273Q439 250 476 299T592 400H443Q442 344 397 319T329 273Z','#ed9b5e')}${line('M368 284q115 9 111 58l54 57','#ffe1a0',5)}`;
    frame=`${rock(43,349,2,['#574555','#ac8075','#42394e'])}${rock(704,328,2.2,['#654c5c','#a47b75','#45384d'])}${crystal(83,315,1.1,['#ffe5a3','#e89362','#9f515b'])}${crystal(663,353,1.2,['#ffdda0','#d47d62','#9f4f59'])}${path('M0 0h79L46 61 61 93 0 149m720-149h-70l24 79 46 38Z','#4e3b50')}`;
  } else if(theme==='wind') {
    landmarks=`<g>${path('m432 158 19 49 70 26 82-50 13-35Z','#7e927e')}${oval(522,150,96,25,'#adca94')}${foliage(561,143,.7)}${path('m165 173 12 32 46 19 58-36 7-22Z','#80998b')}${oval(224,168,66,20,'#b4d09e')}${path('m488 150-1-77 19-8 14 10v77m18-2V85l17-8 13 10v58','#d1d4b0')}${line('m488 76 32 3m18 8 30 3','#edf0c8',5)}</g><g fill="#f7f4d7" opacity=".85">${oval(134,248,83,12,'#f7f4d7')}${oval(172,240,38,18,'#f7f4d7')}${oval(583,250,110,14,'#f7f4d7')}</g>${line('M316 144q30-15 60 0m-43 6 56-2','#e9f3db',2)}`;
    frame=`${fern(21,386,1.4)}${fern(687,387,1.5)}${rock(664,372,.9)}${line('M22 109q26-11 48-1m-4 13 34-5m490-34 42-8','#e7f2d5',2)}`;
  } else if(theme==='shadow') {
    landmarks=`<circle cx="454" cy="115" r="51" fill="#e6e6cb"/><circle cx="442" cy="108" r="48" fill="#b8c9ce" opacity=".24"/>${oval(437,95,8,7,'#afbdc2')}${oval(472,130,11,10,'#c7d1c7')}${path('M173 285q-30-93-14-172l-10-7q-23 92 0 186Z','#3a4b66')}${line('m155 179-58-49m59 21 42-46','#3a4b66',9)}${path('M576 271q15-65-4-147l11-7q28 74 10 166Z','#394e69')}${line('m583 182 51-42m-51 10-32-48','#394e69',9)}${path('M453 275q-42 22 46 64l93 61H359l-17-36q134-26 111-89Z','#4d939a')}`;
    frame=`${[ [40,331,1.25],[676,308,1.5],[641,362,.7],[95,363,.65] ].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M-7 4-4-37h10L12 3Z','#b9c4c2')}${path('M-33-35q4-48 35-48 30 3 36 47Q6-21-33-35Z','#738cc1')}${path('M-28-38q25 10 58 0','#a4ddd0')}${oval(-8,-59,6,4,'#c5f8df')}${oval(17,-49,4,3,'#c5f8df')}</g>`).join('')}${fern(5,388,1.2,'#3f7582')}${fern(714,388,1.4,'#3f7582')}${[ [59,74],[300,61],[585,68],[640,111],[201,44],[359,111] ].map(([x,y])=>star(x,y,2.2,'#d7e9e2')).join('')}`;
  } else {
    landmarks=`${path('M380 277V105l26-12 22 12v153m132-1V105l23-12 26 12v174','#cbb988')}${path('m371 101 124-63 121 63-24 16-98-48-100 49Z','#f1dca5')}${path('m382 110 110-56 112 52-7 11-102-48-109 53Z','#9e9f76')}${path('M424 270V158q73-85 137 0v112H539V168q-47-57-94 1v101Z','#e0cc96')}${line('M401 127v112m182-110v111','#f8e5b4',5)}${oval(491,273,109,15,'#d8ca95')}${oval(491,270,86,10,'#f6e2b1')}${star(493,160,23,'#fff0b4')}${foliage(91,272,1.1,['#5e8b6d','#91ab75','#cad294'])}${foliage(654,277,1.1,['#5e8b6d','#91ab75','#cad294'])}`;
    frame=`${rock(27,372,1.4,['#a5a77e','#e8d6a2','#7c9476'])}${fern(678,389,1.5,'#8caa72')}${crystal(69,344,.8,['#fff1b4','#d9c98c','#9b9770'])}`;
  }
  const motes=Array.from({length:9},(_,i)=>star(54+i*77,77+(i*57)%221,i%3===0?3:1.5,theme==='shadow'?'#b9f0de':'#ffe8a8')).join('');
  return `<svg class="scenery-art scenery-${theme} ${travel?'scenery-travel ':''}${className}" viewBox="0 0 720 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${path('M0 0H720V400H0Z',`url(#${id}-sky)`)}${oval(458,104,162,156,`url(#${id}-sun)`)}${theme==='shadow'?'':`<circle cx="458" cy="104" r="36" fill="${p.light}" opacity=".82"/>`}${mountains}${ground}${landmarks}<g class="scenery-rays" fill="${p.light}" opacity=".09">${path('M445 0 168 400h105L477 0Z',p.light)}${path('M500 0 413 400h52L520 0Z',p.light)}</g>${frame}<g class="scenery-motes">${motes}</g></svg>`;
}

export function structureMaterials(type,markup) {
  const id=`structure-${++serial}`,colors=new Map();let defs='';
  const palette={'#6f9c8c':'#277a78','#8eb2a1':'#56ac94','#628575':'#1e5d60','#a9c7ae':'#a0d6a9','#b7ccb3':'#8cc99f','#7b9b6d':'#328767','#dce5c0':'#a4c97f','#c3d0ac':'#ffe09a','#f0e5c1':'#f8e5b8','#e2d5af':'#c7b78c','#9aa37b':'#377e77','#b1b691':'#73b69b','#7fa16c':'#49935d','#da9a8e':'#e77b72','#91b58a':'#65a977','#c7d6ad':'#7eae8e','#bfa47b':'#aa7b4c','#c7b4d9':'#c7bcf0','#a998bd':'#796bb3'};
  const paint=color=>{
    const base=palette[color.toLowerCase()]||color;
    if(!colors.has(base)) {
      const key=`${id}-${colors.size}`;
      defs+=linear(key,[mix(base,'#fff0c8',.17),base,mix(base,'#193e42',.28)],'.8');
      colors.set(base,{key,base});
    }
    return colors.get(base);
  };
  const art=markup.replace(/fill="(#[\da-f]{6})"/gi,(_,color)=>{
    const {key}=paint(color);return `fill="url(#${key})"`;
  }).replace(/stroke="(#[\da-f]{6})"/gi,(_,color)=>`stroke="${palette[color.toLowerCase()]||color}"`);
  let accents='';
  if(type==='lodge')accents=`<g transform="translate(0 -101)">${path('m-45 25 18-8v30l-18 9Z','#ffe4a0')}${line('m-36 22 1 29m-10-15 18-8','#916a3d',2)}${path('m53 15 8-4 7 5v15l-8 5-7-4Z','#f6cd77')}${path('m56 17 5-2 4 3v11l-5 3-4-3Z','#fff3be')}${line('M61 10v-10','#b99253',2)}${line('m-59-25 59-51 62 51','#b7e5bd',2)}</g>`;
  if(type==='nursery')accents=`<g transform="translate(0 -31)">${line('M-15-30q2-14 11-18','#fff9d6',4)}${star(17,-17,4,'#f6cf78')}${star(-34,-38,3,'#ffe4ac')}</g>`;
  if(type==='sanctuary')accents=star(1,-63,5,'#fff1bf');
  return `<g class="structure-material structure-${type}"><defs>${defs}</defs>${art}${accents}</g>`;
}

export function eggWorldArt(type='nature',className='') {
  const starry=type==='star',id=`egg-jewel-${++serial}`,accent=starry?'#e5c37c':'#dfc481';
  const shell='M47 147Q46 78 85 38Q110 9 136 38Q177 83 174 147Q171 205 110 208Q48 205 47 147';
  const defs=`<radialGradient id="${id}-shell" cx=".3" cy=".25" r=".88"><stop stop-color="${starry?'#e8e0e1':'#f2f3ce'}"/><stop offset=".3" stop-color="${starry?'#b7b9db':'#d2e4af'}"/><stop offset=".65" stop-color="${starry?'#7689b8':'#8fbe98'}"/><stop offset="1" stop-color="${starry?'#344d7d':'#3f7c70'}"/></radialGradient>${radial(`${id}-glow`,starry?'#d4d7ff':'#e2eeb5',starry?'#d4d7ff':'#e2eeb5')}<clipPath id="${id}-clip">${path(shell,'#fff')}</clipPath>${linear(`${id}-gold`,['#fff1bc','#e8c376','#a77c46'])}`;
  const motif=starry?`<circle cx="110" cy="119" r="33" fill="#3b5783" stroke="${accent}" stroke-width="2"/>${star(110,119,25,`url(#${id}-gold)`)}${line('m67 98 14-18 14 4m43 60 12 11m-68 18 13 7 16-8',accent,1.5)}<g fill="#fff1c5"><circle cx="67" cy="98" r="3"/><circle cx="81" cy="80" r="2.5"/><circle cx="95" cy="84" r="2"/><circle cx="150" cy="155" r="2.5"/><circle cx="82" cy="173" r="2"/><circle cx="95" cy="180" r="2.5"/><circle cx="111" cy="172" r="2"/></g>`:`${path('m45 133 27-18 25 18 24-18 26 18 28-18v13l-28 18-26-18-24 18-25-18-27 18Z',`url(#${id}-gold)`)}${path('M110 100q-20-15-10-29 23 3 16 26 3-23 21-23 4 22-21 29Z','#508c6a')}${line('m110 99-4-17m9 17 13-16','#cee6a2',1.5)}`;
  return `<svg class="egg-art ${className}" viewBox="0 0 220 240" role="img" aria-label="${starry?'Trứng Ánh Sao':'Trứng Mầm Xanh'}"><defs>${defs}</defs>${oval(110,117,95,108,`url(#${id}-glow)`)}${oval(110,217,64,10,'#214d4b','opacity=".2"')}<g class="egg-shell">${path(shell,`url(#${id}-shell)`,`stroke="${starry?'#4b567b':'#57896e'}" stroke-width="2"`)}<g clip-path="url(#${id}-clip)">${path('M142 34q64 142-15 175 75-16 56-105Z',starry?'#344d7d':'#386b62','opacity=".25"')}${line('M66 98q8-35 31-53','#fff8dc',7,'opacity=".8"')}${line('M63 109v8','#fff8dc',4,'opacity=".65"')}${motif}${line('M63 174q12 21 36 24','#eaf0ce',2,'opacity=".6"')}</g>${starry?`${path('m98 28 12-15 13 15-13 10Z',`url(#${id}-gold)`)}${star(110,16,5,'#fff3c9')}`:`${path('M108 51Q80 35 91 19Q118 21 118 46Q120 24 139 29Q143 50 118 56','#519767')}${line('m114 47-15-20m18 22 13-13','#c1dc97',2)}`}</g><g class="egg-orbit">${star(28,78,7,accent)}${star(187,119,6,accent)}${star(174,49,4,'#fff2c4')}<circle cx="36" cy="170" r="2.5" fill="${accent}"/><circle cx="187" cy="177" r="2" fill="#fff2c4"/></g></svg>`;
}

export function islandWorldArt(level=1,buildings={},options={}) {
  const id=`isle-${++serial}`;
  const defs=linear(`${id}-sky`,['#8dccc2','#d4e8c8','#4caa9e'],'0')+linear(`${id}-ground`,['#d9dd9b','#99be74','#579467'])+linear(`${id}-cliff`,['#bba16d','#8b7757','#4c6d60','#2d6461'],'0')+linear(`${id}-water`,['#b2edd6','#49bbba','#2b8eaa'],'0')+linear(`${id}-fall`,['#b1eed9','#62d1ca','#b3ead800'],'0')+radial(`${id}-shadow`,'#1b585c','#1b585c')+radial(`${id}-light`,'#fff2bc','#fff2bc');
  const ground='M156 302Q179 238 306 220Q465 172 633 216Q803 224 849 306Q874 354 763 393Q652 445 492 451Q299 455 194 375Q140 340 156 302';
  const cliffs=`${path('M161 308Q186 233 315 216Q466 167 639 219Q815 233 850 321L818 405Q736 462 531 512Q297 501 190 409Z',`url(#${id}-cliff)`)}${path('m194 366 22 51 71 45-13-71 42 14 31 71 49 13-12-75 54 14 9 78 56 6 3-86 72-12-5 85 54-13 18-90 52-14-16 79 61-24 22-74 36-22-19 65 37-20 24-65Z','#284e4f','opacity=".28"')}${line('m211 395 58 31m84 24 60 19m39 8 52 7m77-15 47-9m42-13 40-14m33-17 42-18','#dbc68f',3,'opacity=".65"')}${path('M271 443q21 9 28 27l-5 23-14-23Zm287 44-11 41 16 17 17-64m112-41-9 40 13 13 15-64Z','#426d58')}`;
  const grass=path(ground,`url(#${id}-ground)`,'stroke="#467e61" stroke-width="3"')+line('M164 316Q166 350 234 381Q378 455 523 443Q717 432 817 364','#dfedaf',5,'opacity=".8"')+path('M187 304Q263 249 345 249Q479 217 644 249Q749 253 798 302Q695 262 565 271Q374 284 253 326Z','#d5df98','opacity=".35"');
  const pond=path('M677 360Q724 333 767 353Q795 372 755 389L721 407Q729 437 713 456L731 529H772L774 441Q801 412 791 388Q827 366 789 344Q733 316 677 347Z','#497f70')+path('M679 356Q737 326 786 352Q811 369 771 386L725 405 738 429 772 423Q780 403 781 385Q818 361 785 349Q733 321 679 346Z',`url(#${id}-water)`)+path('M725 399Q744 415 735 458L739 551H764L758 452Q778 417 766 398',`url(#${id}-fall)`)+line('M741 415q8 20 1 61l3 41m13-101q9 17-1 42l-1 57','#d4fff0',3)+oval(749,528,29,6,'#c8f8e3','opacity=".75"')+line('m695 357 19-6m17 1 26-1m-38 23 23-3','#d2f8dc',3);
  const edgePlants=`${foliage(231,304,.72)}${foliage(285,262,.94)}${foliage(325,244,.58,['#38795c','#65a076','#97c583'])}${foliage(679,266,.95)}${foliage(744,291,.57)}${fern(200,356,.65)}${fern(627,417,.6)}${fern(789,317,.55)}`;
  const buildingsArt=options.bare?'':Object.entries({lodge:[512,353,1],nursery:[327,343,1],garden:[396,410,1],observatory:[642,347,1],sawmill:[246,379,1],sanctuary:[610,257,1]}).filter(([type])=>['lodge','nursery','garden'].includes(type)||buildings[type]).map(([type,[x,y,s]])=>`<g transform="translate(${x} ${y}) scale(${s})">${structureMaterials(type,STRUCTURE_MODELS[type])}</g>`).join('');
  const flowers=Array.from({length:19},(_,i)=>{const x=236+(i*83)%522,y=291+(i*41)%128;return `<g transform="translate(${x} ${y})">${line('m0 1 1 7','#4c8b5d',1.4)}${oval(-2,0,3,2,i%3?'#ffd582':'#ed9b94')}${oval(2,-1,3,2,i%3?'#ffd582':'#ed9b94')}<circle cy="-2" r="2" fill="#fff2bd"/></g>`;}).join('');
  return `<svg class="island-art island-art-refined" viewBox="0 0 1000 600" role="img" aria-label="Hòn đảo nổi xanh mát với nhà cây, vườn quả, thác nước và linh thú"><defs>${defs}</defs><rect width="1000" height="600" fill="url(#${id}-sky)"/>${oval(491,239,390,250,`url(#${id}-light)`)}<g class="island-water-rings" fill="none" stroke="#d9fff0" stroke-width="1.4" opacity=".45"><ellipse cx="507" cy="471" rx="418" ry="106"/><ellipse cx="505" cy="472" rx="454" ry="128"/><ellipse cx="506" cy="472" rx="485" ry="152"/></g>${oval(521,503,317,54,`url(#${id}-shadow)`)}<g class="far-island">${path('m89 180 11 33 55 28 49-38 7-31','#71957c')}${oval(150,178,66,27,'#a4c38a')}${foliage(133,169,.56)}${foliage(174,175,.38)}</g><g class="far-island second">${path('m833 140 10 39 45 25 47-29 7-34','#648c7f')}${oval(889,139,61,25,'#b5ce95')}${path('m879 134 1-52 16-8 13 14-3 51-15 8Z','#a4b6a0')}${path('m880 82 16-8 13 14-16 8Z','#e1ddad')}${line('m893 95 3 26','#e6eac1',4)}${foliage(861,139,.36)}</g><g class="scene-cloud cloud-one" fill="#f4f6d9" opacity=".82">${oval(270,98,58,12,'#f4f6d9')}${oval(247,88,23,17,'#f4f6d9')}${oval(281,81,33,22,'#f4f6d9')}</g><g class="scene-cloud cloud-two" fill="#f4f6d9" opacity=".8">${oval(740,100,53,11,'#f4f6d9')}${oval(724,91,26,20,'#f4f6d9')}${oval(755,89,20,16,'#f4f6d9')}</g>${cliffs}${grass}${path('M475 433Q469 385 519 360Q562 338 542 281M523 361Q460 325 331 314M520 361Q597 392 701 351','none','stroke="#82a26b" stroke-width="24" stroke-linecap="round"')}${path('M475 433Q469 385 519 360Q562 338 542 281M523 361Q460 325 331 314M520 361Q597 392 701 351','none','stroke="#e1cf97" stroke-width="16" stroke-linecap="round"')}${line('M476 433q-3-23 10-40m48-42 9-29m-125 11-32-10m225 57 40-5','#f7e8b8',2)}${pond}${edgePlants}${buildingsArt}<g transform="translate(779 324)">${path('m-4 0 83-25 11 20-83 28Z','#a77b4d','stroke="#755a3f" stroke-width="2"')}${line('m7-4 8 19m7-24 8 19m7-23 8 18m7-23 8 18m7-23 8 18','#e4c38d',3)}${line('M40 7v26m32-35v24','#6c5c44',5)}${path('M48 38q39 20 52-7l-27-9Z','#9c6947')}${path('m74 23 1-40 25 27-25 6','#fff1bc','stroke="#99704b" stroke-width="2"')}</g>${rock(206,344,.55)}${rock(284,372,.5)}${rock(614,415,.55)}${rock(794,303,.45)}${flowers}<g class="scene-cloud cloud-three" opacity=".76">${oval(176,485,69,15,'#edf6dd')}${oval(150,472,29,24,'#edf6dd')}${oval(200,464,33,28,'#edf6dd')}</g><g class="island-light-motes">${[ [243,227],[656,245],[302,368],[763,317],[576,389],[366,424] ].map(([x,y],i)=>star(x,y,i%2?2:3,'#fff0b8')).join('')}</g></svg>`;
}
