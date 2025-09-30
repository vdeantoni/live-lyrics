import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";

test.describe("Loading Screen", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
  });
  test("should display loading screen while bootstrap is in progress", async ({
    page,
  }) => {
    // Add a script that mocks the useBootstrap hook to add a delay
    await page.addInitScript(() => {
      // Store the original setTimeout
      const originalSetTimeout = window.setTimeout;

      // Override setTimeout to add delay to bootstrap process
      window.setTimeout = (
        callback: () => void,
        delay: number,
        ...args: unknown[]
      ) => {
        // If this is the bootstrap timeout (0ms), add a 2-second delay
        if (delay === 0 && typeof callback === "function") {
          return originalSetTimeout(callback, 2000, ...args);
        }
        return originalSetTimeout(callback, delay, ...args);
      };
    });

    // Start navigation and immediately check for loading screen
    await page.goto("/");

    // The loading screen should be visible initially
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible({
      timeout: 1000,
    });

    // Verify loading screen content
    await expect(page.locator("text=Live Lyrics")).toBeVisible();
    await expect(
      page.locator("text=Preparing your music experience..."),
    ).toBeVisible();

    // Check for animated elements
    const musicNotes = page.locator("svg").filter({ hasText: "" }).first(); // Music icon
    await expect(musicNotes).toBeVisible();

    // Verify the rotating vinyl record
    const vinylRecord = page
      .locator(".rounded-full")
      .filter({ has: page.locator("svg") })
      .first();
    await expect(vinylRecord).toBeVisible();

    // Verify soundwave bars are present
    const soundwaveBars = page.locator(
      ".bg-gradient-to-t.from-blue-500\\/60.to-purple-500\\/60",
    );
    await expect(soundwaveBars.first()).toBeVisible();

    // Player controls should still be visible during loading
    await expect(page.locator('[data-testid="player"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();

    // Wait for loading to complete and verify transition
    await expect(
      page.locator('[data-testid="loading-screen"]'),
    ).not.toBeVisible({ timeout: 5000 });

    // After loading, lyrics screen should be visible
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

    // Song information should be loaded
    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
    await expect(page.locator('[data-testid="artist-name"]')).toContainText(
      "Queen",
    );
  });

  test("should handle loading screen on different viewport sizes", async ({
    page,
  }) => {
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad Portrait
      { width: 1024, height: 768 }, // iPad Landscape
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // Mock bootstrap delay
      await page.addInitScript(() => {
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (
          callback: () => void,
          delay: number,
          ...args: unknown[]
        ) => {
          if (delay === 0 && typeof callback === "function") {
            return originalSetTimeout(callback, 1500, ...args);
          }
          return originalSetTimeout(callback, delay, ...args);
        };
      });

      await page.goto("/");

      // Loading screen should be visible on all viewport sizes
      await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible({
        timeout: 1000,
      });

      // Content should be properly centered and visible
      await expect(page.locator("text=Live Lyrics")).toBeVisible();

      // Wait for completion
      await expect(
        page.locator('[data-testid="loading-screen"]'),
      ).not.toBeVisible({ timeout: 4000 });
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    }
  });

  test("should animate loading elements properly", async ({ page }) => {
    // Mock bootstrap with longer delay to observe animations
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = (
        callback: () => void,
        delay: number,
        ...args: unknown[]
      ) => {
        if (delay === 0 && typeof callback === "function") {
          return originalSetTimeout(callback, 3000, ...args);
        }
        return originalSetTimeout(callback, delay, ...args);
      };
    });

    await page.goto("/");

    // Wait for loading screen to appear
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible();

    // Check that background gradient is animated (CSS animation should be applied)
    const backgroundElement = page
      .locator('[data-testid="loading-screen"] > div')
      .first();
    await expect(backgroundElement).toBeVisible();

    // Verify rotating vinyl record has rotation animation
    const vinylRecord = page
      .locator(".rounded-full")
      .filter({ has: page.locator("svg") })
      .first();

    // Take initial position
    const initialTransform = await vinylRecord.evaluate(
      (el) => getComputedStyle(el).transform,
    );

    // Wait a bit and check if transform changed (indicating rotation)
    await page.waitForTimeout(500);
    const laterTransform = await vinylRecord.evaluate(
      (el) => getComputedStyle(el).transform,
    );

    // The transform should have changed due to rotation animation
    expect(initialTransform).not.toBe(laterTransform);

    // Wait for loading to complete
    await expect(
      page.locator('[data-testid="loading-screen"]'),
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("should transition smoothly from loading to lyrics screen", async ({
    page,
  }) => {
    // Mock with moderate delay to catch the transition
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = (
        callback: () => void,
        delay: number,
        ...args: unknown[]
      ) => {
        if (delay === 0 && typeof callback === "function") {
          return originalSetTimeout(callback, 2000, ...args);
        }
        return originalSetTimeout(callback, delay, ...args);
      };
    });

    await page.goto("/");

    // Initially, loading screen should be visible, lyrics screen should not
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="lyrics-screen"]'),
    ).not.toBeVisible();

    // Wait for the transition point (just before loading completes)
    await page.waitForTimeout(1800);

    // Both might be visible briefly during fade transition
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible();

    // Wait for transition to complete
    await expect(
      page.locator('[data-testid="loading-screen"]'),
    ).not.toBeVisible({ timeout: 2000 });
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

    // Verify content is loaded
    await expect(page.locator('[data-testid="song-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="artist-name"]')).toBeVisible();
  });

  test("should not show loading screen when app loads quickly", async ({
    page,
  }) => {
    // Don't mock setTimeout - let normal bootstrap happen quickly
    await page.goto("/");

    // Either loading screen appears very briefly or not at all
    // We should quickly see the lyrics screen
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible({
      timeout: 2000,
    });

    // Song data should be loaded
    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
  });
});
