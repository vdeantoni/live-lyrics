import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  SortableProviderItem,
  type ProviderStatus,
} from "./SortableProviderItem";
import { useState } from "react";

interface ProviderSectionProps {
  title: string;
  providers: ProviderStatus[];
  onToggle: (id: string, enabled: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
  testId?: string;
}

export const ProviderSection = ({
  title,
  providers,
  onToggle,
  onReorder,
  testId,
}: ProviderSectionProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }

    setActiveId(null);
  };

  const activeProvider = providers.find((provider) => provider.id === activeId);

  return (
    <div className="space-y-3" data-testid={testId}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={providers.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className="space-y-3"
            data-testid={testId ? `${testId}-list` : undefined}
          >
            {providers.map((provider) => (
              <SortableProviderItem
                key={provider.id}
                provider={provider}
                onToggle={onToggle}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay
          adjustScale={false}
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeProvider ? (
            <div
              style={{
                cursor: "grabbing",
                opacity: 0.95,
                pointerEvents: "none",
              }}
            >
              <SortableProviderItem
                provider={activeProvider}
                onToggle={onToggle}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
