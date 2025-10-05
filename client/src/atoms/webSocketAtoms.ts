import { atom } from "jotai";

/**
 * WebSocket connection state atoms
 */

export type WebSocketConnectionState =
  | "connected"
  | "disconnected"
  | "reconnecting";

export const wsConnectionStateAtom =
  atom<WebSocketConnectionState>("disconnected");
export const wsErrorAtom = atom<string | null>(null);
export const wsLastUpdateAtom = atom<number>(Date.now());
export const wsReconnectAttemptsAtom = atom<number>(0);

/**
 * Update connection state
 */
export const updateWsConnectionStateAtom = atom(
  null,
  (_get, set, state: WebSocketConnectionState) => {
    set(wsConnectionStateAtom, state);
    if (state === "connected") {
      set(wsReconnectAttemptsAtom, 0);
      set(wsErrorAtom, null);
    }
  },
);

/**
 * Set WebSocket error
 */
export const setWsErrorAtom = atom(null, (_get, set, error: string | null) => {
  set(wsErrorAtom, error);
});

/**
 * Increment reconnect attempts
 */
export const incrementWsReconnectAttemptsAtom = atom(null, (get, set) => {
  const current = get(wsReconnectAttemptsAtom);
  set(wsReconnectAttemptsAtom, current + 1);
});

/**
 * Update last received message timestamp
 */
export const updateWsLastUpdateAtom = atom(null, (_get, set) => {
  set(wsLastUpdateAtom, Date.now());
});
