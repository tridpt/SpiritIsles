import {test,expect} from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { R } from '../legacy-combat.mjs';
import {ruinsRouteNext,ruinsRouteMap} from '../../web/js/ruins-route.js';
import {ruinsIntent,ruinsMaxHp} from '../../web/js/ruins-data.js';
import {previewOrder} from '../../web/js/combat-preview.js';
import {journey,eventFixture,battleFixture} from '../ruins-route-fixtures.mjs';
const errors=[];
const read=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,E.SAVE_KEY);
async function seed(page,state){
 E.validateSave(E.serialize(state));const token=`route-${Date.now()}-${Math.random()}`;
 await page.addInitScript(({key,raw,token})=>{if(sessionStorage.getItem(token))return;localStorage.setItem(key,raw);sessionStorage.setItem(token,'1');},{key:E.SAVE_KEY,raw:E.serialize(state),token});
 await page.goto('/');await page.evaluate(()=>document.fonts.ready);
}
async function enter(page){await page.locator('.ruins-entry').click();}
test.beforeEach(async({page})=>{errors.length=0;page.on('pageerror',e=>errors.push(e.message));});
test.afterEach(()=>expect(errors).toEqual([]));
test('the new journey is discoverable, charges once and exposes connected choices without changing a legacy run',async({page})=>{
 await seed(page,E.newGame());await enter(page);await expect(page.locator('[data-action="ruins-journey"]')).toBeDisabled();const s=E.newGame();s.level=2;await seed(page,s);await enter(page);const before=await read(page);await page.locator('[data-action="ruins-journey"]').click();const after=await read(page);expect(after.resources.food).toBe(before.resources.food-12);expect(after.ruins.run.route.history).toEqual([]);await expect(page.locator('.route-map')).toBeVisible();await expect(page.locator('.route-node.available')).toHaveCount(3);await expect(page.locator('.route-options .route-option')).toHaveCount(3);await expect(page.locator('.route-node[data-id="2:0"]')).toBeDisabled();await page.reload();expect((await read(page)).ruins.run).toEqual(after.ruins.run);
});
test('every event and rest choice shows exact tradeoffs and resolves once through real controls',async({page})=>{
 for(const type of ['rescue','chest','altar','trader','rest']){
   const s=eventFixture(type);s.ruins.run.hp=80;s.ruins.run.potions=0;await seed(page,s);await expect(page.locator('.route-event')).toBeVisible();const c=R.ruinsEventContext(s).choices[0];await expect(page.locator(`[data-action="ruins-event"][data-id="${c.id}"]`)).toBeEnabled();if(c.blessingId)await expect(page.locator(`[data-id="${c.id}"]`)).toContainText('bậc');if(c.hpCost)await expect(page.locator('.route-choice-facts .cost')).toContainText(String(c.hpCost));await page.reload();const before=await read(page);expect(before.ruins.run).toEqual(s.ruins.run);await page.locator(`[data-action="ruins-event"][data-id="${c.id}"]`).click();const after=await read(page);expect(after.ruins.run.floor).toBe(before.ruins.run.floor+1);expect(after.ruins.run.route.history.at(-1).choice).toBe(c.id);expect(after.ruins.run.phase).toBe('path');E.validateSave(E.serialize(after));await expect(page.locator('.route-event')).toHaveCount(0);await page.reload();expect((await read(page)).ruins.run).toEqual(after.ruins.run);
 }
});
test('a cursed chest retains its risk and rewards after reload, and leaving keeps banked loot',async({page})=>{
 const s=eventFixture('chest');await seed(page,s);const before=await read(page);await page.locator('[data-action="ruins-event"][data-id="unseal"]').click();await expect(page.locator('.route-curse')).toContainText('+15%');const paid=await read(page);expect(paid.ruins.dust-before.ruins.dust).toBe(26);expect(paid.resources.gold-before.resources.gold).toBe(120);await page.reload();await expect(page.locator('.route-curse')).toContainText('1 lời nguyền');expect((await read(page)).ruins.run).toEqual(paid.ruins.run);await page.locator('[data-action="ruins-retreat"]').click();await page.getByRole('button',{name:'Trở về cùng cả đội'}).click();await expect(page.locator('.ruins-result')).toBeVisible();const after=await read(page);expect(after.ruins.dust).toBe(paid.ruins.dust);expect(after.resources).toEqual(paid.resources);expect(after.ruins.lastResult.journey.curse).toBe(1);
});
test('unaffordable or unsafe event options are disabled with a reason and never consume resources',async({page})=>{
 const s=eventFixture('rescue');s.resources.food=0;s.ruins.run.hp=1;await seed(page,s);const before=await read(page);await expect(page.locator('[data-id="feed"][data-action="ruins-event"]')).toBeDisabled();await expect(page.locator('[data-id="lift"][data-action="ruins-event"]')).toBeDisabled();await expect(page.locator('.route-event-choices')).toContainText('Cần 16 quả mọng');await expect(page.locator('.route-event-choices')).toContainText('Cần còn đủ sinh lực');expect((await read(page)).resources).toEqual(before.resources);await page.locator('[data-id="guide"][data-action="ruins-event"]').click();expect((await read(page)).ruins.run.hp).toBe(1);
});
test('elite combat explains its mechanic, previews a real perfect guard and resumes after reload',async({page})=>{
 await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));const s=battleFixture(8,'sentinel');s.ruins.run.focus=3;s.ruins.run.blessings={mirror:1,wardflow:1};s.ruins.run.hp=Math.min(s.ruins.run.hp,ruinsMaxHp(s.ruins.run));await seed(page,s);await expect(page.locator('.route-elite-guide')).toContainText('50%');await page.locator('[data-action="active-battle"][data-id="ruins"]').click();await expect(page.locator('[data-buff="elite"]')).toContainText('Gương Rêu');const before=await read(page),order={move:'guard',stance:'balanced',target:'body'},p=previewOrder(before,'ruins',order,'perfect');await page.locator('[data-move="guard"]').click();await expect(page.locator('[data-preview="incoming"]')).toHaveText(String(p.incoming.min));await page.clock.runFor(600);const expected=structuredClone(before);R.ruinsBattleTurn(expected,order,await page.evaluate(()=>Date.now()),'perfect');await page.locator('[data-duel="hit"]').click();await page.clock.runFor(1200);const actual=await read(page);expect(actual.ruins).toEqual(expected.ruins);expect(actual.ruins.run.battle.shield).toBe(0);await expect(page.locator('.duel-feedback')).toContainText('Khiên tinh anh đã vỡ');await page.locator('[data-duel="close"]').first().click();await page.reload();expect((await read(page)).ruins.run).toEqual(actual.ruins.run);
});
test('all ten rooms can be completed using the map, events, battles and blessing buttons',async({page})=>{
 test.setTimeout(60000);await seed(page,journey());let steps=0;
 while((await read(page)).ruins.run&&steps++<110){
  const s=await read(page),r=s.ruins.run;
  if(r.phase==='path'){const nodes=ruinsRouteNext(r),n=nodes.find(n=>n.kind==='trail')||nodes.find(n=>n.kind==='spring')||nodes[0];await page.locator(`[data-action="ruins-path"][data-id="${n.id}"]`).first().click();}
  else if(r.phase==='event'){const e=R.ruinsEventContext(s),c=e.choices.find(c=>['guide','outer','rest','talk','dew'].includes(c.id)&&!c.error)||e.choices.find(c=>!c.error);await page.locator(`[data-action="ruins-event"][data-id="${c.id}"]`).click();}
  else if(r.phase==='blessing'){const priority=['recovery','vitality','might','fireheart','tide','bastion','mirror','relay','dew'],id=priority.find(id=>r.offers.includes(id))||r.offers[0];await page.locator(`[data-action="ruins-blessing"][data-id="${id}"]`).click();}
  else if(r.hp<ruinsMaxHp(r)*.55&&r.potions)await page.locator('[data-action="ruins-potion"]').click();
  else await page.locator(`[data-action="ruins-battle"][data-id="${r.focus>=2?'skill':ruinsIntent(r).danger?'guard':'attack'}"]`).click();
  E.validateSave(E.serialize(await read(page)));
 }
 expect(steps).toBeLessThan(110);await expect(page.locator('.ruins-result.victory')).toBeVisible();await expect(page.locator('.ruins-result')).toContainText('10 ĐIỂM DỪNG');const done=await read(page);expect(done.ruins.best).toBe(10);expect(done.awakening.materials.relic).toBe(7);await page.reload();expect((await read(page)).ruins).toEqual(done.ruins);await enter(page);await page.locator('[data-action="ruins-chapter"][data-id="11"]').click();await page.locator('[data-action="ruins-journey"]').click();expect((await read(page)).ruins.run.startFloor).toBe(11);
});
test('the launch, map, events and build cards fit phones from 320px and keep choices touchable',async({page})=>{
 for(const [name,s]of [['hub',E.newGame()],['map',journey()],['event',eventFixture('chest')],['combat',battleFixture(8,'oracle')]]){
  if(name==='hub')s.level=2;await seed(page,s);if(name==='hub')await enter(page);
  for(const width of [320,360,390,768,1440]){
   await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
   const controls=page.locator('.route-option,.route-event-choice:not(:disabled),.route-node.available,[data-action="ruins-journey"]');
   for(let i=0;i<await controls.count();i++){const button=controls.nth(i);await button.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));expect(await button.evaluate(e=>{const b=e.getBoundingClientRect();return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth+1&&e.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2));})).toBe(true);}
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:`dist/screenshots/route-${name}-phone-1.13.0.png`,fullPage:true});
 }
});
test('a cached route and event remain playable offline without changing old legacy saves',async({browser})=>{
 const context=await browser.newContext({baseURL:'http://127.0.0.1:4189',serviceWorkers:'allow',reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  const s=eventFixture('altar');await seed(page,s);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await expect(page.locator('.route-event')).toContainText('Bệ đá cộng sinh');const before=await read(page);await page.locator('[data-action="ruins-event"][data-id="offer"]').click();const after=await read(page);expect(after.ruins.run.hp).toBeLessThan(before.ruins.run.hp);expect(after.ruins.run.route.history.at(-1).choice).toBe('offer');await page.reload();expect((await read(page)).ruins.run).toEqual(after.ruins.run);await expect(page.locator('.route-map')).toBeVisible();const cached=await page.evaluate(async()=>{const keys=await caches.keys();const cache=await caches.open(keys.find(k=>k.startsWith('spirit-isles-v')));return await Promise.all(['ruins-route.css','js/ruins-route.js','js/ruins-route-ui.js'].map(async u=>!!await cache.match(u)));});expect(cached).toEqual([true,true,true]);
 }finally{await context.close();}
});
