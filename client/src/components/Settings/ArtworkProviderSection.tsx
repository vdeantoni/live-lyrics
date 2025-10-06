import { useAtomValue } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { effectiveArtworkProvidersAtom } from "@/atoms/appState";
import { ProviderSection } from "./ProviderSection";
import { useSettings } from "@/adapters/react/useSettings";

export const ArtworkProviderSection = () => {
  const artworkProviders = useAtomValue(effectiveArtworkProvidersAtom) || [];
  const settings = useSettings();

  // Convert new registry format to old ProviderSection format
  const providersForSection = artworkProviders.map((entry) => ({
    id: entry.config.id,
    name: entry.config.name,
    description: entry.config.description,
    isAvailable: true, // TODO: Implement status checking in new system
    isEnabled: entry.isEffectivelyEnabled,
    priority: entry.effectivePriority,
    isLoading: false, // TODO: Implement loading states in new system
  }));

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
