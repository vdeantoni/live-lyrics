import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

test.describe("Settings Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Inject test registry instead of mocking HTTP requests
    await injectTestRegistry(page);

    await page.goto("/");

    // Clear settings from localStorage to ensure a clean state for each test
    await page.evaluate(() => localStorage.removeItem("LIVE_LYRICS_SETTINGS"));

    // Reload the page to apply the cleared storage
    await page.reload();

    // Setup player with song and viewport
    await setupPlayerWithSong(page);
  });

  test.describe("Settings Screen", () => {
    test("should open and close settings screen", async ({ page }) => {
      // Initially should show lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();

      // Click settings button to open
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      // Settings screen should be visible
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();

      // Settings button should remain visible and highlighted
      await expect(settingsButton).toBeVisible();
      await expect(settingsButton).toHaveClass(/(?<!:)text-primary\b/);

      // Click close button to close
      const closeButton = page.locator('[data-testid="close-settings-button"]');
      await closeButton.click();

      // Should be back to lyrics screen with settings button visible again
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(settingsButton).toBeVisible();
      await expect(settingsButton).not.toHaveClass(/(?<!:)text-primary\b/);
    });

    test("should display settings content correctly", async ({ page }) => {
      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      // Check settings header
      await expect(
        page.locator('[data-testid="settings-screen"] h2'),
      ).toContainText("Settings");
      await expect(page.getByText("Configure your player")).toBeVisible();

      // Check player section
      await expect(
        page.locator('[data-testid="player-section"] h3'),
      ).toBeVisible();

      // Check provider sections
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
      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

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
            { steps: 5 },
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
      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      // Should have provider status buttons
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
      // Override viewport for landscape test
      await page.setViewportSize({ width: 1024, height: 768 });

      // Open settings
      const settingsButton = page.locator('[data-testid="settings-button"]');
      await settingsButton.click();

      // Settings should still be visible and functional
      await expect(
        page.getByRole("heading", { name: "Settings", exact: true }),
      ).toBeVisible();

      // Close button should work
      const closeButton = page.locator('[data-testid="close-settings-button"]');
      await closeButton.click();

      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });
  });

  test.describe("Overlay Navigation Flow", () => {
    test("should navigate between settings, search, and lyrics", async ({
      page,
    }) => {
      // Verify we're on lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="search-screen"]'),
      ).not.toBeVisible();

      // Open settings using keyboard shortcut 'C'
      await page.keyboard.press("c");
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Settings", exact: true }),
      ).toBeVisible();

      // Open search using keyboard shortcut 'S' (settings should close)
      await page.keyboard.press("s");
      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Search Lyrics" }),
      ).toBeVisible();

      // Close search and verify we're back to lyrics
      const closeButton = page.locator('[data-testid="close-search-button"]');
      await closeButton.click();

      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="search-screen"]'),
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();
    });
  });
});
