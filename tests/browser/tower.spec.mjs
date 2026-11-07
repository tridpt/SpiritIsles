import {test,expect} from '@playwright/test';
import {E,T,towerGame,towerReady,climb,towerNow} from '../tower-fixtures.mjs';
import {squadGame} from '../squad-fixtures.mjs';
import {navigateGame} from './navigation.mjs';
import {readFileSync} from 'node:fs';
const {version}=JSON.parse(readFileSync('package.json','utf8'));
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(p,s){
  E.validateSave(E.serialize(s));await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('tower-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('tower-seeded','1');}},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
const auto=p=>p.locator('[data-duel="auto"]');

test('tower is reachable from the in-game menu and explore entry, with clear entry gating',async({page})=>{
  const s=squadGame();s.level=1;await seed(page,s);await navigateGame(page,'tower');await expect(page.locator('.tower-page')).toBeVisible();await expect(page.locator('[data-action="tower-start"]')).toBeDisabled();await expect(page.locator('[data-action="tower-start"]')).toContainText('cấp đảo 2');await navigateGame(page,'explore');await page.locator('.tower-entry').click();await expect(page.locator('.tower-sanctum')).toBeVisible();
});
test('start, branch, AUTO, blessing and reload form a real saved tower loop',async({page})=>{
  const s=squadGame();s.pets.forEach(p=>p.level=15);await seed(page,s);await navigateGame(page,'tower');const food=s.resources.food;await page.locator('[data-action="tower-start"]').click();expect((await read(page)).resources.food).toBe(food-10);await page.locator('[data-action="tower-path"][data-id="battle"]').click();await expect(page.locator('.combat-enemy-member')).toHaveCount(3);await page.locator('[data-action="tower-fight"]').click();await expect(auto(page)).toHaveAttribute('aria-checked','true');await page.clock.runFor(30000);await expect(page.locator('.duel-end')).toBeVisible();const won=await read(page);expect(won.tower.run.phase).toBe('blessing');expect(won.tower.best).toBe(1);expect(won.combatJournal.reports[0].mode).toBe('tower');
  await page.evaluate(()=>window.spiritBack());await expect(page.locator('#combat-stage')).not.toBeVisible();await expect(page.locator('[data-action="tower-blessing"]')).toHaveCount(3);await page.reload();await expect(page.locator('[data-action="tower-blessing"]')).toHaveCount(3);expect((await read(page)).tower.run).toEqual(won.tower.run);await page.locator('[data-action="tower-blessing"]').first().click();expect((await read(page)).tower.run.floor).toBe(2);await page.clock.runFor(60000);expect((await read(page)).tower.run.floor).toBe(2);
});
test('AUTO pauses on Back, preserves a committed turn across reload and requires re-enabling',async({page})=>{
  const s=towerReady();await seed(page,s);await page.locator('[data-action="tower-fight"]').click();await page.clock.runFor(901);await page.evaluate(()=>window.spiritBack());await expect(auto(page)).toHaveAttribute('aria-checked','false');const stopped=(await read(page)).tower.run;await page.clock.runFor(10000);expect((await read(page)).tower.run).toEqual(stopped);await page.reload();await page.locator('[data-action="active-battle"][data-id="tower"]').click();await expect(auto(page)).toHaveAttribute('aria-checked','false');await page.clock.runFor(10000);expect((await read(page)).tower.run).toEqual(stopped);
});
test('manual skill preview is pure and committing changes individual HP',async({page})=>{
  const s=towerReady();await seed(page,s);await page.locator('[data-action="active-battle"][data-id="tower"]').click();const before=await read(page);await page.locator('[data-move="attack"]').click();await expect(page.locator('.duel-meter')).toBeVisible();expect((await read(page)).tower.run).toEqual(before.tower.run);await page.locator('[data-duel="skip"]').click();await page.clock.runFor(100);const after=await read(page);expect(after.tower.run.battle.turn).toBe(1);expect(after.tower.run.squad.enemies).not.toEqual(before.tower.run.squad.enemies);
});
test('retreat confirms, keeps banked loot and returns to the tower lobby',async({page})=>{
  const s=climb(towerGame({level:15}),3,{save:true});await seed(page,s);const resources=(await read(page)).resources;await page.locator('[data-action="tower-retreat"]').click();await expect(page.locator('[data-action="tower-confirm-retreat"]')).toBeVisible();await page.locator('[data-action="tower-confirm-retreat"]').click();await expect(page.locator('.tower-last-result')).toContainText('Đã trở về');expect((await read(page)).tower.run).toBeNull();expect((await read(page)).resources).toEqual(resources);
});
test('milestone and weekly prizes pay once, decorations unlock and the crown renders on the team',async({page})=>{
  const s=climb(towerGame({level:30,stars:3}),31,{save:true});await seed(page,s);await navigateGame(page,'tower');await page.locator('[data-action="tower-tab"][data-id="rewards"]').click();const before=await read(page);await page.locator('[data-action="tower-milestone"][data-id="30"]').click();await expect(page.locator('[data-action="tower-milestone"][data-id="30"]')).toBeDisabled();await page.locator('[data-action="tower-weekly"][data-id="30"]').click();await expect(page.locator('[data-action="tower-weekly"][data-id="30"]')).toBeDisabled();expect((await read(page)).resources.tickets).toBe(before.resources.tickets+9);await page.locator('[data-action="tower-aura"]').click();expect((await read(page)).tower.aura).toBe(true);await page.locator('[data-action="tower-tab"][data-id="climb"]').click();await expect(page.locator('.tower-companions .tower-pet-crown')).toHaveCount(3);await page.reload();await navigateGame(page,'tower');await expect(page.locator('.tower-companions .tower-pet-crown')).toHaveCount(3);
});
for(const viewport of [{width:320,height:640},{width:390,height:844},{width:844,height:390}])test(`tower paths, prizes, menu and combat fit ${viewport.width}x${viewport.height}`,async({browser})=>{
  const c=await browser.newContext({viewport,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(p,towerGame());for(const phase of ['path','battle','prizes','menu']){
      if(phase==='battle'){await p.locator('[data-action="tower-path"][data-id="battle"]').click();await p.locator('[data-action="active-battle"]').click();}
      if(phase==='prizes'){await p.evaluate(()=>window.spiritBack());await p.locator('[data-action="tower-tab"][data-id="rewards"]').click();}
      if(phase==='menu')await p.locator('[data-action="game-menu"]').click();
      expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const bad=await p.locator(phase==='battle'?'#combat-stage button':phase==='menu'?'.game-menu-grid button':'.tower-page button').evaluateAll(es=>es.filter(e=>e.checkVisibility()).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,x:r.x,right:r.right,height:r.height};}).filter(r=>r.x<0||r.right>innerWidth+1||r.height<35));expect(bad).toEqual([]);
    }expect(errors).toEqual([]);
  }finally{await c.close();}
});
test('tower assets precache and an active squad fight resumes offline',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'allow'}),p=await c.newPage();try{
    await seed(p,towerReady());await p.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>p.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);expect(await p.evaluate(async v=>{const cache=await caches.open(`spirit-isles-v${v}`);return (await Promise.all(['tower.css','js/tower-data.js','js/tower-state.js','js/tower-engine.js','js/tower-ui.js','js/tower-art.js'].map(f=>cache.match('/'+f)))).every(Boolean);},version)).toBe(true);await c.setOffline(true);await p.reload();await p.locator('[data-action="tower-fight"]').click();await p.clock.runFor(901);await auto(p).click();expect((await read(p)).tower.run.battle.turn).toBe(1);
  }finally{await c.close();}
});
