import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalPlayer } from "@/services/localPlayer";

describe("LocalPlayer", () => {
  let player: LocalPlayer;

  beforeEach(() => {
    // Use getInstance to ensure we get the singleton
    player = LocalPlayer.getInstance();
  });

  afterEach(() => {
    player.cleanup();
  });

  describe("playSong() navigation", () => {
    it("should play next song in playlist after playSong()", async () => {
      // LocalPlayer has internal playlist: [Bohemian Rhapsody, Stairway to Heaven, Hotel California, ...]

      // Play "Hotel California" (index 2)
      await player.playSong({
        name: "Hotel California",
        artist: "Eagles",
        album: "Hotel California",
        duration: 391,
      });

      let song = await player.getSong();
      expect(song.name).toBe("Hotel California");
      expect(song.artist).toBe("Eagles");

      // Call next() - should play "Imagine" (index 3, the song after Hotel California)
      await player.next();

      song = await player.getSong();
      expect(song.name).toBe("Imagine");
      expect(song.artist).toBe("John Lennon");
    });

    it("should clear queue when playing song from playlist", async () => {
      // Create a queue
      await player.playQueue([
        {
          name: "Bohemian Rhapsody",
          artist: "Queen",
          album: "A Night at the Opera",
          duration: 355,
          currentTime: 0,
          isPlaying: false,
        },
        {
          name: "Imagine",
          artist: "John Lennon",
          album: "Imagine",
          duration: 183,
          currentTime: 0,
          isPlaying: false,
        },
      ]);

      // Playing Bohemian Rhapsody, next song in queue would be Imagine

      // Now play "Hotel California" from playlist
      await player.playSong({
        name: "Hotel California",
        artist: "Eagles",
        album: "Hotel California",
        duration: 391,
      });

      let song = await player.getSong();
      expect(song.name).toBe("Hotel California");

      // Call next() - should play "Imagine" from PLAYLIST (index 3),
      // NOT from queue (queue should be cleared)
      await player.next();

      song = await player.getSong();
      expect(song.name).toBe("Imagine");
      expect(song.artist).toBe("John Lennon");
      expect(song.album).toBe("Imagine"); // Album from playlist, confirms it's from playlist
    });

    it("should restart song when previous() called after 3 seconds", async () => {
      // Start from a known state
      await player.playSong({
        name: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 355,
      });

      await player.play();

      // Manually advance time by seeking to 5 seconds
      await player.seek(5);

      await player.previous();

      const song = await player.getSong();
      expect(song.currentTime).toBe(0); // Should restart current song
      expect(song.name).toBe("Bohemian Rhapsody"); // Still same song
    });

    it("should go to previous song when previous() called before 3 seconds", async () => {
      // Start at index 1 (Stairway to Heaven)
      await player.playSong({
        name: "Stairway to Heaven",
        artist: "Led Zeppelin",
        album: "Led Zeppelin IV",
        duration: 482,
      });

      await player.play();

      // Seek to only 2 seconds
      await player.seek(2);

      await player.previous();

      const song = await player.getSong();
      expect(song.name).toBe("Bohemian Rhapsody"); // Should go to previous song
    });
  });
});
