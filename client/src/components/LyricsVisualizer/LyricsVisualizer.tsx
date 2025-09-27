import LyricsDisplay from "./LyricsDisplay";
import LyricsProvider from "./LyricsProvider";
import Player from "./Player";

const LyricsVisualizer = () => {
  return (
    <div className="flex flex-col w-full h-full bg-zinc-800 rounded-2xl shadow-xl p-6 gap-4 mx-auto">
      <LyricsDisplay>
        <LyricsProvider />
      </LyricsDisplay>
      <Player />
    </div>
  );
};

export default LyricsVisualizer;
