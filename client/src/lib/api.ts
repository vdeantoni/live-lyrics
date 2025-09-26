import { useQuery } from "@tanstack/react-query";

export type Song = {
  name: string;
  artist: string;
  album: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
};

export type Artwork = {
  url: string;
};

interface iTunesSearchResult {
  resultCount: number;
  results: {
    artworkUrl100: string;
    [key: string]: unknown;
  }[];
}

export interface WordData {
  index?: number;
  time: number;
  text: string;
}
export interface LineData {
  index?: number;
  time: number;
  text: string;
  words?: WordData[] | null;
}
export interface LyricsData {
  tags: TagsData;
  lines: LineData[];
  enhanced: boolean;
}
export interface TagsData {
  ar?: string;
  ti?: string;
  al?: string;
  au?: string;
  by?: string;
  length?: string;
  offset?: string;
  re?: string;
  ve?: string;
}

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

const getSongId = (song?: Song) => {
  if (!song) {
    return "";
  }

  return `${song.artist}-${song.name}-${song.album}-${song.duration}`;
};

export const useSong = () => {
  return useQuery({
    queryKey: ["song"],
    queryFn: async (): Promise<Song> => {
      const response = await fetch("http://127.0.0.1:4000/music");
      const json = await response.json();

      return {
        name: json.name,
        artist: json.artist,
        album: json.album,
        duration: json.duration,
        currentTime: parseFloat(json.currentTime || 0),
        isPlaying: json.playerState === "playing",
      };
    },
    refetchInterval: 300, // Keep the frequent polling for real-time sync
    staleTime: 0, // Always consider stale - refetch immediately
    gcTime: 0, // Don't cache in memory at all
  });
};

export const useArtworks = (song: Song) => {
  return useQuery({
    queryKey: ["song", getSongId(song), "artworks"],
    queryFn: async (): Promise<Artwork[]> => {
      if (!song) {
        return [];
      }

      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          song.artist,
        )}+${encodeURIComponent(song.name)}&entity=song&limit=1`,
      );
      const json: iTunesSearchResult = await response.json();

      if (!json.results?.length) {
        return [];
      }

      return json.results.map((art) => ({
        url: art.artworkUrl100.replace("100x100bb", "1000x1000bb"),
      }));
    },
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - artwork rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });
};

export const useLyrics = (song?: Song) => {
  return useQuery({
    queryKey: ["song", getSongId(song), "lyrics"],
    queryFn: async (): Promise<string> => {
      if (!song) {
        return "";
      }

      // First try the exact match API with track signature
      try {
        const exactResponse = await fetch(
          `https://lrclib.net/api/get?` +
            `artist_name=${encodeURIComponent(song.artist)}&` +
            `track_name=${encodeURIComponent(song.name)}&` +
            `album_name=${encodeURIComponent(song.album)}&` +
            `duration=${Math.round(song.duration)}`,
        );

        if (exactResponse.ok) {
          const exactResult: LRCLibTrack = await exactResponse.json();
          console.log("Exact match found:", exactResult);

          if (exactResult.syncedLyrics) {
            return exactResult.syncedLyrics;
          }

          // If no synced lyrics but has plain lyrics, return empty
          // (we need synced lyrics for our use case)
        }
      } catch (error) {
        console.log("Exact match failed, trying search fallback:", error);
      }

      // Fallback to search API (original implementation)
      const response = await fetch(
        `https://lrclib.net/api/search?artist_name=${encodeURIComponent(
          song.artist,
        )}&track_name=${encodeURIComponent(song.name)}&album_name=${encodeURIComponent(song.album)}`,
      );
      const json: LRCLibTrack[] = await response.json();

      console.log("Search results:", json);
      if (!json?.length) {
        return "";
      }

      const albumMatch = json.find(
        (item: LRCLibTrack) => item.albumName === song.album,
      );
      if (albumMatch && albumMatch.syncedLyrics) {
        return albumMatch.syncedLyrics;
      }

      const bestMatch = json.reduce(
        (best: LRCLibTrack | null, current: LRCLibTrack) => {
          if (!current.syncedLyrics) return best;
          const currentDiff = Math.abs(song.duration - current.duration);
          const bestDiff = best
            ? Math.abs(song.duration - best.duration)
            : Infinity;
          return currentDiff < bestDiff ? current : best;
        },
        null,
      );

      if (bestMatch && bestMatch.syncedLyrics) {
        return bestMatch.syncedLyrics;
      }

      return "";
    },
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year - lyrics rarely change
    gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year - keep in cache for a year
  });
};
