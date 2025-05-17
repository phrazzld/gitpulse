/**
 * GitHub adapter module
 * 
 * Provides the composition root for GitHub modules with proper dependency injection.
 * This module instantiates real dependencies and creates configured instances
 * of the GitHub services for use throughout the application.
 */

import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { IOctokitClient, IOctokitFactory, IAppAuthProvider } from "./interfaces";
import * as repositories from "./repositories";
import * as auth from "./auth";
import * as commits from "./commits";
import * as utils from "./utils";

/**
 * Default Octokit factory implementation
 */
export const defaultOctokitFactory: IOctokitFactory = (options) => {
  return new Octokit(options) as IOctokitClient;
};

/**
 * Default app auth provider implementation
 */
export const defaultAppAuthProvider: IAppAuthProvider = {
  createAppAuth,
};

/**
 * Create an authenticated Octokit client for OAuth
 * @param accessToken The OAuth access token
 * @returns Configured Octokit client
 */
export function createOAuthClient(accessToken: string): IOctokitClient {
  return defaultOctokitFactory({ auth: accessToken });
}

/**
 * Create an authenticated Octokit client for GitHub App installation
 * @param installationId The GitHub App installation ID
 * @returns Promise resolving to configured Octokit client
 */
export async function createAppClient(installationId: number): Promise<IOctokitClient> {
  return auth.getInstallationOctokit(
    installationId,
    defaultAppAuthProvider,
    defaultOctokitFactory
  );
}

/**
 * Create GitHub services with dependency injection
 * @param client The Octokit client instance
 * @param authMethod The authentication method being used
 * @returns Object containing all GitHub service functions
 */
export function createGitHubServices(client: IOctokitClient, authMethod: 'oauth' | 'app') {
  return {
    // Repositories module
    repositories: {
      fetchAllRepositories: () => repositories.fetchAllRepositories(client, authMethod),
      fetchAllRepositoriesOAuth: () => repositories.fetchAllRepositoriesOAuth(client),
      fetchAllRepositoriesApp: () => repositories.fetchAllRepositoriesApp(client),
    },
    
    // Auth module
    auth: {
      getAllAppInstallations: () => auth.getAllAppInstallations(client),
      checkAppInstallation: () => auth.checkAppInstallation(client),
      validateOAuthToken: () => auth.validateOAuthToken(client),
      getInstallationManagementUrl: auth.getInstallationManagementUrl,
      createOAuthOctokit: (accessToken: string) => 
        auth.createOAuthOctokit(accessToken, defaultOctokitFactory),
      getInstallationOctokit: (installationId: number) =>
        auth.getInstallationOctokit(installationId, defaultAppAuthProvider, defaultOctokitFactory),
    },
    
    // Commits module
    commits: {
      fetchRepositoryCommits: (
        owner: string,
        repo: string,
        since: string,
        until: string,
        author?: string
      ) => commits.fetchRepositoryCommits(client, authMethod, owner, repo, since, until, author),
      
      fetchCommitsForRepositories: (
        repositories: string[],
        since: string,
        until: string,
        author?: string
      ) => commits.fetchCommitsForRepositories(client, authMethod, repositories, since, until, author),
      
      fetchRepositoryCommitsOAuth: (
        owner: string,
        repo: string,
        since: string,
        until: string,
        author?: string
      ) => commits.fetchRepositoryCommitsOAuth(client, owner, repo, since, until, author),
      
      fetchRepositoryCommitsApp: (
        owner: string,
        repo: string,
        since: string,
        until: string,
        author?: string
      ) => commits.fetchRepositoryCommitsApp(client, owner, repo, since, until, author),
    },
    
    // Utils module
    utils: {
      checkRateLimit: (authMethod?: string) => utils.checkRateLimit(client, authMethod),
      parseTokenScopes: utils.parseTokenScopes,
      validateTokenScopes: utils.validateTokenScopes,
      getRepoIdentifier: utils.getRepoIdentifier,
      splitRepoFullName: utils.splitRepoFullName,
      deduplicateBy: utils.deduplicateBy,
      processBatches: utils.processBatches,
      formatGitHubError: utils.formatGitHubError,
    },
  };
}

/**
 * Default export for backward compatibility
 * Creates services based on provided authentication
 */
export async function createGitHubClient(
  options: { accessToken?: string; installationId?: number }
): Promise<ReturnType<typeof createGitHubServices>> {
  if (options.installationId) {
    const client = await createAppClient(options.installationId);
    return createGitHubServices(client, 'app');
  } else if (options.accessToken) {
    const client = createOAuthClient(options.accessToken);
    return createGitHubServices(client, 'oauth');
  } else {
    throw new Error("Either accessToken or installationId must be provided");
  }
}