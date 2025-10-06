import type { Page } from "@playwright/test";

/**
 * Test player helpers for E2E tests
 * With fully reactive architecture, tests only need to emit events directly
 */

export interface TestSongData {
  name?: string;
  artist?: string;
  album?: string;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
}

/**
 * Load a test song by emitting player.song.add and play/pause events
 * Uses the event-driven architecture to properly load songs into the player
 *
 * @param page Playwright page object
 * @param songData Song data to load (defaults to Bohemian Rhapsody paused)
 */
export async function loadTestSong(
  page: Page,
  songData: TestSongData = {},
): Promise<void> {
  console.log("[loadTestSong] Starting - waiting for event bus...");

  // Wait for event bus to be ready
  await page.waitForFunction(
    () => {
      const eventBus = (
        window as Window & {
          __EVENT_BUS__?: { emit?: (event: unknown) => void };
        }
      ).__EVENT_BUS__;
      return eventBus?.emit !== undefined;
    },
    { timeout: 10000 },
  );

  console.log("[loadTestSong] Event bus ready - waiting for UI...");

  // Wait for the app UI to be rendered
  await page.waitForSelector(
    '[data-testid="empty-screen"], [data-testid="player"]',
  );

  console.log("[loadTestSong] UI ready - emitting player.song.add...");

  // Emit player.song.add event to load the song into the player
  await page.evaluate((data) => {
    const eventBus = (
      window as Window & {
        __EVENT_BUS__?: { emit?: (event: unknown) => void };
      }
    ).__EVENT_BUS__;

    if (!eventBus?.emit) {
      console.error("[loadTestSong] Event bus not found!");
      throw new Error("Event bus not found on window");
    }

    const song = {
      name: data.name || "Bohemian Rhapsody",
      artist: data.artist || "Queen",
      album: data.album || "A Night at the Opera",
      currentTime: data.currentTime ?? 0,
      duration: data.duration ?? 355,
      isPlaying: false, // Add always creates paused song initially
    };

    console.log("[loadTestSong] Adding song to player:", song);

    // Add the song to the player
    eventBus.emit({
      type: "player.song.add",
      payload: { songs: [song] },
    });

    console.log("[loadTestSong] Song added successfully");
  }, songData);

  // Wait a bit for the add to process
  await page.waitForTimeout(100);

  console.log("[loadTestSong] Setting play state...");

  // Set play/pause state
  const isPlaying = songData.isPlaying ?? false;
  await page.evaluate((playing) => {
    const eventBus = (
      window as Window & {
        __EVENT_BUS__?: { emit?: (event: unknown) => void };
      }
    ).__EVENT_BUS__;

    if (!eventBus?.emit) {
      throw new Error("Event bus not found on window");
    }

    if (playing) {
      console.log("[loadTestSong] Emitting player.play");
      eventBus.emit({ type: "player.play" });
    } else {
      console.log("[loadTestSong] Emitting player.pause");
      eventBus.emit({ type: "player.pause" });
    }
  }, isPlaying);

  // Seek to specified time if non-zero
  if (songData.currentTime && songData.currentTime > 0) {
    console.log("[loadTestSong] Seeking to:", songData.currentTime);
    await page.evaluate((time) => {
      const eventBus = (
        window as Window & {
          __EVENT_BUS__?: { emit?: (event: unknown) => void };
        }
      ).__EVENT_BUS__;

      if (!eventBus?.emit) {
        throw new Error("Event bus not found on window");
      }

      console.log("[loadTestSong] Emitting player.seek");
      eventBus.emit({
        type: "player.seek",
        payload: { time },
      });
    }, songData.currentTime);
  }

  // Wait for UI to update with the song name
  const expectedName = songData.name || "Bohemian Rhapsody";
  console.log(`[loadTestSong] Waiting for "${expectedName}" in UI...`);

  await page.waitForFunction(
    (name) => {
      const songName = document.querySelector('[data-testid="song-name"]');
      const text = songName?.textContent;
      if (text !== undefined) {
        console.log(`[loadTestSong] Current song name: "${text}"`);
      }
      return songName && text?.includes(name);
    },
    expectedName,
    { timeout: 5000 },
  );

  // Wait for play button to be enabled (song fully loaded)
  console.log("[loadTestSong] Waiting for play button to be enabled...");
  await page.waitForFunction(
    () => {
      const playButton = document.querySelector(
        '[data-testid="play-pause-button"]',
      );
      return playButton && !(playButton as HTMLButtonElement).disabled;
    },
    { timeout: 5000 },
  );

  console.log("[loadTestSong] Song loaded successfully!");
}

/**
 * Helper to set up a standard test environment with a loaded song
 * Sets viewport to mobile portrait and loads Bohemian Rhapsody
 */
export async function setupPlayerWithSong(page: Page): Promise<void> {
  await page.setViewportSize({ width: 768, height: 1024 });
  await loadTestSong(page, {
    name: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    currentTime: 0,
    duration: 355,
    isPlaying: false,
  });
}
