import { useAtomValue } from "jotai";
import { currentMusicModeAtom } from "@/atoms/settingsAtoms";

/**
 * Hook that provides music control functions using the current music mode
 */
export const useMusicControl = () => {
  const musicMode = useAtomValue(currentMusicModeAtom);

  const play = async () => {
    if (musicMode) {
      await musicMode.play();
    }
  };

  const pause = async () => {
    if (musicMode) {
      await musicMode.pause();
    }
  };

  const seek = async (time: number) => {
    if (musicMode) {
      await musicMode.seek(time);
    }
  };

  return {
    play,
    pause,
    seek,
    isAvailable: !!musicMode,
  };
};
