import type { Song } from "@/lib/api";
import type { ArtworkProvider } from "@/types/musicSource";

interface iTunesSearchResult {
  resultCount: number;
  results: {
    artworkUrl100: string;
    [key: string]: unknown;
  }[];
}

/**
 * iTunes API artwork provider
 */
export class ITunesArtworkProvider implements ArtworkProvider {
  async getArtwork(song: Song): Promise<string[]> {
    if (!song.name || !song.artist) {
      return [];
    }

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          song.artist,
        )}+${encodeURIComponent(song.name)}&entity=song&limit=1`,
      );
      const json: iTunesSearchResult = await response.json();

      if (!json.results?.length) {
        return [];
      }

      return json.results.map((art) =>
        art.artworkUrl100.replace("100x100bb", "1000x1000bb"),
      );
    } catch (error) {
      console.error("Failed to fetch artwork from iTunes:", error);
      return [];
    }
  }

  getId(): string {
    return "itunes-artwork";
  }

  getName(): string {
    return "iTunes API";
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        "https://itunes.apple.com/search?term=test&limit=1",
        {
          method: "HEAD",
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
