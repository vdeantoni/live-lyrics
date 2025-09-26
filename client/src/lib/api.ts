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

const getSongId = (song: Song) => {
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
    refetchInterval: 300,
  });
};

export const useArtworks = (song: Song) => {
  return useQuery({
    queryKey: ["song", getSongId(song), "artworks"],
    queryFn: async (): Promise<Artwork[]> => {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          song.artist,
        )}+${encodeURIComponent(song.name)}&entity=song&limit=1`,
      );
      const json = await response.json();

      if (!json.results?.length) {
        return [];
      }

      return json.results.map((art: any) => ({
        url: art.artworkUrl100.replace("100x100bb", "1000x1000bb"),
      }));
    },
    staleTime: "static",
  });
};

export const useLyrics = (song: Song) => {
  return useQuery({
    queryKey: ["song", getSongId(song), "lyrics"],
    queryFn: async (): Promise<string> => {
      const response = await fetch(
        `https://lrclib.net/api/search?artist_name=${encodeURIComponent(
          song.artist,
        )}&track_name=${encodeURIComponent(song.name)}&album_name=${encodeURIComponent(song.album)}`,
      );
      const json = await response.json();

      console.log("json", json);
      if (!json?.length) {
        return "";
      }

      const albumMatch = json.find((item: any) => item.album === song.album);
      if (albumMatch && albumMatch.syncedLyrics) {
        return albumMatch.syncedLyrics;
      }

      const bestMatch = json.reduce((best: any, current: any) => {
        if (!current.syncedLyrics) return best;
        const currentDiff = Math.abs(song.duration - current.duration);
        const bestDiff = best
          ? Math.abs(song.duration - best.duration)
          : Infinity;
        return currentDiff < bestDiff ? current : best;
      }, null);

      if (bestMatch && bestMatch.syncedLyrics) {
        return bestMatch.syncedLyrics;
      }

      return "";
    },
    staleTime: "static",
  });
};
