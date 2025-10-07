import { useAtomValue } from "jotai";
import { arrayMove } from "@dnd-kit/sortable";
import { effectiveLyricsProvidersAtom } from "@/atoms/appState";
import { lyricsProviderStatusAtom } from "@/atoms/providerStatusAtoms";
import { ProviderSection } from "./ProviderSection";
import { useSettings } from "@/adapters/react";

export const LyricsProviderSection = () => {
  const lyricsProviders = useAtomValue(effectiveLyricsProvidersAtom) || [];
  const providerStatuses = useAtomValue(lyricsProviderStatusAtom);
  const settings = useSettings();

  // Convert new registry format to ProviderSection format with real status
  const providersForSection = lyricsProviders.map((entry) => {
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
    settings.setProviderEnabled("lyrics", id, enabled);
  };

  const handleReorder = (activeId: string, overId: string) => {
    const currentIds = lyricsProviders.map((entry) => entry.config.id);
    const oldIndex = currentIds.indexOf(activeId);
    const newIndex = currentIds.indexOf(overId);
    const newOrder = arrayMove(currentIds, oldIndex, newIndex);

    // Reorder all providers based on new order
    settings.reorderProviders("lyrics", newOrder);
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
