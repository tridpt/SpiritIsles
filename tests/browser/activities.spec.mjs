import { navigateGame, openGameMenu } from './navigation.mjs';
import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { E } from '../legacy-combat.mjs';

const errors=[];
const key=E.SAVE_KEY;
test.beforeEach(async({page})=>{
  errors.length=0;page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Đảo Bình Yên');await page.evaluate(()=>document.fonts.ready);
});
test.afterEach(()=>expect(errors).toEqual([]));
async function seed(page,state){
  const token=`${Date.now()}-${Math.random()}`;
  // A live page saves on pagehide. Seed the next document after that save has finished.
  await page.addInitScript(({key,raw,token})=>{if(sessionStorage.getItem('activity-test-seed')===token)return;localStorage.setItem(key,raw);sessionStorage.setItem('activity-test-seed',token);},{key,raw:E.serialize(state),token});
  await page.reload();await page.evaluate(()=>document.fonts.ready);
}
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,key);
async function stopClock(page){await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));}
async function hit(page){
  const delay=await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key)).state.fishing.session;return s.roundStarted+Math.round(s.targets[s.hits.length]*1300)-Date.now();},key);
  await page.clock.runFor(Math.max(0,delay));await page.getByRole('button',{name:'Giật cần',exact:true}).click();
}
function readyIsland(){const s=E.newGame();s.level=2;for(const p of s.pets.slice(0,2)){p.level=3;p.bond=12;}return s;}

test('fish can be caught through three timed taps, traded once, and reloaded without losing records',async({page})=>{
  await stopClock(page);await page.locator('.fishing-entry').click();await page.getByRole('button',{name:'Thả câu',exact:false}).first().click();
  await expect(page.locator('.fishing-meter')).toBeVisible();await hit(page);
  await mkdir('dist/screenshots',{recursive:true});await page.screenshot({path:'dist/screenshots/fishing-play-desktop.png',fullPage:true});
  await hit(page);await hit(page);await expect(page.locator('.fish-catch-result')).toBeVisible();
  const caught=await saved(page);expect(caught.fishing.total).toBe(1);const id=Object.keys(caught.fishing.collection)[0];expect(caught.fishing.bag[id]).toBe(1);
  await page.getByRole('button',{name:'Xem giỏ cá'}).click();await expect(page.locator('.fish-card.discovered')).toHaveCount(1);
  await page.locator(`.fish-card.discovered [data-action="cook-fish"]`).click();const traded=await saved(page);
  expect(traded.fishing.bag[id]).toBe(0);expect(traded.fishing.collection).toEqual(caught.fishing.collection);expect(traded.resources.food).toBeGreaterThan(caught.resources.food);
  await expect(page.locator('.fish-card.discovered [data-action="cook-fish"]')).toBeDisabled();
  await page.reload();expect((await saved(page)).fishing.collection).toEqual(caught.fishing.collection);
});

test('leaving the fishing page pauses the cursor and preserves the current round on return',async({page})=>{
  await stopClock(page);await page.locator('.fishing-entry').click();await page.locator('[data-action="fish-cast"]').click();await hit(page);
  await page.clock.runFor(700);await navigateGame(page,'pets');
  const paused=(await saved(page)).fishing.session;expect(paused.pausedAt).not.toBeNull();expect(paused.hits).toHaveLength(1);
  const elapsed=paused.pausedAt-paused.roundStarted;await page.clock.runFor(60000);
  await navigateGame(page,'island');await page.locator('.fishing-entry').click();
  const resumed=(await saved(page)).fishing.session;expect(resumed.pausedAt).toBeNull();expect(resumed.hits).toEqual(paused.hits);
  expect(await page.evaluate(()=>Date.now())-resumed.roundStarted).toBe(elapsed);
  await page.getByRole('button',{name:'Thu cần',exact:true}).click();expect((await saved(page)).fishing.session).toBeNull();
});

test('breeding gates new islands and a mature offline egg grants the committed hybrid once',async({page})=>{
  await page.locator('.breeding-entry').click();await expect(page.getByRole('button',{name:'Bắt đầu lai tạo'})).toBeDisabled();await expect(page.locator('.breed-requirement')).toContainText('cấp đảo 2');
  const s=readyIsland();await seed(page,s);await stopClock(page);await page.locator('.breeding-entry').click();
  await expect(page.locator('.breed-affinity')).toContainText('Hải Cẩu Lá Sen');await page.evaluate(()=>Math.random=()=>0);
  await page.getByRole('button',{name:'Bắt đầu lai tạo'}).click();await expect(page.locator('.breeding-incubator')).toBeVisible();await expect(page.getByRole('button',{name:'Đón linh thú'})).toBeDisabled();
  const active=await saved(page);expect(active.breeding.egg.species).toBe('lotusseal');expect(active.resources.gold).toBe(s.resources.gold-200);
  await page.screenshot({path:'dist/screenshots/breeding-egg-desktop.png',fullPage:true});await page.reload();
  expect((await saved(page)).breeding.egg).toEqual(active.breeding.egg);await page.clock.runFor(61000);
  await page.locator('.breeding-entry').click();await page.getByRole('button',{name:'Đón linh thú'}).click();await page.getByRole('button',{name:'Mở trứng ngay'}).click();
  await expect(page.locator('.hatch-result')).toContainText('Hải Cẩu Lá Sen');const claimed=await saved(page);
  expect(claimed.breeding.total).toBe(1);expect(claimed.breeding.egg).toBeNull();expect(claimed.pets.filter(p=>p.id==='lotusseal')).toHaveLength(1);expect(claimed.pity).toBe(s.pity);
  await page.getByRole('button',{name:'Ở lại vườn ấp'}).click();await expect(page.locator('[data-breed-claim]')).toHaveCount(0);
});

test('a fish from the basket is consumed by breeding and native selects update the preview',async({page})=>{
  const s=readyIsland();E.castLine(s,'pond',()=>.9);for(let i=0;i<3;i++){const e=s.fishing.session;E.reelFish(s,e.roundStarted+Math.round(e.targets[i]*1300));}
  await seed(page,s);await page.locator('.breeding-entry').click();
  await page.getByLabel('Linh thú thứ hai',{exact:true}).selectOption('mossfox');await expect(page.getByRole('button',{name:'Bắt đầu lai tạo'})).toBeDisabled();
  await page.getByLabel('Linh thú thứ hai',{exact:true}).selectOption('axolotl');await page.getByLabel('Cá hỗ trợ lai tạo').selectOption('minnow');
  await expect(page.locator('.breed-affinity')).toContainText('37%');await expect(page.locator('.breed-start')).toContainText('42 giây');
  await page.getByRole('button',{name:'Bắt đầu lai tạo'}).click();const after=await saved(page);
  expect(after.fishing.bag.minnow).toBe(0);expect(after.breeding.egg.fish).toBe('minnow');expect(after.breeding.egg.readyAt-after.breeding.egg.started).toBe(42000);
});

test('new pages, live meter, and collection fit phone widths and keep seven navigation buttons',async({page})=>{
  await seed(page,readyIsland());await page.setViewportSize({width:390,height:844});await page.locator('.fishing-entry').click();
  await page.locator('[data-action="fish-cast"]').click();
  for(const width of [360,390,768]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'dist/screenshots/fishing-mobile.png'});
  await page.getByRole('button',{name:/Sổ thủy sinh/}).click();await expect(page.locator('.fish-card')).toHaveCount(12);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);await page.screenshot({path:'dist/screenshots/fish-book-mobile.png'});
  await navigateGame(page,'island');await page.locator('.breeding-entry').click();
  await page.screenshot({path:'dist/screenshots/breeding-mobile.png'});await openGameMenu(page);await expect(page.locator('.game-menu-grid>button')).toHaveCount(11);await page.getByRole('button',{name:'Đóng',exact:true}).click();
  for(const width of [360,390,768,1024,1440]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);}
});

test('a real legacy save migrates in the app and breeding-only species point to their recipe garden',async({page})=>{
  const old=readyIsland();old.resources.gold=4242;delete old.activitiesVersion;delete old.breeding;delete old.fishing;
  await seed(page,old);const migrated=await saved(page);expect(migrated.resources).toEqual(old.resources);expect(migrated.pets).toEqual(old.pets);expect(migrated.fishing.total).toBe(0);
  await navigateGame(page,'pets');await page.getByRole('button',{name:'Sổ linh thú',exact:true}).click();
  await page.locator('[data-action="species"][data-id="lotusseal"]').click();await expect(page.getByRole('dialog')).toContainText('chỉ xuất hiện qua lai tạo');
  await page.getByRole('button',{name:'Ghé vườn lai tạo'}).click();await expect(page.locator('.breeding-form')).toBeVisible();
});

for(const newest of ['native','local']){
  test(`startup restores the newest valid ${newest} save instead of stale progress`,async({page})=>{
    const local=readyIsland(),native=readyIsland();local.resources.gold=4444;native.resources.gold=7777;
    const localEnvelope=JSON.parse(E.serialize(local)),nativeEnvelope=JSON.parse(E.serialize(native));
    localEnvelope.savedAt=Date.now()-(newest==='local'?1000:10000);nativeEnvelope.savedAt=Date.now()-(newest==='native'?1000:10000);
    await page.addInitScript(({key,local,native})=>{
      localStorage.setItem(key,local);let backup=native;
      window.AndroidApp={readSave:()=>backup,storeSave:raw=>{backup=raw;return true;}};
    },{key,local:JSON.stringify(localEnvelope),native:JSON.stringify(nativeEnvelope)});
    await page.reload();await page.locator('.island-activities').waitFor();
    const restored=await saved(page);expect(restored.resources.gold).toBe(newest==='native'?7777:4444);expect(restored.pets).toEqual((newest==='native'?native:local).pets);
    expect(await page.evaluate(()=>JSON.parse(AndroidApp.readSave()).state.resources.gold)).toBe(restored.resources.gold);
  });
}
