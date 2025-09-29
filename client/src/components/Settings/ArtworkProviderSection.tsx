import { useAtomValue, useAtom, useSetAtom } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useRef } from "react";
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
  const checkedProviders = useRef(new Set<string>());

  // Check availability for all providers on mount and when new providers are added
  useEffect(() => {
    artworkProviders.forEach((provider) => {
      // Only check if we haven't checked this provider yet and it's not currently loading
      if (!checkedProviders.current.has(provider.id) && !provider.isLoading) {
        checkedProviders.current.add(provider.id);
        checkAvailability(provider.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only depend on provider IDs, not their status - prevents infinite re-renders
  }, [artworkProviderIds, checkAvailability]);

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
