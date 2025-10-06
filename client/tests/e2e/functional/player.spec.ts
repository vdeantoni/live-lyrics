import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

test.describe("Player Component", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
    await page.goto("/");
  });

  test.describe("Song Information Display", () => {
    test("should display song name and artist", async ({ page }) => {
      await setupPlayerWithSong(page);

      await expect(page.locator('[data-testid="song-name"]')).toContainText(
        "Bohemian Rhapsody",
      );
      await expect(page.locator('[data-testid="artist-name"]')).toContainText(
        "Queen",
      );
    });

    test("should display current time and total duration", async ({ page }) => {
      await setupPlayerWithSong(page);

      // Initial time should be 0:00
      await expect(page.locator('[data-testid="current-time"]')).toContainText(
        "0:00",
      );

      // Duration should be 5:55 (355 seconds)
      await expect(page.locator('[data-testid="total-time"]')).toContainText(
        "5:55",
      );
    });
  });

  test.describe("Play/Pause Controls", () => {
    test("should toggle between play and pause icons", async ({ page }) => {
      await setupPlayerWithSong(page);

      const playPauseButton = page.locator('[data-testid="play-pause-button"]');
      await expect(playPauseButton).toBeVisible();

      // Player starts paused, should show play icon
      await expect(page.locator('[data-testid="play-icon"]')).toBeVisible();

      // Click to play
      await playPauseButton.click();
      await expect(page.locator('[data-testid="pause-icon"]')).toBeVisible();

      // Click to pause
      await playPauseButton.click();
      await expect(page.locator('[data-testid="play-icon"]')).toBeVisible();
    });

    test("should update time when playing", async ({ page }) => {
      await setupPlayerWithSong(page);

      const playButton = page.locator('[data-testid="play-pause-button"]');
      const currentTimeDisplay = page.locator('[data-testid="current-time"]');

      // Start playing
      await playButton.click();

      // Wait for time to progress
      await expect(currentTimeDisplay).not.toHaveText("0:00", {
        timeout: 3000,
      });

      // Verify time has progressed
      const currentTime = await currentTimeDisplay.textContent();
      expect(currentTime).toMatch(/0:\d{2}/);
      expect(currentTime).not.toBe("0:00");
    });
  });

  test.describe("Progress Slider", () => {
    test("should display progress slider", async ({ page }) => {
      await setupPlayerWithSong(page);

      const progressSlider = page.locator('[data-testid="progress-slider"]');
      await expect(progressSlider).toBeVisible();

      // Slider should be interactive (not disabled)
      await expect(progressSlider).not.toBeDisabled();
    });

    test("should start at position 0", async ({ page }) => {
      await setupPlayerWithSong(page);

      const progressSlider = page.locator('[data-testid="progress-slider"]');
      const sliderValue = await progressSlider.getAttribute("aria-valuenow");
      expect(parseInt(sliderValue || "0")).toBe(0);
    });

    test("should seek when slider is moved with keyboard", async ({ page }) => {
      await setupPlayerWithSong(page);

      const progressSlider = page.locator(
        '[data-testid="progress-slider"] [role="slider"]',
      );
      const currentTimeDisplay = page.locator('[data-testid="current-time"]');

      // Initial time should be 0:00
      await expect(currentTimeDisplay).toHaveText("0:00");

      // Focus the slider and use keyboard to seek forward
      await progressSlider.focus();

      // Press ArrowRight multiple times to seek forward
      for (let i = 0; i < 20; i++) {
        await progressSlider.press("ArrowRight");
      }

      // Time should have updated
      await expect(currentTimeDisplay).not.toHaveText("0:00");

      const newTime = await currentTimeDisplay.textContent();
      expect(newTime).toMatch(/\d+:\d{2}/);
    });

    test("should seek when using keyboard shortcuts", async ({ page }) => {
      await setupPlayerWithSong(page);

      const currentTimeDisplay = page.locator('[data-testid="current-time"]');

      // Initial time
      await expect(currentTimeDisplay).toHaveText("0:00");

      // Use global ArrowRight shortcut to seek forward (5 seconds)
      await page.keyboard.press("ArrowRight");

      // Time should update to around 5 seconds
      await expect(currentTimeDisplay).not.toHaveText("0:00");
      const newTime = await currentTimeDisplay.textContent();
      expect(newTime).toMatch(/0:0[5-9]|0:1[0-5]/); // Allow some variance
    });
  });

  test.describe("Quick Action Buttons", () => {
    test("should display search lyrics button", async ({ page }) => {
      await setupPlayerWithSong(page);

      const searchButton = page.locator('[data-testid="search-button"]');
      await expect(searchButton).toBeVisible();
    });

    test("should display view playlists button", async ({ page }) => {
      await setupPlayerWithSong(page);

      const playlistsButton = page.locator('[data-testid="playlists-button"]');
      await expect(playlistsButton).toBeVisible();
    });

    test("should open search screen when search button clicked", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      const searchButton = page.locator('[data-testid="search-button"]');
      await searchButton.click();

      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();
    });

    test("should open playlists screen when playlists button clicked", async ({
      page,
    }) => {
      await setupPlayerWithSong(page);

      const playlistsButton = page.locator('[data-testid="playlists-button"]');
      await playlistsButton.click();

      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
    });
  });

  test.describe("Responsive Layout", () => {
    test("should display correctly in portrait orientation", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await setupPlayerWithSong(page);

      // All controls should be visible
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="song-name"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="play-pause-button"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="progress-slider"]'),
      ).toBeVisible();
    });

    test("should display correctly in landscape orientation", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await setupPlayerWithSong(page);

      // All controls should be visible
      await expect(
        page.locator('[data-testid="player-controls"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="song-name"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="play-pause-button"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="progress-slider"]'),
      ).toBeVisible();
    });
  });
});
