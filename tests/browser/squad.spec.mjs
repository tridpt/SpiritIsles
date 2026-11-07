import {test,expect} from '@playwright/test';
import {E,R,B,squadGame,squadReady,getRun,getBattle,unitHp,turn} from '../squad-fixtures.mjs';
import {navigateGame} from './navigation.mjs';
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(p,state){
  E.validateSave(E.serialize(state));await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('squad-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('squad-seeded','1');}Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(state)});await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function open(p,mode){await p.locator(`[data-action="active-battle"][data-id="${mode}"]`).first().click();await expect(p.locator('.has-squad')).toBeVisible();}
async function commit(p,move){await p.locator(`[data-duel="choose"][data-move="${move}"]`).click();await p.locator(move==='charge'?'[data-duel="hit"]':'[data-duel="skip"]').click();}
async function pause(p){await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));}
for(const mode of ['explore','ruins','boss']){
  test(`${mode}: individual HP, target selection and forecast use actual units and commit exactly once`,async({page})=>{
    await page.setViewportSize({width:390,height:844});const s=squadReady(mode);unitHp(s,mode,'allies',[20,14,25]);if(mode==='ruins')s.ruins.run.battle.shield=0;await seed(page,s);await open(page,mode);
    await expect(page.locator('.squad-unit[data-side="ally"]')).toHaveCount(3);await expect(page.locator('.squad-unit[data-side="enemy"]')).toHaveCount(mode==='boss'?1:3);
    const foe=getRun(s,mode).squad.enemies.at(-1).id;await page.locator(`[data-side="enemy"][data-unit="${foe}"]`).click();await page.locator('[data-side="ally"][data-unit="mossfox"]').click();
    await expect(page.locator('[data-unit="mossfox"]')).toHaveAttribute('aria-pressed','true');const before=await read(page);await page.locator('[data-move="pet:axolotl"]').click();await page.locator('.squad-preview summary').click();await expect(page.locator('.squad-preview')).toContainText('Kỳ Nhông Mây');expect(await read(page)).toEqual(before);
    const expected=structuredClone(s);const out=turn(expected,mode,{move:'pet:axolotl',foe,ally:'mossfox',stance:'balanced'});await page.locator('[data-duel="skip"]').click();await expect(page.locator('[data-move="attack"]')).toBeEnabled();const after=await read(page);expect(getRun(after,mode)).toEqual(getRun(expected,mode));
    for(const u of out.squadAfter.allies)await expect(page.locator(`[data-side="ally"][data-unit="${u.id}"] [data-unit-hp]`)).toHaveText(new RegExp(`^${u.hp}/${u.maxHp}`));await page.reload();expect(getRun(await read(page),mode)).toEqual(getRun(after,mode));
  });
  test(`${mode}: fallen creatures are disabled and absent from Hợp lực animation and quick skills`,async({page})=>{
    await page.emulateMedia({reducedMotion:'no-preference'});await pause(page);const s=squadReady(mode);unitHp(s,mode,'allies',[0,25,25]);await seed(page,s);
    await expect(page.locator(`[data-action="${mode==='explore'?'battle':mode==='ruins'?'ruins-battle':'boss-battle'}"][data-id="pet:mossfox"]`)).toBeDisabled();await expect(page.locator(`${mode==='explore'?'.battle-party':mode==='ruins'?'.ruins-combat-party':'.guardian-party'} .squad-quick-down`)).toHaveCount(1);await open(page,mode);await expect(page.locator('[data-friend="mossfox"]')).toBeDisabled();await expect(page.locator('[data-move="pet:mossfox"]')).toBeDisabled();
    await commit(page,'skill');await expect(page.locator('.duel-friend.is-acting')).toHaveCount(2);await expect(page.locator('.duel-callout')).toContainText('HỢP LỰC · 2 THÚ');expect(await page.locator('.duel-team-projectile:not(.from-enemy)').evaluateAll(es=>es.map(e=>e.dataset.caster))).toEqual(['axolotl','emberbird']);
    await page.clock.runFor(800);await expect(page.locator('[data-friend="mossfox"]')).toHaveClass(/is-down/);await page.clock.runFor(500);
  });
}
test('damage numbers and enemy counterattacks follow real victims and exclude defeated enemies',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await pause(page);const s=squadReady();s.expedition.power=30;s.expedition.battle.power=80;unitHp(s,'explore','enemies',[1,31,30]);const expected=structuredClone(s),out=turn(expected,'explore',{move:'attack',foe:'enemy-0'});await seed(page,s);await open(page,'explore');await commit(page,'attack');await page.clock.runFor(540);
  await expect(page.locator('[data-unit="enemy-0"]')).toHaveClass(/is-down/);await expect(page.locator('[data-unit="enemy-0"] [data-unit-hp]')).toHaveText(/^0\//);await expect(page.locator('[data-float-target="enemy-0"]')).toContainText('−1');
  await page.clock.runFor(260);const actors=[...new Set(out.unitEvents.filter(e=>e.side==='ally'&&e.kind==='damage'&&e.actor).map(e=>e.actor))];expect(await page.locator('.combat-enemy-member.is-attacking').evaluateAll(es=>es.map(e=>e.dataset.enemy).sort())).toEqual(actors.sort());expect(actors).not.toContain('enemy-0');await page.clock.runFor(500);expect((await read(page)).expedition).toEqual(expected.expedition);
});
test('enemy support casts visibly heal or ward an ally without a fake counterattack or spending team shields',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await pause(page);const s=squadReady();unitHp(s,'explore','enemies',[5,5,5]);s.expedition.battle.tactics.ward=20;const expected=structuredClone(s),out=turn(expected,'explore','charge');expect(out.incoming).toBe(0);expect(out.enemyAttacked).toBe(false);await seed(page,s);await open(page,'explore');await commit(page,'charge');await page.clock.runFor(800);
  await expect(page.locator('.combat-enemy-member.is-attacking')).toHaveCount(0);await expect(page.locator('.combat-enemy-member.is-acting')).toHaveCount(3);await expect(page.locator('.duel-unit-number.heal')).not.toHaveCount(0);await page.clock.runFor(500);expect((await read(page)).expedition).toEqual(expected.expedition);expect((await read(page)).expedition.battle.tactics.ward).toBe(20);
});
test('row choices are saved, require a frontline and lock during a real journey',async({page})=>{
  const s=squadGame();await seed(page,s);await navigateGame(page,'pets');await expect(page.locator('[data-action="combat-row"]')).toHaveCount(6);
  await page.locator('[data-action="combat-row"][data-id="axolotl"][data-row="front"]').click();await page.locator('[data-action="combat-row"][data-id="emberbird"][data-row="back"]').click();expect((await read(page)).battleFormation.rows.axolotl).toBe('front');await page.reload();await navigateGame(page,'pets');await expect(page.locator('[data-id="axolotl"][data-row="front"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-id="axolotl"][data-row="back"]').click();await expect(page.locator('#toasts')).toContainText('ít nhất một thú');expect((await read(page)).battleFormation.rows.axolotl).toBe('front');
  await navigateGame(page,'explore');await page.locator('[data-action="start-expedition"][data-id="forest"]').click();await navigateGame(page,'pets');await expect(page.locator('[data-action="combat-row"]:disabled')).toHaveCount(6);expect((await read(page)).expedition.squad.allies.find(u=>u.id==='axolotl').row).toBe('front');
});
test('offline phone play precaches new rules, restores individual HP and respects reduced motion',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(p,squadReady('ruins'));await p.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>p.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);const files=await p.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(k=>k.startsWith('spirit-isles-v')));return (await cache.keys()).map(r=>new URL(r.url).pathname);});for(const f of ['/squad.css','/js/squad-state.js','/js/squad-combat.js','/js/squad-ui.js'])expect(files).toContain(f);
    await c.setOffline(true);await open(p,'ruins');await commit(p,'attack');await expect(p.locator('[data-move="attack"]')).toBeEnabled();const after=await read(p);await expect(p.locator('.duel-team-projectile')).toHaveCount(0);await p.reload();expect((await read(p)).ruins.run).toEqual(after.ruins.run);await open(p,'ruins');await expect(p.locator('.squad-unit')).toHaveCount(6);expect(errors).toEqual([]);
  }finally{await c.close();}
});
test('an old saved fight completes under classic rules and its next room opens the new squad stage',async({page})=>{
  const s=squadReady();delete s.expedition.squad;s.expedition.battle.hp=1;await seed(page,s);await page.locator('[data-action="active-battle"][data-id="explore"]').first().click();await expect(page.locator('.has-squad')).toHaveCount(0);await commit(page,'attack');await expect(page.locator('.duel-end')).toBeVisible();await page.locator('.duel-end .btn').click();await page.locator('[data-action="route"]').first().click();await open(page,'explore');await expect(page.locator('.squad-unit')).toHaveCount(6);expect((await read(page)).expedition.squad.version).toBe(1);
});
