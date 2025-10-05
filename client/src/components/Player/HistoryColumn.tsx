import { Clock, Play, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { usePlayerHistory } from "@/hooks/usePlayerHistory";

interface HistoryColumnProps {
  showHeader?: boolean;
}

const HistoryColumn = ({ showHeader = false }: HistoryColumnProps) => {
  const { history, isLoading, error, clear, replay } = usePlayerHistory();

  return (
    <>
      {/* Optional Header */}
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">History</h3>
          {history.length > 0 && (
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
          <p className="mt-2 text-sm text-zinc-400">Loading history...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="mb-4 h-12 w-12 text-red-500/50" />
          <p className="text-lg text-red-400">Failed to load history</p>
          <p className="mt-2 text-sm text-zinc-500">{error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-lg text-zinc-400">No history yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Previously played songs appear here
          </p>
        </div>
      )}

      {/* History List */}
      {!isLoading && !error && history.length > 0 && (
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
              Clear All History
            </Button>
          )}

          {/* History Items (most recent first) */}
          <div className="space-y-2">
            {history
              .slice()
              .reverse()
              .map((song, index) => (
                <div
                  key={`history-${history.length - index}`}
                  className="group flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-800/50 p-3 transition-all hover:border-white/20 hover:bg-zinc-800"
                >
                  {/* Song Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {song.name}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {song.artist}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="flex-shrink-0 text-xs text-zinc-500">
                    {formatTime(song.duration)}
                  </span>

                  {/* Replay Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => replay(song)}
                    className="hover:bg-primary/20 hover:text-primary h-7 w-7 flex-shrink-0 rounded-full p-0 opacity-0 transition-all group-hover:opacity-100"
                    aria-label="Replay song"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryColumn;
