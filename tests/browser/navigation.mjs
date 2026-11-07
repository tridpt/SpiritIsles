import { expect } from '@playwright/test';

export async function openGameMenu(page) {
  if (!await page.locator('.island-menu[open]').count()) {
    await page.getByRole('button', { name: 'Mở menu đảo', exact: true }).click();
  }
  await expect(page.locator('.island-menu[open]')).toBeVisible();
}

export async function navigateGame(page, destination) {
  await openGameMenu(page);
  await page.locator(`.game-menu-grid [data-page="${destination}"]`).click();
  await expect(page.locator('.island-menu')).toHaveCount(0);
}

export async function openSettings(page) {
  await openGameMenu(page);
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
}
