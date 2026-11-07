import {test,expect} from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';
import { B } from '../legacy-combat.mjs';
import { D } from '../legacy-combat.mjs';
import {combatScene} from '../../web/js/combat-stage.js';

const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
const run=(s,m)=>m==='boss'?s.boss.run:m==='ruins'?s.ruins.run:s.expedition;
function ready(mode='explore',team=['mossfox','axolotl','emberbird']){
  const s=E.newGame();s.level=2;s.resources.food=5000;s.team=team;
  if(mode==='explore'){E.startExpedition(s,'forest',()=>.1);E.chooseRoute(s,0,()=>.1);s.expedition.power=30;s.expedition.battle.power=80;s.expedition.battle.focus=3;}
  else if(mode==='ruins'){R.startRuins(s,1,()=>.4);R.chooseRuinsPath(s,s.ruins.run.paths.find(id=>id!=='spring'));s.ruins.run.focus=3;s.ruins.run.members.forEach(m=>m.power=8);}
  else{B.startBoss(s,1,()=>.4);s.boss.run.focus=3;}
  return s;
}
async function seed(p,s){
  await p.addInitScript(({key,raw})=>{if(!sessionStorage.getItem('team-seeded')){localStorage.setItem(key,raw);sessionStorage.setItem('team-seeded','1');}Math.random=()=>.5;},{key:E.SAVE_KEY,raw:E.serialize(s)});
  await p.goto('/');await p.evaluate(()=>document.fonts.ready);
}
async function open(p,mode){await p.locator(`[data-action="active-battle"][data-id="${mode}"]`).click();await expect(p.locator('#combat-stage')).toBeVisible();}
async function commit(p,move='skill'){await p.locator(`[data-duel="choose"][data-move="${move}"]`).click();await p.locator('[data-duel="skip"]').click();}
async function clock(p){await p.clock.install();await p.clock.pauseAt(new Date(Date.now()+1000));}

test('Hợp lực launches all actual team members in every arena and commits one turn for two energy',async({browser})=>{
  for(const mode of ['explore','ruins','boss']){
    const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference',serviceWorkers:'block'}),p=await c.newPage();
    try{
      await clock(p);const s=ready(mode);await seed(p,s);await open(p,mode);await commit(p);
      await expect(p.locator('.duel-friend.is-acting')).toHaveCount(3);await expect(p.locator('.duel-team-projectile:not(.from-enemy)')).toHaveCount(3);await expect(p.locator('.duel-callout')).toContainText('HỢP LỰC · 3 THÚ');
      expect(await p.locator('.duel-team-projectile:not(.from-enemy)').evaluateAll(es=>es.map(e=>e.dataset.caster))).toEqual(s.team);
      const after=await read(p);expect(mode==='explore'?after.expedition.battle.round:mode==='ruins'?after.ruins.run.battle.turn:after.boss.run.turn).toBe(1);expect(mode==='explore'?after.expedition.battle.focus:run(after,mode).focus).toBe(1);expect(after.resources).toEqual(s.resources);
      await p.clock.runFor(1300);await expect(p.locator('.duel-feedback')).toContainText('Hợp lực 3 thú');await p.reload();expect(run(await read(p),mode)).toEqual(run(after,mode));
    }finally{await c.close();}
  }
});

test('normal opponents form a stable squad, counterattack visibly, and keep a single shared damage total',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await clock(page);const s=ready();s.expedition.stage=1;await seed(page,s);
  await expect(page.locator('.battle-enemy .combat-enemy-member')).toHaveCount(3);const species=await page.locator('.battle-enemy .combat-enemy-member').evaluateAll(es=>es.map(e=>e.dataset.enemySpecies));expect(new Set(species).size).toBe(3);
  await open(page,'explore');await expect(page.locator('.duel-opponent .combat-enemy-member')).toHaveCount(3);await expect(page.locator('.duel-enemy-hp')).toContainText('Đội địch · 3 thú');
  const before=await read(page);await commit(page,'attack');await page.clock.runFor(800);await expect(page.locator('.combat-enemy-member.is-attacking')).toHaveCount(3);await expect(page.locator('.duel-team-projectile.from-enemy')).toHaveCount(3);
  const saved=await read(page);expect(saved.expedition.battle.round).toBe(before.expedition.battle.round+1);await page.clock.runFor(500);await page.reload();expect(await page.locator('.battle-enemy .combat-enemy-member').evaluateAll(es=>es.map(e=>e.dataset.enemySpecies))).toEqual(species);expect((await read(page)).expedition).toEqual(saved.expedition);
});

test('an individual skill highlights only its caster; two-pet teams use precisely two actors',async({browser})=>{
  for(const [team,move,count] of [[['mossfox','axolotl','emberbird'],'pet:axolotl',1],[['axolotl','emberbird'],'skill',2]]){
    const c=await browser.newContext({reducedMotion:'no-preference',serviceWorkers:'block'}),p=await c.newPage();
    try{await clock(p);await seed(p,ready('boss',team));await open(p,'boss');await expect(p.locator('.duel-skill-guide')).toContainText('Chiêu riêng');await commit(p,move);await expect(p.locator('.duel-friend.is-acting')).toHaveCount(count);await expect(p.locator('.duel-cast-roster>span')).toHaveCount(count);expect(await p.locator('.duel-team-projectile:not(.from-enemy)').evaluateAll(es=>es.map(e=>e.dataset.caster))).toEqual(move.startsWith('pet:')?['axolotl']:team);}finally{await c.close();}
  }
});

test('quick combat and its phone replay show all members for Hợp lực, including elemental projectiles',async({browser})=>{
  for(const mode of ['explore','ruins','boss']){
    const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference',serviceWorkers:'block'}),p=await c.newPage();
    try{
      await clock(p);await seed(p,ready(mode));const a=mode==='explore'?'battle':mode==='ruins'?'ruins-battle':'boss-battle';await p.locator(`[data-action="${a}"][data-id="skill"]`).click();
      await expect(p.locator('.combat-fx')).toHaveAttribute('data-cast-count','3');await expect(p.locator('.combat-fx .fx-projectile')).toHaveCount(3);await expect(p.locator('.combat-acting')).toHaveCount(3);await expect(p.locator('.fx-combo')).toContainText('HỢP LỰC · 3 THÚ');
      if(await p.locator('.combat-replay').count())await expect(p.locator('.combat-replay .replay-party>.creature')).toHaveCount(3);
    }finally{await c.close();}
  }
});

test('offline Hợp lực with reduced motion remains a team action and preserves the saved battle after reopening',async({browser})=>{
  const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'allow'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
    await seed(p,ready('ruins'));await p.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>p.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    const assets=await p.evaluate(async()=>{const k=(await caches.keys()).find(k=>k.startsWith('spirit-isles-'));return (await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname);});for(const f of ['/combat-team.css','/js/combat-team.js','/js/combat-team-ui.js'])expect(assets).toContain(f);
    await c.setOffline(true);await open(p,'ruins');await commit(p);await expect(p.locator('.duel-team-projectile')).toHaveCount(0);await expect(p.locator('.duel-feedback')).toContainText('Hợp lực 3 thú');const after=await read(p);await p.reload();expect((await read(p)).ruins).toEqual(after.ruins);await open(p,'ruins');await expect(p.locator('.duel-opponent .combat-enemy-member')).toHaveCount(2);expect(errors).toEqual([]);
  }finally{await c.close();}
});

test('training and ruler battles remain a single named opponent while normal formation previews are read only',async({page})=>{
  const s=ready('boss');await seed(page,s);await open(page,'boss');await expect(page.locator('.duel-opponent>.guardian-art')).toHaveCount(1);await expect(page.locator('.duel-opponent .combat-enemy-member')).toHaveCount(0);expect((await read(page)).boss).toEqual(s.boss);
  const trial=E.newGame();expect(D.startDojo(trial,'practice','plain').error).toBeUndefined();const before=structuredClone(trial);expect(combatScene(trial,'dojo').enemyMembers).toEqual([]);expect(trial).toEqual(before);
});
