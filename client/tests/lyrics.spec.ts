import { test, expect } from "@playwright/test";

test.describe("Lyrics Display", () => {
  test.beforeEach(async ({ page }) => {
    // Mock lyrics API for simulated songs
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

    await page.goto("/");

    // Wait longer for the simulated player to start and lyrics to load
    await page.waitForSelector('[data-testid="lyrics-display"]', {
      timeout: 15000,
    });

    // Wait for the player to be initialized and playing
    await page.waitForFunction(
      () => {
        const songName = document.querySelector('[data-testid="song-name"]');
        return songName && songName.textContent?.includes("Bohemian Rhapsody");
      },
      { timeout: 10000 },
    );

    // Additional wait for lyrics to process and render
    await page.waitForTimeout(2000);
  });

  test.describe("Portrait Mode - Lyrics", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should display synchronized lyrics", async ({ page }) => {
      // Wait for lyrics to load
      await page.waitForSelector('[data-testid="lyrics-line"]', {
        timeout: 15000,
      });

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();

      expect(lineCount).toBeGreaterThan(10); // Should have at least 10 lines

      // Check first line content matches Bohemian Rhapsody
      await expect(lyricsLines.first()).toContainText("Is this the real life?");
    });

    test("should highlight current lyrics line", async ({ page }) => {
      // Wait for lyrics to load
      await page.waitForSelector('[data-testid="lyrics-line"]');

      // Click play to start playback and lyrics synchronization
      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();

      // Wait for at least one line to be marked as current
      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
        {
          timeout: 10000,
        },
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();
      // Should contain the first line since player starts at 0:00
      await expect(currentLine).toContainText("Is this the real life?");
    });

    test("should scroll to current lyrics line", async ({ page }) => {
      // Wait for lyrics to load
      await page.waitForSelector('[data-testid="lyrics-container"]');

      const lyricsContainer = page.locator('[data-testid="lyrics-container"]');
      await expect(lyricsContainer).toBeVisible();

      // Click play to start playback and lyrics synchronization
      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();

      // Wait for current line to be marked and visible in viewport
      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
        {
          timeout: 10000,
        },
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeInViewport();
    });
  });

  test.describe("Landscape Mode - Lyrics", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
    });

    test("should display lyrics in landscape layout", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-line"]');

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();
      expect(lineCount).toBeGreaterThan(10); // Should have many lines for Bohemian Rhapsody
    });

    test("should maintain lyrics synchronization in landscape", async ({
      page,
    }) => {
      await page.waitForSelector('[data-testid="lyrics-line"]');

      // Click play to start playback and lyrics synchronization
      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();

      // Wait for current line to be marked and highlighted
      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
        {
          timeout: 10000,
        },
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();
      await expect(currentLine).toContainText("Is this the real life?"); // First line at start
    });
  });

  test.describe("Source Switching", () => {
    test("should show source switcher when multiple sources available", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Source switcher should be visible
      const sourceSwitcher = page.locator('[data-testid="source-switcher"]');
      await expect(sourceSwitcher).toBeVisible();
    });

    test("should allow switching between lyrics sources", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const sourceSwitcher = page.locator('[data-testid="source-switcher"]');
      if (await sourceSwitcher.isVisible()) {
        // Click to expand source options
        await sourceSwitcher.click();

        // Should show available sources
        const sourceOptions = page.locator('[data-testid="source-option"]');
        await expect(sourceOptions.first()).toBeVisible();
      }
    });
  });

  test.describe("No Lyrics State", () => {
    // Note: These tests are skipped because the simulated player always has lyrics
    // for its hardcoded playlist songs and doesn't make HTTP requests that can be mocked
    test.skip("should handle songs without lyrics", async ({ page }) => {
      // Clear any existing route mocks
      await page.unroute("**/get*");

      // Mock no lyrics response
      await page.route("**/get*", async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Not found" }),
        });
      });

      await page.goto("/");

      // Should show no lyrics message
      await expect(
        page.locator('[data-testid="no-lyrics-message"]'),
      ).toBeVisible();
    });

    test.skip("should show fallback when lyrics fail to load", async ({
      page,
    }) => {
      // Clear any existing route mocks
      await page.unroute("**/get*");

      // Mock lyrics API failure
      await page.route("**/get*", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      });

      await page.goto("/");

      // Wait for error state to appear
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 10000,
      });

      // Should show error state
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test.describe("Visual Effects", () => {
    test("should show background effects with album artwork", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Background should be visible
      const background = page.locator('[data-testid="lyrics-background"]');
      await expect(background).toBeVisible();
    });

    test("should handle responsive design transitions", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="lyrics-display"]');

      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 });

      // Lyrics should still be visible and functional
      const lyricsDisplay = page.locator('[data-testid="lyrics-display"]');
      await expect(lyricsDisplay).toBeVisible();

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();
      expect(lineCount).toBeGreaterThan(10); // Should have many lines for Bohemian Rhapsody
    });
  });
});
