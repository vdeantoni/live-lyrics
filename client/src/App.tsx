import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Provider as JotaiProvider } from "jotai";
import { useAtomValue } from "jotai";
import Player from "@/components/Player/Player";
import { useBootstrap } from "@/hooks/useBootstrap";
import { coreAppStateAtom } from "@/atoms/appState";
import { currentArtworkUrlAtom } from "@/atoms/playerAtoms";

// Create a client with aggressive caching
const queryClient = new QueryClient();

// Create localStorage persister
const persister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: "LIVE_LYRICS_CACHE", // Custom key for our app
  throttleTime: 1000, // Throttle writes to localStorage
});

// Inner component to use hooks inside Jotai Provider
const AppContent = () => {
  // Bootstrap the app (initializes registry + checks availability)
  useBootstrap();

  // Wait for bootstrap to complete
  const appState = useAtomValue(coreAppStateAtom);
  const currentArtworkUrl = useAtomValue(currentArtworkUrlAtom);

  if (appState.error) {
    return (
      <div className="m-auto flex h-full w-full items-center justify-center">
        <div className="text-red-400">Error: {appState.error}</div>
      </div>
    );
  }

  return (
    <div
      className="m-auto flex h-full w-full flex-col items-center p-2 lg:p-4 xl:p-8"
      style={{
        backgroundImage: currentArtworkUrl
          ? `url(${currentArtworkUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Subtle overlay for better contrast */}
      {currentArtworkUrl && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
      )}

      <div className="relative z-10 h-full w-full">
        <Player />
      </div>
    </div>
  );
};

function App() {
  return (
    <JotaiProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year - keep persisted data for a year
          buster: "v1", // Cache version - increment to invalidate old caches
        }}
      >
        <AppContent />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
      </PersistQueryClientProvider>
    </JotaiProvider>
  );
}

export default App;
