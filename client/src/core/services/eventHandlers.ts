import { on } from "@/core/events/bus";
import { providerService } from "./ProviderService";
import { settingsService } from "./SettingsService";

/**
 * Initialize all event handlers
 * This wires up events to services
 *
 * Should be called once at app initialization
 */
export const initializeEventHandlers = () => {
  // Provider management events → ProviderService
  on("providers.replaceAll", (event) => {
    try {
      const { players, lyricsProviders, artworkProviders } = event.payload;

      // Build the new provider registry structure
      const newProviders = {
        players: players || [],
        lyrics: lyricsProviders || [],
        artwork: artworkProviders || [],
      };

      // Replace providers via service
      providerService.replaceProviders(newProviders);

      // Clear all user overrides to ensure clean test state
      settingsService.clearAllSettings();
    } catch (error) {
      console.error("Failed to handle providers.replaceAll event:", error);
    }
  });

  console.log("Event handlers initialized");
};
