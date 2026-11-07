import { navigateGame, openGameMenu } from './navigation.mjs';
import { test, expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';
import { ruinsMaxHp, ruinsIntent } from '../../web/js/ruins-data.js';

const errors=[];
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
test.beforeEach(async({page})=>{errors.length=0;page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('h1')).toContainText('Đảo Bình Yên');await page.evaluate(()=>document.fonts.ready);});
test.afterEach(()=>expect(errors).toEqual([]));
function ready(strong=false){const s=E.newGame();s.level=2;s.resources.food=5000;if(strong){s.team=['forestking','oceandragon','phoenix'];for(const id of s.team){const p=E.makePet(id);p.level=30;p.stars=3;p.bond=100;s.pets.push(p);}s.ruins.relics={lantern:5,compass:5,flask:3};}return s;}
async function seed(page,state){
  E.validateSave(E.serialize(state));const token=`${Date.now()}-${Math.random()}`;
  await page.addInitScript(({key,raw,token})=>{if(sessionStorage.getItem('ruins-test-seed')===token)return;localStorage.setItem(key,raw);sessionStorage.setItem('ruins-test-seed',token);},{key:E.SAVE_KEY,raw:E.serialize(state),token});
  await page.reload();await page.evaluate(()=>document.fonts.ready);
}
async function fit(page){for(const width of [320,360,390,768,1024,1440]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);}}
function action(s){const r=s.ruins.run;if(r.phase==='path')return R.chooseRuinsPath(s,r.paths.includes('spring')&&r.hp<ruinsMaxHp(r)*.7?'spring':r.paths.find(p=>p==='trail')||r.paths[0]);if(r.phase==='blessing'){const priorities=['recovery','might','canopy','tide','bastion','charge','ember','vitality','spark','harmony','leech','dew'];return R.chooseRuinsBlessing(s,priorities.find(id=>r.offers.includes(id))||r.offers[0]);}if(r.hp<ruinsMaxHp(r)*.5&&r.potions)return R.useRuinsPotion(s);return R.ruinsBattleTurn(s,r.focus>=2?'skill':ruinsIntent(r).danger?'guard':'attack');}
async function fight(page){let turns=0;while(await page.locator('.ruins-combat').count()){expect(turns++).toBeLessThan(50);const skill=page.locator('[data-action="ruins-battle"][data-id="skill"]');if(await skill.isEnabled())await skill.click();else if(await page.locator('.ruins-enemy-intent.danger').count())await page.locator('[data-action="ruins-battle"][data-id="guard"]').click();else await page.locator('[data-action="ruins-battle"][data-id="attack"]').click();}}

test('the ruins are discoverable, unlock by playing, and charge provisions once on entry',async({page})=>{
  await page.locator('.ruins-entry').click();await expect(page.locator('[data-action="ruins-start"]')).toBeDisabled();await expect(page.locator('h1')).toHaveText('Phế Tích Cổ.');
  await navigateGame(page,'hatch');await page.getByRole('button',{name:'Ấp 10 trứng'}).click();await page.getByRole('button',{name:'Mở trứng ngay'}).click();await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await navigateGame(page,'explore');await page.locator('.ruins-explore-tabs [data-page="ruins"]').click();const before=await saved(page);expect(before.level).toBeGreaterThanOrEqual(2);await page.locator('[data-action="ruins-start"]').click();const after=await saved(page);expect(after.resources.food).toBe(before.resources.food-12);expect(after.ruins.runs).toBe(1);await expect(page.locator('.ruins-route-choice')).toHaveCount(2);await openGameMenu(page);await expect(page.locator('.game-menu-grid [data-page="explore"]')).toHaveClass(/active/);await page.getByRole('button',{name:'Đóng',exact:true}).click();
});

test('a fight, a saved blessing choice, and continuing on the next floor work through visible controls',async({page})=>{
  await seed(page,ready(true));await page.locator('.ruins-entry').click();await page.locator('[data-action="ruins-start"]').click();const path=(await saved(page)).ruins.run.paths.find(p=>p!=='spring');await page.locator(`[data-action="ruins-path"][data-id="${path}"]`).click();
  await fight(page);await expect(page.locator('.ruins-blessing-choice')).toHaveCount(3);const first=await saved(page);expect(first.ruins.best).toBeGreaterThanOrEqual(1);expect(first.ruins.dust).toBeGreaterThan(0);
  await page.reload();await expect(page.locator('.ruins-blessing-choice')).toHaveCount(3);expect((await saved(page)).ruins.run.offers).toEqual(first.ruins.run.offers);
  await page.screenshot({path:'dist/screenshots/ruins-blessings-desktop.png',fullPage:true});const id=await page.locator('.ruins-blessing-choice').first().getAttribute('data-id');await page.locator('.ruins-blessing-choice').first().click();const next=await saved(page);expect(next.ruins.run.blessings[id]).toBe(1);expect(next.ruins.run.floor).toBe(first.ruins.run.floor+1);await expect(page.locator('.ruins-path-room')).toBeVisible();
  await page.reload();expect((await saved(page)).ruins.run).toEqual(next.ruins.run);
});

test('the hub, relics, boss combat and blessing choices fit phone and desktop widths',async({page})=>{
  const s=ready(true);await seed(page,s);await page.locator('.ruins-entry').click();await fit(page);await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);await page.screenshot({path:'dist/screenshots/ruins-hub-mobile.png',fullPage:true});
  await page.locator('.ruins-section-tabs [data-action="ruins-tab"][data-id="relics"]').click();await fit(page);await page.screenshot({path:'dist/screenshots/ruins-relics-desktop.png',fullPage:true});
  R.startRuins(s,1,()=>.38);while(s.ruins.run.floor<5)action(s);R.chooseRuinsPath(s,'boss');s.ruins.run.battle.turn=2;
  await seed(page,s);await fit(page);await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);await page.screenshot({path:'dist/screenshots/ruins-boss-mobile.png',fullPage:true});await expect(page.locator('.ruins-enemy-intent')).toContainText('Đòn dồn sức');await page.locator('[data-action="ruins-battle"][data-id="guard"]').click();await fight(page);await fit(page);await page.screenshot({path:'dist/screenshots/ruins-blessings-desktop.png',fullPage:true});await openGameMenu(page);await expect(page.locator('.game-menu-grid>button')).toHaveCount(11);await page.getByRole('button',{name:'Đóng',exact:true}).click();
});

test('potions heal without advancing combat and Android back keeps the active run',async({page})=>{
  const s=ready();R.startRuins(s,1,()=>.1);const path=s.ruins.run.paths.find(p=>p!=='spring');R.chooseRuinsPath(s,path);s.ruins.run.hp=40;s.ruins.run.focus=2;
  await seed(page,s);await page.locator('[data-action="ruins-potion"]').click();const healed=await saved(page);expect(healed.ruins.run.hp).toBe(75);expect(healed.ruins.run.battle.turn).toBe(0);expect(healed.ruins.run.focus).toBe(2);expect(healed.ruins.run.potions).toBe(0);
  expect(await page.evaluate(()=>window.spiritBack())).toBe(true);await expect(page.locator('h1')).toContainText('Đảo Bình Yên');await page.locator('.ruins-entry').click();expect((await saved(page)).ruins.run).toEqual(healed.ruins.run);
});

test('relic upgrades, dust exchange, one-time milestone rewards and checkpoint entry persist',async({page})=>{
  const s=ready();s.ruins.best=10;s.ruins.clears=10;s.ruins.bosses=2;s.ruins.dust=150;await seed(page,s);await page.locator('.ruins-entry').click();await page.locator('.ruins-section-tabs [data-action="ruins-tab"][data-id="relics"]').click();await page.locator('[data-action="ruins-upgrade"][data-id="compass"]').click();expect((await saved(page)).ruins.relics.compass).toBe(1);expect((await saved(page)).ruins.dust).toBe(125);
  await page.locator('[data-action="ruins-milestone"][data-id="10"]').click();await expect(page.getByRole('dialog')).toContainText('Người đánh thức khu rừng');await page.getByRole('button',{name:'Cất vào kho báu'}).click();await expect(page.locator('[data-action="ruins-milestone"][data-id="10"]')).toBeDisabled();
  await page.locator('[data-action="ruins-exchange"][data-id="eggs"]').click();const bought=await saved(page);expect(bought.resources.tickets).toBe(s.resources.tickets+5);expect(bought.ruins.dust).toBe(80);
  await page.reload();await page.locator('.ruins-entry').click();await page.locator('[data-action="ruins-chapter"][data-id="11"]').click();await page.locator('[data-action="ruins-start"]').click();expect((await saved(page)).ruins.run.startFloor).toBe(11);
});

test('leaving the page preserves the run and retreat requires a choice and keeps earned dust',async({page})=>{
  const s=ready(true);R.startRuins(s,1,()=>.32);while(s.ruins.best<3)action(s);await seed(page,s);const before=await saved(page);
  await navigateGame(page,'island');await page.locator('.ruins-entry').click();await page.locator('[data-action="ruins-retreat"]').click();await page.getByRole('button',{name:'Mình đi tiếp nhé'}).click();expect((await saved(page)).ruins.run).toEqual(before.ruins.run);
  await page.locator('[data-action="ruins-retreat"]').click();await page.getByRole('button',{name:'Trở về cùng cả đội'}).click();await expect(page.locator('.ruins-result')).toBeVisible();const after=await saved(page);expect(after.ruins.run).toBeNull();expect(after.ruins.dust).toBe(before.ruins.dust);expect(after.ruins.best).toBe(before.ruins.best);expect(after.resources).toEqual(before.resources);
});

test('the final guardian can be defeated and its fifty-floor reward stays claimed after reload',async({page})=>{
  const s=ready(true);R.startRuins(s,1,()=>.38);let steps=0;while(s.ruins.run&&s.ruins.run.floor<50&&steps++<1500)action(s);expect(s.ruins.run.floor).toBe(50);R.chooseRuinsPath(s,'boss');await seed(page,s);await fight(page);
  await expect(page.locator('.ruins-result.victory')).toBeVisible();expect((await saved(page)).ruins.best).toBe(50);await page.locator('.ruins-section-tabs [data-action="ruins-tab"][data-id="relics"]').click();await page.locator('[data-action="ruins-milestone"][data-id="50"]').click();await expect(page.getByRole('dialog')).toContainText('Người giữ trái tim đảo');await page.getByRole('button',{name:'Cất vào kho báu'}).click();await page.reload();expect((await saved(page)).ruins.claimed).toContain(50);
});

test('a migrated installed game enters, fights and resumes the ruins with the network offline',async({browser})=>{
  const context=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try{
    const old=ready();delete old.ruins;await page.addInitScript(({key,raw})=>{if(!localStorage.getItem(key))localStorage.setItem(key,raw);},{key:E.SAVE_KEY,raw:E.serialize(old)});
    await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await page.locator('.ruins-entry').click();await page.locator('[data-action="ruins-start"]').click();const path=(await saved(page)).ruins.run.paths.find(p=>p!=='spring');await page.locator(`[data-action="ruins-path"][data-id="${path}"]`).click();await page.locator('[data-action="ruins-battle"][data-id="attack"]').click();const first=(await saved(page)).ruins.run;await page.reload();await expect(page.locator('.ruins-combat')).toBeVisible();expect((await saved(page)).ruins.run).toEqual(first);await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.fonts.check('700 24px BeVietnam','Đảo Linh Thú'))).toBe(true);
  }finally{await context.close();}
});
