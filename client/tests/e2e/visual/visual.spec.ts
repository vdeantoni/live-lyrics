import { test } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock lyrics API for consistent visual tests
    await page.route("**/get*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          syncType: "LINE_SYNCED",
          lines: [
            { startTimeMs: 0, words: "Is this the real life?" },
            { startTimeMs: 15000, words: "Is this just fantasy?" },
            { startTimeMs: 30000, words: "Caught in a landslide" },
            { startTimeMs: 45000, words: "No escape from reality" },
          ],
        }),
      });
    });
  });

  test("homepage portrait mode", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="music-player"]');

    // Wait for app to fully load and stabilize
    await page.waitForTimeout(2000);

    // Generate screenshot for Lost Pixel
    await page.screenshot({
      path: "lost-pixel/homepage-portrait.png",
      fullPage: true,
    });
  });

  test("homepage landscape mode", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="music-player"]');

    // Wait for app to fully load and stabilize
    await page.waitForTimeout(2000);

    // Generate screenshot for Lost Pixel
    await page.screenshot({
      path: "lost-pixel/homepage-landscape.png",
      fullPage: true,
    });
  });

  test("player component states", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="music-player"]');

    // Screenshot player in paused state
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="music-player"]').screenshot({
      path: "lost-pixel/player-paused.png",
    });

    // Click play and screenshot playing state
    await page.click('[data-testid="play-pause-button"]');
    await page.waitForTimeout(1000); // Let UI update
    await page.locator('[data-testid="music-player"]').screenshot({
      path: "lost-pixel/player-playing.png",
    });
  });

  test("lyrics display component", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="lyrics-screen"]');

    // Wait for lyrics to load
    await page.waitForTimeout(2000);

    // Screenshot just the lyrics display area
    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-display.png",
    });
  });

  test("settings screen visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="music-player"]');

    // Open settings
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[data-testid="settings-screen"]');

    // Wait for settings to fully load
    await page.waitForTimeout(1500);

    // Screenshot settings screen
    await page.locator('[data-testid="settings-screen"]').screenshot({
      path: "lost-pixel/settings-screen.png",
    });
  });

  test("mobile viewport visual", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
    await page.goto("/");
    await page.waitForSelector('[data-testid="music-player"]');

    // Wait for mobile layout to stabilize
    await page.waitForTimeout(2000);

    // Full page screenshot for mobile
    await page.screenshot({
      path: "lost-pixel/mobile-homepage.png",
      fullPage: true,
    });
  });

  test("tablet landscape visual", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // iPad Landscape
    await page.goto("/");
    await page.waitForSelector('[data-testid="music-player"]');

    // Wait for tablet layout to stabilize
    await page.waitForTimeout(2000);

    // Full page screenshot for tablet landscape
    await page.screenshot({
      path: "lost-pixel/tablet-landscape.png",
      fullPage: true,
    });
  });

  test("lyrics with highlighting visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="lyrics-screen"]');

    // Start playing to get highlighted lyrics
    await page.click('[data-testid="play-pause-button"]');

    // Wait for lyrics highlighting to activate
    await page.waitForSelector(
      '[data-testid="lyrics-line"][data-current="true"]',
      {
        timeout: 5000,
      },
    );

    // Screenshot lyrics with highlighting
    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-highlighted.png",
    });
  });

  test("player controls close-up visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player-controls"]');

    // Wait for player controls to stabilize
    await page.waitForTimeout(1000);

    // Screenshot just the player controls
    await page.locator('[data-testid="player-controls"]').screenshot({
      path: "lost-pixel/player-controls.png",
    });
  });
});
