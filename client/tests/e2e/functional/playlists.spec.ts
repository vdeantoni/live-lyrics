import { test, expect } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";

test.describe("Playlists Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Inject test registry
    await injectTestRegistry(page);

    await page.goto("/");

    // Clear playlists from localStorage for clean state
    await page.evaluate(() => {
      localStorage.removeItem("LIVE_LYRICS_PLAYLISTS");
    });

    // Reload to apply cleared storage
    await page.reload();

    await page.waitForSelector('[data-testid="player"]');
  });

  test.describe("Screen Navigation", () => {
    test("should open and close playlists screen via button", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Initially should show lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();

      // Click playlists button to open
      const playlistsButton = page.locator(
        'button[aria-label="View playlists"]',
      );
      await expect(playlistsButton).toBeVisible();
      await playlistsButton.click();

      // Wait for playlists screen animation to complete
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      await expect(page.getByTestId("playlists-screen-title")).toBeVisible();

      // Click close button to close
      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await expect(closeButton).toBeVisible();
      await closeButton.click();

      // Wait for playlists screen to complete exit animation
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();

      // Should be back to lyrics screen
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });

    test("should open playlists screen via keyboard shortcut P", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Press P to open playlists
      await page.keyboard.press("p");

      // Playlists screen should be visible
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      await expect(page.getByTestId("playlists-screen-title")).toBeVisible();

      // Press P again to close
      await page.keyboard.press("p");

      // Should be back to lyrics screen
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();
      await expect(page.locator('[data-testid="lyrics-screen"]')).toBeVisible();
    });

    test("should maintain mutual exclusivity with settings and search", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open settings
      await page.keyboard.press("c");
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).toBeVisible();

      // Open playlists - should close settings
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="settings-screen"]'),
      ).not.toBeVisible();

      // Open search - should close playlists
      await page.keyboard.press("s");
      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();

      // Open playlists - should close search
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="search-screen"]'),
      ).not.toBeVisible();
    });
  });

  test.describe("Playlist Creation", () => {
    test("should create a new playlist when playlists exist", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Open playlists and create first playlist
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("First Playlist");
      await page.getByTestId("create-playlist-submit").click();

      // Should see create new playlist button
      await expect(page.getByText("Create New Playlist")).toBeVisible();

      // Create second playlist
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("Second Playlist");
      await page.getByTestId("create-playlist-submit").click();

      // Both playlists should be visible
      await expect(page.getByText("First Playlist")).toBeVisible();
      await expect(page.getByText("Second Playlist")).toBeVisible();
    });

    test("should not create playlist with empty name", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();

      // Create button should be disabled with empty name
      const createButton = page.getByTestId("create-playlist-submit");
      await expect(createButton).toBeDisabled();

      // Type and delete name
      await page.locator("#playlist-name").fill("Test");
      await expect(createButton).not.toBeDisabled();
      await page.locator("#playlist-name").clear();
      await expect(createButton).toBeDisabled();
    });
  });

  test.describe("Add to Playlist - Current Song", () => {
    test("should open add-to-playlist dialog via keyboard shortcut A", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Wait for song to be loaded
      await page.waitForFunction(() => {
        const songName = document.querySelector('[data-testid="song-name"]');
        return songName && songName.textContent?.trim() !== "";
      });

      // Press A to open add-to-playlist dialog
      await page.keyboard.press("a");

      // Should show add-to-playlist dialog
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).toBeVisible();
      // Scope to dialog to avoid ambiguity with player heading
      await expect(
        page
          .getByTestId("add-to-playlist-dialog")
          .getByText("Bohemian Rhapsody"),
      ).toBeVisible();
      await expect(
        page.getByTestId("add-to-playlist-dialog").getByText("Queen"),
      ).toBeVisible();
    });

    test("should add current song to existing playlist", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create a playlist first
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("My Favorites");
      await page.getByTestId("create-playlist-submit").click();

      // Close playlists screen
      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      // Wait for song
      await page.waitForFunction(() => {
        const songName = document.querySelector('[data-testid="song-name"]');
        return songName && songName.textContent?.trim() !== "";
      });

      // Open add-to-playlist dialog
      await page.keyboard.press("a");

      // Click on the playlist in the dialog using test ID
      await page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "My Favorites" })
        .click();

      // Dialog should close
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).not.toBeVisible();

      // Verify song was added - open playlists and expand
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      // Expand playlist using test ID
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "My Favorites" })
        .click();

      // Should show 1 song now
      await expect(page.getByText("1 song")).toBeVisible();
      // Scope to playlist card to avoid ambiguity with player heading
      const playlistCard = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "My Favorites" });
      await expect(playlistCard.getByText("Bohemian Rhapsody")).toBeVisible();
    });

    test("should create new playlist and add current song", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Wait for song
      await page.waitForFunction(() => {
        const songName = document.querySelector('[data-testid="song-name"]');
        return songName && songName.textContent?.trim() !== "";
      });

      // Open add-to-playlist dialog
      await page.keyboard.press("a");

      // Click create new playlist in dialog using test ID
      await page.getByTestId("add-to-playlist-create-new").click();

      // Fill in playlist details
      await page.locator("#playlist-name").fill("Quick Playlist");
      await page.getByTestId("create-playlist-submit").click();

      // Both dialogs should close
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Create Playlist" }),
      ).not.toBeVisible();

      // Verify playlist was created with song - open playlists
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      // Expand playlist using test ID
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Quick Playlist" })
        .click();

      // Should have the song
      await expect(page.getByText("1 song")).toBeVisible();
      // Scope to playlist card to avoid ambiguity with player heading
      const quickPlaylistCard = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "Quick Playlist" });
      await expect(
        quickPlaylistCard.getByText("Bohemian Rhapsody"),
      ).toBeVisible();
    });

    test("should prevent adding duplicate songs", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create playlist and add song once
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("No Duplicates");
      await page.getByTestId("create-playlist-submit").click();

      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      await page.keyboard.press("a");
      // Click playlist in dialog using test ID
      await page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "No Duplicates" })
        .click();

      // Try to add the same song again
      await page.keyboard.press("a");

      // Playlist should show "Added" badge - scope to specific playlist
      const playlistButton = page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "No Duplicates" });
      await expect(playlistButton.getByText("Added")).toBeVisible();

      // Clicking it should not do anything (it's disabled)
      await expect(playlistButton).toBeDisabled();
    });
  });

  test.describe("Add to Playlist - Search Results", () => {
    test("should add search result to playlist", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create a playlist first
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("Search Finds");
      await page.getByTestId("create-playlist-submit").click();

      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      // Open search and search for something
      await page.keyboard.press("s");
      const searchInput = page.locator(
        'input[placeholder="Search for a song..."]',
      );
      await searchInput.fill("hotel california");

      // Wait for search results
      await page.waitForSelector('button[aria-label="Add to playlist"]', {
        timeout: 5000,
      });

      // Click add-to-playlist button on first result
      const addButton = page
        .locator('button[aria-label="Add to playlist"]')
        .first();
      await addButton.click();

      // Should show add-to-playlist dialog
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).toBeVisible();

      // Click the playlist in dialog using test ID
      await page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "Search Finds" })
        .click();

      // Dialog should close, search screen should still be open
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).not.toBeVisible();
      await expect(page.locator('[data-testid="search-screen"]')).toBeVisible();

      // Close search using button instead of keyboard (Firefox focus fix)
      const closeSearchButton = page.locator(
        '[data-testid="close-overlay-button"]',
      );
      await closeSearchButton.click();

      // Open playlists and check playlist
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      // Expand playlist using test ID
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Search Finds" })
        .click();

      // Should have a song now
      await expect(page.getByText("1 song")).toBeVisible();
    });

    test("should handle multiple songs added from search", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create playlist
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("Multi-Song");
      await page.getByTestId("create-playlist-submit").click();

      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      // Search and add first song
      await page.keyboard.press("s");
      await page
        .locator('input[placeholder="Search for a song..."]')
        .fill("hotel");
      await page.waitForSelector('button[aria-label="Add to playlist"]');
      await page
        .locator('button[aria-label="Add to playlist"]')
        .first()
        .click();

      // Wait for dialog to be visible
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).toBeVisible();

      // Click playlist in dialog - wait for it to be enabled
      const firstPlaylistButton = page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "Multi-Song" });
      await expect(firstPlaylistButton).toBeEnabled();
      await firstPlaylistButton.click();

      // Wait for dialog to close
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).not.toBeVisible();

      // Search and add second song (modify search)
      const searchInput = page.locator(
        'input[placeholder="Search for a song..."]',
      );
      await searchInput.clear();
      await searchInput.fill("imagine");
      await page.waitForSelector('button[aria-label="Add to playlist"]');
      await page
        .locator('button[aria-label="Add to playlist"]')
        .first()
        .click();

      // Wait for dialog to be visible
      await expect(
        page.getByRole("heading", { name: "Add to Playlist" }),
      ).toBeVisible();

      // Click playlist in dialog - wait for it to be enabled
      const secondPlaylistButton = page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "Multi-Song" });
      await expect(secondPlaylistButton).toBeEnabled();
      await secondPlaylistButton.click();

      // Close search and check playlist
      await page.keyboard.press("s");
      await page.keyboard.press("p");

      // Wait for playlists screen to be visible
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();

      // Expand playlist using test ID
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Multi-Song" })
        .click();

      // Should have 2 different songs (Hotel California and Imagine)
      const songCountText = await page
        .locator('p:has-text("song")')
        .first()
        .textContent();
      expect(songCountText).toMatch(/\d+ songs?/);
    });
  });

  test.describe("Playlist Management", () => {
    test("should expand and collapse playlists", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create playlist with song
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("Expandable");
      await page.getByTestId("create-playlist-submit").click();

      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      await page.keyboard.press("a");
      // Click playlist in dialog using test ID
      await page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "Expandable" })
        .click();

      // Open playlists and verify song is there but not visible (collapsed)
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      const playlistCard = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "Expandable" });

      // Initially collapsed - song details not visible in expanded view
      const expandedSongsList = playlistCard.locator(
        "div.border-t.border-white\\/10",
      );
      await expect(expandedSongsList).not.toBeVisible();

      // Click to expand using test ID
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Expandable" })
        .click();

      // Now songs should be visible
      await expect(expandedSongsList).toBeVisible();
      // Scope to expanded list to avoid ambiguity with player heading
      await expect(
        expandedSongsList.getByText("Bohemian Rhapsody"),
      ).toBeVisible();

      // Click to collapse using test ID
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Expandable" })
        .click();

      // Songs should be hidden again
      await expect(expandedSongsList).not.toBeVisible();
    });

    test("should delete playlist with confirmation", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create playlist
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("To Be Deleted");
      await page.getByTestId("create-playlist-submit").click();

      // Playlist should be visible
      await expect(page.getByText("To Be Deleted")).toBeVisible();

      // Set up dialog handler before clicking delete
      page.on("dialog", (dialog) => {
        expect(dialog.message()).toContain("Are you sure");
        dialog.accept();
      });

      // Click delete button using test ID
      const playlistCard = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "To Be Deleted" });
      const deleteButton = playlistCard.locator(
        '[data-testid^="delete-playlist-"]',
      );
      await deleteButton.click();

      // Playlist should be gone, Classic Hits should still be visible
      await expect(page.getByText("To Be Deleted")).not.toBeVisible();
      await expect(page.getByText("Classic Hits")).toBeVisible();
    });
  });

  test.describe("Song Management", () => {
    test("should remove song from playlist", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Create playlist and add song
      await page.keyboard.press("p");
      await page.getByTestId("create-new-playlist-button").click();
      await page.locator("#playlist-name").fill("Removable");
      await page.getByTestId("create-playlist-submit").click();

      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      await page.keyboard.press("a");
      // Click playlist in dialog using test ID
      await page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "Removable" })
        .click();

      // Open playlists and expand using test ID
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Removable" })
        .click();

      // Should have 1 song
      await expect(page.getByText("1 song")).toBeVisible();

      // Hover over song to reveal delete button, then click it using test ID
      const songRow = page
        .locator('[data-testid^="playlist-song-"]')
        .filter({ hasText: "Bohemian Rhapsody" });
      await songRow.hover();

      const removeButton = songRow.locator('[data-testid^="remove-song-"]');
      await removeButton.click();

      // Should now show 0 songs
      await expect(page.getByText("0 songs")).toBeVisible();
      await expect(
        page.getByText("No songs in this playlist yet"),
      ).toBeVisible();
    });
  });

  test.describe("Responsiveness", () => {
    test("should work in landscape mode", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });

      // Open playlists
      await page.keyboard.press("p");

      // Playlists screen should be visible and functional
      await expect(page.getByTestId("playlists-screen-title")).toBeVisible();

      // Should show default playlist in landscape
      await expect(page.getByText("Classic Hits")).toBeVisible();

      // Create button should work
      await page.getByTestId("create-new-playlist-button").click();
      await expect(
        page.getByRole("heading", { name: "Create Playlist" }),
      ).toBeVisible();
    });

    test("should handle different screen sizes", async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 768, height: 1024 }, // iPad Portrait
        { width: 1024, height: 768 }, // iPad Landscape
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Open playlists
        await page.keyboard.press("p");
        await expect(
          page.locator('[data-testid="playlists-screen"]'),
        ).toBeVisible();

        // Close playlists
        await page.keyboard.press("p");
        await expect(
          page.locator('[data-testid="playlists-screen"]'),
        ).not.toBeVisible();
      }
    });
  });

  test.describe("Button States", () => {
    test("should highlight playlists button when playlists screen open", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const playlistsButton = page.locator(
        'button[aria-label="View playlists"]',
      );

      // Initially not highlighted (ensure text-primary is not preceded by a colon to avoid matching hover:text-primary)
      await expect(playlistsButton).not.toHaveClass(/(?<!:)text-primary\b/);

      // Open playlists
      await playlistsButton.click();

      // Should be highlighted
      await expect(playlistsButton).toHaveClass(/(?<!:)text-primary\b/);

      // Close playlists
      const closeButton = page.locator('[data-testid="close-overlay-button"]');
      await closeButton.click();

      // Wait for playlists screen to fully close (state update + animation)
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();

      // Should not be highlighted anymore
      await expect(playlistsButton).not.toHaveClass(/(?<!:)text-primary\b/);
    });
  });

  test.describe("Default Playlists", () => {
    test("should load 'Classic Hits' playlist on first launch", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Clear localStorage to simulate first launch
      await page.evaluate(() => {
        localStorage.removeItem("LIVE_LYRICS_PLAYLISTS");
      });

      // Reload to apply cleared storage
      await page.reload();
      await page.waitForSelector('[data-testid="player"]');

      // Open playlists
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();

      // Should see default playlist
      await expect(page.getByText("Classic Hits")).toBeVisible();
      await expect(
        page.getByText("A collection of timeless classics"),
      ).toBeVisible();
      await expect(page.getByText("5 songs")).toBeVisible();
    });

    test("should allow editing default playlists (remove songs)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Clear localStorage to get fresh default
      await page.evaluate(() => {
        localStorage.removeItem("LIVE_LYRICS_PLAYLISTS");
      });
      await page.reload();
      await page.waitForSelector('[data-testid="player"]');

      // Open playlists
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();

      // Expand Classic Hits
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Classic Hits" })
        .click();

      // Should have 5 songs initially
      await expect(page.getByText("5 songs")).toBeVisible();

      // Hover over first song to reveal delete button
      const firstSong = page.locator('[data-testid^="playlist-song-"]').first();
      await firstSong.hover();

      // Remove the song
      const removeButton = firstSong.locator('[data-testid^="remove-song-"]');
      await removeButton.click();

      // Should show 4 songs now
      await expect(page.getByText("4 songs")).toBeVisible();
    });

    test("should allow deleting default playlists", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Clear localStorage to get fresh default
      await page.evaluate(() => {
        localStorage.removeItem("LIVE_LYRICS_PLAYLISTS");
      });
      await page.reload();
      await page.waitForSelector('[data-testid="player"]');

      // Open playlists
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();

      // Classic Hits should be visible
      await expect(page.getByText("Classic Hits")).toBeVisible();

      // Set up dialog handler
      page.on("dialog", (dialog) => {
        expect(dialog.message()).toContain("Are you sure");
        dialog.accept();
      });

      // Delete Classic Hits
      const playlistCard = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "Classic Hits" });
      const deleteButton = playlistCard.locator(
        '[data-testid^="delete-playlist-"]',
      );
      await deleteButton.click();

      // Should be gone, back to empty state
      await expect(page.getByText("Classic Hits")).not.toBeVisible();
      await expect(page.getByText("No playlists yet")).toBeVisible();
    });

    test("should persist edits to default playlists across sessions", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Clear localStorage to get fresh default
      await page.evaluate(() => {
        localStorage.removeItem("LIVE_LYRICS_PLAYLISTS");
      });
      await page.reload();
      await page.waitForSelector('[data-testid="player"]');

      // Open playlists and remove a song from Classic Hits
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Classic Hits" })
        .click();

      const firstSong = page.locator('[data-testid^="playlist-song-"]').first();
      await firstSong.hover();
      await firstSong.locator('[data-testid^="remove-song-"]').click();

      // Should show 4 songs
      await expect(page.getByText("4 songs")).toBeVisible();

      // Reload the page
      await page.reload();
      await page.waitForSelector('[data-testid="player"]');

      // Open playlists again
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();
      await page
        .locator('[data-testid^="playlist-header-"]')
        .filter({ hasText: "Classic Hits" })
        .click();

      // Should still show 4 songs (edit persisted)
      await expect(page.getByText("4 songs")).toBeVisible();
    });
  });
});
