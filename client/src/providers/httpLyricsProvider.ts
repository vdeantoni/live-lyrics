import type { Song } from "@/types";
import type { LyricsProvider } from "@/types";

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
 * HTTP-based lyrics provider that first tries local server, then falls back to LrcLib API
 */
export class HttpLyricsProvider implements LyricsProvider {
  private localServerUrl: string;
  private lrcLibUrl: string;

  constructor(
    localServerUrl: string = "http://127.0.0.1:4000",
    lrcLibUrl: string = "https://lrclib.net/api",
  ) {
    this.localServerUrl = localServerUrl;
    this.lrcLibUrl = lrcLibUrl;
  }

  async getLyrics(song: Song): Promise<string | null> {
    if (!song.name || !song.artist) {
      return null;
    }

    // First try to get lyrics from local server
    try {
      const localResponse = await fetch(`${this.localServerUrl}/lyrics`);
      if (localResponse.ok) {
        const lyrics = await localResponse.text();
        if (lyrics && lyrics.trim()) {
          console.log("Got lyrics from local server");
          return lyrics;
        }
      }
    } catch (error) {
      console.log("Local server lyrics not available, trying LrcLib:", error);
    }

    // Fallback to LrcLib API
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

  getId(): string {
    return "http-lrclib";
  }

  getName(): string {
    return "HTTP Server + LrcLib";
  }

  getDescription(): string {
    return "Fetches lyrics from local server first, then falls back to LrcLib API";
  }

  async supportsLyrics(song: Song): Promise<boolean> {
    // LrcLib supports most songs if they have name and artist
    return !!(song.name && song.artist);
  }

  async isAvailable(): Promise<boolean> {
    // Check if either local server or LrcLib is available
    try {
      const localCheck = await fetch(`${this.localServerUrl}/music`, {
        method: "HEAD",
      });
      if (localCheck.ok) return true;
    } catch {
      // Local server not available, ignore error
    }

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
