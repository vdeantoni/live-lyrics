import { describe, it, expect } from "vitest";
import { LocalMusicPlayer } from "@/players/localMusicPlayer";
import { RemoteMusicPlayer } from "@/players/remoteMusicPlayer";
import { LrclibLyricsProvider } from "@/providers/lrclibLyricsProvider";
import { ITunesArtworkProvider } from "@/providers/itunesArtworkProvider";

describe("Music Players", () => {
  it("should create local music player instance", () => {
    const player = LocalMusicPlayer.getInstance();
    expect(player.getId()).toBe("local");
    expect(player.getName()).toBe("Local");
    expect(player.getDescription()).toBe("Local player");
  });

  it("should create remote music player instance", () => {
    const player = new RemoteMusicPlayer();
    expect(player.getId()).toBe("remote");
    expect(player.getName()).toBe("Remote");
    expect(player.getDescription()).toBe("Remote player");
  });

  it("should have local player always available", async () => {
    const player = LocalMusicPlayer.getInstance();
    const isAvailable = await player.isAvailable();
    expect(isAvailable).toBe(true);
  });
});

describe("Lyrics Providers", () => {
  it("should create LrcLib provider instance", () => {
    const provider = new LrclibLyricsProvider();
    expect(provider.getId()).toBe("lrclib");
    expect(provider.getName()).toBe("LrcLib");
  });

  it("should support lyrics with name and artist", async () => {
    const provider = new LrclibLyricsProvider();
    const song = {
      name: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      duration: 180,
      currentTime: 0,
      isPlaying: false,
    };

    const supports = await provider.supportsLyrics(song);
    expect(supports).toBe(true);
  });

  it("should not support lyrics without name or artist", async () => {
    const provider = new LrclibLyricsProvider();
    const song = {
      name: "",
      artist: "",
      album: "Test Album",
      duration: 180,
      currentTime: 0,
      isPlaying: false,
    };

    const supports = await provider.supportsLyrics(song);
    expect(supports).toBe(false);
  });
});

describe("Artwork Providers", () => {
  it("should create iTunes provider instance", () => {
    const provider = new ITunesArtworkProvider();
    expect(provider.getId()).toBe("itunes");
    expect(provider.getName()).toBe("iTunes");
    expect(provider.getDescription()).toContain("iTunes");
  });
});
