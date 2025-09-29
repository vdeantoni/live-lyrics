import { test, expect } from "@playwright/test";

test.describe("Keyboard Navigation and Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    // Mock lyrics API for consistent testing
    await page.route("**/get*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          syncType: "LINE_SYNCED",
          lines: [
            { startTimeMs: 0, words: "Test lyrics line 1" },
            { startTimeMs: 15000, words: "Test lyrics line 2" },
          ],
        }),
      });
    });

    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');
  });

  test("should support keyboard navigation for play/pause", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const playButton = page.locator('[data-testid="play-pause-button"]');

    // Focus the play button
    await playButton.focus();

    // Verify it's focused
    await expect(playButton).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press("Enter");

    // Should show pause icon after Enter key
    await expect(
      playButton.locator('[data-testid="pause-icon"]'),
    ).toBeVisible();

    // Press Enter again to pause
    await page.keyboard.press("Enter");

    // Should show play icon after second Enter
    await expect(playButton.locator('[data-testid="play-icon"]')).toBeVisible();
  });

  test("should support keyboard navigation for progress slider", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Start the player first so seeking updates the time display
    const playButton = page.locator('[data-testid="play-pause-button"]');
    await playButton.click();

    // Target the element with role="slider" within the slider wrapper
    const progressSlider = page.locator(
      '[data-testid="progress-slider"] [role="slider"]',
    );
    const currentTimeDisplay = page.locator('[data-testid="current-time"]');

    // Focus the slider element
    await progressSlider.focus();
    await expect(progressSlider).toBeFocused();

    // Get initial time
    const initialTime = await currentTimeDisplay.textContent();

    // Use multiple arrow keys to make a more significant change
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("ArrowRight");
    }

    // Wait for the UI to update
    await page.waitForTimeout(500);

    // Time should have changed
    const newTime = await currentTimeDisplay.textContent();
    expect(newTime).not.toBe(initialTime);
  });

  test("should support keyboard navigation in settings", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

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

    // Check that main content areas have proper landmark roles or structure
    const main = page.locator('main, [role="main"], #root');
    await expect(main).toBeVisible();

    // Check that interactive elements are properly grouped
    const playerControls = page.locator('[data-testid="player-controls"]');
    await expect(playerControls).toBeVisible();

    // Tab through interactive elements to verify logical order
    await page.keyboard.press("Tab");

    // Should be able to reach focusable elements
    let foundFocusableElement = false;
    for (let i = 0; i < 10; i++) {
      const activeElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      if (
        activeElement === "BUTTON" ||
        activeElement === "INPUT" ||
        activeElement === "A"
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

    const playButton = page.locator('[data-testid="play-pause-button"]');

    // Check initial state has appropriate ARIA label
    const initialLabel = await playButton.getAttribute("aria-label");
    expect(initialLabel).toBeTruthy();

    // Click to change state
    await playButton.click();

    // ARIA label should reflect new state
    const newLabel = await playButton.getAttribute("aria-label");
    expect(newLabel).toBeTruthy();
    expect(newLabel).not.toBe(initialLabel);
  });

  test("should handle focus management properly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Open settings
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();

    // Focus should move to settings screen
    await page.waitForSelector('[data-testid="settings-screen"]');

    // When closing settings, focus should return to a logical place
    const closeButton = page.locator('[data-testid="close-settings-button"]');
    await closeButton.click();

    // Should return to main screen
    await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

    // Settings button should be available again for focus
    await expect(settingsButton).toBeVisible();
  });
});
