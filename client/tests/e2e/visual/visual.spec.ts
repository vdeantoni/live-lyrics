import { test, Page } from "@playwright/test";

// Utility function to wait for background image to load or timeout gracefully
const waitForBackgroundImage = async (page: Page, timeout: number = 10000) => {
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

        // Since we now preload images in LyricsScreen, check if the URL is set
        // and has had time to complete its CSS transition
        const url = urlMatch[1];
        if (url && url !== "") {
          // Check if image is loaded by creating a test image
          const img = new Image();
          img.src = url;
          return img.complete && img.naturalWidth > 0;
        }

        return false;
      },
      { timeout },
    );

    // Additional wait for CSS transition to complete (1000ms duration)
    await page.waitForTimeout(1200);
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
    await page.route("**/lrclib.net/api/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.includes("search")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 52373,
              name: "Bohemian Rhapsody",
              artistName: "Queen",
              albumName: "A Night at the Opera",
              duration: 355,
              instrumental: false,
              syncedLyrics:
                "[00:00.00] Is this the real life?\n[00:15.00] Is this just fantasy?\n[00:30.00] Caught in a landslide\n[00:45.00] No escape from reality\n[01:00.00] Open your eyes\n[01:15.00] Look up to the skies and see\n[01:30.00] I'm just a poor boy, I need no sympathy\n[01:45.00] Because I'm easy come, easy go\n[02:00.00] Little high, little low\n[02:15.00] Any way the wind blows, doesn't really matter to me\n[02:30.00] To me",
            },
          ]),
        });
      }
    });

    // Still mock iTunes artwork API to prevent CORS issues in visual tests
    await page.route("**/itunes.apple.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [], // No artwork results for stable visual tests
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

  test("loading screen visual", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Mock bootstrap delay to capture loading screen
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
    await page.waitForSelector('[data-testid="loading-screen"]', {
      timeout: 2000,
    });

    // Wait a moment for animations to stabilize
    await page.waitForTimeout(1000);

    // Screenshot the loading screen component
    await page.locator('[data-testid="loading-screen"]').screenshot({
      path: "lost-pixel/loading-screen.png",
    });

    // Also capture full page with loading screen visible
    await page.screenshot({
      path: "lost-pixel/loading-screen-fullpage.png",
      fullPage: true,
    });
  });

  test("loading screen mobile visual", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE

    // Mock bootstrap delay
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = (
        callback: () => void,
        delay: number,
        ...args: unknown[]
      ) => {
        if (delay === 0 && typeof callback === "function") {
          return originalSetTimeout(callback, 2500, ...args);
        }
        return originalSetTimeout(callback, delay, ...args);
      };
    });

    await page.goto("/");

    // Wait for loading screen on mobile
    await page.waitForSelector('[data-testid="loading-screen"]', {
      timeout: 2000,
    });
    await page.waitForTimeout(800);

    // Screenshot mobile loading screen
    await page.screenshot({
      path: "lost-pixel/loading-screen-mobile.png",
      fullPage: true,
    });
  });
});
