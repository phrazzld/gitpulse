/**
 * Logger utility with levels, file output capability, and integrated sanitization
 */
import { ErrorLike, LogData } from "@/types/common";
import { logSanitizer, sanitizeLog } from "./logSanitizer";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = "info";

  constructor() {
    // Set log level from environment if available
    if (process.env.LOG_LEVEL) {
      this.logLevel = process.env.LOG_LEVEL as LogLevel;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private formatLog(
    level: LogLevel,
    module: string,
    message: string,
    data?: unknown,
  ): string {
    const timestamp = this.getTimestamp();

    // Apply sanitization to the data before stringifying
    const sanitizedData = data ? sanitizeLog(data) : undefined;
    const logData = sanitizedData
      ? ` - ${JSON.stringify(sanitizedData, this.replacer)}`
      : "";

    return `[${timestamp}] ${level.toUpperCase()} [${module}] ${message}${logData}`;
  }

  // Custom replacer to handle circular references and Function objects
  private replacer(key: string, value: unknown): unknown {
    if (typeof value === "function") {
      return "[Function]";
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        // Don't include stack traces in production as they might contain sensitive path info
        ...(process.env.NODE_ENV !== "production" && { stack: value.stack }),
      } as ErrorLike;
    }

    // Handle circular references
    const seen = new WeakSet();
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }

    return value;
  }

  public debug(module: string, message: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      // Sanitize log data first
      const sanitized = logSanitizer.sanitizeLogData(module, message, data);
      const logMessage = this.formatLog(
        "debug",
        sanitized.module,
        sanitized.message,
        sanitized.data,
      );
      console.debug(logMessage);
    }
  }

  public info(module: string, message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      // Sanitize log data first
      const sanitized = logSanitizer.sanitizeLogData(module, message, data);
      const logMessage = this.formatLog(
        "info",
        sanitized.module,
        sanitized.message,
        sanitized.data,
      );
      console.info(logMessage);
    }
  }

  public warn(module: string, message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      // Sanitize log data first
      const sanitized = logSanitizer.sanitizeLogData(module, message, data);
      const logMessage = this.formatLog(
        "warn",
        sanitized.module,
        sanitized.message,
        sanitized.data,
      );
      console.warn(logMessage);
    }
  }

  public error(module: string, message: string, data?: unknown): void {
    if (this.shouldLog("error")) {
      // Sanitize log data first
      const sanitized = logSanitizer.sanitizeLogData(module, message, data);
      const logMessage = this.formatLog(
        "error",
        sanitized.module,
        sanitized.message,
        sanitized.data,
      );
      console.error(logMessage);
    }
  }
}

// Export the singleton instance
export const logger = Logger.getInstance();

// Re-export the sanitize function for direct access
export { sanitizeLog } from "./logSanitizer";
