/**
 * GitHub Data Fetching Module
 *
 * This module centralizes GitHub data fetching operations, completely separated from authentication
 * concerns. It provides functions to:
 *
 * - Fetch repositories (for both OAuth and GitHub App authentication)
 * - Fetch commits from specific repositories
 * - Fetch commits across multiple repositories
 *
 * The module follows a clean separation of concerns design where all functions accept
 * a pre-authenticated Octokit instance. This approach:
 *
 * 1. Decouples authentication from data fetching
 * 2. Simplifies testing through dependency injection
 * 3. Makes the API more flexible and composable
 *
 * For backward compatibility, this module also provides deprecated wrapper functions
 * that handle authentication internally, but these should be avoided in new code.
 *
 * @module githubData
 */

import { Octokit } from "octokit";
import { logger } from "./logger";
import {
  GitHubError,
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubApiError,
  handleGitHubError,
} from "./errors";
import { GITHUB_API } from "./constants";

// Import from the auth module to use in the backward-compatible function
import {
  createAuthenticatedOctokit,
  GitHubCredentials,
} from "./auth/githubAuth";

// Module name for consistent logging
const MODULE_NAME = "githubData";

// Utility functions

/**
 * Checks the GitHub API rate limit status.
 *
 * @param octokit Authenticated Octokit instance
 * @param context Logging context information
 * @returns Promise that resolves when check is complete
 */
async function checkRateLimits(
  octokit: Octokit,
  context: Record<string, unknown>,
): Promise<void> {
  try {
    const rateLimit = await octokit.rest.rateLimit.get();
    const core = rateLimit.data.resources.core;

    logger.info(MODULE_NAME, "GitHub API rate limit status", {
      ...context,
      limit: core.limit,
      remaining: core.remaining,
      reset: new Date(core.reset * 1000).toISOString(),
      usedPercent:
        100 - Number(((core.remaining / core.limit) * 100).toFixed(1)),
    });

    if (core.remaining < 100) {
      logger.warn(MODULE_NAME, "GitHub API rate limit is running low", {
        ...context,
        remaining: core.remaining,
        resetTime: new Date(core.reset * 1000).toISOString(),
      });
    }
  } catch (rateLimitError) {
    // Non-fatal error, just log and continue
    logger.warn(MODULE_NAME, "Failed to check GitHub API rate limits", {
      ...context,
      error: rateLimitError,
    });
  }
}

/**
 * Validates token scopes and permissions.
 *
 * In the individual-focused MVP, we only require the 'repo' scope to access
 * personal repositories. The 'read:org' scope is no longer checked since
 * organization-specific functionality has been removed.
 *
 * @param octokit Authenticated Octokit instance
 * @param context Logging context information
 * @returns Promise that resolves to the user info if successful
 * @throws GitHubAuthError if token lacks required scopes
 */
async function validateTokenScopes(
  octokit: Octokit,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    const userInfo = await octokit.rest.users.getAuthenticated();
    const scopesHeader = userInfo.headers["x-oauth-scopes"] || "";
    const scopes = scopesHeader ? scopesHeader.split(", ") : [];

    logger.info(MODULE_NAME, "Authenticated user details", {
      ...context,
      login: userInfo.data.login,
      id: userInfo.data.id,
      type: userInfo.data.type,
      twoFactorEnabled: (userInfo.data as Record<string, unknown>)
        .two_factor_authentication,
      tokenScopes: scopes,
      hasRepoScope: scopes.includes("repo"),
      // Still log this for diagnostic purposes, but we don't require it anymore
      hasReadOrgScope: scopes.includes("read:org"),
    });

    // For the individual-focused MVP, we only require the 'repo' scope
    if (!scopes.includes("repo")) {
      logger.warn(
        MODULE_NAME,
        "GitHub token is missing 'repo' scope. This will prevent access to private repositories.",
        context,
      );
      throw new GitHubAuthError(
        "GitHub token is missing 'repo' scope. Please re-authenticate with the necessary permissions.",
        { context },
      );
    }

    // Note: 'read:org' scope check was removed as part of T012 (individual activity focus)
    // since organization functionality is no longer needed in the individual-focused MVP.

    return userInfo.data;
  } catch (userInfoError) {
    // This could be an auth error, so we should throw it
    logger.warn(MODULE_NAME, "Could not retrieve authenticated user info", {
      ...context,
      error: userInfoError,
    });
    return handleGitHubError(userInfoError, {
      ...context,
      subOperation: "getAuthenticated",
    });
  }
}

/**
 * Fetches repositories for an authenticated individual user with combined affiliations.
 *
 * This function retrieves all repositories that the authenticated user has access to,
 * including:
 * - Repositories owned by the user
 * - Repositories the user collaborates on
 * - Repositories accessible through organization membership
 *
 * In the individual-focused MVP, this is the only repository fetching function used
 * (we no longer have separate organization-specific repository fetching).
 *
 * @param octokit Authenticated Octokit instance
 * @param context Logging context information
 * @returns Promise that resolves to array of repositories
 */
async function fetchUserRepositories(
  octokit: Octokit,
  context: Record<string, unknown>,
): Promise<Repository[]> {
  logger.debug(
    MODULE_NAME,
    "Fetching all repos with combined affiliation=owner,collaborator,organization_member and visibility=all",
    context,
  );

  const combinedRepos = await octokit.paginate(
    octokit.rest.repos.listForAuthenticatedUser,
    {
      per_page: 100,
      sort: "updated",
      visibility: "all",
      affiliation: "owner,collaborator,organization_member",
    },
  );

  logger.info(MODULE_NAME, "Fetched combined affiliation repos", {
    ...context,
    count: combinedRepos.length,
  });

  return combinedRepos;
}

/*
 * Organization repository fetching removed as part of T012 (refactor GitHub data fetching)
 * to support individual activity focus.
 */

/**
 * Deduplicates repositories by full_name.
 *
 * @param repositories Array of repositories to deduplicate
 * @param context Logging context information
 * @returns Array of unique repositories
 */
function deduplicateRepositories(
  repositories: Repository[],
  context: Record<string, unknown>,
): Repository[] {
  logger.debug(MODULE_NAME, "Deduplicating repositories", {
    ...context,
    beforeCount: repositories.length,
  });

  const uniqueRepos = Array.from(
    new Map(repositories.map((r) => [r.full_name, r])).values(),
  );

  logger.info(MODULE_NAME, "Deduplicated repositories", {
    ...context,
    afterCount: uniqueRepos.length,
    duplicatesRemoved: repositories.length - uniqueRepos.length,
  });

  return uniqueRepos;
}

/**
 * Process a batch of repositories to fetch commits.
 *
 * @param octokit Authenticated Octokit instance
 * @param repoFullNames Array of repository full names to process
 * @param since Start date for commit range
 * @param until End date for commit range
 * @param author Optional GitHub username to filter commits by
 * @param context Logging context information
 * @returns Promise resolving to array of commits
 */
async function processBatchForCommits(
  octokit: Octokit,
  repoFullNames: string[],
  since: string,
  until: string,
  author: string | undefined,
  context: Record<string, unknown>,
): Promise<Commit[]> {
  logger.debug(
    MODULE_NAME,
    `Processing batch of ${repoFullNames.length} repositories`,
    { ...context, repoFullNames },
  );

  const results = await Promise.all(
    repoFullNames.map((repoFullName) => {
      const [owner, repo] = repoFullName.split("/");
      return fetchRepositoryCommitsWithOctokit(
        octokit,
        owner,
        repo,
        since,
        until,
        author,
      );
    }),
  );

  const allCommits: Commit[] = [];
  results.forEach((commits) => allCommits.push(...commits));

  return allCommits;
}

/**
 * Process repositories in batches with different author filters.
 * Implements a fallback strategy when no commits are found with the primary author.
 *
 * @param octokit Authenticated Octokit instance
 * @param repositories Array of repository full names to process
 * @param since Start date for commit range
 * @param until End date for commit range
 * @param author Optional GitHub username to filter commits by
 * @param context Logging context information
 * @returns Promise resolving to array of commits
 */
async function processRepositoriesWithFallback(
  octokit: Octokit,
  repositories: string[],
  since: string,
  until: string,
  author: string | undefined,
  context: Record<string, unknown>,
): Promise<Commit[]> {
  const batchSize = GITHUB_API.BATCH_SIZE;
  const allCommits: Commit[] = [];
  let githubUsername = author;

  // First attempt: Use provided author
  for (let i = 0; i < repositories.length; i += batchSize) {
    const batch = repositories.slice(i, i + batchSize);
    logger.debug(
      MODULE_NAME,
      `Processing batch ${Math.floor(i / batchSize) + 1} with author=${githubUsername || "none"}`,
      {
        ...context,
        batchSize,
        totalBatches: Math.ceil(repositories.length / batchSize),
      },
    );

    const batchCommits = await processBatchForCommits(
      octokit,
      batch,
      since,
      until,
      githubUsername,
      context,
    );

    allCommits.push(...batchCommits);
  }

  // If no commits found and author specified, try with repo owner as fallback
  if (allCommits.length === 0 && author) {
    logger.info(
      MODULE_NAME,
      "No commits found with provided author name; retrying with the repo owner as author",
      context,
    );

    if (repositories.length > 0) {
      const [fallbackOwner] = repositories[0].split("/");
      githubUsername = fallbackOwner;

      for (let i = 0; i < repositories.length; i += batchSize) {
        const batch = repositories.slice(i, i + batchSize);
        const batchCommits = await processBatchForCommits(
          octokit,
          batch,
          since,
          until,
          githubUsername,
          context,
        );

        allCommits.push(...batchCommits);
      }
    }
  }

  // Final fallback: No author filter at all
  if (allCommits.length === 0 && author) {
    logger.info(
      MODULE_NAME,
      "Still no commits found, retrying without author filter",
      context,
    );

    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);
      const batchCommits = await processBatchForCommits(
        octokit,
        batch,
        since,
        until,
        undefined,
        context,
      );

      allCommits.push(...batchCommits);
    }
  }

  logger.info(MODULE_NAME, "Completed repositories processing for commits", {
    ...context,
    totalRepositories: repositories.length,
    totalCommits: allCommits.length,
    finalAuthorFilter: githubUsername || "none",
  });

  return allCommits;
}

/**
 * Represents a GitHub repository with essential metadata.
 *
 * This interface captures the core properties needed to work with GitHub repositories
 * in the application. It maps to the GitHub API repository response, but only includes
 * the subset of fields actually used by our application.
 *
 * @property id - The unique numeric identifier of the repository
 * @property name - The repository name without owner (e.g., "repo-name")
 * @property full_name - The repository name with owner (e.g., "owner/repo-name")
 * @property owner - Object containing basic information about the repository owner
 * @property owner.login - The username or organization name that owns the repository
 * @property private - Whether the repository is private (true) or public (false)
 * @property html_url - The browser URL for the repository
 * @property description - The repository description or null if not set
 * @property updated_at - ISO timestamp of when the repository was last updated
 * @property language - The primary programming language used in the repository
 */
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    // Additional properties can be added as needed, e.g.:
    // node_id?: string;
    // avatar_url?: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at?: string | null;
  language?: string | null;
  // Additional properties can be added as needed, e.g.:
  // license?: License|null;
}

/**
 * Represents a GitHub commit with essential metadata.
 *
 * This interface maps to the GitHub API commit response and includes properties
 * needed to display commit information in the application. We extend it with a
 * repository property to help associate commits with their source repositories
 * when working with commits from multiple repositories.
 *
 * @property sha - The unique SHA-1 hash identifier for the commit
 * @property commit - Object containing core commit data (message, author, dates)
 * @property commit.author - Git author information (name, email, date)
 * @property commit.committer - Git committer information (name, email, date)
 * @property commit.message - The commit message
 * @property html_url - The browser URL for viewing this commit on GitHub
 * @property author - GitHub user information for the commit author (if available)
 * @property author.login - GitHub username of the commit author
 * @property author.avatar_url - URL to the author's GitHub avatar image
 * @property repository - Additional property added by us to track source repository
 */
export interface Commit {
  sha: string;
  commit: {
    author: {
      name?: string;
      email?: string;
      date?: string;
    } | null;
    committer?: {
      name?: string;
      email?: string;
      date?: string;
    } | null;
    message: string;
    // Additional properties from the GitHub API
    [key: string]: unknown;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
    // Additional properties from the GitHub API
    [key: string]: unknown;
  } | null;
  // Custom property added to track source repository
  repository?: {
    full_name: string;
  };
  // Additional properties from the GitHub API
  [key: string]: unknown;
}

/**
 * Fetches all accessible repositories for the authenticated user across personal and organization accounts.
 *
 * This comprehensive function:
 * 1. Checks current GitHub API rate limits to avoid unexpected throttling
 * 2. Validates OAuth token scopes to ensure sufficient permissions
 * 3. Fetches repositories the user has access to via all affiliations
 * 4. Fetches repositories from all organizations the user belongs to
 * 5. Deduplicates repositories to provide a clean, unified list
 *
 * The function implements a thorough approach to fetch the maximum possible set of
 * repositories the user has access to. It handles both personal repos and repos across
 * multiple organizations, with appropriate error handling for each step.
 *
 * @param octokit - An authenticated Octokit instance (OAuth token-based auth)
 * @returns A promise resolving to an array of Repository objects the user can access
 * @throws {GitHubError} If the Octokit instance is not provided
 * @throws {GitHubAuthError} If authentication fails or token lacks required permissions ('repo' scope)
 * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded
 * @throws {GitHubApiError} For other GitHub API errors
 *
 * @example
 * // Using with OAuth authentication
 * const octokit = await createAuthenticatedOctokit({
 *   type: 'oauth',
 *   token: 'github_personal_access_token'
 * });
 * const repositories = await fetchRepositories(octokit);
 * console.log(`Found ${repositories.length} repositories`);
 */
/**
 * Fetches all accessible repositories for the authenticated individual user.
 *
 * In the individual-focused MVP, this function focuses solely on personal repository access
 * and no longer attempts to fetch organization-specific repositories separately.
 *
 * This streamlined function:
 * 1. Checks current GitHub API rate limits to avoid unexpected throttling
 * 2. Validates OAuth token scopes to ensure sufficient permissions ('repo' scope only)
 * 3. Fetches repositories the user has access to via all affiliations
 *    (owner, collaborator, organization_member)
 *
 * The "organization_member" affiliation is still included to ensure users can see repositories
 * they have access to through organization membership, but we no longer perform organization-specific
 * API calls or filtering.
 *
 * @param octokit - An authenticated Octokit instance (OAuth token-based auth)
 * @returns A promise resolving to an array of Repository objects the user can access
 * @throws {GitHubError} If the Octokit instance is not provided
 * @throws {GitHubAuthError} If authentication fails or token lacks required permissions ('repo' scope)
 * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded
 * @throws {GitHubApiError} For other GitHub API errors
 */
export async function fetchRepositories(
  octokit: Octokit,
): Promise<Repository[]> {
  const context = { functionName: "fetchRepositories" };
  logger.debug(MODULE_NAME, "fetchRepositories called", context);

  if (!octokit) {
    throw new GitHubError("Octokit instance is required", { context });
  }

  try {
    // Check rate limits (non-fatal if this fails)
    await checkRateLimits(octokit, context);

    // Validate token scopes (throws if required scopes are missing)
    await validateTokenScopes(octokit, context);

    // Get repositories through the combined affiliations approach
    // Note: Organization-specific repository fetching was removed as part of the
    // individual-focused MVP (task T012). We now only use the listForAuthenticatedUser endpoint
    // which includes all repositories the user can access through any affiliation.
    const userRepos = await fetchUserRepositories(octokit, context);

    // Return repositories (no need to deduplicate as we're only using one source)
    return userRepos;
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Fetches repositories accessible to a GitHub App installation.
 *
 * This function retrieves all repositories that a GitHub App installation has access to.
 * Unlike the fetchRepositories function which is intended for OAuth authentication, this
 * function is specifically designed for GitHub App installations and uses a different
 * GitHub API endpoint.
 *
 * The function:
 * 1. Checks current GitHub API rate limits (App-specific)
 * 2. Uses the GitHub Apps API to list all repositories the installation can access
 * 3. Properly paginates through results to get all accessible repositories
 *
 * This is useful when the user is interacting with GitHub via an App installation
 * rather than direct OAuth authentication.
 *
 * @param octokit - An authenticated Octokit instance with GitHub App installation authentication
 * @returns A promise resolving to an array of Repository objects accessible to the installation
 * @throws {GitHubError} If the Octokit instance is not provided
 * @throws {GitHubAuthError} If authentication fails or the installation token is invalid
 * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded
 * @throws {GitHubApiError} For other GitHub API errors
 *
 * @example
 * // Using with GitHub App installation authentication
 * const octokit = await createAuthenticatedOctokit({
 *   type: 'app',
 *   installationId: 12345678
 * });
 * const repositories = await fetchAppRepositories(octokit);
 * console.log(`App installation can access ${repositories.length} repositories`);
 */
/**
 * Fetches repositories accessible to a GitHub App installation.
 *
 * This function retrieves all repositories that a GitHub App installation has access to.
 * Unlike the fetchRepositories function which is intended for OAuth authentication, this
 * function is specifically designed for GitHub App installations and uses a different
 * GitHub API endpoint.
 *
 * @param octokit - An authenticated Octokit instance with GitHub App installation authentication
 * @returns A promise resolving to an array of Repository objects accessible to the installation
 * @throws {GitHubError} If the Octokit instance is not provided
 * @throws {GitHubAuthError} If authentication fails or the installation token is invalid
 * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded
 * @throws {GitHubApiError} For other GitHub API errors
 */
export async function fetchAppRepositories(
  octokit: Octokit,
): Promise<Repository[]> {
  const context = { functionName: "fetchAppRepositories" };
  logger.debug(MODULE_NAME, "fetchAppRepositories called", context);

  if (!octokit) {
    throw new GitHubError("Octokit instance is required", { context });
  }

  try {
    // Check rate limits
    await checkRateLimits(octokit, context);

    // List all repositories accessible to the installation
    logger.debug(
      MODULE_NAME,
      "Fetching repositories accessible to the installation",
      context,
    );

    // Use paginate to fetch all pages, not just the first 100 repos
    const repositories = await octokit.paginate(
      octokit.rest.apps.listReposAccessibleToInstallation,
      {
        per_page: 100,
      },
    );

    logger.info(
      MODULE_NAME,
      "Fetched repositories from GitHub App installation",
      {
        ...context,
        count: repositories.length,
        private: repositories.filter((repo) => repo.private).length,
        public: repositories.filter((repo) => !repo.private).length,
      },
    );

    return repositories;
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Unified function to fetch repositories (backward-compatible version).
 * This function maintains the previous API for compatibility but uses the new pattern internally.
 * It authenticates using the provided credentials and then calls the appropriate repository fetching function.
 *
 * @param accessToken Optional GitHub OAuth access token
 * @param installationId Optional GitHub App installation ID
 * @returns A promise resolving to an array of Repository objects
 * @throws {GitHubAuthError} If authentication fails or credentials are invalid
 * @throws {GitHubConfigError} If required GitHub App configuration is missing
 * @throws {GitHubError} For other unexpected errors
 *
 * @deprecated Use fetchRepositories() or fetchAppRepositories() with a pre-authenticated Octokit instance instead
 */
export async function fetchAllRepositories(
  accessToken?: string,
  installationId?: number,
): Promise<Repository[]> {
  const context = {
    functionName: "fetchAllRepositories",
    hasAccessToken: !!accessToken,
    hasInstallationId: !!installationId,
  };

  logger.debug(
    MODULE_NAME,
    "fetchAllRepositories called (deprecated)",
    context,
  );

  // Validate that we have at least one authentication method
  if (!accessToken && !installationId) {
    logger.error(
      MODULE_NAME,
      "No authentication method available for repository access",
      context,
    );
    throw new GitHubAuthError(
      "No GitHub authentication available. Please sign in again.",
      { context },
    );
  }

  try {
    // Create an authenticated Octokit instance using the auth module
    const credentials: GitHubCredentials = installationId
      ? { type: "app", installationId }
      : { type: "oauth", token: accessToken! };

    const octokit = await createAuthenticatedOctokit(credentials);

    // Now call the appropriate repository fetching function
    if (installationId) {
      logger.info(
        MODULE_NAME,
        "Using GitHub App installation for repository access",
        {
          ...context,
          installationId,
        },
      );
      return await fetchAppRepositories(octokit);
    } else {
      logger.info(
        MODULE_NAME,
        "Using OAuth token for repository access",
        context,
      );
      return await fetchRepositories(octokit);
    }
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Fetches commits for a specific repository within a date range.
 *
 * This is the core function for fetching commits from a single repository and provides
 * the foundation for the other commit fetching functions. It supports filtering commits
 * by date range and author, and enhances the GitHub API response with additional
 * repository context.
 *
 * The function:
 * 1. Fetches commits using the GitHub API, with support for pagination
 * 2. Filters by date range (since/until) and optionally by author
 * 3. Adds repository information to each commit for better context
 * 4. Handles proper error cases with appropriate error types
 *
 * @param octokit - An authenticated Octokit instance (supports both OAuth and App auth)
 * @param owner - Repository owner (username or organization name)
 * @param repo - Repository name
 * @param since - ISO 8601 formatted date string for the earliest commits to include
 * @param until - ISO 8601 formatted date string for the latest commits to include
 * @param author - Optional GitHub username to filter commits by author
 * @returns A promise resolving to an array of Commit objects from the repository
 * @throws {GitHubError} If the Octokit instance is not provided
 * @throws {GitHubNotFoundError} If the repository doesn't exist or isn't accessible
 * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded
 * @throws {GitHubApiError} For other GitHub API errors
 *
 * @example
 * // Fetch commits from a repository for a specific date range
 * const commits = await fetchRepositoryCommitsWithOctokit(
 *   octokit,
 *   'username',
 *   'repo-name',
 *   '2023-01-01T00:00:00Z',
 *   '2023-01-31T23:59:59Z'
 * );
 *
 * @example
 * // Fetch commits from a repository for a specific author
 * const userCommits = await fetchRepositoryCommitsWithOctokit(
 *   octokit,
 *   'organization',
 *   'repo-name',
 *   '2023-01-01T00:00:00Z',
 *   '2023-01-31T23:59:59Z',
 *   'username'
 * );
 */
export async function fetchRepositoryCommitsWithOctokit(
  octokit: Octokit,
  owner: string,
  repo: string,
  since: string,
  until: string,
  author?: string,
): Promise<Commit[]> {
  const context = {
    functionName: "fetchRepositoryCommitsWithOctokit",
    owner,
    repo,
    since,
    until,
    author: author || "not specified",
  };

  logger.debug(MODULE_NAME, `Fetching commits for ${owner}/${repo}`, context);

  if (!octokit) {
    throw new GitHubError("Octokit instance is required", { context });
  }

  try {
    logger.debug(
      MODULE_NAME,
      `Starting pagination for ${owner}/${repo} commits`,
      context,
    );
    const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
      owner,
      repo,
      since,
      until,
      author,
      per_page: 100,
    });

    logger.info(MODULE_NAME, `Fetched commits for ${owner}/${repo}`, {
      ...context,
      count: commits.length,
      firstCommitSha: commits.length > 0 ? commits[0].sha : null,
      lastCommitSha:
        commits.length > 0 ? commits[commits.length - 1].sha : null,
    });

    // attach repository info using camelCase property names
    const commitsWithRepoInfo = commits.map((commit) => ({
      ...commit,
      repository: {
        fullName: `${owner}/${repo}`, // Use camelCase for internally added property
        full_name: `${owner}/${repo}`, // Keep snake_case for backward compatibility
      },
    }));

    // Safe type assertion as we're adding known properties that match the interface
    return commitsWithRepoInfo as unknown as Commit[];
  } catch (error: unknown) {
    return handleGitHubError(error, context);
  }
}

/**
 * Fetch repository commits using OAuth token (backward compatibility).
 * @param accessToken User's GitHub OAuth access token.
 * @param owner Repository owner (user or organization).
 * @param repo Repository name.
 * @param since Start date for commit range (ISO string).
 * @param until End date for commit range (ISO string).
 * @param author Optional author filter.
 * @returns A promise resolving to an array of Commit objects.
 * @throws {GitHubAuthError} If the access token is invalid or lacks permissions.
 * @throws {GitHubNotFoundError} If the repository is not found.
 * @throws {GitHubRateLimitError} If the API rate limit is exceeded.
 * @throws {GitHubApiError} For other GitHub API errors.
 * @throws {GitHubError} For unexpected errors.
 *
 * @deprecated Use fetchRepositoryCommitsWithOctokit with a pre-authenticated Octokit instance instead
 */
export async function fetchRepositoryCommitsOAuth(
  accessToken: string,
  owner: string,
  repo: string,
  since: string,
  until: string,
  author?: string,
): Promise<Commit[]> {
  const context = {
    functionName: "fetchRepositoryCommitsOAuth",
    accessTokenLength: accessToken?.length,
    owner,
    repo,
    since,
    until,
    author: author || "not specified",
  };
  // This function returns GitHub commits cast to our interface
  logger.debug(
    MODULE_NAME,
    `fetchRepositoryCommitsOAuth called for ${owner}/${repo} (deprecated)`,
    context,
  );

  if (!accessToken) {
    throw new GitHubAuthError("Access token is required", { context });
  }

  try {
    // Create an authenticated Octokit instance using the auth module
    const octokit = await createAuthenticatedOctokit({
      type: "oauth",
      token: accessToken,
    });

    return await fetchRepositoryCommitsWithOctokit(
      octokit,
      owner,
      repo,
      since,
      until,
      author,
    );
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Fetch repository commits using GitHub App installation (backward compatibility).
 * @param installationId The GitHub App installation ID.
 * @param owner Repository owner (user or organization).
 * @param repo Repository name.
 * @param since Start date for commit range (ISO string).
 * @param until End date for commit range (ISO string).
 * @param author Optional author filter.
 * @returns A promise resolving to an array of Commit objects.
 *
 * @deprecated Use fetchRepositoryCommitsWithOctokit with a pre-authenticated Octokit instance instead
 */
export async function fetchRepositoryCommitsApp(
  installationId: number,
  owner: string,
  repo: string,
  since: string,
  until: string,
  author?: string,
): Promise<Commit[]> {
  const context = {
    functionName: "fetchRepositoryCommitsApp",
    installationId,
    owner,
    repo,
    since,
    until,
    author: author || "not specified",
  };

  logger.debug(
    MODULE_NAME,
    `fetchRepositoryCommitsApp called for ${owner}/${repo} (deprecated)`,
    context,
  );

  try {
    // Get an Octokit instance with the installation access token using the auth module
    const octokit = await createAuthenticatedOctokit({
      type: "app",
      installationId,
    });

    return await fetchRepositoryCommitsWithOctokit(
      octokit,
      owner,
      repo,
      since,
      until,
      author,
    );
  } catch (error) {
    logger.error(
      MODULE_NAME,
      `Error fetching commits for ${owner}/${repo} via GitHub App`,
      {
        ...context,
        error,
      },
    );
    return handleGitHubError(error, context);
  }
}

/**
 * Unified function to fetch repository commits (backward compatibility).
 * This function creates an authenticated Octokit instance and then calls fetchRepositoryCommitsWithOctokit.
 *
 * @param accessToken Optional GitHub OAuth access token.
 * @param installationId Optional GitHub App installation ID.
 * @param owner Repository owner (user or organization).
 * @param repo Repository name.
 * @param since Start date for commit range (ISO string).
 * @param until End date for commit range (ISO string).
 * @param author Optional author filter.
 * @returns A promise resolving to an array of Commit objects.
 *
 * @deprecated Use fetchRepositoryCommitsWithOctokit with a pre-authenticated Octokit instance instead
 */
export async function fetchRepositoryCommits(
  accessToken?: string,
  installationId?: number,
  owner: string = "",
  repo: string = "",
  since: string = "",
  until: string = "",
  author?: string,
): Promise<Commit[]> {
  const context = {
    functionName: "fetchRepositoryCommits",
    hasAccessToken: !!accessToken,
    hasInstallationId: !!installationId,
    owner,
    repo,
    since,
    until,
    author: author || "not specified",
  };

  logger.debug(
    MODULE_NAME,
    `fetchRepositoryCommits called for ${owner}/${repo} (deprecated)`,
    context,
  );

  try {
    // Validate that we have at least one authentication method
    if (!accessToken && !installationId) {
      logger.error(
        MODULE_NAME,
        "No authentication method available for commit access",
        context,
      );
      throw new GitHubAuthError(
        "No GitHub authentication available. Please sign in again.",
        { context },
      );
    }

    // Create an authenticated Octokit instance using the auth module
    const credentials: GitHubCredentials = installationId
      ? { type: "app", installationId }
      : { type: "oauth", token: accessToken! };

    const octokit = await createAuthenticatedOctokit(credentials);

    // Call the new function with the authenticated Octokit instance
    return await fetchRepositoryCommitsWithOctokit(
      octokit,
      owner,
      repo,
      since,
      until,
      author,
    );
  } catch (error) {
    logger.error(
      MODULE_NAME,
      `Error in unified fetchRepositoryCommits for ${owner}/${repo}`,
      { ...context, error },
    );
    return [];
  }
}

/**
 * Fetches commits across multiple repositories with smart author detection.
 *
 * This high-level function is a key component for generating activity reports across
 * multiple repositories. It implements a sophisticated approach to commit retrieval
 * with automatic fallback strategies for author detection:
 *
 * 1. First tries to fetch commits with the exact author name provided
 * 2. If no commits are found, falls back to using the repository owner's name
 * 3. If still no commits are found, removes the author filter entirely
 *
 * The function processes repositories in batches to avoid overwhelming the GitHub API
 * and combines the results into a single unified array of commits.
 *
 * @param octokit - An authenticated Octokit instance (supports both OAuth and App auth)
 * @param repositories - Array of repository identifiers in "owner/repo" format
 * @param since - ISO 8601 formatted date string for the earliest commits to include
 * @param until - ISO 8601 formatted date string for the latest commits to include
 * @param author - Optional GitHub username to filter commits by author
 * @returns A promise resolving to an array of Commit objects from all specified repositories
 * @throws {GitHubError} If the Octokit instance is not provided or for other unexpected errors
 *
 * @example
 * // Fetch commits from multiple repositories
 * const repositories = ['org/repo1', 'org/repo2', 'username/personal-repo'];
 * const commits = await fetchCommitsForRepositoriesWithOctokit(
 *   octokit,
 *   repositories,
 *   '2023-01-01T00:00:00Z',
 *   '2023-01-31T23:59:59Z',
 *   'username'
 * );
 * console.log(`Found ${commits.length} commits across ${repositories.length} repositories`);
 */
/**
 * Fetches commits across multiple repositories with smart author detection.
 *
 * This high-level function is a key component for generating activity reports across
 * multiple repositories. It implements a sophisticated approach to commit retrieval
 * with automatic fallback strategies for author detection.
 *
 * @param octokit - An authenticated Octokit instance (supports both OAuth and App auth)
 * @param repositories - Array of repository identifiers in "owner/repo" format
 * @param since - ISO 8601 formatted date string for the earliest commits to include
 * @param until - ISO 8601 formatted date string for the latest commits to include
 * @param author - Optional GitHub username to filter commits by author
 * @returns A promise resolving to an array of Commit objects from all specified repositories
 * @throws {GitHubError} If the Octokit instance is not provided or for other unexpected errors
 */
export async function fetchCommitsForRepositoriesWithOctokit(
  octokit: Octokit,
  repositories: string[] = [],
  since: string = "",
  until: string = "",
  author?: string,
): Promise<Commit[]> {
  const context = {
    functionName: "fetchCommitsForRepositoriesWithOctokit",
    repositoriesCount: repositories.length,
    since,
    until,
    author: author || "not specified",
  };

  logger.debug(
    MODULE_NAME,
    "fetchCommitsForRepositoriesWithOctokit called",
    context,
  );

  if (!octokit) {
    throw new GitHubError("Octokit instance is required", { context });
  }

  return processRepositoriesWithFallback(
    octokit,
    repositories,
    since,
    until,
    author,
    context,
  );
}

/**
 * Fetch commits for multiple repositories (backward compatibility).
 * @param accessToken Optional GitHub OAuth access token.
 * @param installationId Optional GitHub App installation ID.
 * @param repositories List of repositories in the format "owner/repo".
 * @param since Start date for commit range (ISO string).
 * @param until End date for commit range (ISO string).
 * @param author Optional author filter.
 * @returns A promise resolving to an array of Commit objects.
 *
 * @deprecated Use fetchCommitsForRepositoriesWithOctokit with a pre-authenticated Octokit instance instead
 */
export async function fetchCommitsForRepositories(
  accessToken?: string,
  installationId?: number,
  repositories: string[] = [],
  since: string = "",
  until: string = "",
  author?: string,
): Promise<Commit[]> {
  const context = {
    functionName: "fetchCommitsForRepositories",
    repositoriesCount: repositories.length,
    hasAccessToken: !!accessToken,
    hasInstallationId: !!installationId,
    since,
    until,
    author: author || "not specified",
  };

  // The return value will be properly cast to our Commit interface
  logger.debug(
    MODULE_NAME,
    "fetchCommitsForRepositories called (deprecated)",
    context,
  );

  if (!accessToken && !installationId) {
    logger.error(
      MODULE_NAME,
      "No authentication method provided for fetching commits",
      context,
    );
    throw new GitHubAuthError(
      "No GitHub authentication available. Please sign in again.",
      { context },
    );
  }

  try {
    // Create an authenticated Octokit instance using the auth module
    const credentials: GitHubCredentials = installationId
      ? { type: "app", installationId }
      : { type: "oauth", token: accessToken! };

    const octokit = await createAuthenticatedOctokit(credentials);

    // Call the new function with the authenticated Octokit instance
    return await fetchCommitsForRepositoriesWithOctokit(
      octokit,
      repositories,
      since,
      until,
      author,
    );
  } catch (error) {
    logger.error(MODULE_NAME, "Error in fetchCommitsForRepositories", {
      ...context,
      error,
    });
    return handleGitHubError(error, context);
  }
}
