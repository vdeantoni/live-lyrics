import { useMemo } from "react";
import { logService } from "@/core/services/LogService";

/**
 * Hook that provides a logger with optional context
 *
 * @param context - Optional context string (e.g., component name, service name)
 * @returns Logger instance with debug/info/warn/error methods
 *
 * @example
 * function SearchScreen() {
 *   const logger = useLogger("SearchScreen");
 *
 *   const handleSearch = async (query: string) => {
 *     try {
 *       logger.debug("Starting search", { query });
 *       const results = await searchLyrics(query);
 *       logger.info("Search completed", { count: results.length });
 *     } catch (error) {
 *       logger.error("Search failed", { query, error });
 *     }
 *   };
 * }
 */
export function useLogger(context?: string) {
  return useMemo(
    () => ({
      debug: (message: string, data?: unknown) =>
        logService.debug(message, context, data),
      info: (message: string, data?: unknown) =>
        logService.info(message, context, data),
      warn: (message: string, data?: unknown) =>
        logService.warn(message, context, data),
      error: (message: string, data?: unknown) =>
        logService.error(message, context, data),
    }),
    [context],
  );
}
