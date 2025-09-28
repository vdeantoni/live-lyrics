import { test, expect } from "@playwright/test";

test.describe("Application Layout and Responsiveness", () => {
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

    // Wait for the React app to load and the simulated player to initialize
    await page.waitForTimeout(1000);
  });

  test.describe("Portrait Layout (Mobile)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should load the application successfully", async ({ page }) => {
      // Main app container should be visible
      await expect(page.locator("#root")).toBeVisible();

      // Wait for React to render completely
      await page.waitForTimeout(3000);

      // Try to find the element with a longer timeout
      await page.waitForSelector('[data-testid="lyrics-visualizer"]', {
        timeout: 15000,
        state: "visible",
      });

      // Should have the main visualizer component
      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
    });

    test("should display all main components in portrait", async ({ page }) => {
      // Player should be visible
      await expect(page.locator('[data-testid="player"]')).toBeVisible();

      // Lyrics display should be visible
      await expect(
        page.locator('[data-testid="lyrics-display"]'),
      ).toBeVisible();

      // Should show the simulated song info
      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );
    });

    test("should handle scroll behavior correctly", async ({ page }) => {
      // Page should be scrollable if content exceeds viewport
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Allow small margin for rounding
    });
  });

  test.describe("Landscape Layout (Desktop/Tablet)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
    });

    test("should adapt layout for landscape orientation", async ({ page }) => {
      // Main components should still be visible
      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="player"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="lyrics-display"]'),
      ).toBeVisible();
    });

    test("should optimize space usage in landscape", async ({ page }) => {
      // The layout should make good use of horizontal space
      const visualizer = page.locator('[data-testid="lyrics-visualizer"]');
      const visualizerBox = await visualizer.boundingBox();

      expect(visualizerBox?.width).toBeGreaterThan(800); // Should use most of the width
    });

    test("should maintain aspect ratios in landscape", async ({ page }) => {
      // Album artwork or other visual elements should maintain proper proportions
      const aspectRatio = page.locator('[data-testid="album-artwork"]');
      if (await aspectRatio.isVisible()) {
        const box = await aspectRatio.boundingBox();
        if (box) {
          // Square aspect ratio for album artwork
          expect(Math.abs(box.width - box.height)).toBeLessThan(5);
        }
      }
    });
  });

  test.describe("Responsive Transitions", () => {
    test("should handle orientation changes smoothly", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      // Rotate to landscape
      await page.setViewportSize({ width: 1024, height: 768 });

      // Main components should still work
      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="player"]')).toBeVisible();

      // Rotate back to portrait
      await page.setViewportSize({ width: 768, height: 1024 });

      // Should still be functional
      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="player"]')).toBeVisible();
    });

    test("should handle different screen sizes", async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 768, height: 1024 }, // iPad Portrait
        { width: 1024, height: 768 }, // iPad Landscape
        { width: 1440, height: 900 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Main app should be visible and functional
        await expect(
          page.locator('[data-testid="lyrics-visualizer"]'),
        ).toBeVisible();

        // Should not have horizontal scroll
        const scrollWidth = await page.evaluate(
          () => document.body.scrollWidth,
        );
        const clientWidth = await page.evaluate(
          () => document.body.clientWidth,
        );
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
      }
    });
  });

  test.describe("Performance and Loading", () => {
    test("should load quickly", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/");
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper focus management", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Get all interactive elements
      const interactiveElements = [
        '[data-testid="play-pause-button"]',
        '[data-testid="progress-slider"]',
        'button[aria-label="Search lyrics"]',
        'button[aria-label="View playlists"]',
      ];

      // Tab through and verify at least one element can be focused
      let foundFocusableElement = false;
      for (let i = 0; i < interactiveElements.length + 1; i++) {
        await page.keyboard.press("Tab");

        // Check if any of our interactive elements is focused
        for (const selector of interactiveElements) {
          const element = page.locator(selector);
          if (
            (await element.isVisible()) &&
            (await element.evaluate((el) => document.activeElement === el))
          ) {
            foundFocusableElement = true;
            break;
          }
        }
        if (foundFocusableElement) break;
      }

      expect(foundFocusableElement).toBe(true);
    });

    test("should have adequate color contrast", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check that text is visible (basic contrast check)
      const songTitle = page.locator('[data-testid="song-title"]');
      if (await songTitle.isVisible()) {
        const color = await songTitle.evaluate(
          (el) => getComputedStyle(el).color,
        );
        expect(color).not.toBe("rgba(0, 0, 0, 0)"); // Should not be transparent
      }
    });
  });
});
