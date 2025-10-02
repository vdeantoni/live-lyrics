import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import {
  playerStateAtom,
  lyricsContentAtom,
  lyricsLoadingAtom,
  currentLyricsProviderAtom,
} from "@/atoms/playerAtoms";
import { enabledLyricsProvidersAtom } from "@/atoms/appState";
import { loadLyricsProvider } from "@/config/providers";
import { normalizeLyricsToEnhanced } from "@/utils/lyricsNormalizer";
import { POLLING_INTERVALS } from "@/constants/timing";

/**
 * Hook that fetches lyrics using enabled providers sequentially with individual loading states
 * Uses explicit loading state management via lyricsLoadingAtom and currentLyricsProviderAtom
 * Components should use lyricsContentAtom, lyricsLoadingAtom, and currentLyricsProviderAtom for state
 */
export const useLyricsSync = () => {
  const playerState = useAtomValue(playerStateAtom);
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);
  const setLyricsContent = useSetAtom(lyricsContentAtom);
  const setLyricsLoading = useSetAtom(lyricsLoadingAtom);
  const setCurrentLyricsProvider = useSetAtom(currentLyricsProviderAtom);

  // Use ref to avoid stale closures in useEffect
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get enabled providers in priority order (memoized to prevent infinite re-renders)
  const enabledProviderIds = useMemo(
    () => enabledLyricsProviders.map((entry) => entry.config.id),
    [enabledLyricsProviders],
  );

  // Extract only song identification fields to avoid re-fetching on currentTime changes
  const songIdentity = useMemo(
    () => ({
      name: playerState.name,
      artist: playerState.artist,
      album: playerState.album,
    }),
    [playerState.name, playerState.artist, playerState.album],
  );

  // Main effect to trigger lyrics fetching
  // Note: playerState is intentionally excluded from deps to prevent infinite loop
  // Only songIdentity (name, artist, album) should trigger new lyrics fetching
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If no providers enabled, clear state
    if (enabledProviderIds.length === 0) {
      setLyricsContent("");
      setLyricsLoading(false);
      setCurrentLyricsProvider(null);
      return;
    }

    // If no song info, don't fetch
    if (!songIdentity.name || !songIdentity.artist) {
      setLyricsContent("");
      setLyricsLoading(false);
      setCurrentLyricsProvider(null);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchLyricsSequentially = async (
      playerSong: typeof playerState,
      providerIds: string[],
      signal: AbortSignal,
    ) => {
      if (!playerSong.name || !playerSong.artist || providerIds.length === 0) {
        return "";
      }

      // Try each provider sequentially
      for (const providerId of providerIds) {
        if (signal.aborted) return "";

        try {
          setCurrentLyricsProvider(providerId);
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
          const supportsLyrics = await provider.supportsLyrics(playerSong);
          if (!supportsLyrics) {
            console.log(
              `Lyrics provider "${providerId}" doesn't support this song, trying next...`,
            );
            continue;
          }

          // Start fetching and poll until complete
          const lyricsPromise = provider.getLyrics(playerSong);

          // Wait for fetching to complete
          while (await provider.isFetching()) {
            if (signal.aborted) return "";
            // Small delay to avoid tight polling loop
            await new Promise((resolve) =>
              setTimeout(resolve, POLLING_INTERVALS.LYRICS_FETCH_POLL),
            );
          }

          const lyrics = await lyricsPromise;
          if (lyrics && lyrics.trim()) {
            console.log(
              `Successfully got lyrics from provider "${providerId}"`,
            );
            return lyrics;
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

      console.warn(
        "All enabled lyrics providers failed or returned empty results",
      );
      return "";
    };

    const fetchLyrics = async () => {
      setLyricsLoading(true);
      try {
        const lyrics = await fetchLyricsSequentially(
          playerState,
          enabledProviderIds,
          abortController.signal,
        );

        if (!abortController.signal.aborted) {
          // Normalize lyrics to enhanced format before storing
          const normalizedLyrics = normalizeLyricsToEnhanced(lyrics);
          setLyricsContent(normalizedLyrics);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songIdentity, enabledProviderIds, setLyricsContent, setLyricsLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
};
