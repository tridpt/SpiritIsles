import { test,expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { B } from '../legacy-combat.mjs';

test('the Android pagehide and resume events freeze the exact timing position without consuming a turn',async({page})=>{
  const s=E.newGame();s.level=2;B.startBoss(s,1,()=>.3);
  await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:E.SAVE_KEY,raw:E.serialize(s)});
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.goto('/');
  const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state.boss.run,E.SAVE_KEY);
  await page.locator('[data-action="active-battle"]').click();const before=await read();await page.locator('[data-move="attack"]').click();await page.clock.runFor(300);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));const cursor=await page.locator('[data-duel-cursor]').getAttribute('data-position');await page.clock.runFor(10000);
  expect(await read()).toEqual(before);expect(await page.locator('[data-duel-cursor]').getAttribute('data-position')).toBe(cursor);
  await page.evaluate(()=>window.dispatchEvent(new Event('spirit-resume')));await page.clock.runFor(300);await page.locator('[data-duel="hit"]').click();await page.clock.runFor(100);const after=await read();expect(after.turn).toBe(1);expect(after.rhythm.pressure).toBe(34);
});
