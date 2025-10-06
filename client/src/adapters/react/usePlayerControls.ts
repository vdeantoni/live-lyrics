import { useCallback } from "react";
import { emit } from "@/core/events/bus";

/**
 * Hook that provides player control functions
 * Replaces the old playerControlAtom
 *
 * @example
 * const { play, pause, seek } = usePlayerControls();
 * <button onClick={play}>Play</button>
 * <button onClick={() => seek(30)}>Seek to 30s</button>
 */
export const usePlayerControls = () => {
  const play = useCallback(() => {
    emit({ type: "player.play" });
  }, []);

  const pause = useCallback(() => {
    emit({ type: "player.pause" });
  }, []);

  const seek = useCallback((time: number) => {
    emit({ type: "player.seek", payload: { time } });
  }, []);

  return { play, pause, seek };
};
