import type {
  LyricsProviderRegistryEntry,
  LyricsProvider,
} from "@/types/settings";

/**
 * Registry for available lyrics providers
 */
class LyricsProviderRegistry {
  private entries = new Map<string, LyricsProviderRegistryEntry>();

  /**
   * Register a lyrics provider
   */
  register(entry: LyricsProviderRegistryEntry): void {
    this.entries.set(entry.id, entry);
  }

  /**
   * Get a lyrics provider by ID
   */
  get(id: string): LyricsProvider | null {
    const entry = this.entries.get(id);
    return entry ? entry.factory() : null;
  }

  /**
   * Get all available lyrics providers
   */
  getAll(): LyricsProviderRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Check if a lyrics provider is registered
   */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Get available lyrics providers with their availability status
   */
  async getAvailable(): Promise<
    Array<LyricsProviderRegistryEntry & { isAvailable: boolean }>
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
 * Global lyrics provider registry instance
 */
export const lyricsProviderRegistry = new LyricsProviderRegistry();
