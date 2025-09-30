import type { ProviderRegistryEntry } from "@/atoms/settingsAtoms";
import {
  createTestRegistry as createTestRegistryFactory,
  type TestRegistryConfig,
} from "./testRegistryFactory";

/**
 * Factory function to create a test provider registry with consistent test data
 * This ensures all tests use the same mock data structure
 *
 * @returns Map containing mock providers for lyrics, artwork, and player sources
 *
 * **Default Test Behavior:**
 * - **Lyrics**: Only returns lyrics for "Bohemian Rhapsody" by "Queen", null for all other songs
 * - **Artwork**: Always returns empty array (no artwork available)
 * - **Player Sources**: Local player enabled, remote player disabled
 *
 * @example
 * ```typescript
 * import { createTestRegistry } from "./testRegistry";
 * import { renderWithProviders } from "./testUtils";
 *
 * // Basic usage - creates registry with default mock data
 * const testRegistry = createTestRegistry();
 * // Lyrics: Only "Bohemian Rhapsody" by "Queen" supported
 * // Artwork: Empty array (no artwork)
 * // Players: Local (enabled), Remote (disabled)
 *
 * // Modify registry for specific test scenarios
 * const customRegistry = createTestRegistry();
 * customRegistry.get("lrclib")!.status.isAvailable = false;
 * customRegistry.get("lrclib")!.userPreferences.isEnabled = false;
 *
 * await renderWithProviders(<MyComponent />, { testRegistry: customRegistry });
 * ```
 *
 * @example
 * ```typescript
 * // Testing bootstrap directly with proper imports
 * import { render, screen, waitFor } from "@testing-library/react";
 * import { Provider as JotaiProvider, useAtomValue } from "jotai";
 * import { useBootstrap } from "@/hooks/useBootstrap";
 * import { appStateAtom } from "@/atoms/settingsAtoms";
 * import { createTestRegistry } from "./testRegistry";
 *
 * const TestComponent = () => {
 *   const testRegistry = createTestRegistry();
 *   useBootstrap(testRegistry);
 *   const appState = useAtomValue(appStateAtom);
 *
 *   return (
 *     <div>
 *       {appState.isLoading && <div data-testid="loading">Loading</div>}
 *       {appState.isReady && <div data-testid="ready">Ready</div>}
 *     </div>
 *   );
 * };
 *
 * render(
 *   <JotaiProvider>
 *     <TestComponent />
 *   </JotaiProvider>
 * );
 *
 * await waitFor(() => {
 *   expect(screen.getByTestId("ready")).toBeInTheDocument();
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom configuration for specific test scenarios
 * const customRegistry = createTestRegistry({
 *   lyricsProviders: [
 *     {
 *       id: "lrclib",
 *       name: "LrcLib",
 *       description: "Community lyrics database",
 *       priority: 1,
 *       isEnabled: true,
 *       isAvailable: false, // Test unavailable provider
 *     }
 *   ]
 * });
 * ```
 */
export const createTestRegistry = (
  customConfig?: Partial<TestRegistryConfig>,
): Map<string, ProviderRegistryEntry> => {
  return createTestRegistryFactory(customConfig);
};

// Re-export for convenience
export { type TestRegistryConfig } from "./testRegistryFactory";
