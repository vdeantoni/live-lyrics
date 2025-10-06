import { test, expect } from "@playwright/test";
import {
  injectTestRegistry,
  injectCustomTestRegistry,
} from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

test.describe("Lyrics Display", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
    await page.goto("/");
  });

  test.describe("Lyrics Content", () => {
    test("should display synchronized lyrics with correct content", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Wait for lyrics container and lines to load
      await expect(
        page.locator('[data-testid="lyrics-container"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="lyrics-line"]').first(),
      ).toBeVisible();

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();

      // Test data contains multiple lines
      expect(lineCount).toBeGreaterThanOrEqual(4);
      await expect(lyricsLines.first()).toContainText("Is this the real life?");
    });

    test("should highlight current line at specific playback time", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Wait for lyrics to render
      await expect(
        page.locator('[data-testid="lyrics-line"]').first(),
      ).toBeVisible();

      // Seek to 20 seconds using keyboard shortcuts
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("ArrowRight"); // 4 * 5s = 20s
        await page.waitForTimeout(200); // Wait for seek to process
      }

      // Wait for highlighted line to appear
      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();

      // Verify line has content (highlighting is working)
      const lineText = await currentLine.textContent();
      expect(lineText?.trim().length).toBeGreaterThan(0);
    });

    test("should display word-level highlighting for active line", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Wait for lyrics
      await expect(
        page.locator('[data-testid="lyrics-line"]').first(),
      ).toBeVisible();

      // Seek to 10 seconds
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");

      // Wait for current line
      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();

      // Check that active line contains word-level spans
      const words = currentLine.locator("span[data-word-index]");
      const wordCount = await words.count();
      expect(wordCount).toBeGreaterThan(0);
    });

    test("should auto-scroll to keep current line in viewport", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Wait for lyrics
      await expect(
        page.locator('[data-testid="lyrics-line"]').first(),
      ).toBeVisible();

      // Seek forward significantly to trigger scroll
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("ArrowRight"); // 6 * 5s = 30s
      }

      // Wait for current line to update
      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();

      // Current line should be in viewport (auto-scrolled)
      await expect(currentLine).toBeInViewport();
    });

    test("should allow clicking on words to seek to that timestamp", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Wait for lyrics
      await expect(
        page.locator('[data-testid="lyrics-line"]').first(),
      ).toBeVisible();

      // Seek forward a bit first
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");

      // Get current line and click a word
      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();

      const firstWord = currentLine.locator("span[data-word-index]").first();
      const initialTime = await page
        .locator('[data-testid="current-time"]')
        .textContent();

      // Click the word
      await firstWord.click();

      // Time should update after click (seek happened)
      const newTime = await page
        .locator('[data-testid="current-time"]')
        .textContent();
      expect(newTime).not.toBe(initialTime);
    });
  });

  test.describe("Responsive Layout", () => {
    test("should display lyrics in landscape orientation", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await setupPlayerWithSong(page);

      // Lyrics container and lines should be visible
      await expect(
        page.locator('[data-testid="lyrics-container"]'),
      ).toBeVisible();
      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      await expect(lyricsLines.first()).toBeVisible();
      await expect(lyricsLines.first()).toContainText("Is this the real life?");

      const lineCount = await lyricsLines.count();
      expect(lineCount).toBeGreaterThanOrEqual(4);
    });

    test("should maintain lyrics when switching orientations", async ({
      page,
    }) => {
      // Start in portrait
      await setupPlayerWithSong(page);

      // Verify lyrics visible
      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      await expect(lyricsLines.first()).toBeVisible();
      const initialCount = await lyricsLines.count();

      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 });

      // Lyrics should still be visible with same content
      await expect(lyricsLines.first()).toBeVisible();
      const newCount = await lyricsLines.count();
      expect(newCount).toBe(initialCount);
    });
  });

  test.describe("Background Artwork", () => {
    test("should display background artwork when available", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Lyrics screen should be visible
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

      // Background should eventually appear (after image loads)
      await expect(
        page.locator('[data-testid="lyrics-background"]'),
      ).toBeVisible({
        timeout: 5000,
      });

      // Background should have background-image style
      const background = page.locator('[data-testid="lyrics-background"]');
      const bgStyle = await background.getAttribute("style");
      expect(bgStyle).toContain("background-image");
    });

    test("should hide background when all artwork providers disabled", async ({
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
            isEnabled: false, // Disabled
            isAvailable: true,
          },
        ],
      });

      await page.goto("/");
      await setupPlayerWithSong(page);

      // Lyrics screen should be visible
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

      // Background should not be visible
      await expect(
        page.locator('[data-testid="lyrics-background"]'),
      ).not.toBeVisible();
    });
  });

  test.describe("Error States", () => {
    test("should display 'No Lyrics Found' when no providers available", async ({
      page,
    }) => {
      // Override with empty lyrics providers
      await injectCustomTestRegistry(page, {
        lyricsProviders: [], // No lyrics providers
        artworkProviders: [
          {
            id: "itunes",
            name: "iTunes",
            description: "Album artwork from iTunes",
            priority: 1,
            isEnabled: true,
            isAvailable: true,
          },
        ],
        players: [
          {
            id: "local",
            name: "Local",
            description: "Local player",
            priority: 1,
            isEnabled: true,
            isAvailable: true,
          },
        ],
      });

      await page.goto("/");
      await setupPlayerWithSong(page);

      // Should show "No Lyrics Found" state
      await expect(page.locator('[data-testid="no-lyrics"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText("No Lyrics Found")).toBeVisible();

      // Should show song information in the message
      const noLyricsText = await page
        .locator('[data-testid="no-lyrics"]')
        .textContent();
      expect(noLyricsText).toContain("Bohemian Rhapsody");
      expect(noLyricsText).toContain("Queen");

      // Player should still function
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
    });
  });
});
