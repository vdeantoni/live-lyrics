import { useArtworks, useSong } from "@/lib/api";
import { useEffect, useState, type PropsWithChildren } from "react";

const LyricsDisplay = ({ children }: PropsWithChildren) => {
  const { data: song } = useSong();
  const { data: artworks } = useArtworks(song!);

  const [currentArtworkUrl, setCurrentArtworkUrl] = useState("");

  useEffect(() => {
    if (artworks && artworks.length > 0) {
      const randomIndex = Math.floor(Math.random() * artworks.length);
      setCurrentArtworkUrl(artworks[randomIndex].url);

      const intervalId = setInterval(() => {
        const newRandomIndex = Math.floor(Math.random() * artworks.length);
        setCurrentArtworkUrl(artworks[newRandomIndex].url);
      }, 10000); // 10000 milliseconds = 10 seconds

      return () => clearInterval(intervalId);
    }
  }, [artworks]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background Image Layer with Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${currentArtworkUrl})`,
          filter: "blur(4px) grayscale(0.7) brightness(0.6) contrast(1.1)",
          transform: "scale(1.1)", // Slightly scale to hide blur edges
        }}
      />

      {/* Dark Gradient Overlay for Better Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Subtle Noise/Grain Texture (Optional) */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

export default LyricsDisplay;
