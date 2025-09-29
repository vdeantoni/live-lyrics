import type { ArtworkProviderRegistryEntry, ArtworkProvider } from "@/types";

/**
 * Registry for available artwork providers
 */
class ArtworkProviderRegistry {
  private entries = new Map<string, ArtworkProviderRegistryEntry>();

  /**
   * Register an artwork provider
   */
  register(entry: ArtworkProviderRegistryEntry): void {
    this.entries.set(entry.id, entry);
  }

  /**
   * Get an artwork provider by ID
   */
  get(id: string): ArtworkProvider | null {
    const entry = this.entries.get(id);
    return entry ? entry.factory() : null;
  }

  /**
   * Get all available artwork providers
   */
  getAll(): ArtworkProviderRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Check if an artwork provider is registered
   */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Get available artwork providers with their availability status
   */
  async getAvailable(): Promise<
    Array<ArtworkProviderRegistryEntry & { isAvailable: boolean }>
  > {
    const entries = this.getAll();
    const results = await Promise.allSettled(
      entries.map(async (entry) => {
        const provider = entry.factory();
        const isAvailable = await provider.isAvailable();
        return { ...entry, isAvailable };
      }),
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return { ...entries[index], isAvailable: false };
      }
    });
  }
}

/**
 * Global artwork provider registry instance
 */
export const artworkProviderRegistry = new ArtworkProviderRegistry();
