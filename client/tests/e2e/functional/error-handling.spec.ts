import { test, expect } from "@playwright/test";
import {
  injectTestRegistry,
  injectCustomTestRegistry,
} from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

test.describe("Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
    await page.goto("/");
  });

  test.describe("Provider Failures", () => {
    test("should display lyrics screen when all lyrics providers fail", async ({
      page,
    }) => {
      // Override with unavailable lyrics providers
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
      await setupPlayerWithSong(page);

      // Player should still function
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="play-pause-button"]'),
      ).toBeEnabled();

      // Lyrics screen should still display (with "no lyrics" state)
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });

    test("should function when all lyrics providers are disabled", async ({
      page,
    }) => {
      // Override with disabled lyrics providers
      await injectCustomTestRegistry(page, {
        lyricsProviders: [
          {
            id: "lrclib",
            name: "LrcLib",
            description: "Community lyrics database",
            priority: 1,
            isEnabled: false, // User disabled
            isAvailable: true,
          },
          {
            id: "local-lyrics",
            name: "Local Lyrics",
            description: "Local demo lyrics",
            priority: 2,
            isEnabled: false, // User disabled
            isAvailable: true,
          },
        ],
      });

      await page.goto("/");
      await setupPlayerWithSong(page);

      // Should still show player and lyrics screen
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });

    test("should hide artwork background when all artwork providers are disabled", async ({
      page,
    }) => {
      // Override with disabled artwork providers
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
        ],
      });

      await page.goto("/");
      await setupPlayerWithSong(page);

      // Should still show lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

      // Background artwork should not be visible when all providers disabled
      const artworkBackground = page.locator(
        '[data-testid="lyrics-background"]',
      );
      const isVisible = await artworkBackground.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });
  });

  test.describe("Application Stability", () => {
    test("should not throw uncaught JavaScript errors during normal usage", async ({
      page,
    }) => {
      const uncaughtErrors: Error[] = [];
      page.on("pageerror", (error) => {
        uncaughtErrors.push(error);
      });

      await setupPlayerWithSong(page);

      // Basic interactions should not cause errors
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();

      // Toggle play/pause
      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();
      await expect(page.locator('[data-testid="pause-icon"]')).toBeVisible();

      await playButton.click();
      await expect(page.locator('[data-testid="play-icon"]')).toBeVisible();

      // Open and close settings
      await page.keyboard.press("c");
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

      // Assert no errors occurred
      if (uncaughtErrors.length > 0) {
        console.error("Uncaught exceptions found:", uncaughtErrors);
      }
      expect(uncaughtErrors.length).toBe(0);
    });

    test("should handle rapid state changes without errors", async ({
      page,
    }) => {
      const uncaughtErrors: Error[] = [];
      page.on("pageerror", (error) => {
        uncaughtErrors.push(error);
      });

      await setupPlayerWithSong(page);

      const playButton = page.locator('[data-testid="play-pause-button"]');

      // Rapidly toggle play/pause
      for (let i = 0; i < 5; i++) {
        await playButton.click();
        await page.waitForTimeout(100);
      }

      // Rapidly open/close overlays
      await page.keyboard.press("c"); // Settings
      await page.waitForTimeout(50);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(50);
      await page.keyboard.press("s"); // Search
      await page.waitForTimeout(50);
      await page.keyboard.press("Escape");

      // Assert no errors occurred during rapid interactions
      expect(uncaughtErrors.length).toBe(0);
    });
  });
});
