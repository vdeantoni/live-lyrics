import { useArtworks, useSong } from "@/lib/api";
import { useEffect, useState, type PropsWithChildren } from "react";

const LyricsViewport = ({ children }: PropsWithChildren) => {
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
    <div
      className={`relative h-full overflow-hidden bg-cover bg-center`}
      style={{
        backgroundImage: `url(${currentArtworkUrl})`,
        transition: "background-image 1s ease-in-out",
      }}
    >
      {children}
    </div>
  );
};

export default LyricsViewport;
