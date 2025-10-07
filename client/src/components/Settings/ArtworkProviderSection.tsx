import { useAtomValue } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { effectiveArtworkProvidersAtom } from "@/atoms/appState";
import { artworkProviderStatusAtom } from "@/atoms/providerStatusAtoms";
import { ProviderSection } from "./ProviderSection";
import { useSettings } from "@/adapters/react";

export const ArtworkProviderSection = () => {
  const artworkProviders = useAtomValue(effectiveArtworkProvidersAtom) || [];
  const providerStatuses = useAtomValue(artworkProviderStatusAtom);
  const settings = useSettings();

  // Convert new registry format to ProviderSection format with real status
  const providersForSection = artworkProviders.map((entry) => {
    const status = providerStatuses.get(entry.config.id) || {
      isAvailable: false,
      isLoading: true,
    };

    return {
      id: entry.config.id,
      name: entry.config.name,
      description: entry.config.description,
      isAvailable: status.isAvailable,
      isEnabled: entry.isEffectivelyEnabled,
      priority: entry.effectivePriority,
      isLoading: status.isLoading,
    };
  });

  const handleToggle = (id: string, enabled: boolean) => {
    settings.setProviderEnabled("artwork", id, enabled);
  };

  const handleReorder = (activeId: string, overId: string) => {
    const currentIds = artworkProviders.map((entry) => entry.config.id);
    const oldIndex = currentIds.indexOf(activeId);
    const newIndex = currentIds.indexOf(overId);
    const newOrder = arrayMove(currentIds, oldIndex, newIndex);

    // Reorder all providers based on new order
    settings.reorderProviders("artwork", newOrder);
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
