import LyricsDisplay from "./LyricsDisplay";
import LyricsProvider from "./LyricsProvider";
import Player from "./Player";
import SourceSwitcher from "../SourceSwitcher";
import { useSongSync } from "@/hooks/useSongSync";

const LyricsVisualizer = () => {
  // Sync with current music source data - only called once at the top level
  useSongSync();

  return (
    <div className="mx-auto flex h-full w-full flex-col gap-4 rounded-2xl bg-zinc-800 p-6 shadow-xl">
      <LyricsDisplay>
        {/* Floating source switcher overlay */}
        <div className="absolute right-4 top-4 z-20">
          <SourceSwitcher />
        </div>
        <LyricsProvider />
      </LyricsDisplay>
      <Player />
    </div>
  );
};

export default LyricsVisualizer;
