import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useSong } from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { ListMusic, Pause, Play, Search } from "lucide-react";
import AnimatedSongName from "./AnimatedSongName";

const Player = () => {
  const { data: song } = useSong();

  return (
    <div className="flex flex-col landscape:flex-row w-full gap-4">
      <div className="flex flex-col min-h-14 max-h-20 landscape:max-w-[30%]">
        <AnimatedSongName className="flex-1" songName={song?.name} />
        <h3 className="text-muted-foreground self-center">{song?.artist}</h3>
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
          className="rounded-full p-2 h-10 w-10"
          aria-label="Search lyrics"
          onClick={() => console.log("Search clicked")}
        >
          <Search />
        </Button>

        <div className="flex-1 flex items-center justify-center">
          {/* Play/Pause Button - Centered */}
          <Button className="rounded-full h-14 w-14 p-0 flex items-center justify-center">
            {song?.isPlaying ? (
              <Pause style={{ width: "32px", height: "32px" }} />
            ) : (
              <Play style={{ width: "32px", height: "32px" }} />
            )}
          </Button>
        </div>

        {/* Playlists Button */}
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full p-2 h-10 w-10"
          aria-label="View playlists"
          onClick={() => console.log("Playlists clicked")}
        >
          <ListMusic />
        </Button>
      </div>
    </div>
  );
};

export default Player;
