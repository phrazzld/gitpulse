import {
  LogSanitizer,
  SanitizationLevel,
  SanitizationMethod,
  SensitiveDataType,
} from "../logSanitizer";

describe("LogSanitizer", () => {
  let sanitizer: LogSanitizer;

  beforeEach(() => {
    // Create a new instance for each test to avoid state leaking between tests
    sanitizer = new LogSanitizer();
  });

  describe("sanitize method", () => {
    it("should handle null and undefined", () => {
      expect(sanitizer.sanitize(null)).toBeNull();
      expect(sanitizer.sanitize(undefined)).toBeUndefined();
    });

    it("should sanitize sensitive keys in objects", () => {
      const data = {
        name: "John Doe",
        email: "john.doe@example.com",
        token: "secret-token-value",
        clientSecret: "very-secret-client-secret",
        details: {
          password: "secure-password",
          address: "123 Main St",
        },
      };

      const sanitized = sanitizer.sanitize(data) as Record<string, unknown>;

      // Check that sensitive fields are redacted
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.clientSecret).toBe("[REDACTED]");

      // Check that PII is partially redacted
      expect(typeof sanitized.name).toBe("string");
      expect(sanitized.name).not.toBe("John Doe");

      // Check email special handling
      expect(typeof sanitized.email).toBe("string");
      expect(sanitized.email).not.toBe("john.doe@example.com");

      // Check nested objects
      const details = sanitized.details as Record<string, unknown>;
      expect(details.password).toBe("[REDACTED]");
      expect(typeof details.address).toBe("string");
      expect((details.address as string).includes("...")).toBeTruthy();
    });

    it("should sanitize arrays of sensitive data", () => {
      const data = [
        { token: "token1", name: "User 1" },
        { token: "token2", name: "User 2" },
      ];

      const sanitized = sanitizer.sanitize(data) as Array<
        Record<string, unknown>
      >;

      expect(sanitized.length).toBe(2);
      expect(sanitized[0].token).toBe("[REDACTED]");
      expect(sanitized[1].token).toBe("[REDACTED]");

      expect(typeof sanitized[0].name).toBe("string");
      expect(sanitized[0].name).not.toBe("User 1");
    });

    it("should handle Error objects", () => {
      const error = new Error("Something went wrong");
      // Add custom property to the error
      (error as unknown as Record<string, unknown>).token = "secret-token";

      const sanitized = sanitizer.sanitize(error) as Record<string, unknown>;

      expect(sanitized.name).toBe("Error");
      expect(sanitized.message).toBe("Something went wrong");
      expect(sanitized.token).toBe("[REDACTED]");

      // Stack should be present in non-production environments
      if (process.env.NODE_ENV !== "production") {
        expect(sanitized.stack).toBeDefined();
      }
    });

    it("should respect sanitization level", () => {
      // Create sanitizer with MINIMAL level
      const minimalSanitizer = new LogSanitizer({
        level: SanitizationLevel.MINIMAL,
      });

      // Create sanitizer with STRICT level
      const strictSanitizer = new LogSanitizer({
        level: SanitizationLevel.STRICT,
      });

      const data = {
        apiKey: "sensitive-api-key",
        regularField:
          "some-long-string-that-might-look-like-a-token-12345678901234567890",
      };

      // Standard level should sanitize known sensitive keys
      const standardSanitized = sanitizer.sanitize(data) as Record<
        string,
        unknown
      >;
      expect(standardSanitized.apiKey).toBe("[REDACTED]");
      expect(standardSanitized.regularField).toBe(data.regularField);

      // Minimal level should still sanitize known sensitive keys
      const minimalSanitized = minimalSanitizer.sanitize(data) as Record<
        string,
        unknown
      >;
      expect(minimalSanitized.apiKey).toBe("[REDACTED]");
      expect(minimalSanitized.regularField).toBe(data.regularField);

      // For the strict level, we'll test directly on a string in the strict mode
      const longString =
        "some-long-string-that-might-look-like-a-token-12345678901234567890";
      const strictSanitizedString = strictSanitizer.sanitize(longString);
      expect(typeof strictSanitizedString).toBe("string");
      expect(strictSanitizedString).not.toBe(longString);

      // Also test on the same object
      const strictSanitized = strictSanitizer.sanitize(data) as Record<
        string,
        unknown
      >;
      expect(strictSanitized.apiKey).toBe("[REDACTED]");
    });
  });

  describe("sanitizeLogData method", () => {
    it("should sanitize log data including message and module", () => {
      const result = sanitizer.sanitizeLogData(
        "auth",
        "User login successful",
        { userId: "12345", token: "secret-token" },
      );

      expect(result.module).toBe("auth");
      expect(result.message).toBe("User login successful");

      const sanitizedData = result.data as Record<string, unknown>;
      expect(sanitizedData.userId).toBe("12345");
      expect(sanitizedData.token).toBe("[REDACTED]");
    });
  });

  describe("custom rules", () => {
    it("should apply custom sanitization rules", () => {
      // Create sanitizer with custom rule
      const customSanitizer = new LogSanitizer({
        rules: [
          {
            pattern: /userId/i,
            method: SanitizationMethod.CUSTOM,
            type: SensitiveDataType.CUSTOM,
            customFn: (value) =>
              typeof value === "string" ? "user-***" : value,
          },
        ],
      });

      const data = {
        userId: "12345",
        token: "secret-token",
      };

      const sanitized = customSanitizer.sanitize(data) as Record<
        string,
        unknown
      >;

      expect(sanitized.userId).toBe("user-***");
      expect(sanitized.token).toBe("[REDACTED]"); // Default rule still applies
    });
  });
});
