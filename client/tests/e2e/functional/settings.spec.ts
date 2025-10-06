import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { loadTestSong } from "../helpers/testPlayerHelpers";

test.describe("Settings Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Inject test registry instead of mocking HTTP requests
    await injectTestRegistry(page);

    await page.goto("/");

    // Clear settings from localStorage to ensure a clean state for each test
    await page.evaluate(() => localStorage.removeItem("LIVE_LYRICS_SETTINGS"));

    // Reload the page to apply the cleared storage
    await page.reload();

    // Load test song to populate player state
    await loadTestSong(page, {
      name: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      currentTime: 0,
      duration: 355,
      isPlaying: true,
    });

    await page.waitForSelector('[data-testid="player"]');
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

      // Wait for settings screen animation to complete
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();

      // Wait for settings button to be hidden (animation complete)
      await expect(settingsButton).not.toBeVisible();

      // Click close button to close
      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await expect(closeButton).toBeVisible();
      await closeButton.click();

      // Wait for settings screen to complete exit animation
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();

      // Should be back to lyrics screen with settings button visible again
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(settingsButton).toBeVisible();
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
      await expect(page.getByText("Configure your player")).toBeVisible();

      // Check player section
      await expect(
        page.locator('[data-testid="player-section"] h3'),
      ).toBeVisible();

      // Check provider sections (these load with individual loading states)
      await expect(
        page.locator('[data-testid="lyrics-provider-section"] h3'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="artwork-provider-section"] h3'),
      ).toBeVisible();
    });

    test("should allow drag and drop reordering of providers", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Wait for provider items to load
      await page.waitForSelector('[data-testid^="provider-item-"]');

      // Find drag handles in lyrics provider section
      const lyricsSection = page.locator(
        '[data-testid="lyrics-provider-section"]',
      );
      const providerItems = lyricsSection.locator(
        '[data-testid^="provider-item-"]',
      );

      const itemCount = await providerItems.count();
      if (itemCount >= 2) {
        // Get the ID of the first item before dragging
        const originalFirstItemId = await providerItems
          .nth(0)
          .getAttribute("data-testid");

        const firstHandle = lyricsSection
          .locator('[data-testid^="provider-drag-handle-"]')
          .nth(0);
        const secondItem = providerItems.nth(1);

        const firstHandleBoundingBox = await firstHandle.boundingBox();
        const secondItemBoundingBox = await secondItem.boundingBox();

        if (firstHandleBoundingBox && secondItemBoundingBox) {
          // Start the drag from the center of the first handle
          await page.mouse.move(
            firstHandleBoundingBox.x + firstHandleBoundingBox.width / 2,
            firstHandleBoundingBox.y + firstHandleBoundingBox.height / 2,
          );
          await page.mouse.down();

          // Drag over to the center of the second item
          await page.mouse.move(
            secondItemBoundingBox.x + secondItemBoundingBox.width / 2,
            secondItemBoundingBox.y + secondItemBoundingBox.height / 2,
            { steps: 5 }, // Simulate a smoother drag
          );

          // Release the mouse to drop
          await page.mouse.up();
        }

        // Use expect.poll to wait for the DOM to update and assert the change
        await expect
          .poll(async () => {
            return providerItems.nth(0).getAttribute("data-testid");
          })
          .not.toEqual(originalFirstItemId);
      }
    });

    test("should show individual loading states for providers", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Wait for provider items to appear
      await page.waitForSelector('[data-testid^="provider-item-"]');

      // Should have provider status buttons (they may show spinners initially)
      const providerButtons = page.locator(
        '[data-testid="provider-status-button"]',
      );
      const buttonCount = await providerButtons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // Eventually status should resolve to available/unavailable (no more spinners)
      await page.waitForFunction(() => {
        const buttons = document.querySelectorAll(
          '[data-testid="provider-status-button"]',
        );
        return Array.from(buttons).every(
          (button) => !button.innerHTML.includes("animate-spin"),
        );
      });
    });

    test("should allow player switching", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Wait for remote player item to be visible
      await page.waitForSelector('[data-testid="remote-player-item"]');

      // Find the remote player toggle switch
      const playerToggle = page.locator('[data-testid="remote-player-toggle"]');

      // Initially should be unchecked (Local player mode)
      await expect(playerToggle).not.toBeChecked();

      // Toggle to Remote Player
      await playerToggle.click();

      // Should now be checked (Remote player mode)
      await expect(playerToggle).toBeChecked();

      // Toggle back to Local Player
      await playerToggle.click();

      // Should be unchecked again (Local player mode)
      await expect(playerToggle).not.toBeChecked();
    });

    test("should show provider availability status", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Wait for provider buttons to load
      await page.waitForSelector('[data-testid="provider-status-button"]');

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

    test("should show remote player availability status", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      await page.waitForSelector('[data-testid="settings-screen"]');

      // Wait for remote player item to be visible
      await page.waitForSelector('[data-testid="remote-player-item"]');

      // Should have remote player status indicator
      const playerStatus = page.locator('[data-testid="remote-player-status"]');
      await expect(playerStatus).toBeVisible();

      // Initially may show loading spinner, then should resolve to available/unavailable
      await page.waitForFunction(() => {
        const statusElement = document.querySelector(
          '[data-testid="remote-player-status"]',
        );
        return (
          statusElement && !statusElement.innerHTML.includes("animate-spin")
        );
      });

      // Should still be visible after loading
      await expect(playerStatus).toBeVisible();
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
      await expect(
        page.getByRole("heading", { name: "Settings" }),
      ).toBeVisible();

      // Close button should work
      const closeButton = page.locator('[data-testid="close-overlay-button"]');
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

        // Ensure settings are closed before starting (in case previous iteration left them open)
        const settingsScreen = page.locator('[data-testid="settings-screen"]');
        if (await settingsScreen.isVisible()) {
          const existingCloseButton = page.locator(
            '[data-testid="close-overlay-button"]',
          );
          await existingCloseButton.click();
          await expect(settingsScreen).not.toBeVisible();
        }

        // Wait for settings button to be visible before clicking
        const settingsButton = page.locator('[data-testid="settings-button"]');
        await expect(settingsButton).toBeVisible();
        await settingsButton.click();

        await expect(settingsScreen).toBeVisible();

        // Settings should be responsive
        await expect(
          page.getByRole("heading", { name: "Settings" }),
        ).toBeVisible();
        const closeButton = page.locator(
          '[data-testid="close-overlay-button"]',
        );
        await expect(closeButton).toBeVisible();

        // Close settings
        await closeButton.click();

        // Wait for settings to fully close (animation complete)
        await expect(settingsScreen).not.toBeVisible();

        // Verify main screen and settings button are back
        await expect(
          page.locator('[data-testid="lyrics-screen"]'),
        ).toBeVisible();
        await expect(settingsButton).toBeVisible();
      }
    });
  });

  test.describe("Overlay Navigation Flow", () => {
    test("should navigate from lyrics → settings → search → lyrics", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Wait for app to load and lyrics to appear
      await page.waitForSelector('[data-testid="lyrics-screen"]');
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

      // Verify we're on lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="search-screen"]'),
      ).not.toBeVisible();

      // STEP 1: Open settings using keyboard shortcut 'C'
      await page.keyboard.press("c");
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Settings" }),
      ).toBeVisible();

      // Close button should be visible
      await expect(
        page.locator('[data-testid="close-overlay-button"]'),
      ).toBeVisible();

      // STEP 2: Open search using keyboard shortcut 'S'
      await page.keyboard.press("s");

      // Settings should close and search should open
      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Search Lyrics" }),
      ).toBeVisible();

      // STEP 3: Close search and verify we're back to lyrics
      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="search-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
    });

    test("should navigate from lyrics → settings (icon) → search (icon) → lyrics", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Wait for app to load and lyrics to appear
      await page.waitForSelector('[data-testid="lyrics-screen"]');
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

      // Verify we're on lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();

      // STEP 1: Open settings using top-right icon
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();

      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Settings" }),
      ).toBeVisible();

      // STEP 2: Open search using search button in player controls
      const searchButton = page.locator('button[aria-label="Search lyrics"]');
      await expect(searchButton).toBeVisible();
      await searchButton.click();

      // Settings should close and search should open
      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Search Lyrics" }),
      ).toBeVisible();

      // STEP 3: Close search and verify we're back to lyrics
      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="search-screen"]'),
      ).not.toBeVisible();
    });
  });
});
