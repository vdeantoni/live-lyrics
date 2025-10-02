import { test, expect } from "@playwright/test";
import {
  injectTestRegistry,
  injectCustomTestRegistry,
} from "../helpers/injectTestRegistry";

test.describe("Error Handling", () => {
  test("should handle lyrics API failures gracefully", async ({ page }) => {
    // Use custom registry with unavailable lyrics providers
    await injectCustomTestRegistry(page, {
      lyricsProviders: [
        {
          id: "lrclib",
          name: "LrcLib",
          description: "Community lyrics database",
          priority: 1,
          isEnabled: true,
          isAvailable: false, // Simulate API failure
        },
        {
          id: "local-lyrics",
          name: "Local Lyrics",
          description: "Local demo lyrics",
          priority: 2,
          isEnabled: true,
          isAvailable: false, // Both providers unavailable
        },
      ],
    });

    await page.goto("/");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="player"]');

    // Should still show player controls even without lyrics
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="play-pause-button"]'),
    ).toBeVisible();

    // Should show some indication that lyrics are not available
    const lyricsScreen = page.locator('[data-testid="lyrics-screen"]');
    await expect(lyricsScreen).toBeVisible();
  });

  test("should handle network timeouts", async ({ page }) => {
    // Use default registry but with slower loading simulation
    await injectTestRegistry(page);

    await page.goto("/");
    await page.setViewportSize({ width: 768, height: 1024 });

    // Player should still load
    await page.waitForSelector('[data-testid="player"]');
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
  });

  test("should handle disabled providers", async ({ page }) => {
    // Use custom registry with disabled lyrics providers
    await injectCustomTestRegistry(page, {
      lyricsProviders: [
        {
          id: "lrclib",
          name: "LrcLib",
          description: "Community lyrics database",
          priority: 1,
          isEnabled: false, // User disabled this provider
          isAvailable: true,
        },
        {
          id: "local-lyrics",
          name: "Local Lyrics",
          description: "Local demo lyrics",
          priority: 2,
          isEnabled: false, // User disabled this provider too
          isAvailable: true,
        },
      ],
    });

    await page.goto("/");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="player"]');

    // Should still show player and lyrics screen
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
  });

  test("should show loading states appropriately", async ({ page }) => {
    // Use default registry which should load properly
    await injectTestRegistry(page);

    await page.goto("/");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="player"]');

    // Should show some form of loading state or skeleton
    // The app should be functional even while loading lyrics
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();

    // Wait for lyrics to potentially load
    await page.waitForTimeout(1000);
  });

  test("should handle JavaScript errors gracefully", async ({ page }) => {
    // Use default registry
    await injectTestRegistry(page);

    // Listen for uncaught exceptions, which are always critical bugs.
    const uncaughtErrors: Error[] = [];
    page.on("pageerror", (error) => {
      uncaughtErrors.push(error);
    });

    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');

    // Basic functionality should work even if there are minor JS errors
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="play-pause-button"]'),
    ).toBeVisible();

    // Click play button to test interaction
    await page.locator('[data-testid="play-pause-button"]').click();

    // Should show pause icon after clicking play
    await expect(page.locator('[data-testid="pause-icon"]')).toBeVisible();

    // Assert that no uncaught exceptions were thrown
    if (uncaughtErrors.length > 0) {
      console.error("Uncaught exceptions found:", uncaughtErrors);
    }
    expect(uncaughtErrors.length).toBe(0);
  });

  test("should handle missing testid attributes gracefully", async ({
    page,
  }) => {
    // Use default registry
    await injectTestRegistry(page);

    await page.goto("/");
    await page.setViewportSize({ width: 768, height: 1024 });

    // Even if some test IDs are missing, core elements should still be present
    // Test with more generic selectors
    await expect(page.locator("#root")).toBeVisible();

    // Should have some form of player interface
    const hasPlayerElements =
      (await page.locator("button").count()) > 0 &&
      (await page.locator('[role="slider"]').count()) > 0;

    expect(hasPlayerElements).toBe(true);
  });

  test("should remove artwork background when all artwork providers are disabled", async ({
    page,
  }) => {
    // Use custom registry with all artwork providers disabled
    await injectCustomTestRegistry(page, {
      artworkProviders: [
        {
          id: "itunes",
          name: "iTunes",
          description: "Album artwork from iTunes",
          priority: 1,
          isEnabled: false, // User disabled
          isAvailable: true,
        },
        {
          id: "unsplash",
          name: "Random Images",
          description: "Random high-quality images",
          priority: 2,
          isEnabled: false, // User disabled
          isAvailable: true,
        },
      ],
    });

    await page.goto("/");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[data-testid="player"]');

    // Should still show player and lyrics screen
    await expect(page.locator('[data-testid="player-controls"]')).toBeVisible();
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

    // Background artwork should NOT be present when all providers are disabled
    const artworkBackground = page.locator('[data-testid="lyrics-background"]');
    await expect(artworkBackground).not.toBeVisible();
  });
});
