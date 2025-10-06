import { useEffect } from "react";
import { Provider as JotaiProvider } from "jotai";
import { useAtomValue } from "jotai";
import Player from "@/components/Player/Player";
import LoadingScreen from "@/components/Player/LoadingScreen";
import EmptyScreen from "@/components/Player/EmptyScreen";
import { useBootstrap } from "@/hooks/useBootstrap";
import { coreAppStateAtom } from "@/atoms/appState";
import { currentArtworkUrlAtom, isPlayerEmptyAtom } from "@/atoms/playerAtoms";
import { initializeEventHandlers } from "@/core/services/eventHandlers";
import { useEventSync } from "@/adapters/react/useEventSync";
import { usePlayerSync } from "@/adapters/react/usePlayerSync";
import { useLyricsSync } from "@/adapters/react/useLyricsSync";
import { useArtworkSync } from "@/adapters/react/useArtworkSync";

// Inner component to use hooks inside Jotai Provider
const AppContent = () => {
  // Initialize event handlers once
  useEffect(() => {
    initializeEventHandlers();
  }, []);

  // Bootstrap the app (initializes registry + checks availability)
  useBootstrap();

  // Initialize event-driven architecture
  useEventSync(); // Sync events to atoms
  usePlayerSync(); // Poll/subscribe to player state
  useLyricsSync(); // Fetch lyrics with caching
  useArtworkSync(); // Fetch artwork with caching

  // App and player state
  const appState = useAtomValue(coreAppStateAtom);
  const isPlayerEmpty = useAtomValue(isPlayerEmptyAtom);
  const currentArtworkUrl = useAtomValue(currentArtworkUrlAtom);

  // Show loading screen during bootstrap
  if (appState.isLoading) {
    return <LoadingScreen />;
  }

  // Show error if bootstrap failed
  if (appState.error) {
    return (
      <div className="m-auto flex h-full w-full items-center justify-center">
        <div className="text-red-400">Error: {appState.error}</div>
      </div>
    );
  }

  // Show empty screen when player has no song
  if (isPlayerEmpty) {
    return <EmptyScreen />;
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
      <AppContent />
    </JotaiProvider>
  );
}

export default App;
