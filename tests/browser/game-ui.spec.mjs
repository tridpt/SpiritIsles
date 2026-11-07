import { navigateGame } from './navigation.mjs';
import { test, expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';

const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)).state, E.SAVE_KEY);

test('the game lobby fits one screen and its HUD, pets, map and in-world shortcuts can be tapped without overlapping controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  for (const [width, height] of [[320, 640], [320, 720], [390, 844], [432, 864], [768, 1024], [1024, 844], [1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(() => {
      const selectors = ['.wallet-item', '.game-menu-toggle', '.daily-treasure', '.lobby-activity', '.map-hotspot', '.island-pet', '.firefly', '.lobby-quest', '[data-collect-button]', '.journey-launch', '.lobby-dojo', '.lobby-awakening', '.island-shortcut', '.lobby-habitat-hint', '.island-edit-entry'];
      return selectors.flatMap(s => [...document.querySelectorAll(s)]).filter(el => el.checkVisibility()).map(el => {
        const b = el.getBoundingClientRect(), hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        const label = el.matches('.island-shortcut') ? el.querySelector('strong')?.getBoundingClientRect() : null;
        const labelHit = label ? document.elementFromPoint(label.x + label.width / 2, label.y + label.height / 2) : null;
        return { name: el.getAttribute('aria-label') || el.textContent.trim(), inViewport: b.top >= 0 && b.left >= 0 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1, tappable: !!hit && el.contains(hit) && (!label || !!labelHit && el.contains(labelHit)) };
      });
    }).then(controls => controls.filter(c => !c.inViewport || !c.tappable)), { message: `${width}x${height}` }).toEqual([]);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height + 1);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
  }
  expect(errors).toEqual([]);
});

test('lobby rewards and the live harvest HUD update real progress, survive reload, and cannot be claimed twice', async ({ page }) => {
  const initial = E.newGame(Date.now() - 120000);
  await page.addInitScript(({ key, raw }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, raw); }, { key: E.SAVE_KEY, raw: E.serialize(initial) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-collect-button]').click();
  const harvested = await read(page);
  expect(harvested.resources.food).toBeGreaterThan(initial.resources.food);
  expect(harvested.resources.gold).toBeGreaterThan(initial.resources.gold);
  await page.getByRole('button', { name: 'Nhận quà hôm nay', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const checked = await read(page);
  expect(checked.daily.checkin).toBe(true);
  expect(checked.resources.tickets).toBeGreaterThan(harvested.resources.tickets);
  await page.getByRole('button', { name: 'Bắt đầu một ngày đẹp' }).click();
  await page.locator('.lobby-quest').click();
  await expect(page.locator('.hatch-sanctuary')).toBeVisible();
  await page.getByRole('button', { name: 'Ấp 1 trứng', exact: false }).click();
  await page.getByRole('button', { name: 'Mở trứng ngay' }).click();
  await page.getByRole('button', { name: 'Ở lại vườn ấp' }).click();
  await navigateGame(page,'island');
  await expect(page.locator('.lobby-quest')).toHaveClass(/quest-ready/);
  const before = await read(page);
  await page.locator('.lobby-quest').click();
  const after = await read(page);
  expect(after.claimed.length).toBe(before.claimed.length + 1);
  await page.reload();
  expect((await read(page)).claimed).toEqual(after.claimed);
  expect((await read(page)).resources).toEqual(after.resources);
  await expect(page.getByRole('button', { name: 'Nhận quà hôm nay', exact: true })).toHaveCount(0);
  await expect(page.locator('.lobby-quest')).not.toHaveClass(/quest-ready/);
});
