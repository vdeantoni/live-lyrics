import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";

test.describe("Playlist Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Inject test registry instead of mocking HTTP requests
    await injectTestRegistry(page);

    await page.goto("/");
    await page.waitForSelector('[data-testid="player"]');
  });

  test("should display initial song (Bohemian Rhapsody)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Wait for song data to load
    await page.waitForFunction(() => {
      const songName = document.querySelector('[data-testid="song-name"]');
      return songName && songName.textContent?.includes("Bohemian Rhapsody");
    });

    await expect(page.locator('[data-testid="song-name"]')).toContainText(
      "Bohemian Rhapsody",
    );
    await expect(page.locator('[data-testid="artist-name"]')).toContainText(
      "Queen",
    );
    await expect(page.locator('[data-testid="duration"]')).toContainText(
      "5:55",
    );
  });

  test("should handle song seeking correctly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const progressSlider = page.locator('[data-testid="progress-slider"]');
    const currentTimeDisplay = page.locator('[data-testid="current-time"]');

    // Initially should be at 0:00
    await expect(currentTimeDisplay).toHaveText("0:00");

    // Click slider to seek (force click to bypass actionability checks)
    await progressSlider.click({ force: true });

    // Wait for time to actually change (more reliable than fixed timeout)
    await expect(currentTimeDisplay).not.toHaveText("0:00", { timeout: 2000 });

    // Verify time has changed
    const currentTime = await currentTimeDisplay.textContent();
    expect(currentTime).not.toBe("0:00");
  });

  test("should maintain playback state during seeking", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const playButton = page.locator('[data-testid="play-pause-button"]');
    const progressSlider = page.locator('[data-testid="progress-slider"]');

    // Start playing
    await playButton.click();
    await expect(
      playButton.locator('[data-testid="pause-icon"]'),
    ).toBeVisible();

    // Seek during playback
    await progressSlider.click();

    // Should still be playing after seek
    await expect(
      playButton.locator('[data-testid="pause-icon"]'),
    ).toBeVisible();
  });
});
