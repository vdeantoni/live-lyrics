import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import LyricsVisualizer from "@/components/LyricsVisualizer/LyricsVisualizer";

// Create a client with aggressive caching
const queryClient = new QueryClient();

// Create localStorage persister
const persister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: "LIVE_LYRICS_CACHE", // Custom key for our app
  throttleTime: 1000, // Throttle writes to localStorage
});

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year - keep persisted data for a year
        buster: "v1", // Cache version - increment to invalidate old caches
      }}
    >
      <div className="flex flex-col items-center m-auto p-8">
        <LyricsVisualizer />
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}

export default App;
