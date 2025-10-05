import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Music, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";
import type { Song } from "@/types";

interface QueueColumnProps {
  showHeader?: boolean;
}

interface SortableQueueItemProps {
  song: Song;
  index: number;
  onRemove: () => void;
}

const SortableQueueItem = ({
  song,
  index,
  onRemove,
}: SortableQueueItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `queue-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-800/50 p-3 transition-all hover:border-white/20 hover:bg-zinc-800"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Order Number */}
      <span className="w-6 text-center text-sm font-medium text-zinc-500">
        {index + 1}
      </span>

      {/* Song Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{song.name}</p>
        <p className="truncate text-xs text-zinc-400">{song.artist}</p>
      </div>

      {/* Duration */}
      <span className="flex-shrink-0 text-xs text-zinc-500">
        {formatTime(song.duration)}
      </span>

      {/* Remove Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="h-7 w-7 flex-shrink-0 rounded-full p-0 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
        aria-label="Remove from queue"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

const QueueColumn = ({ showHeader = false }: QueueColumnProps) => {
  const { queue, isLoading, error, removeAt, reorder, clear } =
    usePlayerQueue();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start dragging (prevents accidental drags)
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Extract indices from IDs
    const oldIndex = parseInt(active.id.toString().replace("queue-", ""));
    const newIndex = parseInt(over.id.toString().replace("queue-", ""));

    reorder(oldIndex, newIndex);
  };

  return (
    <>
      {/* Optional Header */}
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Queue</h3>
          {queue.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clear}
              className="text-xs hover:bg-red-500/20 hover:text-red-400"
            >
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-2 text-sm text-zinc-400">Loading queue...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Music className="mb-4 h-12 w-12 text-red-500/50" />
          <p className="text-lg text-red-400">Failed to load queue</p>
          <p className="mt-2 text-sm text-zinc-500">{error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && queue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Music className="mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-lg text-zinc-400">Queue is empty</p>
          <p className="mt-2 text-sm text-zinc-500">
            Add songs to start listening
          </p>
        </div>
      )}

      {/* Queue List with Drag & Drop */}
      {!isLoading && !error && queue.length > 0 && (
        <div className="space-y-3">
          {/* Clear All Button (top of list) */}
          {!showHeader && (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="w-full text-xs hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Clear All Queue
            </Button>
          )}

          {/* Draggable Song List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={queue.map((_, idx) => `queue-${idx}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {queue.map((song, index) => (
                  <SortableQueueItem
                    key={`queue-${index}`}
                    song={song}
                    index={index}
                    onRemove={() => removeAt(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </>
  );
};

export default QueueColumn;
