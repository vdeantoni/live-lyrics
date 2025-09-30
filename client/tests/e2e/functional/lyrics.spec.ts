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
      // Override test registry to provide artwork data
      await page.addInitScript(() => {
        // Create a custom test registry with artwork
        const testRegistry = new Map();

        // Helper to create mock lyrics provider
        const createMockLyricsProvider = (
          providerId: string,
          providerName: string,
        ) => ({
          getId: () => providerId,
          getName: () => providerName,
          isAvailable: () => Promise.resolve(true),
          getLyrics: async (song: { name: string; artist: string }) => {
            if (
              song.name.toLowerCase().includes("bohemian rhapsody") &&
              song.artist.toLowerCase().includes("queen")
            ) {
              return {
                syncType: "LINE_SYNCED",
                lines: [
                  { startTimeMs: 0, words: "Is this the real life?" },
                  { startTimeMs: 15000, words: "Is this just fantasy?" },
                  { startTimeMs: 30000, words: "Caught in a landslide" },
                  { startTimeMs: 45000, words: "No escape from reality" },
                ],
              };
            }
            return null;
          },
        });

        // Helper to create mock artwork provider that returns URLs
        const createMockArtworkProvider = (
          providerId: string,
          providerName: string,
        ) => ({
          getId: () => providerId,
          getName: () => providerName,
          isAvailable: () => Promise.resolve(true),
          getArtwork: async () => {
            // Return a valid data URL image that can be loaded
            return [
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiPjYwMHg2MDA8L3RleHQ+PC9zdmc+",
            ];
          },
        });

        // Add lyrics provider
        testRegistry.set("lrclib", {
          config: {
            id: "lrclib",
            name: "LrcLib",
            description: "Community lyrics database",
            type: "lyrics",
            load: async () => createMockLyricsProvider("lrclib", "LrcLib"),
          },
          status: {
            isAvailable: true,
            isLoading: false,
            lastChecked: new Date(),
          },
          userPreferences: {
            isEnabled: true,
            priority: 1,
          },
        });

        // Add artwork provider with actual artwork data
        testRegistry.set("itunes", {
          config: {
            id: "itunes",
            name: "iTunes",
            description: "iTunes Search API",
            type: "artwork",
            load: async () => createMockArtworkProvider("itunes", "iTunes"),
          },
          status: {
            isAvailable: true,
            isLoading: false,
            lastChecked: new Date(),
          },
          userPreferences: {
            isEnabled: true,
            priority: 1,
          },
        });

        // Add player source
        testRegistry.set("local", {
          config: {
            id: "local",
            name: "Local",
            description: "Local player",
            type: "player-source",
            load: async () => ({
              getId: () => "local",
              getName: () => "Local",
              isAvailable: () => Promise.resolve(true),
            }),
          },
          status: {
            isAvailable: true,
            isLoading: false,
            lastChecked: new Date(),
          },
          userPreferences: {
            isEnabled: true,
            priority: 1,
          },
        });

        // Inject into window
        (
          window as unknown as { __TEST_REGISTRY__?: unknown }
        ).__TEST_REGISTRY__ = testRegistry;
      });

      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/");

      // Wait for the lyrics screen to be ready
      await page.waitForSelector('[data-testid="lyrics-screen"]');

      // Wait for the artwork to load and background to appear - longer timeout since it needs to fetch and preload
      const background = page.locator('[data-testid="lyrics-background"]');
      await expect(background).toBeVisible({ timeout: 15000 });

      // Verify background has the expected image
      const backgroundStyle = await background.getAttribute("style");
      expect(backgroundStyle).toContain("background-image");
      expect(backgroundStyle).toContain("data:image/svg+xml");
    });

    test("should handle no artwork gracefully", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // With no artwork (default test registry behavior), background should not exist
      const background = page.locator('[data-testid="lyrics-background"]');
      await expect(background).not.toBeVisible();

      // But lyrics should still be visible
      await page.waitForSelector('[data-testid="lyrics-line"]');
      const lyricsLines = page.locator('[data-testid="lyrics-line"]');
      await expect(lyricsLines.first()).toBeVisible();
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
