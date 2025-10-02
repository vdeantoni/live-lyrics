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
  ): Promise<string[]> {
    console.log("[LoremPicsum] getArtwork() called");
    try {
      const imageSize = this.getOptimalImageSize();
      console.log("[LoremPicsum] Calculated image size:", imageSize);

      // Lorem Picsum provides random images by size
      // Adding a random query parameter ensures we get different images each time
      const randomSeed = Math.random();
      const artworkUrl = `${this.baseUrl}/${imageSize}/${imageSize}?random=${randomSeed}`;

      console.log(
        `Fetching Lorem Picsum image at ${imageSize}x${imageSize} (viewport: ${window.innerWidth}x${window.innerHeight}, DPR: ${window.devicePixelRatio})`,
      );
      console.log("[LoremPicsum] Generated URL:", artworkUrl);

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
    console.log("[LoremPicsum] Checking availability...");
    try {
      // Test Lorem Picsum availability with a simple HEAD request
      const response = await fetch(`${this.baseUrl}/100/100`, {
        method: "HEAD",
      });
      const available = response.ok;
      console.log("[LoremPicsum] Available:", available);
      return available;
    } catch (error) {
      console.error("[LoremPicsum] Availability check failed:", error);
      return false;
    }
  }

  async isFetching(): Promise<boolean> {
    // Lorem Picsum provider doesn't maintain persistent fetching state
    // Images are loaded directly by the browser
    return false;
  }
}
