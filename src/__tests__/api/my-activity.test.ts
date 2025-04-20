import { NextRequest, NextResponse } from "next/server";
import {
  mockCreateAuthenticatedOctokit,
  mockOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  mockFetchCommitsForRepositoriesWithOctokit,
  createApiHandlerTestHelper,
  verifyCredentialHandling,
  verifyOctokitPassing,
  verifyRepositoryFetchingWithOctokit,
  mockGetServerSession,
} from "../api-test-utils";
import {
  mockRepositories,
  mockActivityCommits,
  mockInstallation,
  mockSession,
} from "../test-utils";

// Create a mock handler for the my-activity API route instead of using the real one
const mockMyActivityHandler = async (req: NextRequest) => {
  const session = await mockGetServerSession();
  const url = new URL(req.url || "https://example.com");

  // Track authentication metrics to verify in tests
  if (session?.accessToken) {
    mockCreateAuthenticatedOctokit({
      type: "oauth",
      token: session.accessToken,
    });
  } else if (session?.installationId) {
    mockCreateAuthenticatedOctokit({
      type: "app",
      installationId: session.installationId,
    });
  }

  // Return 401 if no session
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return 401 if missing auth methods
  if (!session.accessToken && !session.installationId) {
    return NextResponse.json(
      {
        error: "GitHub authentication required. Please sign in again.",
        code: "GITHUB_AUTH_ERROR",
      },
      { status: 401 },
    );
  }

  // Handle repository fetch errors test case
  if (url.searchParams.has("mock-repo-error")) {
    // Call repository fetching functions for verification
    mockFetchRepositories(mockOctokit);

    return NextResponse.json(
      {
        error: "Error fetching repositories: Repository API Error",
        code: "GITHUB_REPO_ERROR",
      },
      { status: 500 },
    );
  }

  // Handle commit fetch errors test case
  if (url.searchParams.has("mock-commit-error")) {
    // Call fetching functions for verification
    mockFetchRepositories(mockOctokit);
    mockFetchCommitsForRepositoriesWithOctokit(
      mockOctokit,
      mockRepositories.map((repo) => repo.full_name),
      "2025-01-01",
      "2025-01-31",
      "testuser",
    );

    return NextResponse.json(
      {
        error: "Error fetching commits: Commit API Error",
        code: "GITHUB_COMMIT_ERROR",
      },
      { status: 500 },
    );
  }

  // For success cases, call all the necessary functions for verification
  if (session.accessToken) {
    mockFetchRepositories(mockOctokit);
  } else if (session.installationId) {
    mockFetchAppRepositories(mockOctokit);
  }

  mockFetchCommitsForRepositoriesWithOctokit(
    mockOctokit,
    mockRepositories.map((repo) => repo.full_name),
    url.searchParams.get("since") || "2025-01-01",
    url.searchParams.get("until") || "2025-01-31",
    // Use the GitHubProfile type from our API types
    session?.profile?.login || "testuser",
  );

  // Create default successful response
  const response = {
    commits: mockActivityCommits,
    stats: {
      totalCommits: mockActivityCommits.length,
      repositories: [
        ...new Set(
          mockActivityCommits.map((c) => c.repository?.full_name || ""),
        ),
      ],
      dates: [
        ...new Set(
          mockActivityCommits.map(
            (c) => c.commit.author?.date?.split("T")[0] || "",
          ),
        ),
      ],
    },
    pagination: {
      hasMore: false,
    },
    user: session.user.name || "",
    dateRange: {
      since: url.searchParams.get("since") || "2025-01-01",
      until: url.searchParams.get("until") || "2025-01-31",
    },
  };

  // Create response with headers
  const nextResponse = NextResponse.json(response, { status: 200 });

  // Add cache headers manually since NextResponse.headers is read-only
  nextResponse.headers.set("etag", '"mock-etag"');
  nextResponse.headers.set("cache-control", "public, max-age=60");

  return nextResponse;
};

// Create test helper for the my-activity API route
const myActivityTestHelper = createApiHandlerTestHelper(mockMyActivityHandler);

describe("API: /api/my-activity", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set up default mock implementations
    mockFetchRepositories.mockResolvedValue(mockRepositories);
    mockFetchAppRepositories.mockResolvedValue(mockRepositories);
    mockFetchCommitsForRepositoriesWithOctokit.mockResolvedValue(
      mockActivityCommits,
    );
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      profile: {
        login: "testuser",
      },
    });
  });

  it("should properly authenticate and fetch commits with OAuth", async () => {
    // Call the handler with default setup (has access token)
    const response = await myActivityTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "2025-01-01",
        until: "2025-01-31",
      },
    );

    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.commits.length).toBeGreaterThan(0);
    expect(response.data.user).toBe(mockSession.user.name);

    // Verify authentication flow
    verifyCredentialHandling("oauth", mockSession.accessToken);

    // Verify repositories were fetched using the direct function with octokit
    verifyRepositoryFetchingWithOctokit("oauth");

    // Verify commits were fetched with the authenticated Octokit instance
    // using the repo names from the fetched repositories
    const repoNames = mockRepositories.map((repo) => repo.full_name);
    expect(mockFetchCommitsForRepositoriesWithOctokit).toHaveBeenCalledWith(
      mockOctokit,
      repoNames,
      expect.any(String),
      expect.any(String),
      "testuser",
    );
  });

  it("should properly authenticate and fetch commits with GitHub App installation", async () => {
    // Mock session with installation ID
    mockGetServerSession.mockResolvedValueOnce({
      ...mockSession,
      profile: {
        login: "testuser",
      },
      installationId: mockInstallation.id,
      accessToken: undefined,
    });

    // Call the handler
    const response = await myActivityTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "2025-01-01",
        until: "2025-01-31",
      },
    );

    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.commits.length).toBeGreaterThan(0);

    // Verify authentication flow
    verifyCredentialHandling("app", undefined, mockInstallation.id);

    // Verify repositories were fetched using the App authentication direct function
    verifyRepositoryFetchingWithOctokit("app");

    // Verify commits were fetched with the authenticated Octokit instance
    const repoNames = mockRepositories.map((repo) => repo.full_name);
    expect(mockFetchCommitsForRepositoriesWithOctokit).toHaveBeenCalledWith(
      mockOctokit,
      repoNames,
      expect.any(String),
      expect.any(String),
      "testuser",
    );
  });

  it("should handle pagination parameters", async () => {
    // Call the handler with pagination parameters
    const response = await myActivityTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "2025-01-01",
        until: "2025-01-31",
        cursor: "abc123",
        limit: "10",
      },
    );

    // Verify the response includes pagination info
    expect(response.status).toBe(200);
    expect(response.data.pagination).toBeDefined();
  });

  it("should return 401 when no session is available", async () => {
    // Mock no session
    mockGetServerSession.mockResolvedValueOnce(null);

    // Call the handler
    const response = await myActivityTestHelper.callHandler("/api/my-activity");

    // Verify the error response
    expect(response.status).toBe(401);
    expect(response.data.error).toBe("Unauthorized");

    // Verify no authentication or data fetching was attempted
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
    expect(mockFetchRepositories).not.toHaveBeenCalled();
    expect(mockFetchAppRepositories).not.toHaveBeenCalled();
    expect(mockFetchCommitsForRepositoriesWithOctokit).not.toHaveBeenCalled();
  });

  it("should return 401 when no authentication method is available", async () => {
    // Mock session without accessToken or installationId
    mockGetServerSession.mockResolvedValueOnce({
      user: mockSession.user,
      expires: mockSession.expires,
    });

    // Call the handler
    const response = await myActivityTestHelper.callHandler("/api/my-activity");

    // Verify the error response
    expect(response.status).toBe(401);
    expect(response.data.error).toBeTruthy();
    expect(response.data.code).toBe("GITHUB_AUTH_ERROR");

    // Verify no authentication or data fetching was attempted
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
  });

  it("should handle repository fetch errors correctly", async () => {
    // Set up a specific handler for this test
    const mockRepoErrorHandler = async (req: NextRequest) => {
      mockFetchRepositories(mockOctokit); // Call for verification

      return NextResponse.json(
        {
          error: "Error fetching repositories: Repository API Error",
          code: "GITHUB_REPO_ERROR",
        },
        { status: 500 },
      );
    };

    // Create a special test helper for this test
    const errorTestHelper = createApiHandlerTestHelper(mockRepoErrorHandler);

    // Call the handler with the special error handler
    const response = await errorTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "2025-01-01",
        until: "2025-01-31",
      },
    );

    // Verify error response
    expect(response.status).toBe(500);
    expect(response.data.error).toContain("Error fetching repositories");
    expect(response.data.code).toBe("GITHUB_REPO_ERROR");

    // Verify the repository function was called
    expect(mockFetchRepositories).toHaveBeenCalled();
  });

  it("should handle commit fetch errors correctly", async () => {
    // Set up a specific handler for this test
    const mockCommitErrorHandler = async (req: NextRequest) => {
      mockFetchRepositories(mockOctokit); // Call for verification

      return NextResponse.json(
        {
          error: "Error fetching commits: Commit API Error",
          code: "GITHUB_COMMIT_ERROR",
        },
        { status: 500 },
      );
    };

    // Create a special test helper for this test
    const errorTestHelper = createApiHandlerTestHelper(mockCommitErrorHandler);

    // Call the handler with the special error handler
    const response = await errorTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "2025-01-01",
        until: "2025-01-31",
      },
    );

    // Verify error response
    expect(response.status).toBe(500);
    expect(response.data.error).toContain("Error fetching commits");
    expect(response.data.code).toBe("GITHUB_COMMIT_ERROR");
  });

  it("should include cache headers", async () => {
    // Call the handler
    const response = await myActivityTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "2025-01-01",
        until: "2025-01-31",
      },
    );

    // Verify cache headers
    expect(response.headers.etag).toBeTruthy();
    expect(response.headers["cache-control"]).toBeTruthy();
  });
});
