import { test, expect } from "@playwright/test";

test.describe("Settings Functionality", () => {
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
    await page.waitForSelector('[data-testid="music-player"]');
  });

  test.describe("Settings Screen", () => {
    test("should open and close settings screen", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Initially should show lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();

      // Click settings button to open
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();

      // Should now show settings screen and hide settings button
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-button"]'),
      ).not.toBeVisible();

      // Click close button to close
      const closeButton = page.locator('[data-testid="close-settings-button"]');
      await expect(closeButton).toBeVisible();
      await closeButton.click();

      // Should be back to lyrics screen with settings button visible again
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="settings-button"]'),
      ).toBeVisible();
    });

    test("should display settings content correctly", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      // Wait for settings screen to be visible
      await page.waitForSelector('[data-testid="settings-screen"]');

      // Check settings header
      await expect(
        page.locator('[data-testid="settings-screen"] h2'),
      ).toContainText("Settings");
      await expect(page.getByText("Configure your music player")).toBeVisible();

      // Check music player section
      await expect(page.getByText("Music Player")).toBeVisible();
      await expect(page.getByText("Local Player")).toBeVisible();
      await expect(
        page.getByText("Use local player for testing"),
      ).toBeVisible();

      // Check provider sections (these load asynchronously)
      await expect(page.getByText("Lyrics Provider")).toBeVisible();
      await expect(page.getByText("Artwork Provider")).toBeVisible();
    });

    test("should allow player switching", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Find the player toggle switch
      const playerToggle = page.locator('[role="switch"]').first();

      // Initially should be unchecked (Local Player)
      await expect(page.getByText("Local Player")).toBeVisible();

      // Toggle to Remote Player
      await playerToggle.click();

      // Should now show Server Player
      await expect(page.getByText("Server Player")).toBeVisible();
      await expect(
        page.getByText("Connect to Apple Music via local server"),
      ).toBeVisible();

      // Toggle back to Local Player
      await playerToggle.click();

      // Should be back to Local Player
      await expect(page.getByText("Local Player")).toBeVisible();
    });

    test("should show provider availability status", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Wait for provider buttons to load
      await page.waitForSelector('[data-testid="provider-status-button"]', {
        timeout: 5000,
      });

      // Should have provider status buttons
      const providerButtons = page.locator(
        '[data-testid="provider-status-button"]',
      );
      const buttonCount = await providerButtons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // Verify at least one active provider exists
      const activeProviders = page.locator(
        '[data-testid="provider-status-button"][data-status="active"]',
      );
      const activeCount = await activeProviders.count();
      expect(activeCount).toBeGreaterThan(0);
    });
  });

  test.describe("Settings Responsiveness", () => {
    test("should work correctly in landscape mode", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Settings should still be visible and functional
      await expect(page.getByText("Settings")).toBeVisible();
      await expect(page.getByText("Music Mode")).toBeVisible();

      // Close button should work
      const closeButton = page.locator('[data-testid="close-settings-button"]');
      await closeButton.click();

      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });

    test("should handle different screen sizes", async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 768, height: 1024 }, // iPad Portrait
        { width: 1024, height: 768 }, // iPad Landscape
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Open settings
        const settingsButton = page.locator('[data-testid="settings-button"]');
        await settingsButton.click();

        await page.waitForSelector('[data-testid="settings-screen"]');

        // Settings should be responsive
        await expect(page.getByText("Settings")).toBeVisible();
        const closeButton = page.locator(
          '[data-testid="close-settings-button"]',
        );
        await expect(closeButton).toBeVisible();

        // Close settings
        await closeButton.click();
        await expect(
          page.locator('[data-testid="lyrics-screen"]'),
        ).toBeVisible();
      }
    });
  });
});
