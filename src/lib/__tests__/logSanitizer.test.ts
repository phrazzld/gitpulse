import {
  LogSanitizer,
  SanitizationLevel,
  SanitizationMethod,
  SensitiveDataType,
  logSanitizer,
  sanitizeLog,
} from "../logSanitizer";
import { logger } from "../logger";

// Mock console methods to test logger output
const originalConsoleDebug = console.debug;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe("LogSanitizer", () => {
  let sanitizer: LogSanitizer;

  // Mock console methods
  beforeAll(() => {
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    // Restore original console methods
    console.debug = originalConsoleDebug;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Create a new instance for each test to avoid state leaking between tests
    sanitizer = new LogSanitizer();
  });

  describe("basic sanitization", () => {
    it("should handle null and undefined", () => {
      expect(sanitizer.sanitize(null)).toBeNull();
      expect(sanitizer.sanitize(undefined)).toBeUndefined();
    });

    it("should redact sensitive keys", () => {
      const data = {
        token: "secret-token",
        password: "secret-password",
        apiKey: "secret-api-key",
        normalValue: "not-sensitive",
      };

      const sanitized = sanitizer.sanitize(data) as Record<string, unknown>;

      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.normalValue).toBe("not-sensitive");
    });

    it("should partially redact PII data", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "123-456-7890",
      };

      const sanitized = sanitizer.sanitize(data) as Record<string, unknown>;

      // Should be partially redacted
      expect(sanitized.name).not.toBe("John Doe");
      expect(typeof sanitized.name).toBe("string");

      expect(sanitized.email).not.toBe("john@example.com");
      expect(typeof sanitized.email).toBe("string");

      expect(sanitized.phoneNumber).not.toBe("123-456-7890");
      expect(typeof sanitized.phoneNumber).toBe("string");
    });
  });

  describe("logger integration", () => {
    it("should sanitize data in logger.info calls", () => {
      const sensitiveData = {
        token: "secret-token",
        normalValue: "normal",
      };

      logger.info("test-module", "Test message", sensitiveData);

      expect(console.info).toHaveBeenCalled();
      const loggedMessage = (console.info as jest.Mock).mock.calls[0][0];

      // Sensitive data should be redacted
      expect(loggedMessage).not.toContain("secret-token");
      expect(loggedMessage).toContain("[REDACTED]");

      // Non-sensitive data should be preserved
      expect(loggedMessage).toContain("normal");
    });

    it("should sanitize errors in logger.error calls", () => {
      const error = new Error("Test error");
      (error as unknown as Record<string, unknown>).token = "secret-token";

      logger.error("test-module", "Error occurred", error);

      expect(console.error).toHaveBeenCalled();
      const loggedMessage = (console.error as jest.Mock).mock.calls[0][0];

      // Error message should be preserved
      expect(loggedMessage).toContain("Test error");

      // Sensitive data should be redacted
      expect(loggedMessage).not.toContain("secret-token");
      expect(loggedMessage).toContain("[REDACTED]");
    });
  });

  describe("sanitizeLogData", () => {
    it("should sanitize data while preserving module and message", () => {
      const result = sanitizer.sanitizeLogData("auth", "Login successful", {
        token: "secret-token",
        userId: "123",
      });

      expect(result.module).toBe("auth");
      expect(result.message).toBe("Login successful");

      const data = result.data as Record<string, unknown>;
      expect(data.token).toBe("[REDACTED]");
      expect(data.userId).toBe("123");
    });
  });

  describe("singleton behavior", () => {
    it("should use the same instance for multiple getInstance calls", () => {
      const instance1 = LogSanitizer.getInstance();
      const instance2 = LogSanitizer.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should make sanitizeLog function use the singleton instance", () => {
      const data = { token: "secret-token" };

      // Direct call to sanitizeLog should use the singleton instance
      const sanitized = sanitizeLog(data) as Record<string, unknown>;

      expect(sanitized.token).toBe("[REDACTED]");
    });
  });
});
