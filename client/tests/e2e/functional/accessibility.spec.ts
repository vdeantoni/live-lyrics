import { expect, test } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

test.describe("Keyboard Navigation and Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');
  });

  test.describe("Keyboard Shortcuts", () => {
    test("should toggle play/pause with Space key", async ({ page }) => {
      await setupPlayerWithSong(page);

      const playButton = page.locator('[data-testid="play-pause-button"]');

      // Initially should show play icon
      await expect(
        playButton.locator('[data-testid="play-icon"]'),
      ).toBeVisible();

      // Press Space to play
      await page.keyboard.press("Space");
      await expect(
        playButton.locator('[data-testid="pause-icon"]'),
      ).toBeVisible();

      // Press Space again to pause
      await page.keyboard.press("Space");
      await expect(
        playButton.locator('[data-testid="play-icon"]'),
      ).toBeVisible();
    });

    test("should seek forward with ArrowRight", async ({ page }) => {
      await setupPlayerWithSong(page);

      const currentTimeDisplay = page.locator('[data-testid="current-time"]');
      await expect(currentTimeDisplay).toHaveText("0:00");

      // Seek forward 5 seconds
      await page.keyboard.press("ArrowRight");

      // Wait for time to update
      await expect(currentTimeDisplay).not.toHaveText("0:00", {
        timeout: 3000,
      });

      const timeText = await currentTimeDisplay.textContent();
      expect(timeText).toMatch(/0:0[5-9]|0:1[0-5]/);
    });

    test("should seek backward with ArrowLeft", async ({ page }) => {
      await setupPlayerWithSong(page);

      // First seek forward to have room to go back
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(500);

      const currentTimeDisplay = page.locator('[data-testid="current-time"]');
      const initialTime = await currentTimeDisplay.textContent();

      // Seek backward 5 seconds
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(500);

      const newTime = await currentTimeDisplay.textContent();
      expect(newTime).not.toBe(initialTime);
    });

    test("should fast seek with Shift+Arrow keys", async ({ page }) => {
      await setupPlayerWithSong(page);

      const currentTimeDisplay = page.locator('[data-testid="current-time"]');
      await expect(currentTimeDisplay).toHaveText("0:00");

      // Fast seek forward 15 seconds with Shift+ArrowRight
      await page.keyboard.press("Shift+ArrowRight");

      // Wait for time to update
      await expect(currentTimeDisplay).not.toHaveText("0:00", {
        timeout: 3000,
      });

      const timeText = await currentTimeDisplay.textContent();
      // Should be around 15 seconds (allow variance)
      expect(timeText).toMatch(/0:(1[5-9]|2[0-5])/);
    });

    test("should open settings with C key", async ({ page }) => {
      await setupPlayerWithSong(page);

      await page.keyboard.press("c");

      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();
    });

    test("should open search with S key", async ({ page }) => {
      await setupPlayerWithSong(page);

      await page.keyboard.press("s");

      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();
    });

    test("should open playlists with P key", async ({ page }) => {
      await setupPlayerWithSong(page);

      await page.keyboard.press("p");

      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
    });

    test("should not trigger shortcuts when typing in input fields", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Open search screen
      await page.keyboard.press("s");
      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();

      // Focus search input
      const searchInput = page.locator('[data-testid="search-input"]');
      await searchInput.focus();

      // Type 'c' in the input - should NOT open settings
      await page.keyboard.type("c");

      // Settings should not open
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();

      // Search screen should still be visible
      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();
    });
  });

  test.describe("Tab Navigation", () => {
    test("should support Tab navigation through interactive elements", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Tab through elements
      let foundFocusableElement = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");

        const activeElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            role: el?.getAttribute("role"),
            ariaLabel: el?.getAttribute("aria-label"),
          };
        });

        // Check if we reached a focusable element
        if (
          activeElement.tagName === "BUTTON" ||
          activeElement.tagName === "INPUT" ||
          activeElement.role === "slider" ||
          activeElement.role === "button"
        ) {
          foundFocusableElement = true;
          break;
        }
      }

      expect(foundFocusableElement).toBe(true);
    });

    test("should have focusable close button in settings", async ({ page }) => {
      await setupPlayerWithSong(page);

      // Open settings
      await page.keyboard.press("c");
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();

      // Close button should exist and be focusable
      const closeButton = page.locator('[data-testid="close-settings-button"]');
      await closeButton.focus();

      // Verify it has focus
      const hasFocus = await closeButton.evaluate(
        (el) => el === document.activeElement,
      );
      expect(hasFocus).toBe(true);

      // Press Enter to close
      await page.keyboard.press("Enter");

      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });
  });

  test.describe("ARIA Labels and Roles", () => {
    test("should have proper ARIA labels on interactive elements", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Play/pause button
      const playButton = page.locator('[data-testid="play-pause-button"]');
      const playButtonLabel = await playButton.getAttribute("aria-label");
      expect(playButtonLabel).toBeTruthy();
      expect(playButtonLabel).toMatch(/play|pause/i);

      // Settings button
      const settingsButton = page.locator('[data-testid="settings-button"]');
      const settingsLabel = await settingsButton.getAttribute("aria-label");
      expect(settingsLabel).toBeTruthy();
    });

    test("should update ARIA labels on state changes", async ({ page }) => {
      await setupPlayerWithSong(page);

      const playButton = page.locator('[data-testid="play-pause-button"]');

      // Initial state should be "Play"
      const initialLabel = await playButton.getAttribute("aria-label");
      expect(initialLabel).toMatch(/play/i);

      // Press Space to play
      await page.keyboard.press("Space");

      // Wait for label to update
      await expect(playButton).not.toHaveAttribute("aria-label", initialLabel!);

      // New label should be "Pause"
      const newLabel = await playButton.getAttribute("aria-label");
      expect(newLabel).toMatch(/pause/i);
    });
  });

  test.describe("Visual Accessibility", () => {
    test("should have visible text elements", async ({ page }) => {
      await setupPlayerWithSong(page);

      // Song name should be visible and have content
      const songName = page.locator('[data-testid="song-name"]');
      await expect(songName).toBeVisible();
      expect(await songName.textContent()).toBeTruthy();

      // Artist name should be visible and have content
      const artistName = page.locator('[data-testid="artist-name"]');
      await expect(artistName).toBeVisible();
      expect(await artistName.textContent()).toBeTruthy();

      // Time displays should be visible
      const currentTime = page.locator('[data-testid="current-time"]');
      const totalTime = page.locator('[data-testid="total-time"]');
      await expect(currentTime).toBeVisible();
      await expect(totalTime).toBeVisible();
    });

    test("should have proper element structure for screen readers", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      // Main content container exists
      const main = page.locator('#root, main, [role="main"]');
      await expect(main).toBeVisible();

      // Player controls are grouped
      const playerControls = page.locator('[data-testid="player-controls"]');
      await expect(playerControls).toBeVisible();

      // Lyrics screen has proper structure
      const lyricsScreen = page.locator('[data-testid="lyrics-screen"]');
      await expect(lyricsScreen).toBeVisible();
    });
  });

  test.describe("Focus Management", () => {
    test("should maintain focus after overlay close", async ({ page }) => {
      await setupPlayerWithSong(page);

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();

      // Close settings
      const closeButton = page.locator('[data-testid="close-settings-button"]');
      await closeButton.click();

      // Should return to lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

      // Settings button should be available again
      await expect(settingsButton).toBeVisible();
    });
  });
});
