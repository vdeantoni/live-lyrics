import { useCallback, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  artworkLoadingAtom,
  artworkUrlsAtom,
  currentArtworkUrlAtom,
  lyricsLoadingAtom,
} from "@/atoms/playerAtoms";
import { useLogger } from "@/adapters/react/hooks/useLogger";
import LyricsManager from "../LyricsVisualizer/LyricsManager";

const LyricsScreen = () => {
  // Get artwork URLs from atom
  const artworkUrls = useAtomValue(artworkUrlsAtom);
  const currentArtworkUrl = useAtomValue(currentArtworkUrlAtom);
  const setCurrentArtworkUrl = useSetAtom(currentArtworkUrlAtom);
  const logger = useLogger("LyricsScreen");

  // Get loading states for E2E testing
  const artworkLoading = useAtomValue(artworkLoadingAtom);
  const lyricsLoading = useAtomValue(lyricsLoadingAtom);

  // Helper function to preload image before setting as background
  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  const selectAndLoadRandomArtwork = useCallback(
    async (urls: string[]) => {
      const randomIndex = Math.floor(Math.random() * urls.length);
      const selectedUrl = urls[randomIndex];

      try {
        await preloadImage(selectedUrl);
        setCurrentArtworkUrl(selectedUrl);
      } catch (error) {
        logger.warn("Failed to load artwork image", {
          url: selectedUrl,
          error,
        });
        // Fallback: set URL anyway for graceful degradation
        setCurrentArtworkUrl(selectedUrl);
      }
    },
    [setCurrentArtworkUrl, logger],
  );

  useEffect(() => {
    if (artworkUrls && artworkUrls.length > 0) {
      // Load initial random artwork
      void selectAndLoadRandomArtwork(artworkUrls);

      // Set up interval for cycling artwork
      const intervalId = setInterval(() => {
        void selectAndLoadRandomArtwork(artworkUrls);
      }, 10000); // 10000 milliseconds = 10 seconds

      return () => clearInterval(intervalId);
    } else {
      // Clear artwork when no providers are enabled or artwork URLs are empty
      setCurrentArtworkUrl("");
    }
  }, [artworkUrls, selectAndLoadRandomArtwork, setCurrentArtworkUrl]);

  return (
    <div
      data-testid="lyrics-screen"
      data-artwork-loading={artworkLoading}
      data-lyrics-loading={lyricsLoading}
      className="relative h-full w-full overflow-hidden rounded-xl"
    >
      {/* Background Image Layer with Effects - Only render when we have an image */}
      {currentArtworkUrl && (
        <div
          data-testid="lyrics-background"
          className="absolute inset-0 scale-110 bg-cover bg-center blur-sm brightness-75 contrast-125 transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${currentArtworkUrl})`,
          }}
        />
      )}

      {/* Dark Gradient Overlay for Better Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Subtle Noise/Grain Texture (Optional) - Simple pattern for better compatibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-5 mix-blend-overlay" />

      {/* Lyrics Content Layer */}
      <div className="relative z-10 h-full">
        <LyricsManager />
      </div>
    </div>
  );
};

export default LyricsScreen;
