import { useState, useEffect, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { enabledLyricsProvidersAtom, toggleSearchAtom } from "@/atoms/appState";
import { playerStateAtom } from "@/atoms/playerAtoms";
import { loadLyricsProvider } from "@/config/providers";
import type { SearchResult } from "@/types";
import { Search, Loader2, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";

const SearchScreen = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<SearchResult & { providerId: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const enabledProviders = useAtomValue(enabledLyricsProvidersAtom);
  const toggleSearch = useSetAtom(toggleSearchAtom);
  const setPlayerState = useSetAtom(playerStateAtom);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      try {
        // Search across all enabled providers
        const searchPromises = enabledProviders.map(async (providerConfig) => {
          try {
            const provider = await loadLyricsProvider(providerConfig.config.id);
            const providerResults = await provider.search(searchQuery);
            // Tag results with provider ID for deduplication
            return providerResults.map((result) => ({
              ...result,
              providerId: provider.getId(),
            }));
          } catch (error) {
            console.error(
              `Search failed for provider ${providerConfig.config.id}:`,
              error,
            );
            return [];
          }
        });

        const allResults = await Promise.all(searchPromises);
        const flatResults = allResults.flat();

        // Deduplicate by track ID (keeping first occurrence)
        const uniqueResults = flatResults.filter(
          (result, index, self) =>
            index === self.findIndex((r) => r.id === result.id),
        );

        setResults(uniqueResults);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [enabledProviders],
  );

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleResultClick = async (result: SearchResult) => {
    // Update player state with selected song
    setPlayerState((prev) => ({
      ...prev,
      name: result.trackName,
      artist: result.artistName,
      album: result.albumName,
      duration: result.duration,
      currentTime: 0,
      isPlaying: false,
    }));

    // Close search screen
    toggleSearch();
  };

  const handleClearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div
      data-testid="search-screen"
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-zinc-900/95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white">Search Lyrics</h2>
        <p className="text-sm text-zinc-400">
          Find songs across all lyrics providers
        </p>
      </div>

      {/* Search Input */}
      <div className="border-b border-white/10 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a song..."
            className="w-full rounded-lg border border-white/10 bg-zinc-800/50 py-3 pl-11 pr-10 text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            autoFocus
          />
          {query && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Empty State - No Query */}
        {!isSearching && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg text-zinc-400">Search for lyrics</p>
            <p className="mt-2 text-sm text-zinc-500">
              Enter a song name, artist, or album
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg text-zinc-400">No results found</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try a different search term
            </p>
          </div>
        )}

        {/* Results List */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={`${result.providerId}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full rounded-lg border border-white/10 bg-zinc-800/50 p-4 text-left transition-all hover:scale-[1.02] hover:border-blue-500/50 hover:bg-zinc-800 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-white">
                      {result.trackName}
                    </h3>
                    <p className="truncate text-sm text-zinc-400">
                      {result.artistName}
                    </p>
                    {result.albumName && (
                      <p className="truncate text-xs text-zinc-500">
                        {result.albumName}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-zinc-500">
                      {formatTime(result.duration)}
                    </span>
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                      {result.providerId}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;
