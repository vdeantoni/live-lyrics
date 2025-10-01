import { useAtomValue, useSetAtom } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import {
  effectiveArtworkProvidersAtom,
  updateProviderSettingAtom,
} from "@/atoms/appState";
import { ProviderSection } from "./ProviderSection";

export const ArtworkProviderSection = () => {
  const artworkProviders = useAtomValue(effectiveArtworkProvidersAtom) || [];
  const updateProviderSetting = useSetAtom(updateProviderSettingAtom);

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
    updateProviderSetting("artwork", id, { disabled: !enabled });
  };

  const handleReorder = (activeId: string, overId: string) => {
    const currentIds = artworkProviders.map((entry) => entry.config.id);
    const oldIndex = currentIds.indexOf(activeId);
    const newIndex = currentIds.indexOf(overId);
    const newOrder = arrayMove(currentIds, oldIndex, newIndex);

    // Update priorities based on new order
    newOrder.forEach((id, index) => {
      updateProviderSetting("artwork", id, { priority: index + 1 });
    });
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
