import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { ListMusic, ListPlus, Pause, Play, Search } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  playerStateAtom,
  playerUIStateAtom,
  playerControlAtom,
} from "@/atoms/playerAtoms";
import {
  toggleSearchAtom,
  searchOpenAtom,
  togglePlaylistsAtom,
  playlistsOpenAtom,
  openAddToPlaylistDialogAtom,
} from "@/atoms/appState";
import AnimatedSongName from "../LyricsVisualizer/AnimatedSongName";
import { motion } from "framer-motion";

const PlayerControls = () => {
  // Read unified atoms
  const playerState = useAtomValue(playerStateAtom);
  const { currentTime, duration, isPlaying, name, artist } = playerState;
  const isSearchOpen = useAtomValue(searchOpenAtom);
  const isPlaylistsOpen = useAtomValue(playlistsOpenAtom);

  // Action atoms
  const playerControl = useSetAtom(playerControlAtom);
  const setPlayerUIState = useSetAtom(playerUIStateAtom);
  const toggleSearch = useSetAtom(toggleSearchAtom);
  const togglePlaylists = useSetAtom(togglePlaylistsAtom);
  const openAddToPlaylistDialog = useSetAtom(openAddToPlaylistDialogAtom);

  const handlePlayPause = () => {
    if (isPlaying) {
      playerControl({ type: "pause" });
    } else {
      playerControl({ type: "play" });
    }
  };

  const handleSliderChange = ([time]: number[]) => {
    // Update UI immediately but don't seek yet (wait for pointer up)
    setPlayerUIState((prev) => ({ ...prev, pendingSeekTime: time }));
  };

  const handleSliderPointerDown = () => {
    setPlayerUIState((prev) => ({ ...prev, isDragging: true }));
  };

  const handleSliderPointerUp = () => {
    setPlayerUIState((prev) => {
      // Seek to the final time when pointer is released
      if (prev.pendingSeekTime !== undefined) {
        playerControl({ type: "seek", payload: prev.pendingSeekTime });
      }
      return { ...prev, isDragging: false, pendingSeekTime: undefined };
    });
  };

  return (
    <div
      data-testid="player-controls"
      className="flex w-full flex-col gap-2 landscape:flex-row"
    >
      <div className="flex max-h-20 min-h-14 flex-col landscape:max-w-[30%]">
        <AnimatedSongName
          data-testid="song-name"
          className="flex-1"
          songName={name}
        />
        <h3
          data-testid="artist-name"
          className="text-muted-foreground self-center"
        >
          {artist}
        </h3>
      </div>
      <div className="flex flex-1 items-center gap-3">
        <span
          id="current-time"
          data-testid="current-time"
          className="min-w-10 text-center text-sm"
        >
          {formatTime(currentTime)}
        </span>
        <Slider
          data-testid="progress-slider"
          value={[currentTime]}
          min={0}
          max={duration || 0}
          step={5}
          className="rounded-md bg-zinc-700"
          onValueChange={handleSliderChange}
          onPointerDown={handleSliderPointerDown}
          onPointerUp={handleSliderPointerUp}
        />
        <span
          id="total-duration"
          data-testid="duration"
          className="min-w-10 text-center text-sm"
        >
          {formatTime(duration)}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {/* Search Button */}
        <Button
          size="sm"
          variant="ghost"
          className={`dark:hover:bg-accent/0 hover:text-primary h-10 w-10 transform rounded-full p-2 transition-colors ${
            isSearchOpen ? "text-primary" : ""
          }`}
          aria-label="Search lyrics"
          onClick={toggleSearch}
        >
          <motion.div
            animate={{
              scale: isSearchOpen ? [1, 1.2, 1] : 1,
              rotate: isSearchOpen ? [0, 10, -10, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <Search />
          </motion.div>
        </Button>

        {/* Add to Playlist Button */}
        <Button
          size="sm"
          variant="ghost"
          className="dark:hover:bg-accent/0 hover:text-primary h-10 w-10 rounded-full p-2"
          aria-label="Add to playlist"
          onClick={() => openAddToPlaylistDialog(playerState)}
          disabled={!playerState.name}
        >
          <ListPlus />
        </Button>

        <div className="flex flex-1 items-center justify-center">
          {/* Play/Pause Button - Centered */}
          <Button
            data-testid="play-pause-button"
            className="flex h-12 w-12 items-center justify-center rounded-full"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause data-testid="pause-icon" className="h-6 w-6" />
            ) : (
              <Play data-testid="play-icon" className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Playlists Button */}
        <Button
          data-testid="playlists-button"
          size="sm"
          variant="ghost"
          className={`dark:hover:bg-accent/0 hover:text-primary h-10 w-10 rounded-full p-2 transition-colors ${
            isPlaylistsOpen ? "text-primary" : ""
          }`}
          aria-label="View playlists"
          onClick={togglePlaylists}
        >
          <motion.div
            animate={{
              scale: isPlaylistsOpen ? [1, 1.2, 1] : 1,
              rotate: isPlaylistsOpen ? [0, 10, -10, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <ListMusic />
          </motion.div>
        </Button>
      </div>
    </div>
  );
};

export default PlayerControls;
