import { Slider } from "../ui/slider";
import { playerStateAtom, playerUIStateAtom } from "../../atoms/playerAtoms";
import { useAtomValue, useSetAtom } from "jotai";
import { usePlayerControls } from "../../adapters/react";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

const SongProgressSlider = ({
  className = "",
}: React.ComponentProps<typeof SliderPrimitive.Root>) => {
  // Read unified atoms
  const { currentTime, duration } = useAtomValue(playerStateAtom);

  // Player controls (event-driven)
  const { seek } = usePlayerControls();

  // Action atoms
  const setPlayerUIState = useSetAtom(playerUIStateAtom);

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
        seek(prev.pendingSeekTime);
      }
      return { ...prev, isDragging: false, pendingSeekTime: undefined };
    });
  };
  return (
    <Slider
      data-testid="progress-slider"
      value={[currentTime]}
      min={0}
      max={duration || 0}
      step={5}
      className={"rounded-md bg-zinc-700 " + className}
      onValueChange={handleSliderChange}
      onPointerDown={handleSliderPointerDown}
      onPointerUp={handleSliderPointerUp}
    />
  );
};

export default SongProgressSlider;
