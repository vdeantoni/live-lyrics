import { useAtomValue, useSetAtom } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useRef } from "react";
import {
  lyricsProviderIdsAtom,
  lyricsProvidersAtom,
  checkProviderAvailabilityAtom,
  updateProviderPreferencesAtom,
} from "@/atoms/settingsAtoms";
import { ProviderSection } from "./ProviderSection";

export const LyricsProviderSection = () => {
  const lyricsProviders = useAtomValue(lyricsProvidersAtom) || [];
  const setLyricsProviderIds = useSetAtom(lyricsProviderIdsAtom);
  const updateProviderPreferences = useSetAtom(updateProviderPreferencesAtom);
  const checkAvailability = useSetAtom(checkProviderAvailabilityAtom);
  const checkedProviders = useRef(new Set<string>());

  // Convert new registry format to old ProviderSection format
  const providersForSection = lyricsProviders.map((entry) => ({
    id: entry.config.id,
    name: entry.config.name,
    description: entry.config.description,
    isAvailable: entry.status.isAvailable,
    isEnabled: entry.userPreferences.isEnabled,
    priority: entry.userPreferences.priority,
    isLoading: entry.status.isLoading,
  }));

  // Check availability for all providers on mount and when new providers are added
  useEffect(() => {
    lyricsProviders.forEach((entry) => {
      // Only check if we haven't checked this provider yet and it's not currently loading
      if (
        !checkedProviders.current.has(entry.config.id) &&
        !entry.status.isLoading
      ) {
        checkedProviders.current.add(entry.config.id);
        checkAvailability(entry.config.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only depend on provider IDs, not their status - prevents infinite re-renders
  }, [lyricsProviders.map((p) => p.config.id).join(","), checkAvailability]);

  const handleToggle = (id: string, enabled: boolean) => {
    updateProviderPreferences(id, { isEnabled: enabled });
  };

  const handleReorder = (activeId: string, overId: string) => {
    const currentIds = lyricsProviders.map((entry) => entry.config.id);
    const oldIndex = currentIds.indexOf(activeId);
    const newIndex = currentIds.indexOf(overId);
    const newOrder = arrayMove(currentIds, oldIndex, newIndex);
    setLyricsProviderIds(newOrder);
  };

  return (
    <ProviderSection
      title="Lyrics Provider"
      providers={providersForSection}
      onToggle={handleToggle}
      onReorder={handleReorder}
      testId="lyrics-provider-section"
    />
  );
};
