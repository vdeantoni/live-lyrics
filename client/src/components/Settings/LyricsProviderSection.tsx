import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useRef } from "react";
import {
  lyricsProviderIdsAtom,
  enabledLyricsProvidersAtom,
  lyricsProvidersWithStatusAtom,
  checkLyricsProviderAvailabilityAtom,
} from "@/atoms/settingsAtoms";
import { ProviderSection } from "./ProviderSection";

export const LyricsProviderSection = () => {
  const lyricsProviders = useAtomValue(lyricsProvidersWithStatusAtom);
  const [lyricsProviderIds, setLyricsProviderIds] = useAtom(
    lyricsProviderIdsAtom,
  );
  const [enabledLyricsProviders, setEnabledLyricsProviders] = useAtom(
    enabledLyricsProvidersAtom,
  );
  const checkAvailability = useSetAtom(checkLyricsProviderAvailabilityAtom);
  const checkedProviders = useRef(new Set<string>());

  // Check availability for all providers on mount and when new providers are added
  useEffect(() => {
    lyricsProviders.forEach((provider) => {
      // Only check if we haven't checked this provider yet and it's not currently loading
      if (!checkedProviders.current.has(provider.id) && !provider.isLoading) {
        checkedProviders.current.add(provider.id);
        checkAvailability(provider.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only depend on provider IDs, not their status - prevents infinite re-renders
  }, [lyricsProviderIds, checkAvailability]);

  const handleToggle = (id: string, enabled: boolean) => {
    const newSet = new Set(enabledLyricsProviders);
    if (enabled) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setEnabledLyricsProviders(newSet);
  };

  const handleReorder = (activeId: string, overId: string) => {
    const oldIndex = lyricsProviderIds.indexOf(activeId);
    const newIndex = lyricsProviderIds.indexOf(overId);
    setLyricsProviderIds(arrayMove(lyricsProviderIds, oldIndex, newIndex));
  };

  return (
    <ProviderSection
      title="Lyrics Provider"
      providers={lyricsProviders}
      onToggle={handleToggle}
      onReorder={handleReorder}
      testId="lyrics-provider-section"
    />
  );
};
