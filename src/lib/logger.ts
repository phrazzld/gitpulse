/**
 * Simple logger utility with levels, file output capability, and sanitization
 */
import { LogData, ErrorLike } from "@/types/common";

type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * List of sensitive field keys that should be completely redacted
 */
const SENSITIVE_KEYS = [
  "token",
  "password",
  "secret",
  "key",
  "auth",
  "credential",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "session",
];

/**
 * List of PII (Personally Identifiable Information) field keys that should be partially redacted
 */
const PII_KEYS = [
  "email",
  "name",
  "phone",
  "address",
  "location",
  "ip",
  "ipAddress",
];

/**
 * Redacts sensitive information from log data to prevent accidental exposure
 * of tokens, passwords, PII, and other sensitive information.
 *
 * @param data The data to sanitize before logging
 * @returns A sanitized copy of the data with sensitive information redacted
 */
export function sanitizeLog(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  // For strings, check if they look like tokens (long strings)
  if (typeof data === "string" && data.length > 20) {
    // Redact long strings that might be tokens or keys
    return `${data.substring(0, 4)}...REDACTED...${data.substring(data.length - 4)}`;
  }

  // For arrays, redact each item
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLog(item));
  }

  // Handle Error objects specially
  if (data instanceof Error) {
    const sanitizedError: Record<string, unknown> = {
      name: data.name,
      message: data.message,
      // Don't include stack traces in production as they might contain sensitive path info
      ...(process.env.NODE_ENV !== "production" && { stack: data.stack }),
    };

    // Sanitize additional properties that may have been added to the error
    for (const key in data) {
      if (key !== "name" && key !== "message" && key !== "stack") {
        // Use type assertion since we know we're accessing properties on Error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sanitizedError[key] = sanitizeLog((data as any)[key]);
      }
    }

    return sanitizedError;
  }

  // For objects, redact sensitive fields
  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};

    // Type assertion since we know it's an object
    const objData = data as Record<string, unknown>;

    for (const [key, value] of Object.entries(objData)) {
      // Check if this is a sensitive key
      const lowerKey = key.toLowerCase();

      if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
        // Completely redact sensitive values
        result[key] = "[REDACTED]";
      } else if (PII_KEYS.some((k) => lowerKey.includes(k))) {
        // For PII, partially redact if string
        if (typeof value === "string" && value.length > 3) {
          const firstChar = value.charAt(0);
          const lastChar = value.charAt(value.length - 1);
          result[key] = `${firstChar}...${lastChar}`;
        } else {
          result[key] = value;
        }
      } else if (typeof value === "object" && value !== null) {
        // Recursively redact objects
        result[key] = sanitizeLog(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  // Return all other types unchanged
  return data;
}

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
      const logMessage = this.formatLog("debug", module, message, data);
      console.debug(logMessage);
    }
  }

  public info(module: string, message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      const logMessage = this.formatLog("info", module, message, data);
      console.info(logMessage);
    }
  }

  public warn(module: string, message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      const logMessage = this.formatLog("warn", module, message, data);
      console.warn(logMessage);
    }
  }

  public error(module: string, message: string, data?: unknown): void {
    if (this.shouldLog("error")) {
      const logMessage = this.formatLog("error", module, message, data);
      console.error(logMessage);
    }
  }
}

export const logger = Logger.getInstance();
