import { test, expect } from '@playwright/test';

test('it should match the screenshot in portrait mode', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');

  // Wait for the song name to be visible to ensure the player has loaded.
  const songName = page.getByText('The Most Beautiful Girl (In The Room)');
  await expect(songName).toBeVisible();

  // Wait for a short period to allow animations to settle
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot('home-page-portrait.png', { fullPage: true });
});

test('it should match the screenshot in landscape mode', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');

  // Wait for the song name to be visible to ensure the player has loaded.
  const songName = page.getByText('The Most Beautiful Girl (In The Room)');
  await expect(songName).toBeVisible();

  // Wait for a short period to allow animations to settle
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot('home-page-landscape.png', { fullPage: true });
});