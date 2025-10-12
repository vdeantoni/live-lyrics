import { expect, test, type Page } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

// Helper to delay bootstrap for testing loading screen
const delayBootstrap = async (page: Page, delayMs: number) => {
  await page.addInitScript((delay) => {
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = ((
      callback: () => void,
      ms: number,
      ...args: unknown[]
    ) => {
      // Bootstrap uses setTimeout(..., 0) - add delay
      if (ms === 0 && typeof callback === "function") {
        return originalSetTimeout(callback, delay, ...args);
      }
      return originalSetTimeout(callback, ms, ...args);
    }) as typeof setTimeout;
  }, delayMs);
};

test.describe("Loading Screen", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
  });

  test("should show loading screen during delayed bootstrap", async ({
    page,
  }) => {
    await delayBootstrap(page, 2000);
    await page.goto("/");

    // Loading screen should be visible with expected content
    const loadingScreen = page.locator('[data-testid="loading-screen"]');
    await expect(loadingScreen).toBeVisible();
    await expect(loadingScreen).toContainText("Live Lyrics");
    await expect(loadingScreen).toContainText(
      "Preparing your music experience...",
    );

    // Wait for bootstrap to complete
    await expect(loadingScreen).not.toBeVisible();

    // Should show empty state after bootstrap
    await expect(page.locator('[data-testid="empty-screen"]')).toBeVisible();
  });

  test("should transition from empty state to lyrics when song loads", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for app to be ready and showing empty state
    await expect(page.locator('[data-testid="empty-screen"]')).toBeVisible();

    // Load a song
    await setupPlayerWithSong(page);

    // Should show lyrics screen with song info
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
    await expect(page.locator('[data-testid="artist-name"]')).toContainText(
      "Queen",
    );
  });
});
