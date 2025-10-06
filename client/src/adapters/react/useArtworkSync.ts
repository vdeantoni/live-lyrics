import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  playerStateAtom,
  artworkUrlsAtom,
  artworkLoadingAtom,
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

  // Fetch artwork when song or providers change
  useEffect(() => {
    if (!playerState.name || !playerState.artist) {
      setArtworkUrls([]);
      setArtworkLoading(false);
      return;
    }

    if (enabledProviders.length === 0) {
      setArtworkUrls([]);
      setArtworkLoading(false);
      return;
    }

    const providerIds = enabledProviders.map((p) => p.config.id);

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
  ]);

  // Listen to artwork events and update atoms
  useEffect(() => {
    const unsubscribeLoaded = on("artwork.loaded", (event) => {
      setArtworkUrls(event.payload.urls);
      setArtworkLoading(false);
    });

    const unsubscribeError = on("artwork.error", () => {
      setArtworkUrls([]);
      setArtworkLoading(false);
    });

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
    };
  }, [setArtworkUrls, setArtworkLoading]);
};
