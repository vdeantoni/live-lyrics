import type { Song } from "@/types";
import type { ArtworkProvider } from "@/types";

/**
 * Lorem Picsum artwork provider - provides random high-quality placeholder images
 * Uses Lorem Picsum's free API (no authentication required)
 */
export class UnsplashArtworkProvider implements ArtworkProvider {
  private readonly baseUrl = "https://picsum.photos";

  getId(): string {
    return "unsplash";
  }

  getName(): string {
    return "Random Images";
  }

  getDescription(): string {
    return "Random high-quality images for visual variety";
  }

  /**
   * Calculate optimal image size based on viewport dimensions and pixel density
   */
  private getOptimalImageSize(): number {
    // Get the larger viewport dimension
    const maxDimension = Math.max(window.innerWidth, window.innerHeight);

    // Account for device pixel ratio (Retina displays)
    const pixelRatio = window.devicePixelRatio || 1;
    const targetSize = maxDimension * pixelRatio;

    // Round up to nearest 200px for better caching
    const roundedSize = Math.ceil(targetSize / 200) * 200;

    // Cap at 2000px to avoid unnecessarily large images
    return Math.min(roundedSize, 2000);
  }

  async getArtwork(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _song: Song,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signal?: AbortSignal,
  ): Promise<string[]> {
    try {
      const imageSize = this.getOptimalImageSize();

      // Lorem Picsum provides random images by size
      // Adding a random query parameter ensures we get different images each time
      const randomSeed = Math.random();
      const artworkUrl = `${this.baseUrl}/${imageSize}/${imageSize}?random=${randomSeed}`;

      console.log(
        `Fetching Lorem Picsum image at ${imageSize}x${imageSize} (viewport: ${window.innerWidth}x${window.innerHeight}, DPR: ${window.devicePixelRatio})`,
      );

      return [artworkUrl];
    } catch (error) {
      console.error("Failed to fetch artwork from Lorem Picsum:", error);
      return [];
    }
  }

  async supportsArtwork(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _song: Song,
  ): Promise<boolean> {
    // Lorem Picsum can provide artwork for any song
    return true;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Lorem Picsum doesn't support HEAD requests (returns 405)
      // Test with a small GET request instead
      const response = await fetch(
        `${this.baseUrl}/50/50?random=${Date.now()}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        console.warn(
          `[LoremPicsum] Availability check returned ${response.status}: ${response.statusText}`,
        );
        return false;
      }

      console.log("[LoremPicsum] Provider is available");
      return true;
    } catch (error) {
      console.error(
        "[LoremPicsum] Availability check failed:",
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  async isFetching(): Promise<boolean> {
    // Lorem Picsum provider doesn't maintain persistent fetching state
    // Images are loaded directly by the browser
    return false;
  }
}
