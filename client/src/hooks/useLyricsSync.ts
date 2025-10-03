import { useAtomValue, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  playerStateAtom,
  lyricsContentAtom,
  lyricsLoadingAtom,
  currentLyricsProviderAtom,
} from "@/atoms/playerAtoms";
import { enabledLyricsProvidersAtom } from "@/atoms/appState";
import { loadLyricsProvider } from "@/config/providers";
import { normalizeLyricsToEnhanced } from "@/utils/lyricsNormalizer";

/**
 * Hook that fetches lyrics using enabled providers sequentially with per-provider caching
 * Uses QueryClient programmatically for granular provider-level cache control
 * Components should use lyricsContentAtom, lyricsLoadingAtom, and currentLyricsProviderAtom for state
 */
export const useLyricsSync = () => {
  const queryClient = useQueryClient();
  const playerState = useAtomValue(playerStateAtom);
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);
  const setLyricsContent = useSetAtom(lyricsContentAtom);
  const setLyricsLoading = useSetAtom(lyricsLoadingAtom);
  const setCurrentLyricsProvider = useSetAtom(currentLyricsProviderAtom);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If no providers enabled, clear state
    if (enabledLyricsProviders.length === 0) {
      setLyricsContent("");
      setLyricsLoading(false);
      setCurrentLyricsProvider(null);
      return;
    }

    // If no song info, don't fetch
    if (!playerState.name || !playerState.artist) {
      setLyricsContent("");
      setLyricsLoading(false);
      setCurrentLyricsProvider(null);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchLyrics = async () => {
      setLyricsLoading(true);

      try {
        // Try each provider sequentially, checking cache first
        for (const providerConfig of enabledLyricsProviders) {
          if (abortController.signal.aborted) break;

          const providerId = providerConfig.config.id;

          try {
            setCurrentLyricsProvider(providerId);

            // Build cache key for this provider
            const queryKey = [
              "provider",
              providerId,
              playerState.name,
              playerState.artist,
              playerState.album,
            ];

            // Check cache first
            const cachedLyrics = queryClient.getQueryData<string>(queryKey);
            if (cachedLyrics && cachedLyrics.trim()) {
              console.log(
                `Cache hit for provider "${providerId}" - returning cached lyrics`,
              );
              const normalizedLyrics = normalizeLyricsToEnhanced(cachedLyrics);
              setLyricsContent(normalizedLyrics);
              setLyricsLoading(false);
              setCurrentLyricsProvider(null);
              return;
            }

            // Cache miss - fetch from provider
            console.log(
              `Cache miss for provider "${providerId}" - fetching from provider`,
            );

            const provider = await loadLyricsProvider(providerId);

            // Check if provider is available
            const isAvailable = await provider.isAvailable();
            if (!isAvailable) {
              console.warn(
                `Lyrics provider "${providerId}" is not available, trying next...`,
              );
              continue;
            }

            // Check if provider supports this song
            const supportsLyrics = await provider.supportsLyrics(playerState);
            if (!supportsLyrics) {
              console.log(
                `Lyrics provider "${providerId}" doesn't support this song, trying next...`,
              );
              continue;
            }

            // Fetch and cache the result
            const lyrics = await queryClient.fetchQuery({
              queryKey,
              queryFn: () =>
                provider.getLyrics(playerState, abortController.signal),
              staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year
              gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year
            });

            if (lyrics && lyrics.trim()) {
              console.log(
                `Successfully got lyrics from provider "${providerId}"`,
              );
              const normalizedLyrics = normalizeLyricsToEnhanced(lyrics);
              setLyricsContent(normalizedLyrics);
              setLyricsLoading(false);
              setCurrentLyricsProvider(null);
              return;
            }

            console.log(
              `Provider "${providerId}" returned empty lyrics, trying next...`,
            );
          } catch (error) {
            console.error(
              `Failed to get lyrics from provider "${providerId}":`,
              error,
            );
            // Continue to next provider
          }
        }

        // All providers failed
        console.warn(
          "All enabled lyrics providers failed or returned empty results",
        );
        setLyricsContent("");
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching lyrics:", error);
          setLyricsContent("");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLyricsLoading(false);
          setCurrentLyricsProvider(null);
        }
      }
    };

    fetchLyrics();

    return () => {
      abortController.abort();
    };
  }, [
    playerState.name,
    playerState.artist,
    playerState.album,
    enabledLyricsProviders,
    queryClient,
    setLyricsContent,
    setLyricsLoading,
    setCurrentLyricsProvider,
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
