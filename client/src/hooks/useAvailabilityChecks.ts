import { useSetAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import {
  checkLyricsProviderAvailabilityAtom,
  checkArtworkProviderAvailabilityAtom,
  checkPlayerAvailabilityAtom,
  availableLyricsProvidersAtom,
  availableArtworkProvidersAtom,
} from "@/atoms/settingsAtoms";

/**
 * Hook that checks provider and player availability on app startup
 * This ensures users can see availability status immediately without opening settings
 */
export const useAvailabilityChecks = () => {
  const availableLyricsProviders = useAtomValue(availableLyricsProvidersAtom);
  const availableArtworkProviders = useAtomValue(availableArtworkProvidersAtom);
  const checkLyricsAvailability = useSetAtom(
    checkLyricsProviderAvailabilityAtom,
  );
  const checkArtworkAvailability = useSetAtom(
    checkArtworkProviderAvailabilityAtom,
  );
  const checkPlayerAvailability = useSetAtom(checkPlayerAvailabilityAtom);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once on app startup
    if (hasChecked.current) return;
    hasChecked.current = true;

    // Check all lyrics providers
    availableLyricsProviders.forEach((provider) => {
      checkLyricsAvailability(provider.id);
    });

    // Check all artwork providers
    availableArtworkProviders.forEach((provider) => {
      checkArtworkAvailability(provider.id);
    });

    // Check remote player availability
    checkPlayerAvailability("remote");
  }, [
    availableLyricsProviders,
    availableArtworkProviders,
    checkLyricsAvailability,
    checkArtworkAvailability,
    checkPlayerAvailability,
  ]);
};
