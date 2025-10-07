import { atom } from "jotai";
import type { ProviderAvailability } from "@/types/appState";

/**
 * Provider status atoms - track availability and loading state for each provider
 */
export const lyricsProviderStatusAtom = atom<Map<string, ProviderAvailability>>(
  new Map(),
);

export const artworkProviderStatusAtom = atom<
  Map<string, ProviderAvailability>
>(new Map());

export const playersProviderStatusAtom = atom<
  Map<string, ProviderAvailability>
>(new Map());
