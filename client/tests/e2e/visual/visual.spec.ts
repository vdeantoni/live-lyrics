import { test, Page } from "@playwright/test";

// Utility function to wait for background image to load or timeout gracefully
const waitForBackgroundImage = async (page: Page, timeout: number = 5000) => {
  try {
    await page.waitForFunction(
      () => {
        const backgroundElement = document.querySelector(
          '[data-testid="lyrics-background"]',
        );
        if (!backgroundElement) return false;

        const computedStyle = window.getComputedStyle(backgroundElement);
        const backgroundImage = computedStyle.backgroundImage;

        // If no background image is set, consider it "loaded" (graceful fallback)
        if (!backgroundImage || backgroundImage === "none") return true;

        const urlMatch = backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
        if (!urlMatch) return true; // No valid URL, consider loaded

        // Only wait for actual image loading if we have a valid URL
        const img = new Image();
        img.src = urlMatch[1];
        return img.complete && img.naturalWidth > 0;
      },
      { timeout },
    );
  } catch {
    // Timeout is OK - background might not load due to CORS or network issues
    // Visual tests should still proceed for layout/UI testing
    console.log("Background image loading timed out, proceeding with test...");
  }
};

// Utility function to wait for lyrics to load (no more loading state)
const waitForLyricsToLoad = async (page: Page, timeout: number = 5000) => {
  try {
    // Wait for the lyrics loading state to disappear
    await page.waitForSelector('[data-testid="lyrics-loading"]', {
      state: "detached",
      timeout,
    });
  } catch {
    console.log("Lyrics loading timed out, proceeding with test...");
  }
};

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

    // Mock iTunes artwork API to prevent CORS issues
    await page.route("**/itunes.apple.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              artworkUrl100:
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // 1x1 transparent PNG
              artworkUrl600:
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
            },
          ],
        }),
      });
    });
  });

  test("homepage portrait mode", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    // Wait for background image and lyrics to load completely
    await waitForBackgroundImage(page);
    await waitForLyricsToLoad(page);

    // Generate screenshot for Lost Pixel
    await page.screenshot({
      path: "lost-pixel/homepage-portrait.png",
      fullPage: true,
    });
  });

  test("homepage landscape mode", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    // Wait for background image and lyrics to load completely
    await waitForBackgroundImage(page);
    await waitForLyricsToLoad(page);

    // Generate screenshot for Lost Pixel
    await page.screenshot({
      path: "lost-pixel/homepage-landscape.png",
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
      path: "lost-pixel/player-paused.png",
    });

    // Click play and set slider to 50% for playing state
    await page.click('[data-testid="play-pause-button"]');

    // Set progress slider to 50%
    const slider = page.locator('[data-testid="progress-slider"]');
    const sliderBounds = await slider.boundingBox();
    if (sliderBounds) {
      // Click at 50% position of the slider
      await page.mouse.click(
        sliderBounds.x + sliderBounds.width * 0.5,
        sliderBounds.y + sliderBounds.height / 2,
      );
    }

    await page.waitForTimeout(500); // Let UI update
    await page.locator('[data-testid="player"]').screenshot({
      path: "lost-pixel/player-playing.png",
    });
  });

  test("lyrics display component", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="lyrics-screen"]');

    // Wait for background image and lyrics to load completely
    await waitForBackgroundImage(page);
    await waitForLyricsToLoad(page);

    // Screenshot just the lyrics display area
    await page.locator('[data-testid="lyrics-screen"]').screenshot({
      path: "lost-pixel/lyrics-display.png",
    });
  });

  test("settings screen visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

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
    await page.waitForSelector('[data-testid="player"]');

    // Wait for background image and lyrics to load completely
    await waitForBackgroundImage(page);
    await waitForLyricsToLoad(page);

    // Full page screenshot for mobile
    await page.screenshot({
      path: "lost-pixel/mobile-homepage.png",
      fullPage: true,
    });
  });

  test("tablet landscape visual", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // iPad Landscape
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    // Wait for background image and lyrics to load completely
    await waitForBackgroundImage(page);
    await waitForLyricsToLoad(page);

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

    // Wait for background image and lyrics to load completely first
    await waitForBackgroundImage(page);
    await waitForLyricsToLoad(page);

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
