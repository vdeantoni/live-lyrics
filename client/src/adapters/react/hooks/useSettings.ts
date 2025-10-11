import { useCallback } from "react";
import {
  settingsService,
  type ProviderType,
} from "@/core/services/SettingsService";
import type { PlayerSettings } from "@/types";

/**
 * Hook that provides settings management functions
 * Wraps SettingsService methods for use in React components
 *
 * @example
 * const settings = useSettings();
 * <button onClick={() => settings.setProviderEnabled("lyrics", "lrclib", true)}>
 *   Enable LrcLib
 * </button>
 */
export const useSettings = () => {
  const setProviderEnabled = useCallback(
    (type: ProviderType, providerId: string, enabled: boolean) => {
      settingsService.setProviderEnabled(type, providerId, enabled);
    },
    [],
  );

  const reorderProviders = useCallback(
    (type: ProviderType, providerIds: string[]) => {
      settingsService.reorderProviders(type, providerIds);
    },
    [],
  );

  const resetProviderSettings = useCallback((type: ProviderType) => {
    settingsService.resetProviderSettings(type);
  }, []);

  const clearAllSettings = useCallback(() => {
    settingsService.clearAllSettings();
  }, []);

  const getPlayerSettings = useCallback((playerId: string) => {
    return settingsService.getPlayerSettings(playerId);
  }, []);

  const setPlayerSettings = useCallback(
    (playerId: string, settings: Partial<PlayerSettings>) => {
      settingsService.setPlayerSettings(playerId, settings);
    },
    [],
  );

  return {
    setProviderEnabled,
    reorderProviders,
    resetProviderSettings,
    clearAllSettings,
    getPlayerSettings,
    setPlayerSettings,
  };
};
