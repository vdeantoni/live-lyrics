import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  updateCoreAppStateAtom,
  effectiveLyricsProvidersAtom,
  effectiveArtworkProvidersAtom,
} from "@/atoms/appState";
import { useAtomValue } from "jotai";
import { initializeEventHandlers } from "@/core/services/eventHandlers";
import {
  useEventSync,
  usePlayerControlSync,
  usePlayerSync,
  useLyricsSync,
  useArtworkSync,
  useProviderStatus,
} from "@/adapters/react";

/**
 * Central bootstrap hook that orchestrates all app initialization:
 * 1. Initializes event handlers
 * 2. Sets up event-to-atom synchronization
 * 3. Initializes player, lyrics, and artwork sync
 * 4. Checks provider availability
 * 5. Manages app loading state
 *
 * This hook centralizes all initialization logic, keeping App.tsx simple and focused on rendering.
 */
export const useBootstrap = () => {
  const setAppState = useSetAtom(updateCoreAppStateAtom);
  const lyricsProviders = useAtomValue(effectiveLyricsProvidersAtom);
  const artworkProviders = useAtomValue(effectiveArtworkProvidersAtom);
  const hasBootstrapped = useRef(false);

  // Initialize event handlers once
  useEffect(() => {
    initializeEventHandlers();
  }, []);

  // Initialize event-driven architecture
  useEventSync(); // Sync events to atoms
  usePlayerControlSync(); // Handle player control events
  usePlayerSync(); // Poll/subscribe to player state
  useLyricsSync(); // Fetch lyrics with caching
  useArtworkSync(); // Fetch artwork with caching
  useProviderStatus(); // Check provider availability

  // Bootstrap app state
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
