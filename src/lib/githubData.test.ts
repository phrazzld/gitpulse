import { Octokit } from "octokit";
import { createAuthenticatedOctokit, GitHubCredentials } from "./auth/githubAuth";
import {
  fetchRepositories,
  fetchAppRepositories,
  fetchAllRepositories,
  fetchRepositoryCommitsWithOctokit,
  fetchRepositoryCommits,
  fetchCommitsForRepositoriesWithOctokit,
  fetchCommitsForRepositories,
  Commit
} from "./githubData";

// Mock dependencies
jest.mock("octokit");
jest.mock("./auth/githubAuth");
jest.mock("./logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe("githubData", () => {
  // Mock repositories data
  const mockRepositories = [
    {
      id: 1,
      name: "repo1",
      full_name: "owner/repo1",
      owner: { login: "owner" },
      private: false,
      html_url: "https://github.com/owner/repo1",
      description: "Test repository 1",
      language: "TypeScript"
    },
    {
      id: 2,
      name: "repo2",
      full_name: "owner/repo2",
      owner: { login: "owner" },
      private: true,
      html_url: "https://github.com/owner/repo2",
      description: "Test repository 2",
      language: "JavaScript"
    }
  ];

  // Mock commits data
  const mockCommits: Commit[] = [
    {
      sha: "abc123",
      commit: {
        author: {
          name: "Test User",
          email: "test@example.com",
          date: "2025-01-01T00:00:00Z"
        },
        committer: {
          name: "Test User",
          email: "test@example.com",
          date: "2025-01-01T00:00:00Z"
        },
        message: "feat: add new feature"
      },
      html_url: "https://github.com/owner/repo1/commit/abc123",
      author: {
        login: "testuser",
        avatar_url: "https://example.com/avatar.jpg"
      }
    },
    {
      sha: "def456",
      commit: {
        author: {
          name: "Another User",
          email: "another@example.com",
          date: "2025-01-02T00:00:00Z"
        },
        committer: {
          name: "Another User",
          email: "another@example.com",
          date: "2025-01-02T00:00:00Z"
        },
        message: "fix: resolve bug"
      },
      html_url: "https://github.com/owner/repo1/commit/def456",
      author: {
        login: "anotheruser",
        avatar_url: "https://example.com/avatar2.jpg"
      }
    }
  ];

  // Mock Octokit instance
  const mockOctokit = {
    paginate: jest.fn(),
    rest: {
      rateLimit: {
        get: jest.fn().mockResolvedValue({
          data: {
            resources: {
              core: {
                limit: 5000,
                remaining: 4990,
                reset: Math.floor(Date.now() / 1000) + 3600
              }
            }
          }
        })
      },
      users: {
        getAuthenticated: jest.fn().mockResolvedValue({
          data: {
            login: "testuser",
            id: 12345,
            type: "User"
          },
          headers: {
            "x-oauth-scopes": "repo, read:org"
          }
        })
      },
      repos: {
        listForAuthenticatedUser: jest.fn(),
        listForOrg: jest.fn(),
        listCommits: jest.fn()
      },
      orgs: {
        listForAuthenticatedUser: jest.fn().mockResolvedValue([
          { login: "testorg" }
        ])
      },
      apps: {
        listReposAccessibleToInstallation: jest.fn()
      }
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Set up paginate mock to return mock repositories or commits based on the method
    (mockOctokit.paginate as jest.Mock).mockImplementation((method) => {
      if (method === mockOctokit.rest.repos.listForAuthenticatedUser) {
        return Promise.resolve(mockRepositories);
      }
      if (method === mockOctokit.rest.orgs.listForAuthenticatedUser) {
        return Promise.resolve([{ login: "testorg" }]);
      }
      if (method === mockOctokit.rest.repos.listForOrg) {
        return Promise.resolve([mockRepositories[1]]);
      }
      if (method === mockOctokit.rest.apps.listReposAccessibleToInstallation) {
        return Promise.resolve(mockRepositories);
      }
      if (method === mockOctokit.rest.repos.listCommits) {
        return Promise.resolve(mockCommits);
      }
      return Promise.resolve([]);
    });

    // Mock createAuthenticatedOctokit to return our mock Octokit
    (createAuthenticatedOctokit as jest.MockedFunction<typeof createAuthenticatedOctokit>)
      .mockResolvedValue(mockOctokit as unknown as Octokit);
    
    // Mock Octokit constructor
    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => {
      return mockOctokit as unknown as Octokit;
    });
  });

  describe("fetchRepositories", () => {
    it("should fetch repositories using provided Octokit instance", async () => {
      // Call the function with our mock Octokit
      const repositories = await fetchRepositories(mockOctokit as unknown as Octokit);
      
      // Verify function used the provided Octokit instance
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listForAuthenticatedUser,
        expect.objectContaining({
          visibility: "all",
          affiliation: "owner,collaborator,organization_member"
        })
      );
      
      // Verify it returns the expected repositories
      expect(repositories).toEqual(mockRepositories);
    });

    it("should throw an error if Octokit instance is not provided", async () => {
      // Call the function without an Octokit instance
      await expect(fetchRepositories(undefined as unknown as Octokit))
        .rejects
        .toThrow("Octokit instance is required");
    });
  });

  describe("fetchAppRepositories", () => {
    it("should fetch repositories accessible to GitHub App installation", async () => {
      // Call the function with our mock Octokit
      const repositories = await fetchAppRepositories(mockOctokit as unknown as Octokit);
      
      // Verify function used the provided Octokit instance
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.apps.listReposAccessibleToInstallation,
        expect.objectContaining({
          per_page: 100
        })
      );
      
      // Verify it returns the expected repositories
      expect(repositories).toEqual(mockRepositories);
    });

    it("should throw an error if Octokit instance is not provided", async () => {
      // Call the function without an Octokit instance
      await expect(fetchAppRepositories(undefined as unknown as Octokit))
        .rejects
        .toThrow("Octokit instance is required");
    });
  });

  describe("fetchAllRepositories (backward-compatible function)", () => {
    it("should authenticate with OAuth token and fetch repositories when provided with accessToken", async () => {
      // Call the backward-compatible function with an access token
      const accessToken = "test-oauth-token";
      const repositories = await fetchAllRepositories(accessToken);
      
      // Verify it created an authenticated Octokit with the correct credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "oauth",
        token: accessToken
      });
      
      // Verify it called fetchRepositories with the authenticated Octokit
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listForAuthenticatedUser,
        expect.any(Object)
      );
      
      // Verify it returns the expected repositories
      expect(repositories).toEqual(mockRepositories);
    });

    it("should authenticate with GitHub App and fetch repositories when provided with installationId", async () => {
      // Call the backward-compatible function with an installation ID
      const installationId = 12345;
      const repositories = await fetchAllRepositories(undefined, installationId);
      
      // Verify it created an authenticated Octokit with the correct credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "app",
        installationId
      });
      
      // Verify it called fetchAppRepositories with the authenticated Octokit
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.apps.listReposAccessibleToInstallation,
        expect.any(Object)
      );
      
      // Verify it returns the expected repositories
      expect(repositories).toEqual(mockRepositories);
    });

    it("should throw an error when neither accessToken nor installationId is provided", async () => {
      // Call the function without auth methods
      await expect(fetchAllRepositories())
        .rejects
        .toThrow("No GitHub authentication available. Please sign in again.");
    });

    it("should prioritize GitHub App auth when both accessToken and installationId are provided", async () => {
      // Call the function with both auth methods
      const accessToken = "test-oauth-token";
      const installationId = 12345;
      await fetchAllRepositories(accessToken, installationId);
      
      // Verify it created an authenticated Octokit with the App credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "app",
        installationId
      });
      
      // Verify it called fetchAppRepositories, not fetchRepositories
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.apps.listReposAccessibleToInstallation,
        expect.any(Object)
      );
    });
  });

  describe("fetchRepositoryCommitsWithOctokit", () => {
    it("should fetch repository commits using provided Octokit instance", async () => {
      // Call the function with our mock Octokit and test parameters
      const owner = "owner";
      const repo = "repo1";
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      const commits = await fetchRepositoryCommitsWithOctokit(
        mockOctokit as unknown as Octokit,
        owner,
        repo,
        since,
        until
      );
      
      // Verify function used the provided Octokit instance correctly
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner,
          repo,
          since,
          until,
          per_page: 100
        })
      );
      
      // Verify that repository info was attached to commits
      expect(commits).toEqual(mockCommits.map(commit => ({
        ...commit,
        repository: {
          full_name: `${owner}/${repo}`
        }
      })));
    });

    it("should handle filtering commits by author", async () => {
      // Call the function with author parameter
      const owner = "owner";
      const repo = "repo1";
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      const author = "testuser";
      
      await fetchRepositoryCommitsWithOctokit(
        mockOctokit as unknown as Octokit,
        owner,
        repo,
        since,
        until,
        author
      );
      
      // Verify author parameter was included in the API call
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner,
          repo,
          since,
          until,
          author,
          per_page: 100
        })
      );
    });

    it("should throw an error if Octokit instance is not provided", async () => {
      // Call the function without an Octokit instance
      await expect(fetchRepositoryCommitsWithOctokit(
        undefined as unknown as Octokit,
        "owner",
        "repo1",
        "2025-01-01",
        "2025-01-31"
      ))
        .rejects
        .toThrow("Octokit instance is required");
    });
  });

  describe("fetchRepositoryCommits (backward-compatible function)", () => {
    it("should authenticate with OAuth token and fetch repository commits", async () => {
      // Call the backward-compatible function with an access token
      const accessToken = "test-oauth-token";
      const owner = "owner";
      const repo = "repo1";
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      const commits = await fetchRepositoryCommits(
        accessToken,
        undefined,
        owner,
        repo,
        since,
        until
      );
      
      // Verify it created an authenticated Octokit with the correct credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "oauth",
        token: accessToken
      });
      
      // Verify it called fetchRepositoryCommitsWithOctokit with the authenticated Octokit
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner,
          repo,
          since,
          until
        })
      );
      
      // Verify it returns the expected commits with repository info attached
      expect(commits).toEqual(mockCommits.map(commit => ({
        ...commit,
        repository: {
          full_name: `${owner}/${repo}`
        }
      })));
    });

    it("should authenticate with GitHub App and fetch repository commits", async () => {
      // Call the backward-compatible function with an installation ID
      const installationId = 12345;
      const owner = "owner";
      const repo = "repo1";
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      await fetchRepositoryCommits(
        undefined,
        installationId,
        owner,
        repo,
        since,
        until
      );
      
      // Verify it created an authenticated Octokit with the App credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "app",
        installationId
      });
      
      // Verify it called fetchRepositoryCommitsWithOctokit with the authenticated Octokit
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner,
          repo,
          since,
          until
        })
      );
    });

    it("should throw an error when neither accessToken nor installationId is provided", async () => {
      // Call the function without auth methods
      await expect(fetchRepositoryCommits(
        undefined,
        undefined,
        "owner",
        "repo1",
        "2025-01-01",
        "2025-01-31"
      ))
        .rejects
        .toThrow("No GitHub authentication available. Please sign in again.");
    });

    it("should prioritize GitHub App auth when both accessToken and installationId are provided", async () => {
      // Call the function with both auth methods
      const accessToken = "test-oauth-token";
      const installationId = 12345;
      const owner = "owner";
      const repo = "repo1";
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      await fetchRepositoryCommits(
        accessToken,
        installationId,
        owner,
        repo,
        since,
        until
      );
      
      // Verify it created an authenticated Octokit with the App credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "app",
        installationId
      });
    });
  });

  describe("fetchCommitsForRepositoriesWithOctokit", () => {
    it("should fetch commits for multiple repositories using provided Octokit instance", async () => {
      // Set up test parameters
      const repositories = ["owner/repo1", "owner/repo2"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      // Call the function with our mock Octokit
      const commits = await fetchCommitsForRepositoriesWithOctokit(
        mockOctokit as unknown as Octokit,
        repositories,
        since,
        until
      );
      
      // Verify it called fetchRepositoryCommitsWithOctokit for each repository
      expect(mockOctokit.paginate).toHaveBeenCalledTimes(repositories.length);
      
      // Verify it called with the correct parameters for the first repository
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo1",
          since,
          until,
          per_page: 100
        })
      );
      
      // Verify it called with the correct parameters for the second repository
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo2",
          since,
          until,
          per_page: 100
        })
      );
      
      // Verify it returns the expected combined commits with repository info
      // Each repository would return mockCommits, so we should have 2 * mockCommits.length
      expect(commits.length).toBe(repositories.length * mockCommits.length);
    });

    it("should filter commits by author when provided", async () => {
      // Set up test parameters
      const repositories = ["owner/repo1"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      const author = "testuser";
      
      await fetchCommitsForRepositoriesWithOctokit(
        mockOctokit as unknown as Octokit,
        repositories,
        since,
        until,
        author
      );
      
      // Verify it included the author parameter in the API call
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo1",
          since,
          until,
          author,
          per_page: 100
        })
      );
    });

    it("should handle empty repository list", async () => {
      // Call with empty repositories array
      const commits = await fetchCommitsForRepositoriesWithOctokit(
        mockOctokit as unknown as Octokit,
        [],
        "2025-01-01",
        "2025-01-31"
      );
      
      // Verify no API calls were made
      expect(mockOctokit.paginate).not.toHaveBeenCalled();
      
      // Verify empty array is returned
      expect(commits).toEqual([]);
    });

    it("should throw an error if Octokit instance is not provided", async () => {
      await expect(fetchCommitsForRepositoriesWithOctokit(
        undefined as unknown as Octokit,
        ["owner/repo1"],
        "2025-01-01",
        "2025-01-31"
      ))
        .rejects
        .toThrow("Octokit instance is required");
    });

    it("should retry with owner name if no commits found with provided author", async () => {
      // Setup test parameters
      const repositories = ["owner/repo1"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      const author = "nonexistentuser";
      
      // Make first call return empty array (no commits found)
      const noCommitsMock = jest.fn().mockResolvedValueOnce([]);
      mockOctokit.paginate.mockImplementationOnce(noCommitsMock);
      
      // Second call (with owner as author) returns commits
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve(mockCommits));
      
      await fetchCommitsForRepositoriesWithOctokit(
        mockOctokit as unknown as Octokit,
        repositories,
        since,
        until,
        author
      );
      
      // Verify it first tried with the provided author
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo1",
          author: "nonexistentuser"
        })
      );
      
      // Verify it retried with the owner as the author
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo1",
          author: "owner"
        })
      );
    });

    it("should retry without author filter if no commits found with owner as author", async () => {
      // Setup test parameters
      const repositories = ["owner/repo1"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      const author = "nonexistentuser";
      
      // First call returns empty array (no commits found with provided author)
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve([]));
      
      // Second call returns empty array (no commits found with owner as author)
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve([]));
      
      // Third call (without author filter) returns commits
      mockOctokit.paginate.mockImplementationOnce(() => Promise.resolve(mockCommits));
      
      await fetchCommitsForRepositoriesWithOctokit(
        mockOctokit as unknown as Octokit,
        repositories,
        since,
        until,
        author
      );
      
      // Verify it first tried with the provided author
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo1",
          author: "nonexistentuser"
        })
      );
      
      // Verify it tried with the owner as the author next
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo1",
          author: "owner"
        })
      );
      
      // Verify it finally tried without any author filter
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          owner: "owner",
          repo: "repo1",
          author: undefined
        })
      );
    });
  });

  describe("fetchCommitsForRepositories (backward-compatible function)", () => {
    it("should authenticate with OAuth token and fetch commits for repositories", async () => {
      // Call the backward-compatible function with an access token
      const accessToken = "test-oauth-token";
      const repositories = ["owner/repo1", "owner/repo2"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      const commits = await fetchCommitsForRepositories(
        accessToken,
        undefined,
        repositories,
        since,
        until
      );
      
      // Verify it created an authenticated Octokit with the correct credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "oauth",
        token: accessToken
      });
      
      // Verify it called the base function with the authenticated Octokit
      expect(mockOctokit.paginate).toHaveBeenCalledTimes(repositories.length);
      
      // Verify the returned commits
      expect(commits.length).toBe(repositories.length * mockCommits.length);
    });

    it("should authenticate with GitHub App and fetch commits for repositories", async () => {
      // Call the backward-compatible function with an installation ID
      const installationId = 12345;
      const repositories = ["owner/repo1"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      await fetchCommitsForRepositories(
        undefined,
        installationId,
        repositories,
        since,
        until
      );
      
      // Verify it created an authenticated Octokit with the App credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "app",
        installationId
      });
      
      // Verify it called the base function with the authenticated Octokit
      expect(mockOctokit.paginate).toHaveBeenCalled();
    });

    it("should throw an error when neither accessToken nor installationId is provided", async () => {
      // Call the function without auth methods
      await expect(fetchCommitsForRepositories(
        undefined,
        undefined,
        ["owner/repo1"],
        "2025-01-01",
        "2025-01-31"
      ))
        .rejects
        .toThrow("No GitHub authentication available. Please sign in again.");
    });

    it("should prioritize GitHub App auth when both accessToken and installationId are provided", async () => {
      // Call the function with both auth methods
      const accessToken = "test-oauth-token";
      const installationId = 12345;
      const repositories = ["owner/repo1"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      
      await fetchCommitsForRepositories(
        accessToken,
        installationId,
        repositories,
        since,
        until
      );
      
      // Verify it created an authenticated Octokit with the App credentials
      expect(createAuthenticatedOctokit).toHaveBeenCalledWith({
        type: "app",
        installationId
      });
    });

    it("should pass author parameter correctly when provided", async () => {
      // Call with author parameter
      const accessToken = "test-oauth-token";
      const repositories = ["owner/repo1"];
      const since = "2025-01-01T00:00:00Z";
      const until = "2025-01-31T23:59:59Z";
      const author = "testuser";
      
      await fetchCommitsForRepositories(
        accessToken,
        undefined,
        repositories,
        since,
        until,
        author
      );
      
      // Verify it included the author parameter in the API call
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.rest.repos.listCommits,
        expect.objectContaining({
          author
        })
      );
    });
  });
});