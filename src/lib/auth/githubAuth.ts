// GitHub authentication module
// This module centralizes GitHub authentication logic for both OAuth and App-based authentication

import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { logger } from "../logger";
import {
  GitHubError,
  GitHubAuthError,
  GitHubConfigError,
  GitHubApiError,
  handleGitHubError
} from "../errors";
import { AUTH_METHODS } from "../constants";

// Module name for consistent logging
const MODULE_NAME = "githubAuth";

/**
 * Discriminated union type representing the different authentication methods for GitHub.
 * This allows for type-safe handling of authentication variants in a single interface.
 */
export type GitHubCredentials =
  | { type: 'oauth'; token: string }
  | { type: 'app'; installationId: number };

/**
 * Creates an authenticated Octokit instance based on the provided credentials.
 * Supports both OAuth token and GitHub App installation authentication methods.
 * 
 * @param credentials - The GitHub credentials to use for authentication
 * @returns A Promise resolving to an authenticated Octokit instance
 * @throws {GitHubAuthError} If the authentication fails or credentials are invalid
 * @throws {GitHubConfigError} If required GitHub App configuration is missing
 * @throws {GitHubError} For other unexpected errors
 */
export async function createAuthenticatedOctokit(
  credentials: GitHubCredentials
): Promise<Octokit> {
  const context = { 
    functionName: 'createAuthenticatedOctokit',
    credentialsType: credentials.type 
  };
  
  logger.debug(MODULE_NAME, "Creating authenticated Octokit instance", context);
  
  try {
    // Handle authentication based on credentials type
    if (credentials.type === 'oauth') {
      // Simple OAuth token authentication
      if (!credentials.token) {
        throw new GitHubAuthError("OAuth token is required", { context });
      }
      
      logger.debug(MODULE_NAME, "Using OAuth token authentication", {
        ...context,
        tokenLength: credentials.token.length
      });
      
      return new Octokit({ auth: credentials.token });
    } 
    else if (credentials.type === 'app') {
      // GitHub App installation authentication
      logger.debug(MODULE_NAME, "Using GitHub App installation authentication", {
        ...context,
        installationId: credentials.installationId
      });
      
      // Verify required environment variables
      const appId = process.env.GITHUB_APP_ID;
      const privateKey = process.env.GITHUB_APP_PRIVATE_KEY_PKCS8;
      
      if (!appId || !privateKey) {
        logger.error(MODULE_NAME, "Missing GitHub App credentials", {
          ...context,
          hasAppId: !!appId,
          hasPrivateKey: !!privateKey,
        });
        throw new GitHubConfigError("GitHub App credentials (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_PKCS8) not configured", { context });
      }
      
      // Create authentication for the GitHub App installation
      const auth = createAppAuth({
        appId,
        privateKey: privateKey.replace(/\\n/g, "\n"), // Handle newlines in the key
        installationId: credentials.installationId,
      });
      
      // Get an installation access token
      const installationAuth = await auth({ type: "installation" });
      logger.debug(MODULE_NAME, "Generated installation access token", {
        ...context,
        tokenType: installationAuth.type,
        expiresAt: installationAuth.expiresAt,
      });
      
      // Return an Octokit instance with the installation token
      return new Octokit({ auth: installationAuth.token });
    }
    
    // This should never happen due to TypeScript's exhaustive checking,
    // but we include it for runtime safety
    throw new GitHubError(`Unsupported authentication type: ${(credentials as any).type}`, { context });
  } catch (error) {
    // Use existing error handling utility
    return handleGitHubError(error, context);
  }
}