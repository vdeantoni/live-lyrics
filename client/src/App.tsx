import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Provider as JotaiProvider } from "jotai";
import Player from "@/components/Player/Player";
import { useAvailabilityChecks } from "@/hooks/useAvailabilityChecks";

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
  // Check provider availability on app startup
  useAvailabilityChecks();

  return (
    <div className="m-auto flex h-full w-full flex-col items-center p-2 lg:p-4 xl:p-8">
      <Player />
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
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </JotaiProvider>
  );
}

export default App;
