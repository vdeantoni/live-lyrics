/**
 * Example usage of the consolidated test registry system
 *
 * This file demonstrates various ways to use the new testRegistryFactory
 * for both unit tests and E2E tests.
 */

import { createTestRegistry } from "../helpers/testRegistry";
import {
  injectTestRegistry,
  injectCustomTestRegistry,
} from "../e2e/helpers/injectTestRegistry";

// =============================================================================
// UNIT TEST EXAMPLES
// =============================================================================

/**
 * Example 1: Default registry (most common)
 * Uses standard test behavior for all providers
 */
export const exampleDefaultRegistry = () => {
  const registry = createTestRegistry();
  // Registry contains:
  // - Lyrics: lrclib (enabled), local-server (enabled) - only supports Bohemian Rhapsody
  // - Artwork: itunes (enabled) - returns empty array
  // - Players: local (enabled), remote (disabled)
  return registry;
};

/**
 * Example 2: Test unavailable providers
 * Simulates when a provider is down or unreachable
 */
export const exampleUnavailableProvider = () => {
  const registry = createTestRegistry({
    lyricsProviders: [
      {
        id: "lrclib",
        name: "LrcLib",
        description: "Community lyrics database",
        priority: 1,
        isEnabled: true,
        isAvailable: false, // ← Provider is down
      },
      {
        id: "local-server",
        name: "Local Server",
        description: "Local server",
        priority: 2,
        isEnabled: true,
        isAvailable: true, // ← Fallback provider works
      },
    ],
  });
  return registry;
};

/**
 * Example 3: Test disabled providers
 * Simulates user preference to disable certain providers
 */
export const exampleDisabledProvider = () => {
  const registry = createTestRegistry({
    lyricsProviders: [
      {
        id: "lrclib",
        name: "LrcLib",
        description: "Community lyrics database",
        priority: 1,
        isEnabled: false, // ← User disabled this provider
        isAvailable: true,
      },
      {
        id: "local-server",
        name: "Local Server",
        description: "Local server",
        priority: 2,
        isEnabled: true,
        isAvailable: true,
      },
    ],
  });
  return registry;
};

/**
 * Example 4: Test priority ordering
 * Simulates custom provider priority settings
 */
export const examplePriorityOrdering = () => {
  const registry = createTestRegistry({
    lyricsProviders: [
      {
        id: "lrclib",
        name: "LrcLib",
        description: "Community lyrics database",
        priority: 2, // ← Lower priority (higher number)
        isEnabled: true,
        isAvailable: true,
      },
      {
        id: "local-server",
        name: "Local Server",
        description: "Local server",
        priority: 1, // ← Higher priority (lower number)
        isEnabled: true,
        isAvailable: true,
      },
    ],
  });
  return registry;
};

/**
 * Example 5: Only Remote Player enabled
 * Tests scenarios where only remote player is active
 */
export const exampleRemotePlayerOnly = () => {
  const registry = createTestRegistry({
    playerSources: [
      {
        id: "local",
        name: "Local",
        description: "Local player",
        priority: 1,
        isEnabled: false, // ← Local disabled
        isAvailable: true,
      },
      {
        id: "remote",
        name: "Server",
        description: "Connect to a remote server",
        priority: 2,
        isEnabled: true, // ← Remote enabled
        isAvailable: true,
      },
    ],
  });
  return registry;
};

// =============================================================================
// E2E TEST EXAMPLES
// =============================================================================

/**
 * Example 6: Basic E2E test setup
 * Most E2E tests can use the default registry
 */
export const exampleE2EDefault = async (page: {
  goto: (url: string) => Promise<void>;
}) => {
  // Default registry - same behavior as unit tests
  await injectTestRegistry(page);

  await page.goto("/");
  // Test will use:
  // - Local player (enabled)
  // - Lyrics only for Bohemian Rhapsody
  // - No artwork
};

/**
 * Example 7: E2E test with custom configuration
 * Test specific provider scenarios in E2E
 */
export const exampleE2ECustom = async (page: {
  goto: (url: string) => Promise<void>;
}) => {
  // Custom configuration for this specific test
  await injectCustomTestRegistry(page, {
    lyricsProviders: [
      {
        id: "lrclib",
        name: "LrcLib",
        description: "Community lyrics database",
        priority: 1,
        isEnabled: true,
        isAvailable: false, // ← Test fallback behavior in E2E
      },
      {
        id: "local-server",
        name: "Local Server",
        description: "Local server",
        priority: 2,
        isEnabled: true,
        isAvailable: true,
      },
    ],
    playerSources: [
      {
        id: "local",
        name: "Local",
        description: "Local player",
        priority: 1,
        isEnabled: false,
        isAvailable: true,
      },
      {
        id: "remote",
        name: "Server",
        description: "Connect to a remote server",
        priority: 2,
        isEnabled: true, // ← Test remote player in E2E
        isAvailable: true,
      },
    ],
  });

  await page.goto("/");
  // Test will use remote player and fallback lyrics provider
};

// =============================================================================
// COMMON TEST PATTERNS
// =============================================================================

/**
 * Test Pattern: Provider Fallback Chain
 * Tests what happens when primary provider fails
 */
export const testProviderFallback = () => {
  const registry = createTestRegistry({
    lyricsProviders: [
      {
        id: "primary",
        name: "Primary Provider",
        description: "Main provider",
        priority: 1,
        isEnabled: true,
        isAvailable: false, // ← Primary fails
      },
      {
        id: "backup",
        name: "Backup Provider",
        description: "Fallback provider",
        priority: 2,
        isEnabled: true,
        isAvailable: true, // ← Backup works
      },
    ],
  });
  // Test should use backup provider
  return registry;
};

/**
 * Test Pattern: All Providers Disabled
 * Tests graceful degradation when no providers available
 */
export const testNoProvidersAvailable = () => {
  const registry = createTestRegistry({
    lyricsProviders: [
      {
        id: "lrclib",
        name: "LrcLib",
        description: "Community lyrics database",
        priority: 1,
        isEnabled: false, // ← All providers disabled
        isAvailable: true,
      },
    ],
    artworkProviders: [
      {
        id: "itunes",
        name: "iTunes",
        description: "iTunes Search API",
        priority: 1,
        isEnabled: false, // ← All providers disabled
        isAvailable: true,
      },
    ],
  });
  // Test should show "No lyrics found" / "No artwork" states
  return registry;
};
