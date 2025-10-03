import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import {
  lyricsContentAtom,
  lyricsLoadingAtom,
  currentLyricsProviderAtom,
} from "@/atoms/playerAtoms";
import { enabledLyricsProvidersAtom } from "@/atoms/appState";
import { loadLyricsProvider } from "@/config/providers";
import { normalizeLyricsToEnhanced } from "@/utils/lyricsNormalizer";
import { useProviderSync } from "./useProviderSync";
import type { Song } from "@/types";

/**
 * Hook that fetches lyrics using enabled providers sequentially with per-provider caching
 * Uses the generic useProviderSync hook with lyrics-specific configuration
 * Components should use lyricsContentAtom, lyricsLoadingAtom, and currentLyricsProviderAtom for state
 */
export const useLyricsSync = () => {
  const enabledLyricsProviders = useAtomValue(enabledLyricsProvidersAtom);
  const setLyricsContent = useSetAtom(lyricsContentAtom);
  const setLyricsLoading = useSetAtom(lyricsLoadingAtom);
  const setCurrentLyricsProvider = useSetAtom(currentLyricsProviderAtom);

  // Memoize the config object to prevent unnecessary re-renders
  const config = useMemo(
    () => ({
      enabledProviders: enabledLyricsProviders,
      loadProvider: async (providerId: string) => {
        const provider = await loadLyricsProvider(providerId);
        return {
          isAvailable: () => provider.isAvailable(),
          checkSupport: (song: Song) => provider.supportsLyrics(song),
          getData: (song: Song, signal: AbortSignal) =>
            provider.getLyrics(song, signal),
        };
      },
      isValidResult: (result: string | null) =>
        result !== null && result.trim() !== "",
      transformResult: (result: string | null) =>
        result ? normalizeLyricsToEnhanced(result) : "",
      onLoadingChange: setLyricsLoading,
      onResultChange: (result: string | null) => setLyricsContent(result || ""),
      onCurrentProviderChange: setCurrentLyricsProvider,
      providerTypeName: "lyrics" as const,
    }),
    [
      enabledLyricsProviders,
      setLyricsContent,
      setLyricsLoading,
      setCurrentLyricsProvider,
    ],
  );

  useProviderSync<string>(config);
};
