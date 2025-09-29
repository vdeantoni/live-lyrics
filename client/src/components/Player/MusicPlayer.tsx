import MainScreen from "./MainScreen";
import PlayerControls from "./PlayerControls";
import { useSongSync } from "@/hooks/useSongSync";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const MusicPlayer = () => {
  // Sync with current music mode data - only called once at the top level
  const { songData, musicMode } = useSongSync();

  // Global keyboard shortcuts
  useKeyboardShortcuts(musicMode, songData);

  return (
    <div
      data-testid="music-player"
      className="mx-auto flex h-full w-full flex-col gap-4 rounded-2xl bg-zinc-800 p-6 shadow-xl"
    >
      <MainScreen />
      <PlayerControls />
    </div>
  );
};

export default MusicPlayer;
