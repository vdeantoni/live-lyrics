import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { ListMusic, Pause, Play, Search } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  currentTimeAtom,
  durationAtom,
  isPlayingAtom,
  songNameAtom,
  artistAtom,
  playAtom,
  pauseAtom,
  seekAtom,
  isDraggingAtom,
} from "@/atoms/playerAtoms";
import AnimatedSongName from "./AnimatedSongName";

const Player = () => {
  // Read atoms
  const currentTime = useAtomValue(currentTimeAtom);
  const duration = useAtomValue(durationAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const songName = useAtomValue(songNameAtom);
  const artist = useAtomValue(artistAtom);

  // Action atoms
  const play = useSetAtom(playAtom);
  const pause = useSetAtom(pauseAtom);
  const seek = useSetAtom(seekAtom);
  const setDragging = useSetAtom(isDraggingAtom);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSliderChange = ([time]: number[]) => {
    seek(time);
  };

  const handleSliderPointerDown = () => {
    setDragging(true);
  };

  const handleSliderPointerUp = () => {
    setDragging(false);
  };

  return (
    <div className="flex flex-col landscape:flex-row w-full gap-4">
      <div className="flex flex-col min-h-14 max-h-20 landscape:max-w-[30%]">
        <AnimatedSongName className="flex-1" songName={songName} />
        <h3 className="text-muted-foreground self-center">{artist}</h3>
      </div>
      <div className="flex flex-1 items-center gap-3">
        <span id="current-time" className="text-sm min-w-10 text-center">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 0}
          step={0.1}
          className="bg-zinc-700 rounded-md"
          onValueChange={handleSliderChange}
          onPointerDown={handleSliderPointerDown}
          onPointerUp={handleSliderPointerUp}
        />
        <span id="total-duration" className="text-sm min-w-10 text-center">
          {formatTime(duration)}
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
          <Button
            className="rounded-full h-12 w-12 flex items-center justify-center"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause style={{ width: "24px", height: "24px" }} />
            ) : (
              <Play style={{ width: "24px", height: "24px" }} />
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
