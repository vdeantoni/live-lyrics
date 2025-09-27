import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useSong } from "@/lib/api";
import { formatTime } from "@/lib/utils";

const Player = () => {
  const { data: song } = useSong();

  return (
    <div className="flex flex-col landscape:flex-row w-full gap-4">
      <div className="flex flex-col items-center min-h-14">
        <h2 className="text-2xl font-semibold">{song?.name}</h2>
        <h3 className="text-muted-foreground">{song?.artist}</h3>
      </div>
      <div className="flex flex-1 items-center gap-3">
        <span id="current-time" className="text-sm min-w-10 text-center">
          {formatTime(song?.currentTime || 0)}
        </span>
        <Slider
          value={[song?.currentTime || 0]}
          min={0}
          max={song?.duration}
          step={0.1}
          className=" bg-zinc-700 rounded-md"
        />
        <span id="total-duration" className="text-sm min-w-10 text-center">
          {formatTime(song?.duration || 0)}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {/* Search Button */}
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full p-2 h-10 w-10 hover:bg-white/10"
          aria-label="Search lyrics"
          onClick={() => console.log("Search clicked")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/80"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </Button>

        <div className="flex-1 flex items-center justify-center">
          {/* Play/Pause Button - Centered */}
          <Button className="rounded-full py-7 text-3xl">
            {song?.isPlaying ? "❚❚" : "▶"}
          </Button>
        </div>

        {/* Playlists Button */}
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full p-2 h-10 w-10 hover:bg-white/10"
          aria-label="View playlists"
          onClick={() => console.log("Playlists clicked")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/80"
          >
            <path d="M16 6l-4 6-4-6" />
            <rect x="3" y="10" width="18" height="2" rx="1" />
            <rect x="3" y="14" width="18" height="2" rx="1" />
            <rect x="3" y="18" width="18" height="2" rx="1" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default Player;
