// API error handling edge cases test
import {
  mockCreateAuthenticatedOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  mockFetchCommitsForRepositoriesWithOctokit,
  mockGetServerSession,
  createApiHandlerTestHelper,
} from "../api-test-utils";
import {
  mockSession,
  mockInstallation,
  mockActivityCommits,
} from "../test-utils";
import { GET as summaryGet } from "@/app/api/summary/route";
import { GET as reposGet } from "@/app/api/repos/route";
import { GET as myActivityGet } from "@/app/api/my-activity/route";

// Create test helpers for each API route
const summaryTestHelper = createApiHandlerTestHelper(summaryGet);
const reposTestHelper = createApiHandlerTestHelper(reposGet);
const myActivityTestHelper = createApiHandlerTestHelper(myActivityGet);

// Mock the installation helper
jest.mock("@/lib/auth/installationHelper", () => ({
  resolveInstallationId: jest.fn().mockImplementation(() => ({
    isValid: true,
    id: 123456,
    source: "query",
  })),
  resolveMultipleInstallationIds: jest.fn().mockImplementation(() => [123456]),
  requireInstallationId: jest.fn().mockImplementation(() => 123456),
  InstallationIdSource: {
    QUERY: "query",
    SESSION: "session",
    COOKIE: "cookie",
    AVAILABLE_INSTALLATIONS: "available_installations",
    FALLBACK: "fallback",
    NONE: "none",
  },
}));

// Mock the Gemini API for testing summary route
jest.mock("@/lib/gemini", () => ({
  generateCommitSummary: jest.fn().mockResolvedValue({
    keyThemes: ["Feature Development"],
    technicalAreas: [{ name: "Frontend", count: 5 }],
    accomplishments: ["Implemented new feature"],
    commitsByType: [
      { type: "Feature", count: 5, description: "New functionality" },
    ],
    timelineHighlights: [{ date: "2025-01-01", description: "Started work" }],
    overallSummary: "Added new features",
  }),
}));

// Set Gemini API key in environment
process.env.GEMINI_API_KEY = "test-api-key";

describe("API: Error Handling Edge Cases", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up default mock implementations
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      installationId: mockInstallation.id,
    });

    mockFetchRepositories.mockResolvedValue([
      { id: 1, name: "repo1", fullName: "org/repo1" },
      { id: 2, name: "repo2", fullName: "org/repo2" },
    ]);

    mockFetchAppRepositories.mockResolvedValue([
      { id: 1, name: "repo1", fullName: "org/repo1" },
      { id: 2, name: "repo2", fullName: "org/repo2" },
    ]);

    mockFetchCommitsForRepositoriesWithOctokit.mockResolvedValue(
      mockActivityCommits,
    );
  });

  describe("Summary API Edge Cases", () => {
    it("should handle GitHub API authentication errors", async () => {
      // Mock authentication error from GitHub
      const authError = new Error("Authentication failed");
      authError.name = "HttpError";
      authError.message = "Bad credentials";
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(authError);

      const response = await summaryTestHelper.callHandler(
        "/api/summary",
        "GET",
        {
          since: "2025-01-01",
          until: "2025-01-31",
        },
      );

      // Verify authentication error response
      expect(response.status).toBe(403);
      expect(response.data.error).toBeDefined();
      expect(response.data.code).toBe("GITHUB_AUTH_ERROR");
    });

    it("should handle GitHub App configuration errors", async () => {
      // Mock GitHub App configuration error
      const appError = new Error("GitHub App credentials not configured");
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(appError);

      const response = await summaryTestHelper.callHandler(
        "/api/summary",
        "GET",
        {
          since: "2025-01-01",
          until: "2025-01-31",
        },
      );

      // Verify app configuration error response
      expect(response.status).toBe(403);
      expect(response.data.error).toBeDefined();
      expect(response.data.code).toBe("GITHUB_APP_CONFIG_ERROR");
    });

    it("should handle empty repository list after filtering", async () => {
      // Mock empty repository list after filtering
      mockFetchAppRepositories.mockResolvedValueOnce([]);

      const response = await summaryTestHelper.callHandler(
        "/api/summary",
        "GET",
        {
          since: "2025-01-01",
          until: "2025-01-31",
          repositories: "non-existent/repo",
        },
      );

      // Verify not found response
      expect(response.status).toBe(404);
      expect(response.data.error).toBe(
        "No repositories match the specified filters",
      );
      expect(response.data.filterInfo).toBeDefined();
    });

    it("should handle error in commit fetching", async () => {
      // Mock error in fetching commits
      mockFetchCommitsForRepositoriesWithOctokit.mockRejectedValueOnce(
        new Error("Error fetching commits"),
      );

      const response = await summaryTestHelper.callHandler(
        "/api/summary",
        "GET",
        {
          since: "2025-01-01",
          until: "2025-01-31",
        },
      );

      // Verify error response
      expect(response.status).toBe(500);
      expect(response.data.error).toBeDefined();
      expect(response.data.details).toBeDefined();
    });

    it("should handle error in generating AI summary", async () => {
      // Mock error in generating summary
      const { generateCommitSummary } = jest.requireMock("@/lib/gemini");
      generateCommitSummary.mockRejectedValueOnce(
        new Error("AI summary generation failed"),
      );

      const response = await summaryTestHelper.callHandler(
        "/api/summary",
        "GET",
        {
          since: "2025-01-01",
          until: "2025-01-31",
        },
      );

      // Verify error response
      expect(response.status).toBe(500);
      expect(response.data.error).toBeDefined();
      expect(response.data.details).toBeDefined();
    });
  });

  describe("Repos API Edge Cases", () => {
    it("should handle errors when fetching repositories", async () => {
      // Mock error fetching repositories
      mockFetchAppRepositories.mockRejectedValueOnce(
        new Error("Error fetching repositories"),
      );

      const response = await reposTestHelper.callHandler("/api/repos");

      // Verify error response
      expect(response.status).toBe(500);
      expect(response.data.error).toBeDefined();
    });

    it("should handle GitHub rate limit errors", async () => {
      // Mock rate limit error
      const rateLimitError = new Error("API rate limit exceeded");
      rateLimitError.name = "HttpError";
      rateLimitError.message = "API rate limit exceeded for user";
      mockFetchAppRepositories.mockRejectedValueOnce(rateLimitError);

      const response = await reposTestHelper.callHandler("/api/repos");

      // Verify error response
      expect(response.status).toBe(429);
      expect(response.data.error).toBeDefined();
      expect(response.data.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should handle empty repository list", async () => {
      // Mock empty repository list
      mockFetchAppRepositories.mockResolvedValueOnce([]);

      const response = await reposTestHelper.callHandler("/api/repos");

      // Verify empty repository response
      expect(response.status).toBe(200);
      expect(response.data.repositories).toHaveLength(0);
    });
  });

  describe("My Activity API Edge Cases", () => {
    it("should handle pagination parameter validation", async () => {
      // Test with invalid page parameter
      const response = await myActivityTestHelper.callHandler(
        "/api/my-activity",
        "GET",
        {
          page: "invalid",
          count: "10",
        },
      );

      // Verify validation error response
      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
      expect(response.data.code).toBe("VALIDATION_ERROR");
    });

    it("should handle empty commit results", async () => {
      // Mock empty commit results
      mockFetchCommitsForRepositoriesWithOctokit.mockResolvedValueOnce([]);

      const response = await myActivityTestHelper.callHandler(
        "/api/my-activity",
        "GET",
        {
          page: "1",
          count: "10",
        },
      );

      // Verify empty response
      expect(response.status).toBe(200);
      expect(response.data.commits).toHaveLength(0);
      expect(response.data.hasMore).toBe(false);
    });

    it("should handle unauthorized repository access", async () => {
      // Mock unauthorized error
      const unauthorizedError = new Error("Not Found");
      unauthorizedError.name = "HttpError";
      unauthorizedError.message = "Not Found";
      mockFetchCommitsForRepositoriesWithOctokit.mockRejectedValueOnce(
        unauthorizedError,
      );

      const response = await myActivityTestHelper.callHandler(
        "/api/my-activity",
        "GET",
        {
          page: "1",
          count: "10",
        },
      );

      // Verify error response
      expect(response.status).toBe(404);
      expect(response.data.error).toBeDefined();
    });
  });
});
