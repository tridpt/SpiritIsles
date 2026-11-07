const cream='#fff4df', gold='#d1af65';
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const line=(d,color,width=2)=>path(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const star=(x,y,r,color)=>path(`M${x} ${y-r}q${r*.25} ${r*.75} ${r} ${r}q-${r*.75} ${r*.25}-${r} ${r}q-${r*.25}-${r*.75}-${r}-${r}q${r*.75}-${r*.25} ${r}-${r}`,color);
const gem=(x,y,r,color=gold)=>path(`M${x} ${y-r}l${r*.7} ${r}-${r*.7} ${r}-${r*.7}-${r}Z`,color)+line(`m${x} ${y-r} 0 ${r*2}`,cream,.7);
const flower=(x,y,r,color)=>`<g transform="translate(${x} ${y})">${Array.from({length:5},(_,i)=>ellipse(0,-r*.55,r*.3,r*.55,color,`transform="rotate(${i*72})"`)).join('')}${ellipse(0,0,r*.28,r*.28,gold)}</g>`;
const leaf=(x,y,r,color,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle})">${path(`M0 0Q-${r} -${r} 0 -${r*2}Q${r} -${r} 0 0`,color)}${line(`M0 -2V-${r*1.7}`,cream,.8)}</g>`;
const feather=(x,y,angle,length,color,edge=gold)=>`<g transform="translate(${x} ${y}) rotate(${angle})">${path(`M0 0Q-${length*.3} -${length*.6} 0 -${length}Q${length*.3} -${length*.6} 0 0`,color,`stroke="${edge}" stroke-width=".8"`)}${line(`M0 -3V-${length*.86}`,edge,.8)}</g>`;
const wings=(c,a,large=false)=>[1,-1].map(sign=>`<g transform="translate(90 88) scale(${sign} 1)">${path(large?'M15 17Q32-15 73-62Q79-21 62-16L72-20Q66 5 47 4L58 7Q44 29 20 27Z':'M17 13Q36-13 66-43Q68-10 53-6L61-8Q51 17 20 24Z',c,`stroke="${a}" stroke-width="1.5"`)}${line('M23 15 60-30M33 12 58-10M40 17 51 8',a,1)}</g>`).join('');
const paws=(a)=>ellipse(64,138,13,6,a)+ellipse(111,138,13,6,a);

// New silhouettes share a common drawing scale so they fit every existing game view.
export function creatureShape(s,c,a) {
  let back='',body='',head='',details='',fx=87,fy=76;
  switch(s.shape) {
    case 'panda':
      back=ellipse(55,45,17,17,a)+ellipse(119,45,17,17,a);
      body=ellipse(87,114,37,30,c)+ellipse(87,118,22,23,cream)+paws(a)+path('M55 98Q38 107 53 123l16-14m49-11q24 13 9 26l-17-13',a);
      head=ellipse(87,75,46,36,c)+ellipse(67,75,12,16,a,'transform="rotate(24 67 75)"')+ellipse(107,75,12,16,a,'transform="rotate(-24 107 75)"');
      break;
    case 'otter':
      back=path('M115 114Q165 144 154 105Q142 129 124 99',a);
      body=ellipse(86,110,33,35,c)+ellipse(86,115,23,26,cream)+paws(a);
      head=ellipse(56,49,13,12,a)+ellipse(116,49,13,12,a)+ellipse(86,74,42,33,c)+ellipse(86,91,25,14,cream);
      details=ellipse(85,118,12,10,'#8faaa0')+path('M58 112q10-7 18 6m37-6q-12-6-19 6','none',`stroke="${a}" stroke-width="8" stroke-linecap="round"`);break;
    case 'hedgehog':
      back=path('M39 114 23 102 33 90 20 74 39 67 34 47 54 50 60 29 77 43 90 24 102 43 123 31 126 52 148 50 143 69 160 82 145 96 151 115 133 128Z',a);
      body=ellipse(88,111,42,31,c)+paws(a);
      head=ellipse(87,82,40,31,c)+path('M52 88Q63 105 87 109Q116 103 124 87L87 82Z',cream);
      fy=79;break;
    case 'wolf':
      back=path('M117 116Q159 122 158 75Q147 101 120 92',a)+path('M157 78q-2 16-8 24l-15-9Z',cream);
      body=ellipse(87,112,34,30,c)+path('m67 96 20 8 22-8-8 25-14 9-15-9Z',cream)+paws(a);
      head=path('M49 67 42 20 73 46Q87 40 104 46L132 20 127 70Z',c)+path('m49 36 6 25 12-12m44 1 13-15-3 26',a)+ellipse(87,77,43,32,c)+path('M49 84q18 28 38 26 24 0 39-26L87 91Z',cream);
      break;
    case 'hamster':
      back=ellipse(54,46,16,16,a)+ellipse(120,46,16,16,a);
      body=ellipse(87,114,38,30,c)+ellipse(87,116,24,24,cream)+paws(a);
      head=ellipse(87,78,47,38,c)+ellipse(56,88,14,14,cream)+ellipse(118,88,14,14,cream);
      break;
    case 'penguin':
      body=ellipse(87,105,38,39,c)+ellipse(87,112,26,30,cream)+path('M52 88q-32 34-9 38l19-27m60-13q32 34 9 39l-19-28',a)+paws('#d8af71');
      head=ellipse(87,68,36,33,c)+ellipse(75,75,18,23,cream)+ellipse(99,75,18,23,cream);
      fy=73;break;
    case 'lion':
      back=path('M123 113q38 5 21-24',a,`stroke="${a}" stroke-width="7" stroke-linecap="round"`)+ellipse(142,86,9,11,a);
      body=ellipse(89,116,34,27,c)+paws(a);
      head=Array.from({length:10},(_,i)=>{const t=i*Math.PI/5;return ellipse(87+Math.cos(t)*35,76+Math.sin(t)*31,15,18,a);}).join('')+ellipse(87,76,35,32,c)+ellipse(87,93,22,13,cream);
      break;
    case 'owl':
      body=ellipse(87,104,39,38,c)+ellipse(87,115,26,25,cream)+path('M54 89Q31 104 49 130l20-21m50-20q25 17 7 41l-19-22',a)+paws(a);
      head=path('M46 71 47 30 71 46Q87 40 103 46l24-16 1 43Z',c)+ellipse(87,73,43,33,c)+ellipse(68,74,20,23,cream)+ellipse(106,74,20,23,cream);
      details=line('m74 117 5 5 5-5m6 0 5 5 5-5m-18 13 5 4 5-4',a,1.7);fy=75;break;
    case 'bat':
      back=[1,-1].map(sign=>`<g transform="translate(87 85) scale(${sign} 1)">${path('M20 9Q34-20 65-29l-3 44Q48 0 39 28 32 9 20 27Z',a)}${line('M22 10 62-27M42 12 62-27',c,1.6)}</g>`).join('');
      body=ellipse(87,111,28,29,c)+ellipse(87,115,16,21,cream)+paws(a);
      head=path('M55 61 48 20 74 48h27l26-28-8 44Z',a)+ellipse(87,75,36,30,c);
      break;
    case 'moth':
      back=[1,-1].map(sign=>`<g transform="translate(87 84) scale(${sign} 1)">${path('M5 10Q13-47 60-60Q85-8 28 13Q76 10 62 47Q28 66 4 24Z',c,`stroke="${a}" stroke-width="1.5"`)}${path('M16-2q14-28 39-39Q63-15 29 0M15 26q17-7 32 6Q35 48 15 37',a)}${ellipse(48,-23,6,9,cream)}${line('M10 12 55-44M12 23 49 38',cream,1.4)}</g>`).join('');
      body=ellipse(87,107,11,30,a)+line('M82 105h10m-12 9h14m-12 9h10',c,1.8);
      head=line('M79 61Q64 34 57 45m38 16q14-27 22-16',a,3)+ellipse(57,44,4,4,gold)+ellipse(117,44,4,4,gold)+ellipse(87,78,20,21,c);fx=87;fy=77;break;
    case 'manta':
      back=path('M91 103Q154 126 131 144Q109 153 111 135','none',`stroke="${a}" stroke-width="5" stroke-linecap="round"`);
      body=path('M87 53Q47 32 15 76Q28 116 67 113l20 18 19-18Q146 118 164 76Q126 32 87 53Z',c,`stroke="${a}" stroke-width="1.2"`)+path('M87 85Q53 88 36 78q6 28 37 23l14 15 14-15q29 4 42-23-24 16-56 7',cream);
      head=ellipse(87,75,26,27,c)+path('M66 73Q43 48 52 45L77 63m31 10q23-25 14-28L98 63',c);fy=79;break;
    case 'kirin':
    case 'unicorn': {
      const kirin=s.shape==='kirin';
      back=path('M121 113Q164 115 143 73Q137 87 126 85Q142 108 117 105',a)+path('M58 63Q35 85 52 114l18-16Z',a);
      body=ellipse(97,111,34,23,c)+line('M72 120 67 138m19-15v17m23-19 4 18m11-23 8 20',a,8)+line('m65 138 7 0m11 2h7m20-1h7m12-3h7',gold,3);
      head=path('M66 63 50 41 74 48m31 0 18-15-4 29',c)+ellipse(88,76,33,34,c)+ellipse(87,96,21,13,cream);
      details=kirin?line('M72 48 61 17m5 16-9-6m8 0 5-12m32 33 10-31m-5 16 10-7m-8 1-4-12',gold,3):path('m80 44 7-31 9 31Z',gold)+line('m84 28 9 4m-11 4 12 4',cream,1.3);
      details+=path('M66 49q20-27 39 1l-9 7-8-11-7 11Z',a);break;
    }
    case 'koi':
      back=path('M116 89Q135 45 162 40Q150 76 132 90Q165 89 163 126Q142 122 118 108Z',c,`stroke="${a}" stroke-width="1.2"`)+line('M121 96 156 48m-32 53 34 19',a,1.5)+path('M81 60Q106 23 114 57M68 114q11 31 39 24l-9-22',a);
      body=ellipse(87,90,44,31,c)+path('M49 97q32 24 74 3-23 37-59 14Z',cream)+path('M90 91Q105 114 77 123l-4-26',a);
      head=ellipse(57,86,24,26,c)+path('M43 104Q22 114 27 94M65 104q14 21 22 9','none',`stroke="${gold}" stroke-width="2" stroke-linecap="round"`);
      details=Array.from({length:3},(_,i)=>line(`M${94+i*10} 74q-7 8 0 16`,a,1.1)).join('');fx=58;fy=84;break;
    case 'griffin':
      back=wings(c,a,s.rarity==='SSR')+path('M119 115q44 11 28-23','none',`stroke="${a}" stroke-width="6" stroke-linecap="round"`)+feather(146,97,30,19,c,a);
      body=ellipse(91,113,34,28,c)+ellipse(87,112,22,23,cream)+paws(a);
      head=path('M58 60 52 29l22 16m26 0 24-17-8 32Z',a)+ellipse(86,75,34,32,c)+path('m69 43 15-22 5 14 9-8 3 19',a);
      details=line('m72 111 15 7 15-7m-25 13 10 6 10-6',a,1.5);break;
    case 'peacock':
      back=Array.from({length:9},(_,i)=>{const angle=-64+i*16;return `<g transform="translate(89 119) rotate(${angle})">${feather(0,0,0,89,c,a)}${ellipse(0,-67,7,10,a)}${ellipse(0,-69,4,6,gold)}${ellipse(0,-69,2,3,cream)}</g>`;}).join('');
      body=ellipse(88,112,24,28,c)+ellipse(87,117,15,20,cream)+paws(a);
      head=ellipse(87,79,26,27,c)+line('M79 52 75 32m12 19V25m8 27 5-20',a,2)+[75,87,100].map((x,i)=>ellipse(x,i===1?24:31,4,5,gold)).join('');
      fy=78;break;
    case 'serpent':
      back=path('M54 124Q27 105 43 91Q50 86 60 99Q29 116 63 116Q124 94 139 119Q155 148 86 142Q55 143 54 124Z',a);
      body=path('M61 125Q49 106 61 86L75 71h26q30 42 11 54-14 11-51 0Z',c)+ellipse(87,112,17,21,cream)+line('M73 109h28m-28 8h28m-25 8h21',a,1);
      head=ellipse(87,76,34,29,c)+path('M61 67Q38 45 56 39l20 16m33 12q26-24 8-29L98 55',a);
      fy=75;break;
    default:return null;
  }
  return {back,body,head,details,fx,fy};
}

export function creatureSignature(s,c,a) {
  let back='',front='';const g=gold;
  switch(s.id) {
    case 'coralseal':
      back=line('M42 107 31 82m7 15-13-2m8-5 5-11m95 37 12-29m-8 18 14-5m-10-6-2-11','#d7a6a0',4);
      front=line('M65 47 60 28m3 12-10-6m8 0 6-10m25 20 7-20m-4 11 9-7m-6 1-4-11',a,3)+ellipse(78,42,7,6,'#f5dfcf')+line('M53 102q25 22 57 0',g,1.4)+[ [64,112],[76,116],[88,115],[100,111] ].map(([x,y])=>ellipse(x,y,3,3,'#fff5e6')).join('');break;
    case 'blossomdeer':
      back=line('M62 47 48 25 35 22m19 14 16-13m40 24 17-22 17-1m-23 10-5-14',a,2.5)+[[37,22],[52,33],[70,23],[116,21],[129,29],[145,24]].map(([x,y])=>flower(x,y,7,'#f6dde1')).join('');
      front=flower(113,56,8,'#fff0e3')+line('M68 102q17 10 36-1',g,1.4)+gem(86,110,5,g)+flower(118,112,6,'#fff0e3');break;
    case 'lavadragon':
      back=path('m120 92 34-26-6 25-15-4m-74 8-29-25 4 26 14-8','#e5bb84')+path('m138 109 10-8-1 13 8-3-3 12',a);
      front=gem(87,55,6,'#e9cc8f')+path('M84 103q-6 10 1 16 10 0 8-9-4 5-4 0Z','#d78a5f')+line('m71 120 15 5 15-5',g,1.1);break;
    case 'cloudfox':
      back=[[143,76,17],[158,92,13],[137,100,18],[143,111,13]].map(([x,y,r])=>ellipse(x,y,r,r,'#f1f6e9')).join('')+line('M26 58q-12-8-9-15 6-7 11-1m126 1q16-6 9-16',a,1.5);
      front=path('M56 102q32 10 63-2l-5 12-15 1-13 7-13-7-15-1Z','#e5f0dc')+path('m85 48 4 8 7-8',g)+gem(87,112,5,a);break;
    case 'moonjelly':
      back=ellipse(88,118,66,12,'none',`stroke="${g}" stroke-width=".8" opacity=".6"`);
      front=path('M94 39a11 11 0 1 0 3 19 10 10 0 0 1-3-19',g)+line('M38 94q11-8 22 0 13-8 27 0 14-8 27 0 14-8 27 0',g,1.3)+[ [51,128],[79,139],[102,132],[132,124] ].map(([x,y])=>gem(x,y,4,g)).join('')+[ [48,70],[121,61],[116,83] ].map(([x,y])=>star(x,y,3,'#f8e5bd')).join('');break;
    case 'glowmush':
      back=[[25,40],[155,48],[29,117],[147,123]].map(([x,y])=>ellipse(x,y,7,7,'#eddf97','opacity=".25"')+star(x,y,3,'#c8ac5c')).join('');
      front=star(87,34,7,cream)+line('M29 78q60 25 118 0',g,1.3)+leaf(116,135,12,'#9db581',45)+gem(87,135,5,g);break;
    case 'sproutpanda':front=leaf(88,45,12,a,22)+line('M117 133 125 90','#749865',4)+line('M119 114h6m-4-11h6',cream,1.5);break;
    case 'bubbleotter':back=[ [30,58,7],[145,44,5],[151,74,9] ].map(([x,y,r])=>ellipse(x,y,r,r,'none',`stroke="${a}" stroke-width="1.5"`)).join('');break;
    case 'cinderhog':front=path('M74 42q9-18 18-6 9-5 13 8',cream)+line('m86 37 0-8',a,2);break;
    case 'dandelionpup':front=line('M119 128 132 99',a,2)+Array.from({length:7},(_,i)=>{const t=i*Math.PI*2/7;return line(`M132 99l${Math.cos(t)*9} ${Math.sin(t)*9}`,cream,2);}).join('');break;
    case 'honeyhamster':front=leaf(92,44,10,a,55)+ellipse(67,115,6,10,g)+line('m67 109 0 12',cream,1);break;
    case 'duskbat':front=ellipse(86,117,7,8,'#e9cb86')+star(86,117,4,cream);break;
    case 'maplehog':front=[ [35,73,-45],[61,43,-15],[122,49,25],[143,86,60] ].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})">${path('M0 13-11 0l9 2L0-12 4 1l9-1L3 13Z','#d5a071')}${line('M1-6v20',cream,.9)}</g>`).join('');break;
    case 'frostpenguin':front=path('M55 95q33 13 65 0l-2 12q-32 10-61 0Z',a)+path('m112 104 11 1-3 27-12-2Z',a)+line('m112 126 7 1',cream,1.6)+star(87,44,8,cream);break;
    case 'emberlion':front=line('M72 53 68 62m33-9 5 9',a,2)+path('m78 111 9 13 10-13-10 5Z',g);break;
    case 'zephyrowl':front=path('m72 109 29 1v20l-29-1Z','#f1e7c8')+line('m72 110 14 12 15-11',a,1.5)+ellipse(87,120,3,3,g);break;
    case 'sunmoth':front=Array.from({length:4},(_,i)=>star(35+i*37,48+(i%2)*69,4,g)).join('');break;
    case 'inkwolf':front=path('m82 48 5 8 6-8-6 4Z',cream)+line('m57 69 9-4m45 0 9 4m-40 47 7 6 7-6',a,2);break;
    case 'orchidwing':front=flower(44,48,13,'#f5dce8')+flower(132,48,13,'#f5dce8')+leaf(31,119,12,a,-40)+leaf(146,120,12,a,40)+gem(87,62,5,g);break;
    case 'jadepanda':front=path('M57 99q30 19 61 0l-8 20-23 11-22-11Z',a)+line('M62 104q25 17 51 0',g,2)+ellipse(87,117,8,8,'none',`stroke="${g}" stroke-width="2.5"`)+leaf(97,45,15,a,55)+leaf(104,39,13,a,95)+line('M47 124 64 111',g,4);break;
    case 'pearlray':front=ellipse(87,60,7,8,'#fff3eb')+ellipse(85,57,2,2,'#ffffff')+line('M28 79q23 31 42 17m37 0q24 12 43-17',g,1.1)+[37,49,132,144].map((x,i)=>ellipse(x,87+(i%2)*8,2,2,cream)).join('');break;
    case 'frostkitsune':back=path('M118 113Q167 97 153 42Q130 64 114 88M122 116Q173 136 164 84Q141 96 121 97',c,`stroke="${a}" stroke-width="1"`);front=star(87,53,9,cream)+line('m46 62 7-15m64 16 6-17',cream,2)+gem(87,116,7,a);break;
    case 'rubykirin':front=gem(87,56,8,'#c76f83')+line('m77 112 10 6 9-6m-15 12 6 4 6-4',g,1.5)+flower(136,99,7,'#f4d6bf');break;
    case 'lanternkoi':back=line('M129 112q8 25 22 21',g,1)+path('M140 120h16v17h-16Z','#e7a56f',`rx="4"`)+line('M143 119h11m-12 19h12m-6 0v6',g,2);front=gem(58,66,5,g)+line('M116 66q7 15 6 23',cream,2);break;
    case 'stormgriffin':front=path('m83 48 8-16-2 15h8L86 62l2-14Z',g)+line('m40 79 17 13m79-13-17 13',cream,2)+gem(87,112,7,a);break;
    case 'ribbonmoth':back=path('M42 117Q11 144 40 148Q73 144 58 121m75-4q32 27 3 31-33-4-19-27','none',`stroke="${a}" stroke-width="6" stroke-linecap="round"`);front=gem(87,60,6,g)+[40,132].map(x=>star(x,68,7,cream)).join('');break;
    case 'dawnunicorn':back=path('M49 67Q31 87 47 112l16-12Z','#c8cfe0')+path('M55 66Q38 91 51 112l14-15Z','#e4c3d2');front=flower(114,57,8,'#e5c2d0')+line('m73 113 14 6 13-6',g,1.4);break;
    case 'aureliapeacock':front=gem(87,113,7,g)+line('M70 109q17 21 34 0',g,1.3);break;
    case 'dreamserpent':back=[ [27,55,-20],[143,66,25] ].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})">${path('M0 0q-20-20-17 1 0 10 17 7Q20-13 19 3 17 15 0 8Z',a)}${line('M0 0v14',g,1)}</g>`).join('');front=path('M91 46a9 9 0 1 0 1 14 7 7 0 0 1-1-14',g)+line('m56 120 8 6 9-6m49 5 7 5 7-6',cream,1.2);break;
    case 'amethystowl':front=gem(87,50,10,a)+gem(87,50,5,'#e2d1ef')+path('M54 95q33 22 66 0l-8 15q-25 16-50 0Z',a)+line('M57 100q30 19 60 0',g,1.2)+star(87,121,6,g);break;
    case 'forestking':
      back=line('M66 48 51 17 34 13m22 15 16-15m36 35 15-31 18-5m-25 17-13-14',a,3)+[[34,14,-40],[48,18,-20],[72,13,30],[124,17,20],[141,12,55],[106,17,-25]].map(([x,y,r])=>leaf(x,y,9,a,r)).join('');
      front=flower(51,23,8,'#f0d8b2')+flower(126,22,8,'#f0d8b2')+gem(87,54,7,g)+path('M62 100q20 15 45 0l-5 13-15 8-18-9Z',a)+line('M65 104q21 13 39 0',g,1.5)+[104,117,97].map((x,i)=>star(x,106+i*7,3,g)).join('');break;
    case 'oceandragon':
      back=path('M52 99Q6 90 24 43Q44 51 62 82M117 96Q174 78 155 33Q131 51 113 79',c,`stroke="${g}" stroke-width="1.1"`)+line('M29 51 52 92m-16-14 15 3m99-40-31 47m21-19-16 5',cream,2);
      front=path('m61 49-13-20 18 9m40 7 26-22-9 27',a)+line('M66 38 58 17m6 16 9-9m41 12 9-20m-5 12-10-4',g,2)+gem(87,55,7,'#c5edeb')+line('m71 111 15 7 16-7m-26 16 10 5 10-5',g,1.2)+ellipse(87,106,7,7,'#d5f0e7');break;
    case 'phoenix':
      back=[[-64,71],[-45,87],[-27,103],[27,103],[45,87],[64,71]].map(([r,l])=>feather(89,113,r,l,c,a)).join('')+[-35,0,35].map(r=>feather(120,121,110+r,36,'#e5ad6e',g)).join('');
      front=path('M68 40Q61 18 78 26Q80 6 91 23Q111 12 101 36Z',g)+gem(84,45,6,'#d79565')+line('m64 100 18 8 19-8m-32 14 13 7 13-7',g,1.8)+star(83,112,5,cream);break;
    case 'skywhale':
      back=path('M40 105Q6 87 24 71Q40 70 48 88m74 26q56 7 43-21-15-2-31 9',c,`stroke="${g}" stroke-width="1"`);
      front=path('M93 55q5-18 24-20l28 15-21 14Z','#91b49a')+path('M94 55q24 7 50-5l-15 23-23-4Z','#a59378')+path('M111 43q-14-9-5-16-4-10 7-11 10-7 14 5 15 4 4 15Z','#78a48e')+line('M118 41 117 30','#d6e5bb',2)+line('M55 118q27 27 61 5m-51-4q3 11 9 16m3-13 9 17m5-15 9 12',g,1.1)+star(73,49,6,cream);break;
    case 'sunfox':
      // Nine separate tails, arranged behind the face instead of nine recolored copies.
      back=Array.from({length:9},(_,i)=>`<g transform="translate(91 119) rotate(${-83+i*20.75})">${path('M0 0Q-28-27-7-80Q18-66 8-26Z',c,`stroke="${g}" stroke-width="1"`)}${path('M-7-80Q5-75 10-60L1-47-10-59Z',cream)}${line('M0-14 0-44',g,.8)}</g>`).join('');
      front=path('m69 48 18 10 18-10-7 12H76Z',g)+gem(87,57,5,'#fff1be')+path('M65 106q22 12 45 0l-9 13-14 7-16-9Z',g)+gem(87,117,7,cream);break;
    case 'eclipsecat':
      back=path('M122 116Q165 121 153 61Q137 73 132 94',a)+path('M146 62a16 16 0 1 0 9 25 14 14 0 0 1-9-25',g);
      front=path('m71 46 5 13 11-7 12 7 6-13-17 6Z',g)+gem(87,55,5,'#d8caef')+path('M65 108q22 14 45-1l-8 16-15 7-16-9Z',a)+line('M67 112q20 14 41-1',g,1.5)+path('M90 115a7 7 0 1 0 2 12 6 6 0 0 1-2-12',g)+[ [112,119],[67,120],[112,59] ].map(([x,y])=>star(x,y,3,cream)).join('');break;
    case 'worldturtle':
      back=path('M77 83Q78 52 102 32l12-3-12 23 26-15-15 22-17 13-4 16Z','#9b865d')+line('M94 61 75 42m20 14 10-25m0 18 25-15',g,2)+[[77,36,21,14],[99,21,23,15],[123,30,24,15],[109,44,28,13],[63,46,17,12]].map(([x,y,rx,ry],i)=>ellipse(x,y,rx,ry,i%2?a:c)).join('')+[[73,31,-45],[115,18,30],[133,29,65]].map(([x,y,r])=>leaf(x,y,11,'#b9dcba',r)).join('');
      front=line('M58 114q31-27 76 0M78 93l5 20m26-20-7 20',g,2)+gem(100,96,8,g)+[ [75,37],[123,31],[106,17] ].map(([x,y])=>flower(x,y,6,'#f6e2b5')).join('')+gem(44,93,5,g);break;
    case 'astralkoi':
      back=path('M104 81Q120 13 169 20Q148 42 131 79M116 100Q161 100 162 147Q125 147 105 114',c,`stroke="${g}" stroke-width="1"`)+line('M123 73q15-32 35-46m-34 83q23 5 31 26',cream,2)+[ [145,36],[141,123],[161,90] ].map(([x,y])=>star(x,y,5,g)).join('');
      front=gem(59,65,7,g)+path('M45 64 51 48l7 10 8-12 8 19Z',g)+line('m99 74 8 4 9-5m-15 14 8 4 10-5',cream,1.4)+ellipse(115,56,7,7,'#c9e7e7');break;
    case 'solarkirin':
      back=path('M56 95Q28 69 42 37Q62 43 69 69M116 118Q174 129 153 58Q141 66 135 88',a)+path('M39 81Q21 67 39 43Q39 63 51 65m95 39q23-15 11-37-2 18-15 15','#efcf92');
      front=path('M61 49Q48 20 65 10Q61 31 77 40m26 8q25-21 13-38 0 24-22 31',g)+ellipse(87,26,11,11,'#efd697')+star(87,26,8,cream)+gem(87,56,8,'#c87369')+path('M62 99q25 15 49-2l-4 17-20 13-19-13Z',a)+line('M64 104q23 15 46-2m-38 13 15 7 14-8',g,1.7)+[ [71,138],[88,139],[116,138],[133,135] ].map(([x,y])=>star(x,y,4,g)).join('');break;
    case 'celestialgriffin':
      back=[1,-1].map(sign=>`<g transform="translate(89 115) scale(${sign} 1)">${[-20,-40,-60].map((r,i)=>feather(20,0,80+r,49+i*8,c,g)).join('')}</g>`).join('');
      front=path('m64 47 9-25 12 13 10-19 10 27-17 11Z',g)+gem(87,44,7,'#cce7dc')+line('m40 66 12 13m-7-5 15 13m74-21-12 13m7-5-15 13',g,1.6)+path('M62 100q25 13 51 0l-7 17-19 12-18-13Z',a)+line('m67 105 20 14 20-14',g,1.6)+gem(87,116,7,cream);break;
    case 'seraphdeer':
      back=wings(cream,g,true)+[-35,0,35].map(r=>feather(133,115,100+r,30,c,g)).join('');
      front=ellipse(88,23,27,7,'none',`stroke="${g}" stroke-width="2"`)+line('m88 16 0-7m-18 12-5-5m41 5 5-5',g,1.3)+path('m71 45 9 8 8-5 9 5 8-8-6 15H77Z',g)+gem(88,57,5,'#f7e5ad')+path('M62 102q25 15 51-1l-7 18-19 11-18-12Z',g)+line('m70 109 17 12 17-12',cream,1.4)+flower(120,58,8,'#f5e5bf');break;
    case 'voiddragon':
      back=[1,-1].map(sign=>`<g transform="translate(87 89) scale(${sign} 1)">${path('M19 9Q31-28 68-60L65 1Q53-15 44 15 35-1 22 28Z',c,`stroke="${g}" stroke-width="1.1"`)}${line('M23 13 66-57M44 14 66-57',a,1.8)}${line('M34-5 48-20l8 17',g,.8)}${[ [36,-6],[48,-20],[56,-3] ].map(([x,y])=>star(x,y,2.4,cream)).join('')}</g>`).join('');
      front=path('M61 51Q42 32 56 9Q57 32 74 39m30 9q29-22 16-39 0 26-21 30',g)+gem(87,55,7,'#ddd0f2')+path('M65 105q21 15 44-1l-6 18-16 11-15-11Z',a)+path('M90 110a10 10 0 1 0 3 18 9 9 0 0 1-3-18',g)+line('m71 104 16 5 17-6',g,1.2);break;
  }
  if(s.id==='forestking'||s.id==='worldturtle')back=`<g transform="translate(0 ${s.id==='forestking'?8:6})">${back}</g>`;
  return {back,front};
}

export function rarityArt(s,uid) {
  const rank=['N','R','SR','SSR'].indexOf(s.rarity);const a=s.accent;
  const glow=s.glow||a;
  const defs=`<radialGradient id="${uid}-aura"><stop stop-color="${a}" stop-opacity=".32"/><stop offset=".55" stop-color="${a}" stop-opacity=".14"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>${s.shiny?`<radialGradient id="${uid}-shiny-aura"><stop stop-color="${glow}" stop-opacity=".6"/><stop offset=".45" stop-color="${glow}" stop-opacity=".25"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`:''}`;
  if(rank<2&&!s.shiny)return {defs,aura:'',sparkles:''};
  let aura=ellipse(90,80,83,76,`url(#${s.shiny?`${uid}-shiny-aura`:`${uid}-aura`})`);
  if(s.shiny)aura+=`<g class="shiny-orbit" fill="none" stroke="${glow}"><ellipse cx="90" cy="80" rx="79" ry="72" stroke-width="1.2" stroke-dasharray="2 7"/><ellipse cx="90" cy="80" rx="70" ry="64" stroke-width=".7" opacity=".7"/></g>`;
  aura+=`<g class="pet-summon-seal" fill="none" stroke="${rank===3?gold:a}"><ellipse cx="90" cy="145" rx="58" ry="9" stroke-width="1" opacity=".65"/><ellipse cx="90" cy="145" rx="50" ry="6" stroke-width=".6" stroke-dasharray="4 5" opacity=".65"/></g>`;
  if(rank===3)aura+=`<g class="legend-orbit">${ellipse(90,80,77,69,'none',`stroke="${gold}" stroke-width=".9" opacity=".72"`)}${ellipse(90,80,73,65,'none',`stroke="${gold}" stroke-width=".6" stroke-dasharray="1 5" opacity=".6"`)}<path d="M21 54l5-14 14-10M140 27l13 11 6 13M151 122l-10 9m-102-1-9-9" fill="none" stroke="${gold}" stroke-width="1.5" opacity=".6"/>${[ [21,55],[156,111],[142,35],[90,11] ].map(([x,y])=>gem(x,y,3.5,gold)).join('')}</g>`;
  const sparkles=`<g class="pet-sparkles ${s.shiny?'shiny-sparkles':''}">${[ [23,43,rank===3||s.shiny?5:3],[149,25,rank===3||s.shiny?6:3],[157,123,3],[27,124,2] ].map(([x,y,r])=>star(x,y,r,s.shiny?glow:rank===3?gold:a)).join('')}</g>`;
  return {defs,aura,sparkles};
}
