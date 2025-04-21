import { createApiErrorResponse } from "../auth/apiErrorHandler";
import {
  GitHubError,
  GitHubAuthError,
  GitHubConfigError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubApiError,
} from "../errors";
import { ApiErrorResponse } from "@/types/api";

// Mock the randomUUID function to return a predictable value
jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "test-request-id"),
}));

// Mock the logger to prevent console output during tests
jest.mock("../logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("API Error Handling", () => {
  describe("createApiErrorResponse", () => {
    it("should create a standard error response from a GitHubAuthError", async () => {
      const error = new GitHubAuthError("Invalid authentication token", {
        status: 401,
        context: { source: "test" },
      });

      const response = createApiErrorResponse(
        error,
        { testContext: true },
        "test-module",
      );
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(403); // Should use 403 instead of 401
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "GitHub authentication token is invalid or expired",
          code: "GITHUB_TOKEN_ERROR",
          details: "Invalid authentication token",
          requestId: "test-request-id",
          signOutRequired: true,
          metadata: { source: "test" },
        }),
      );
      expect(response.headers.get("X-Request-ID")).toBe("test-request-id");
    });

    it("should create a standard error response from a GitHubRateLimitError", async () => {
      const now = Math.floor(Date.now() / 1000);
      const resetTimestamp = now + 3600; // 1 hour from now

      const error = new GitHubRateLimitError("API rate limit exceeded", {
        resetTimestamp,
        context: { source: "test" },
      });

      const response = createApiErrorResponse(error);
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(429);
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "GitHub API rate limit exceeded",
          code: "GITHUB_RATE_LIMIT_ERROR",
          details: "API rate limit exceeded",
          requestId: "test-request-id",
          resetAt: new Date(resetTimestamp * 1000).toISOString(),
        }),
      );
      expect(jsonData.metadata).toHaveProperty("secondsUntilReset");
      expect(jsonData.metadata).toHaveProperty("minutesUntilReset");
      expect(jsonData.metadata).toHaveProperty("source", "test");
    });

    it("should create a standard error response from a GitHubNotFoundError", async () => {
      const error = new GitHubNotFoundError("Repository not found", {
        context: { repo: "test/repo" },
      });

      const response = createApiErrorResponse(error);
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(404);
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "GitHub resource not found",
          code: "GITHUB_NOT_FOUND_ERROR",
          details: "Repository not found",
          requestId: "test-request-id",
          metadata: { repo: "test/repo" },
        }),
      );
    });

    it("should create a standard error response from a GitHubConfigError", async () => {
      const error = new GitHubConfigError(
        "GitHub App credentials not configured",
        {
          context: { missingFields: ["GITHUB_APP_ID"] },
        },
      );

      const response = createApiErrorResponse(error);
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(500);
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "GitHub App not properly configured",
          code: "GITHUB_APP_CONFIG_ERROR",
          details: "GitHub App credentials not configured",
          requestId: "test-request-id",
          metadata: {
            configIssue: true,
            missingFields: ["GITHUB_APP_ID"],
          },
        }),
      );
    });

    it("should create a standard error response from a GitHubApiError", async () => {
      const error = new GitHubApiError("Bad request", {
        status: 400,
        context: { method: "GET", path: "/repos" },
      });

      const response = createApiErrorResponse(error);
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(400);
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "GitHub API error occurred",
          code: "GITHUB_API_ERROR",
          details: "Bad request",
          requestId: "test-request-id",
          metadata: { method: "GET", path: "/repos" },
        }),
      );
    });

    it("should create a standard error response from a standard Error", async () => {
      const error = new Error("Unknown error occurred");

      const response = createApiErrorResponse(error);
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(500);
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "An error occurred",
          code: "API_ERROR",
          details: "Unknown error occurred",
          requestId: "test-request-id",
        }),
      );
      expect(jsonData.metadata).toBeUndefined();
    });

    it("should create a standard error response from non-Error objects", async () => {
      const error = "String error message";

      const response = createApiErrorResponse(error);
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(500);
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "An unexpected error occurred",
          code: "UNKNOWN_ERROR",
          details: "String error message",
          requestId: "test-request-id",
        }),
      );
    });

    it("should handle validation errors with a specific error code", async () => {
      const error = new Error("Validation error: Invalid input");

      const response = createApiErrorResponse(error);
      const jsonData = (await response.json()) as ApiErrorResponse;

      expect(response.status).toBe(400); // Bad request for validation errors
      expect(jsonData).toEqual(
        expect.objectContaining({
          error: "An error occurred",
          code: "VALIDATION_ERROR", // Special code for validation errors
          details: "Validation error: Invalid input",
          requestId: "test-request-id",
        }),
      );
    });
  });
});
