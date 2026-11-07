import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {E,squadGame} from '../tests/squad-fixtures.mjs';
import {craftShiny,claimShinyMilestone,setShinyProfile} from '../web/js/shiny.js';
import {SHINY_SPECIES} from '../web/js/data.js';
import {startBoss} from '../web/js/boss-engine.js';
import {placeItem} from '../web/js/island-layout.js';
const browser=await chromium.launch(),results=[],errors=[];
const state=squadGame();state.settings={motion:false,sound:false};state.shiny.fragments=180;
for(const {id}of SHINY_SPECIES)craftShiny(state,id);for(const n of [1,3,6])claimShinyMilestone(state,n);setShinyProfile(state,true);
placeItem(state,state.islandLayout,'prismfox',0,2);placeItem(state,state.islandLayout,'prismgate',6,5);
E.validateSave(E.serialize(state));
try{
  for(const viewport of [{width:320,height:640},{width:390,height:844},{width:768,height:1024},{width:1440,height:1000},{width:844,height:390}]){
    const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
    try{
      await p.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(state)});
      await p.goto('http://127.0.0.1:4189/');await p.evaluate(()=>document.fonts.ready);
      const menu=async destination=>{await p.locator('[data-action="game-menu"]').click();await p.locator(`.game-menu-grid [data-page="${destination}"]`).click();};
      for(const scene of ['island','collection','compare','profile']){
        if(scene==='collection')await menu('shiny');
        if(scene==='compare')await p.locator('[data-shiny-specimen="eclipsecat"] .prism-portrait').click();
        if(scene==='profile'){await p.getByRole('button',{name:'Đóng',exact:true}).click();await menu('journal');}
        const audit=await p.evaluate(()=>{
          const svgs=[...document.querySelectorAll('svg.creature')],badPaths=[],missing=[],invalid=[];
          for(const svg of svgs){
            if(new DOMParser().parseFromString(svg.outerHTML,'image/svg+xml').querySelector('parsererror'))invalid.push(svg.dataset.species);
            const ids=new Set([...svg.querySelectorAll('[id]')].map(e=>e.id));
            for(const e of svg.querySelectorAll('*'))for(const a of ['fill','stroke','clip-path','filter']){
              const ref=e.getAttribute(a)?.match(/url\(#([^)]+)\)/)?.[1];if(ref&&!ids.has(ref))missing.push(ref);
            }
            for(const e of svg.querySelectorAll('path'))if(/NaN|undefined|Infinity/.test(e.getAttribute('d')))badPaths.push(e.getAttribute('d'));
          }
          const animated=[...document.querySelectorAll('.shiny-orbit,.shiny-sparkles')].filter(e=>getComputedStyle(e).animationName!=='none').length;
          return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,creatures:svgs.length,invalid,missing,badPaths,animated};
        });
        assert.ok(audit.scrollWidth<=audit.width+1,JSON.stringify({scene,viewport,audit}));assert.deepEqual(audit.invalid,[]);assert.deepEqual(audit.missing,[]);assert.deepEqual(audit.badPaths,[]);assert.equal(audit.animated,0);
        const file=`dist/screenshots/shiny-audit-${scene}-${viewport.width}x${viewport.height}-1.26.0.png`;await p.screenshot({path:file,fullPage:scene==='collection'});results.push({scene,viewport,...audit,screenshot:file});
      }
    }finally{await context.close();}
  }
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'}),p=await context.newPage();
  try{
    await p.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(state)});await p.goto('http://127.0.0.1:4189/');await p.evaluate(()=>document.fonts.ready);
    await p.evaluate(async()=>{
      const {creature}=await import('/js/art.js'),{SHINY_SPECIES,SHINY_VARIANTS,BY_ID}=await import('/js/data.js');
      document.querySelector('#main').innerHTML='<div class="shiny-art-audit" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">'+SHINY_SPECIES.map(({id})=>'<article style="background:#363c5b;border:1px solid #bfa36a;border-radius:15px;padding:12px;color:#fff0c8;text-align:center"><strong>'+SHINY_VARIANTS[id].name+'</strong><div style="display:flex">'+creature(id,{shiny:true})+creature(id,{shiny:true,awakened:true})+'</div><p style="font-size:11px">Shiny · Shiny + thức tỉnh nếu có</p></article>').join('')+'</div>';
    });
    const file='dist/screenshots/shiny-six-forms-1.26.0.png';await p.screenshot({path:file,fullPage:true});results.push({scene:'six-forms',screenshot:file});
  }finally{await context.close();}
  assert.deepEqual(errors,[]);fs.writeFileSync('dist/SHINY-VISUAL-1.26.0.json',JSON.stringify({results,errors},null,2)+'\n');console.log(`${results.length} Shiny scenes verified.`);
}finally{await browser.close();}
