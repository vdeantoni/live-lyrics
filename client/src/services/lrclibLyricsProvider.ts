import type { Song } from "@/types";
import type { LyricsProvider } from "@/types";
import { isEnhancedLrc } from "@/utils/lyricsNormalizer";

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
  private _isFetching: boolean = false;

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

  /**
   * Enhanced selection algorithm to find the best track match
   * Rules: 1) Enhanced LRC, 2) Regular LRC, 3) Plain text
   * Tiebreakers: closest duration, then most lines
   */
  private selectBestTrack(
    tracks: LRCLibTrack[],
    songDuration: number,
  ): LRCLibTrack | null {
    // Filter tracks that have any lyrics
    const tracksWithLyrics = tracks.filter(
      (track) =>
        (track.syncedLyrics && track.syncedLyrics.trim()) ||
        (track.plainLyrics && track.plainLyrics.trim()),
    );

    if (tracksWithLyrics.length === 0) {
      return null;
    }

    // If only one track, return it
    if (tracksWithLyrics.length === 1) {
      return tracksWithLyrics[0];
    }

    // Categorize tracks by lyrics type
    const enhancedLrcTracks = tracksWithLyrics.filter((track) =>
      isEnhancedLrc(track.syncedLyrics),
    );
    const regularLrcTracks = tracksWithLyrics.filter(
      (track) =>
        track.syncedLyrics &&
        track.syncedLyrics.trim() &&
        !isEnhancedLrc(track.syncedLyrics),
    );
    const plainTextTracks = tracksWithLyrics.filter(
      (track) =>
        (!track.syncedLyrics || !track.syncedLyrics.trim()) &&
        track.plainLyrics &&
        track.plainLyrics.trim(),
    );

    // Try each category in order of preference
    const candidates = [
      { tracks: enhancedLrcTracks, type: "Enhanced LRC" },
      { tracks: regularLrcTracks, type: "Regular LRC" },
      { tracks: plainTextTracks, type: "Plain text" },
    ];

    for (const { tracks: candidateTracks } of candidates) {
      if (candidateTracks.length === 0) continue;

      if (candidateTracks.length === 1) {
        return candidateTracks[0];
      }

      // Apply tiebreaker rules: closest duration, then most lines
      return this.applyTiebreakers(candidateTracks, songDuration);
    }

    return null;
  }

  /**
   * Apply tiebreaker rules to select the best track from candidates
   */
  private applyTiebreakers(
    tracks: LRCLibTrack[],
    songDuration: number,
  ): LRCLibTrack {
    // Sort by duration difference (ascending), then by line count (descending)
    return tracks.sort((a, b) => {
      const durationDiffA = this.calculateDurationDifference(
        a.duration,
        songDuration,
      );
      const durationDiffB = this.calculateDurationDifference(
        b.duration,
        songDuration,
      );

      if (durationDiffA !== durationDiffB) {
        return durationDiffA - durationDiffB;
      }

      // Duration is tied, compare line counts (higher is better)
      const linesA = this.countLrcLines(a.syncedLyrics || a.plainLyrics || "");
      const linesB = this.countLrcLines(b.syncedLyrics || b.plainLyrics || "");
      return linesB - linesA;
    })[0];
  }

  /**
   * Count the number of lyric lines (excluding metadata and empty lines)
   */
  private countLrcLines(lyrics: string): number {
    if (!lyrics) return 0;

    return lyrics.split("\n").filter((line) => {
      const trimmed = line.trim();
      // Count lines that have content after removing timestamps and metadata
      const withoutTimestamps = trimmed
        .replace(/^\[\d{2}:\d{2}\.\d{2}\]/, "")
        .trim();
      const withoutMetadata = withoutTimestamps
        .replace(/^\[[\w\s:]+\]/, "")
        .trim();
      return withoutMetadata.length > 0;
    }).length;
  }

  /**
   * Calculate absolute duration difference in seconds
   */
  private calculateDurationDifference(
    trackDuration: number,
    songDuration: number,
  ): number {
    return Math.abs(trackDuration - songDuration);
  }

  /**
   * Get human-readable lyrics type for logging
   */
  private getLyricsType(track: LRCLibTrack): string {
    if (track.syncedLyrics && track.syncedLyrics.trim()) {
      return isEnhancedLrc(track.syncedLyrics) ? "Enhanced LRC" : "synced";
    }
    return "plain text";
  }

  async getLyrics(song: Song): Promise<string | null> {
    if (!song.name || !song.artist) {
      return null;
    }

    this._isFetching = true;
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

      console.log(`Found ${tracks.length} potential matches in LrcLib`);

      // Use enhanced selection algorithm to find the best match
      const bestTrack = this.selectBestTrack(tracks, song.duration);
      if (bestTrack) {
        const lyricsType = this.getLyricsType(bestTrack);
        const lyrics = bestTrack.syncedLyrics || bestTrack.plainLyrics;
        console.log(
          `Using ${lyricsType} lyrics from "${bestTrack.trackName}" by ${bestTrack.artistName}`,
        );
        return lyrics;
      }

      console.log("No lyrics found in any LrcLib tracks");
      return null;
    } catch (error) {
      console.error("Failed to fetch lyrics from LrcLib:", error);
      return null;
    } finally {
      this._isFetching = false;
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

  async isFetching(): Promise<boolean> {
    return this._isFetching;
  }

  async search(query: string): Promise<
    Array<{
      id: string;
      trackName: string;
      artistName: string;
      albumName: string;
      duration: number;
    }>
  > {
    if (!query.trim()) {
      return [];
    }

    try {
      const searchUrl = new URL(`${this.lrcLibUrl}/search`);
      searchUrl.searchParams.set("q", query);

      const response = await fetch(searchUrl.toString());

      if (!response.ok) {
        console.warn(`LrcLib search failed: ${response.status}`);
        return [];
      }

      const tracks: LRCLibTrack[] = await response.json();

      if (!Array.isArray(tracks)) {
        return [];
      }

      // Map LrcLib tracks to SearchResult format
      return tracks.map((track) => ({
        id: track.id.toString(),
        trackName: track.trackName,
        artistName: track.artistName,
        albumName: track.albumName,
        duration: track.duration,
      }));
    } catch (error) {
      console.error("Failed to search lyrics in LrcLib:", error);
      return [];
    }
  }
}
