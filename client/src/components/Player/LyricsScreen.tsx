import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  songNameAtom,
  artistAtom,
  albumAtom,
  durationAtom,
  currentTimeAtom,
  isPlayingAtom,
} from "@/atoms/playerAtoms";
import { useArtwork } from "@/hooks/useSongSync";
import LyricsProvider from "../LyricsVisualizer/LyricsProvider";

const LyricsScreen = () => {
  // Read song data from atoms (populated by useSongSync in parent)
  const songName = useAtomValue(songNameAtom);
  const artist = useAtomValue(artistAtom);
  const album = useAtomValue(albumAtom);
  const duration = useAtomValue(durationAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const isPlaying = useAtomValue(isPlayingAtom);

  // Construct song object for artwork API
  const song =
    songName && artist
      ? {
          name: songName,
          artist,
          album: album || "",
          duration,
          currentTime,
          isPlaying,
        }
      : undefined;

  const { data: artworks } = useArtwork(song);

  const [currentArtworkUrl, setCurrentArtworkUrl] = useState("");

  useEffect(() => {
    if (artworks && artworks.length > 0) {
      const randomIndex = Math.floor(Math.random() * artworks.length);
      setCurrentArtworkUrl(artworks[randomIndex]);

      const intervalId = setInterval(() => {
        const newRandomIndex = Math.floor(Math.random() * artworks.length);
        setCurrentArtworkUrl(artworks[newRandomIndex]);
      }, 10000); // 10000 milliseconds = 10 seconds

      return () => clearInterval(intervalId);
    }
  }, [artworks]);

  return (
    <div
      data-testid="lyrics-screen"
      className="relative h-full w-full overflow-hidden rounded-xl"
    >
      {/* Background Image Layer with Effects */}
      <div
        data-testid="lyrics-background"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-sm brightness-75 contrast-125 grayscale transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${currentArtworkUrl})`,
        }}
      />

      {/* Dark Gradient Overlay for Better Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Subtle Noise/Grain Texture (Optional) - Simple pattern for better compatibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-5 mix-blend-overlay" />

      {/* Lyrics Content Layer */}
      <div className="relative z-10 h-full">
        <LyricsProvider />
      </div>
    </div>
  );
};

export default LyricsScreen;
