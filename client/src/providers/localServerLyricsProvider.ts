import type { Song } from "@/lib/api";
import type { LyricsProvider } from "@/types/settings";

/**
 * Local server lyrics provider
 */
export class LocalServerLyricsProvider implements LyricsProvider {
  private serverUrl: string;

  constructor(serverUrl: string = "http://127.0.0.1:4000") {
    this.serverUrl = serverUrl;
  }

  getId(): string {
    return "local-server";
  }

  getName(): string {
    return "Local Server";
  }

  getDescription(): string {
    return "Lyrics from your local server";
  }

  async getLyrics(song: Song): Promise<string | null> {
    if (!song.name || !song.artist) {
      return null;
    }

    try {
      const response = await fetch(`${this.serverUrl}/lyrics`);
      if (response.ok) {
        const lyrics = await response.text();
        if (lyrics && lyrics.trim()) {
          console.log("Got lyrics from local server");
          return lyrics;
        }
      }
      return null;
    } catch (error) {
      console.log("Local server lyrics not available:", error);
      return null;
    }
  }

  async supportsLyrics(song: Song): Promise<boolean> {
    // Local server can potentially support any song
    return !!(song.name && song.artist);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/music`, {
        method: "HEAD",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
