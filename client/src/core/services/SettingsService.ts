import { emit } from "@/core/events/bus";
import type { UserProviderOverride } from "@/types/appState";

/**
 * Provider type for settings management
 */
export type ProviderType = "players" | "lyrics" | "artwork";

/**
 * localStorage keys for provider settings
 */
const STORAGE_KEYS: Record<ProviderType, string> = {
  players: "LIVE_LYRICS_PLAYER_SETTINGS",
  lyrics: "LIVE_LYRICS_LYRICS_SETTINGS",
  artwork: "LIVE_LYRICS_ARTWORK_SETTINGS",
};

/**
 * Settings service that handles all settings-related business logic
 * Emits events instead of updating state directly for decoupling
 */
export class SettingsService {
  /**
   * Load settings from localStorage
   */
  private loadSettings(type: ProviderType): Map<string, UserProviderOverride> {
    try {
      const storageKey = STORAGE_KEYS[type];
      const storedValue = localStorage.getItem(storageKey);
      if (storedValue === null) return new Map();

      const parsed = JSON.parse(storedValue);
      return new Map(
        Object.entries(parsed) as [string, UserProviderOverride][],
      );
    } catch (error) {
      console.error(`Failed to load ${type} settings:`, error);
      return new Map();
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(
    type: ProviderType,
    settings: Map<string, UserProviderOverride>,
  ): void {
    try {
      const storageKey = STORAGE_KEYS[type];
      localStorage.setItem(
        storageKey,
        JSON.stringify(Object.fromEntries(settings.entries())),
      );
    } catch (error) {
      console.error(`Failed to save ${type} settings:`, error);
      throw error;
    }
  }

  /**
   * Set provider enabled/disabled state explicitly
   * @param type - Provider type (players, lyrics, artwork)
   * @param providerId - Provider ID
   * @param enabled - True to enable, false to disable
   */
  setProviderEnabled(
    type: ProviderType,
    providerId: string,
    enabled: boolean,
  ): void {
    const settings = this.loadSettings(type);
    const currentOverride = settings.get(providerId);

    const newOverride: UserProviderOverride = {
      ...currentOverride,
      disabled: enabled ? undefined : true,
    };

    // If the override is now empty (all undefined), remove it entirely
    if (Object.values(newOverride).every((value) => value === undefined)) {
      settings.delete(providerId);
    } else {
      settings.set(providerId, newOverride);
    }

    // Save to localStorage
    this.saveSettings(type, settings);

    // Emit settings changed event
    emit({
      type: "settings.changed",
      payload: { providerType: type, providerId },
    });
  }

  /**
   * Reorder providers by setting priorities based on array position
   * @param type - Provider type (players, lyrics, artwork)
   * @param providerIds - Array of provider IDs in desired order
   */
  reorderProviders(type: ProviderType, providerIds: string[]): void {
    const settings = this.loadSettings(type);

    // Update priorities for all providers in the new order
    providerIds.forEach((providerId, index) => {
      const currentOverride = settings.get(providerId);
      const newOverride: UserProviderOverride = {
        ...currentOverride,
        priority: index + 1, // Priority is 1-based
      };
      settings.set(providerId, newOverride);
    });

    // Save to localStorage
    this.saveSettings(type, settings);

    // Emit settings changed event
    emit({
      type: "settings.changed",
      payload: { providerType: type },
    });
  }

  /**
   * Reset settings for a specific provider type
   * @param type - Provider type to reset (players, lyrics, artwork)
   */
  resetProviderSettings(type: ProviderType): void {
    const storageKey = STORAGE_KEYS[type];

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to reset ${type} settings:`, error);
      throw error;
    }

    // Emit settings changed event
    emit({
      type: "settings.changed",
      payload: { providerType: type },
    });
  }

  /**
   * Clear all settings (all provider types)
   */
  clearAllSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.players);
      localStorage.removeItem(STORAGE_KEYS.lyrics);
      localStorage.removeItem(STORAGE_KEYS.artwork);
    } catch (error) {
      console.error("Failed to clear all settings:", error);
      throw error;
    }

    // Emit settings changed event for each type
    emit({
      type: "settings.changed",
      payload: { providerType: "players" },
    });
    emit({
      type: "settings.changed",
      payload: { providerType: "lyrics" },
    });
    emit({
      type: "settings.changed",
      payload: { providerType: "artwork" },
    });
  }
}

// Singleton instance
export const settingsService = new SettingsService();
