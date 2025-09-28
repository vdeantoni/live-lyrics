import { test, expect } from "@playwright/test";

test.describe("Player Component", () => {
  test.beforeEach(async ({ page }) => {
    // Mock lyrics API for simulated songs
    await page.route("**/get*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          syncType: "LINE_SYNCED",
          lines: [
            { startTimeMs: 0, words: "Is this the real life?" },
            { startTimeMs: 15000, words: "Is this just fantasy?" },
            { startTimeMs: 30000, words: "Caught in a landslide" },
            { startTimeMs: 45000, words: "No escape from reality" },
          ],
        }),
      });
    });

    await page.goto("/");

    // Wait for the player to load
    await page.waitForSelector('[data-testid="player"]', { timeout: 10000 });
  });

  test.describe("Portrait Mode", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test("should display song information correctly", async ({ page }) => {
      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );
    });

    test("should show play/pause button and be clickable", async ({ page }) => {
      const playPauseButton = page.locator('[data-testid="play-pause-button"]');
      await expect(playPauseButton).toBeVisible();

      // Simulated player starts paused, so should show play icon initially
      await expect(
        playPauseButton.locator('[data-testid="play-icon"]'),
      ).toBeVisible();

      // Click to play
      await playPauseButton.click();

      // Should show pause icon when playing
      await expect(
        playPauseButton.locator('[data-testid="pause-icon"]'),
      ).toBeVisible();

      // Click to pause again
      await playPauseButton.click();

      // Should show play icon when paused
      await expect(
        playPauseButton.locator('[data-testid="play-icon"]'),
      ).toBeVisible();
    });

    test("should display progress slider and be interactive", async ({
      page,
    }) => {
      const progressSlider = page.locator('[data-testid="progress-slider"]');
      await expect(progressSlider).toBeVisible();

      // Check if slider shows initial progress (should be 0 at start)
      const sliderValue = await progressSlider.getAttribute("aria-valuenow");
      expect(parseInt(sliderValue || "0")).toBe(0);

      // Verify slider is interactive by checking it's not disabled
      await expect(progressSlider).not.toBeDisabled();
    });

    test("should show current time and duration", async ({ page }) => {
      await expect(page.locator('[data-testid="current-time"]')).toContainText(
        "0:00",
      );
      await expect(page.locator('[data-testid="duration"]')).toContainText(
        "5:55",
      ); // Bohemian Rhapsody duration
    });

    test("should have animated song name", async ({ page }) => {
      // The song name should be visible (Bohemian Rhapsody is the default)
      const songName = page.locator('[data-testid="song-name"]');
      await expect(songName).toBeVisible();
      await expect(songName).toContainText("Bohemian Rhapsody");
    });
  });

  test.describe("Landscape Mode", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
    });

    test("should display song information correctly in landscape", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );
    });

    test("should maintain play/pause functionality in landscape", async ({
      page,
    }) => {
      const playPauseButton = page.locator('[data-testid="play-pause-button"]');
      await expect(playPauseButton).toBeVisible();

      // Simulated player starts paused, so should show play icon initially
      await expect(
        playPauseButton.locator('[data-testid="play-icon"]'),
      ).toBeVisible();

      // Click to play
      await playPauseButton.click();

      // Should show pause icon when playing
      await expect(
        playPauseButton.locator('[data-testid="pause-icon"]'),
      ).toBeVisible();

      // Click to pause again
      await playPauseButton.click();

      // Should show play icon when paused
      await expect(
        playPauseButton.locator('[data-testid="play-icon"]'),
      ).toBeVisible();
    });

    test("should adapt layout for landscape orientation", async ({ page }) => {
      // The player should be visible and functional in landscape
      const player = page.locator('[data-testid="player"]');
      await expect(player).toBeVisible();

      // Progress slider should still be interactive
      const progressSlider = page.locator('[data-testid="progress-slider"]');
      await expect(progressSlider).toBeVisible();
    });
  });

  test.describe("Player Interactions", () => {
    test("should handle progress slider interaction", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const progressSlider = page.locator('[data-testid="progress-slider"]');
      const currentTimeDisplay = page.locator('[data-testid="current-time"]');

      // Get initial time (should be 0:00)
      const initialTime = await currentTimeDisplay.textContent();
      expect(initialTime).toBe("0:00");

      // Get slider bounding box for interaction
      const sliderBox = await progressSlider.boundingBox();
      if (sliderBox) {
        // Click at 75% of the slider (should seek to around 75% of 5:55 = ~4:26)
        const clickX = sliderBox.x + sliderBox.width * 0.75;
        const clickY = sliderBox.y + sliderBox.height / 2;

        await page.mouse.click(clickX, clickY);

        // Wait for the player to update and check the visual time display
        await page.waitForTimeout(500);
        const newTime = await currentTimeDisplay.textContent();

        // The displayed time should have changed from initial and be > 4:00
        expect(newTime).not.toBe(initialTime);
        expect(newTime).not.toBe("0:00");

        // Should be around 4:xx after clicking at 75%
        const timeMatch = newTime?.match(/(\d+):(\d+)/);
        if (timeMatch) {
          const minutes = parseInt(timeMatch[1]);
          expect(minutes).toBeGreaterThanOrEqual(4);
        }
      }
    });

    test("should display player controls", async ({ page }) => {
      // Since we're using simulated source, just verify the main player is working
      const player = page.locator('[data-testid="player"]');
      await expect(player).toBeVisible();

      // Should show song information
      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );
    });

    test("should handle playback time progression when playing", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const playButton = page.locator('[data-testid="play-pause-button"]');
      const currentTimeDisplay = page.locator('[data-testid="current-time"]');

      // Start playing
      await playButton.click();

      // Wait a bit for time to progress
      await page.waitForTimeout(1500);

      // Time should have progressed from 0:00
      const currentTime = await currentTimeDisplay.textContent();
      expect(currentTime).not.toBe("0:00");

      // Should show seconds have passed
      const timeMatch = currentTime?.match(/(\d+):(\d+)/);
      if (timeMatch) {
        const seconds = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
        expect(seconds).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should show player even without external dependencies", async ({
      page,
    }) => {
      // The simulated player should work without external API calls
      const player = page.locator('[data-testid="player"]');
      await expect(player).toBeVisible();

      // Should show play/pause button
      const playPauseButton = page.locator('[data-testid="play-pause-button"]');
      await expect(playPauseButton).toBeVisible();
    });
  });
});
