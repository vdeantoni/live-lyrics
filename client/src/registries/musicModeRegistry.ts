import type { MusicModeRegistryEntry, MusicMode } from "@/types/settings";

/**
 * Registry for available music modes
 */
class MusicModeRegistry {
  private entries = new Map<string, MusicModeRegistryEntry>();

  /**
   * Register a music mode
   */
  register(entry: MusicModeRegistryEntry): void {
    this.entries.set(entry.id, entry);
  }

  /**
   * Get a music mode by ID
   */
  get(id: string): MusicMode | null {
    const entry = this.entries.get(id);
    return entry ? entry.factory() : null;
  }

  /**
   * Get all available music modes
   */
  getAll(): MusicModeRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Check if a music mode is registered
   */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Get available music modes with their availability status
   */
  async getAvailable(): Promise<
    Array<MusicModeRegistryEntry & { isAvailable: boolean }>
  > {
    const entries = this.getAll();
    const results = await Promise.allSettled(
      entries.map(async (entry) => {
        const mode = entry.factory();
        const isAvailable = await mode.isAvailable();
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
 * Global music mode registry instance
 */
export const musicModeRegistry = new MusicModeRegistry();
