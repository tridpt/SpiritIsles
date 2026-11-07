import {test,expect} from '@playwright/test';
import {E,festivalGame,seasonalNow,DAY} from '../seasonal-fixtures.mjs';
import {navigateGame,openSettings} from './navigation.mjs';
import {project} from '../../web/js/island-layout.js';
import {readFileSync} from 'node:fs';
const {version}=JSON.parse(readFileSync('package.json','utf8'));
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const mission=(p,key)=>p.locator(`[data-seasonal-mission="${key}"]`);
const shop=(p,id)=>p.locator(`[data-seasonal-shop="${id}"]`);
const tab=(p,id)=>p.locator(`.festival-tabs [data-id="${id}"]`).click();
const close=p=>p.getByRole('button',{name:'Đóng',exact:true}).click();
async function seed(p,s=E.newGame()){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('festival-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('festival-seeded','1');}},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
test.beforeEach(async({page})=>{await page.addInitScript(()=>{window.__festivalErrors=[];window.addEventListener('error',e=>window.__festivalErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__festivalErrors.push(String(e.reason)));});});
test.afterEach(async({page})=>{expect(await page.evaluate(()=>window.__festivalErrors||[])).toEqual([]);});

test('menu, three festival tabs, locked previews and all eight activity shortcuts work without spending',async({page})=>{
  await seed(page);await navigateGame(page,'seasonal');await expect(page.locator('.festival-mission')).toHaveCount(8);await expect(page.locator('.festival-challenge')).toHaveCount(3);
  const before=await read(page);await page.locator('[data-action="seasonal-week"][data-id="3"]').click();await expect(page.locator('.festival-board-note').first()).toContainText('ngày 22');
  for(const b of await page.locator('.festival-mission button').all())await expect(b).toBeDisabled();
  await tab(page,'prizes');await expect(page.locator('.festival-prize')).toHaveCount(5);await tab(page,'shop');await expect(page.locator('.festival-shop-item')).toHaveCount(6);
  expect((await read(page)).resources).toEqual(before.resources);expect((await read(page)).seasonal).toEqual(before.seasonal);
  await tab(page,'journey');await page.locator('[data-action="seasonal-week"][data-id="0"]').click();
  for(const [id,destination]of [['hatch','hatch'],['feed','pets'],['explore','explore'],['fish','fishing'],['campaign','campaign'],['memories','habitat'],['stars','campaign'],['tower','tower']]){
    await mission(page,`0:${id}`).locator('button').click();await expect(page.locator('.game-shell')).toHaveAttribute('data-screen',destination);await navigateGame(page,'seasonal');
  }
  expect((await read(page)).resources).toEqual(before.resources);
});

test('real feeding increases progress and a ready mission pays exactly once after reload',async({page})=>{
  const s=E.newGame();s.resources.food=10000;await seed(page,s);await navigateGame(page,'pets');
  for(let i=0;i<8;i++)await page.locator('[data-action="feed"][data-id="mossfox"]').first().click();
  await navigateGame(page,'seasonal');await expect(mission(page,'0:feed')).toHaveClass(/ready/);const before=await read(page);
  await mission(page,'0:feed').locator('button').click();const paid=await read(page);expect(paid.seasonal.currency).toBe(55);expect(paid.seasonal.earned).toBe(55);expect(paid.resources).toEqual(before.resources);
  await page.reload();await navigateGame(page,'seasonal');await expect(mission(page,'0:feed').locator('button')).toBeDisabled();expect((await read(page)).seasonal).toEqual(paid.seasonal);
});

test('the day-eight timer opens the next chapter and leaves earlier claimed missions intact',async({page})=>{
  const s=E.newGame();s.stats.hatches=10;await seed(page,s);await navigateGame(page,'seasonal');await mission(page,'0:hatch').locator('button').click();
  await page.clock.fastForward(7*DAY);await expect(page.locator('[data-festival-day]')).toHaveText('Ngày 8/30');
  await expect(mission(page,'1:hatch')).toBeVisible();await mission(page,'1:hatch').locator('button').click();expect((await read(page)).seasonal.currency).toBe(100);
  await page.locator('[data-action="seasonal-week"][data-id="0"]').click();await expect(mission(page,'0:hatch').locator('button')).toBeDisabled();
  await page.reload();await navigateGame(page,'seasonal');expect((await read(page)).seasonal.claimedMissions).toEqual(['0:hatch','1:hatch']);
});

test('challenge rewards are real and stay claimed across tabs and reload',async({page})=>{
  await seed(page,festivalGame());await navigateGame(page,'seasonal');const before=await read(page);
  for(const id of ['story','tower','memories'])await page.locator(`[data-seasonal-challenge="${id}"] button`).click();
  const after=await read(page);expect(after.seasonal.currency).toBe(360);expect(after.resources).toEqual(before.resources);
  await page.reload();await navigateGame(page,'seasonal');for(const b of await page.locator('.festival-challenge button').all())await expect(b).toBeDisabled();expect((await read(page)).seasonal.claimedChallenges).toHaveLength(3);
});

test('shopping does not relock earned milestones and resource and Shiny payouts cannot be repeated',async({page})=>{
  await seed(page,festivalGame({claim:true}));await navigateGame(page,'seasonal');const before=await read(page);await tab(page,'shop');
  await shop(page,'tickets').locator('button').click();await expect(shop(page,'tickets').locator('button')).toBeDisabled();const bought=await read(page);
  expect(bought.seasonal.currency).toBe(before.seasonal.currency-90);expect(bought.seasonal.earned).toBe(before.seasonal.earned);expect(bought.resources.tickets).toBe(before.resources.tickets+1);
  await tab(page,'prizes');for(const id of ['dawn','moon','comet','aurora']){await page.locator(`[data-action="seasonal-prize"][data-id="${id}"]`).click();await close(page);}
  const after=await read(page);expect(after.shiny.fragments).toBe(before.shiny.fragments+15);expect(after.resources.tickets).toBe(bought.resources.tickets+8);
  await page.reload();await navigateGame(page,'seasonal');await tab(page,'prizes');for(const id of ['dawn','moon','comet','aurora'])await expect(page.locator(`[data-action="seasonal-prize"][data-id="${id}"]`)).toBeDisabled();expect((await read(page)).resources).toEqual(after.resources);
});

test('the festival arch unlocks, places through the real editor, survives reload, and cannot be repurchased',async({page})=>{
  await page.setViewportSize({width:390,height:844});await seed(page,festivalGame({claim:true}));await navigateGame(page,'seasonal');await tab(page,'prizes');
  await page.locator('[data-action="seasonal-prize"][data-id="arch"]').click();await page.locator('#game-dialog').getByRole('button',{name:'Đặt trên đảo',exact:true}).click();
  await expect(page.locator('.editor-catalog-item[data-id="starlitlantern"]')).toBeEnabled();await page.locator('[data-action="island-edit-choose"][data-id="starlitlantern"]').click();
  const b=await page.locator('.editor-world').boundingBox(),g=project(6.5,5);await page.mouse.click(b.x+g.x*b.width/1000,b.y+g.y*b.width/1000);
  await expect(page.locator('[data-editor-saved]')).toContainText('chưa lưu');await page.locator('[data-action="island-edit-save"]').click();
  await expect(page.locator('[data-layout-type="starlitlantern"]')).toHaveCount(1);const saved=await read(page);expect(saved.islandLayout.placed.at(-1)).toMatchObject({type:'starlitlantern',x:6,y:5});
  await page.reload();expect((await read(page)).islandLayout).toEqual(saved.islandLayout);await navigateGame(page,'seasonal');await tab(page,'shop');await expect(shop(page,'lantern').locator('button')).toBeDisabled();expect((await read(page)).seasonal.currency).toBe(saved.seasonal.currency);
});

test('a season can end without losing rewards, and starting the next banks completed missions',async({page})=>{
  const s=E.newGame();s.stats.hatches=4;await seed(page,s);await navigateGame(page,'seasonal');
  // Keep each jump below the signed 32-bit millisecond limit in Playwright's clock.
  await page.clock.fastForward(15*DAY);await page.clock.fastForward(15*DAY);
  await expect(page.locator('.festival-season-ended')).toBeVisible();await expect(mission(page,'3:hatch').locator('button')).toBeDisabled();
  await page.locator('[data-action="seasonal-next"]').click();await expect(page.locator('.festival-reward-reveal')).toContainText('+50 sao lễ hội');await close(page);
  const after=await read(page);expect(after.seasonal.id).toBe('starlit-festival-2');expect(after.seasonal.currency).toBe(50);expect(after.seasonal.earned).toBe(0);expect(after.seasonal.baseline.hatches).toBe(4);await expect(page.locator('[data-festival-day]')).toHaveText('Ngày 1/30');
  await page.reload();await navigateGame(page,'seasonal');expect((await read(page)).seasonal).toEqual(after.seasonal);
});

test('export and import restore the exact event balance, claims and permanent unlock',async({page})=>{
  const s=festivalGame({claim:true});await seed(page,s);await navigateGame(page,'seasonal');await tab(page,'shop');await shop(page,'lantern').locator('button').click();await close(page);
  const exported=await read(page);await openSettings(page);const pending=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const path=await(await pending).path();await close(page);
  await shop(page,'food').locator('button').click();expect((await read(page)).seasonal.currency).toBe(exported.seasonal.currency-40);
  await openSettings(page);await page.locator('#import-file').setInputFiles(path);await page.locator('[data-action="confirm-import"]').click();const restored=await read(page);expect(restored.seasonal).toEqual(exported.seasonal);expect(restored.resources).toEqual(exported.resources);
});

for(const viewport of [{width:320,height:640},{width:390,height:844},{width:768,height:1024},{width:1440,height:1000},{width:844,height:390}])test(`festival scenes, locked weeks and rewards fit ${viewport.width}x${viewport.height}`,async({browser})=>{
  const c=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(p,festivalGame({claim:true}));await navigateGame(p,'seasonal');
    for(const scene of ['journey','prizes','shop','help','reveal']){
      if(['journey','prizes','shop'].includes(scene))await tab(p,scene);
      if(scene==='help')await p.locator('[data-action="seasonal-help"]').click();
      if(scene==='reveal'){await close(p);await tab(p,'prizes');await p.locator('[data-action="seasonal-prize"][data-id="arch"]').click();}
      expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const scope=['help','reveal'].includes(scene)?'#game-dialog[open] button':'.festival-page button';
      const bad=await p.locator(scope).evaluateAll(es=>es.filter(e=>e.checkVisibility()).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,right:r.right,width:r.width,height:r.height};}).filter(r=>r.x<0||r.right>innerWidth+1||r.height<44||r.width<44));expect(bad).toEqual([]);
      const invalid=await p.locator('.festival-page svg').evaluateAll(es=>es.filter(e=>new DOMParser().parseFromString(e.outerHTML,'image/svg+xml').querySelector('parsererror')).length);expect(invalid).toBe(0);
      expect(await p.locator('.festival-floating-lamp').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
      await p.screenshot({path:`dist/screenshots/festival-${scene}-${viewport.width}x${viewport.height}-${version}.png`,fullPage:!['help','reveal'].includes(scene)});
    }
    expect(errors).toEqual([]);
  }finally{await c.close();}
});

test('new festival assets cache and claims, spending and reward unlocks work offline after reload',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'allow'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(p,festivalGame());await p.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>p.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    expect(await p.evaluate(async version=>{const cache=await caches.open(`spirit-isles-v${version}`);return(await Promise.all(['seasonal.css','js/seasonal-data.js','js/seasonal-engine.js','js/seasonal-ui.js'].map(f=>cache.match('/'+f)))).every(Boolean);},version)).toBe(true);
    await c.setOffline(true);await p.reload();await navigateGame(p,'seasonal');
    for(const id of ['story','tower','memories'])await p.locator(`[data-seasonal-challenge="${id}"] button`).click();
    await tab(p,'shop');await shop(p,'lantern').locator('button').click();await close(p);const saved=await read(p);expect(saved.seasonal.currency).toBe(0);expect(saved.seasonal.earned).toBe(360);
    await p.reload();await navigateGame(p,'seasonal');expect((await read(p)).seasonal).toEqual(saved.seasonal);await tab(p,'prizes');await expect(p.locator('[data-action="seasonal-prize"][data-id="moon"]')).toBeEnabled();expect(errors).toEqual([]);
  }finally{await c.close();}
});
