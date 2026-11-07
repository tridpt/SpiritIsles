import fs from 'node:fs';
import crypto from 'node:crypto';
import {chromium,expect} from '@playwright/test';
import * as E from '../web/js/engine.js';
import * as H from '../web/js/habitat-engine.js';
import {placeItem} from '../web/js/island-layout.js';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const state=E.newGame();state.level=3;state.boss.best=1;state.boss.wins=1;state.boss.clears[0]=1;state.ruins.best=5;state.ruins.clears=5;state.ruins.bosses=1;state.clears.reef=5;state.clears.volcano=5;state.pets.forEach(p=>p.bond=100);
for(const pet of state.pets)for(const moment of H.momentsFor(pet.species)){
  state.islandLayout={version:1,nextId:1,placed:[]};placeItem(state,state.islandLayout,moment.decor[0],0,0);
  if(moment.near)placeItem(state,state.islandLayout,moment.near[0],2,0);
  H.discoverMoment(state,pet.id,moment.id);
}
delete state.habitat.discovered['mossfox:bench-rest'];state.pets[0].bond=9;
state.islandLayout={version:1,nextId:1,placed:[]};placeItem(state,state.islandLayout,'bench',0,0);E.validateSave(E.serialize(state));
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce',viewport:{width:390,height:844}}),page=await context.newPage();
  await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(state)});
  await page.goto('http://127.0.0.1:4189');await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.lobby-habitat-hint')).not.toHaveClass(/ready/);
  await page.locator('.island-pet[data-id="mossfox"]').click();await page.locator('[data-action="island-pat"]').click();
  await expect(page.locator('.lobby-habitat-hint')).toHaveClass(/ready/);await expect(page.locator('.lobby-habitat-hint')).toHaveAttribute('data-moment','bench-rest');
  fs.writeFileSync(`dist/DAILY-BOND-${version}.json`,JSON.stringify({version,pettingFrom9To10ImmediatelyUnlocksHint:true,appSha256:crypto.createHash('sha256').update(fs.readFileSync('web/js/app.js')).digest('hex'),completedAt:new Date().toISOString()},null,2)+'\n');
  console.log('Petting to 10 bond immediately unlocks the existing daily suggestion.');
}finally{await browser.close();}
