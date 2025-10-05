import { test, type Page } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";

/**
 * Utility function to wait for app to be ready for screenshots
 * Focuses on essential UI elements being rendered, not API loading states
 */
const waitForAppReady = async (page: Page) => {
  // Wait for core UI elements to be present
  await page.waitForSelector('[data-testid="player"]');

  const lyricsContainer = page
    .locator('[data-testid="lyrics-container"]')
    .or(page.locator('[data-testid="no-lyrics"]'));

  await lyricsContainer.waitFor();

  // Small delay for any CSS transitions to complete
  await page.waitForTimeout(500);
};

/**
 * Utility function to wait for settings screen to be ready
 */
const waitForSettingsReady = async (page: Page) => {
  await page.waitForSelector('[data-testid="settings-screen"]');

  // Wait for provider sections to load
  await page.waitForSelector('[data-testid="lyrics-provider-section"]');
  await page.waitForSelector('[data-testid="artwork-provider-section"]');

  // Small delay for animations to complete
  await page.waitForTimeout(800);
};

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Use test registry for consistent, reliable mocking (no external API calls)
    await injectTestRegistry(page);
  });

  // ===== Breakpoint Coverage: Mobile, Tablet, Desktop =====

  test("mobile viewport (320x568)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/mobile.png",
      fullPage: true,
    });
  });

  test("tablet portrait (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/tablet-portrait.png",
      fullPage: true,
    });
  });

  test("tablet landscape (1024x768)", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/tablet-landscape.png",
      fullPage: true,
    });
  });

  test("desktop (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/desktop.png",
      fullPage: true,
    });
  });

  // ===== Player State Coverage =====

  test("player playing state", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Click play button to show playing state
    await page.click('[data-testid="play-pause-button"]');
    await page.waitForTimeout(300);

    await page.screenshot({
      path: "lost-pixel/player-playing.png",
      fullPage: true,
    });
  });

  test("lyrics with highlighting", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Start playing to trigger highlighting
    await page.click('[data-testid="play-pause-button"]');

    // Wait for highlighting (optional)
    try {
      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
        { timeout: 2000 },
      );
    } catch {
      // No highlighting is fine
    }

    await page.waitForTimeout(500);

    await page.screenshot({
      path: "lost-pixel/lyrics-highlighted.png",
      fullPage: true,
    });
  });

  // ===== Settings Screen Coverage =====

  test("settings screen tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Open settings
    await page.click('[data-testid="settings-button"]');
    await waitForSettingsReady(page);

    await page.screenshot({
      path: "lost-pixel/settings-tablet.png",
      fullPage: true,
    });
  });

  test("settings screen mobile", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    await waitForAppReady(page);

    // Open settings
    await page.click('[data-testid="settings-button"]');
    await waitForSettingsReady(page);

    await page.screenshot({
      path: "lost-pixel/settings-mobile.png",
      fullPage: true,
    });
  });

  test("settings screen desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await waitForAppReady(page);

    // Open settings
    await page.click('[data-testid="settings-button"]');
    await waitForSettingsReady(page);

    await page.screenshot({
      path: "lost-pixel/settings-desktop.png",
      fullPage: true,
    });
  });

  // ===== Playlists Screen Coverage =====

  test("playlists screen mobile (320x568)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    await waitForAppReady(page);

    // Open playlists screen
    await page.click('[data-testid="playlists-button"]');
    await page.waitForSelector('[data-testid="playlists-screen"]');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "lost-pixel/playlists-mobile.png",
      fullPage: true,
    });
  });

  test("playlists screen tablet (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Open playlists screen
    await page.click('[data-testid="playlists-button"]');
    await page.waitForSelector('[data-testid="playlists-screen"]');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "lost-pixel/playlists-tablet.png",
      fullPage: true,
    });
  });

  test("playlists screen desktop (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await waitForAppReady(page);

    // Open playlists screen
    await page.click('[data-testid="playlists-button"]');
    await page.waitForSelector('[data-testid="playlists-screen"]');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "lost-pixel/playlists-desktop.png",
      fullPage: true,
    });
  });
});
