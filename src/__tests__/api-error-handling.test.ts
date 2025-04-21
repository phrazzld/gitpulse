import { createApiError, extractApiErrorInfo } from "@/types/api-error";
import { ApiErrorResponse } from "@/types/api-error";

describe("API Error Handling", () => {
  describe("createApiError", () => {
    it("creates an Error object with API error properties", () => {
      // Arrange
      const errorData: ApiErrorResponse = {
        error: "Test error message",
        code: "TEST_ERROR",
        details: "Additional error details",
        requestId: "123e4567-e89b-12d3-a456-426614174000",
        signOutRequired: true,
        needsInstallation: false,
        resetAt: "2023-01-01T00:00:00Z",
        metadata: {
          customField: "customValue",
        },
      };

      // Act
      const error = createApiError(errorData);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error message");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.details).toBe("Additional error details");
      expect(error.requestId).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(error.signOutRequired).toBe(true);
      expect(error.needsInstallation).toBe(false);
      expect(error.resetAt).toBe("2023-01-01T00:00:00Z");
      expect(error.metadata).toEqual({ customField: "customValue" });
    });

    it("creates an Error object with minimal API error properties", () => {
      // Arrange
      const errorData: ApiErrorResponse = {
        error: "Required error message",
        code: "REQUIRED_CODE",
      };

      // Act
      const error = createApiError(errorData);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Required error message");
      expect(error.code).toBe("REQUIRED_CODE");
      expect(error.details).toBeUndefined();
      expect(error.requestId).toBeUndefined();
      expect(error.signOutRequired).toBeUndefined();
      expect(error.needsInstallation).toBeUndefined();
      expect(error.resetAt).toBeUndefined();
      expect(error.metadata).toBeUndefined();
    });
  });

  describe("extractApiErrorInfo", () => {
    it("extracts API error info from an API error object", () => {
      // Arrange
      const apiError = createApiError({
        error: "API error message",
        code: "API_ERROR",
        details: "API error details",
        requestId: "123e4567-e89b-12d3-a456-426614174000",
        signOutRequired: true,
      });

      // Act
      const errorInfo = extractApiErrorInfo(apiError);

      // Assert
      expect(errorInfo.message).toBe("API error message");
      expect(errorInfo.code).toBe("API_ERROR");
      expect(errorInfo.details).toBe("API error details");
      expect(errorInfo.requestId).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(errorInfo.signOutRequired).toBe(true);
    });

    it("extracts basic error info from a standard Error object", () => {
      // Arrange
      const standardError = new Error("Standard error message");

      // Act
      const errorInfo = extractApiErrorInfo(standardError);

      // Assert
      expect(errorInfo.message).toBe("Standard error message");
      expect(errorInfo.code).toBeUndefined();
      expect(errorInfo.details).toBeUndefined();
      expect(errorInfo.requestId).toBeUndefined();
      expect(errorInfo.signOutRequired).toBeUndefined();
    });

    it("handles non-Error objects", () => {
      // Act
      const errorInfo = extractApiErrorInfo("String error");

      // Assert
      expect(errorInfo.message).toBe("String error");
    });
  });

  // Integration-style test for simulating API error handling
  describe("API error handling integration", () => {
    it("can be used to enhance standard errors with API properties", () => {
      // Simulate fetching data with an error
      const simulateFetch = async () => {
        try {
          // Simulate API call that returns an error
          const response = {
            ok: false,
            json: async () => ({
              error: "GitHub API rate limit exceeded",
              code: "GITHUB_RATE_LIMIT_ERROR",
              details: "You have exceeded the 5000 requests per hour limit",
              requestId: "123e4567-e89b-12d3-a456-426614174000",
              resetAt: "2023-01-01T01:00:00Z",
              metadata: {
                secondsUntilReset: 3600,
              },
            }),
          };

          if (!response.ok) {
            const errorData = await response.json();

            // Create enhanced error with API properties
            const apiError = createApiError(errorData);
            throw apiError;
          }

          return { data: "success" };
        } catch (error) {
          // Handle the error
          const errorInfo = extractApiErrorInfo(error);

          // We can use the structured error info to make decisions
          if (
            errorInfo.code === "GITHUB_RATE_LIMIT_ERROR" &&
            errorInfo.resetAt
          ) {
            return {
              error: errorInfo.message,
              retryAfter: new Date(errorInfo.resetAt),
            };
          }

          return { error: errorInfo.message };
        }
      };

      // Execute the simulated fetch
      return simulateFetch().then((result) => {
        expect(result).toHaveProperty(
          "error",
          "GitHub API rate limit exceeded",
        );
        expect(result).toHaveProperty("retryAfter");
        expect(result.retryAfter).toBeInstanceOf(Date);
      });
    });
  });
});
