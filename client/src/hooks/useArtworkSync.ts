import { useAtomValue, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  playerStateAtom,
  artworkUrlsAtom,
  artworkLoadingAtom,
} from "@/atoms/playerAtoms";
import { enabledArtworkProvidersAtom } from "@/atoms/appState";
import { loadArtworkProvider } from "@/config/providers";

/**
 * Hook that fetches artwork using enabled providers sequentially with per-provider caching
 * Uses QueryClient programmatically for granular provider-level cache control
 * Components should use artworkUrlsAtom and artworkLoadingAtom for state
 */
export const useArtworkSync = () => {
  const queryClient = useQueryClient();
  const playerState = useAtomValue(playerStateAtom);
  const enabledArtworkProviders = useAtomValue(enabledArtworkProvidersAtom);
  const setArtworkUrls = useSetAtom(artworkUrlsAtom);
  const setArtworkLoading = useSetAtom(artworkLoadingAtom);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If no providers enabled, clear state
    if (enabledArtworkProviders.length === 0) {
      setArtworkUrls([]);
      setArtworkLoading(false);
      return;
    }

    // If no song info, don't fetch
    if (!playerState.name || !playerState.artist) {
      setArtworkUrls([]);
      setArtworkLoading(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchArtwork = async () => {
      setArtworkLoading(true);

      try {
        // Try each provider sequentially, checking cache first
        for (const providerConfig of enabledArtworkProviders) {
          if (abortController.signal.aborted) break;

          const providerId = providerConfig.config.id;

          try {
            // Build cache key for this provider
            const queryKey = [
              "provider",
              providerId,
              playerState.name,
              playerState.artist,
              playerState.album,
            ];

            // Check cache first
            const cachedArtwork = queryClient.getQueryData<string[]>(queryKey);
            if (cachedArtwork && cachedArtwork.length > 0) {
              console.log(
                `Cache hit for provider "${providerId}" - returning cached artwork`,
              );
              setArtworkUrls(cachedArtwork);
              setArtworkLoading(false);
              return;
            }

            // Cache miss - fetch from provider
            console.log(
              `Cache miss for provider "${providerId}" - fetching from provider`,
            );

            const provider = await loadArtworkProvider(providerId);

            // Check if provider is available
            const isAvailable = await provider.isAvailable();
            if (!isAvailable) {
              console.warn(
                `Artwork provider "${providerId}" is not available, trying next...`,
              );
              continue;
            }

            // Check if provider is currently fetching
            const providerIsFetching = await provider.isFetching();
            if (providerIsFetching) {
              console.log(
                `Artwork provider "${providerId}" is currently fetching, waiting...`,
              );
              // Skip to next provider for now
              continue;
            }

            // Fetch and cache the result
            const artwork = await queryClient.fetchQuery({
              queryKey,
              queryFn: () =>
                provider.getArtwork(playerState, abortController.signal),
              staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year
              gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year
            });

            if (artwork && artwork.length > 0) {
              console.log(
                `Successfully got artwork from provider "${providerId}"`,
              );
              setArtworkUrls(artwork);
              setArtworkLoading(false);
              return;
            }

            console.log(
              `Provider "${providerId}" returned no artwork, trying next...`,
            );
          } catch (error) {
            console.error(
              `Failed to get artwork from provider "${providerId}":`,
              error,
            );
            // Continue to next provider
          }
        }

        // All providers failed
        console.warn(
          "All enabled artwork providers failed or returned empty results",
        );
        setArtworkUrls([]);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching artwork:", error);
          setArtworkUrls([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setArtworkLoading(false);
        }
      }
    };

    fetchArtwork();

    return () => {
      abortController.abort();
    };
  }, [
    playerState.name,
    playerState.artist,
    playerState.album,
    enabledArtworkProviders,
    queryClient,
    setArtworkUrls,
    setArtworkLoading,
    playerState,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
};
