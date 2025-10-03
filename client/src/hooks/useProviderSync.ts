import { useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { playerStateAtom } from "@/atoms/playerAtoms";
import type { Song } from "@/types";
import type { EffectiveProvider } from "@/types/appState";

/**
 * Provider instance interface
 */
export interface Provider<T> {
  isAvailable: () => Promise<boolean>;
  getData: (song: Song, signal: AbortSignal) => Promise<T | null>;
  checkSupport?: (song: Song) => Promise<boolean>;
  isFetching?: () => Promise<boolean>;
}

/**
 * Configuration for the provider sync hook
 */
export interface ProviderSyncConfig<T> {
  /** List of enabled provider configurations */
  enabledProviders: EffectiveProvider<unknown>[];
  /** Function to load provider instance by ID */
  loadProvider: (providerId: string) => Promise<Provider<T>>;
  /** Function to check if result is valid/non-empty */
  isValidResult: (result: T) => boolean;
  /** Callback when loading state changes */
  onLoadingChange: (loading: boolean) => void;
  /** Callback when result is fetched */
  onResultChange: (result: T) => void;
  /** Callback when current provider changes (optional, for lyrics) */
  onCurrentProviderChange?: (providerId: string | null) => void;
  /** Transform result before storing (optional) */
  transformResult?: (result: T) => T;
  /** Provider type name for logging */
  providerTypeName: string;
}

/**
 * Generic hook that fetches data using enabled providers sequentially with per-provider caching
 * Uses QueryClient programmatically for granular provider-level cache control
 */
export const useProviderSync = <T>({
  enabledProviders,
  loadProvider,
  isValidResult,
  onLoadingChange,
  onResultChange,
  onCurrentProviderChange,
  transformResult,
  providerTypeName,
}: ProviderSyncConfig<T>) => {
  const queryClient = useQueryClient();
  const playerState = useAtomValue(playerStateAtom);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If no providers enabled, clear state
    if (enabledProviders.length === 0) {
      onResultChange(null as T);
      onLoadingChange(false);
      onCurrentProviderChange?.(null);
      return;
    }

    // If no song info, don't fetch
    if (!playerState.name || !playerState.artist) {
      onResultChange(null as T);
      onLoadingChange(false);
      onCurrentProviderChange?.(null);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchData = async () => {
      onLoadingChange(true);

      try {
        // Try each provider sequentially, checking cache first
        for (const providerConfig of enabledProviders) {
          if (abortController.signal.aborted) break;

          const providerId = providerConfig.config.id;

          try {
            onCurrentProviderChange?.(providerId);

            // Build cache key for this provider
            const queryKey = [
              "provider",
              providerId,
              playerState.name,
              playerState.artist,
              playerState.album,
            ];

            // Check cache first
            const cachedResult = queryClient.getQueryData<T>(queryKey);
            if (cachedResult && isValidResult(cachedResult)) {
              console.log(
                `Cache hit for provider "${providerId}" - returning cached ${providerTypeName}`,
              );
              const finalResult = transformResult
                ? transformResult(cachedResult)
                : cachedResult;
              onResultChange(finalResult);
              onLoadingChange(false);
              onCurrentProviderChange?.(null);
              return;
            }

            // Cache miss - fetch from provider
            console.log(
              `Cache miss for provider "${providerId}" - fetching from provider`,
            );

            const provider = await loadProvider(providerId);

            // Check if provider is available
            const isAvailable = await provider.isAvailable();
            if (!isAvailable) {
              console.warn(
                `${providerTypeName} provider "${providerId}" is not available, trying next...`,
              );
              continue;
            }

            // Check if provider supports this song (optional check)
            if (provider.checkSupport) {
              const supportsData = await provider.checkSupport(playerState);
              if (!supportsData) {
                console.log(
                  `${providerTypeName} provider "${providerId}" doesn't support this song, trying next...`,
                );
                continue;
              }
            }

            // Check if provider is currently fetching (optional check)
            if (provider.isFetching) {
              const providerIsFetching = await provider.isFetching();
              if (providerIsFetching) {
                console.log(
                  `${providerTypeName} provider "${providerId}" is currently fetching, waiting...`,
                );
                continue;
              }
            }

            // Fetch and cache the result
            const result = await queryClient.fetchQuery({
              queryKey,
              queryFn: () =>
                provider.getData(playerState, abortController.signal),
              staleTime: 1000 * 60 * 60 * 24 * 365, // 1 year
              gcTime: 1000 * 60 * 60 * 24 * 365, // 1 year
            });

            if (result && isValidResult(result)) {
              console.log(
                `Successfully got ${providerTypeName} from provider "${providerId}"`,
              );
              const finalResult = transformResult
                ? transformResult(result)
                : result;
              onResultChange(finalResult);
              onLoadingChange(false);
              onCurrentProviderChange?.(null);
              return;
            }

            console.log(
              `Provider "${providerId}" returned invalid ${providerTypeName}, trying next...`,
            );
          } catch (error) {
            console.error(
              `Failed to get ${providerTypeName} from provider "${providerId}":`,
              error,
            );
            // Continue to next provider
          }
        }

        // All providers failed
        console.warn(
          `All enabled ${providerTypeName} providers failed or returned empty results`,
        );
        onResultChange(null as T);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error(`Error fetching ${providerTypeName}:`, error);
          onResultChange(null as T);
        }
      } finally {
        if (!abortController.signal.aborted) {
          onLoadingChange(false);
          onCurrentProviderChange?.(null);
        }
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    playerState.name,
    playerState.artist,
    playerState.album,
    queryClient,
    enabledProviders,
    loadProvider,
    isValidResult,
    onLoadingChange,
    onResultChange,
    onCurrentProviderChange,
    transformResult,
    providerTypeName,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
};
