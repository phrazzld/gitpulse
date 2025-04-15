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
  GitHubRateLimitError,
  GitHubNotFoundError,
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
 * Installation type for managing multiple GitHub App installations
 */
export interface AppInstallation {
  id: number;
  account: {
    login: string;
    type?: string;
    avatarUrl?: string;
  } | null;
  appSlug: string;
  appId: number;
  repositorySelection: string;
  targetType: string; // 'User' or 'Organization'
}

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

/**
 * Generate the URL for managing a GitHub App installation
 * @param installationId The installation ID
 * @param accountLogin The account login (organization or user)
 * @param accountType The account type ('Organization' or 'User')
 * @returns The URL to GitHub's installation management page
 */
export function getInstallationManagementUrl(
  installationId: number,
  accountLogin?: string | null,
  accountType?: string | null,
): string {
  // For organization installations
  if (accountType === "Organization" && accountLogin) {
    return `https://github.com/organizations/${accountLogin}/settings/installations/${installationId}`;
  }

  // For user installations or when we don't have specific information
  return `https://github.com/settings/installations/${installationId}`;
}

/**
 * Get all GitHub App installations for the authenticated user.
 * @param accessToken User's GitHub OAuth access token.
 * @returns A promise resolving to an array of AppInstallation objects.
 * @throws {GitHubAuthError} If the access token is invalid or lacks permissions.
 * @throws {GitHubRateLimitError} If the API rate limit is exceeded.
 * @throws {GitHubApiError} For other GitHub API errors.
 * @throws {GitHubError} For unexpected errors.
 */
export async function getAllAppInstallations(
  accessToken: string,
): Promise<AppInstallation[]> {
  const context = { functionName: 'getAllAppInstallations', accessTokenLength: accessToken?.length };
  logger.debug(MODULE_NAME, "getAllAppInstallations called", context);

  if (!accessToken) {
    throw new GitHubAuthError("Access token is required", { context });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });

    // Get all installations for the authenticated user
    const { data } =
      await octokit.rest.apps.listInstallationsForAuthenticatedUser();

    // Find our app's installations
    const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
    const appId = process.env.GITHUB_APP_ID;

    logger.debug(MODULE_NAME, "Retrieved user installations", {
      ...context,
      installationsCount: data.installations.length,
      appName,
      appId,
    });

    // Filter installations by app name/id if provided
    let filteredInstallations = data.installations;
    if (appName || appId) {
      filteredInstallations = data.installations.filter(
        (inst) => inst.app_slug === appName || inst.app_id.toString() === appId,
      );
    }

    // Map to our simplified format
    const installations: AppInstallation[] = filteredInstallations.map((inst) => {
      // Ensure we have a valid account object
      if (!inst.account || typeof inst.account !== 'object') {
        return {
          id: inst.id,
          account: null,
          appSlug: inst.app_slug,
          appId: inst.app_id,
          repositorySelection: inst.repository_selection,
          targetType: inst.target_type,
        };
      }
      
      // Handle both user and organization accounts
      // Safe assertion - we already checked inst.account is not null
      const account = inst.account as any;
      
      return {
        id: inst.id,
        account: {
          login: account.login,
          type: 'type' in account ? account.type : undefined, 
          avatarUrl: account.avatar_url,
        },
        appSlug: inst.app_slug,
        appId: inst.app_id,
        repositorySelection: inst.repository_selection,
        targetType: inst.target_type,
      };
    });

    logger.info(MODULE_NAME, "Found GitHub App installations", {
      ...context,
      count: installations.length,
      accounts: installations
        .filter(i => i.account !== null && 'login' in i.account)
        .map((i) => i.account?.login)
        .join(", "),
    });

    return installations;
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Check if the GitHub App is installed for the authenticated user.
 * Returns the ID of the first found installation, or null if none are found.
 * @param accessToken User's GitHub OAuth access token.
 * @returns A promise resolving to the installation ID or null.
 * @throws {GitHubAuthError} If the access token is invalid or lacks permissions.
 * @throws {GitHubRateLimitError} If the API rate limit is exceeded.
 * @throws {GitHubApiError} For other GitHub API errors.
 * @throws {GitHubError} For unexpected errors.
 */
export async function checkAppInstallation(
  accessToken: string,
): Promise<number | null> {
  const context = { functionName: 'checkAppInstallation', accessTokenLength: accessToken?.length };
  logger.debug(MODULE_NAME, "checkAppInstallation called", context);

  try {
    // Get all installations - this will throw if there's an error
    const installations = await getAllAppInstallations(accessToken);

    if (installations.length > 0) {
      // For now, return the first installation ID
      // The UI will provide a way to switch between installations
      const installationId = installations[0].id;

      logger.info(MODULE_NAME, "Using first GitHub App installation", {
        ...context,
        installationId,
        account: installations[0].account?.login || 'unknown',
      });

      return installationId;
    }

    logger.info(MODULE_NAME, "No GitHub App installation found for this user", context);
    return null; // Only return null when the API call succeeds but no installations exist
  } catch (error) {
    return handleGitHubError(error, context);
  }
}