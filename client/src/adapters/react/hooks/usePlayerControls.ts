import { useCallback } from "react";
import { emit } from "@/core/events/bus";

/**
 * Hook that provides player control functions
 * Replaces the old playerControlAtom
 *
 * @example
 * const { play, pause, seek, next, previous } = usePlayerControls();
 * <button onClick={play}>Play</button>
 * <button onClick={() => seek(30)}>Seek to 30s</button>
 * <button onClick={next}>Next</button>
 * <button onClick={previous}>Previous</button>
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

  const next = useCallback(() => {
    emit({ type: "player.next" });
  }, []);

  const previous = useCallback(() => {
    emit({ type: "player.previous" });
  }, []);

  return { play, pause, seek, next, previous };
};
