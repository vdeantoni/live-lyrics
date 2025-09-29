import MainScreen from "./MainScreen";
import PlayerControls from "./PlayerControls";
import { useSongSync } from "@/hooks/useSongSync";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const Player = () => {
  // Sync with current player data - only called once at the top level
  useSongSync();

  // Global keyboard shortcuts with lyrics navigation
  useKeyboardShortcuts();

  return (
    <div
      data-testid="player"
      className="mx-auto flex h-full w-full flex-col gap-4 rounded-2xl bg-zinc-800 p-6 shadow-xl"
    >
      <MainScreen />
      <PlayerControls />
    </div>
  );
};

export default Player;
