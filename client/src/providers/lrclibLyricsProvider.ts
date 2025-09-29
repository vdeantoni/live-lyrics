import type { Song } from "@/lib/api";
import type { LyricsProvider } from "@/types/settings";

interface LRCLibTrack {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

/**
 * Pure LrcLib lyrics provider
 */
export class LrclibLyricsProvider implements LyricsProvider {
  private lrcLibUrl: string;

  constructor(lrcLibUrl: string = "https://lrclib.net/api") {
    this.lrcLibUrl = lrcLibUrl;
  }

  getId(): string {
    return "lrclib";
  }

  getName(): string {
    return "LrcLib";
  }

  getDescription(): string {
    return "Community-driven lyrics database with synchronized lyrics support";
  }

  async getLyrics(song: Song): Promise<string | null> {
    if (!song.name || !song.artist) {
      return null;
    }

    try {
      const searchUrl = new URL(`${this.lrcLibUrl}/search`);
      searchUrl.searchParams.set("track_name", song.name);
      searchUrl.searchParams.set("artist_name", song.artist);
      if (song.album) {
        searchUrl.searchParams.set("album_name", song.album);
      }

      const response = await fetch(searchUrl.toString());

      if (!response.ok) {
        console.warn(`LrcLib search failed: ${response.status}`);
        return null;
      }

      const tracks: LRCLibTrack[] = await response.json();

      if (!Array.isArray(tracks) || tracks.length === 0) {
        console.log(
          "No lyrics found in LrcLib for:",
          song.name,
          "by",
          song.artist,
        );
        return null;
      }

      // Find the best match (first one for now, could implement better matching)
      const track = tracks[0];
      console.log(
        "Found lyrics in LrcLib for:",
        track.trackName,
        "by",
        track.artistName,
      );

      // Prefer synced lyrics, fall back to plain lyrics
      return track.syncedLyrics || track.plainLyrics || null;
    } catch (error) {
      console.error("Failed to fetch lyrics from LrcLib:", error);
      return null;
    }
  }

  async supportsLyrics(song: Song): Promise<boolean> {
    // LrcLib supports most songs if they have name and artist
    return !!(song.name && song.artist);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.lrcLibUrl}/search?track_name=test&artist_name=test`,
        {
          method: "HEAD",
        },
      );
      return response.ok || response.status === 404; // 404 is fine, means API is working
    } catch {
      return false;
    }
  }
}
