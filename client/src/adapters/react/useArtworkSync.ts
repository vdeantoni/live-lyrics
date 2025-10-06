import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  playerStateAtom,
  artworkUrlsAtom,
  artworkLoadingAtom,
  currentArtworkUrlAtom,
} from "@/atoms/playerAtoms";
import { enabledArtworkProvidersAtom } from "@/atoms/appState";
import { artworkService } from "@/core/services/ArtworkService";
import { on } from "@/core/events/bus";

/**
 * Hook that fetches artwork using ArtworkService
 * Replaces the old useProviderSync-based artwork fetching
 */
export const useArtworkSync = () => {
  const playerState = useAtomValue(playerStateAtom);
  const enabledProviders = useAtomValue(enabledArtworkProvidersAtom);
  const setArtworkUrls = useSetAtom(artworkUrlsAtom);
  const setArtworkLoading = useSetAtom(artworkLoadingAtom);
  const setCurrentArtworkUrl = useSetAtom(currentArtworkUrlAtom);

  // Fetch artwork when song or providers change
  useEffect(() => {
    console.log("[useArtworkSync] Effect triggered:", {
      name: playerState.name,
      artist: playerState.artist,
      album: playerState.album,
      enabledProvidersCount: enabledProviders.length,
    });

    if (!playerState.name || !playerState.artist) {
      console.log("[useArtworkSync] Clearing artwork - no song data");
      setArtworkUrls([]);
      setCurrentArtworkUrl("");
      setArtworkLoading(false);
      return;
    }

    if (enabledProviders.length === 0) {
      console.log("[useArtworkSync] Clearing artwork - no enabled providers");
      setArtworkUrls([]);
      setCurrentArtworkUrl("");
      setArtworkLoading(false);
      return;
    }

    const providerIds = enabledProviders.map((p) => p.config.id);
    console.log("[useArtworkSync] Fetching artwork for:", {
      name: playerState.name,
      artist: playerState.artist,
      providerIds,
    });

    setArtworkLoading(true);
    artworkService.fetchArtwork(playerState, providerIds);

    return () => {
      artworkService.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    playerState.name,
    playerState.artist,
    playerState.album,
    enabledProviders,
    setArtworkUrls,
    setArtworkLoading,
    setCurrentArtworkUrl,
  ]);

  // Listen to artwork events and update atoms
  useEffect(() => {
    const unsubscribeLoaded = on("artwork.loaded", (event) => {
      setArtworkUrls(event.payload.urls);
      setArtworkLoading(false);
    });

    const unsubscribeError = on("artwork.error", () => {
      setArtworkUrls([]);
      setCurrentArtworkUrl("");
      setArtworkLoading(false);
    });

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
    };
  }, [setArtworkUrls, setArtworkLoading, setCurrentArtworkUrl]);
};
