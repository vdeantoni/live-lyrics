import { test, expect, type Page } from "@playwright/test";
import { injectTestRegistry } from "../helpers/injectTestRegistry";
import { setupPlayerWithSong } from "../helpers/testPlayerHelpers";

// Helper functions to reduce duplication
const openPlaylistsScreen = async (page: Page) => {
  await page.keyboard.press("p");
  await expect(page.locator('[data-testid="playlists-screen"]')).toBeVisible();
};

const closeOverlay = async (page: Page) => {
  await page.locator('[data-testid="close-overlay-button"]').click();
};

const createPlaylist = async (
  page: Page,
  name: string,
  description?: string,
) => {
  await page.getByTestId("create-new-playlist-button").click();
  await page.locator("#playlist-name").fill(name);
  if (description) {
    await page.locator("#playlist-description").fill(description);
  }
  await page.getByTestId("create-playlist-submit").click();
};

const expandPlaylist = async (page: Page, playlistName: string) => {
  await page
    .locator('[data-testid^="playlist-header-"]')
    .filter({ hasText: playlistName })
    .click();
};

const addCurrentSongToPlaylist = async (page: Page, playlistName: string) => {
  await page.keyboard.press("a");
  await page
    .locator('[data-testid^="add-to-playlist-item-"]')
    .filter({ hasText: playlistName })
    .click();
};

test.describe("Playlists Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await injectTestRegistry(page);
    await page.goto("/");

    // Clear storage for clean state
    await page.evaluate(() => {
      localStorage.removeItem("LIVE_LYRICS_PLAYLISTS");
    });
    await page.reload();

    // Setup player with test song
    await setupPlayerWithSong(page);
  });

  test.describe("Screen Navigation", () => {
    test("should open and close via keyboard shortcut (P)", async ({
      page,
    }) => {
      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();

      await page.keyboard.press("p");
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();
    });

    test("should open and close via button", async ({ page }) => {
      const playlistsButton = page.locator(
        'button[aria-label="View playlists"]',
      );
      await playlistsButton.click();
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).toBeVisible();

      await closeOverlay(page);
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();
    });

    test("should be mutually exclusive with settings and search", async ({
      page,
    }) => {
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
    });

    test("should highlight button when open", async ({ page }) => {
      const playlistsButton = page.locator(
        'button[aria-label="View playlists"]',
      );

      await expect(playlistsButton).not.toHaveClass(/(?<!:)text-primary\b/);

      await playlistsButton.click();
      await expect(playlistsButton).toHaveClass(/(?<!:)text-primary\b/);

      await closeOverlay(page);
      await expect(
        page.locator('[data-testid="playlists-screen"]'),
      ).not.toBeVisible();
      await expect(playlistsButton).not.toHaveClass(/(?<!:)text-primary\b/);
    });
  });

  test.describe("Playlist Creation", () => {
    test("should create multiple playlists", async ({ page }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "First Playlist");
      await createPlaylist(page, "Second Playlist");

      await expect(page.getByText("First Playlist")).toBeVisible();
      await expect(page.getByText("Second Playlist")).toBeVisible();
    });

    test("should not allow empty playlist name", async ({ page }) => {
      await openPlaylistsScreen(page);
      await page.getByTestId("create-new-playlist-button").click();

      const createButton = page.getByTestId("create-playlist-submit");
      await expect(createButton).toBeDisabled();

      await page.locator("#playlist-name").fill("Test");
      await expect(createButton).not.toBeDisabled();

      await page.locator("#playlist-name").clear();
      await expect(createButton).toBeDisabled();
    });
  });

  test.describe("Add to Playlist", () => {
    test("should add current song to existing playlist via keyboard (A)", async ({
      page,
    }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "My Favorites");
      await closeOverlay(page);

      await addCurrentSongToPlaylist(page, "My Favorites");

      await openPlaylistsScreen(page);
      await expandPlaylist(page, "My Favorites");
      await expect(page.getByText("1 song")).toBeVisible();

      const expandedList = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "My Favorites" })
        .locator("div.border-t.border-white\\/10");
      await expect(expandedList.getByText("Bohemian Rhapsody")).toBeVisible();
    });

    test("should create new playlist and add song in one flow", async ({
      page,
    }) => {
      await page.keyboard.press("a");
      await page.getByTestId("add-to-playlist-create-new").click();
      await page.locator("#playlist-name").fill("Quick Add");
      await page.getByTestId("create-playlist-submit").click();

      await openPlaylistsScreen(page);
      await expandPlaylist(page, "Quick Add");
      await expect(page.getByText("1 song")).toBeVisible();

      // Scope to the expanded playlist to avoid player heading
      const expandedList = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "Quick Add" })
        .locator("div.border-t.border-white\\/10");
      await expect(expandedList.getByText("Bohemian Rhapsody")).toBeVisible();
    });

    test("should prevent duplicate songs", async ({ page }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "No Dupes");
      await closeOverlay(page);

      await addCurrentSongToPlaylist(page, "No Dupes");
      await page.keyboard.press("a");

      const playlistItem = page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "No Dupes" });
      await expect(playlistItem.getByText("Added")).toBeVisible();
      await expect(playlistItem).toBeDisabled();
    });

    test("should add song from search results", async ({ page }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "Search Results");
      await closeOverlay(page);

      await page.keyboard.press("s");
      await page
        .locator('input[placeholder="Search for a song..."]')
        .fill("hotel california");

      await page.waitForSelector('button[aria-label="Add to playlist"]');
      await page
        .locator('button[aria-label="Add to playlist"]')
        .first()
        .click();

      await page
        .locator('[data-testid^="add-to-playlist-item-"]')
        .filter({ hasText: "Search Results" })
        .click();

      await closeOverlay(page);
      await openPlaylistsScreen(page);
      await expandPlaylist(page, "Search Results");
      await expect(page.getByText("1 song")).toBeVisible();
    });
  });

  test.describe("Playlist Management", () => {
    test("should expand and collapse playlists", async ({ page }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "Toggle Test");
      await closeOverlay(page);
      await addCurrentSongToPlaylist(page, "Toggle Test");

      await openPlaylistsScreen(page);
      const expandedList = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "Toggle Test" })
        .locator("div.border-t.border-white\\/10");

      await expect(expandedList).not.toBeVisible();

      await expandPlaylist(page, "Toggle Test");
      await expect(expandedList).toBeVisible();
      await expect(expandedList.getByText("Bohemian Rhapsody")).toBeVisible();

      await expandPlaylist(page, "Toggle Test");
      await expect(expandedList).not.toBeVisible();
    });

    test("should delete playlist immediately", async ({ page }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "Delete Me");
      await expect(page.getByText("Delete Me")).toBeVisible();

      const deleteButton = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "Delete Me" })
        .locator('[data-testid^="delete-playlist-"]');
      await deleteButton.click();

      await expect(page.getByText("Delete Me")).not.toBeVisible();
    });

    test("should remove song from playlist", async ({ page }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "Remove Song");
      await closeOverlay(page);
      await addCurrentSongToPlaylist(page, "Remove Song");

      await openPlaylistsScreen(page);
      await expandPlaylist(page, "Remove Song");
      await expect(page.getByText("1 song")).toBeVisible();

      const songRow = page
        .locator('[data-testid^="playlist-song-"]')
        .filter({ hasText: "Bohemian Rhapsody" });
      await songRow.hover();

      const removeButton = songRow.locator('[data-testid^="remove-song-"]');
      await removeButton.click();

      await expect(songRow).not.toBeVisible();
      await expect(
        page.getByText("No songs in this playlist yet"),
      ).toBeVisible();
    });

    test("should play all songs from playlist", async ({ page }) => {
      await openPlaylistsScreen(page);
      await createPlaylist(page, "Play All Test");
      await closeOverlay(page);
      await addCurrentSongToPlaylist(page, "Play All Test");

      await openPlaylistsScreen(page);
      await expandPlaylist(page, "Play All Test");

      const playAllButton = page
        .locator('[data-testid^="playlist-card-"]')
        .filter({ hasText: "Play All Test" })
        .locator('[data-testid^="play-all-"]');
      await expect(playAllButton).toBeVisible();
      await playAllButton.click();

      // Verify player updated (song should still be Bohemian Rhapsody in this case)
      await expect(
        page.getByRole("heading", { name: "Bohemian Rhapsody" }),
      ).toBeVisible();
    });
  });

  test.describe("Default Playlists", () => {
    test("should load default playlists on init", async ({ page }) => {
      await openPlaylistsScreen(page);
      await expect(page.getByText("Classic Hits")).toBeVisible();
      await expect(
        page.getByText("A collection of timeless classics"),
      ).toBeVisible();
      await expect(page.getByText("5 songs")).toBeVisible();
    });

    test("should allow editing default playlists", async ({ page }) => {
      await openPlaylistsScreen(page);
      await expandPlaylist(page, "Classic Hits");
      await expect(page.getByText("5 songs")).toBeVisible();

      const firstSong = page.locator('[data-testid^="playlist-song-"]').first();
      await firstSong.hover();
      await firstSong.locator('[data-testid^="remove-song-"]').click();

      await expect(page.getByText("4 songs")).toBeVisible();
    });

    test("should persist edits across sessions", async ({ page }) => {
      await openPlaylistsScreen(page);
      await expandPlaylist(page, "Classic Hits");

      const firstSong = page.locator('[data-testid^="playlist-song-"]').first();
      await firstSong.hover();
      await firstSong.locator('[data-testid^="remove-song-"]').click();
      await expect(page.getByText("4 songs")).toBeVisible();

      await page.reload();
      await openPlaylistsScreen(page);
      await expandPlaylist(page, "Classic Hits");
      await expect(page.getByText("4 songs")).toBeVisible();
    });

    test("should allow deleting all playlists", async ({ page }) => {
      await openPlaylistsScreen(page);

      const playlistCards = page.locator('[data-testid^="playlist-card-"]');
      const initialCount = await playlistCards.count();

      for (let i = 0; i < initialCount; i++) {
        await page
          .locator('[data-testid^="playlist-card-"]')
          .first()
          .locator('[data-testid^="delete-playlist-"]')
          .click();

        await expect(playlistCards).toHaveCount(initialCount - i - 1);
      }

      await expect(page.getByText("No playlists yet")).toBeVisible();
    });
  });

  test.describe("Responsiveness", () => {
    test("should work in landscape mode", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await openPlaylistsScreen(page);

      await expect(page.getByTestId("playlists-screen-title")).toBeVisible();
      await expect(page.getByText("Classic Hits")).toBeVisible();

      await page.getByTestId("create-new-playlist-button").click();
      await expect(
        page.getByRole("heading", { name: "Create Playlist" }),
      ).toBeVisible();
    });
  });
});
