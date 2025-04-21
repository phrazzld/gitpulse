/**
 * GitHub Authentication Module
 *
 * This module centralizes GitHub authentication logic for both OAuth token-based
 * and GitHub App installation-based authentication. It provides functions to:
 *
 * - Create authenticated Octokit instances
 * - Manage GitHub App installations
 * - Check App installation status
 * - Generate installation management URLs
 *
 * The module abstracts authentication details away from data fetching operations,
 * allowing for cleaner code separation and easier testing.
 *
 * @module githubAuth
 */

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
  handleGitHubError,
} from "../errors";
import { AUTH_METHODS } from "../constants";

// Module name for consistent logging
const MODULE_NAME = "githubAuth";

/**
 * Discriminated union type representing the different authentication methods for GitHub.
 * This type-safe approach allows the application to handle different authentication
 * mechanisms through a single interface while maintaining strict type checking.
 *
 * @example
 * // OAuth token credentials
 * const oauthCredentials: GitHubCredentials = {
 *   type: 'oauth',
 *   token: 'github_personal_access_token'
 * };
 *
 * @example
 * // GitHub App installation credentials
 * const appCredentials: GitHubCredentials = {
 *   type: 'app',
 *   installationId: 12345678
 * };
 */
export type GitHubCredentials =
  | { type: "oauth"; token: string }
  | { type: "app"; installationId: number };

/**
 * Represents a GitHub App installation, providing access to repositories
 * across users or organizations.
 *
 * This interface is used to track installed GitHub Apps and their associated
 * accounts, allowing the application to display installation information
 * and manage access to repositories through each installation.
 *
 * The account can be null when the account information is not available
 * or when the installation is not associated with a specific account.
 *
 * @property id - The unique numeric identifier for the installation
 * @property account - The GitHub account (user or organization) associated with this installation
 * @property account.login - The username or organization name
 * @property account.type - The account type (typically "User" or "Organization")
 * @property account.avatarUrl - The URL to the account's avatar image
 * @property appSlug - The URL-friendly name of the GitHub App
 * @property appId - The unique numeric identifier for the GitHub App
 * @property repositorySelection - How repositories are selected for this installation ("selected" or "all")
 * @property targetType - The type of account this installation is associated with ("User" or "Organization")
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
 *
 * This function is the central authentication factory for the application, supporting
 * both OAuth token-based and GitHub App installation-based authentication. It handles
 * the complexities of authentication methods, environment variable validation, and
 * token generation, providing a consistent interface for obtaining an authenticated
 * Octokit client.
 *
 * For OAuth authentication, it directly uses the provided token. For GitHub App
 * installation authentication, it retrieves the necessary App credentials from
 * environment variables, generates an installation access token using the GitHub
 * App authentication flow, and then creates an Octokit instance with that token.
 *
 * @param credentials - The GitHub credentials to use for authentication
 * @returns A Promise resolving to an authenticated Octokit instance
 * @throws {GitHubAuthError} If the authentication fails or credentials are invalid (e.g., missing token)
 * @throws {GitHubConfigError} If required GitHub App configuration is missing (e.g., missing App ID or private key)
 * @throws {GitHubRateLimitError} If a GitHub API rate limit is exceeded during authentication
 * @throws {GitHubError} For other unexpected errors during the authentication process
 *
 * @example
 * // Using OAuth authentication
 * const octokit = await createAuthenticatedOctokit({
 *   type: 'oauth',
 *   token: process.env.GITHUB_TOKEN
 * });
 *
 * @example
 * // Using GitHub App installation authentication
 * const octokit = await createAuthenticatedOctokit({
 *   type: 'app',
 *   installationId: 12345678
 * });
 */
export async function createAuthenticatedOctokit(
  credentials: GitHubCredentials,
): Promise<Octokit> {
  const context = {
    functionName: "createAuthenticatedOctokit",
    credentialsType: credentials.type,
  };

  logger.debug(MODULE_NAME, "Creating authenticated Octokit instance", context);

  try {
    // Handle authentication based on credentials type
    if (credentials.type === "oauth") {
      // Simple OAuth token authentication
      if (!credentials.token) {
        throw new GitHubAuthError("OAuth token is required", { context });
      }

      logger.debug(MODULE_NAME, "Using OAuth token authentication", {
        ...context,
        // Only log that we have a token, not its length or any other details
        hasToken: true,
      });

      return new Octokit({ auth: credentials.token });
    } else if (credentials.type === "app") {
      // GitHub App installation authentication
      logger.debug(
        MODULE_NAME,
        "Using GitHub App installation authentication",
        {
          ...context,
          installationId: credentials.installationId,
        },
      );

      // Verify required environment variables
      const appId = process.env.GITHUB_APP_ID;
      const privateKey = process.env.GITHUB_APP_PRIVATE_KEY_PKCS8;

      if (!appId || !privateKey) {
        logger.error(MODULE_NAME, "Missing GitHub App credentials", {
          ...context,
          hasAppId: !!appId,
          hasPrivateKey: !!privateKey,
        });
        throw new GitHubConfigError(
          "GitHub App credentials (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_PKCS8) not configured",
          { context },
        );
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
        // Only log token type and expiration, not the actual token
        tokenType: installationAuth.type,
        expiresAt: installationAuth.expiresAt,
        // Explicitly note that we're not logging the token
        tokenRedacted: true,
      });

      // Return an Octokit instance with the installation token
      return new Octokit({ auth: installationAuth.token });
    }

    // This should never happen due to TypeScript's exhaustive checking,
    // but we include it for runtime safety
    throw new GitHubError(
      `Unsupported authentication type: ${(credentials as { type: string }).type}`,
      { context },
    );
  } catch (error) {
    // Use existing error handling utility
    return handleGitHubError(error, context);
  }
}

/**
 * Generates the URL for managing a GitHub App installation.
 *
 * This function creates the appropriate GitHub URL for users to manage their App installation,
 * which varies based on whether the installation is for a personal account or an organization.
 *
 * In the individual-focused MVP, we primarily work with User installations, but we still
 * support Organization installations for backward compatibility even though we no longer
 * provide organization-specific functionality.
 *
 * The URL can be used for:
 * - Configuring repository access
 * - Adjusting permissions
 * - Uninstalling the App
 * - Managing other installation settings
 *
 * @param installationId - The numeric identifier for the GitHub App installation
 * @param accountLogin - The username or organization name for the installation (optional)
 * @param accountType - The type of account, either 'Organization' or 'User' (optional)
 * @returns The complete URL to GitHub's installation management page
 *
 * @example
 * // For a personal account installation (primary use case in individual-focused MVP)
 * const userUrl = getInstallationManagementUrl(12345678, 'username', 'User');
 * // Returns: https://github.com/settings/installations/12345678
 *
 * @example
 * // For an organization installation (supported for backward compatibility)
 * const orgUrl = getInstallationManagementUrl(12345678, 'my-org', 'Organization');
 * // Returns: https://github.com/organizations/my-org/settings/installations/12345678
 */
export function getInstallationManagementUrl(
  installationId: number,
  accountLogin?: string | null,
  accountType?: string | null,
): string {
  // For organization installations (supported for backward compatibility)
  if (accountType === "Organization" && accountLogin) {
    return `https://github.com/organizations/${accountLogin}/settings/installations/${installationId}`;
  }

  // For user installations (primary use case in individual-focused MVP)
  // or when we don't have specific information
  return `https://github.com/settings/installations/${installationId}`;
}

/**
 * Retrieves all GitHub App installations for the authenticated user.
 *
 * This function:
 * 1. Authenticates to GitHub using the provided OAuth token
 * 2. Fetches all GitHub App installations associated with the authenticated user
 * 3. Optionally filters the installations by app name or app ID (if configured in environment)
 * 4. Transforms the GitHub API response into our standardized AppInstallation format
 *
 * It's used to allow users to see which GitHub App installations they have access to,
 * and to select a specific installation for GitHub operations that require App-based
 * authentication.
 *
 * @param accessToken - User's GitHub OAuth access token with appropriate permissions
 * @returns A promise resolving to an array of AppInstallation objects representing the user's GitHub App installations
 * @throws {GitHubAuthError} If the access token is invalid, missing, or lacks required permissions
 * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded during the request
 * @throws {GitHubApiError} For other GitHub API errors during the request
 * @throws {GitHubError} For unexpected errors or edge cases during processing
 *
 * @example
 * try {
 *   const installations = await getAllAppInstallations(session.accessToken);
 *   if (installations.length > 0) {
 *     // User has at least one GitHub App installation
 *     console.log(`Found ${installations.length} GitHub App installations`);
 *   } else {
 *     // User needs to install the GitHub App
 *     console.log('No GitHub App installations found');
 *   }
 * } catch (error) {
 *   console.error('Failed to fetch GitHub App installations:', error);
 * }
 */
export async function getAllAppInstallations(
  accessToken: string,
): Promise<AppInstallation[]> {
  // Initialize context and validate inputs
  const context = createLogContext(accessToken);
  validateAccessToken(accessToken, context);

  try {
    // Create authenticated client
    const octokit = createOctokitWithToken(accessToken);

    // Get and process installations
    const installations = await fetchAndProcessInstallations(octokit, context);

    // Log success
    logSuccessfulFetch(installations, context);

    return installations;
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Create logging context
 */
function createLogContext(accessToken: string): Record<string, unknown> {
  const context = {
    functionName: "getAllAppInstallations",
    // Only log if we have a token, not its length
    hasAccessToken: !!accessToken,
  };

  logger.debug(MODULE_NAME, "getAllAppInstallations called", context);
  return context;
}

/**
 * Validate that access token is provided
 */
function validateAccessToken(
  accessToken: string,
  context: Record<string, unknown>,
): void {
  if (!accessToken) {
    throw new GitHubAuthError("Access token is required", { context });
  }
}

/**
 * Create Octokit instance with token
 */
function createOctokitWithToken(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

/**
 * Interface for GitHub API Installation object
 */
interface GitHubInstallation {
  id: number;
  app_slug: string;
  app_id: number;
  repository_selection: string;
  target_type: string;
  account?: {
    login: string;
    type?: string;
    avatar_url: string;
  };
}

/**
 * Fetch installations and process them
 */
async function fetchAndProcessInstallations(
  octokit: Octokit,
  context: Record<string, unknown>,
): Promise<AppInstallation[]> {
  // Get all installations for the authenticated user
  const { data } =
    await octokit.rest.apps.listInstallationsForAuthenticatedUser();

  // Get app configuration
  const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
  const appId = process.env.GITHUB_APP_ID;

  // Log retrieval
  logInstallationsRetrieval(data.installations.length, appName, appId, context);

  // Convert installations to our expected format
  const typedInstallations: GitHubInstallation[] = data.installations.map(
    (inst) => {
      // Convert account property safely
      let account;
      if (inst.account && typeof inst.account === "object") {
        // Use type assertion with more specific interface
        interface AccountLike {
          login?: string;
          type?: string;
          avatar_url?: string;
        }
        const accountObj = inst.account as AccountLike;
        // Check for login property to determine if it's a valid account object
        if (accountObj.login && accountObj.avatar_url) {
          account = {
            login: accountObj.login,
            type: accountObj.type,
            avatar_url: accountObj.avatar_url,
          };
        }
      }

      return {
        id: inst.id,
        app_slug: inst.app_slug,
        app_id: inst.app_id,
        repository_selection: inst.repository_selection,
        target_type: inst.target_type,
        account,
      };
    },
  );

  // Filter installations by app name/id if provided
  const filteredInstallations = filterInstallationsByApp(
    typedInstallations,
    appName,
    appId,
  );

  // Map to our simplified format
  return mapInstallationsToAppFormat(filteredInstallations);
}

/**
 * Log installations retrieval
 */
function logInstallationsRetrieval(
  count: number,
  appName?: string,
  appId?: string,
  context?: Record<string, unknown>,
): void {
  logger.debug(MODULE_NAME, "Retrieved user installations", {
    ...context,
    installationsCount: count,
    appName,
    appId,
  });
}

/**
 * Filter installations by app name/id
 */
function filterInstallationsByApp(
  installations: GitHubInstallation[],
  appName?: string,
  appId?: string,
): GitHubInstallation[] {
  if (!appName && !appId) {
    return installations;
  }

  return installations.filter(
    (inst) => inst.app_slug === appName || inst.app_id.toString() === appId,
  );
}

/**
 * Map GitHub installations to our app format
 */
function mapInstallationsToAppFormat(
  installations: GitHubInstallation[],
): AppInstallation[] {
  return installations.map((inst) => {
    // Handle case with missing account object
    if (!inst.account || typeof inst.account !== "object") {
      return createInstallationWithoutAccount(inst);
    }

    // Handle case with valid account object
    if (inst.account) {
      return createInstallationWithAccount({
        ...inst,
        account: inst.account,
      });
    }

    // Fallback
    return createInstallationWithoutAccount(inst);
  });
}

/**
 * Create installation object without account information
 */
function createInstallationWithoutAccount(
  installation: GitHubInstallation,
): AppInstallation {
  return {
    id: installation.id,
    account: null,
    appSlug: installation.app_slug,
    appId: installation.app_id,
    repositorySelection: installation.repository_selection,
    targetType: installation.target_type,
  };
}

/**
 * Create installation object with account information
 */
function createInstallationWithAccount(
  installation: GitHubInstallation & {
    account: {
      login: string;
      type?: string;
      avatar_url: string;
    };
  },
): AppInstallation {
  // Handle both user and organization accounts
  // Safe assertion - we already checked inst.account is not null
  const account = installation.account as {
    login: string;
    type?: string;
    avatar_url: string;
  };

  return {
    id: installation.id,
    account: {
      login: account.login,
      type: "type" in account ? account.type : undefined,
      avatarUrl: account.avatar_url,
    },
    appSlug: installation.app_slug,
    appId: installation.app_id,
    repositorySelection: installation.repository_selection,
    targetType: installation.target_type,
  };
}

/**
 * Log successful fetch result
 */
function logSuccessfulFetch(
  installations: AppInstallation[],
  context: Record<string, unknown>,
): void {
  logger.info(MODULE_NAME, "Found GitHub App installations", {
    ...context,
    count: installations.length,
    accounts: installations
      .filter((i) => i.account !== null && "login" in i.account)
      .map((i) => i.account?.login)
      .join(", "),
  });
}

/**
 * Checks if the GitHub App is installed for the authenticated user and returns the first
 * installation ID if available.
 *
 * This is a convenience function that:
 * 1. Calls getAllAppInstallations() to retrieve all GitHub App installations
 * 2. Returns the ID of the first installation if any exist
 * 3. Returns null if no installations are found
 *
 * This function is particularly useful for quickly determining if a user has installed
 * the GitHub App and getting an installation ID for subsequent API calls that require
 * GitHub App authentication.
 *
 * @param accessToken - User's GitHub OAuth access token with appropriate permissions
 * @returns A promise resolving to the first installation ID if found, or null if no installations exist
 * @throws {GitHubAuthError} If the access token is invalid, missing, or lacks required permissions
 * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded during the request
 * @throws {GitHubApiError} For other GitHub API errors during the request
 * @throws {GitHubError} For unexpected errors during processing
 *
 * @example
 * try {
 *   const installationId = await checkAppInstallation(session.accessToken);
 *   if (installationId) {
 *     // User has installed the GitHub App, use the installation ID
 *     console.log(`Using GitHub App installation: ${installationId}`);
 *     const credentials = { type: 'app', installationId };
 *     const octokit = await createAuthenticatedOctokit(credentials);
 *   } else {
 *     // User needs to install the GitHub App
 *     console.log('GitHub App not installed. Please install it first.');
 *   }
 * } catch (error) {
 *   console.error('Failed to check GitHub App installation:', error);
 * }
 */
export async function checkAppInstallation(
  accessToken: string,
): Promise<number | null> {
  const context = {
    functionName: "checkAppInstallation",
    // Only log if we have a token, not its length
    hasAccessToken: !!accessToken,
  };
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
        account: installations[0].account?.login || "unknown",
      });

      return installationId;
    }

    logger.info(
      MODULE_NAME,
      "No GitHub App installation found for this user",
      context,
    );
    return null; // Only return null when the API call succeeds but no installations exist
  } catch (error) {
    return handleGitHubError(error, context);
  }
}
