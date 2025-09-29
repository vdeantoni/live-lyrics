import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect } from "react";
import {
  artworkProviderIdsAtom,
  enabledArtworkProvidersAtom,
  artworkProvidersWithStatusAtom,
  checkArtworkProviderAvailabilityAtom,
} from "@/atoms/settingsAtoms";
import { ProviderSection } from "./ProviderSection";

export const ArtworkProviderSection = () => {
  const artworkProviders = useAtomValue(artworkProvidersWithStatusAtom);
  const [artworkProviderIds, setArtworkProviderIds] = useAtom(
    artworkProviderIdsAtom,
  );
  const [enabledArtworkProviders, setEnabledArtworkProviders] = useAtom(
    enabledArtworkProvidersAtom,
  );
  const checkAvailability = useSetAtom(checkArtworkProviderAvailabilityAtom);

  // Check availability for all providers on mount
  useEffect(() => {
    artworkProviders.forEach((provider) => {
      // Only check if we haven't checked yet (default true means unchecked)
      if (provider.isAvailable === true && !provider.isLoading) {
        checkAvailability(provider.id);
      }
    });
  }, [artworkProviders, checkAvailability]);

  const handleToggle = (id: string, enabled: boolean) => {
    const newSet = new Set(enabledArtworkProviders);
    if (enabled) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setEnabledArtworkProviders(newSet);
  };

  const handleReorder = (activeId: string, overId: string) => {
    const oldIndex = artworkProviderIds.indexOf(activeId);
    const newIndex = artworkProviderIds.indexOf(overId);
    setArtworkProviderIds(arrayMove(artworkProviderIds, oldIndex, newIndex));
  };

  return (
    <ProviderSection
      title="Artwork Provider"
      providers={artworkProviders}
      onToggle={handleToggle}
      onReorder={handleReorder}
      testId="artwork-provider-section"
    />
  );
};
