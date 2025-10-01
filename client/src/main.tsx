import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { providerAPI, providerRegistryAPI } from "./api/providerAPI";
import { getDefaultStore } from "jotai";
import { playerControlAtom } from "./atoms/playerAtoms";

/**
 * Development and testing utilities
 * Expose provider API to window object for E2E tests and debugging
 * TODO: Consider restricting to dev/test environments in production
 */

// Get the global Jotai store for player state management
const store = getDefaultStore();

// Create player control API for testing
const playerControlAPI = {
  seek: async (time: number) => {
    await store.set(playerControlAtom, { type: "seek", payload: time });
  },
  play: async () => {
    await store.set(playerControlAtom, { type: "play" });
  },
  pause: async () => {
    await store.set(playerControlAtom, { type: "pause" });
  },
};

// Make provider API available globally for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).providerAPI = providerAPI;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).providerRegistryAPI = providerRegistryAPI; // Maintain backward compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).playerControlAPI = playerControlAPI;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
