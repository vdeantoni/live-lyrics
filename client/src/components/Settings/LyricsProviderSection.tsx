import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect } from "react";
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

  // Check availability for all providers on mount
  useEffect(() => {
    lyricsProviders.forEach((provider) => {
      // Only check if we haven't checked yet (default true means unchecked)
      if (provider.isAvailable === true && !provider.isLoading) {
        checkAvailability(provider.id);
      }
    });
  }, [lyricsProviders, checkAvailability]);

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
