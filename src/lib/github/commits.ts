/**
 * GitHub commits module
 * 
 * Provides functions for fetching and interacting with GitHub commits
 * using both OAuth tokens and GitHub App installations.
 */

import { logger } from "../logger";
import { Commit } from "./types";
import { IOctokitClient } from "./interfaces";

const MODULE_NAME = "github:commits";

/**
 * Fetch repository commits using OAuth token
 * @param accessToken GitHub OAuth access token
 * @param owner Repository owner (username or organization)
 * @param repo Repository name
 * @param since Start date for commit history (ISO date string)
 * @param until End date for commit history (ISO date string)
 * @param author Optional filter by commit author
 * @returns Array of GitHub commits
 */
export async function fetchRepositoryCommitsOAuth(
  client: IOctokitClient,
  owner: string,
  repo: string,
  since: string,
  until: string,
  author?: string,
): Promise<Commit[]> {
  logger.debug(
    MODULE_NAME,
    `fetchRepositoryCommitsOAuth called for ${owner}/${repo}`,
    {
      since,
      until,
      author: author || "not specified",
    },
  );

  try {
    logger.debug(
      MODULE_NAME,
      `Starting pagination for ${owner}/${repo} commits`,
    );
    const commits = await client.paginate<any>(client.rest.repos.listCommits, {
      owner,
      repo,
      since,
      until,
      author,
      per_page: 100,
    });

    logger.info(MODULE_NAME, `Fetched commits for ${owner}/${repo}`, {
      count: commits.length,
      firstCommitSha: commits.length > 0 ? commits[0].sha : null,
      lastCommitSha:
        commits.length > 0 ? commits[commits.length - 1].sha : null,
    });

    // attach repository info
    const commitsWithRepoInfo = commits.map((commit) => ({
      ...commit,
      repository: {
        full_name: `${owner}/${repo}`,
      },
    }));

    return commitsWithRepoInfo as unknown as Commit[];
  } catch (error) {
    logger.error(MODULE_NAME, `Error fetching commits for ${owner}/${repo}`, {
      error,
    });
    // return empty array if there's an access or other error
    return [];
  }
}

/**
 * Fetch repository commits using GitHub App installation
 * @param installationId GitHub App installation ID
 * @param owner Repository owner (username or organization)
 * @param repo Repository name
 * @param since Start date for commit history (ISO date string)
 * @param until End date for commit history (ISO date string)
 * @param author Optional filter by commit author
 * @returns Array of GitHub commits
 */
export async function fetchRepositoryCommitsApp(
  client: IOctokitClient,
  owner: string,
  repo: string,
  since: string,
  until: string,
  author?: string,
): Promise<Commit[]> {
  logger.debug(
    MODULE_NAME,
    `fetchRepositoryCommitsApp called for ${owner}/${repo}`,
    {
      since,
      until,
      author: author || "not specified",
    },
  );

  try {

    logger.debug(
      MODULE_NAME,
      `Starting pagination for ${owner}/${repo} commits via GitHub App`,
    );

    const commits = await client.paginate<any>(client.rest.repos.listCommits, {
      owner,
      repo,
      since,
      until,
      author,
      per_page: 100,
    });

    logger.info(
      MODULE_NAME,
      `Fetched commits for ${owner}/${repo} via GitHub App`,
      {
        count: commits.length,
        firstCommitSha: commits.length > 0 ? commits[0].sha : null,
        lastCommitSha:
          commits.length > 0 ? commits[commits.length - 1].sha : null,
      },
    );

    // attach repository info
    const commitsWithRepoInfo = commits.map((commit) => ({
      ...commit,
      repository: {
        full_name: `${owner}/${repo}`,
      },
    }));

    return commitsWithRepoInfo as unknown as Commit[];
  } catch (error) {
    logger.error(
      MODULE_NAME,
      `Error fetching commits for ${owner}/${repo} via GitHub App`,
      {
        error,
      },
    );
    // return empty array if there's an access or other error
    return [];
  }
}

/**
 * Unified function to fetch repository commits
 * @param accessToken GitHub OAuth access token
 * @param installationId GitHub App installation ID
 * @param owner Repository owner (username or organization)
 * @param repo Repository name
 * @param since Start date for commit history (ISO date string)
 * @param until End date for commit history (ISO date string)
 * @param author Optional filter by commit author
 * @returns Array of GitHub commits
 */
export async function fetchRepositoryCommits(
  client: IOctokitClient,
  authMethod: 'oauth' | 'app',
  owner: string = "",
  repo: string = "",
  since: string = "",
  until: string = "",
  author?: string,
): Promise<Commit[]> {
  logger.debug(
    MODULE_NAME,
    `fetchRepositoryCommits called for ${owner}/${repo}`,
    {
      authMethod,
      since,
      until,
      author: author || "not specified",
    },
  );

  if (authMethod === 'app') {
    logger.info(
      MODULE_NAME,
      "Using GitHub App installation for commit access",
    );
    return await fetchRepositoryCommitsApp(
      client,
      owner,
      repo,
      since,
      until,
      author,
    );
  } else if (authMethod === 'oauth') {
    logger.info(MODULE_NAME, "Using OAuth token for commit access");
    return await fetchRepositoryCommitsOAuth(
      client,
      owner,
      repo,
      since,
      until,
      author,
    );
  } else {
    // Explicitly handle unsupported auth methods
    const error = new Error(`Unsupported auth method: ${authMethod}`);
    logger.error(MODULE_NAME, error.message);
    throw error;
  }
}

/**
 * Fetch commits from multiple repositories
 * @param accessToken GitHub OAuth access token
 * @param installationId GitHub App installation ID
 * @param repositories Array of repository full names (owner/repo)
 * @param since Start date for commit history (ISO date string)
 * @param until End date for commit history (ISO date string)
 * @param author Optional filter by commit author
 * @returns Array of GitHub commits across all repositories
 */
export async function fetchCommitsForRepositories(
  client: IOctokitClient,
  authMethod: 'oauth' | 'app',
  repositories: string[] = [],
  since: string = "",
  until: string = "",
  author?: string,
): Promise<Commit[]> {
  logger.debug(MODULE_NAME, "fetchCommitsForRepositories called", {
    repositoriesCount: repositories.length,
    authMethod,
    since,
    until,
    author: author || "not specified",
  });

  const allCommits: Commit[] = [];
  let githubUsername = author;
  // Use larger batch size for app auth, smaller for OAuth to avoid rate limits
  const batchSize = authMethod === 'app' ? 30 : 5;

  // first pass with "author" if provided
  for (let i = 0; i < repositories.length; i += batchSize) {
    const batch = repositories.slice(i, i + batchSize);
    logger.debug(
      MODULE_NAME,
      `processing batch ${Math.floor(i / batchSize) + 1}`,
      { batchRepos: batch },
    );

    const results = await Promise.all(
      batch.map((repoFullName) => {
        const [owner, repo] = repoFullName.split("/");
        return fetchRepositoryCommits(
          client,
          authMethod,
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
              client,
              authMethod,
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
    );
    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((repoFullName) => {
          const [owner, repo] = repoFullName.split("/");
          return fetchRepositoryCommits(
            client,
            authMethod,
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
    totalRepositories: repositories.length,
    totalCommits: allCommits.length,
    finalAuthorFilter: githubUsername || "none",
    authMethod,
  });

  return allCommits;
}