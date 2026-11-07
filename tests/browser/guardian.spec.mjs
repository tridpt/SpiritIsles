import { navigateGame } from './navigation.mjs';
import { test,expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import * as F from '../../web/js/forge-engine.js';
import { B } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';
import { bossIntent } from '../../web/js/boss-state.js';

const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
function ready(){const s=E.newGame();s.level=2;s.resources.gold=5000;s.resources.food=2000;return s;}
async function seed(page,s){
  E.validateSave(E.serialize(s));
  await page.addInitScript(({raw,key})=>{if(!sessionStorage.getItem('guardian-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('guardian-seed','1');}},{raw:E.serialize(s),key:E.SAVE_KEY});
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
async function forge(page){await navigateGame(page,'pets');await page.locator('.forge-entry').click();}
async function boss(page){await navigateGame(page,'explore');await page.locator('.ruins-explore-tabs [data-page="boss"]').click();}
async function fit(page){for(const width of [320,360,390,768,1024,1440]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth),{message:`fits ${width}`}).toBeLessThanOrEqual(width+1);}}
async function close(page){await page.getByRole('button',{name:'Đóng',exact:true}).click();}
function fight(mode='boss'){
  const s=ready();
  if(mode==='boss'){B.startBoss(s,1,()=>.38);Object.assign(s.boss.run,{enemyHp:180,phase:2,roots:2,hp:60,focus:3});s.boss.run.tactics.mark='mossfox';}
  else if(mode==='ruins'){R.startRuins(s,1,()=>.38);const r=s.ruins.run;r.floor=5;r.cleared=4;r.paths=['boss'];s.ruins.best=4;s.ruins.clears=4;R.chooseRuinsPath(s,'boss');r.hp=60;r.focus=3;r.battle.tactics.mark='mossfox';}
  else{E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);s.expedition.hp=60;s.expedition.power=70;s.expedition.battle.power=90;s.expedition.battle.focus=3;s.expedition.battle.tactics.mark='mossfox';}
  return s;
}

test('claim the kit, craft a real item, equip a creature and keep its power and ownership after reload',async({page})=>{
  await seed(page,ready());await forge(page);await page.locator('[data-action="forge-kit"]').click();
  await expect(page.locator('.forge-wallet')).toContainText('9');
  await page.getByRole('button',{name:'Chế Bùa Nanh Rễ',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('+10% sức mạnh');
  await page.getByRole('dialog').getByRole('button',{name:'Chọn bạn mang',exact:true}).click();
  await page.locator('[data-action="gear-equip"][data-id="g1"]').click();
  let s=await read(page);expect(s.forge.equipped.mossfox.charm).toBe('g1');expect(E.petPower(s.pets[0],s)).toBe(20);
  await page.locator('#gear-pet').selectOption('axolotl');await expect(page.locator('[data-action="gear-equip"][data-id="g1"]')).toBeDisabled();
  await close(page);await page.reload();s=await read(page);expect(s.forge.items).toHaveLength(1);expect(s.forge.materials).toEqual({sap:6,ore:4,heart:0});expect(s.resources.gold).toBe(4910);
  await navigateGame(page,'pets');await page.locator('.pet-grid [data-action="pet"][data-id="mossfox"]').first().click();
  await expect(page.locator('.pet-equipment')).toContainText('+10% sức mạnh');await expect(page.locator('.pet-detail-meta')).toContainText('20 sức mạnh');
});

test('upgrade, fuse duplicates and recycle with reviewable confirmations and persistent costs',async({page})=>{
  const s=ready();s.forge.materials={sap:100,ore:100,heart:10};F.addGear(s,'rootfang');F.addGear(s,'rootfang');const recycled=F.addGear(s,'dewstone');recycled.level=2;
  await seed(page,s);await forge(page);await page.locator('[data-action="forge-tab"][data-id="bag"]').click();
  await page.locator('[data-action="gear-detail"][data-id="g1"]').click();await page.locator('[data-action="gear-upgrade"]').click();expect((await read(page)).forge.items[0].level).toBe(2);
  await page.locator('[data-action="gear-fuse-preview"]').click();expect((await read(page)).forge.items).toHaveLength(3);
  await expect(page.getByRole('dialog')).toContainText('sẽ được dùng hết');await page.locator('[data-action="gear-fuse-confirm"]').click();
  const afterFuse=await read(page);expect(afterFuse.forge.items).toHaveLength(2);expect(afterFuse.forge.items[0].level).toBe(3);expect(afterFuse.resources.gold).toBe(4800);
  await close(page);await page.locator('[data-action="gear-detail"][data-id="g3"]').click();await page.locator('[data-action="gear-recycle-preview"]').click();expect((await read(page)).forge.items).toHaveLength(2);
  await page.locator('[data-action="gear-recycle-confirm"]').click();const after=await read(page);expect(after.forge.items).toHaveLength(1);expect(after.forge.materials).toEqual({sap:101,ore:100,heart:10});
  await page.reload();expect((await read(page)).forge).toEqual(after.forge);
});

test('a starter team can win the guardian through real buttons and gets one saved reward',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,ready());await boss(page);await page.locator('[data-action="boss-start"]').click();
  let phases=new Set(),turns=0;
  while((await read(page)).boss.run){
    const s=await read(page),r=s.boss.run;phases.add(r.phase);
    // New fights use personal HP: Hợp lực keeps living allies active and cuts
    // both roots, while guarding still answers the announced heavy attack.
    const a=r.focus>=2?'skill':bossIntent(r).id==='heavy'?'guard':'attack';
    const expected=structuredClone(s),result=B.bossBattleTurn(expected,a);
    await page.locator(`[data-action="boss-battle"][data-id="${a}"]`).click();const actual=await read(page);
    expect(actual.boss.run).toEqual(expected.boss.run);if(result.finished){expect(actual.boss.lastResult.reward).toEqual(result.result.reward);expect(actual.boss.lastResult.drop).toEqual(result.result.drop);}
    expect(++turns).toBeLessThan(30);
  }
  const won=await read(page);expect(won.boss.lastResult.status).toBe('victory');expect(won.boss.best).toBe(1);expect(won.forge.items).toHaveLength(1);expect([...phases]).toEqual(expect.arrayContaining([1,2,3]));
  await expect(page.locator('.guardian-result')).toContainText('Lần đầu vượt bậc');await page.reload();const reloaded=await read(page);expect(reloaded.boss).toEqual(won.boss);expect(reloaded.forge).toEqual(won.forge);expect(errors).toEqual([]);
});

test('guardian combo cuts roots, reload preserves the turn, and team and gear stay locked',async({page})=>{
  const s=ready();const item=F.addGear(s,'mistcharm');F.equipGear(s,'axolotl',item.id);B.startBoss(s,1,()=>.38);Object.assign(s.boss.run,{enemyHp:180,phase:2,roots:2,hp:60,focus:3});s.boss.run.tactics.mark='mossfox';
  await seed(page,s);await page.locator('[data-action="boss-battle"][data-id="pet:axolotl"]').click();
  await expect(page.locator('.guardian-combat-log')).toContainText('Nảy mầm');await expect(page.locator('.guardian-roots')).toHaveCount(0);
  const after=await read(page);expect(after.boss.run.tactics.mark).toBe('axolotl');expect(after.boss.run.tactics.cooldowns.axolotl).toBe(2);await page.reload();expect((await read(page)).boss.run).toEqual(after.boss.run);
  await forge(page);await page.locator('[data-action="forge-tab"][data-id="bag"]').click();await page.locator('[data-action="gear-detail"]').click();await expect(page.locator('[data-action="gear-upgrade"]')).toBeDisabled();
  await page.getByRole('dialog').getByRole('button',{name:'Chọn bạn mang',exact:true}).click();for(const button of await page.locator('[data-action="gear-equip"]').all())await expect(button).toBeDisabled();await close(page);
  await navigateGame(page,'pets');for(const button of await page.locator('[data-action="team-picker"]').all())await expect(button).toBeDisabled();
  await boss(page);await page.locator('[data-action="boss-retreat"]').click();await page.getByRole('button',{name:'Mình chiến đấu tiếp'}).click();expect((await read(page)).boss.run).toEqual(after.boss.run);
});

test('boss hub, crafting, battle and equipment dialogs fit phones through desktop sizes',async({page})=>{
  const s=ready();s.forge.materials={sap:100,ore:100,heart:10};F.addGear(s,'rootfang');await seed(page,s);await boss(page);await fit(page);
  await page.screenshot({path:'dist/screenshots/guardian-hub-desktop-1.10.0.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'dist/screenshots/guardian-hub-mobile-1.10.0.png'});
  await forge(page);await fit(page);await page.screenshot({path:'dist/screenshots/forge-desktop-1.10.0.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'dist/screenshots/forge-mobile-1.10.0.png',fullPage:true});
  await page.locator('[data-action="gear-manage"]').click();await fit(page);await close(page);await boss(page);await page.locator('[data-action="boss-start"]').click();await fit(page);
  await page.screenshot({path:'dist/screenshots/guardian-battle-desktop-1.10.0.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'dist/screenshots/guardian-battle-mobile-1.10.0.png'});
});

test('combat animates an actor and elemental projectile in all modes and respects both motion settings',async({browser})=>{
  for(const mode of ['boss','ruins','explore']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage();
    try{
      await seed(page,fight(mode));const action=mode==='boss'?'boss-battle':mode==='ruins'?'ruins-battle':'battle';
      await page.locator(`[data-action="${action}"][data-id="pet:axolotl"]`).click();
      await expect(page.locator('.combat-fx:not(.quiet) .fx-projectile')).toHaveCount(1);await expect(page.locator('.fx-combo')).toContainText('Nảy mầm');
      await expect(page.locator('.fx-heal')).toContainText('HP');await expect(page.locator('.combat-acting')).toHaveCount(1);
    }finally{await context.close();}
  }
  for(const setting of ['system','game']){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',reducedMotion:setting==='system'?'reduce':'no-preference',serviceWorkers:'block'}),page=await context.newPage();
    try{const s=fight();if(setting==='game')s.settings.motion=false;await seed(page,s);await page.locator('[data-action="boss-battle"][data-id="attack"]').click();await expect(page.locator('.combat-fx.quiet')).toHaveCount(1);await expect(page.locator('.fx-projectile')).toHaveCount(0);await expect(page.locator('.combat-acting')).toHaveCount(0);}finally{await context.close();}
  }
});

test('old installed saves migrate and the workshop and guardian work offline after an update',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'allow'}),page=await context.newPage();
  try{
    const s=ready();delete s.forge;delete s.boss;
    await page.addInitScript(({raw,key})=>{if(!sessionStorage.getItem('guardian-seed')){localStorage.setItem(key,raw);sessionStorage.setItem('guardian-seed','1');}},{raw:E.serialize(s),key:E.SAVE_KEY});
    await page.goto('/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();
    await forge(page);await page.locator('[data-action="forge-kit"]').click();await page.getByRole('button',{name:'Chế Bùa Nanh Rễ',exact:true}).click();await close(page);
    await boss(page);await page.locator('[data-action="boss-start"]').click();await page.locator('[data-action="boss-battle"][data-id="attack"]').click();const after=await read(page);await page.reload();
    expect((await read(page)).boss.run).toEqual(after.boss.run);expect((await read(page)).forge).toEqual(after.forge);await expect(page.locator('.guardian-art')).toBeVisible();
  }finally{await context.close();}
});

test('small-phone skills show a visible battle replay while the arena is above the viewport',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',viewport:{width:390,height:844},reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage();
  try{
    await seed(page,fight());await page.locator('[data-action="boss-battle"][data-id="pet:axolotl"]').click();
    await expect(page.locator('.combat-replay')).toBeInViewport();await expect(page.locator('.combat-replay .fx-combo')).toContainText('Nảy mầm');
    await expect(page.locator('.combat-replay .fx-projectile')).toBeVisible();
    const s=await read(page);await expect(page.locator('.combat-replay')).toHaveCount(0);expect((await read(page)).boss.run).toEqual(s.boss.run);
  }finally{await context.close();}
});
