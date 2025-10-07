import { useEffect } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import {
  lyricsProviderStatusAtom,
  artworkProviderStatusAtom,
  playersProviderStatusAtom,
} from "@/atoms/providerStatusAtoms";
import {
  effectiveLyricsProvidersAtom,
  effectiveArtworkProvidersAtom,
  effectivePlayersAtom,
} from "@/atoms/appState";
import {
  loadPlayer,
  loadLyricsProvider,
  loadArtworkProvider,
} from "@/config/providers";
import type { ProviderAvailability } from "@/types/appState";

/**
 * Hook that checks provider availability on mount
 * Updates provider status atoms with isAvailable and isLoading states
 *
 * Checks all providers in parallel for performance
 */
export const useProviderStatus = () => {
  const setLyricsStatus = useSetAtom(lyricsProviderStatusAtom);
  const setArtworkStatus = useSetAtom(artworkProviderStatusAtom);
  const setPlayersStatus = useSetAtom(playersProviderStatusAtom);

  const lyricsProviders = useAtomValue(effectiveLyricsProvidersAtom);
  const artworkProviders = useAtomValue(effectiveArtworkProvidersAtom);
  const players = useAtomValue(effectivePlayersAtom);

  useEffect(() => {
    const checkProviderAvailability = async <T>(
      providerId: string,
      loaderFn: (id: string) => Promise<T>,
    ): Promise<[string, ProviderAvailability]> => {
      try {
        const provider = await loaderFn(providerId);

        // Check if provider has isAvailable method
        if (
          provider &&
          typeof provider === "object" &&
          "isAvailable" in provider &&
          typeof provider.isAvailable === "function"
        ) {
          const isAvailable = await provider.isAvailable();
          return [
            providerId,
            { isAvailable, isLoading: false, lastChecked: Date.now() },
          ];
        }

        // No isAvailable method, assume available
        return [
          providerId,
          { isAvailable: true, isLoading: false, lastChecked: Date.now() },
        ];
      } catch (error) {
        console.error(`Failed to check availability for ${providerId}:`, error);
        return [
          providerId,
          {
            isAvailable: false,
            isLoading: false,
            lastChecked: Date.now(),
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ];
      }
    };

    const checkAll = async () => {
      // Set all providers to loading state initially
      setLyricsStatus(
        new Map(
          lyricsProviders.map((p) => [
            p.config.id,
            { isAvailable: false, isLoading: true },
          ]),
        ),
      );
      setArtworkStatus(
        new Map(
          artworkProviders.map((p) => [
            p.config.id,
            { isAvailable: false, isLoading: true },
          ]),
        ),
      );
      setPlayersStatus(
        new Map(
          players.map((p) => [
            p.config.id,
            { isAvailable: false, isLoading: true },
          ]),
        ),
      );

      // Check all providers in parallel using Promise.allSettled
      const [lyricsResults, artworkResults, playersResults] = await Promise.all(
        [
          Promise.allSettled(
            lyricsProviders.map((p) =>
              checkProviderAvailability(p.config.id, loadLyricsProvider),
            ),
          ),
          Promise.allSettled(
            artworkProviders.map((p) =>
              checkProviderAvailability(p.config.id, loadArtworkProvider),
            ),
          ),
          Promise.allSettled(
            players.map((p) =>
              checkProviderAvailability(p.config.id, loadPlayer),
            ),
          ),
        ],
      );

      // Update lyrics provider statuses
      const lyricsStatusMap = new Map<string, ProviderAvailability>();
      lyricsResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const [id, status] = result.value;
          lyricsStatusMap.set(id, status);
        }
      });
      setLyricsStatus(lyricsStatusMap);

      // Update artwork provider statuses
      const artworkStatusMap = new Map<string, ProviderAvailability>();
      artworkResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const [id, status] = result.value;
          artworkStatusMap.set(id, status);
        }
      });
      setArtworkStatus(artworkStatusMap);

      // Update player statuses
      const playersStatusMap = new Map<string, ProviderAvailability>();
      playersResults.forEach((result) => {
        if (result.status === "fulfilled") {
          const [id, status] = result.value;
          playersStatusMap.set(id, status);
        }
      });
      setPlayersStatus(playersStatusMap);
    };

    checkAll();
  }, [
    lyricsProviders,
    artworkProviders,
    players,
    setLyricsStatus,
    setArtworkStatus,
    setPlayersStatus,
  ]);
};
