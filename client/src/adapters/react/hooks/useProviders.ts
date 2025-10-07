import { useCallback } from "react";
import {
  providerService,
  type ProviderType,
} from "@/core/services/ProviderService";
import type { Player, LyricsProvider, ArtworkProvider } from "@/types";
import type { ProviderConfig, AppProviders } from "@/types/appState";

/**
 * Hook that provides provider management functions
 * Wraps ProviderService methods for use in React components
 *
 * @example
 * const providers = useProviders();
 * <button onClick={() => providers.registerProvider("lyrics", config)}>
 *   Register Provider
 * </button>
 */
export const useProviders = () => {
  const registerProvider = useCallback(
    (
      type: ProviderType,
      config:
        | ProviderConfig<Player>
        | ProviderConfig<LyricsProvider>
        | ProviderConfig<ArtworkProvider>,
    ) => {
      providerService.registerProvider(type, config);
    },
    [],
  );

  const unregisterProvider = useCallback(
    (type: ProviderType, providerId: string) => {
      providerService.unregisterProvider(type, providerId);
    },
    [],
  );

  const replaceProviders = useCallback((providers: AppProviders) => {
    providerService.replaceProviders(providers);
  }, []);

  const resetProviders = useCallback(() => {
    providerService.resetProviders();
  }, []);

  return {
    registerProvider,
    unregisterProvider,
    replaceProviders,
    resetProviders,
  };
};
