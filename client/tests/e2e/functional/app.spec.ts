import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import {
  loadTestSong,
  setupPlayerWithSong,
} from "../helpers/testPlayerHelpers";

test.describe("Application Layout and Responsiveness", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
    await page.goto("/");
  });

  test.describe("Initial Load States", () => {
    test("should display empty state when no song is loaded", async ({
      page,
    }) => {
      await page.waitForSelector('[data-testid="player"]');

      // Should show empty screen, not lyrics screen
      await expect(page.locator('[data-testid="empty-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="lyrics-screen"]'),
      ).not.toBeVisible();

      // Play button should be disabled when no song
      const playButton = page.locator('[data-testid="play-pause-button"]');
      await expect(playButton).toBeDisabled();
    });

    test("should display lyrics screen when song is loaded", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Should show lyrics screen, not empty screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="empty-screen"]'),
      ).not.toBeVisible();

      // Song information should be visible
      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );

      // Play button should be enabled
      const playButton = page.locator('[data-testid="play-pause-button"]');
      await expect(playButton).toBeEnabled();
    });
  });

  test.describe("Portrait Layout (Mobile)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should display all main components in portrait", async ({ page }) => {
      await loadTestSong(page);

      await expect(page.locator('[data-testid="player"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });

    test("should not have horizontal scroll", async ({ page }) => {
      await page.waitForSelector('[data-testid="player"]');

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });

  test.describe("Landscape Layout (Desktop/Tablet)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
    });

    test("should display all main components in landscape", async ({
      page,
    }) => {
      await loadTestSong(page);

      await expect(page.locator('[data-testid="player"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });

    test("should not have horizontal scroll", async ({ page }) => {
      await page.waitForSelector('[data-testid="player"]');

      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });
  });

  test.describe("Responsive Behavior", () => {
    test("should handle orientation changes smoothly", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="player"]');

      await expect(page.locator('[data-testid="player"]')).toBeVisible();

      // Rotate to landscape
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(page.locator('[data-testid="player"]')).toBeVisible();

      // Rotate back to portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="player"]')).toBeVisible();
    });

    test("should handle various screen sizes without horizontal scroll", async ({
      page,
    }) => {
      const viewports = [
        { width: 320, height: 568, name: "iPhone SE" },
        { width: 768, height: 1024, name: "iPad Portrait" },
        { width: 1024, height: 768, name: "iPad Landscape" },
        { width: 1440, height: 900, name: "Desktop" },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Player should be visible
        await expect(page.locator('[data-testid="player"]')).toBeVisible();

        // Should not have horizontal scroll
        const scrollWidth = await page.evaluate(
          () => document.body.scrollWidth,
        );
        const clientWidth = await page.evaluate(
          () => document.body.clientWidth,
        );
        expect(
          scrollWidth,
          `Horizontal scroll detected on ${viewport.name}`,
        ).toBeLessThanOrEqual(clientWidth + 10);
      }
    });
  });
});
