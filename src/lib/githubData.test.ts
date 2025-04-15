import { Octokit } from "octokit";
import { createAuthenticatedOctokit, GitHubCredentials } from "./auth/githubAuth";
import {
  fetchRepositories,
  fetchAppRepositories,
  fetchAllRepositories
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
        listForOrg: jest.fn()
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
    
    // Set up paginate mock to return mock repositories
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
});