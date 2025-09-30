import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";

test.describe("Lyrics Display", () => {
  test.beforeEach(async ({ page }) => {
    // Inject test registry instead of mocking HTTP requests
    await injectTestRegistry(page);

    await page.goto("/");

    // Wait for the simulated player to start and lyrics to load
    await page.waitForSelector('[data-testid="lyrics-screen"]');

    // Wait for the player to be initialized and playing
    await page.waitForFunction(() => {
      const songName = document.querySelector('[data-testid="song-name"]');
      return songName && songName.textContent?.includes("Bohemian Rhapsody");
    });

    await page.waitForTimeout(1000);
  });

  test.describe("Portrait Mode - Lyrics", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should display synchronized lyrics", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-line"]');

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();

      expect(lineCount).toBeGreaterThan(10);
      await expect(lyricsLines.first()).toContainText("Is this the real life?");
    });

    test("should highlight current lyrics line", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-line"]');

      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();

      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();
      await expect(currentLine).toContainText("Is this the real life?");
    });

    test("should scroll to current lyrics line", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-container"]');

      const lyricsContainer = page.locator('[data-testid="lyrics-container"]');
      await expect(lyricsContainer).toBeVisible();

      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();

      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeInViewport();
    });
  });

  test.describe("Landscape Mode - Lyrics", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
    });

    test("should display lyrics in landscape layout", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-line"]');

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();
      expect(lineCount).toBeGreaterThan(10);
    });

    test("should maintain lyrics synchronization in landscape", async ({
      page,
    }) => {
      await page.waitForSelector('[data-testid="lyrics-line"]');

      const playButton = page.locator('[data-testid="play-pause-button"]');
      await playButton.click();

      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();
      await expect(currentLine).toContainText("Is this the real life?");
    });
  });

  test.describe("Visual Effects", () => {
    test("should show background effects with album artwork", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const background = page.locator('[data-testid="lyrics-background"]');
      await expect(background).toBeVisible();
    });

    test("should handle responsive design transitions", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="lyrics-screen"]');

      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 });

      const lyricsDisplay = page.locator('[data-testid="lyrics-screen"]');
      await expect(lyricsDisplay).toBeVisible();

      // Wait for lyrics to be visible after resize
      await expect(
        page.locator('[data-testid="lyrics-line"]').first(),
      ).toBeVisible();

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();
      expect(lineCount).toBeGreaterThan(10);
    });
  });
});
