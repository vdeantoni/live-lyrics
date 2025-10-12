import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalPlayer } from "@/providers/players/localPlayer";

describe("LocalPlayer - Queue System", () => {
  let player: LocalPlayer;

  beforeEach(() => {
    // Use getInstance to ensure we get the singleton
    player = LocalPlayer.getInstance();
  });

  afterEach(() => {
    player.cleanup();
  });

  describe("add() and queue management", () => {
    it("should add songs to queue and shift first to current when empty", async () => {
      // Player starts with no current song
      await player.clear();

      const song1 = {
        name: "Hotel California",
        artist: "Eagles",
        album: "Hotel California",
        duration: 391,
        currentTime: 0,
        isPlaying: false,
      };

      const song2 = {
        name: "Imagine",
        artist: "John Lennon",
        album: "Imagine",
        duration: 183,
        currentTime: 0,
        isPlaying: false,
      };

      // Add two songs
      await player.add(song1, song2);

      // First song should become current
      const currentSong = await player.getSong();
      expect(currentSong.name).toBe("Hotel California");

      // Second song should be in queue
      const queue = await player.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].name).toBe("Imagine");
    });

    it("should insert songs at beginning of queue when current exists", async () => {
      await player.clear();

      const song1 = {
        name: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 355,
        currentTime: 0,
        isPlaying: false,
      };

      const song2 = {
        name: "Stairway to Heaven",
        artist: "Led Zeppelin",
        album: "Led Zeppelin IV",
        duration: 482,
        currentTime: 0,
        isPlaying: false,
      };

      const song3 = {
        name: "Hotel California",
        artist: "Eagles",
        album: "Hotel California",
        duration: 391,
        currentTime: 0,
        isPlaying: false,
      };

      // Add first song (becomes current)
      await player.add(song1);

      // Add more songs (should go to front of queue)
      await player.add(song2, song3);

      const queue = await player.getQueue();
      expect(queue.length).toBe(2);
      expect(queue[0].name).toBe("Stairway to Heaven");
      expect(queue[1].name).toBe("Hotel California");
    });
  });

  describe("next() behavior", () => {
    it("should shift from queue to current when queue has songs", async () => {
      await player.clear();

      const songs = [
        {
          name: "Song 1",
          artist: "Artist 1",
          album: "Album 1",
          duration: 180,
          currentTime: 0,
          isPlaying: false,
        },
        {
          name: "Song 2",
          artist: "Artist 2",
          album: "Album 2",
          duration: 180,
          currentTime: 0,
          isPlaying: false,
        },
      ];

      await player.add(...songs);

      // Current should be Song 1
      let current = await player.getSong();
      expect(current.name).toBe("Song 1");

      // Call next - should shift Song 2 to current
      await player.next();

      current = await player.getSong();
      expect(current.name).toBe("Song 2");

      // Queue should be empty
      const queue = await player.getQueue();
      expect(queue.length).toBe(0);
    });

    it("should clear current and stop when queue is empty", async () => {
      await player.clear();

      const song = {
        name: "Last Song",
        artist: "Artist",
        album: "Album",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };

      await player.add(song);
      await player.play();

      // Call next with empty queue
      await player.next();

      // Current should be cleared
      const current = await player.getSong();
      expect(current.name).toBe("");
      expect(current.isPlaying).toBe(false);
    });
  });

  describe("previous() behavior", () => {
    it("should restart song when currentTime > 3 seconds", async () => {
      await player.clear();

      const song = {
        name: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };

      await player.add(song);
      await player.play();

      // Seek to 5 seconds
      await player.seek(5);

      // Call previous
      await player.previous();

      const current = await player.getSong();
      expect(current.currentTime).toBe(0); // Should restart
      expect(current.name).toBe("Test Song"); // Still same song
    });

    it("should pop from history when currentTime < 3 seconds", async () => {
      await player.clear();

      const song1 = {
        name: "First Song",
        artist: "Artist",
        album: "Album",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };

      const song2 = {
        name: "Second Song",
        artist: "Artist",
        album: "Album",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };

      await player.add(song1, song2);

      // Advance to next song (moves song1 to history)
      await player.next();

      // Current should be song2
      let current = await player.getSong();
      expect(current.name).toBe("Second Song");

      // Seek to 2 seconds (< 3)
      await player.seek(2);

      // Call previous - should go back to song1
      await player.previous();

      current = await player.getSong();
      expect(current.name).toBe("First Song");
    });
  });

  describe("clear()", () => {
    it("should clear queue and current song", async () => {
      const songs = [
        {
          name: "Song 1",
          artist: "Artist",
          album: "Album",
          duration: 180,
          currentTime: 0,
          isPlaying: false,
        },
        {
          name: "Song 2",
          artist: "Artist",
          album: "Album",
          duration: 180,
          currentTime: 0,
          isPlaying: false,
        },
      ];

      await player.add(...songs);

      await player.clear();

      const queue = await player.getQueue();
      const current = await player.getSong();

      expect(queue.length).toBe(0);
      expect(current.name).toBe("");
    });
  });

  describe("settings", () => {
    it("should allow getting and setting playOnAdd", async () => {
      const settings = await player.getSettings();
      expect(settings.playOnAdd).toBe(false); // Default

      await player.setSettings({ playOnAdd: true });

      const updatedSettings = await player.getSettings();
      expect(updatedSettings.playOnAdd).toBe(true);
    });

    it("should allow getting and setting timeOffsetInMs", async () => {
      const settings = await player.getSettings();
      expect(settings.timeOffsetInMs).toBe(0); // Default

      await player.setSettings({ timeOffsetInMs: 500 });

      const updatedSettings = await player.getSettings();
      expect(updatedSettings.timeOffsetInMs).toBe(500);
    });

    it("should allow setting negative timeOffsetInMs", async () => {
      await player.setSettings({ timeOffsetInMs: -300 });

      const settings = await player.getSettings();
      expect(settings.timeOffsetInMs).toBe(-300);
    });

    it("should auto-play when playOnAdd is true", async () => {
      await player.clear();
      await player.setSettings({ playOnAdd: true });

      const song = {
        name: "Auto Play Song",
        artist: "Artist",
        album: "Album",
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      };

      await player.add(song);

      const current = await player.getSong();
      expect(current.isPlaying).toBe(true);
    });
  });

  describe("null state handling", () => {
    it("should handle getSong() when no current song", async () => {
      await player.clear();

      const song = await player.getSong();
      expect(song.name).toBe("");
      expect(song.duration).toBe(0);
    });

    it("should no-op play() when no current song", async () => {
      await player.clear();

      await player.play(); // Should not throw

      const song = await player.getSong();
      expect(song.isPlaying).toBe(false);
    });

    it("should no-op seek() when no current song", async () => {
      await player.clear();

      await player.seek(10); // Should not throw

      const song = await player.getSong();
      expect(song.currentTime).toBe(0);
    });
  });
});
