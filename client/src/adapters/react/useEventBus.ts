import { emit, on, once } from "@/core/events/bus";

/**
 * Hook to access the event bus
 * Provides type-safe event emitting and listening
 *
 * @example
 * const { emit, on } = useEventBus();
 * emit({ type: 'player.play' });
 * const unsubscribe = on('player.state.changed', (event) => { ... });
 */
export const useEventBus = () => {
  return { emit, on, once };
};
