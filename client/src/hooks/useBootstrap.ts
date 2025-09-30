import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  appStateAtom,
  initializeRegistryAtom,
  checkProviderAvailabilityAtom,
  lyricsProvidersAtom,
  artworkProvidersAtom,
  type ProviderRegistryEntry,
} from "@/atoms/settingsAtoms";
import { useAtomValue } from "jotai";

/**
 * Simple bootstrap hook that:
 * 1. Initializes the provider registry
 * 2. Checks provider availability
 * 3. Updates app loading state so components can wait on it
 *
 * @param testRegistry - Optional test registry for unit tests
 */
export const useBootstrap = (
  testRegistry?: Map<string, ProviderRegistryEntry>,
) => {
  const setAppState = useSetAtom(appStateAtom);
  const initializeRegistry = useSetAtom(initializeRegistryAtom);
  const checkProviderAvailability = useSetAtom(checkProviderAvailabilityAtom);
  const lyricsProviders = useAtomValue(lyricsProvidersAtom);
  const artworkProviders = useAtomValue(artworkProvidersAtom);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    const bootstrap = async () => {
      try {
        setAppState({ isLoading: true, isReady: false });

        // 1. Initialize provider registry (with test data if provided)
        initializeRegistry(testRegistry);

        // Wait a tick for registry to be populated
        await new Promise((resolve) => setTimeout(resolve, 0));

        // 2. Check provider availability (skip in test mode)
        if (!testRegistry) {
          const allProviders = [...lyricsProviders, ...artworkProviders];
          allProviders.forEach((provider) => {
            checkProviderAvailability(provider.config.id);
          });

          // Check remote player
          checkProviderAvailability("remote");
        }

        // 3. Mark app as ready
        setAppState({ isLoading: false, isReady: true });
      } catch (error) {
        console.error("Bootstrap failed:", error);
        setAppState({
          isLoading: false,
          isReady: false,
          error: error instanceof Error ? error.message : "Bootstrap failed",
        });
      }
    };

    bootstrap();
  }, [
    setAppState,
    initializeRegistry,
    checkProviderAvailability,
    lyricsProviders,
    artworkProviders,
    testRegistry,
  ]);
};
