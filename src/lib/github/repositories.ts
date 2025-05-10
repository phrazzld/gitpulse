/**
 * GitHub repositories module
 * 
 * Provides functions for fetching and interacting with GitHub repositories
 * using both OAuth tokens and GitHub App installations.
 */

import { Octokit } from "octokit";
import { logger } from "../logger";
import { Repository } from "./types";
import { getInstallationOctokit } from "./auth";
import { normalizeRepositoryResponse, isRepositoryArray } from "./octokitTypes";

const MODULE_NAME = "github:repositories";

/**
 * Fetch repositories using user OAuth token
 * @param accessToken GitHub OAuth access token
 * @returns Array of GitHub repositories
 */
export async function fetchAllRepositoriesOAuth(
  accessToken: string,
): Promise<Repository[]> {
  logger.debug(MODULE_NAME, "fetchAllRepositoriesOAuth called", {
    accessTokenLength: accessToken?.length,
  });
  const octokit = new Octokit({ auth: accessToken });
  let allRepos: Repository[] = [];

  try {
    // check github api rate limits
    try {
      const rateLimit = await octokit.rest.rateLimit.get();
      const core = rateLimit.data.resources.core;
      logger.info(MODULE_NAME, "GitHub API rate limit status", {
        limit: core.limit,
        remaining: core.remaining,
        reset: new Date(core.reset * 1000).toISOString(),
        usedPercent:
          100 - Number(((core.remaining / core.limit) * 100).toFixed(1)),
      });

      if (core.remaining < 100) {
        logger.warn(MODULE_NAME, "GitHub API rate limit is running low", {
          remaining: core.remaining,
          resetTime: new Date(core.reset * 1000).toISOString(),
        });
      }
    } catch (rateLimitError) {
      logger.warn(MODULE_NAME, "Failed to check GitHub API rate limits", {
        error: rateLimitError,
      });
    }

    // retrieve authenticated user info (and check token scopes)
    try {
      const userInfo = await octokit.rest.users.getAuthenticated();
      const scopesHeader = userInfo.headers["x-oauth-scopes"] || "";
      const scopes = scopesHeader ? scopesHeader.split(", ") : [];

      logger.info(MODULE_NAME, "Authenticated user details", {
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
        );
        throw new Error(
          "GitHub token is missing 'repo' scope. Please re-authenticate with the necessary permissions.",
        );
      }

      if (!scopes.includes("read:org")) {
        logger.warn(
          MODULE_NAME,
          "GitHub token is missing 'read:org' scope. This may limit access to organization data.",
        );
        // optionally make this an error if you absolutely need org repos
        // throw new Error("GitHub token is missing 'read:org' scope. Please re-authenticate with the necessary permissions.");
      }
    } catch (userInfoError) {
      logger.warn(MODULE_NAME, "Could not retrieve authenticated user info", {
        error: userInfoError,
      });
    }

    // the simplest approach to get as many repos as possible:
    logger.debug(
      MODULE_NAME,
      "Fetching all repos with combined affiliation=owner,collaborator,organization_member and visibility=all",
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
            count: orgRepos.length,
          });
          // Handle repository response with proper type checking
          const normalizedRepos = normalizeRepositoryResponse(orgRepos);
          if (normalizedRepos.length > 0) {
            allRepos = [...allRepos, ...normalizedRepos];
          }
        } catch (orgError) {
          logger.warn(
            MODULE_NAME,
            `Error fetching repos for org: ${org.login}`,
            { error: orgError },
          );
        }
      }
    } catch (orgListError) {
      logger.warn(MODULE_NAME, "Failed to list user orgs", {
        error: orgListError,
      });
    }

    // deduplicate by full_name
    logger.debug(MODULE_NAME, "Deduplicating repositories", {
      beforeCount: allRepos.length,
    });
    const uniqueRepos = Array.from(
      new Map(allRepos.map((r) => [r.full_name, r])).values(),
    );
    logger.info(MODULE_NAME, "Deduplicated repositories", {
      afterCount: uniqueRepos.length,
      duplicatesRemoved: allRepos.length - uniqueRepos.length,
    });

    return uniqueRepos;
  } catch (error) {
    logger.error(MODULE_NAME, "Error fetching repositories", { error });
    throw error;
  }
}

/**
 * Fetch repositories using GitHub App installation
 * @param installationId GitHub App installation ID
 * @returns Array of GitHub repositories
 */
export async function fetchAllRepositoriesApp(
  installationId: number,
): Promise<Repository[]> {
  logger.debug(MODULE_NAME, "fetchAllRepositoriesApp called", {
    installationId,
  });

  try {
    // Get an Octokit instance with the installation access token
    const octokit = await getInstallationOctokit(installationId);

    // Check rate limits
    try {
      const rateLimit = await octokit.rest.rateLimit.get();
      const core = rateLimit.data.resources.core;
      logger.info(MODULE_NAME, "GitHub API rate limit status (App auth)", {
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
          error: rateLimitError,
        },
      );
    }

    // List all repositories accessible to the installation
    logger.debug(
      MODULE_NAME,
      "Fetching repositories accessible to the installation",
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
        count: repositories.length,
        private: repositories.filter((repo) => repo.private).length,
        public: repositories.filter((repo) => !repo.private).length,
      },
    );

    return repositories;
  } catch (error) {
    logger.error(MODULE_NAME, "Error fetching repositories via GitHub App", {
      error,
    });
    throw error;
  }
}

/**
 * Unified function to fetch repositories via OAuth or GitHub App
 * @param accessToken GitHub OAuth access token
 * @param installationId GitHub App installation ID
 * @returns Array of GitHub repositories
 */
export async function fetchAllRepositories(
  accessToken?: string,
  installationId?: number,
): Promise<Repository[]> {
  logger.debug(MODULE_NAME, "fetchAllRepositories called", {
    hasAccessToken: !!accessToken,
    hasInstallationId: !!installationId,
  });

  try {
    // Prefer GitHub App installation if available
    if (installationId) {
      logger.info(
        MODULE_NAME,
        "Using GitHub App installation for repository access",
        {
          installationId,
        },
      );
      return await fetchAllRepositoriesApp(installationId);
    } else if (accessToken) {
      logger.info(MODULE_NAME, "Using OAuth token for repository access");
      return await fetchAllRepositoriesOAuth(accessToken);
    } else {
      // Neither authentication method is available
      logger.error(
        MODULE_NAME,
        "No authentication method available for repository access",
      );
      throw new Error(
        "No GitHub authentication available. Please sign in again.",
      );
    }
  } catch (error) {
    logger.error(MODULE_NAME, "Error in unified fetchAllRepositories", {
      error,
    });
    throw error;
  }
}