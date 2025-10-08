import { useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  playerStateAtom,
  lyricsContentAtom,
  lyricsLoadingAtom,
  currentLyricsProviderAtom,
} from "@/atoms/playerAtoms";
import { enabledLyricsProvidersAtom } from "@/atoms/appState";
import { lyricsService } from "@/core/services/LyricsService";
import { on } from "@/core/events/bus";
import { useMemoizedLyricsNormalizer } from "@/hooks/useMemoizedLyricsNormalizer";

/**
 * Hook that fetches lyrics using LyricsService
 * Replaces the old useProviderSync-based lyrics fetching
 */
export const useLyricsSync = () => {
  const playerState = useAtomValue(playerStateAtom);
  const enabledProviders = useAtomValue(enabledLyricsProvidersAtom);
  const setLyricsContent = useSetAtom(lyricsContentAtom);
  const setLyricsLoading = useSetAtom(lyricsLoadingAtom);
  const setCurrentProvider = useSetAtom(currentLyricsProviderAtom);

  // Memoized lyrics normalizer with LRU cache
  const normalizeLyrics = useMemoizedLyricsNormalizer();

  // Stabilize provider IDs array to prevent unnecessary effect re-runs
  // Only changes when provider IDs actually change, not when array reference changes
  const providerIds = useMemo(
    () => enabledProviders.map((p) => p.config.id),
    // Use stringified IDs as dependency to detect actual changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabledProviders.map((p) => p.config.id).join(",")],
  );

  // Fetch lyrics when song or providers change
  useEffect(() => {
    if (!playerState.name || !playerState.artist) {
      setLyricsContent(null);
      setLyricsLoading(false);
      setCurrentProvider(null);
      return;
    }

    if (providerIds.length === 0) {
      setLyricsContent(null);
      setLyricsLoading(false);
      setCurrentProvider(null);
      return;
    }

    setLyricsLoading(true);
    lyricsService.fetchLyrics(playerState, providerIds);

    return () => {
      lyricsService.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    playerState.name,
    playerState.artist,
    playerState.album,
    providerIds,
    setLyricsContent,
    setLyricsLoading,
    setCurrentProvider,
  ]);

  // Listen to lyrics events and update atoms
  useEffect(() => {
    const unsubscribeLoaded = on("lyrics.loaded", (event) => {
      if (event.payload.content) {
        // Normalize lyrics to enhanced LRC format with memoization
        const normalized = normalizeLyrics(event.payload.content);
        setLyricsContent(normalized);
      } else {
        setLyricsContent(null);
      }
      setLyricsLoading(false);
      setCurrentProvider(event.payload.providerId || null);
    });

    const unsubscribeError = on("lyrics.error", () => {
      setLyricsContent(null);
      setLyricsLoading(false);
      setCurrentProvider(null);
    });

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
    };
  }, [setLyricsContent, setLyricsLoading, setCurrentProvider, normalizeLyrics]);
};
