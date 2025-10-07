import { Provider as JotaiProvider } from "jotai";
import { useAtomValue } from "jotai";
import Player from "@/components/Player/Player";
import { useBootstrap } from "@/hooks/useBootstrap";
import { coreAppStateAtom } from "@/atoms/appState";
import { currentArtworkUrlAtom } from "@/atoms/playerAtoms";

// Inner component to use hooks inside Jotai Provider
const AppContent = () => {
  // Bootstrap the app (handles all initialization)
  useBootstrap();

  // App state
  const appState = useAtomValue(coreAppStateAtom);
  const currentArtworkUrl = useAtomValue(currentArtworkUrlAtom);

  // Show error if bootstrap failed
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
      <AppContent />
    </JotaiProvider>
  );
}

export default App;
