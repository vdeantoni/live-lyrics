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
    await page.waitForTimeout(500); // Quick app initialization
  });

  test.describe("Portrait Layout (Mobile)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should load the application successfully", async ({ page }) => {
      await expect(page.locator("#root")).toBeVisible();
      await page.waitForTimeout(1000);

      await page.waitForSelector('[data-testid="lyrics-visualizer"]', {
        state: "visible",
      });

      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
    });

    test("should display all main components in portrait", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      await expect(page.locator('[data-testid="player"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="lyrics-display"]'),
      ).toBeVisible();

      // Wait specifically for song data to load
      await page.waitForFunction(() => {
        const songName = document.querySelector('[data-testid="song-name"]');
        return songName && songName.textContent?.includes("Bohemian Rhapsody");
      });

      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );
    });

    test("should handle scroll behavior correctly", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });

  test.describe("Landscape Layout (Desktop/Tablet)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
    });

    test("should adapt layout for landscape orientation", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="player"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="lyrics-display"]'),
      ).toBeVisible();
    });

    test("should optimize space usage in landscape", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      const visualizer = page.locator('[data-testid="lyrics-visualizer"]');
      const visualizerBox = await visualizer.boundingBox();
      expect(visualizerBox?.width).toBeGreaterThan(800);
    });
  });

  test.describe("Responsive Transitions", () => {
    test("should handle orientation changes smoothly", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      // Rotate to landscape
      await page.setViewportSize({ width: 1024, height: 768 });

      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="player"]')).toBeVisible();

      // Rotate back to portrait
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(
        page.locator('[data-testid="lyrics-visualizer"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="player"]')).toBeVisible();
    });

    test("should handle different screen sizes", async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 768, height: 1024 }, // iPad Portrait
        { width: 1024, height: 768 }, // iPad Landscape
        { width: 1440, height: 900 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

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
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper focus management", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      const interactiveElements = [
        '[data-testid="play-pause-button"]',
        '[data-testid="progress-slider"]',
        'button[aria-label="Search lyrics"]',
        'button[aria-label="View playlists"]',
      ];

      let foundFocusableElement = false;

      // Try to focus each element directly to test if it's focusable
      for (const selector of interactiveElements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          try {
            await element.focus();
            const isFocused = await element.evaluate(
              (el) => document.activeElement === el,
            );
            if (isFocused) {
              foundFocusableElement = true;
              break;
            }
          } catch {
            // Element not focusable, continue to next
          }
        }
      }

      expect(foundFocusableElement).toBe(true);
    });

    test("should have adequate color contrast", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="lyrics-visualizer"]');

      const songName = page.locator('[data-testid="song-name"]');
      if (await songName.isVisible()) {
        const color = await songName.evaluate(
          (el) => getComputedStyle(el).color,
        );
        expect(color).not.toBe("rgba(0, 0, 0, 0)");
      }
    });
  });
});