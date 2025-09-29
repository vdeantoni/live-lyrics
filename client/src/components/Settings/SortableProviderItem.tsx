import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Circle, CheckCircle, GripVertical, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface ProviderStatus {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
  isEnabled: boolean;
  priority: number;
  isLoading?: boolean;
}

interface SortableProviderItemProps {
  provider: ProviderStatus;
  onToggle: (id: string, enabled: boolean) => void;
}

export const SortableProviderItem = ({
  provider,
  onToggle,
}: SortableProviderItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: provider.id,
    // Add transition config for smoother animations
    transition: {
      duration: 150, // ms
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      data-testid={`provider-item-${provider.id}`}
      data-status={provider.isEnabled ? "active" : "inactive"}
      className={`flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10 ${
        isDragging ? "z-10 scale-105 opacity-50 shadow-lg" : ""
      }`}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          data-testid={`provider-drag-handle-${provider.id}`}
          className="-m-1 cursor-grab rounded p-1 transition-colors active:cursor-grabbing"
          aria-label={`Drag to reorder ${provider.name}`}
        >
          <GripVertical className="h-5 w-5 text-zinc-400" />
        </div>
        <div
          data-testid="provider-status-button"
          data-status={provider.isEnabled ? "active" : "inactive"}
        >
          {provider.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          ) : provider.isAvailable ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <Circle className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div>
          <div className="font-medium text-white">{provider.name}</div>
          <div className="text-sm text-zinc-400">{provider.description}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {provider.priority < 999 && (
          <span className="text-xs text-zinc-500">#{provider.priority}</span>
        )}
        <Switch
          data-testid={`provider-toggle-${provider.id}`}
          checked={provider.isEnabled}
          onCheckedChange={(enabled) => onToggle(provider.id, enabled)}
          disabled={!provider.isAvailable}
        />
      </div>
    </motion.div>
  );
};
