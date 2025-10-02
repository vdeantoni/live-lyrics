import type { Song } from "@/types";
import type { ArtworkProvider } from "@/types";

/**
 * Unsplash artwork provider - fetches random images based on song metadata and time of day
 * Uses Unsplash's free API to get high-quality images
 */
export class UnsplashArtworkProvider implements ArtworkProvider {
  private readonly baseUrl = "https://source.unsplash.com";
  private readonly imageSize = "800x800";

  getId(): string {
    return "unsplash";
  }

  getName(): string {
    return "Unsplash";
  }

  getDescription(): string {
    return "Random high-quality images based on song mood and time of day";
  }

  /**
   * Get time-based keywords for more contextual image selection
   */
  private getTimeBasedKeywords(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "morning,sunrise,dawn";
    } else if (hour >= 12 && hour < 17) {
      return "afternoon,daylight,bright";
    } else if (hour >= 17 && hour < 21) {
      return "evening,sunset,dusk";
    } else {
      return "night,stars,moonlight";
    }
  }

  /**
   * Build search query from song metadata and time
   */
  private buildSearchQuery(song: Song): string {
    const keywords: string[] = [];

    // Add song-based keywords (use first word of song name as mood indicator)
    if (song.name) {
      const firstWord = song.name.split(" ")[0].toLowerCase();
      keywords.push(firstWord);
    }

    // Add artist name for more specific results
    if (song.artist) {
      const firstArtistWord = song.artist.split(" ")[0].toLowerCase();
      keywords.push(firstArtistWord);
    }

    // Add time-based ambiance
    keywords.push(this.getTimeBasedKeywords());

    // Add music-related keywords
    keywords.push("music", "abstract", "colorful");

    return keywords.join(",");
  }

  async getArtwork(song: Song): Promise<string[]> {
    try {
      const query = this.buildSearchQuery(song);

      // Unsplash Source API automatically redirects to a random image
      // We construct the URL with our search terms
      const artworkUrl = `${this.baseUrl}/${this.imageSize}/?${query}`;

      console.log(`Fetching Unsplash artwork with query: ${query}`);

      return [artworkUrl];
    } catch (error) {
      console.error("Failed to fetch artwork from Unsplash:", error);
      return [];
    }
  }

  async supportsArtwork(song: Song): Promise<boolean> {
    // Unsplash can provide artwork for any song since it uses generic search
    return !!(song.name || song.artist);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test Unsplash availability with a simple HEAD request
      const response = await fetch(`${this.baseUrl}/100x100/?test`, {
        method: "HEAD",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async isFetching(): Promise<boolean> {
    // Unsplash provider doesn't maintain persistent fetching state
    // Images are loaded directly by the browser
    return false;
  }
}
