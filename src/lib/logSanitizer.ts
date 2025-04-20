/**
 * Advanced centralized log sanitization utility
 *
 * This module provides utilities to sanitize sensitive information from logs,
 * ensuring that tokens, passwords, PII, and other sensitive data are properly
 * redacted before being written to logs.
 */
import { GenericRecord, LogData } from "@/types/common";

/**
 * Sanitization level determines how aggressively to redact data
 */
export enum SanitizationLevel {
  NONE = "none", // No sanitization (use only for non-sensitive data)
  MINIMAL = "minimal", // Only sanitize explicitly listed sensitive keys
  STANDARD = "standard", // Default level - sanitize standard sensitive data
  STRICT = "strict", // Most aggressive sanitization, treats all unknown values as potentially sensitive
}

/**
 * Sanitization method determines how a value should be redacted
 */
export enum SanitizationMethod {
  COMPLETE = "complete", // Replace value with "[REDACTED]"
  PARTIAL = "partial", // Show first/last characters, e.g. "A***Z"
  HASH = "hash", // Replace with a hash of the value (not reversible, but preserves uniqueness)
  TRUNCATE = "truncate", // Show only first few chars "abcd..."
  CUSTOM = "custom", // Use a custom sanitization function
}

/**
 * Types of data that can be sanitized
 */
export enum SensitiveDataType {
  TOKEN = "token", // Auth tokens, API keys
  PASSWORD = "password", // Passwords and secrets
  PII = "pii", // Personally identifiable information
  FINANCIAL = "financial", // Financial data like credit cards
  SESSION = "session", // Session identifiers
  LOCATION = "location", // Geographical locations
  IP_ADDRESS = "ip_address", // IP addresses
  CUSTOM = "custom", // Custom defined sensitive data
}

/**
 * Configuration for sanitization rules
 */
export interface SanitizationRule {
  pattern: string | RegExp; // Key pattern to match
  method: SanitizationMethod; // How to sanitize
  type: SensitiveDataType; // Type of sensitive data
  preserveLength?: boolean; // Whether to preserve the length of redacted strings
  customFn?: (value: unknown) => unknown; // Custom sanitization function
}

/**
 * Configuration for the log sanitizer
 */
export interface SanitizerConfig {
  level: SanitizationLevel;
  rules: SanitizationRule[];
  preserveType?: boolean; // Whether to preserve the type of the value when sanitizing
  sanitizeErrors?: boolean; // Whether to sanitize Error objects deeply
  sanitizeNestedObjects?: boolean; // Whether to sanitize nested objects deeply
  additionalSensitiveKeys?: string[]; // Additional keys to treat as sensitive
}

/**
 * Default sensitive data patterns - keys containing these patterns will be redacted
 */
const DEFAULT_SENSITIVE_KEYS = [
  // Authentication & Authorization
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
  "jwt",
  "apiKey",
  "privateKey",
  "clientSecret",
  "cert",
  "passphrase",

  // Additional sensitive fields
  "ssn", // Social Security Number
  "tax", // Tax ID
  "creditCard",
  "cardNumber",
  "cvv",
  "pin",
];

/**
 * Default PII (Personally Identifiable Information) patterns
 */
const DEFAULT_PII_KEYS = [
  "email",
  "name",
  "phone",
  "address",
  "location",
  "ip",
  "ipAddress",
  "dob", // Date of birth
  "birthdate",
  "license",
  "passport",
  "nationalId",
  "userIdentifier",
  "accountNumber",
];

/**
 * Default log sanitizer configuration
 */
const DEFAULT_CONFIG: SanitizerConfig = {
  level: SanitizationLevel.STANDARD,
  preserveType: true,
  sanitizeErrors: true,
  sanitizeNestedObjects: true,
  rules: [
    // Authentication tokens and credentials - complete redaction
    {
      pattern: new RegExp(DEFAULT_SENSITIVE_KEYS.join("|"), "i"),
      method: SanitizationMethod.COMPLETE,
      type: SensitiveDataType.TOKEN,
    },
    // PII - partial redaction
    {
      pattern: new RegExp(DEFAULT_PII_KEYS.join("|"), "i"),
      method: SanitizationMethod.PARTIAL,
      type: SensitiveDataType.PII,
    },
    // Email addresses - custom pattern with partial visibility
    {
      pattern: /email/i,
      method: SanitizationMethod.CUSTOM,
      type: SensitiveDataType.PII,
      customFn: (value) => {
        if (typeof value === "string" && value.includes("@")) {
          const [local, domain] = value.split("@");
          return `${local.charAt(0)}***@${domain}`;
        }
        return value;
      },
    },
    // IP addresses - partial redaction
    {
      pattern: /ip(Address|_address)?/i,
      method: SanitizationMethod.CUSTOM,
      type: SensitiveDataType.IP_ADDRESS,
      customFn: (value) => {
        if (typeof value === "string") {
          // Handle IPv4 addresses
          if (/^(\d+\.){3}\d+$/.test(value)) {
            const parts = value.split(".");
            return `${parts[0]}.${parts[1]}.***.***`;
          }
        }
        return value;
      },
    },
  ],
};

/**
 * LogSanitizer class provides methods to sanitize log data
 */
export class LogSanitizer {
  private static instance: LogSanitizer;
  private config: SanitizerConfig;

  /**
   * Create a new LogSanitizer with the given configuration
   * @param config Optional configuration to override defaults
   */
  constructor(config?: Partial<SanitizerConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      rules: [...DEFAULT_CONFIG.rules, ...(config?.rules || [])],
    };

    // Add any additional sensitive keys as rules
    if (config?.additionalSensitiveKeys?.length) {
      this.config.rules.push({
        pattern: new RegExp(config.additionalSensitiveKeys.join("|"), "i"),
        method: SanitizationMethod.COMPLETE,
        type: SensitiveDataType.CUSTOM,
      });
    }
  }

  /**
   * Get the singleton instance of LogSanitizer
   */
  public static getInstance(config?: Partial<SanitizerConfig>): LogSanitizer {
    if (!LogSanitizer.instance) {
      LogSanitizer.instance = new LogSanitizer(config);
    }
    return LogSanitizer.instance;
  }

  /**
   * Update the sanitizer configuration
   * @param config New configuration (partial)
   */
  public updateConfig(config: Partial<SanitizerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      rules: config.rules
        ? [...DEFAULT_CONFIG.rules, ...config.rules]
        : this.config.rules,
    };
  }

  /**
   * Add a new sanitization rule
   * @param rule Rule to add
   */
  public addRule(rule: SanitizationRule): void {
    this.config.rules.push(rule);
  }

  /**
   * Check if a key matches any sensitive patterns
   * @param key The key to check
   * @returns The matching rule or null
   */
  private matchesSensitivePattern(key: string): SanitizationRule | null {
    const lowerKey = key.toLowerCase();

    for (const rule of this.config.rules) {
      if (
        (typeof rule.pattern === "string" &&
          lowerKey.includes(rule.pattern.toLowerCase())) ||
        (rule.pattern instanceof RegExp && rule.pattern.test(lowerKey))
      ) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Sanitize a value using the specified method
   * @param value The value to sanitize
   * @param rule The sanitization rule to apply
   * @returns The sanitized value
   */
  private sanitizeValue(value: unknown, rule: SanitizationRule): unknown {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      return value;
    }

    // Use custom function if provided
    if (rule.method === SanitizationMethod.CUSTOM && rule.customFn) {
      return rule.customFn(value);
    }

    // Handle string values
    if (typeof value === "string") {
      switch (rule.method) {
        case SanitizationMethod.COMPLETE:
          return "[REDACTED]";

        case SanitizationMethod.PARTIAL:
          if (value.length <= 2) return "[REDACTED]";
          return `${value.charAt(0)}...${value.charAt(value.length - 1)}`;

        case SanitizationMethod.TRUNCATE:
          if (value.length <= 4) return "[REDACTED]";
          return `${value.substring(0, 4)}...`;

        case SanitizationMethod.HASH:
          // Simple hash function (for illustration - not cryptographically secure)
          return `[HASH:${this.simpleHash(value)}]`;

        default:
          return "[REDACTED]";
      }
    }

    // For non-string values, use JSON.stringify if possible
    if (typeof value === "object" && value !== null) {
      return "[REDACTED-OBJECT]";
    }

    // For numbers, booleans, etc.
    return "[REDACTED]";
  }

  /**
   * Simple hash function for demonstration purposes
   * Note: Not cryptographically secure, just for logging uniqueness
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).slice(0, 8);
  }

  /**
   * Sanitize an Error object
   * @param error The Error to sanitize
   * @returns A sanitized error object
   */
  private sanitizeError(error: Error): Record<string, unknown> {
    const sanitizedError: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      // Don't include stack traces in production
      ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    };

    // Sanitize additional properties that may have been added to the error
    if (this.config.sanitizeErrors) {
      // Convert Error to unknown first to avoid the type error, then to Record
      const errorAsRecord = error as unknown as Record<string, unknown>;

      // First pass - collect keys that need to be sanitized
      for (const key in errorAsRecord) {
        if (key !== "name" && key !== "message" && key !== "stack") {
          const value = errorAsRecord[key];

          // Check if this is a sensitive key
          const matchingRule = this.matchesSensitivePattern(key);

          if (matchingRule) {
            // Apply sanitization rule to the value
            sanitizedError[key] = this.sanitizeValue(value, matchingRule);
          } else if (
            typeof value === "object" &&
            value !== null &&
            this.config.sanitizeNestedObjects
          ) {
            // Recursively sanitize nested objects
            sanitizedError[key] = this.sanitize(value);
          } else {
            // Keep non-sensitive values unchanged
            sanitizedError[key] = value;
          }
        }
      }
    }

    return sanitizedError;
  }

  /**
   * Main sanitize function for nested objects
   * @param data Data to sanitize
   * @returns Sanitized copy of the data
   */
  public sanitize(data: unknown): unknown {
    // Skip sanitization for null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    // If sanitization is disabled at the configuration level
    if (this.config.level === SanitizationLevel.NONE) {
      return data;
    }

    // Handle Error objects specially
    if (data instanceof Error) {
      return this.sanitizeError(data);
    }

    // For strings, check if they look like tokens (long strings) in strict mode only
    if (
      typeof data === "string" &&
      data.length > 20 &&
      this.config.level === SanitizationLevel.STRICT
    ) {
      // Redact long strings that might be tokens or keys in strict mode
      return `${data.substring(0, 4)}...REDACTED...${data.substring(data.length - 4)}`;
    }

    // For arrays, sanitize each item
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    // For objects, redact sensitive fields
    if (typeof data === "object" && data !== null) {
      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(
        data as Record<string, unknown>,
      )) {
        const matchingRule = this.matchesSensitivePattern(key);

        if (matchingRule) {
          // Sanitize according to the matching rule
          result[key] = this.sanitizeValue(value, matchingRule);
        } else if (
          typeof value === "object" &&
          value !== null &&
          this.config.sanitizeNestedObjects
        ) {
          // Recursively sanitize nested objects
          result[key] = this.sanitize(value);
        } else {
          // Keep non-sensitive values unchanged
          result[key] = value;
        }
      }

      return result;
    }

    // Return other types unchanged (numbers, booleans, etc.)
    return data;
  }

  /**
   * Sanitize log data before it's passed to the logger
   * @param module Module name
   * @param message Log message
   * @param data Additional log data
   * @returns Sanitized log data
   */
  public sanitizeLogData(
    module: string,
    message: string,
    data?: unknown,
  ): { module: string; message: string; data?: unknown } {
    return {
      module,
      message,
      data: data ? this.sanitize(data) : undefined,
    };
  }
}

// Export singleton instance with default config
export const logSanitizer = LogSanitizer.getInstance();

/**
 * Utility function for quick access to the sanitize method
 * @param data Data to sanitize
 * @returns Sanitized data
 */
export function sanitizeLog(data: unknown): unknown {
  return logSanitizer.sanitize(data);
}
