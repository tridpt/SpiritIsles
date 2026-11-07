import { navigateGame } from './navigation.mjs';
import { test, expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';

const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
function ready(){const s=E.newGame();s.level=2;s.resources.food=3000;for(const id of ['pebbleturtle','cottonbun','nightcat'])s.pets.push(E.makePet(id));return s;}
function fight(mode='ruins'){
  const s=ready();
  if(mode==='ruins'){
    R.startRuins(s,1,()=>.38);const r=s.ruins.run;
    r.floor=5;r.cleared=4;r.paths=['boss'];s.ruins.best=4;s.ruins.clears=4;
    R.chooseRuinsPath(s,'boss');r.hp=30;r.focus=3;
  }else{
    E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);
    s.expedition.hp=30;s.expedition.battle.power=90;s.expedition.power=70;s.expedition.battle.focus=3;
  }
  return s;
}
async function seed(page,state){
  E.validateSave(E.serialize(state));
  await page.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('tactics-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('tactics-seeded','1');}},{key:E.SAVE_KEY,raw:E.serialize(state)});
  await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
async function fit(page){for(const width of [320,360,390,768,1024,1440]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth),{message:`width ${width}`}).toBeLessThanOrEqual(width+1);}}

test('swap a team slot, inspect real roles and formation bonuses, and keep it after reload',async({page})=>{
  await seed(page,ready());await navigateGame(page,'pets');
  await expect(page.locator('.tactics-team-slot')).toHaveCount(3);
  await page.getByRole('button',{name:'Đổi thú vị trí 1',exact:true}).click();
  await page.locator('[data-action="team-pick"][data-id="pebbleturtle"]').click();
  expect((await read(page)).team).toEqual(['pebbleturtle','axolotl','emberbird']);
  await page.locator('.formation-guide summary').click();
  await expect(page.locator('.formation-effects>div.active').filter({hasText:'Vòng tay bảo hộ'})).toBeVisible();
  await expect(page.locator('.formation-effects>div.active').filter({hasText:'Cùng một nhịp'})).toBeVisible();
  await fit(page);await expect(page.locator('#toasts .toast')).toHaveCount(0);
  await page.locator('.tactics-team-panel').screenshot({path:'dist/screenshots/tactics-team-desktop-1.10.0.png'});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.locator('.tactics-team-slot').first().evaluate(slot=>{
    const art=slot.querySelector('.creature').getBoundingClientRect(),info=slot.querySelector('div').getBoundingClientRect(),button=slot.querySelector('button').getBoundingClientRect();
    return art.bottom<=info.top+1&&info.bottom<=button.top+1;
  })).toBe(true);
  await page.locator('.tactics-team-panel').screenshot({path:'dist/screenshots/tactics-team-mobile-1.10.0.png'});
  await page.reload();await navigateGame(page,'pets');
  expect((await read(page)).team).toEqual(['pebbleturtle','axolotl','emberbird']);
  await page.locator('.pet-grid [data-action="pet"][data-id="pebbleturtle"]').first().click();
  await expect(page.locator('.pet-combat-skill')).toContainText('Mai chắn');
  await expect(page.locator('.pet-combat-skill')).toContainText('34% khiên');
  await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.locator('.formation-guide summary').click();
  await page.getByRole('button',{name:'Cách phối hợp'}).click();await expect(page.getByRole('dialog')).toContainText('Luân phiên chiêu');
});

test('individual expedition skills spend energy, start cooldowns, tick healing, combo and survive reload',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,fight('explore'));
  const skill=id=>page.locator(`[data-action="battle"][data-id="pet:${id}"]`);
  await expect(page.locator('.pet-skill-option')).toHaveCount(3);
  await skill('mossfox').click();let state=await read(page);const battle=state.expedition.battle;
  expect(battle.tactics.cooldowns.mossfox).toBe(3);expect(battle.tactics.regen.turns).toBe(3);expect(battle.focus).toBe(1);
  await expect(skill('mossfox')).toBeDisabled();await expect(skill('mossfox')).toContainText('Chờ 3 lượt');
  await page.reload();expect((await read(page)).expedition).toEqual(state.expedition);
  await page.locator('[data-action="battle"][data-id="guard"]').click();
  await expect(skill('axolotl')).toBeEnabled();await expect(skill('axolotl')).toContainText('Nảy mầm');
  await skill('axolotl').click();state=await read(page);
  expect(state.expedition.battle.tactics.mark).toBe('axolotl');
  await expect(page.locator('.tactics-last-action')).toContainText('Nảy mầm');
  await expect(page.locator('.tactics-statuses')).toContainText('Hồi phục');
  await page.screenshot({path:'dist/screenshots/tactics-expedition-1.10.0.png',fullPage:true});
  await page.reload();expect((await read(page)).expedition).toEqual(state.expedition);expect(errors).toEqual([]);
});

test('ruins skills work with saved blessings and keep turn, cooldown, mark and future effects on reload',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const s=fight();s.ruins.run.blessings={canopy:1,tide:1};await seed(page,s);
  const skill=id=>page.locator(`[data-action="ruins-battle"][data-id="pet:${id}"]`);
  await skill('mossfox').click();let state=await read(page);expect(state.ruins.run.battle.turn).toBe(1);
  expect(state.ruins.run.battle.tactics.cooldowns.mossfox).toBe(3);expect(state.ruins.run.battle.tactics.regen.turns).toBe(3);
  await page.reload();expect((await read(page)).ruins.run).toEqual(state.ruins.run);
  await page.locator('[data-action="ruins-battle"][data-id="guard"]').click();await skill('axolotl').click();
  await expect(page.locator('.ruins-combat-log')).toContainText('Nảy mầm');state=await read(page);expect(state.ruins.run.battle.tactics.mark).toBe('axolotl');
  await fit(page);await page.screenshot({path:'dist/screenshots/tactics-ruins-desktop-1.10.0.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.locator('.pet-skill-deck').scrollIntoViewIfNeeded();await page.screenshot({path:'dist/screenshots/tactics-ruins-mobile-1.10.0.png'});
  await page.reload();expect((await read(page)).ruins.run).toEqual(state.ruins.run);expect(errors).toEqual([]);
});

test('skill controls fit small phones and locked team controls explain the active journey',async({page})=>{
  await seed(page,fight('explore'));await fit(page);await page.setViewportSize({width:320,height:720});
  await navigateGame(page,'pets');
  await expect(page.locator('[data-action="team-picker"]')).toHaveCount(3);
  for(const button of await page.locator('[data-action="team-picker"]').all())await expect(button).toBeDisabled();
  await expect(page.locator('.team-footnote')).toContainText('Đội đang đi khám phá');await fit(page);
  await navigateGame(page,'explore');await expect(page.locator('.pet-skill-option')).toHaveCount(3);
});

test('an old active battle gets skill controls offline and preserves spent energy after reopening',async({browser})=>{
  const context=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce',viewport:{width:390,height:844}});const page=await context.newPage();
  try{
    const s=fight();delete s.ruins.run.battle.tactics;await seed(page,s);
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();
    await expect(page.locator('.pet-skill-option')).toHaveCount(3);
    await page.getByRole('button',{name:'Dùng Mầm sống của Cáo Mầm',exact:true}).click();
    const state=await read(page);expect(state.ruins.run.focus).toBe(1);expect(state.ruins.run.battle.tactics.mark).toBe('mossfox');
    await page.reload();expect((await read(page)).ruins.run).toEqual(state.ruins.run);
    await expect(page.getByRole('button',{name:'Dùng Mầm sống của Cáo Mầm',exact:true})).toBeDisabled();
  }finally{await context.close();}
});
