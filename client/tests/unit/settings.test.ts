import { describe, it, expect } from "vitest";
import { LocalPlayer } from "@/providers/players/localPlayer";
import { RemotePlayer } from "@/providers/players/remotePlayer";
import { LrclibLyricsProvider } from "@/providers/lyrics/lrclibLyricsProvider";
import { ITunesArtworkProvider } from "@/providers/artwork/itunesArtworkProvider";

describe("Players", () => {
  it("should create local player instance", () => {
    const player = LocalPlayer.getInstance();
    expect(player.getId()).toBe("local");
    expect(player.getName()).toBe("Local");
    expect(player.getDescription()).toBe("Local player with queue management");
  });

  it("should create remote player instance", () => {
    const player = RemotePlayer.getInstance();
    expect(player.getId()).toBe("remote");
    expect(player.getName()).toBe("Remote");
    expect(player.getDescription()).toBe("Remote player");
  });

  it("should have local player always available", async () => {
    const player = LocalPlayer.getInstance();
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
