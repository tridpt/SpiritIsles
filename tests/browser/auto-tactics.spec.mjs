import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {E,squadReady,squadGame,turn,unitHp} from '../squad-fixtures.mjs';
import {profilePlan,saveTeamPreset} from '../../web/js/auto-tactics.js';
import {navigateGame} from './navigation.mjs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const planner=p=>p.locator('#auto-planner');
async function seed(p,s){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('tactics-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('tactics-seeded','1');}Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function openBattle(p,m='explore'){await p.locator(`[data-action="active-battle"][data-id="${m}"]`).first().click();}
async function openPlan(p){await p.locator('[data-action="auto-planner"]').first().click();await expect(planner(p)).toBeVisible();}
const profile=(p,id)=>p.locator(`[data-planner="profile"][data-profile="${id}"]`);
const tab=(p,id)=>p.locator(`[data-planner="tab"][data-tab="${id}"]`);

test('profiles and edited rules apply explicitly, survive reload and never enable AUTO on their own',async({page})=>{
  await seed(page,squadGame());await navigateGame(page,'pets');await openPlan(page);await profile(page,'boss').click();await page.locator('[data-plan-field="healAt"]').selectOption('40');await page.locator('[data-plan-field="interrupt"]').uncheck();
  expect((await read(page)).autoTactics.plan).toEqual(profilePlan());await page.locator('[data-planner="apply"]').click();await expect(page.locator('.auto-planner-message')).toContainText('Đã lưu');expect((await read(page)).autoTactics.plan).toEqual({...profilePlan('boss'),healAt:40,interrupt:false});
  await page.reload();await navigateGame(page,'pets');await openPlan(page);await expect(profile(page,'boss')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-plan-field="healAt"]')).toHaveValue('40');await expect(page.locator('[data-plan-field="interrupt"]')).not.toBeChecked();await page.locator('[data-planner="close"]').click();await navigateGame(page,'explore');await page.locator('[data-action="start-expedition"][data-id="forest"]').click();await page.locator('[data-action="journey-open"]').click();await expect(page.locator('[data-duel="auto"]')).toHaveAttribute('aria-checked','false');
});
test('discarded draft and empty preset name never alter saved settings',async({page})=>{
  await seed(page,squadGame());await navigateGame(page,'pets');await openPlan(page);await profile(page,'sweep').click();await page.keyboard.press('Escape');expect((await read(page)).autoTactics.plan).toEqual(profilePlan());
  await openPlan(page);await profile(page,'boss').click();await tab(page,'teams').click();await page.locator('[data-preset-name="0"]').fill('   ');await page.locator('[data-planner="save-team"][data-slot="0"]').click();await expect(page.locator('.auto-planner-message')).toContainText('Tên đội');expect((await read(page)).autoTactics).toEqual({version:1,plan:profilePlan(),slots:[null,null,null]});
});
test('save and restore two real teams, rows and tactics through touch-sized UI',async({page})=>{
  const s=squadGame();s.pets.push(E.makePet('cottonbun'));await seed(page,s);await navigateGame(page,'pets');await openPlan(page);await profile(page,'boss').click();await tab(page,'teams').click();await page.locator('[data-preset-name="0"]').fill('Đội săn boss');await page.locator('[data-planner="save-team"][data-slot="0"]').click();const saved=(await read(page)).autoTactics.slots[0];
  await page.locator('[data-planner="close"]').click();await page.locator('[data-action="team-picker"][data-id="0"]').click();await page.locator('[data-action="team-pick"][data-id="cottonbun"]').click();await page.locator('[data-action="combat-row"][data-id="cottonbun"][data-row="front"]').click();
  await openPlan(page);await profile(page,'sweep').click();await tab(page,'teams').click();await page.locator('[data-preset-name="1"]').fill('Đội dọn quái');await page.locator('[data-planner="save-team"][data-slot="1"]').click();const second=(await read(page)).autoTactics.slots[1];expect(second.team[0]).toBe('cottonbun');expect(second.rows.cottonbun).toBe('front');
  await page.locator('[data-planner="load-team"][data-slot="0"]').click();let after=await read(page);expect(after.team).toEqual(saved.team);expect(after.autoTactics.plan).toEqual(saved.plan);for(const id of saved.team)expect(after.battleFormation.rows[id]).toBe(saved.rows[id]);
  await page.reload();await navigateGame(page,'pets');await openPlan(page);await tab(page,'teams').click();await page.locator('[data-planner="load-team"][data-slot="1"]').click();after=await read(page);expect(after.team).toEqual(second.team);expect(after.autoTactics.plan.profile).toBe('sweep');expect(after.battleFormation.rows.cottonbun).toBe('front');expect(after.pets).toEqual(s.pets);
});
test('opening strategy during a committed turn suspends AUTO until Back, then schedules one next turn',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});const s=squadReady('boss');await seed(page,s);await openBattle(page,'boss');await page.locator('[data-duel="auto"]').click();await page.clock.runFor(901);expect((await read(page)).boss.run.turn).toBe(1);await page.locator('[data-duel="planner"]').click();
  await page.clock.runFor(60000);expect((await read(page)).boss.run.turn).toBe(1);await profile(page,'boss').click();await page.locator('[data-plan-field="healAt"]').selectOption('70');await page.locator('[data-planner="apply"]').click();await page.evaluate(()=>window.spiritBack());await expect(planner(page)).not.toBeVisible();await expect(page.locator('[data-duel="auto"]')).toHaveAttribute('aria-checked','true');
  await page.clock.runFor(899);expect((await read(page)).boss.run.turn).toBe(1);await page.clock.runFor(2);expect((await read(page)).boss.run.turn).toBe(2);await page.evaluate(()=>window.spiritBack());await expect(page.locator('[data-duel="auto"]')).toHaveAttribute('aria-checked','false');
});
test('opening planner from a manual timing preview freezes and resumes that preview without spending a turn',async({page})=>{
  await seed(page,squadReady('boss'));await openBattle(page,'boss');await page.locator('[data-move="attack"]').click();const before=(await read(page)).boss.run;await page.locator('[data-duel="planner"]').click();await page.clock.runFor(60000);expect((await read(page)).boss.run).toEqual(before);await page.locator('[data-planner="close"]').click();await expect(page.locator('.duel-meter')).toBeVisible();await page.locator('[data-duel="skip"]').click();expect((await read(page)).boss.run.turn).toBe(1);
});
test('active journeys lock team swaps but allow a reusable snapshot and rule changes',async({page})=>{
  const s=squadReady('boss');saveTeamPreset(s,0,'Đội A');await seed(page,s);await openBattle(page,'boss');await page.locator('[data-duel="planner"]').click();await tab(page,'teams').click();await expect(page.locator('[data-planner="load-team"][data-slot="0"]')).toBeDisabled();await page.locator('[data-planner="save-team"][data-slot="1"]').click();expect((await read(page)).autoTactics.slots[1].team).toEqual(s.team);expect((await read(page)).boss.run).toEqual(s.boss.run);
});
test('report credits real heal/ward and archived results remain visible after reloading',async({page})=>{
  const s=squadReady();unitHp(s,'explore','allies',[4,33,33]);const expected=structuredClone(s);turn(expected,'explore',{move:'pet:axolotl',stance:'balanced',target:'body',foe:'enemy-1',ally:'mossfox'});
  await seed(page,s);await openBattle(page);await page.locator('[data-duel="auto"]').click();await page.clock.runFor(901);await page.locator('[data-duel="auto"]').click();await page.clock.runFor(100);await page.locator('[data-duel="reports"]').click();const active=(await read(page)).combatJournal.active;
  expect(active.members.find(m=>m.id==='axolotl').heal).toBeGreaterThan(0);await expect(page.locator('[data-report-pet="axolotl"] [data-report-stat="heal"]')).toHaveText(String(active.members.find(m=>m.id==='axolotl').heal));expect(active).toEqual(expected.combatJournal.active);
  await page.locator('[data-planner="close"]').click();await page.locator('[data-duel="auto"]').click();await page.clock.runFor(60000);await expect(page.locator('.auto-battle-report')).toBeVisible();expect((await read(page)).combatJournal.reports.length).toBeGreaterThan(0);
  const reports=(await read(page)).combatJournal.reports;await page.reload();await navigateGame(page,'pets');await page.locator('[data-action="combat-reports"]').click();await expect(page.locator('.auto-battle-report').first()).toBeVisible();expect((await read(page)).combatJournal.reports).toEqual(reports);
});
test('quick target priority saves immediately and remains the priority in the planner',async({page})=>{
  await seed(page,squadReady());await openBattle(page);await page.locator('[data-auto-priority]').selectOption('weak');expect((await read(page)).autoTactics.plan.priority).toBe('weak');await page.locator('[data-duel="planner"]').click();await expect(page.locator('[data-plan-field="priority"]')).toHaveValue('weak');await page.keyboard.press('Escape');await page.reload();await openBattle(page);await expect(page.locator('[data-auto-priority]')).toHaveValue('weak');
});
test('old save upgrade and offline reload preserve settings, teams and the active report',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce'}),p=await c.newPage();
  try{const s=squadReady();delete s.autoTactics;delete s.combatJournal;await seed(p,s);await p.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>p.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    const assets=await p.evaluate(async version=>{const cache=await caches.open(`spirit-isles-v${version}`);return Promise.all(['auto-tactics.css','js/auto-tactics.js','js/auto-tactics-ui.js','js/combat-report.js'].map(async f=>({file:f,cached:!!await cache.match('/'+f)})));},version);expect(assets.every(a=>a.cached)).toBe(true);
    await openBattle(p);await p.locator('[data-duel="planner"]').click();await profile(p,'sweep').click();await tab(p,'teams').click();await p.locator('[data-preset-name="2"]').fill('Offline');await p.locator('[data-planner="save-team"][data-slot="2"]').click();await p.locator('[data-planner="close"]').click();await p.locator('[data-duel="auto"]').click();await p.clock.runFor(901);await p.locator('[data-duel="auto"]').click();const before=await read(p);
    await c.setOffline(true);await p.reload();await openBattle(p);await expect(p.locator('[data-duel="auto"]')).toHaveAttribute('aria-checked','false');const after=await read(p);expect(after.autoTactics).toEqual(before.autoTactics);expect(after.combatJournal).toEqual(before.combatJournal);expect(after.expedition).toEqual(before.expedition);await p.locator('[data-duel="reports"]').click();await expect(p.locator('.auto-battle-report')).toBeVisible();
  }finally{await c.close();}
});
for(const [width,height]of [[320,640],[390,844],[768,1024],[1440,1000],[844,390]])test(`${width}×${height}: all planner pages and in-game controls fit, with usable touch targets`,async({browser})=>{
  const c=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width<500,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{const s=squadReady();turn(s,'explore','attack');await seed(p,s);await openBattle(p);await p.locator('[data-duel="planner"]').tap();for(const id of ['plan','teams','reports']){await tab(p,id).tap();expect(await planner(p).evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);const targets=await planner(p).locator('button,select,input').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,type:e.type};}));expect(targets.every(r=>r.left>=0&&r.right<=width&&r.height>=(r.type==='checkbox'?22:44)&&r.width>=(r.type==='checkbox'?22:44))).toBe(true);}expect(errors).toEqual([]);await p.evaluate(()=>window.spiritBack());await expect(planner(p)).not.toBeVisible();expect(await p.locator('#combat-stage').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  }finally{await c.close();}
});
