import mitt from "mitt";
import type { AppEvent } from "./types";

/**
 * Event bus for application-wide communication
 * Uses mitt for lightweight publish-subscribe pattern
 */
type EventMap = {
  [K in AppEvent["type"]]: Extract<AppEvent, { type: K }>;
};

export const eventBus = mitt<EventMap>();

/**
 * Type-safe event emitter
 * @example emit({ type: 'player.play' })
 * @example emit({ type: 'player.seek', payload: { time: 10 } })
 */
export const emit = <T extends AppEvent>(event: T): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventBus.emit(event.type, event as any);
};

/**
 * Type-safe event listener
 * @example
 * const unsubscribe = on('player.play', (event) => {
 *   console.log('Player started');
 * });
 * // Later: unsubscribe()
 */
export const on = <T extends AppEvent["type"]>(
  type: T,
  handler: (event: Extract<AppEvent, { type: T }>) => void,
): (() => void) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrappedHandler = (event: any) => handler(event);
  eventBus.on(type, wrappedHandler);
  return () => eventBus.off(type, wrappedHandler);
};

/**
 * Listen to an event once
 */
export const once = <T extends AppEvent["type"]>(
  type: T,
  handler: (event: Extract<AppEvent, { type: T }>) => void,
): void => {
  const unsubscribe = on(type, (event) => {
    handler(event);
    unsubscribe();
  });
};

/**
 * Clear all event listeners (useful for testing)
 */
export const clearAll = (): void => {
  eventBus.all.clear();
};

/**
 * Expose emit function on window for E2E testing
 * This allows test helpers to trigger events
 */
if (typeof window !== "undefined") {
  (window as Window & { __EVENT_BUS__?: { emit: typeof emit } }).__EVENT_BUS__ =
    {
      emit,
    };
}
