import { expect, test } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

test.describe("Loading Screen", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
  });

  test("should display loading screen during delayed bootstrap", async ({
    page,
  }) => {
    // Mock setTimeout to delay bootstrap completion
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = ((
        callback: () => void,
        delay: number,
        ...args: unknown[]
      ) => {
        // Bootstrap uses setTimeout(..., 0), add 2s delay
        if (delay === 0 && typeof callback === "function") {
          return originalSetTimeout(callback, 2000, ...args);
        }
        return originalSetTimeout(callback, delay, ...args);
      }) as typeof setTimeout;
    });

    await page.goto("/");

    // Loading screen should be visible while bootstrap is in progress
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible();

    // Verify loading screen content
    await expect(page.locator("text=Live Lyrics")).toBeVisible();
    await expect(
      page.locator("text=Preparing your music experience..."),
    ).toBeVisible();

    // Verify animated elements are present
    const vinylRecord = page.locator(
      '[data-testid="loading-screen"] .bg-gradient-to-br',
    );
    await expect(vinylRecord.first()).toBeVisible();

    // Player controls should be visible even during loading
    await expect(page.locator('[data-testid="player"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();

    // Wait for bootstrap to complete and loading screen to fade out
    await expect(
      page.locator('[data-testid="loading-screen"]'),
    ).not.toBeVisible({ timeout: 5000 });

    // After bootstrap, empty screen should be visible (no song loaded)
    await expect(page.locator('[data-testid="empty-screen"]')).toBeVisible();
  });

  test("should transition to lyrics screen when song is loaded after bootstrap", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for bootstrap to complete
    await page.waitForSelector('[data-testid="player"]');

    // Initially should show empty state
    await expect(page.locator('[data-testid="empty-screen"]')).toBeVisible();

    // Load a song
    await setupPlayerWithSong(page);

    // Should transition to lyrics screen with song data
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
    await expect(page.locator('[data-testid="artist-name"]')).toContainText(
      "Queen",
    );
  });

  test("should complete bootstrap quickly without noticeable loading screen", async ({
    page,
  }) => {
    // No setTimeout mocking - fast bootstrap path
    await page.goto("/");

    // App should become interactive quickly
    await expect(page.locator('[data-testid="player"]')).toBeVisible({
      timeout: 2000,
    });

    // Should show empty state (no song loaded)
    await expect(page.locator('[data-testid="empty-screen"]')).toBeVisible();

    // Loading screen should be gone (wait for fade-out animation)
    await expect(
      page.locator('[data-testid="loading-screen"]'),
    ).not.toBeVisible();
  });
});
