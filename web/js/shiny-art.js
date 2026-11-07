const path=(d,c,extra='')=>`<path d="${d}" fill="${c}" ${extra}/>`;
const line=(d,c,w=1.5)=>path(d,'none',`stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`);
const star=(x,y,r,c)=>path(`M${x} ${y-r}l${r*.3} ${r*.7} ${r*.7} ${r*.3}-${r*.7} ${r*.3}-${r*.3} ${r*.7}-${r*.3}-${r*.7}-${r*.7}-${r*.3} ${r*.7}-${r*.3}Z`,c);
const flower=(x,y,c)=>`<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<ellipse cy="-4" rx="3" ry="5" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="2.5" fill="#ffe8a7"/></g>`;
export function shinyArt(id,s){
  const g=s.accent,c=s.glow,cream='#fff2d1';let rear='',front='';
  if(id==='mossfox'){
    rear=path('M122 117Q176 109 156 57L140 76 148 53Q113 74 121 107Z','#c88a36',`stroke="${g}" stroke-width="1.2"`)+line('M128 111 151 66m-14 26 14-5m-17 13 10 1',cream);
    front=path('M86 46Q59 31 66 14Q86 20 89 37Q97 15 114 18Q111 37 92 45Z',g)+line('M88 41 72 22m20 19 14-16',cream)+star(47,42,4,c)+star(138,113,3,c);
  }else if(id==='axolotl'){
    rear=[[-1,32],[1,143]].map(([sign,x])=>`<g transform="translate(${x} 75) scale(${sign} 1)">${[-28,0,28].map(a=>`<g transform="rotate(${a})">${path('M0 0 9-5 29 0 12 6Z',c,`stroke="${g}" stroke-width="1"`)}${line('M9-4 13 5 27 0',cream,.8)}</g>`).join('')}</g>`).join('')+path('M124 121Q177 135 171 91Q153 114 130 105Z',g)+line('M135 118q24 5 30-15',c,3);
    front=[[-1,58],[1,116]].map(([n,x])=>star(x,112,4,c)).join('')+path('M79 46 87 30 97 46 87 54Z',g)+path('M84 44 87 36 91 45 87 48Z',c);
  }else if(id==='blossomdeer'){
    rear=[-1,1].map(sign=>`<g transform="translate(90 103) scale(${sign} 1)">${path('M17 8Q38-32 74-50Q68-17 42-4Q72-4 69 21Q38 24 17 8Z','#bf91d5',`stroke="${g}" stroke-width="1"`)}${line('M23 8 64-37M31 10l29 7',cream,1.4)}${flower(55,-23,'#eec2e5')}</g>`).join('');
    front=flower(56,23,'#f2d4ec')+flower(120,20,'#d9b1ed')+star(112,108,4,c)+star(100,117,3,c)+line('M101 117l11-9 9 12',cream,1);
  }else if(id==='forestking'){
    rear=line('M65 47 50 24 29 15m22 11 5-17m-7 15-22 9m83 14 15-22 25-12m-26 14-2-18m5 14 23 8',g,3)+[[29,14,-35],[26,32,-70],[56,9,12],[122,9,-10],[150,14,40],[150,31,75]].map(([x,y,a])=>`<ellipse cx="${x}" cy="${y}" rx="6" ry="12" fill="${g}" transform="rotate(${a} ${x} ${y})"/>`).join('')+`<ellipse cx="88" cy="23" rx="29" ry="10" fill="none" stroke="${c}" stroke-width="1.3"/>`;
    front=path('M72 46 77 35 87 43 99 35 104 46 88 56Z',g)+star(88,47,6,cream)+line('M64 105q23 19 47-1M77 114l10 8 10-8',c,2)+flower(36,29,cream)+flower(140,29,cream);
  }else if(id==='oceandragon'){
    rear=[-1,1].map(sign=>`<g transform="translate(87 92) scale(${sign} 1)">${path('M20 10Q27-39 77-73L67-23 77-4Q47-17 22 26Z','#8995d2',`stroke="${c}" stroke-width="1.3"`)}${line('M22 18 74-67 49-4 70-5M30-5 58-21',cream,1.2)}${star(53,-27,5,cream)}${star(65,-46,3,c)}</g>`).join('')+line('M21 73Q1 118 27 131m125-58q28 43 3 58',c,2)+star(26,133,5,cream)+star(155,133,5,cream);
    front=path('M61 50 47 22 68 35 79 28 86 44 94 27 106 35 130 19 114 51Z',g,`stroke="${c}" stroke-width="1"`)+path('M80 52 87 39 95 52 87 62Z',c)+line('M68 114q19 11 39 0m-33 10q14 9 27 0',c,2);
  }else if(id==='eclipsecat'){
    rear=[[-47,62],[-16,80],[25,71]].map(([a,h])=>`<g transform="translate(117 123) rotate(${a})">${path(`M0 0Q36-13 25-${h}Q3-${h-25} 2-20Z`,'#7766a6',`stroke="${g}" stroke-width="1"`)}${line(`M11-19 22-${h-7}`,c,1)}${star(19,-h+12,3,cream)}</g>`).join('')+`<circle cx="91" cy="75" r="63" fill="none" stroke="${g}" stroke-width="1.1" stroke-dasharray="35 8 3 8"/>`+path('M143 29a27 27 0 1 0 13 43 24 24 0 0 1-13-43',g);
    front=path('M57 66 72 57 83 65 88 55 94 65 107 56 120 66 107 75 95 70 88 79 80 70 68 76Z',g,`opacity=".85"`)+path('M84 48a7 7 0 1 0 9 9 6 6 0 0 1-9-9',c)+line('M64 112q24 17 47-2',c,2)+star(88,122,7,c);
  }
  return {rear:`<g class="shiny-anatomy" data-shiny-design="${id}">${rear}</g>`,front:`<g class="shiny-details">${front}</g>`};
}
