import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import {E} from '../tests/squad-fixtures.mjs';
import {reefFixture as forestFixture} from '../tests/reef-fixtures.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8')),browser=await chromium.launch({headless:true});
const report={version,motion:[],audio:[],svg:null,errors:[]};
async function open(state,{reducedMotion='no-preference',audio=false}={}){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
  await page.addInitScript(({key,raw,audio})=>{
    localStorage.setItem(key,raw);Math.random=()=>.5;
    if(audio){window.auditTones=[];const Original=window.AudioContext;window.AudioContext=class extends Original{createOscillator(){const oscillator=super.createOscillator(),set=oscillator.frequency.setValueAtTime.bind(oscillator.frequency);oscillator.frequency.setValueAtTime=(hz,at)=>{window.auditTones.push(hz);return set(hz,at);};return oscillator;}};}
  },{key:E.SAVE_KEY,raw:E.serialize(state),audio});
  await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>document.fonts.ready);await page.locator('[data-action="journey-open"]').click();return {context,page};
}
try{
  for(const setting of [{motion:false,reducedMotion:'no-preference'},{motion:true,reducedMotion:'reduce'},{motion:true,reducedMotion:'no-preference'}]){
    const {context,page}=await open(forestFixture({travel:true,motion:setting.motion}),setting);
    try{
      await page.locator('[data-duel="auto"]').click();await page.clock.runFor(50);
      const count=await page.locator('.forest-field').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length);
      if(!setting.motion||setting.reducedMotion==='reduce')assert.equal(count,0);else assert.ok(count>0);
      report.motion.push({...setting,runningAnimations:count});
      if(!report.svg)report.svg=await page.locator('.forest-backdrop').evaluate(e=>({invalid:!!new DOMParser().parseFromString(e.outerHTML,'image/svg+xml').querySelector('parsererror'),missing:[...e.querySelectorAll('[fill^="url"],[stroke^="url"]')].filter(n=>['fill','stroke'].some(a=>{const id=n.getAttribute(a)?.match(/^url\(#([^)]*)\)/)?.[1];return id&&!e.querySelector(`[id="${id}"]`);})).length}));
    }finally{await context.close();}
  }
  for(const enabled of [true,false]){
    const state=forestFixture();state.settings.sound=enabled;const {context,page}=await open(state,{audio:true});
    try{
      await page.locator('[data-move="attack"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(100);
      const first=await page.evaluate(()=>window.auditTones.slice());
      if(enabled)assert.deepEqual(first,[230,350]);else assert.deepEqual(first,[]);
      await page.locator('[data-move="pet:emberbird"]').click();await page.locator('[data-duel="skip"]').click();await page.clock.runFor(100);
      const all=await page.evaluate(()=>window.auditTones.slice());if(enabled)assert.deepEqual(all.slice(2),[140,90]);else assert.deepEqual(all,[]);
      report.audio.push({enabled,leafTones:first,allTones:all});
    }finally{await context.close();}
  }
  assert.deepEqual(report.svg,{invalid:false,missing:0});assert.deepEqual(report.errors,[]);
  fs.writeFileSync(`dist/REEF-EXTRAS-${version}.json`,JSON.stringify(report,null,2)+'\n');console.log('Coastal sound on/off, elemental tones, in-game/system reduced motion and local SVG references passed.');
}finally{await browser.close();}
