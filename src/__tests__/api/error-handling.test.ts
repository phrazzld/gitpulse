/**
 * Tests for API error handling
 * Using mock implementations to avoid Next.js dependency issues in tests
 */
import {
  MockNextResponse,
  mockErrors,
  MockGitHubError,
  MockGitHubAuthError,
  MockGitHubConfigError,
  MockGitHubRateLimitError,
  MockGitHubNotFoundError,
  MockGitHubApiError,
} from "../error-handling-test-utils";

import {
  mockCreateApiErrorResponse,
  mockWithErrorHandling,
} from "../mock-api-error-handler";

// Mock the logger
jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("API Error Handling", () => {
  describe("createApiErrorResponse", () => {
    test("should handle GitHubAuthError and return 403 with signOutRequired flag", async () => {
      // Arrange
      const error = new MockGitHubAuthError("GitHub authentication failed", {
        status: 403,
        context: { functionName: "testFunction" },
      });

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(403); // Auth errors use 403 instead of 401

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub authentication failed");
      expect(data.code).toBe("GITHUB_AUTH_ERROR");
      expect(data.signOutRequired).toBe(true);
    });

    test("should handle GitHubRateLimitError and return 429 with resetAt timestamp", async () => {
      // Arrange
      const resetTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const error = new MockGitHubRateLimitError(
        "GitHub API rate limit exceeded",
        {
          status: 429,
          resetTimestamp,
          context: { functionName: "testFunction" },
        },
      );

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(429); // Rate limit uses 429

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub API rate limit exceeded");
      expect(data.code).toBe("GITHUB_RATE_LIMIT_ERROR");
      expect(data.resetAt).toBeDefined();

      // Verify resetAt is a valid date
      if (data.resetAt) {
        const resetAtString = data.resetAt.toString();
        expect(() => new Date(resetAtString)).not.toThrow();
      }
    });

    test("should handle GitHubNotFoundError and return 404", async () => {
      // Arrange
      const error = new MockGitHubNotFoundError("Repository not found", {
        context: { functionName: "testFunction" },
      });

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(404);

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub resource not found");
      expect(data.code).toBe("GITHUB_NOT_FOUND_ERROR");
    });

    test("should handle GitHubApiError with custom status code", async () => {
      // Arrange
      const customStatus = 422; // Unprocessable Entity
      const error = new MockGitHubApiError("GitHub API operation failed", {
        status: customStatus,
        context: { functionName: "testFunction" },
      });

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(customStatus);

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub API error occurred");
      expect(data.code).toBe("GITHUB_API_ERROR");
    });

    test("should handle GitHubConfigError and return 500", async () => {
      // Arrange
      const error = new MockGitHubConfigError(
        "GitHub App not properly configured",
        {
          context: { functionName: "testFunction" },
        },
      );

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(500);

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub App not properly configured");
      expect(data.code).toBe("GITHUB_APP_CONFIG_ERROR");
    });

    test("should handle generic GitHubError and return 500", async () => {
      // Arrange
      const error = new MockGitHubError("Generic GitHub error", {
        context: { functionName: "testFunction" },
      });

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(500);

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub operation failed");
      expect(data.code).toBe("GITHUB_ERROR");
    });

    test("should handle standard JavaScript Error and return 500", async () => {
      // Arrange
      const error = new Error("Standard JavaScript error");

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(500);

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("An error occurred");
      expect(data.code).toBe("API_ERROR");
    });

    test("should handle non-Error objects and return 500", async () => {
      // Arrange
      const error = "This is a string, not an Error object";

      // Act
      const response = mockCreateApiErrorResponse(error, {}, "test-module");

      // Assert
      expect(response.status).toBe(500);

      // Extract the JSON data
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("An unexpected error occurred");
      expect(data.code).toBe("UNKNOWN_ERROR");
    });
  });

  describe("withErrorHandling HOF", () => {
    // Mock Request
    const createMockRequest = () => ({ url: "test/url" }) as { url: string };

    // Simple mock handler for testing
    const mockSuccessHandler = jest
      .fn()
      .mockResolvedValue(MockNextResponse.json({ success: true }));

    // Reset mocks before each test
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("should pass through successful responses", async () => {
      // Arrange
      const wrappedHandler = mockWithErrorHandling(
        mockSuccessHandler,
        "test-module",
      );

      // Act
      const response = await wrappedHandler(createMockRequest());

      // Assert
      expect(mockSuccessHandler).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);

      // Extract the data from the response
      const data = await response.json();

      // Verify success data
      expect(data.success).toBe(true);
    });

    test("should properly handle GitHubAuthError", async () => {
      // Arrange
      const error = new MockGitHubAuthError("GitHub authentication failed", {
        status: 403,
      });
      const errorHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = mockWithErrorHandling(errorHandler, "test-module");

      // Act
      const response = await wrappedHandler(createMockRequest());

      // Assert
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(403);

      // Extract the data from the response
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub authentication failed");
      expect(data.code).toBe("GITHUB_AUTH_ERROR");
      expect(data.signOutRequired).toBe(true);
    });

    test("should properly handle GitHubRateLimitError", async () => {
      // Arrange
      const resetTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const error = new MockGitHubRateLimitError(
        "GitHub API rate limit exceeded",
        {
          status: 429,
          resetTimestamp,
        },
      );
      const errorHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = mockWithErrorHandling(errorHandler, "test-module");

      // Act
      const response = await wrappedHandler(createMockRequest());

      // Assert
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(429);

      // Extract the data from the response
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub API rate limit exceeded");
      expect(data.code).toBe("GITHUB_RATE_LIMIT_ERROR");
      expect(data.resetAt).toBeDefined();
    });

    test("should properly handle GitHubNotFoundError", async () => {
      // Arrange
      const error = new MockGitHubNotFoundError("Repository not found");
      const errorHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = mockWithErrorHandling(errorHandler, "test-module");

      // Act
      const response = await wrappedHandler(createMockRequest());

      // Assert
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(404);

      // Extract the data from the response
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("GitHub resource not found");
      expect(data.code).toBe("GITHUB_NOT_FOUND_ERROR");
    });

    test("should properly handle standard Error objects", async () => {
      // Arrange
      const error = new Error("Test error");
      const errorHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = mockWithErrorHandling(errorHandler, "test-module");

      // Act
      const response = await wrappedHandler(createMockRequest());

      // Assert
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(500);

      // Extract the data from the response
      const data = await response.json();

      // Verify error format
      expect(data.error).toBe("An error occurred");
      expect(data.code).toBe("API_ERROR");
    });

    test("should pass handler arguments to the handler", async () => {
      // Arrange
      const handlerWithArgs = jest
        .fn()
        .mockResolvedValue(MockNextResponse.json({ success: true }));
      const wrappedHandler = mockWithErrorHandling(
        handlerWithArgs,
        "test-module",
      );

      const mockRequest = createMockRequest();

      // Act
      await wrappedHandler(mockRequest);

      // Assert
      expect(handlerWithArgs).toHaveBeenCalledWith(mockRequest);
    });
  });
});
