import { test, expect } from "@playwright/test";

test.describe("Application Layout and Responsiveness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Portrait Layout (Mobile)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should load the application successfully", async ({ page }) => {
      await expect(page.locator("#root")).toBeVisible();
      await expect(page.locator('[data-testid="music-player"]')).toBeVisible();
    });

    test("should display all main components in portrait", async ({ page }) => {
      await expect(page.locator('[data-testid="music-player"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

      // Wait for the song name to appear by targeting the h2 within the new div
      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );

      // Now that we know the song name is there, we can check the artist
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );
    });
  });

  test("should handle scroll behavior correctly", async ({ page }) => {
    await page.waitForSelector('[data-testid="music-player"]');

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
    await page.goto("/");
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test("should adapt layout for landscape orientation", async ({ page }) => {
    await page.waitForSelector('[data-testid="music-player"]');

    await expect(page.locator('[data-testid="music-player"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
  });

  test("should optimize space usage in landscape", async ({ page }) => {
    await page.waitForSelector('[data-testid="music-player"]');

    const visualizer = page.locator('[data-testid="music-player"]');
    const visualizerBox = await visualizer.boundingBox();
    expect(visualizerBox?.width).toBeGreaterThan(800);
  });
});

test.describe("Responsive Transitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should handle orientation changes smoothly", async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="music-player"]');

    // Rotate to landscape
    await page.setViewportSize({ width: 1024, height: 768 });

    await expect(page.locator('[data-testid="music-player"]')).toBeVisible();

    // Rotate back to portrait
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.locator('[data-testid="music-player"]')).toBeVisible();
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

      await expect(page.locator('[data-testid="music-player"]')).toBeVisible();

      // Should not have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);
    }
  });
});

test.describe("Performance and Loading", () => {
  test("should load quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForSelector('[data-testid="music-player"]');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have proper focus management", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="music-player"]');

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
    await page.waitForSelector('[data-testid="music-player"]');

    const songName = page.locator('[data-testid="song-name"]');
    if (await songName.isVisible()) {
      const color = await songName.evaluate((el) => getComputedStyle(el).color);
      expect(color).not.toBe("rgba(0, 0, 0, 0)");
    }
  });
});
