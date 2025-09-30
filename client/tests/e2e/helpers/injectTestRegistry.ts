import type { Page } from "@playwright/test";
import { createSerializableTestRegistry } from "../../helpers/testRegistryFactory";

/**
 * Inject a test registry into the browser window for E2E tests
 * This allows E2E tests to use mock providers instead of real API calls
 *
 * **Default Test Behavior:**
 * - **Lyrics**: Only returns lyrics for "Bohemian Rhapsody" by "Queen", null for all other songs
 * - **Artwork**: Always returns empty array (no artwork available)
 * - **Player Sources**: Local player enabled, remote player disabled
 */
export const injectTestRegistry = async (page: Page) => {
  await page.addInitScript((registryData: Record<string, unknown>) => {
    // Reconstruct the test registry from serializable data
    const testRegistry = new Map();

    Object.entries(registryData).forEach(([id, entry]: [string, unknown]) => {
      const newEntry = { ...entry } as Record<string, unknown>;

      // Reconstruct the load function based on provider type
      if (
        (entry as Record<string, unknown>).config._testProviderType === "lyrics"
      ) {
        newEntry.config.load = async () => ({
          getId: () => (entry as Record<string, unknown>).config.id,
          getName: () => (entry as Record<string, unknown>).config.name,
          isAvailable: () => Promise.resolve(true),
          getLyrics: async (song: { name: string; artist: string }) => {
            // Only return lyrics for "Bohemian Rhapsody" by "Queen"
            if (
              song.name.toLowerCase().includes("bohemian rhapsody") &&
              song.artist.toLowerCase().includes("queen")
            ) {
              return BOHEMIAN_RHAPSODY_LYRICS;
            }
            return null;
          },
        });
      } else if (
        (entry as Record<string, unknown>).config._testProviderType ===
        "artwork"
      ) {
        newEntry.config.load = async () => ({
          getId: () => (entry as Record<string, unknown>).config.id,
          getName: () => (entry as Record<string, unknown>).config.name,
          isAvailable: () => Promise.resolve(true),
          getArtwork: async () => [],
        });
      } else if (
        (entry as Record<string, unknown>).config._testProviderType ===
        "player-source"
      ) {
        newEntry.config.load = async () => ({
          getId: () => (entry as Record<string, unknown>).config.id,
          getName: () => (entry as Record<string, unknown>).config.name,
          isAvailable: () => Promise.resolve(true),
        });
      }

      // Clean up the test-specific property
      delete (newEntry.config as Record<string, unknown>)._testProviderType;

      testRegistry.set(id, newEntry);
    });

    // Inject into window for App.tsx to pick up
    (
      window as unknown as { __TEST_REGISTRY__: Map<string, unknown> }
    ).__TEST_REGISTRY__ = testRegistry;
  }, createSerializableTestRegistry());
};

/**
 * Create a custom test registry with specific configuration
 * Useful for testing specific scenarios
 */
export const injectCustomTestRegistry = async (
  page: Page,
  customConfig: Partial<TestRegistryConfig>,
) => {
  await page.addInitScript((registryData: Record<string, unknown>) => {
    // Same reconstruction logic as above
    const testRegistry = new Map();

    Object.entries(registryData).forEach(([id, entry]: [string, unknown]) => {
      const newEntry = { ...entry } as Record<string, unknown>;

      if (
        (entry as Record<string, unknown>).config._testProviderType === "lyrics"
      ) {
        newEntry.config.load = async () => ({
          getId: () => (entry as Record<string, unknown>).config.id,
          getName: () => (entry as Record<string, unknown>).config.name,
          isAvailable: () =>
            Promise.resolve(
              (entry as Record<string, unknown>).status.isAvailable,
            ),
          getLyrics: async (song: { name: string; artist: string }) => {
            if (
              song.name.toLowerCase().includes("bohemian rhapsody") &&
              song.artist.toLowerCase().includes("queen")
            ) {
              return BOHEMIAN_RHAPSODY_LYRICS;
            }
            return null;
          },
        });
      } else if (
        (entry as Record<string, unknown>).config._testProviderType ===
        "artwork"
      ) {
        newEntry.config.load = async () => ({
          getId: () => (entry as Record<string, unknown>).config.id,
          getName: () => (entry as Record<string, unknown>).config.name,
          isAvailable: () =>
            Promise.resolve(
              (entry as Record<string, unknown>).status.isAvailable,
            ),
          getArtwork: async () => [],
        });
      } else if (
        (entry as Record<string, unknown>).config._testProviderType ===
        "player-source"
      ) {
        newEntry.config.load = async () => ({
          getId: () => (entry as Record<string, unknown>).config.id,
          getName: () => (entry as Record<string, unknown>).config.name,
          isAvailable: () =>
            Promise.resolve(
              (entry as Record<string, unknown>).status.isAvailable,
            ),
        });
      }

      delete (newEntry.config as Record<string, unknown>)._testProviderType;
      testRegistry.set(id, newEntry);
    });

    (
      window as unknown as { __TEST_REGISTRY__: Map<string, unknown> }
    ).__TEST_REGISTRY__ = testRegistry;
  }, createSerializableTestRegistry(customConfig));
};
