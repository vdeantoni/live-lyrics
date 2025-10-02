import { test, Page } from "@playwright/test";
import {
  injectTestRegistry,
  injectTestRegistryWithLyricsFormat,
} from "../helpers/injectTestRegistry";

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

/**
 * Utility function to wait for loading screen (for loading screen tests)
 */
const waitForLoadingScreen = async (page: Page) => {
  await page.waitForSelector('[data-testid="loading-screen"]');

  // Wait for animations to stabilize
  await page.waitForTimeout(1000);
};

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Use test registry for consistent, reliable mocking (no external API calls)
    await injectTestRegistry(page);
  });

  test("homepage portrait mode", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/homepage-portrait.png",
      fullPage: true,
    });
  });

  test("homepage landscape mode", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/homepage-landscape.png",
      fullPage: true,
    });
  });

  test("mobile viewport visual", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/mobile-homepage.png",
      fullPage: true,
    });
  });

  test("tablet landscape visual", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // iPad Landscape
    await page.goto("/");

    await waitForAppReady(page);

    await page.screenshot({
      path: "lost-pixel/tablet-landscape.png",
      fullPage: true,
    });
  });

  test("player component states", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Screenshot player in initial state
    await page.locator('[data-testid="player"]').screenshot({
      path: "lost-pixel/player-initial.png",
    });

    // Click play button to change state
    await page.click('[data-testid="play-pause-button"]');
    await page.waitForTimeout(300); // Let UI update

    await page.locator('[data-testid="player"]').screenshot({
      path: "lost-pixel/player-playing.png",
    });

    // Set progress slider to 50% position
    const slider = page.locator('[data-testid="progress-slider"]');
    const sliderBounds = await slider.boundingBox();
    if (sliderBounds) {
      await page.mouse.click(
        sliderBounds.x + sliderBounds.width * 0.5,
        sliderBounds.y + sliderBounds.height / 2,
      );
      await page.waitForTimeout(300);

      await page.locator('[data-testid="player"]').screenshot({
        path: "lost-pixel/player-midpoint.png",
      });
    }
  });

  test("lyrics display component", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Screenshot the lyrics area (either content or no-lyrics state)
    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-display.png",
    });
  });

  test("player controls close-up visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await page.waitForSelector('[data-testid="player-controls"]');
    await page.waitForTimeout(500); // Let controls stabilize

    await page.locator('[data-testid="player-controls"]').screenshot({
      path: "lost-pixel/player-controls.png",
    });
  });

  test("settings screen visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Open settings
    await page.click('[data-testid="settings-button"]');
    await waitForSettingsReady(page);

    await page.locator('[data-testid="settings-screen"]').screenshot({
      path: "lost-pixel/settings-screen.png",
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

  test("lyrics with highlighting visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await waitForAppReady(page);

    // Only test highlighting if we have lyrics content (not no-lyrics state)
    const hasLyricsContent = await page
      .locator('[data-testid="lyrics-container"]')
      .isVisible();

    if (hasLyricsContent) {
      // Start playing to get highlighted lyrics
      await page.click('[data-testid="play-pause-button"]');

      // Wait for lyrics highlighting to potentially activate
      try {
        await page.waitForSelector(
          '[data-testid="lyrics-line"][data-current="true"]',
        );
      } catch {
        // If no highlighting appears, that's OK - we'll still take the screenshot
      }

      await page.waitForTimeout(500);
    }

    // Screenshot lyrics area regardless of highlighting state
    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-highlighted.png",
    });
  });

  test("loading screen visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Mock delayed bootstrap to capture loading screen
    await page.addInitScript(() => {
      // Extend the bootstrap delay to capture loading screen
      if (window && typeof window.setTimeout === "function") {
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function (
          callback: TimerHandler,
          delay?: number,
          ...args: unknown[]
        ): number {
          // If this looks like the bootstrap delay (0ms timeout), extend it
          if (delay === 0 && typeof callback === "function") {
            return originalSetTimeout.call(this, callback, 2000, ...args);
          }
          return originalSetTimeout.call(this, callback, delay, ...args);
        };
      }
    });

    await page.goto("/");
    await waitForLoadingScreen(page);

    // Screenshot the loading screen
    await page.locator('[data-testid="loading-screen"]').screenshot({
      path: "lost-pixel/loading-screen.png",
    });

    // Full page loading screen
    await page.screenshot({
      path: "lost-pixel/loading-screen-fullpage.png",
      fullPage: true,
    });
  });

  test("loading screen mobile visual", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    // Mock delayed bootstrap for mobile
    await page.addInitScript(() => {
      if (window && typeof window.setTimeout === "function") {
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function (
          callback: TimerHandler,
          delay?: number,
          ...args: unknown[]
        ): number {
          if (delay === 0 && typeof callback === "function") {
            return originalSetTimeout.call(this, callback, 1800, ...args);
          }
          return originalSetTimeout.call(this, callback, delay, ...args);
        };
      }
    });

    await page.goto("/");
    await waitForLoadingScreen(page);

    await page.screenshot({
      path: "lost-pixel/loading-screen-mobile.png",
      fullPage: true,
    });
  });

  test("lyrics with enhanced lrc format", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await injectTestRegistryWithLyricsFormat(page, "enhanced");
    await page.goto("/");

    await waitForAppReady(page);

    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-enhanced-lrc.png",
    });
  });

  test("lyrics with normal lrc format", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await injectTestRegistryWithLyricsFormat(page, "normal");
    await page.goto("/");

    await waitForAppReady(page);

    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-normal-lrc.png",
    });
  });

  test("lyrics with plain text format", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await injectTestRegistryWithLyricsFormat(page, "plain");
    await page.goto("/");

    await waitForAppReady(page);

    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-plain-text.png",
    });
  });

  test("lyrics formats landscape comparison", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    // Test enhanced LRC in landscape
    await injectTestRegistryWithLyricsFormat(page, "enhanced");
    await page.goto("/");
    await waitForAppReady(page);
    await page.screenshot({
      path: "lost-pixel/lyrics-enhanced-landscape.png",
      fullPage: true,
    });

    // Test normal LRC in landscape
    await injectTestRegistryWithLyricsFormat(page, "normal");
    await page.goto("/");
    await waitForAppReady(page);
    await page.screenshot({
      path: "lost-pixel/lyrics-normal-landscape.png",
      fullPage: true,
    });

    // Test plain text in landscape
    await injectTestRegistryWithLyricsFormat(page, "plain");
    await page.goto("/");
    await waitForAppReady(page);
    await page.screenshot({
      path: "lost-pixel/lyrics-plain-landscape.png",
      fullPage: true,
    });
  });

  test("lyrics formats mobile comparison", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    // Test enhanced LRC on mobile
    await injectTestRegistryWithLyricsFormat(page, "enhanced");
    await page.goto("/");
    await waitForAppReady(page);
    await page.screenshot({
      path: "lost-pixel/lyrics-enhanced-mobile.png",
      fullPage: true,
    });

    // Test normal LRC on mobile
    await injectTestRegistryWithLyricsFormat(page, "normal");
    await page.goto("/");
    await waitForAppReady(page);
    await page.screenshot({
      path: "lost-pixel/lyrics-normal-mobile.png",
      fullPage: true,
    });

    // Test plain text on mobile
    await injectTestRegistryWithLyricsFormat(page, "plain");
    await page.goto("/");
    await waitForAppReady(page);
    await page.screenshot({
      path: "lost-pixel/lyrics-plain-mobile.png",
      fullPage: true,
    });
  });
});
