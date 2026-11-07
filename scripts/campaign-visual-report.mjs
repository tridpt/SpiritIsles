import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {CAMPAIGN_CHAPTERS} from '../web/js/campaign-data.js';
import {itemThumbnail} from '../web/js/island-layout-art.js';
import {landscapeArt} from '../web/js/world-art.js';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4189/');
  const artwork=await page.evaluate(html=>{
    const parser=new DOMParser();return html.map(({id,svg})=>{const doc=parser.parseFromString(svg,'image/svg+xml');return {id,valid:!doc.querySelector('parsererror'),viewBox:doc.documentElement.getAttribute('viewBox'),invalidNumbers:/NaN|Infinity|undefined/.test(svg)};});
  },CAMPAIGN_CHAPTERS.flatMap(ch=>[{id:ch.decoration,svg:itemThumbnail(ch.decoration)},{id:ch.id+'-scenery',svg:landscapeArt(ch.element,{className:'campaign-scenery'})}]));
  assert.ok(artwork.every(a=>a.valid&&!a.invalidNumbers));assert.deepEqual(errors,[]);
  const frames=fs.readdirSync('dist/screenshots').filter(f=>f.startsWith('campaign-')&&f.endsWith(`-${version}.png`)).map(name=>({path:`screenshots/${name}`,bytes:fs.statSync(path.join('dist/screenshots',name)).size}));
  for(const size of ['320x640','390x844','768x1024','1440x1000','844x390'])for(const scene of ['map-forest','map-reef','map-volcano','brief','fight'])assert.ok(frames.some(f=>f.path.endsWith(`campaign-${scene}-${size}-${version}.png`)));
  for(const scene of ['first-clear','sweep','forest-phase-two','reef-phase-two','volcano-phase-two','forest-chapter-clear','reef-chapter-clear','volcano-chapter-clear'])assert.ok(frames.some(f=>f.path.endsWith(`campaign-${scene}-${version}.png`)));
  const report={version,viewports:5,artwork,frames,errors,completedAt:new Date().toISOString()};fs.writeFileSync(`dist/CAMPAIGN-VISUAL-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log(`${frames.length} campaign frames and ${artwork.length} SVG assets verified.`);
}finally{await browser.close();}
