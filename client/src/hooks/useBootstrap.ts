import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  updateCoreAppStateAtom,
  effectiveLyricsProvidersAtom,
  effectiveArtworkProvidersAtom,
} from "@/atoms/appState";
import { useAtomValue } from "jotai";

/**
 * Simple bootstrap hook that:
 * 1. Initializes the app state
 * 2. Updates app loading state so components can wait on it
 *
 * Note: Provider setup is now handled by the Jotai atoms directly.
 * Tests can use providerAPI.replaceAll() before rendering.
 */
export const useBootstrap = () => {
  const setAppState = useSetAtom(updateCoreAppStateAtom);
  const lyricsProviders = useAtomValue(effectiveLyricsProvidersAtom);
  const artworkProviders = useAtomValue(effectiveArtworkProvidersAtom);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    const bootstrap = async () => {
      try {
        setAppState({ isLoading: true, isReady: false });

        // Wait a tick for provider atoms to be populated
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Mark app as ready
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
  }, [setAppState, lyricsProviders, artworkProviders]);
};
