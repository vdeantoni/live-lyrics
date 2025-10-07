import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

/**
 * Note: Event bus is exposed via window.__EVENT_BUS__ in core/events/bus.ts
 * This allows E2E tests to emit events for controlling the app
 */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
