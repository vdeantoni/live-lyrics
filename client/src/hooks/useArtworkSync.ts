import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { artworkUrlsAtom, artworkLoadingAtom } from "@/atoms/playerAtoms";
import { enabledArtworkProvidersAtom } from "@/atoms/appState";
import { loadArtworkProvider } from "@/config/providers";
import { useProviderSync } from "./useProviderSync";
import type { Song } from "@/types";

/**
 * Hook that fetches artwork using enabled providers sequentially with per-provider caching
 * Uses the generic useProviderSync hook with artwork-specific configuration
 * Components should use artworkUrlsAtom and artworkLoadingAtom for state
 */
export const useArtworkSync = () => {
  const enabledArtworkProviders = useAtomValue(enabledArtworkProvidersAtom);
  const setArtworkUrls = useSetAtom(artworkUrlsAtom);
  const setArtworkLoading = useSetAtom(artworkLoadingAtom);

  // Memoize the config object to prevent unnecessary re-renders
  const config = useMemo(
    () => ({
      enabledProviders: enabledArtworkProviders,
      loadProvider: async (providerId: string) => {
        const provider = await loadArtworkProvider(providerId);
        return {
          isAvailable: () => provider.isAvailable(),
          isFetching: () => provider.isFetching(),
          getData: (song: Song, signal: AbortSignal) =>
            provider.getArtwork(song, signal),
        };
      },
      isValidResult: (result: string[] | null) =>
        result !== null && Array.isArray(result) && result.length > 0,
      onLoadingChange: setArtworkLoading,
      onResultChange: (result: string[] | null) => setArtworkUrls(result || []),
      providerTypeName: "artwork" as const,
    }),
    [enabledArtworkProviders, setArtworkUrls, setArtworkLoading],
  );

  useProviderSync<string[]>(config);
};
