import { test, expect } from "@playwright/test";
import {
  injectTestRegistry,
  injectCustomTestRegistry,
} from "../helpers/injectTestRegistry";

test.describe("Lyrics Display", () => {
  test.beforeEach(async ({ page }) => {
    // Inject consistent test registry for all tests
    await injectTestRegistry(page);
    await page.goto("/");

    // Wait for the app to be ready with more robust checks
    await page.waitForSelector('[data-testid="lyrics-screen"]');

    // Ensure song information is loaded before proceeding
    await page.waitForFunction(() => {
      const songName = document.querySelector('[data-testid="song-name"]');
      return songName && songName.textContent?.includes("Bohemian Rhapsody");
    });

    // Also wait for the providers to be set up (check for lack of error state)
    await page.waitForFunction(() => {
      const lyricsContainer = document.querySelector(
        '[data-testid="lyrics-container"]',
      );
      return lyricsContainer;
    });
  });

  test.describe("Portrait Mode - Lyrics", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should display synchronized lyrics", async ({ page }) => {
      // First wait for lyrics loading to start (ensures provider system is working)
      await page.waitForSelector('[data-testid="lyrics-container"]');

      // Wait for lyrics to finish loading (no more "Loading lyrics..." text)
      await page.waitForFunction(() => {
        const lyricsContainer = document.querySelector(
          '[data-testid="lyrics-container"]',
        );
        return (
          lyricsContainer &&
          !lyricsContainer.textContent?.includes("Loading lyrics")
        );
      });

      // Now wait for actual lyrics lines to be populated
      await page.waitForSelector('[data-testid="lyrics-line"]');

      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      const lineCount = await lyricsLines.count();

      // Our mock provider returns 11 lines of Bohemian Rhapsody
      expect(lineCount).toBeGreaterThanOrEqual(4); // At least the basic lines from our test data
      await expect(lyricsLines.first()).toContainText("Is this the real life?");
    });

    test("should highlight current lyrics line when playing", async ({
      page,
    }) => {
      // Wait for lyrics container and loading to complete
      await page.waitForSelector('[data-testid="lyrics-container"]');
      await page.waitForFunction(() => {
        const lyricsContainer = document.querySelector(
          '[data-testid="lyrics-container"]',
        );
        return (
          lyricsContainer &&
          !lyricsContainer.textContent?.includes("Loading lyrics")
        );
      });

      await page.waitForSelector('[data-testid="lyrics-line"]');

      // Wait for playerControlAPI to be available
      await page.waitForFunction(() => {
        return !!(window as Window & { playerControlAPI?: unknown })
          .playerControlAPI;
      });

      // Seek to the last line timestamp (150 seconds = 2:30)
      // This should immediately trigger lyrics highlighting
      await page.evaluate(async () => {
        const seekTime = 150; // Last line: "To me" at [02:30.00]

        // Get the player control API and seek to the timestamp
        const playerControlAPI = (
          window as Window & { playerControlAPI?: unknown }
        ).playerControlAPI;
        if (playerControlAPI && playerControlAPI.seek) {
          await playerControlAPI.seek(seekTime);
        }
      });

      // Wait for the player state to actually update in the UI
      await page.waitForFunction(() => {
        const timeDisplay = document.querySelector(
          '[data-testid="current-time"]',
        );
        return timeDisplay && !timeDisplay.textContent?.includes("0:00");
      });

      // Wait for lyrics highlighting to update after seek
      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();

      // Last line should be highlighted since we seeked to its timestamp
      await expect(currentLine).toContainText("To me");
    });

    test("should maintain lyrics visibility and scroll", async ({ page }) => {
      await page.waitForSelector('[data-testid="lyrics-container"]');

      const lyricsContainer = page.locator('[data-testid="lyrics-container"]');
      await expect(lyricsContainer).toBeVisible();

      // Check that lyrics are scrollable
      const containerHeight = await lyricsContainer.evaluate(
        (el) => el.scrollHeight,
      );
      expect(containerHeight).toBeGreaterThan(0);

      // Wait for playerControlAPI to be available
      await page.waitForFunction(() => {
        return !!(window as Window & { playerControlAPI?: unknown })
          .playerControlAPI;
      });

      // Seek to a known timestamp to test auto-scroll
      await page.evaluate(async () => {
        const seekTime = 150; // Last line: "To me" at [02:30.00]
        const playerControlAPI = (
          window as Window & { playerControlAPI?: unknown }
        ).playerControlAPI;
        if (playerControlAPI && playerControlAPI.seek) {
          await playerControlAPI.seek(seekTime);
        }
      });

      // Wait for the player state to actually update in the UI
      await page.waitForFunction(() => {
        const timeDisplay = document.querySelector(
          '[data-testid="current-time"]',
        );
        return timeDisplay && !timeDisplay.textContent?.includes("0:00");
      });

      // Wait for current line to appear
      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );

      // Current line should be visible in viewport
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
      expect(lineCount).toBeGreaterThanOrEqual(4);

      // Verify first line content
      await expect(lyricsLines.first()).toContainText("Is this the real life?");
    });

    test("should maintain lyrics synchronization in landscape", async ({
      page,
    }) => {
      await page.waitForSelector('[data-testid="lyrics-line"]');

      // Wait for playerControlAPI to be available
      await page.waitForFunction(() => {
        return !!(window as Window & { playerControlAPI?: unknown })
          .playerControlAPI;
      });

      // Seek to a known timestamp to test lyrics synchronization
      await page.evaluate(async () => {
        const seekTime = 150; // Last line: "To me" at [02:30.00]
        const playerControlAPI = (
          window as Window & { playerControlAPI?: unknown }
        ).playerControlAPI;
        if (playerControlAPI && playerControlAPI.seek) {
          await playerControlAPI.seek(seekTime);
        }
      });

      // Wait for the player state to actually update in the UI
      await page.waitForFunction(() => {
        const timeDisplay = document.querySelector(
          '[data-testid="current-time"]',
        );
        return timeDisplay && !timeDisplay.textContent?.includes("0:00");
      });

      await page.waitForSelector(
        '[data-testid="lyrics-line"][data-current="true"]',
      );

      const currentLine = page.locator(
        '[data-testid="lyrics-line"][data-current="true"]',
      );
      await expect(currentLine).toBeVisible();
      await expect(currentLine).toContainText("To me");
    });
  });

  test.describe("Visual Effects", () => {
    test("should handle responsive design transitions", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForSelector('[data-testid="lyrics-screen"]');

      // Verify lyrics are visible in portrait
      await page.waitForSelector('[data-testid="lyrics-line"]');
      const portraitLines = page.locator('[data-testid="lyrics-line"]');
      await expect(portraitLines.first()).toBeVisible();

      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 });

      // Wait for layout to adjust
      await page.waitForTimeout(500);

      const lyricsDisplay = page.locator('[data-testid="lyrics-screen"]');
      await expect(lyricsDisplay).toBeVisible();

      // Verify lyrics are still visible after resize
      await expect(portraitLines.first()).toBeVisible();

      const lineCount = await portraitLines.count();
      expect(lineCount).toBeGreaterThanOrEqual(4);
    });
  });
});

// Separate top-level describe block to avoid parent beforeEach interference
test.describe("Lyrics Display - No Lyrics State", () => {
  test("should handle no lyrics state gracefully", async ({ page }) => {
    // Inject custom registry BEFORE navigation
    await injectCustomTestRegistry(page, {
      lyricsProviders: [], // No lyrics providers = no lyrics available
      artworkProviders: [
        {
          id: "itunes",
          name: "Test iTunes",
          description: "Test artwork provider (no artwork)",
          isEnabled: true,
          isAvailable: true,
        },
      ],
      players: [
        {
          id: "local",
          name: "Local",
          description: "Local test player",
          isEnabled: true,
          isAvailable: true,
        },
      ],
    });

    await page.goto("/");
    await page.setViewportSize({ width: 768, height: 1024 });

    // Wait for the app to be ready
    await page.waitForSelector('[data-testid="lyrics-screen"]');

    // Wait for song information to load
    await page.waitForFunction(() => {
      const songName = document.querySelector('[data-testid="song-name"]');
      return songName && songName.textContent?.includes("Bohemian Rhapsody");
    });

    // Wait for lyrics system to process and show no-lyrics state
    await page.waitForSelector('[data-testid="no-lyrics"]', {
      timeout: 10000,
    });
    await expect(page.getByText("No Lyrics Found")).toBeVisible();

    // Player should still be visible and functional
    await expect(page.locator('[data-testid="player"]')).toBeVisible();
    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
  });
});
