import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { on } from "@/core/events/bus";
import { playerStateAtom, playerUIStateAtom } from "@/atoms/playerAtoms";
import {
  playersSettingsAtom,
  lyricsSettingsAtom,
  artworkSettingsAtom,
  appProvidersAtom,
  playlistsAtom,
} from "@/atoms/appState";
import type { UserProviderOverride } from "@/types/appState";
import { UI_DELAYS } from "@/constants/timing";
import { providerService } from "@/core/services/ProviderService";
import { playlistService } from "@/core/services/PlaylistService";

/**
 * Hook that syncs events to Jotai atoms
 * This is the bridge between the event system and Jotai state
 *
 * Should be called once at the app root level
 */
export const useEventSync = () => {
  const setPlayerState = useSetAtom(playerStateAtom);
  const setPlayerUIState = useSetAtom(playerUIStateAtom);
  const setPlayersSettings = useSetAtom(playersSettingsAtom);
  const setLyricsSettings = useSetAtom(lyricsSettingsAtom);
  const setArtworkSettings = useSetAtom(artworkSettingsAtom);
  const setAppProviders = useSetAtom(appProvidersAtom);
  const setPlaylists = useSetAtom(playlistsAtom);

  // Load initial settings from localStorage on mount
  useEffect(() => {
    const loadSettings = (
      storageKey: string,
    ): Map<string, UserProviderOverride> => {
      try {
        const storedValue = localStorage.getItem(storageKey);
        if (storedValue === null) return new Map();
        const parsed = JSON.parse(storedValue);
        return new Map(
          Object.entries(parsed) as [string, UserProviderOverride][],
        );
      } catch (error) {
        console.error(`Failed to load settings from ${storageKey}:`, error);
        return new Map();
      }
    };

    // Load all settings on mount
    setPlayersSettings(loadSettings("LIVE_LYRICS_PLAYER_SETTINGS"));
    setLyricsSettings(loadSettings("LIVE_LYRICS_LYRICS_SETTINGS"));
    setArtworkSettings(loadSettings("LIVE_LYRICS_ARTWORK_SETTINGS"));

    // Load playlists from service
    setPlaylists(playlistService.getPlaylists());
  }, [setPlayersSettings, setLyricsSettings, setArtworkSettings, setPlaylists]);

  useEffect(() => {
    // Sync player state changes to atom
    const unsubscribePlayerState = on("player.state.changed", (event) => {
      setPlayerState(event.payload);
    });

    // Handle player errors
    const unsubscribePlayerError = on("player.error", (event) => {
      console.error("Player error:", event.payload.error);
    });

    return () => {
      unsubscribePlayerState();
      unsubscribePlayerError();
    };
  }, [setPlayerState]);

  // Handle optimistic UI updates for seeking
  useEffect(() => {
    const unsubscribeSeek = on("player.seek", (event) => {
      // Optimistically update currentTime
      setPlayerState((prev) => ({
        ...prev,
        currentTime: event.payload.time,
      }));

      // Set seeking state
      setPlayerUIState((prev) => ({ ...prev, isUserSeeking: true }));

      // Clear seeking state after delay
      setTimeout(() => {
        setPlayerUIState((prev) => ({ ...prev, isUserSeeking: false }));
      }, UI_DELAYS.SEEK_END_TIMEOUT);
    });

    return unsubscribeSeek;
  }, [setPlayerState, setPlayerUIState]);

  // Handle settings changes
  useEffect(() => {
    const unsubscribeSettings = on("settings.changed", (event) => {
      const { providerType } = event.payload;

      // Load settings from localStorage based on provider type
      const storageKeys = {
        players: "LIVE_LYRICS_PLAYER_SETTINGS",
        lyrics: "LIVE_LYRICS_LYRICS_SETTINGS",
        artwork: "LIVE_LYRICS_ARTWORK_SETTINGS",
      };

      const setterMap = {
        players: setPlayersSettings,
        lyrics: setLyricsSettings,
        artwork: setArtworkSettings,
      };

      try {
        const storageKey = storageKeys[providerType];
        const storedValue = localStorage.getItem(storageKey);

        if (storedValue === null) {
          // Settings were cleared, set to empty Map
          setterMap[providerType](new Map());
        } else {
          const parsed = JSON.parse(storedValue);
          const settingsMap = new Map(
            Object.entries(parsed) as [string, UserProviderOverride][],
          );
          setterMap[providerType](settingsMap);
        }
      } catch (error) {
        console.error(
          `Failed to reload ${providerType} settings from localStorage:`,
          error,
        );
      }
    });

    return unsubscribeSettings;
  }, [setPlayersSettings, setLyricsSettings, setArtworkSettings]);

  // Handle provider changes
  useEffect(() => {
    const unsubscribeProviders = on("providers.changed", () => {
      // Read providers from service and update atom
      const providers = providerService.getProviders();
      setAppProviders(providers);
    });

    return unsubscribeProviders;
  }, [setAppProviders]);

  // Handle playlist changes
  useEffect(() => {
    const unsubscribePlaylists = on("playlist.changed", () => {
      // Read playlists from service and update atom
      const playlists = playlistService.getPlaylists();
      setPlaylists(playlists);
    });

    return unsubscribePlaylists;
  }, [setPlaylists]);
};
