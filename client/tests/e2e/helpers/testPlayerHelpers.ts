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
 */
export async function loadTestSong(
  page: Page,
  songData: TestSongData = {},
): Promise<void> {
  console.log("[loadTestSong] Starting song load...");

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

  // Wait for the app UI to be rendered
  await page.waitForSelector(
    '[data-testid="empty-screen"], [data-testid="player"]',
  );

  // Emit player.song.add event to load the song into the player
  await page.evaluate((data) => {
    const eventBus = (
      window as Window & {
        __EVENT_BUS__?: { emit?: (event: unknown) => void };
      }
    ).__EVENT_BUS__;

    if (!eventBus?.emit) {
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

    // Add the song to the player
    eventBus.emit({
      type: "player.song.add",
      payload: { songs: [song] },
    });
  }, songData);

  // Wait a bit for the add to process
  await page.waitForTimeout(100);

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
      eventBus.emit({ type: "player.play" });
    } else {
      eventBus.emit({ type: "player.pause" });
    }
  }, isPlaying);

  // Seek to specified time if non-zero
  if (songData.currentTime && songData.currentTime > 0) {
    await page.evaluate((time) => {
      const eventBus = (
        window as Window & {
          __EVENT_BUS__?: { emit?: (event: unknown) => void };
        }
      ).__EVENT_BUS__;

      if (!eventBus?.emit) {
        throw new Error("Event bus not found on window");
      }

      eventBus.emit({
        type: "player.seek",
        payload: { time },
      });
    }, songData.currentTime);
  }

  // Wait for UI to update with the song name
  const expectedName = songData.name || "Bohemian Rhapsody";
  await page.waitForFunction(
    (name) => {
      const songName = document.querySelector('[data-testid="song-name"]');
      return songName && songName.textContent?.includes(name);
    },
    expectedName,
    { timeout: 10000 },
  );

  // Wait for play button to be enabled (song fully loaded)
  await page.waitForFunction(
    () => {
      const playButton = document.querySelector(
        '[data-testid="play-pause-button"]',
      );
      return playButton && !(playButton as HTMLButtonElement).disabled;
    },
    { timeout: 10000 },
  );

  console.log("[loadTestSong] Song loaded successfully");
}

/**
 * Helper to set up a standard test environment with a loaded song
 * Sets viewport to mobile portrait and loads Bohemian Rhapsody
 */
export async function setupPlayerWithSong(
  page: Page,
  waitForArtworkAndLyrics: boolean = false,
): Promise<void> {
  await page.setViewportSize({ width: 768, height: 1024 });
  await loadTestSong(page, {
    name: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    currentTime: 0,
    duration: 355,
    isPlaying: false,
  });

  if (waitForArtworkAndLyrics) {
    // Wait for lyrics screen to be visible first
    await page.waitForSelector('[data-testid="lyrics-screen"]', {
      timeout: 5000,
    });

    // Wait for artwork loading to complete (more generous timeout)
    await page.waitForSelector(
      '[data-testid="lyrics-screen"][data-artwork-loading="false"]',
      { timeout: 15000 },
    );

    // Wait for lyrics loading to complete (more generous timeout)
    await page.waitForSelector(
      '[data-testid="lyrics-screen"][data-lyrics-loading="false"]',
      { timeout: 15000 },
    );
  }
}
