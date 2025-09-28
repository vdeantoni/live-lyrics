import { atom } from "jotai";
import type { MusicSource, SourceConfig } from "@/types/musicSource";
import { HttpMusicSource } from "@/sources/httpMusicSource";
import { SimulatedMusicSource } from "@/sources/simulatedMusicSource";

/**
 * Available source configurations
 */
export const availableSources: SourceConfig[] = [
  {
    type: "http",
    name: "Server",
    options: { baseUrl: "http://127.0.0.1:4000" },
  },
  {
    type: "simulated",
    name: "Player",
    options: {},
  },
];

/**
 * Current source configuration atom
 */
export const currentSourceConfigAtom = atom<SourceConfig>(availableSources[1]);

/**
 * Factory function to create music source instances
 */
export function createMusicSource(config: SourceConfig): MusicSource {
  switch (config.type) {
    case "http":
      return new HttpMusicSource(config.options?.baseUrl as string);
    case "simulated":
      // Use singleton instance to persist state
      return SimulatedMusicSource.getInstance();
    default:
      throw new Error(`Unknown source type: ${config.type}`);
  }
}

/**
 * Current music source instance atom (derived from config)
 */
export const currentMusicSourceAtom = atom<MusicSource>((get) => {
  const config = get(currentSourceConfigAtom);
  return createMusicSource(config);
});

/**
 * Atom to switch between sources
 */
export const switchSourceAtom = atom(
  null,
  (_get, set, newConfig: SourceConfig) => {
    set(currentSourceConfigAtom, newConfig);
  },
);

/**
 * Utility function to get available sources with their availability status
 */
export const checkSourceAvailabilityAtom = atom(async () => {
  const results = await Promise.allSettled(
    availableSources.map(async (config) => {
      const source = createMusicSource(config);
      const isAvailable = await source.isAvailable();
      return {
        config,
        source,
        isAvailable,
      };
    }),
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        config: availableSources[index],
        source: null,
        isAvailable: false,
        error: result.reason,
      };
    }
  });
});
