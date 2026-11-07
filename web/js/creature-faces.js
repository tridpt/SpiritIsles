// Portraits use species anatomy and deliberate expressions, including related species.
// Coordinates are local to the head anchor; all details remain small, offline SVGs.
const ink='#293d42', cream='#fff3df', gold='#d7af62';
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const oval=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const line=(d,color=ink,width=1.6)=>path(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const star=(x,y,r,color)=>path(`M${x} ${y-r}l${r*.32} ${r*.65} ${r*.68} ${r*.35}-${r*.68} ${r*.35}-${r*.32} ${r*.65}-${r*.32}-${r*.65}-${r*.68}-${r*.35} ${r*.68}-${r*.35}Z`,color);
const design=(eyes,iris,mood,mark,extra={})=>({eyes,iris,mood,mark,...extra});

const portraits={
  mossfox:design('bright','#608744','smile','freckles',{gap:17,rx:6,ry:7}),
  axolotl:design('round','#387d9b','joy','gill-dots',{gap:27,rx:5.5,ry:6}),
  emberbird:design('round','#9c562c','chirp','feather-cheeks',{gap:14,rx:6,ry:7}),
  cottonbun:design('bright','#987249','curious','soft-cheeks',{gap:18,rx:6,ry:8}),
  sunseal:design('smile','#956b35','joy','whisker-dots',{gap:17,rx:6,ry:6}),
  nightcat:design('sleepy','#d1ad65','sleep','moon-cheeks',{gap:18,rx:8,ry:6,pupil:'slit'}),
  mushroom:design('smile','#706143','joy','freckles',{gap:17,rx:5,ry:6}),
  pebbleturtle:design('curious','#607540','calm','scale-cheeks',{gap:9,rx:6,ry:7}),
  ferncat:design('curious','#60995a','smile','leaf-cheeks',{gap:18,rx:7,ry:8,pupil:'slit'}),
  flamefox:design('wink','#ba653b','grin','ember-cheeks',{gap:17,rx:7,ry:7}),
  breezebird:design('curious','#6c8860','chirp','feather-cheeks',{gap:15,rx:5.5,ry:8}),
  stardeer:design('bright','#9f7740','gentle','star-freckles',{gap:17,rx:6.5,ry:8,lashes:true}),
  duskbun:design('sleepy','#a67eae','sleep','soft-cheeks',{gap:18,rx:8,ry:6}),
  coralseal:design('bright','#3b8d9c','sing','coral-cheeks',{gap:19,rx:7,ry:8,lashes:true}),
  blossomdeer:design('smile','#ad6b85','gentle','petal-cheeks',{gap:17,rx:7,ry:7,lashes:true}),
  lavadragon:design('fierce','#db933d','grin','lava-scales',{gap:18,rx:8,ry:7,pupil:'slit'}),
  cloudfox:design('sleepy','#6e9da3','sleep','cloud-cheeks',{gap:18,rx:8,ry:6}),
  moonjelly:design('dream','#b19cda','calm','moon-tears',{gap:23,rx:8,ry:7,pupil:'diamond'}),
  glowmush:design('round','#c8a747','surprise','glow-dots',{gap:17,rx:7,ry:8}),
  forestking:design('wise','#a88133','solemn','forest-runes',{gap:17,rx:8,ry:7,pupil:'diamond'}),
  oceandragon:design('almond','#3bc3d0','solemn','tide-runes',{gap:19,rx:9,ry:7,pupil:'slit'}),
  phoenix:design('fierce','#dd9b28','proud','phoenix-runes',{gap:16,rx:8.5,ry:6,pupil:'slit'}),
  skywhale:design('wise','#669dba','calm','star-freckles',{gap:16,rx:9,ry:9}),
  sunfox:design('almond','#e0a633','knowing','sun-runes',{gap:19,rx:9,ry:7,pupil:'slit'}),
  eclipsecat:design('almond','#daa849','knowing','eclipse-runes',{gap:19,rx:9,ry:8,pupil:'slit',otherIris:'#79c7d4'}),
  lotusseal:design('smile','#5e9b87','gentle','petal-cheeks',{gap:20,rx:7,ry:7}),
  mistfox:design('curious','#bf8357','curious','cloud-cheeks',{gap:19,rx:7,ry:8}),
  nebularabbit:design('round','#9e7bb9','curious','star-freckles',{gap:19,rx:8,ry:9,pupil:'star'}),
  sproutpanda:design('round','#6d8d42','chew','soft-cheeks',{gap:20,rx:7,ry:8}),
  bubbleotter:design('wink','#3c9399','grin','whisker-dots',{gap:18,rx:7,ry:7}),
  cinderhog:design('curious','#a46a3e','curious','freckles',{gap:21,rx:5,ry:6}),
  dandelionpup:design('round','#a4a34e','pant','freckles',{gap:18,rx:7,ry:8}),
  honeyhamster:design('smile','#a77932','chew','honey-cheeks',{gap:23,rx:6,ry:6}),
  duskbat:design('curious','#b68ac5','grin','bat-freckles',{gap:16,rx:8,ry:9}),
  maplehog:design('sleepy','#946636','calm','leaf-cheeks',{gap:22,rx:6,ry:6}),
  frostpenguin:design('wink','#4e9cbf','chirp','snow-cheeks',{gap:17,rx:7,ry:8}),
  emberlion:design('fierce','#cd852d','roar','ember-cheeks',{gap:17,rx:8,ry:7}),
  zephyrowl:design('round','#bf9445','curious','feather-brows',{gap:19,rx:12,ry:13}),
  sunmoth:design('bright','#aa7d30','gentle','pollen',{gap:8,rx:5,ry:7}),
  inkwolf:design('fierce','#ad91d1','solemn','ink-cheeks',{gap:19,rx:9,ry:7,pupil:'slit'}),
  orchidwing:design('smile','#9a6e9d','gentle','pollen',{gap:8,rx:5,ry:6,lashes:true}),
  jadepanda:design('wise','#5eac97','calm','jade-cheeks',{gap:20,rx:9,ry:8}),
  pearlray:design('almond','#9b8bc6','gentle','pearl-cheeks',{gap:16,rx:8,ry:6}),
  frostkitsune:design('almond','#56b9d3','knowing','frost-runes',{gap:19,rx:9,ry:7,pupil:'slit'}),
  rubykirin:design('fierce','#be647c','proud','ruby-cheeks',{gap:17,rx:8,ry:7,pupil:'diamond'}),
  lanternkoi:design('round','#d18a3d','curious','gold-scales',{gap:12,rx:8,ry:9}),
  stormgriffin:design('fierce','#75b7ca','proud','storm-cheeks',{gap:17,rx:9,ry:7}),
  ribbonmoth:design('dream','#86b3ad','gentle','ribbon-cheeks',{gap:8,rx:6,ry:7}),
  dawnunicorn:design('almond','#ad8db8','gentle','dawn-cheeks',{gap:17,rx:7,ry:9,lashes:true}),
  aureliapeacock:design('almond','#4aa9b2','proud','peacock-runes',{gap:13,rx:8,ry:9,lashes:true}),
  dreamserpent:design('dream','#c89bd6','knowing','dream-runes',{gap:17,rx:9,ry:8,pupil:'slit'}),
  amethystowl:design('wise','#bc86e0','solemn','amethyst-runes',{gap:19,rx:12,ry:12,pupil:'diamond'}),
  worldturtle:design('wise','#bd9c4b','solemn','forest-runes',{gap:10,rx:8,ry:7,pupil:'diamond'}),
  astralkoi:design('almond','#7ecddd','calm','astral-runes',{gap:12,rx:10,ry:10,pupil:'star'}),
  solarkirin:design('fierce','#e7a438','proud','solar-runes',{gap:18,rx:9,ry:8,pupil:'slit'}),
  celestialgriffin:design('almond','#6bd1bd','proud','sky-runes',{gap:17,rx:10,ry:8,pupil:'diamond'}),
  seraphdeer:design('almond','#d9b75b','gentle','seraph-runes',{gap:17,rx:8,ry:9,lashes:true,pupil:'diamond'}),
  voiddragon:design('fierce','#b896ef','solemn','void-runes',{gap:19,rx:10,ry:8,pupil:'slit',otherIris:'#74c8df'})
};

function eyeShape(kind,rx,ry) {
  if(['almond','dream','wise'].includes(kind))return `M${-rx} 1Q${-rx*.25} ${-ry*1.75} ${rx} -1Q${rx*.4} ${ry*1.6} ${-rx} 1Z`;
  if(kind==='fierce')return `M${-rx} ${-ry*.85}L${rx} ${-ry*.15}Q${rx*.5} ${ry*1.7} ${-rx} 0Z`;
  if(kind==='sleepy')return `M${-rx} -2Q0 -1 ${rx} -2Q${rx*.7} ${ry*1.7} ${-rx} -2Z`;
  return `M${-rx} 0a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0`;
}

function eyes(p,s,uid) {
  const paired=!['turtle','whale','koi'].includes(s.shape);
  const sides=paired?[-1,1]:[1];
  return `<g class="pet-eyes" data-eye-style="${p.eyes}">${sides.map(side=>{
    const rx=p.rx,ry=p.ry,cx=paired?side*p.gap:s.shape==='koi'?1:-5;
    const cy=s.shape==='whale'?-1:0;
    const closed=p.eyes==='smile'||(p.eyes==='wink'&&side===1);
    const tilt=['almond','wise','fierce','dream'].includes(p.eyes)?-side*(p.eyes==='fierce'?8:6):0;
    let contents='';
    if(closed)contents=line(`M${-rx} 2Q0 ${-ry-3} ${rx} 2`,ink,2.4);
    else{
      const d=eyeShape(p.eyes,rx,ry),clip=`${uid}-eye-${side===-1?'l':'r'}`;
      const iris=side===1&&p.otherIris?p.otherIris:p.iris;
      const irisX=p.eyes==='curious'?1.4:p.eyes==='wise'?-1:0;
      const irisR=Math.min(rx*.76,ry*.83),pupilR=irisR*.52;
      let pupil=oval(irisX,0,pupilR,pupilR*1.2,ink);
      if(p.pupil==='slit')pupil=path(`M${irisX} ${-ry*.8}Q${irisX-rx*.37} 0 ${irisX} ${ry*.8}Q${irisX+rx*.37} 0 ${irisX} ${-ry*.8}`,ink);
      if(p.pupil==='diamond')pupil=path(`M${irisX} ${-pupilR*1.5}l${pupilR} ${pupilR*1.5}-${pupilR} ${pupilR*1.5}-${pupilR}-${pupilR*1.5}Z`,ink);
      if(p.pupil==='star')pupil=star(irisX,0,pupilR*1.8,cream);
      contents=`<defs><clipPath id="${clip}">${path(d,'#ffffff')}</clipPath></defs>${path(d,'#fff7e8')}<g clip-path="url(#${clip})">${oval(irisX,0,irisR,ry*.9,iris)}${oval(irisX,ry*.4,irisR*.72,ry*.27,iris,'opacity=".55"')}${pupil}${oval(-rx*.32,-ry*.36,rx*.24,ry*.2,'#fffefa')}${oval(rx*.3,ry*.4,.8,1.1,'#fffefa','opacity=".8"')}</g>${path(d,'none',`stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"`)}`;
      if(['fierce','wise','sleepy'].includes(p.eyes))contents+=line(p.eyes==='fierce'?`M${-rx-1} ${-ry-1}L${rx+1} ${-ry*.22-1}`:p.eyes==='sleepy'?`M${-rx-1} -3Q0 -4 ${rx+1} -3`:`M${-rx-1} -1Q0 ${-ry*1.5} ${rx+1} -3`,s.accent,2.4);
      if(p.lashes)contents+=line(`M${rx-1} -3l3-3m-4 1 2-4`,ink,1.4);
    }
    // Mirror the sloping lid toward the nose, so an angry pair is symmetrical.
    const mirror=side===1&&['fierce','wise','almond','dream'].includes(p.eyes)?-1:1;
    return `<g transform="translate(${cx} ${cy}) rotate(${tilt})"><g transform="scale(${mirror} 1)">${contents}</g></g>`;
  }).join('')}</g>`;
}

function muzzle(s,p) {
  const a=s.accent,shape=s.shape;
  let under='',mouth='',over='';
  const smile=(y=15,w=7)=>line(`M${-w} ${y}q${w} 7 ${w*2} 0`);
  const nose=(y=9,w=5,color=ink)=>path(`M${-w} ${y-2}Q0 ${y-4} ${w} ${y-2}L0 ${y+3}Z`,color);
  const splitMouth=(y=12)=>line(`M0 ${y}v3m0 0q-4 6-9 0m9 0q4 6 9 0`);
  if(['fox','cat','wolf','lion'].includes(shape)){
    if(shape==='fox')under=path('M-28 6Q-14 11 0 4Q14 11 28 6Q21 24 0 25Q-21 24-28 6Z',cream);
    else under=oval(-7,12,12,9,cream)+oval(7,12,12,9,cream);
    over=nose(shape==='wolf'?9:8,shape==='cat'?4:5,shape==='cat'?'#b88089':ink);
    mouth=splitMouth();
    if(['grin','pant','roar'].includes(p.mood)){
      mouth=path('M-9 14Q0 17 10 13Q8 26 0 25Q-8 25-9 14Z',ink)+oval(1,22,5,3,'#df9b96');
      if(p.mood==='roar')mouth+=path('m-7 15 3 5 2-4m6-1 2 4 2-5',cream);
    }
    if(p.mood==='sleep')mouth=line('M-5 17q5 3 10 0',ink,1.4);
    if(p.mood==='knowing')mouth=line('M-6 15q3 5 7 2l6-4');
    if(shape==='cat')over+=line('M-16 10l-14-3m15 8-13 2m44-7 14-3m-15 8 13 2',a,1.2);
  }else if(shape==='rabbit'){
    under=oval(0,15,14,8,cream);over=nose(10,3.5,'#c58d98');mouth=splitMouth(13);
    if(p.mood==='curious')mouth+=path('M-3 17h6v6h-6Z','#fffdfa')+line('M0 18v4','#c5bda5',.7);
  }else if(['panda','otter','hamster','seal','hedgehog'].includes(shape)){
    const w=shape==='hedgehog'?11:shape==='hamster'?17:15;
    under=oval(-6,12,w*.72,8,cream)+oval(6,12,w*.72,8,cream);
    over=nose(8,shape==='seal'?6:shape==='hedgehog'?5:4.5);
    mouth=splitMouth(12);
    if(['joy','grin','sing'].includes(p.mood))mouth=path('M-7 15Q0 19 7 15Q7 25 0 25Q-7 25-7 15Z',ink)+oval(0,22,4,2,'#d99b9a');
    if(p.mood==='chew')mouth=path('M-3 16h6v6h-6Z','#fffdfa')+line('M0 16v5','#c3b89d',.8)+line('M-9 15q-4 4-7 0m25 0q4 4 7 0');
    if(shape==='otter'||shape==='seal')over+=line('M-13 12l-11-1m12 5-12 2m37-6 11-1m-12 5 12 2',a,1.1);
  }else if(shape==='axolotl'){
    mouth=line('M-17 10Q0 25 17 10',ink,2.2)+line('m-18 8 1 4m34-4-1 4',a,1.2);
    over=oval(-4,6,1.1,.8,a)+oval(4,6,1.1,.8,a);
  }else if(['bird','penguin','owl','griffin','peacock'].includes(shape)){
    const r=['griffin','owl'].includes(shape)?7:5.5;
    under=oval(0,12,r+3,7,cream);
    if(['griffin','peacock'].includes(shape)||s.id==='phoenix')mouth=path(`M${-r} 9Q0 5 ${r+1} 10Q${r+2} 21 1 24L1 16Q-5 16 ${-r} 9Z`,gold)+line('M-3 12q4 0 6 3','#9e713c',1.1);
    else mouth=path(`M${-r-1} 11Q0 5 ${r+1} 11L0 21Z`,'#dca154')+line(`M${-r} 12Q0 14 ${r} 12`,'#9e713c',1);
  }else if(['deer','kirin','unicorn'].includes(shape)){
    under=oval(0,16,13,9,cream);over=nose(13,4,shape==='deer'?'#766045':ink);
    mouth=line('M0 16v4m0 0q-4 3-7 0m7 0q4 3 7 0',ink,1.2);
    if(p.mood==='proud'||p.mood==='solemn')mouth=line('M-5 21q5 2 10-1',ink,1.3);
  }else if(shape==='dragon'){
    under=path('M-24 8Q0 3 24 8L25 17Q0 29-25 17Z',cream);
    over=oval(-9,11,2,1.3,a,'transform="rotate(-20 -9 11)"')+oval(9,11,2,1.3,a,'transform="rotate(20 9 11)"');
    mouth=p.mood==='grin'?path('M-13 17q13 5 26-1-2 13-13 11-10 1-13-10Z',ink)+path('m-9 18 3 6 2-5m8-1 2 6 3-7',cream):line('M-14 19q14 5 28-1',ink,1.7)+path('m-10 20 3 5 2-4m10-1 2 4 3-5',cream);
    if(s.id==='oceandragon')over+=line('M-21 18q-18 5-17-7m59 7q18 5 17-7',gold,1.4);
  }else if(shape==='turtle'){
    under=oval(-8,12,13,6,cream);mouth=line('M-20 10q10 9 22 2',ink,1.6);over=oval(-20,4,1.6,1.2,a);
  }else if(shape==='whale'){
    mouth=line('M-28 12q20 17 39 1',ink,1.8);over=line('M-23 19q15 13 29 3',s.accent,1.1);
  }else if(shape==='koi'){
    under=oval(-14,13,5,6,cream);mouth=oval(-16,13,2.8,3.6,'#8f6679')+line('M-18 17q-12 11-14 2',gold,1.5);
  }else if(shape==='mushroom'){
    mouth=p.mood==='surprise'?oval(0,13,4.5,6,ink):path('M-10 9Q0 15 10 9Q7 25 0 23Q-7 25-10 9Z',ink)+oval(0,19,5,3,'#ce9390');
  }else if(shape==='bat'){
    under=oval(0,10,12,8,cream);over=path('M-4 6 0 3 4 6 0 11Z','#a07da5');
    mouth=path('M-9 13q9 6 18 0-1 12-9 11-8 0-9-11Z',ink)+path('m-7 15 3 6 2-5m5 0 2 5 3-6',cream);
  }else if(shape==='serpent'){
    under=oval(0,16,19,7,cream);mouth=line('M-16 14q16 10 32 0',ink,1.6)+path('M0 19v8m0 0-3 3m3-3 3 3','none','stroke="#bb7a98" stroke-width="1.8" stroke-linecap="round"');over=oval(-5,9,1,.8,a)+oval(5,9,1,.8,a);
  }else if(shape==='moth'){
    mouth=line('M-3 10q3 4 6 0',ink,1.1);under=oval(-10,7,3,2,'#d99eaa','opacity=".5"')+oval(10,7,3,2,'#d99eaa','opacity=".5"');
  }else if(shape==='manta'){
    mouth=line('M-8 13q8 7 16 0',ink,1.6);under=oval(-19,8,4,2,'#e4b7b0','opacity=".5"')+oval(19,8,4,2,'#e4b7b0','opacity=".5"');
  }else if(shape==='jelly'){
    mouth=oval(0,14,2.5,3,ink);under=oval(-30,10,7,3,'#e8bed8','opacity=".6"')+oval(30,10,7,3,'#e8bed8','opacity=".6"');
  }else mouth=smile();
  return {under,mouth,over};
}

function markings(s,p) {
  const a=s.accent,g=p.gap,mark=p.mark,rare=s.rarity==='SSR';
  const dots=(color,at=1)=>[-1,1].map(side=>[0,1,2].map(i=>oval(side*(g+5+i*2.4),9+(i%2)*3,at,at,color)).join('')).join('');
  const slashes=(color,n=2)=>[-1,1].map(side=>Array.from({length:n},(_,i)=>line(`M${side*(g+4)} ${6+i*4}l${side*7} -3`,color,1.6)).join('')).join('');
  if(mark==='freckles'||mark==='whisker-dots'||mark==='bat-freckles')return dots(a);
  if(mark==='soft-cheeks'||mark==='honey-cheeks')return [-1,1].map(side=>oval(side*(g+6),10,5,3,mark==='honey-cheeks'?'#d79e4d':'#dca5a3','opacity=".5"')).join('');
  if(mark==='gill-dots')return dots('#d484a4',1.5);
  if(mark==='feather-cheeks'||mark==='feather-brows')return slashes(a,mark==='feather-brows'?3:2);
  if(mark==='star-freckles')return star(-g-5,9,3,gold)+star(g+6,9,2.5,gold);
  if(mark==='moon-cheeks')return [-1,1].map(side=>path(`M${side*(g+8)} 6a4 4 0 1 0 0 8 4 4 0 0 1 0-8`,gold)).join('');
  if(mark==='petal-cheeks'||mark==='coral-cheeks')return dots(mark==='petal-cheeks'?'#be819a':'#d99c9c',1.7);
  if(mark==='leaf-cheeks'||mark==='ink-cheeks'||mark==='scale-cheeks')return slashes(a,2);
  if(mark==='ember-cheeks'||mark==='lava-scales')return slashes('#ba7047',2);
  if(mark==='snow-cheeks')return star(-g-5,9,3,'#fff4df')+star(g+5,9,3,'#fff4df');
  if(mark==='cloud-cheeks')return line(`M${-g-8} 6q-4 1-1 4 5 4 8 0m${g*2+5} -4q4 1 1 4-5 4-8 0`,cream,2);
  if(mark==='pollen'||mark==='ribbon-cheeks')return oval(-12,6,1,1,gold)+oval(12,6,1,1,gold);
  if(mark==='jade-cheeks'||mark==='pearl-cheeks'||mark==='ruby-cheeks')return slashes(p.iris,2);
  if(mark==='gold-scales')return line('M9 9q5 5 9 0m-8 6q4 4 8 0',gold,1.4);
  if(mark==='dream-runes'||mark==='moon-tears')return [-1,1].map(side=>path(`M${side*(g+1)} 8l3 5-3 5-3-5Z`,gold)).join('');
  if(mark==='dawn-cheeks'||mark==='storm-cheeks')return slashes(mark==='dawn-cheeks'?'#cb9bab':'#dfc479',2);
  if(mark==='astral-runes')return star(13,12,3,gold)+line('M9 19l7 4 7-6',cream,1.1);
  if(mark==='forest-runes')return slashes(gold,2)+line(s.shape==='turtle'?'M-4-12l3 5 4-4':'M0-19v6m-4-2 4 4 4-4',gold,1.4);
  if(mark==='phoenix-runes'||mark==='solar-runes')return [-1,1].map(side=>path(`M${side*(g+5)} -5l${side*8} -6 ${-side*3} 10 ${-side*4} 5Z`,'#c47c49')).join('');
  if(mark==='sun-runes'||mark==='frost-runes')return slashes(mark==='sun-runes'?'#bd864a':'#56a8c0',2)+path('M0-17 3-12 0-7-3-12Z',mark==='sun-runes'?gold:'#c3edf2');
  if(mark==='eclipse-runes')return slashes(gold,2)+path('M2-19a6 6 0 1 0 1 10 5 5 0 0 1-1-10',gold);
  if(mark==='tide-runes'||mark==='void-runes')return slashes(mark==='tide-runes'?'#4e99ad':'#b8a1dd',3)+star(0,-15,3.5,rare?gold:cream);
  if(mark==='sky-runes'||mark==='seraph-runes'||mark==='peacock-runes'||mark==='amethyst-runes')return slashes(gold,2);
  return '';
}

export function creatureFace(species,uid,fx,fy) {
  const base=portraits[species.id],p=species.awakening||species.shiny?{...base,iris:species.iris||base.iris,otherIris:species.shiny&&species.id==='eclipsecat'?'#a5eaf5':species.id==='voiddragon'?'#e9c57d':base?.otherIris}:base;
  if(!p)throw new Error(`Missing creature portrait: ${species.id}`);
  const {under,mouth,over}=muzzle(species,p);
  return `<g class="pet-face pet-face-${species.shape}" data-face="${species.id}" data-expression="${p.eyes}-${p.mood}" transform="translate(${fx} ${fy})"><g class="pet-muzzle">${under}</g>${eyes(p,species,uid)}<g class="pet-mouth">${mouth}${over}</g><g class="pet-face-marks">${markings(species,p)}</g></g>`;
}
