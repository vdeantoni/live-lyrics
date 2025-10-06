import MainScreen from "./MainScreen";
import PlayerControls from "./PlayerControls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const Player = () => {
  // Global keyboard shortcuts with lyrics navigation
  useKeyboardShortcuts();

  return (
    <div
      data-testid="player"
      className="relative mx-auto flex h-full w-full flex-col gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md"
    >
      <MainScreen />
      <PlayerControls />
    </div>
  );
};

export default Player;
