import { STRUCTURE_MODELS } from './island-structures.js';
import { GRID, itemOf, sizeOf, project, anchorOf } from './island-layout.js';
import {structureMaterials,islandTree} from './world-art.js';

const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const oval=(x,y,rx,ry,fill)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const line=(d,color='#907a55',width=3)=>path(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const leaf=(x,y,c)=>oval(x,y,14,8,c)+line(`m${x-9} ${y+2} 15-4`,'#dbe8b8',1.5);
const shadow=(w=29)=>oval(0,0,w,10,'#3f6d452a');
const star=(x,y,c='#ffe7a1')=>path(`M${x} ${y-10}l3 7 8 3-8 3-3 8-3-8-8-3 8-3Z`,c);
function tree(pink=false) {
  return islandTree(pink);
}
export function itemModel(type,rotation=0) {
  let art=STRUCTURE_MODELS[type];
  if(!art)switch(type){
    case 'hearttree':art=shadow(33)+path('M-8 0Q-4-30-13-59l22-1Q1-26 8 1Z','#aa8056')+path('M0-56C-32-93-57-49-25-33L0-15 25-33C57-49 32-93 0-56Z','#4c956c')+path('M0-51C-20-76-34-50-16-39L0-28 16-39C34-50 20-76 0-51Z','#a6d28a')+star(0,-47,'#ffe3a0')+leaf(-28,-41,'#7eb781')+leaf(25,-44,'#c3d796');break;
    case 'tideshell':art=shadow(32)+path('m-27-3 27-14 27 14-27 14Z','#92b4b1')+path('M0-10C-62-35-31-84-13-63Q0-83 13-63C31-84 62-35 0-10Z','#d4b6d5')+path('M0-13Q-14-44-13-63M0-13v-56M0-13Q14-44 13-63','none','stroke="#f5dce5" stroke-width="3"')+oval(0,-26,13,12,'#d9efdf')+star(0,-28,'#fff3bc')+star(-31,-63,'#b8ede6');break;
    case 'dawnbeacon':art=shadow(31)+path('m-27-4 27-13 27 13-27 14Z','#a3aa9a')+path('M-14-8-10-71 10-71 14-8 0 0Z','#f2d9a7')+path('M0 0V-71l10 0 4 63Z','#c9a079')+path('m-18-72 18-11 18 11-18 11Z','#c58a58')+path('m-13-72 13 7 13-7v-19l-13-8-13 8Z','#84b9b1')+star(0,-82,'#fff1a9')+path('m-20-95 20-19 20 19-20 11Z','#d18c52')+line('m-34-87-15-6m83 6 15-6M0-121v-9','#ffdc8b',3);break;
    case 'prismfox':art=shadow(25)+path('m-23-4 23-12 23 12-23 12Z','#a79ac2')+path('m-19-8 19-9 19 9-19 8Z','#e3c784')+path('M-8-16Q-34-25-26-61Q-7-44-6-33Z','#b9864b')+oval(0,-30,16,21,'#dec28c')+path('M-15-50-17-76-3-63Q5-67 11-63L26-75 23-48Q25-30 4-32Q-16-32-15-50Z','#e4cf9f')+path('m-15-65 3 12 7-6m17 0 8-8-1 14','#b9864b')+oval(-3,-49,2,3,'#4d435c')+oval(12,-50,2,3,'#4d435c')+line('m2-43 3 3 3-4','#66516b',1)+star(5,-85,'#f5df98');break;
    case 'prismgate':art=shadow(42)+path('m-38-4 38-17 38 17-38 18Z','#aaa1c2')+path('M-31-7V-64Q0-98 31-64V-7l-10-4v-48Q0-80-21-59v48Z','#7a6d9c')+path('M-31-65Q0-100 31-65l-10 5Q0-81-21-59Z','#d7bd88')+path('M-21-57Q0-83 21-57v38Q0-45-21-19Z','#b0cfe3')+path('M-21-54Q0-70 21-51v9Q0-61-21-41Z','#c7aedf')+path('M-21-37Q0-59 21-38v9Q0-47-21-28Z','#86c8c8')+line('M-27-55v39m54-39v39','#d2b777',2)+star(0,-87,'#ffe2a0')+star(-31,-67,'#e8dbfa')+star(31,-67,'#d8f3f0');break;
    case 'towerlamp':art=shadow(24)+path('m-20-5 20-10 20 10-20 10Z','#9386b7')+line('M0-5v-50','#aba1c2',7)+path('m-18-54 18-10 18 10-18 12Z','#ddd3ea')+path('m-14-53 14 8 14-8v22l-14 9-14-9Z','#7e75ad')+star(0,-39,'#ffe8a4')+star(0,-78,'#fce4a3');break;
    case 'towerstatue':art=shadow(30)+path('m-27-3 27-13 27 13-27 14Z','#d1c7dd')+[-18,-41,-64].map((y,i)=>path(`M${-18+i*2} ${y} 0 ${y-9} ${18-i*2} ${y}v21L0 ${y+31}l${-18+i*2}-10Z`,'#9185b0')+path(`m${-22+i*2} ${y} ${22-i*2}-11 ${22-i*2} 11-22 11Z`,'#e5d8e7')).join('')+path('m-18-68 18-31 18 31-18 11Z','#b6a3d4')+star(0,-104,'#ffdf8a');break;
    case 'starlitlantern':art=shadow(48)+path('m-43-5 43-19 43 19-43 20Z','#8b7fae')+path('m-43-5 43 20 43-20v8L0 23-43 3Z','#665983')+line('M-32-8V-75Q0-113 32-75V-8','#7d699f',9)+line('M-32-10V-75Q0-111 32-75V-10','#d8b775',3)+line('M-25-72Q0-48 25-72','#ffdf91',2)+[-22,0,22].map((x,i)=>line(`M${x} ${i===1?-59:-66}v${i===1?18:12}`,'#eadca9',1.5)+oval(x,i===1?-39:-50,7,10,'#f3cc78')+star(x,i===1?-40:-51,'#fff4c4')).join('')+star(0,-102,'#ffe4a3')+star(-41,-82,'#e6ccfa')+star(41,-82,'#d4f3e8')+leaf(-35,-8,'#9ab79c')+leaf(34,-10,'#c7c996');break;
    case 'sapling':art=tree();break;
    case 'cherry':art=tree(true);break;
    case 'palm':art=shadow()+path('M-6-2Q9-37 3-77l8-1Q18-32 3 1Z','#b69c70')+line('M0-18 9-17m-6-14 8 1m-6-15 8 1','#d8c091',3)+['M6-74Q-48-103-48-51Q-24-76 6-74','M7-74Q43-107 54-61Q28-82 7-74','M7-74Q-12-120-31-96Q-10-96 7-74','M7-74Q26-122 42-96Q23-100 7-74'].map((d,i)=>path(d,['#759f79','#9dba86','#8dab78','#b1c895'][i])).join('')+oval(4,-68,7,9,'#b09a69')+oval(14,-69,6,8,'#c1aa7a');break;
    case 'flowers':art=shadow()+path('m-28-7 30-13 28 14-30 14Z','#ad9b70')+path('m-28-7 28 14v7l-28-14m28 7 30-14v7L0 14','#897f5a')+[-18,-5,10,23].map((x,i)=>line(`m${x} -4 1-${15+i%2*7}`,'#769968',2)+leaf(x-2,-13,'#a8bd7a')+oval(x,-25-i%2*7,7,6,i%2?'#e4a79d':'#f0d895')+oval(x,-26-i%2*7,2,2,'#b58d54')).join('');break;
    case 'rockery':art=shadow()+path('m-28-2 10-24 21-7 16 25-5 13Z','#a2b6a1')+path('m-18-26 21-7 16 25L-6-6Z','#cbd2b5')+path('m2 2 15-15 18 9-2 16Z','#879d8c')+oval(-14,-3,14,5,'#7d9a65')+leaf(20,2,'#afbd85');break;
    case 'path':art=path('m0-14 33 14L0 14-33 0Z','#c3ad7e')+path('m0-11 27 11L0 11-27 0Z','#e7d4a5')+line('M-13-4 13 6m-2-12L-13 5','#c8b689',1);break;
    case 'stepping':art=oval(-14,-4,13,6,'#9aab92')+oval(-14,-6,13,5,'#cdd2af')+oval(12,5,15,7,'#91a28b')+oval(12,2,15,6,'#e0dbba');break;
    case 'fence':art=shadow(45)+line('M-38-9v-41M0 8v-40M38-10v-38','#a58b60',7)+line('m-37-38 37 17 38-17m-75 13 37 18 38-18','#d9c294',6)+line('m-37-40 37 17 38-17','#f3e0b4',2);break;
    case 'lantern':art=shadow(18)+line('M0-2v-69m-13 4 13-11 13 11','#8c9470',5)+path('m-12-60 12-6 12 6-1 25-11 7-11-7Z','#e9bd6b')+path('m-9-57 9-5 9 5v19l-9 6-9-6Z','#fff1b0')+line('M0-61v25','#c7a06c',2)+star(0,-48,'#fffbe0');break;
    case 'bench':art=shadow(40)+line('m-30-7 0-18m48 23 0-18','#8a7955',5)+path('m-39-31 47-20 30 15-47 22Z','#c5ab7b')+path('m-39-31 30 17v9l-30-17m30 17 47-22v9L-9-5','#9d895e')+line('m-34-33 48-19M-34-45 13-65m-43 13L-29-18M10-64v29','#a5aa7b',6)+path('m-33-46 47-20v18l-47 20Z','#b5c397')+line('m-29-43 39-17','#dce3b5',2);break;
    case 'swing':art=shadow(45)+line('M-42-1-29-93 38-64 47 10M-29-93-7-105 58-76 38-64M58-76 69-1','#a39169',6)+line('M-20-84-18-27m43-38 0 57','#e6d7b2',2)+path('m-29-28 43-18 26 12-43 20Z','#9fb999')+line('m-27-28 25 12 43-18','#d9e5b8',3)+leaf(-13,-99,'#b4ca99')+leaf(49,-79,'#94b18a');break;
    case 'pond':art=shadow(54)+oval(0,-7,54,26,'#a6b69a')+oval(0,-12,51,24,'#d4d4ad')+oval(0,-13,44,19,'#80b9b5')+oval(-4,-17,31,11,'#aed6c8')+line('M-28-14q12-5 23-1m10 8 16-4','#d9eee0',2)+leaf(15,-20,'#82a76f')+oval(17,-25,7,4,'#edd2c0')+leaf(-23,-7,'#b5c88b');break;
    case 'moonlamp':art=shadow(27)+path('M-7-5-5-52H6L9-5Z','#c5bfbe')+path('M-36-47Q-37-92 0-97Q40-88 37-47Q3-28-36-47Z','#9e9dc6')+path('M-31-51Q-22-80 0-84Q22-79 31-51Z','#c8c6e2')+oval(-12,-67,5,7,'#fff0c8')+oval(13,-57,7,5,'#fff0c8')+star(0,-100)+line('M-4-30V-8','#f6e5b0',3);break;
    case 'guardian':art=shadow(31)+path('m-27-7 27-13 29 14-29 13Z','#acb393')+path('m-27-7 27 14 29-13v10L0 18-27 4Z','#839787')+path('M-17-16-20-65-11-91 0-76 13-92 21-65 16-15 0-6Z','#b8c7af')+path('m0-76 13-16 8 27-5 50L0-6Z','#91ad9d')+path('m-10-49 10-17 12 17-12 21Z','#e1c28c')+line('M-10-67-3-64m9 0 9-4','#506d66',2)+star(0,-49,'#fff0c0');break;
    case 'relicgate':art=shadow(46)+path('m-42-4 0-83 19-9 15 8v82l-16 8Zm58-25v-78l18-9 16 8v82l-16 8Z','#bac6b1')+path('m-42-87 19-9 15 8-17 9m41-28 18-9 16 8-17 9','#e1dfbb')+path('m-47-86 69-30 34 17-69 31Z','#ccd4b7')+path('m-13-68 69-31v13L-13-55Z','#93ac99')+line('M-30-65v20m57-31v21','#8d9ba1',3)+star(7,-87,'#e6c587')+leaf(-31,-20,'#94b28b');break;
    case 'hotspring':art=shadow(54)+oval(0,-6,53,23,'#8f7783')+oval(0,-12,50,22,'#dab9a2')+oval(0,-14,40,15,'#8fbbad')+oval(-4,-17,28,9,'#c5dbbc')+line('M-28-15q13-5 25-1m13 7 15-4','#f6edc9',2)+line('M-19-34q-10-10 0-20m20 16q-10-13 0-25m19 29q-10-10 0-20','#ddd4c0',3)+path('m-42-7 4-13 13 3 2 10m53 5 3-14 13 2 2 13','#a68e8d');break;
    case 'lavatree':art=shadow(29)+path('M-7-1-3-65 9-72 15-35 10-1Z','#705160')+line('M2-31-23-49l-5-20m34 45 21-25 5-24','#8b5d65',8)+line('M3-4 6-58m0 26-26-17m26 27 20-24','#f3b77e',2)+oval(-27,-68,9,8,'#e99b70')+oval(34,-74,10,9,'#f3bd7f')+oval(5,-72,10,11,'#ffd89c')+star(9,-96,'#ffdfa1');break;
    case 'stonedragon':art=shadow(32)+path('m-26-3 26-13 28 13-28 14Z','#c3b3a4')+path('m-26-3 26 14 28-14v10L0 22-26 7Z','#897b89')+path('m-19-35-13-24 23 11m29 10 17-29-25 19','#8f7889')+oval(0,-28,23,17,'#9f8994')+path('M-17-37-16-59 0-69 21-54 18-32 0-26Z','#bba7aa')+path('m-15-60-5-16 15 9m14-1 12-18 2 26','#d3bda9')+line('M-10-47-3-44m10 0 9-5','#534960',3)+path('m0-36 7 10-7 11-7-11Z','#f2b879')+line('M-23-23-34-9-21-8m43-15L34-9 22-8','#97818e',5);break;
    case 'coralgarden':art=shadow(34)+oval(0,-3,31,13,'#9bd4c4')+line('M-8-8V-61m0 29-18-13v-18m18 18 19-15v-17m-19 38 28-10v-14','#de9a94',8)+line('M-9-9V-58','#ffd9b3',2)+star(20,-15,'#f6dda2')+oval(-22,-7,6,4,'#78b5ba');break;
    case 'pearllamp':art=shadow(26)+path('M-26-17Q-38-48-18-59-4-67 0-60 19-70 30-48l-4 31Z','#ba9abf')+line('M-22-46-6-20m13-38L3-20m20-26L9-20','#eed1dc',3)+oval(0,-25,19,16,'#f4f6da')+oval(-5,-31,5,4,'#fffdeb')+path('M-29-19q29-15 58 0-7 21-29 19-24 0-29-19Z','#d5aec5')+star(0,-83,'#ffe4a2');break;
    case 'coralcrab':art=shadow(32)+path('m-25-3 25-12 27 12-27 13Z','#d4c69c')+path('m-25-3 25 13 27-13v9L0 19-25 6Z','#a49d87')+line('M-14-29-29-37m44 8 14-8m-39 16-12 5m33-5 12 5','#be856e',6)+path('M-20-32q-9-28 19-31 29 3 21 31Z','#e7b294')+oval(0,-34,21,12,'#cf987f')+line('M-7-51v-12m14 12v-12','#ce9b7e',4)+oval(-7,-63,3,4,'#416b75')+oval(7,-63,3,4,'#416b75')+line('M0-58V-82m0 11-10-8m10 1 10-9','#89bcb0',5);break;
    default:art='';
  }
  return `<g transform="scale(${rotation?-1:1} 1)">${structureMaterials(type,art)}</g>`;
}
export function itemThumbnail(type) {
  const d=itemOf(type),box=d.kind==='building'?'-110 -230 220 255':d.ground?'-42 -25 84 50':'-80 -125 160 150';
  return `<svg class="island-item-thumbnail" viewBox="${box}" role="img" aria-label="${d.name}">${itemModel(type)}</svg>`;
}
export function cellPoints(x,y) {
  return [[x-.5,y-.5],[x+.5,y-.5],[x+.5,y+.5],[x-.5,y+.5]].map(([a,b])=>{const p=project(a,b);return `${p.x},${p.y}`;}).join(' ');
}
export function footprint(p,cls='') {
  const {w,h}=sizeOf(p);
  return Array.from({length:w*h},(_,i)=>`<polygon class="${cls}" points="${cellPoints(p.x+i%w,p.y+Math.floor(i/w))}"/>`).join('');
}
export function layoutPiece(p,editing=false) {
  const a=anchorOf(p),d=itemOf(p.type);
  return `<g class="layout-piece ${d.ground?'layout-ground':''}" data-layout-id="${p.id}" data-layout-type="${p.type}" ${editing?`tabindex="0" role="button" aria-label="Di chuyển ${d.name}"`:''}><g class="layout-footprint">${footprint(p)}</g><g transform="translate(${a.x} ${a.y}) scale(.86)">${itemModel(p.type,p.rotation)}</g></g>`;
}
export function renderLayout(layout,editing=false) {
  const pieces=[...layout.placed].sort((a,b)=>Number(!!itemOf(b.type).ground)-Number(!!itemOf(a.type).ground)||anchorOf(a).y-anchorOf(b).y);
  return `<svg class="island-layout-layer" viewBox="0 0 1000 600" ${editing?'':'aria-hidden="true"'}><g class="layout-pieces">${pieces.map(p=>layoutPiece(p,editing)).join('')}</g></svg>`;
}
export function renderGrid() {
  return `<svg class="island-placement-grid" viewBox="0 0 1000 600" aria-hidden="true">${Array.from({length:GRID.cols*GRID.rows},(_,i)=>`<polygon points="${cellPoints(i%GRID.cols,Math.floor(i/GRID.cols))}"/>`).join('')}</svg>`;
}
