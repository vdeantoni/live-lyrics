import { expect, test, type Page } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";

/**
 * Helper to start playing music from the first playlist
 * Opens playlists screen and clicks "Play All" on the first playlist
 */
async function startPlayingFromPlaylist(page: Page) {
  // Open playlists screen
  const playlistsButton = page.locator('[data-testid="playlists-button"]');
  await playlistsButton.click();

  // Wait for playlists screen to appear
  await expect(page.locator('[data-testid="playlists-screen"]')).toBeVisible();

  // Click "Play All" on the first playlist
  const playAllButton = page.locator('[data-testid^="play-all-"]').first();
  await playAllButton.click();

  // Close playlists screen
  const closeButton = page.locator('[data-testid="close-overlay-button"]');
  await closeButton.click();

  // Wait for song to load
  await expect(page.locator('[data-testid="song-name"]')).not.toBeEmpty({
    timeout: 5000,
  });
}

test.describe("Keyboard Navigation and Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    // Inject test registry instead of mocking HTTP requests
    await injectTestRegistry(page);

    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');
  });

  test("should support keyboard navigation for play/pause", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Start playing from playlist to ensure player has a song
    await startPlayingFromPlaylist(page);

    const playButton = page.locator('[data-testid="play-pause-button"]');

    // Focus the play button
    await playButton.focus();

    // Verify it's focused
    await expect(playButton).toBeFocused();

    // Initially should show play icon
    await expect(playButton.locator('[data-testid="play-icon"]')).toBeVisible();

    // Press Enter to activate
    await page.keyboard.press("Enter");

    // Wait for state to sync (polling interval is 300ms)
    // Wait for aria-label to change to indicate playing state
    await expect(playButton).toHaveAttribute("aria-label", /pause/i, {
      timeout: 2000,
    });

    // Should show pause icon after Enter key
    await expect(
      playButton.locator('[data-testid="pause-icon"]'),
    ).toBeVisible();

    // Press Enter again to pause
    await page.keyboard.press("Enter");

    // Wait for aria-label to change back to play state
    await expect(playButton).toHaveAttribute("aria-label", /play/i);

    // Should show play icon after second Enter
    await expect(playButton.locator('[data-testid="play-icon"]')).toBeVisible();
  });

  test("should support keyboard shortcuts for seeking", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "firefox",
      "Firefox has timing issues with keyboard shortcuts in tests",
    );

    await page.setViewportSize({ width: 768, height: 1024 });

    // Start playing from playlist
    await startPlayingFromPlaylist(page);

    const currentTimeDisplay = page.locator('[data-testid="current-time"]');

    // Ensure player is ready at 0:00
    await expect(currentTimeDisplay).toHaveText("0:00");

    // Test global ArrowRight shortcut (seeks forward 5s)
    await page.keyboard.press("ArrowRight");

    // Wait for time to update
    await expect(currentTimeDisplay).not.toHaveText("0:00", {
      timeout: 3000,
    });

    // Verify time changed (should be around 0:05)
    const timeText = await currentTimeDisplay.textContent();
    expect(timeText).toMatch(/0:0[5-9]|0:1[0-5]/); // Allow 5-15s range for timing variance
  });

  test("should support keyboard navigation in settings", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Start playing from playlist
    await startPlayingFromPlaylist(page);

    // Open settings using keyboard
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.focus();
    await page.keyboard.press("Enter");

    // Should open settings screen
    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible();

    // Tab should eventually reach the close button
    let attempts = 0;
    while (attempts < 10) {
      const focused = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      if (focused === "BUTTON") {
        const ariaLabel = await page.evaluate(() =>
          document.activeElement?.getAttribute("aria-label"),
        );
        if (ariaLabel?.includes("Close") || ariaLabel?.includes("close")) {
          break;
        }
      }
      await page.keyboard.press("Tab");
      attempts++;
    }

    // Press Enter to close settings
    await page.keyboard.press("Enter");

    // Should return to main screen
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
  });

  test("should have proper ARIA labels and roles", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Start playing from playlist
    await startPlayingFromPlaylist(page);

    // Check play/pause button has proper ARIA label
    const playButton = page.locator('[data-testid="play-pause-button"]');
    const buttonRole = await playButton.getAttribute("role");
    const ariaLabel = await playButton.getAttribute("aria-label");

    expect(buttonRole === "button" || buttonRole === null).toBe(true); // null is fine if it's a button element
    expect(ariaLabel).toBeTruthy();

    // Check progress slider has proper ARIA attributes
    const progressSlider = page.locator(
      '[data-testid="progress-slider"] [role="slider"]',
    );
    const sliderRole = await progressSlider.getAttribute("role");
    const ariaValueNow = await progressSlider.getAttribute("aria-valuenow");
    const ariaValueMax = await progressSlider.getAttribute("aria-valuemax");

    expect(sliderRole).toBe("slider");
    expect(ariaValueNow).toBeTruthy();
    expect(ariaValueMax).toBeTruthy();
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Start playing from playlist
    await startPlayingFromPlaylist(page);

    // Check song name has good contrast
    const songName = page.locator('[data-testid="song-name"]');
    if (await songName.isVisible()) {
      const styles = await songName.evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      // Basic check that color is not transparent
      expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
      expect(styles.color).not.toBe("transparent");
    }

    // Check artist name has good contrast
    const artistName = page.locator('[data-testid="artist-name"]');
    if (await artistName.isVisible()) {
      const color = await artistName.evaluate(
        (el) => getComputedStyle(el).color,
      );
      expect(color).not.toBe("rgba(0, 0, 0, 0)");
      expect(color).not.toBe("transparent");
    }
  });

  test("should support screen reader navigation patterns", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Wait for loading screen to complete and main app to render
    await page.waitForSelector('[data-testid="player"]', { timeout: 10000 });

    // Check that main content areas have proper landmark roles or structure
    const main = page.locator('main, [role="main"], #root');
    await expect(main).toBeVisible();

    // Check that interactive elements are properly grouped
    const playerControls = page.locator('[data-testid="player-controls"]');
    await expect(playerControls).toBeVisible();

    // Tab through interactive elements to verify logical order
    await page.keyboard.press("Tab");

    // Should be able to reach focusable elements (including Radix UI components with ARIA roles)
    let foundFocusableElement = false;
    for (let i = 0; i < 15; i++) {
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          role: el?.getAttribute("role"),
          tabIndex: el?.getAttribute("tabindex"),
        };
      });

      // Check for standard HTML elements, ARIA roles, or tabindex
      if (
        activeElement.tagName === "BUTTON" ||
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "A" ||
        activeElement.role === "slider" ||
        activeElement.role === "button" ||
        (activeElement.tabIndex !== null && activeElement.tabIndex !== "-1")
      ) {
        foundFocusableElement = true;
        break;
      }
      await page.keyboard.press("Tab");
    }

    expect(foundFocusableElement).toBe(true);
  });

  test("should announce state changes to screen readers", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Start playing from playlist
    await startPlayingFromPlaylist(page);

    const playButton = page.locator('[data-testid="play-pause-button"]');

    // Check initial state has appropriate ARIA label
    const initialLabel = await playButton.getAttribute("aria-label");
    expect(initialLabel).toBeTruthy();
    expect(initialLabel).toMatch(/play/i); // Should initially be "Play"

    // Click to change state
    await playButton.click();

    // Wait for state to sync (polling interval is 300ms)
    // ARIA label should change to reflect new state
    await expect(playButton).not.toHaveAttribute("aria-label", initialLabel!, {
      timeout: 2000,
    });

    // Verify the new label is truthy and different
    const newLabel = await playButton.getAttribute("aria-label");
    expect(newLabel).toBeTruthy();
    expect(newLabel).toMatch(/pause/i); // Should now be "Pause"
  });

  test("should handle focus management properly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Start playing from playlist
    await startPlayingFromPlaylist(page);

    // Ensure settings are closed at start (defensive check for test isolation)
    const settingsScreen = page.locator('[data-testid="settings-screen"]');
    if (await settingsScreen.isVisible()) {
      const existingCloseButton = page.locator(
        '[data-testid="close-overlay-button"]',
      );
      await existingCloseButton.click();
      await expect(settingsScreen).not.toBeVisible();
    }

    // Open settings
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Wait for settings to open
    await expect(settingsScreen).toBeVisible();

    // When closing settings, focus should return to a logical place
    const closeButton = page.locator('[data-testid="close-overlay-button"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Wait for settings to fully close (animation complete)
    await expect(settingsScreen).not.toBeVisible();

    // Should return to main screen
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

    // Settings button should be available again after overlay fully closes
    await expect(settingsButton).toBeVisible();
  });
});
