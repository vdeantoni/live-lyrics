import { test, type Page } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

/**
 * Helper to take a screenshot with consistent waiting
 */
const takeScreenshot = async (page: Page, filename: string, extraDelay = 0) => {
  if (extraDelay > 0) {
    await page.waitForTimeout(extraDelay);
  }
  await page.screenshot({
    path: `lost-pixel/${filename}.png`,
    fullPage: true,
  });
};

/**
 * Helper to wait for settings screen to be ready
 */
const waitForSettingsReady = async (page: Page) => {
  await page.waitForSelector('[data-testid="settings-screen"]');
  await page.waitForSelector('[data-testid="lyrics-provider-section"]');
  await page.waitForSelector('[data-testid="artwork-provider-section"]');
  await page.waitForTimeout(800);
};

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
  });

  // ===== Empty State (No Song) - Key Viewports =====

  test("empty state mobile (320x568)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="empty-screen"]');
    await takeScreenshot(page, "empty-mobile", 300);
  });

  test("empty state tablet (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="empty-screen"]');
    await takeScreenshot(page, "empty-tablet", 300);
  });

  test("empty state desktop (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="empty-screen"]');
    await takeScreenshot(page, "empty-desktop", 300);
  });

  // ===== Player with Song - Key States =====

  test("player with song paused (tablet)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await setupPlayerWithSong(page, true);
    await takeScreenshot(page, "player-paused", 300);
  });

  test("player with song playing (tablet)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await setupPlayerWithSong(page, true);

    // Click play button to show playing state
    await page.click('[data-testid="play-pause-button"]');
    await takeScreenshot(page, "player-playing", 300);
  });

  test("lyrics with highlighting (tablet)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await setupPlayerWithSong(page, true);

    // Start playing to trigger highlighting
    await page.click('[data-testid="play-pause-button"]');

    // Wait for highlighted line
    await page
      .waitForSelector('[data-testid="lyrics-line"][data-current="true"]', {})
      .catch(() => {});

    await takeScreenshot(page, "lyrics-highlighted", 500);
  });

  // ===== Settings Screen - Key Viewports =====

  test("settings screen mobile (320x568)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    await page.click('[data-testid="settings-button"]');
    await waitForSettingsReady(page);
    await takeScreenshot(page, "settings-mobile");
  });

  test("settings screen tablet (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    await page.click('[data-testid="settings-button"]');
    await waitForSettingsReady(page);
    await takeScreenshot(page, "settings-tablet");
  });

  // ===== Playlists Screen - Key Viewports =====

  test("playlists screen mobile (320x568)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    await page.click('[data-testid="playlists-button"]');
    await page.waitForSelector('[data-testid="playlists-screen"]');
    await takeScreenshot(page, "playlists-mobile", 500);
  });

  test("playlists screen tablet (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    await page.click('[data-testid="playlists-button"]');
    await page.waitForSelector('[data-testid="playlists-screen"]');
    await takeScreenshot(page, "playlists-tablet", 500);
  });

  test("playlists screen desktop (1440x900)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    await page.click('[data-testid="playlists-button"]');
    await page.waitForSelector('[data-testid="playlists-screen"]');
    await takeScreenshot(page, "playlists-desktop", 500);
  });
});
