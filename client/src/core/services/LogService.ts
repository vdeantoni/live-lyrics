import { emit } from "@/core/events/bus";
import type { LogLevel } from "@/core/events/types";

/**
 * Centralized logging service that emits log events
 * All logging goes through the event bus for centralized handling
 *
 * @example
 * // In services
 * logService.error("Failed to load player", "PlayerService", { playerId, error });
 *
 * @example
 * // With structured data
 * logService.debug("Fetching lyrics", "LyricsService", {
 *   song: "Song Name",
 *   providers: ["lrclib", "local"]
 * });
 */
class LogService {
  private static instance: LogService;

  private constructor() {}

  static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  /**
   * Log debug message (only shown in development)
   */
  debug(message: string, context?: string, data?: unknown): void {
    this.log("debug", message, context, data);
  }

  /**
   * Log informational message
   */
  info(message: string, context?: string, data?: unknown): void {
    this.log("info", message, context, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: unknown): void {
    this.log("warn", message, context, data);
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, data?: unknown): void {
    this.log("error", message, context, data);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown,
  ): void {
    emit({
      type: "log",
      payload: {
        level,
        message,
        context,
        data,
      },
    });
  }
}

export const logService = LogService.getInstance();
