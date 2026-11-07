import { navigateGame } from './navigation.mjs';
import { test, expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { B } from '../legacy-combat.mjs';
import * as F from '../../web/js/forge-engine.js';
import { previewOrder } from '../../web/js/combat-preview.js';

function ready(){const s=E.newGame();s.level=4;s.resources={...s.resources,gold:10000,essence:100,food:3000};for(const p of s.pets)p.level=15;return s;}
const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(page,s){E.validateSave(E.serialize(s));await page.addInitScript(({raw,key})=>{if(!sessionStorage.getItem('paths-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('paths-seed','1');}},{raw:E.serialize(s),key:E.SAVE_KEY});await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.goto('/');await page.evaluate(()=>document.fonts.ready);}
async function nav(page,name){await navigateGame(page,`${name}`);}
async function pet(page,id){await nav(page,'pets');await page.locator(`.pet-grid [data-action="pet"][data-id="${id}"]`).first().click();}
async function close(page){await page.getByRole('button',{name:'Đóng',exact:true}).click();}
const branch=(page,id)=>page.locator(`[data-action="skill-branch"][data-branch="${id}"]`);
const train=(s,id,branch,rank=1)=>s.pets.find(p=>p.id===id).training={rank,branch};
function wear(s,id,recipes){for(const recipe of recipes){const g=F.addGear(s,recipe);F.equipGear(s,id,g.id);}}
async function openStage(page){await page.locator('[data-action="active-battle"]').click();}
async function choose(page,move){await page.locator(`[data-duel="choose"][data-move="${move}"]`).click();}
async function hit(page){await page.clock.runFor(600);await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);}

test('unlock, freely swap both paths and base, upgrade shared ranks and keep the paid progress after reload',async({page})=>{
  await seed(page,ready());await pet(page,'emberbird');await expect(page.locator('.skill-path-card')).toHaveCount(2);await branch(page,'burn').click();
  let s=await read(page);expect(s.pets[2].training).toEqual({rank:1,branch:'burn'});expect(s.resources.gold).toBe(9850);expect(s.resources.essence).toBe(98);await expect(page.locator('.pet-combat-skill')).toContainText('Hỏa tâm');
  await page.locator('[data-action="skill-rank"]').click();await page.locator('[data-action="skill-rank"]').click();s=await read(page);expect(s.resources.gold).toBe(8800);expect(s.resources.essence).toBe(84);expect(s.pets[2].training.rank).toBe(3);
  await branch(page,'shatter').click();await expect(page.locator('.pet-combat-skill')).toContainText('phá hết khiên');await branch(page,'base').click();await expect(page.locator('.pet-combat-skill')).toContainText('26%');await branch(page,'burn').click();
  const final=await read(page);expect(final.resources).toEqual(s.resources);expect(final.pets[2].training).toEqual({rank:3,branch:'burn'});await page.reload();await pet(page,'emberbird');await expect(page.locator('.training-rank')).toHaveText('Bậc 3/3');expect((await read(page)).pets).toEqual(final.pets);
});
test('level, resource and active-journey locks are visible and never spend anything',async({browser})=>{
  for(const kind of ['level','resource','journey']){const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',serviceWorkers:'block'}),page=await context.newPage();try{const s=ready();if(kind==='level')s.pets[2].level=4;if(kind==='resource')s.resources.essence=0;if(kind==='journey')B.startBoss(s,1,()=>.38);
    await seed(page,s);await pet(page,'emberbird');const before=await read(page);await expect(branch(page,'burn')).toBeDisabled();await expect(page.locator('.training-lock')).toContainText(kind==='level'?'cấp thú 5':kind==='resource'?'tinh hoa':'Kết thúc chuyến đi');expect((await read(page)).resources).toEqual(before.resources);
  }finally{await context.close();}}
});
test('a support branch changes visible formation roles and previews a pure ward skill in the arena',async({page})=>{
  const s=ready();await seed(page,s);await pet(page,'axolotl');await branch(page,'shelter').click();await expect(page.locator('.pet-combat-skill .role-badge')).toContainText('Hộ vệ');await close(page);await page.locator('.formation-guide summary').click();await expect(page.locator('.formation-effects>div.active').filter({hasText:'Vòng tay bảo hộ'})).toBeVisible();
  await nav(page,'explore');await page.locator('[data-action="nav"][data-page="boss"]').first().click();await page.locator('[data-action="boss-start"]').click();await page.locator('[data-action="boss-battle"][data-id="guard"]').click();await page.locator('[data-action="boss-battle"][data-id="guard"]').click();await openStage(page);await choose(page,'pet:axolotl');await expect(page.locator('[data-preview="damage"]')).toHaveText('0');await expect(page.locator('.duel-preview')).toContainText('khiên');await hit(page);expect((await read(page)).boss.run.tactics.ward).toBeGreaterThan(0);
});
test('equipping two pieces activates the set on the selected pet and unequipping removes it after reload',async({page})=>{
  const s=ready();F.addGear(s,'frostfang');F.addGear(s,'glacierstone');await seed(page,s);await pet(page,'mossfox');await page.locator('[data-action="gear-manage"]').first().click();
  await page.locator('[data-action="gear-equip"][data-id="g1"]').click();await expect(page.locator('[data-gear-set="frost"]')).toContainText('1/2');await page.locator('[data-action="gear-equip"][data-id="g2"]').click();await expect(page.locator('[data-gear-set="frost"]')).toContainText('2/2 · Đã kích hoạt');expect(E.combatMembers(await read(page))[0].gear.set).toBe('frost');
  await page.locator('[data-action="gear-unequip"][data-id="stone"]').click();expect(E.combatMembers(await read(page))[0].gear?.set).toBeUndefined();await close(page);await page.reload();await pet(page,'mossfox');await expect(page.locator('[data-gear-set="frost"]')).toContainText('1/2');
});
test('set forecasts and branch names match committed perfect guards and burning, including saved future ticks',async({page})=>{
  const s=ready();train(s,'emberbird','burn',3);wear(s,'mossfox',['frostfang','glacierstone']);wear(s,'emberbird',['emberplume','dawnstone']);B.startBoss(s,1,()=>.38);s.boss.run.focus=3;await seed(page,s);await openStage(page);
  await expect(page.locator('[data-buff="set-frost"]')).toContainText('Vĩnh Đông');await expect(page.locator('[data-buff="set-phoenix"]')).toContainText('Vũ Hỏa');await choose(page,'guard');await expect(page.locator('.duel-preview')).toContainText('Vĩnh Đông: +15 khiên');await hit(page);expect((await read(page)).boss.run.tactics.ward).toBe(15);await expect(page.locator('.duel-feedback')).toContainText('Vĩnh Đông +15');
  await expect(page.locator('[data-move="pet:emberbird"]')).toContainText('Hỏa tâm 3');await choose(page,'pet:emberbird');await expect(page.locator('.duel-preview')).toContainText('Vũ Hỏa +35%');const before=await read(page),p=previewOrder(before,'boss','pet:emberbird','perfect');await hit(page);const after=await read(page);expect(after.boss.run.tactics.burn.amount).toBe(p.burnApplied.min);expect(after.boss.run.enemyHp).toBe(p.enemyHpAfter.min);await expect(page.locator('.duel-feedback')).toContainText('Vũ Hỏa');
  await page.reload();expect((await read(page)).boss.run).toEqual(after.boss.run);await page.locator('[data-action="active-battle"]').click();await choose(page,'guard');const tick=previewOrder(after,'boss','guard','perfect');await hit(page);expect((await read(page)).boss.run.enemyHp).toBe(tick.enemyHpAfter.min);
});
test('branch and set screens fit phones from 320px, keep controls reachable and render correct Vietnamese text',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const s=ready();train(s,'emberbird','burn',2);wear(s,'emberbird',['emberplume','dawnstone']);await seed(page,s);await pet(page,'emberbird');
  for(const [width,height]of [[320,640],[390,844],[1440,1000]]){await page.setViewportSize({width,height});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);expect(await page.locator('.game-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await branch(page,'shatter').scrollIntoViewIfNeeded();await expect(branch(page,'shatter')).toBeInViewport();await expect(page.locator('.skill-path-heading h4').first()).toHaveText('Hỏa tâm');
    if(width===390){await page.locator('.skill-training').scrollIntoViewIfNeeded();await page.screenshot({path:'dist/screenshots/skill-paths-mobile-1.10.0.png'});}if(width===1440)await page.locator('.skill-training').screenshot({path:'dist/screenshots/skill-paths-desktop-1.10.0.png'});
  }
  await close(page);await page.locator('.forge-entry').click();await expect(page.locator('.gear-set-catalog')).toContainText('Vũ Hỏa');for(const width of [320,390,1440]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);}await page.locator('.gear-set-catalog').screenshot({path:'dist/screenshots/gear-sets-1.10.0.png'});expect(errors).toEqual([]);
});
test('all new modules, branch switching and set combat remain available offline after reload',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{const s=ready();train(s,'emberbird','burn',1);wear(s,'mossfox',['frostfang','glacierstone']);await seed(page,s);await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await pet(page,'emberbird');await branch(page,'shatter').click();await page.locator('[data-action="skill-rank"]').click();const trained=await read(page);expect(trained.pets[2].training).toEqual({rank:2,branch:'shatter'});await close(page);await nav(page,'explore');await page.locator('[data-action="nav"][data-page="boss"]').first().click();await page.locator('[data-action="boss-start"]').click();await openStage(page);await choose(page,'guard');await hit(page);expect((await read(page)).boss.run.tactics.ward).toBe(15);await page.reload();expect((await read(page)).pets).toEqual(trained.pets);expect(errors).toEqual([]);
  }finally{await context.close();}
});
