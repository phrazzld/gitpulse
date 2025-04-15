// GitHub data fetching module
// This module centralizes GitHub data fetching logic, separated from authentication concerns

import { Octokit } from "octokit";
import { logger } from "./logger";
import {
  GitHubError,
  GitHubAuthError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubApiError,
  handleGitHubError
} from "./errors";
import { GITHUB_API } from "./constants";

// Import from the auth module to use in the backward-compatible function
import { createAuthenticatedOctokit, GitHubCredentials } from "./auth/githubAuth";

// Module name for consistent logging
const MODULE_NAME = "githubData";

// Export types from the original github.ts file that are needed for data operations
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    // you could add node_id?: string; avatar_url?: string; etc. if you need them
  };
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at?: string | null;
  language?: string | null;
  // optionally: license?: License|null;
}

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
    // Add other properties that might exist
    [key: string]: any;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
    // Add other properties that might exist
    [key: string]: any;
  } | null;
  repository?: {
    full_name: string;
  };
  // Allow other properties from the GitHub API
  [key: string]: any;
}

/**
 * Fetch repositories using an authenticated Octokit instance.
 * @param octokit An authenticated Octokit instance.
 * @returns A promise resolving to an array of Repository objects.
 * @throws {GitHubAuthError} If authentication fails or lacks required permissions.
 * @throws {GitHubRateLimitError} If the API rate limit is exceeded.
 * @throws {GitHubApiError} For other GitHub API errors.
 * @throws {GitHubError} For unexpected errors.
 */
export async function fetchRepositories(
  octokit: Octokit
): Promise<Repository[]> {
  const context = { functionName: 'fetchRepositories' };
  logger.debug(MODULE_NAME, "fetchRepositories called", context);
  
  if (!octokit) {
    throw new GitHubError("Octokit instance is required", { context });
  }

  let allRepos: Repository[] = [];

  try {
    // check github api rate limits
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

    // retrieve authenticated user info (and check token scopes)
    try {
      const userInfo = await octokit.rest.users.getAuthenticated();
      const scopesHeader = userInfo.headers["x-oauth-scopes"] || "";
      const scopes = scopesHeader ? scopesHeader.split(", ") : [];

      logger.info(MODULE_NAME, "Authenticated user details", {
        ...context,
        login: userInfo.data.login,
        id: userInfo.data.id,
        type: userInfo.data.type,
        // this property isn't in official octokit types:
        twoFactorEnabled: (userInfo.data as any).two_factor_authentication,
        tokenScopes: scopes,
        hasRepoScope: scopes.includes("repo"),
        hasReadOrgScope: scopes.includes("read:org"),
      });

      // strongly recommend ensuring 'repo' and 'read:org' if you want all repos
      if (!scopes.includes("repo")) {
        logger.warn(
          MODULE_NAME,
          "GitHub token is missing 'repo' scope. This will prevent access to private repositories.",
          context,
        );
        throw new GitHubAuthError(
          "GitHub token is missing 'repo' scope. Please re-authenticate with the necessary permissions.",
          { context }
        );
      }

      if (!scopes.includes("read:org")) {
        logger.warn(
          MODULE_NAME,
          "GitHub token is missing 'read:org' scope. This may limit access to organization data.",
          context,
        );
        // Note: We're not throwing an error for missing read:org, just warning
      }
    } catch (userInfoError) {
      // This could be an auth error, so we should throw it
      logger.warn(MODULE_NAME, "Could not retrieve authenticated user info", {
        ...context,
        error: userInfoError,
      });
      return handleGitHubError(userInfoError, {
        ...context,
        subOperation: "getAuthenticated"
      });
    }

    // the simplest approach to get as many repos as possible:
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
    allRepos = combinedRepos;

    // you can optionally also iterate over orgs you belong to and list them directly,
    // in case you want to see if the direct org approach yields anything new:
    try {
      const orgs = await octokit.paginate(
        octokit.rest.orgs.listForAuthenticatedUser,
        {
          per_page: 100,
        },
      );
      logger.info(MODULE_NAME, "Fetched user organizations", {
        ...context,
        count: orgs.length,
        orgs: orgs.map((o) => o.login),
      });

      for (const org of orgs) {
        try {
          const orgRepos = await octokit.paginate(
            octokit.rest.repos.listForOrg,
            {
              org: org.login,
              per_page: 100,
              sort: "updated",
              type: "all", // private + public + forks, etc. as long as your token can see them
            },
          );
          logger.info(MODULE_NAME, `Fetched repos for org: ${org.login}`, {
            ...context,
            count: orgRepos.length,
          });
          // Make sure we're creating a proper array of repositories
          // @ts-ignore - Octokit types for returned repository data vary
          if (Array.isArray(orgRepos)) {
            allRepos = [...allRepos, ...orgRepos];
          } else if (orgRepos) {
            // If it's a single repo, add it to the array
            // @ts-ignore - Octokit type complexities
            allRepos.push(orgRepos);
          }
        } catch (orgError) {
          // Non-fatal error, just log and continue
          logger.warn(
            MODULE_NAME,
            `Error fetching repos for org: ${org.login}`,
            { ...context, error: orgError },
          );
        }
      }
    } catch (orgListError) {
      // Non-fatal error, just log and continue
      logger.warn(MODULE_NAME, "Failed to list user orgs", {
        ...context,
        error: orgListError,
      });
    }

    // deduplicate by full_name
    logger.debug(MODULE_NAME, "Deduplicating repositories", {
      ...context,
      beforeCount: allRepos.length,
    });
    const uniqueRepos = Array.from(
      new Map(allRepos.map((r) => [r.full_name, r])).values(),
    );
    logger.info(MODULE_NAME, "Deduplicated repositories", {
      ...context,
      afterCount: uniqueRepos.length,
      duplicatesRemoved: allRepos.length - uniqueRepos.length,
    });

    return uniqueRepos;
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Fetch repositories accessible to a GitHub App installation.
 * @param octokit An authenticated Octokit instance with App installation auth.
 * @returns A promise resolving to an array of Repository objects.
 * @throws {GitHubAuthError} If authentication fails.
 * @throws {GitHubRateLimitError} If the API rate limit is exceeded.
 * @throws {GitHubApiError} For other GitHub API errors.
 * @throws {GitHubError} For unexpected errors.
 */
export async function fetchAppRepositories(
  octokit: Octokit
): Promise<Repository[]> {
  const context = { functionName: 'fetchAppRepositories' };
  logger.debug(MODULE_NAME, "fetchAppRepositories called", context);

  if (!octokit) {
    throw new GitHubError("Octokit instance is required", { context });
  }

  try {
    // Check rate limits
    try {
      const rateLimit = await octokit.rest.rateLimit.get();
      const core = rateLimit.data.resources.core;
      logger.info(MODULE_NAME, "GitHub API rate limit status (App auth)", {
        ...context,
        limit: core.limit,
        remaining: core.remaining,
        reset: new Date(core.reset * 1000).toISOString(),
        usedPercent:
          100 - Number(((core.remaining / core.limit) * 100).toFixed(1)),
      });
    } catch (rateLimitError) {
      logger.warn(
        MODULE_NAME,
        "Failed to check GitHub API rate limits (App auth)",
        {
          ...context,
          error: rateLimitError,
        },
      );
    }

    // List all repositories accessible to the installation
    logger.debug(
      MODULE_NAME,
      "Fetching repositories accessible to the installation",
      context
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
    functionName: 'fetchAllRepositories',
    hasAccessToken: !!accessToken,
    hasInstallationId: !!installationId
  };
  
  logger.debug(MODULE_NAME, "fetchAllRepositories called (deprecated)", context);

  // Validate that we have at least one authentication method
  if (!accessToken && !installationId) {
    logger.error(
      MODULE_NAME,
      "No authentication method available for repository access",
      context
    );
    throw new GitHubAuthError(
      "No GitHub authentication available. Please sign in again.",
      { context }
    );
  }

  try {
    // Create an authenticated Octokit instance using the auth module
    const credentials: GitHubCredentials = installationId
      ? { type: 'app', installationId }
      : { type: 'oauth', token: accessToken! };
    
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
      logger.info(MODULE_NAME, "Using OAuth token for repository access", context);
      return await fetchRepositories(octokit);
    }
  } catch (error) {
    return handleGitHubError(error, context);
  }
}

/**
 * Fetch repository commits using an authenticated Octokit instance.
 * @param octokit An authenticated Octokit instance.
 * @param owner Repository owner (user or organization).
 * @param repo Repository name.
 * @param since Start date for commit range (ISO string).
 * @param until End date for commit range (ISO string).
 * @param author Optional author filter.
 * @returns A promise resolving to an array of Commit objects.
 * @throws {GitHubNotFoundError} If the repository is not found.
 * @throws {GitHubRateLimitError} If the API rate limit is exceeded.
 * @throws {GitHubApiError} For other GitHub API errors.
 * @throws {GitHubError} For unexpected errors.
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
    functionName: 'fetchRepositoryCommitsWithOctokit',
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
    logger.debug(MODULE_NAME, `Starting pagination for ${owner}/${repo} commits`, context);
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
      lastCommitSha: commits.length > 0 ? commits[commits.length - 1].sha : null,
    });

    // attach repository info
    const commitsWithRepoInfo = commits.map((commit) => ({
      ...commit,
      repository: {
        full_name: `${owner}/${repo}`,
      },
    }));

    // Cast to ensure compatibility with our interface
    return commitsWithRepoInfo as any as Commit[];
  } catch (error) {
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
    functionName: 'fetchRepositoryCommitsOAuth',
    accessTokenLength: accessToken?.length,
    owner,
    repo,
    since,
    until,
    author: author || "not specified",
  };
  // This function returns GitHub commits cast to our interface
  logger.debug(MODULE_NAME, `fetchRepositoryCommitsOAuth called for ${owner}/${repo} (deprecated)`, context);

  if (!accessToken) {
    throw new GitHubAuthError("Access token is required", { context });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    return await fetchRepositoryCommitsWithOctokit(
      octokit,
      owner,
      repo,
      since,
      until,
      author
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
    functionName: 'fetchRepositoryCommitsApp',
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
    context
  );

  try {
    // Get an Octokit instance with the installation access token using the auth module
    const octokit = await createAuthenticatedOctokit({
      type: 'app',
      installationId
    });

    return await fetchRepositoryCommitsWithOctokit(
      octokit,
      owner,
      repo,
      since,
      until,
      author
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
    functionName: 'fetchRepositoryCommits',
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
    context
  );

  try {
    // Validate that we have at least one authentication method
    if (!accessToken && !installationId) {
      logger.error(
        MODULE_NAME,
        "No authentication method available for commit access",
        context
      );
      throw new GitHubAuthError(
        "No GitHub authentication available. Please sign in again.",
        { context }
      );
    }

    // Create an authenticated Octokit instance using the auth module
    const credentials: GitHubCredentials = installationId
      ? { type: 'app', installationId }
      : { type: 'oauth', token: accessToken! };
    
    const octokit = await createAuthenticatedOctokit(credentials);
    
    // Call the new function with the authenticated Octokit instance
    return await fetchRepositoryCommitsWithOctokit(
      octokit,
      owner,
      repo,
      since,
      until,
      author
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
 * Fetch commits for multiple repositories.
 * @param accessToken Optional GitHub OAuth access token.
 * @param installationId Optional GitHub App installation ID.
 * @param repositories List of repositories in the format "owner/repo".
 * @param since Start date for commit range (ISO string).
 * @param until End date for commit range (ISO string).
 * @param author Optional author filter.
 * @returns A promise resolving to an array of Commit objects.
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
    functionName: 'fetchCommitsForRepositories',
    repositoriesCount: repositories.length,
    hasAccessToken: !!accessToken,
    hasInstallationId: !!installationId,
    since,
    until,
    author: author || "not specified",
  };
  
  // The return value will be properly cast to our Commit interface
  logger.debug(MODULE_NAME, "fetchCommitsForRepositories called", context);

  if (!accessToken && !installationId) {
    logger.error(
      MODULE_NAME,
      "No authentication method provided for fetching commits",
      context
    );
    throw new GitHubAuthError(
      "No GitHub authentication available. Please sign in again.",
      { context }
    );
  }

  const allCommits: Commit[] = [];
  let githubUsername = author;
  const batchSize = GITHUB_API.BATCH_SIZE;

  // first pass with "author" if provided
  for (let i = 0; i < repositories.length; i += batchSize) {
    const batch = repositories.slice(i, i + batchSize);
    logger.debug(
      MODULE_NAME,
      `processing batch ${Math.floor(i / batchSize) + 1}`,
      { ...context, batchRepos: batch },
    );

    const results = await Promise.all(
      batch.map((repoFullName) => {
        const [owner, repo] = repoFullName.split("/");
        return fetchRepositoryCommits(
          accessToken,
          installationId,
          owner,
          repo,
          since,
          until,
          githubUsername,
        );
      }),
    );
    results.forEach((commits) => allCommits.push(...commits));
  }

  // if we found no commits with that author, try with owner name or no author
  if (allCommits.length === 0 && author) {
    logger.info(
      MODULE_NAME,
      "No commits found with provided author name; retrying with the repo owner as author",
      context
    );

    if (repositories.length > 0) {
      const [fallbackOwner] = repositories[0].split("/");
      githubUsername = fallbackOwner;
      for (let i = 0; i < repositories.length; i += batchSize) {
        const batch = repositories.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((repoFullName) => {
            const [owner, repo] = repoFullName.split("/");
            return fetchRepositoryCommits(
              accessToken,
              installationId,
              owner,
              repo,
              since,
              until,
              githubUsername,
            );
          }),
        );
        results.forEach((commits) => allCommits.push(...commits));
      }
    }
  }

  if (allCommits.length === 0 && author) {
    logger.info(
      MODULE_NAME,
      "Still no commits found, retrying without author filter",
      context
    );
    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((repoFullName) => {
          const [owner, repo] = repoFullName.split("/");
          return fetchRepositoryCommits(
            accessToken,
            installationId,
            owner,
            repo,
            since,
            until,
            undefined,
          );
        }),
      );
      results.forEach((commits) => allCommits.push(...commits));
    }
  }

  logger.info(MODULE_NAME, "All repository commits fetched", {
    ...context,
    totalRepositories: repositories.length,
    totalCommits: allCommits.length,
    finalAuthorFilter: githubUsername || "none",
    authMethod: installationId ? "GitHub App" : "OAuth",
  });

  return allCommits;
}