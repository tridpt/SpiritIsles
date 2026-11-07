// Extra silhouettes are species-specific, kept inside the portrait's viewBox.
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(d,color,width=2)=>path(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const star=(x,y,r,c)=>path(`M${x} ${y-r}l${r*.28} ${r*.72} ${r*.72} ${r*.28}-${r*.72} ${r*.28}-${r*.28} ${r*.72}-${r*.28}-${r*.72}-${r*.72}-${r*.28} ${r*.72}-${r*.28}Z`,c);
const leaf=(x,y,angle,c)=>`<g transform="translate(${x} ${y}) rotate(${angle})">${path('M0 0Q-15-12 0-28Q15-12 0 0Z',c)}${line('M0-3V-22','#e8edbf',1)}</g>`;
export function awakeningArt(id,c,a){
  const gold='#e4c379',cream='#fff2ce';let rear='',front='';
  if(id==='mossfox'){
    rear=[[-42,-30],[-12,-60],[24,-70]].map(([r,t])=>`<g transform="translate(119 119) rotate(${r})">${path(`M0 0Q36-8 31${t}Q8-43-3-16Z`,a)}${line(`M3-10Q19-28 28${t+8}`,cream,1.5)}</g>`).join('');
    front=line('M66 48 52 26 51 12m3 17-17-7m18 9 10-16m43 32 12-22 1-13m-3 16 17-8m-17 12-10-17',a,3)+[[38,23,-45],[51,13,-15],[65,17,30],[121,13,10],[136,22,50],[109,18,-35]].map(([x,y,r])=>`<g transform="translate(${x} ${y+12}) scale(.43)">${leaf(0,0,r,c)}</g>`).join('')+path('M60 108Q86 126 115 106l-6 16-21 13-21-12Z',a)+line('m68 115 20 11 18-12',cream,1.5)+star(87,54,5,gold);
  }else if(id==='axolotl'){
    rear=[1,-1].map(side=>`<g transform="translate(88 75) scale(${side} 1)">${[-28,0,28].map((r,i)=>`<g transform="translate(35 0) rotate(${r})">${path(`M0 0Q26-28 ${43-i*2}-13Q32 7 0 5Z`,i===1?c:a)}${line('M5 0Q21-6 32-12',cream,1.3)}</g>`).join('')}</g>`).join('')+line('M44 120Q8 145 31 149Q51 150 60 133m69-15q38 21 17 31-17 5-26-15',a,6);
    front=path('M74 38Q66 23 84 18Q86 7 94 18Q113 21 102 35L89 45Z',a)+path('M88 22q-12 13 0 16 12-3 0-16Z',cream)+line('M65 117q22 10 45-1m-38 10q16 7 30-1',a,2)+[[30,112],[148,119],[136,29]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="${cream}" stroke="${a}"/>`).join('');
  }else if(id==='emberbird'){
    rear=[1,-1].map(side=>`<g transform="translate(82 100) scale(${side} 1)">${[0,1,2].map(i=>path(`M12 6Q${34+i*6} ${-34+i*15} ${68+i*7} ${-49+i*23}Q${59+i*5} ${4+i*8} 17 21Z`,i%2?a:c,`stroke="${gold}" stroke-width="1"`)).join('')}${line('M20 8 65-38m-37 48 45-25m-39 28 44-5',cream,1.4)}</g>`).join('')+path('M103 114Q151 99 146 143l-12-15-8 23-18-25Z',a)+path('M111 119q24-4 24 15l-9-6-7 11Z',gold);
    front=path('M67 39Q53 20 76 28Q73 7 87 19Q99 7 104 23L92 42Z',a)+path('M76 39Q69 22 84 28l6-8 2 17Z',gold)+path('M60 100Q83 119 107 99l-6 16-18 12-17-13Z',a)+star(83,111,6,cream);
  }else if(id==='sunfox'){
    rear=Array.from({length:9},(_,i)=>`<g transform="translate(90 115) rotate(${-82+i*20.5})">${path('M0 0Q-23-36-7-91Q17-77 9-35Z',c,`stroke="${gold}" stroke-width="1.2"`)}${path('M-7-91Q5-81 11-65L1-48-10-64Z',gold)}${line('M0-18V-48',a,1)}${star(0,-65,4,cream)}</g>`).join('');
    front=path('m65 49-4-18 15 10 11-20 12 20 15-10-5 19-22 9Z',gold)+star(87,43,8,cream)+path('M63 105q23 17 49-1l-8 17-17 13-17-13Z',a)+line('m70 111 17 12 17-12',gold,2)+star(87,119,5,cream);
  }else if(id==='phoenix'){
    rear=[1,-1].map(side=>`<g transform="translate(84 109) scale(${side} 1)">${[0,1,2,3].map(i=>path(`M8 6Q${24+i*4} ${-36+i*12} ${67+i*6} ${-87+i*26}Q${78-i*4} ${-3+i*11} 16 22Z`,i%2?a:c,`stroke="${gold}" stroke-width="1"`)).join('')}${line('M17 6 65-77m-43 88 52-59m-46 65 50-39',cream,1.5)}</g>`).join('')+[-30,0,30].map(r=>`<g transform="translate(108 118) rotate(${r})">${path('M0 0Q42-5 40 31L24 21 14 34Z',a)}${star(27,19,5,gold)}</g>`).join('');
    front=path('M65 40Q59 14 77 25Q79 3 91 22Q114 8 107 34L86 47Z',gold)+path('M76 37 86 19l10 18-10 8Z',cream)+path('M60 100q24 18 50-1l-6 18-20 15-18-15Z',a)+line('m65 106 19 14 20-15',gold,2)+star(84,115,7,cream);
  }else if(id==='voiddragon'){
    rear=[1,-1].map(side=>`<g transform="translate(87 90) scale(${side} 1)">${path('M18 8Q29-37 78-70L69-16 77 7 49-6 35 25 24 12Z',a,`stroke="${gold}" stroke-width="1.2"`)}${path('M28 5 73-58 60-15 48-7 36 15Z',c)}${line('M26 8 73-61 49-6m24-55-13 46',cream,1)}${line('M39-13 57-31 62-10',gold,1)}${[[39,-13],[57,-31],[62,-10]].map(([x,y])=>star(x,y,3,cream)).join('')}</g>`).join('');
    front=path('M61 50Q41 28 54 8Q56 31 74 37m30 12q32-24 17-41 0 26-23 31',a)+path('m66 42 1-20 12 11 9-24 10 24 12-11-2 22-20 11Z',gold)+path('m88 20 7 16-7 10-7-10Z','#badce9')+path('M62 104q24 18 50-1l-8 20-17 13-18-14Z',a)+line('m69 109 18 8 18-9',gold,1.5)+star(87,122,7,cream);
  }
  if(['sunfox','phoenix','emberbird'].includes(id))rear=`<g transform="translate(90 85) scale(${id==='phoenix'?.87:.92}) translate(-90 -85)">${rear}</g>`;
  return {rear,front,replaceRear:['sunfox','phoenix','voiddragon'].includes(id)};
}
