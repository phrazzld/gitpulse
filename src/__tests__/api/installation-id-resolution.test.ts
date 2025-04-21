// Installation ID resolution test
import {
  mockCreateAuthenticatedOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  mockGetServerSession,
  createApiHandlerTestHelper,
} from "../api-test-utils";
import { mockSession, mockInstallation } from "../test-utils";
import { GET as summaryGet } from "@/app/api/summary/route";
import { GET as reposGet } from "@/app/api/repos/route";
import { GET as myActivityGet } from "@/app/api/my-activity/route";
import {
  resolveInstallationId,
  resolveMultipleInstallationIds,
} from "@/lib/auth/installationHelper";

// Create test helpers for each API route
const summaryTestHelper = createApiHandlerTestHelper(summaryGet);
const reposTestHelper = createApiHandlerTestHelper(reposGet);
const myActivityTestHelper = createApiHandlerTestHelper(myActivityGet);

// Mock the installation helper methods for controlled testing
jest.mock("@/lib/auth/installationHelper", () => {
  const original = jest.requireActual("@/lib/auth/installationHelper");
  return {
    ...original,
    resolveInstallationId: jest.fn(),
    resolveMultipleInstallationIds: jest.fn().mockReturnValue([123456]),
    requireInstallationId: jest.fn().mockReturnValue(123456),
    InstallationIdSource: original.InstallationIdSource,
  };
});

// Mock the Gemini API for generating summaries
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

describe("API: Installation ID Resolution", () => {
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

    // Default mock implementations for installation helper methods
    (resolveInstallationId as jest.Mock).mockReturnValue({
      isValid: true,
      id: 123456,
      source: "query",
    });

    (resolveMultipleInstallationIds as jest.Mock).mockReturnValue([123456]);
  });

  describe("Summary API", () => {
    it("should handle invalid installation ID from query parameters", async () => {
      // Mock the installation helper to return invalid result
      (resolveMultipleInstallationIds as jest.Mock).mockReturnValueOnce([]);
      (resolveInstallationId as jest.Mock).mockReturnValueOnce({
        isValid: false,
        source: "query",
        error: "Invalid installation ID",
      });

      // Call the summary API without session installation ID but with query param
      mockGetServerSession.mockResolvedValueOnce({
        ...mockSession,
        installationId: undefined,
        accessToken: undefined,
      });

      const response = await summaryTestHelper.callHandler(
        "/api/summary",
        "GET",
        {
          since: "2025-01-01",
          until: "2025-01-31",
          installation_id: "invalid",
        },
      );

      // Verify error response
      expect(response.status).toBe(403);
      expect(response.data.error).toBeDefined();
      expect(response.data.needsInstallation).toBe(true);
    });

    it("should use fallback to first available installation when enabled", async () => {
      // Mock available installations
      const mockAvailableInstallations = [
        { id: 111111, account: { login: "org1" } },
        { id: 222222, account: { login: "org2" } },
      ];

      // Mock fallback behavior
      (resolveMultipleInstallationIds as jest.Mock).mockImplementationOnce(
        (options) => {
          // Simulate the actual method's fallback behavior
          if (
            options.availableInstallations?.length > 0 &&
            options.useFirstAvailableAsFallback
          ) {
            return [options.availableInstallations[0].id];
          }
          return [];
        },
      );

      // Call the summary API with no installation ID
      mockGetServerSession.mockResolvedValueOnce({
        ...mockSession,
        installationId: undefined,
        accessToken: "mock-access-token",
      });

      // Mock the getAllAppInstallations function
      const mockGetAllInstallations = jest
        .fn()
        .mockResolvedValue(mockAvailableInstallations);
      jest.mock("@/lib/auth/githubAuth", () => ({
        ...jest.requireActual("@/lib/auth/githubAuth"),
        getAllAppInstallations: () => mockGetAllInstallations(),
        createAuthenticatedOctokit: () => mockCreateAuthenticatedOctokit(),
      }));

      const response = await summaryTestHelper.callHandler(
        "/api/summary",
        "GET",
        {
          since: "2025-01-01",
          until: "2025-01-31",
        },
      );

      // Verify response contains installation information
      expect(response.status).toBe(200);
      expect(resolveMultipleInstallationIds).toHaveBeenCalled();
    });
  });

  describe("Repos API", () => {
    it("should handle cookie-based installation ID resolution", async () => {
      // Mock the installation helper to return cookie source
      (resolveInstallationId as jest.Mock).mockReturnValueOnce({
        isValid: true,
        id: 123456,
        source: "cookie",
      });

      // Remove session installation ID to force cookie resolution
      mockGetServerSession.mockResolvedValueOnce({
        ...mockSession,
        installationId: undefined,
      });

      const response = await reposTestHelper.callHandler("/api/repos");

      // Verify the API succeeded
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(resolveInstallationId).toHaveBeenCalled();
    });

    it("should handle missing installation ID with OAuth fallback", async () => {
      // Mock the installation helper to return no installation ID
      (resolveInstallationId as jest.Mock).mockReturnValueOnce({
        isValid: false,
        source: "none",
        error: "No installation ID found",
      });

      // Set up session with OAuth token but no installation ID
      mockGetServerSession.mockResolvedValueOnce({
        ...mockSession,
        installationId: undefined,
        accessToken: "mock-oauth-token",
      });

      const response = await reposTestHelper.callHandler("/api/repos");

      // Verify the API succeeded using OAuth
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it("should return error when no authentication method is available", async () => {
      // Mock the installation helper to return no installation ID
      (resolveInstallationId as jest.Mock).mockReturnValueOnce({
        isValid: false,
        source: "none",
        error: "No installation ID found",
      });

      // Set up session with no oauth token and no installation ID
      mockGetServerSession.mockResolvedValueOnce({
        ...mockSession,
        installationId: undefined,
        accessToken: undefined,
      });

      const response = await reposTestHelper.callHandler("/api/repos");

      // Verify error response
      expect(response.status).toBe(403);
      expect(response.data.error).toBeDefined();
      expect(response.data.needsInstallation).toBe(true);
    });
  });

  describe("My Activity API", () => {
    it("should handle session-based installation ID resolution", async () => {
      // Mock the installation helper to return session source
      (resolveInstallationId as jest.Mock).mockReturnValueOnce({
        isValid: true,
        id: 123456,
        source: "session",
      });

      const response = await myActivityTestHelper.callHandler(
        "/api/my-activity",
        "GET",
        {
          page: "1",
          count: "10",
        },
      );

      // Verify the API succeeded
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(resolveInstallationId).toHaveBeenCalled();
    });

    it("should handle error when installation ID exists but is not accessible", async () => {
      // Mock the installation helper to indicate installation exists but validation fails
      (resolveInstallationId as jest.Mock).mockReturnValueOnce({
        isValid: false,
        id: 123456,
        source: "query",
        error: "Installation ID not found in available installations",
      });

      // Remove OAuth token to force GitHub App authentication
      mockGetServerSession.mockResolvedValueOnce({
        ...mockSession,
        accessToken: undefined,
      });

      const response = await myActivityTestHelper.callHandler(
        "/api/my-activity",
        "GET",
        {
          page: "1",
          count: "10",
          installation_id: "123456",
        },
      );

      // Verify authorization error
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.error).toBeDefined();
    });

    it("should handle GitHub API errors during installation ID validation", async () => {
      // Mock the installation helper to return valid ID
      (resolveInstallationId as jest.Mock).mockReturnValueOnce({
        isValid: true,
        id: 123456,
        source: "query",
      });

      // Mock error in createAuthenticatedOctokit
      mockCreateAuthenticatedOctokit.mockImplementationOnce(() => {
        throw new Error("GitHub API Error");
      });

      const response = await myActivityTestHelper.callHandler(
        "/api/my-activity",
        "GET",
        {
          page: "1",
          count: "10",
        },
      );

      // Verify error response
      expect(response.status).toBe(500);
      expect(response.data.error).toBeDefined();
    });
  });
});
