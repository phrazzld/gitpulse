import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { createAuthenticatedOctokit, GitHubCredentials } from "./githubAuth";
import { GitHubAuthError, GitHubConfigError } from "../errors";

/**
 * TESTING TYPE NOTE:
 * This test file uses `as unknown as Type` type casts in specific cases.
 * While generally discouraged, this pattern is acceptable in test files where:
 *   1. We're mocking complex external libraries with incomplete type definitions
 *   2. The full implementation of mocks isn't needed for the test behavior
 *   3. The cast doesn't affect the correctness of the test itself
 *
 * The alternative would be to create complete mock implementations with proper types,
 * which would add significant complexity with little benefit for test coverage.
 *
 * For TypeScript < 4.9, we use `as unknown as Type` for type casting.
 * For TypeScript >= 4.9, we could use the safer pattern: (value as unknown) as Type
 */

// Mock dependencies
jest.mock("octokit");
jest.mock("@octokit/auth-app");
jest.mock("../logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("githubAuth", () => {
  // Original environment variables
  const originalEnv = { ...process.env };

  // Setup and teardown
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock Octokit constructor
    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => {
      // Create a mock Octokit instance with the minimum required properties
      const mockOctokit = {
        rest: {},
      };
      // This is an intentional two-stage cast for our incomplete mock Octokit
      // We need this because the mock is missing properties required by the full Octokit type
      return mockOctokit as unknown as Octokit;
    });

    // Mock createAppAuth with a simplified approach using type assertion
    (
      createAppAuth as jest.MockedFunction<typeof createAppAuth>
    ).mockImplementation(() => {
      // Create a function with just enough implementation for testing
      const mockAuth: any = jest.fn().mockImplementation(async () => {
        return {
          type: "token",
          token: "mock-installation-token",
          tokenType: "installation",
          installationId: 12345,
        };
      });

      // Add the hook method
      mockAuth.hook = jest.fn();

      // Use type assertion to satisfy TypeScript
      return mockAuth as import("@octokit/auth-app/dist-types/types").AuthInterface;
    });

    // Set up environment variables for GitHub App auth
    process.env.GITHUB_APP_ID = "12345";
    process.env.GITHUB_APP_PRIVATE_KEY_PKCS8 =
      "-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----";
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  describe("createAuthenticatedOctokit", () => {
    it("should create an Octokit instance with OAuth token", async () => {
      // Arrange
      const credentials: GitHubCredentials = {
        type: "oauth",
        token: "mock-oauth-token",
      };

      // Act
      const octokit = await createAuthenticatedOctokit(credentials);

      // Assert
      expect(Octokit).toHaveBeenCalledWith({ auth: "mock-oauth-token" });
      expect(octokit).toBeDefined();
    });

    it("should create an Octokit instance with GitHub App installation", async () => {
      // Arrange
      const credentials: GitHubCredentials = {
        type: "app",
        installationId: 67890,
      };

      // Act
      const octokit = await createAuthenticatedOctokit(credentials);

      // Assert
      expect(createAppAuth).toHaveBeenCalledWith({
        appId: "12345",
        privateKey:
          "-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----",
        installationId: 67890,
      });
      expect(Octokit).toHaveBeenCalledWith({ auth: "mock-installation-token" });
      expect(octokit).toBeDefined();
    });

    it("should throw GitHubAuthError when OAuth token is missing", async () => {
      // Arrange
      const credentials: GitHubCredentials = {
        type: "oauth",
        token: "", // Empty token
      };

      // Act & Assert
      await expect(createAuthenticatedOctokit(credentials)).rejects.toThrow(
        GitHubAuthError,
      );
    });

    it("should throw GitHubConfigError when GitHub App environment variables are missing", async () => {
      // Arrange
      process.env.GITHUB_APP_ID = "";
      process.env.GITHUB_APP_PRIVATE_KEY_PKCS8 = "";

      const credentials: GitHubCredentials = {
        type: "app",
        installationId: 67890,
      };

      // Act & Assert
      await expect(createAuthenticatedOctokit(credentials)).rejects.toThrow(
        GitHubConfigError,
      );
    });

    it("should handle errors from App authentication process", async () => {
      // Arrange
      const authError = new Error("Authentication failed");
      (
        createAppAuth as jest.MockedFunction<typeof createAppAuth>
      ).mockImplementation(() => {
        const auth = async (): Promise<never> => {
          throw authError;
        };

        // Add the missing hook property required by AuthInterface
        auth.hook = jest.fn();
        return auth;
      });

      const credentials: GitHubCredentials = {
        type: "app",
        installationId: 67890,
      };

      // Act & Assert
      await expect(createAuthenticatedOctokit(credentials)).rejects.toThrow();
    });
  });
});
