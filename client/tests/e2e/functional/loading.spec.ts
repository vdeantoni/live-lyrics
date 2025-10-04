import { expect, test } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";

test.describe("Loading Screen", () => {
  test.beforeEach(async ({ page }) => {
    // Inject test registry for consistent provider data
    await injectTestRegistry(page);
  });

  test("should show loading screen during delayed bootstrap", async ({
    page,
  }) => {
    // Mock setTimeout to delay bootstrap (line 33 in useBootstrap.ts)
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = ((
        callback: () => void,
        delay: number,
        ...args: unknown[]
      ) => {
        // Bootstrap uses setTimeout(..., 0), add 3s delay
        if (delay === 0 && typeof callback === "function") {
          return originalSetTimeout(callback, 3000, ...args);
        }
        return originalSetTimeout(callback, delay, ...args);
      }) as typeof setTimeout;
    });

    await page.goto("/");

    // Loading screen should be visible (appState.isLoading && !appState.isReady)
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible();

    // Verify core content
    await expect(page.locator("text=Live Lyrics")).toBeVisible();
    await expect(
      page.locator("text=Preparing your music experience..."),
    ).toBeVisible();

    // Verify vinyl record (uses bg-gradient-to-br class from line 93)
    const vinylRecord = page.locator(
      '[data-testid="loading-screen"] .bg-gradient-to-br',
    );
    await expect(vinylRecord.first()).toBeVisible();

    // Player controls remain visible during loading
    await expect(page.locator('[data-testid="player"]')).toBeVisible();
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();

    // Wait for bootstrap to complete (isReady = true triggers 0.5s fade-out)
    await expect(
      page.locator('[data-testid="loading-screen"]'),
    ).not.toBeVisible({ timeout: 10000 });

    // Lyrics screen should be visible after transition
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

    // Song data should be loaded
    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
    await expect(page.locator('[data-testid="artist-name"]')).toContainText(
      "Queen",
    );
  });

  test("should skip loading screen when bootstrap completes quickly", async ({
    page,
  }) => {
    // No mocking - normal fast bootstrap (setTimeout 0ms resolves immediately)
    await page.goto("/");

    // Loading screen may flash briefly, but lyrics should appear quickly
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible({
      timeout: 2000,
    });

    // Verify app is fully loaded
    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
    await expect(page.locator('[data-testid="artist-name"]')).toContainText(
      "Queen",
    );

    // Loading screen should be gone
    await expect(
      page.locator('[data-testid="loading-screen"]'),
    ).not.toBeVisible();
  });
});

//
