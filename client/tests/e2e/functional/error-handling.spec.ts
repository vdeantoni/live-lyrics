import { test, expect } from "@playwright/test";

test.describe("Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should handle lyrics API failures gracefully", async ({ page }) => {
    // Mock failed lyrics API response
    await page.route("**/get*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="music-player"]');

    // Should still show player controls even without lyrics
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="play-pause-button"]'),
    ).toBeVisible();

    // Should show some indication that lyrics are not available
    const lyricsScreen = page.locator('[data-testid="lyrics-screen"]');
    await expect(lyricsScreen).toBeVisible();
  });

  test("should handle network timeouts", async ({ page }) => {
    // Mock slow/timeout response
    await page.route("**/get*", async (route) => {
      // Delay response to simulate timeout
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 408,
        contentType: "application/json",
        body: JSON.stringify({ error: "Request Timeout" }),
      });
    });

    await page.setViewportSize({ width: 768, height: 1024 });

    // Player should still load
    await page.waitForSelector('[data-testid="music-player"]', {
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
  });

  test("should handle malformed lyrics data", async ({ page }) => {
    // Mock malformed lyrics response
    await page.route("**/get*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          syncType: "INVALID_TYPE",
          lines: "not an array",
        }),
      });
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="music-player"]');

    // Should still show player and lyrics screen
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
  });

  test("should show loading states appropriately", async ({ page }) => {
    let resolveResponse: (value: unknown) => void;
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve;
    });

    // Mock delayed response
    await page.route("**/get*", async (route) => {
      await responsePromise;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          syncType: "LINE_SYNCED",
          lines: [
            { startTimeMs: 0, words: "Test lyrics line 1" },
            { startTimeMs: 15000, words: "Test lyrics line 2" },
          ],
        }),
      });
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="music-player"]');

    // Should show some form of loading state or skeleton
    // The app should be functional even while loading lyrics
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();

    // Resolve the response
    resolveResponse!(true);

    // Wait for lyrics to potentially load
    await page.waitForTimeout(1000);
  });

  test("should handle JavaScript errors gracefully", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Listen for JavaScript errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.waitForSelector('[data-testid="music-player"]');

    // Basic functionality should work even if there are minor JS errors
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="play-pause-button"]'),
    ).toBeVisible();

    // Click play button to test interaction
    await page.locator('[data-testid="play-pause-button"]').click();

    // Should show pause icon after clicking play
    await expect(page.locator('[data-testid="pause-icon"]')).toBeVisible();

    // No critical errors should prevent basic functionality
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Failed to fetch") && // Network errors are expected in tests
        !error.includes("Loading chunk"), // Dynamic import errors in dev mode
    );
    if (criticalErrors.length > 0) {
      console.log("Critical Errors Found:", criticalErrors);
    }
    expect(criticalErrors.length).toBe(0);
  });

  test("should handle missing testid attributes gracefully", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Even if some test IDs are missing, core elements should still be present
    // Test with more generic selectors
    await expect(page.locator("#root")).toBeVisible();

    // Should have some form of player interface
    const hasPlayerElements =
      (await page.locator("button").count()) > 0 &&
      (await page.locator('[role="slider"]').count()) > 0;

    expect(hasPlayerElements).toBe(true);
  });
});
