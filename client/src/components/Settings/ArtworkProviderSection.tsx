import { useAtomValue, useSetAtom } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useRef } from "react";
import {
  artworkProviderIdsAtom,
  artworkProvidersAtom,
  checkProviderAvailabilityAtom,
  updateProviderPreferencesAtom,
} from "@/atoms/settingsAtoms";
import { ProviderSection } from "./ProviderSection";

export const ArtworkProviderSection = () => {
  const artworkProviders = useAtomValue(artworkProvidersAtom) || [];
  const setArtworkProviderIds = useSetAtom(artworkProviderIdsAtom);
  const updateProviderPreferences = useSetAtom(updateProviderPreferencesAtom);
  const checkAvailability = useSetAtom(checkProviderAvailabilityAtom);
  const checkedProviders = useRef(new Set<string>());

  // Convert new registry format to old ProviderSection format
  const providersForSection = artworkProviders.map((entry) => ({
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
    artworkProviders.forEach((entry) => {
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
  }, [artworkProviders.map((p) => p.config.id).join(","), checkAvailability]);

  const handleToggle = (id: string, enabled: boolean) => {
    updateProviderPreferences(id, { isEnabled: enabled });
  };

  const handleReorder = (activeId: string, overId: string) => {
    const currentIds = artworkProviders.map((entry) => entry.config.id);
    const oldIndex = currentIds.indexOf(activeId);
    const newIndex = currentIds.indexOf(overId);
    const newOrder = arrayMove(currentIds, oldIndex, newIndex);
    setArtworkProviderIds(newOrder);
  };

  return (
    <ProviderSection
      title="Artwork Provider"
      providers={providersForSection}
      onToggle={handleToggle}
      onReorder={handleReorder}
      testId="artwork-provider-section"
    />
  );
};
