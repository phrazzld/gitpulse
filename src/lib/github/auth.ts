/**
 * GitHub authentication module
 * 
 * Provides functions for authentication with GitHub using OAuth tokens
 * and GitHub App installations, with utilities for checking and managing
 * GitHub App installations.
 */

import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { logger } from "../logger";
import { AppInstallation, InstallationTargetType } from "./types";

const MODULE_NAME = "github:auth";

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
 * Get all GitHub App installations for the authenticated user
 * @param accessToken The OAuth access token
 * @returns Array of GitHub App installations
 */
export async function getAllAppInstallations(
  accessToken: string,
): Promise<AppInstallation[]> {
  logger.debug(MODULE_NAME, "getAllAppInstallations called", {
    accessTokenLength: accessToken?.length,
  });

  try {
    const octokit = new Octokit({ auth: accessToken });

    // Get all installations for the authenticated user
    const { data } =
      await octokit.rest.apps.listInstallationsForAuthenticatedUser();

    // Find our app's installations
    const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
    const appId = process.env.GITHUB_APP_ID;

    logger.debug(MODULE_NAME, "Retrieved user installations", {
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
      count: installations.length,
      accounts: installations
        .filter(i => i.account !== null && 'login' in i.account)
        .map((i) => i.account?.login)
        .join(", "),
    });

    return installations;
  } catch (error) {
    logger.error(MODULE_NAME, "Error getting GitHub App installations", {
      error,
    });
    return [];
  }
}

/**
 * Check if the GitHub App is installed for the authenticated user
 * @param accessToken The OAuth access token
 * @returns The first installation ID if found, null otherwise
 */
export async function checkAppInstallation(
  accessToken: string,
): Promise<number | null> {
  logger.debug(MODULE_NAME, "checkAppInstallation called", {
    accessTokenLength: accessToken?.length,
  });

  try {
    // Get all installations
    const installations = await getAllAppInstallations(accessToken);

    if (installations.length > 0) {
      // For now, return the first installation ID
      // The UI will provide a way to switch between installations
      const installationId = installations[0].id;

      logger.info(MODULE_NAME, "Using first GitHub App installation", {
        installationId,
        account: installations[0].account?.login || 'unknown',
      });

      return installationId;
    }

    logger.info(MODULE_NAME, "No GitHub App installation found for this user");
    return null;
  } catch (error) {
    logger.error(MODULE_NAME, "Error checking for GitHub App installation", {
      error,
    });
    return null;
  }
}

/**
 * Get an Octokit instance with installation access token
 * @param installationId The GitHub App installation ID
 * @returns An Octokit instance authenticated with the installation
 */
export async function getInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  logger.debug(MODULE_NAME, "getInstallationOctokit called", {
    installationId,
  });

  try {
    // Verify required environment variables
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY_PKCS8;

    if (!appId || !privateKey) {
      logger.error(MODULE_NAME, "Missing GitHub App credentials", {
        hasAppId: !!appId,
        hasPrivateKey: !!privateKey,
      });
      throw new Error("GitHub App credentials not configured");
    }

    // Create an Octokit instance authenticated as the GitHub App installation
    const auth = createAppAuth({
      appId: appId,
      privateKey: privateKey.replace(/\\n/g, "\n"), // Handle newlines in the key
      installationId,
    });

    // Get an installation access token
    const installationAuth = await auth({ type: "installation" });
    logger.debug(MODULE_NAME, "Generated installation access token", {
      tokenType: installationAuth.type,
      expiresAt: installationAuth.expiresAt,
    });

    // Create an Octokit instance with the installation token
    return new Octokit({ auth: installationAuth.token });
  } catch (error) {
    logger.error(MODULE_NAME, "Error creating installation Octokit", { error });
    throw error;
  }
}

/**
 * Create an Octokit instance with OAuth token authentication
 * @param accessToken The OAuth access token
 * @returns An Octokit instance authenticated with the OAuth token
 */
export function createOAuthOctokit(accessToken: string): Octokit {
  logger.debug(MODULE_NAME, "createOAuthOctokit called", {
    accessTokenLength: accessToken?.length,
  });
  
  return new Octokit({ auth: accessToken });
}

/**
 * Validate an OAuth token by checking if it has the necessary scopes
 * @param accessToken The OAuth access token to validate
 * @returns An object with validation results
 */
export async function validateOAuthToken(accessToken: string): Promise<{
  isValid: boolean;
  login?: string;
  scopes: string[];
  hasRepoScope: boolean;
  hasReadOrgScope: boolean;
  error?: string;
}> {
  logger.debug(MODULE_NAME, "validateOAuthToken called", {
    accessTokenLength: accessToken?.length,
  });

  try {
    const octokit = createOAuthOctokit(accessToken);
    
    // Attempt to get authenticated user info
    const userInfo = await octokit.rest.users.getAuthenticated();
    
    // Extract scopes from response headers
    const scopesHeader = userInfo.headers["x-oauth-scopes"] || "";
    const scopes = scopesHeader ? scopesHeader.split(", ") : [];
    
    // Check for required scopes
    const hasRepoScope = scopes.includes("repo");
    const hasReadOrgScope = scopes.includes("read:org");
    
    logger.info(MODULE_NAME, "Validated OAuth token", {
      login: userInfo.data.login,
      tokenScopes: scopes,
      hasRepoScope,
      hasReadOrgScope,
    });
    
    return {
      isValid: true,
      login: userInfo.data.login,
      scopes,
      hasRepoScope,
      hasReadOrgScope,
    };
  } catch (error) {
    logger.error(MODULE_NAME, "Error validating OAuth token", { error });
    
    return {
      isValid: false,
      scopes: [],
      hasRepoScope: false,
      hasReadOrgScope: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}