import { useEffect } from "react";
import { on } from "@/core/events/bus";
import type { LogLevel } from "@/core/events/types";

/**
 * Log level priority mapping for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Hook that subscribes to log events and outputs them to the console
 *
 * @param minLevel - Minimum log level to output (default: "debug" in dev, "error" in prod)
 *
 * @example
 * // In App.tsx
 * function App() {
 *   // Only show errors in production
 *   useConsoleLogger(import.meta.env.DEV ? "debug" : "error");
 *
 *   return <YourApp />;
 * }
 */
export function useConsoleLogger(minLevel: LogLevel = "debug") {
  useEffect(() => {
    const unsubscribe = on("log", ({ payload }) => {
      const { level, message, context, data } = payload;

      // Filter by minimum level
      if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) {
        return;
      }

      // Format message with context
      const formattedMessage = context ? `[${context}] ${message}` : message;

      // Get appropriate console method
      const consoleFn = console[level] || console.log;

      // Output to console
      if (data !== undefined) {
        consoleFn(formattedMessage, data);
      } else {
        consoleFn(formattedMessage);
      }
    });

    return unsubscribe;
  }, [minLevel]);
}
