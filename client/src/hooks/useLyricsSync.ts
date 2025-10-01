import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  playerStateAtom,
  rawLrcContentAtom,
  lyricsLoadingAtom,
} from "@/atoms/playerAtoms";
import { enabledLyricsProvidersAtom } from "@/atoms/appState";
import { loadLyricsProvider } from "@/config/providers";

/**
 * Hook that fetches lyrics using enabled providers sequentially with individual loading states
 * Uses explicit loading state management via lyricsLoadingAtom
 * Components should use rawLrcContentAtom and lyricsLoadingAtom for state
 */
export const useLyricsSync = () => {
  const playerState = useAtomValue(playerStateAtom);
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);
  const setRawLrcContent = useSetAtom(rawLrcContentAtom);
  const setLyricsLoading = useSetAtom(lyricsLoadingAtom);

  // Track current provider being tried for UI feedback
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);

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
      setRawLrcContent("");
      setLyricsLoading(false);
      setCurrentProvider(null);
      return;
    }

    // If no song info, don't fetch
    if (!songIdentity.name || !songIdentity.artist) {
      setRawLrcContent("");
      setLyricsLoading(false);
      setCurrentProvider(null);
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
          setCurrentProvider(providerId);
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
            await new Promise((resolve) => setTimeout(resolve, 50));
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
          setRawLrcContent(lyrics);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching lyrics:", error);
          setRawLrcContent("");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLyricsLoading(false);
          setCurrentProvider(null);
        }
      }
    };

    fetchLyrics();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songIdentity, enabledProviderIds, setRawLrcContent, setLyricsLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Return current provider for UI feedback
  return { currentProvider };
};
