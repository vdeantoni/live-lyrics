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
    await page.waitForSelector('[data-testid="lyrics-visualizer"]');

    // Wait for app to fully load and stabilize
    await page.waitForTimeout(2000);

    // Generate screenshot for Lost Pixel
    await page.screenshot({
      path: "../lost-pixel/homepage-portrait.png",
      fullPage: true,
    });
  });

  test("homepage landscape mode", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="lyrics-visualizer"]');

    // Wait for app to fully load and stabilize
    await page.waitForTimeout(2000);

    // Generate screenshot for Lost Pixel
    await page.screenshot({
      path: "../lost-pixel/homepage-landscape.png",
      fullPage: true,
    });
  });

  test("player component states", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    // Screenshot player in paused state
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="player"]').screenshot({
      path: "../lost-pixel/player-paused.png",
    });

    // Click play and screenshot playing state
    await page.click('[data-testid="play-pause-button"]');
    await page.waitForTimeout(1000); // Let UI update
    await page.locator('[data-testid="player"]').screenshot({
      path: "../lost-pixel/player-playing.png",
    });
  });

  test("lyrics display component", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="lyrics-display"]');

    // Wait for lyrics to load
    await page.waitForTimeout(2000);

    // Screenshot just the lyrics display area
    await page.locator('[data-testid="lyrics-display"]').screenshot({
      path: "../lost-pixel/lyrics-display.png",
    });
  });
});
