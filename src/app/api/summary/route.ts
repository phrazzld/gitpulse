import { NextRequest, NextResponse } from "next/server";
import { SessionInfo } from "@/types/api";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { safelyExtractError } from "@/lib/errors";
import {
  fetchAllRepositories,
  fetchCommitsForRepositories,
  fetchCommitsForRepositoriesWithOctokit,
  fetchRepositories,
  fetchAppRepositories,
  Commit,
  Repository,
} from "@/lib/githubData";
import {
  getAllAppInstallations,
  createAuthenticatedOctokit,
  GitHubCredentials,
  AppInstallation,
} from "@/lib/auth/githubAuth";
import { generateCommitSummary } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import {
  withErrorHandling,
  createApiErrorResponse,
} from "@/lib/auth/apiErrorHandler";
import { z } from "zod";
import {
  dateSchema,
  contributorsSchema,
  repositoriesSchema,
  organizationsSchema,
  validateQueryParams,
} from "@/lib/validation";
import { resolveMultipleInstallationIds } from "@/lib/auth/installationHelper";

const MODULE_NAME = "api:summary";

// Type for grouped results
type GroupedResult = {
  groupKey: string;
  groupName: string;
  groupAvatar?: string;
  commitCount: number;
  repositories: string[];
  dates: string[];
  commits: Commit[];
  aiSummary?: unknown;
};

// Valid grouping options
// Note: In the individual-focused MVP, we only use 'chronological' grouping.
// Other options are maintained for backward compatibility but no longer used.
type GroupBy =
  | "chronological"
  | "repository"
  /**
   * @deprecated 'contributor' grouping is no longer actively used in the individual-focused MVP
   */
  | "contributor"
  /**
   * @deprecated 'organization' grouping is no longer actively used in the individual-focused MVP
   */
  | "organization";

async function handleGET(request: NextRequest): Promise<NextResponse> {
  logger.debug(MODULE_NAME, "GET /api/summary request received", {
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    headers: Object.fromEntries(request.headers),
  });

  const session = (await getServerSession(
    authOptions,
  )) as unknown as SessionInfo;

  if (!session) {
    logger.warn(MODULE_NAME, "Unauthorized request - no valid session", {
      sessionExists: !!session,
    });

    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Get installation IDs using the centralized utility
  let installationIds = resolveMultipleInstallationIds({
    req: request,
    session,
    validateAgainstAvailable: false, // Will validate after fetching available installations
  });

  logger.debug(MODULE_NAME, "Resolved installation IDs", {
    count: installationIds.length,
    ids: installationIds,
  });

  // Get all available installations if we have an access token
  let allInstallations: AppInstallation[] = [];
  if (session.accessToken) {
    try {
      allInstallations = await getAllAppInstallations(session.accessToken);
      logger.info(MODULE_NAME, "Retrieved all GitHub App installations", {
        count: allInstallations.length,
        accounts: allInstallations
          .filter((i) => i.account)
          .map((i) => i.account?.login),
      });

      // Re-validate installation IDs against available installations
      const validatedInstallationIds = resolveMultipleInstallationIds({
        req: request,
        session,
        availableInstallations: allInstallations,
        validateAgainstAvailable: true,
        useFirstAvailableAsFallback: true,
      });

      logger.debug(
        MODULE_NAME,
        "Validated installation IDs against available installations",
        {
          originalCount: installationIds.length,
          validatedCount: validatedInstallationIds.length,
          validatedIds: validatedInstallationIds,
        },
      );

      // Use the validated IDs
      installationIds = validatedInstallationIds;
    } catch (error) {
      logger.warn(MODULE_NAME, "Error getting all GitHub App installations", {
        error,
      });
    }
  }

  // If we still have no installation IDs, try one more time with fallback enabled
  if (installationIds.length === 0 && allInstallations.length > 0) {
    installationIds = resolveMultipleInstallationIds({
      availableInstallations: allInstallations,
      useFirstAvailableAsFallback: true,
    });

    if (installationIds.length > 0) {
      logger.info(MODULE_NAME, "Using fallback installations", {
        count: installationIds.length,
        ids: installationIds,
      });
    }
  }

  // If we don't have either auth method, we can't proceed
  if (installationIds.length === 0 && !session.accessToken) {
    logger.warn(MODULE_NAME, "No authentication method available", {
      hasAccessToken: !!session.accessToken,
      hasInstallationIds: installationIds.length > 0,
    });

    return new NextResponse(
      JSON.stringify({
        error: "GitHub authentication required",
        needsInstallation: true,
        message: "Please install the GitHub App to access your repositories.",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  logger.info(MODULE_NAME, "Authenticated user requesting summary", {
    user: session.user?.email || session.user?.name || "unknown",
    authMethod: installationIds.length > 0 ? "GitHub App" : "OAuth",
    installationCount: installationIds.length,
  });

  // Define the expected type for the validated data
  type SummaryParams = {
    since: string;
    until: string;
    contributors?: string[];
    repositories?: string[];
    organizations?: string[];
    installation_ids?: number[];
    groupBy?: GroupBy;
  };

  // Define and validate query parameters schema
  const summaryParamsSchema = z.object({
    since: dateSchema,
    until: dateSchema,
    contributors: contributorsSchema,
    repositories: repositoriesSchema,
    organizations: organizationsSchema,
    groupBy: z
      .enum(["chronological", "repository", "contributor", "organization"])
      .optional(),
    installation_ids: z
      .string()
      .transform((val) =>
        val
          .split(",")
          .map((v) => parseInt(v.trim(), 10))
          .filter((id) => !isNaN(id)),
      )
      .optional(),
  });

  // Validate query parameters with type assertion
  const validationResult = validateQueryParams<SummaryParams>(
    request.nextUrl.searchParams,
    summaryParamsSchema as z.ZodType<SummaryParams>,
  );

  if (!validationResult.success) {
    logger.warn(MODULE_NAME, "Invalid query parameters", {
      error: validationResult.error,
      params: Object.fromEntries(request.nextUrl.searchParams.entries()),
    });

    return createApiErrorResponse(
      new Error(`Validation error: ${validationResult.error}`),
      { params: Object.fromEntries(request.nextUrl.searchParams.entries()) },
      MODULE_NAME,
    );
  }

  if (!validationResult.data) {
    logger.error(MODULE_NAME, "Validation result data is undefined");
    return createApiErrorResponse(
      new Error("Invalid parameters: validation result is undefined"),
      { params: Object.fromEntries(request.nextUrl.searchParams.entries()) },
      MODULE_NAME,
    );
  }

  // Extract validated parameters with defaults
  const since = validationResult.data.since;
  const until = validationResult.data.until;
  const contributors = validationResult.data.contributors || [];
  const repositoryFilters = validationResult.data.repositories || [];
  const organizations = validationResult.data.organizations || [];
  const validatedInstallationIds = validationResult.data.installation_ids;

  // Always use chronological view as we've standardized on it
  const groupBy: GroupBy = "chronological";

  // No longer need group summaries as we only use chronological view
  const generateGroupSummaries = false;

  logger.debug(MODULE_NAME, "Validated query parameters", {
    since,
    until,
    contributors,
    organizations,
    repositories: repositoryFilters,
    groupBy,
    generateGroupSummaries,
  });

  // If validated installation IDs are provided, override the ones parsed from the query
  if (validatedInstallationIds && validatedInstallationIds.length > 0) {
    installationIds = validatedInstallationIds;
    logger.debug(MODULE_NAME, "Using validated installation IDs", {
      installationIds,
    });
  }

  // Get Gemini API key from environment variable
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    logger.error(
      MODULE_NAME,
      "Missing Gemini API key in environment variables",
    );
    return new NextResponse(
      JSON.stringify({
        error: "Server configuration error: Missing Gemini API key",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // Fetch all repositories the user has access to
    logger.info(MODULE_NAME, "Fetching all accessible repos", {
      authMethod: installationIds.length > 0 ? "GitHub App" : "OAuth",
      installationCount: installationIds.length,
    });

    // Fetch repositories from all selected installations
    let allRepos = [];

    if (installationIds.length > 0) {
      // Create authenticated Octokit instances for each installation ID
      const repoPromises = await Promise.all(
        installationIds.map(async (id) => {
          // Create credentials for GitHub App authentication
          const credentials: GitHubCredentials = {
            type: "app",
            installationId: id,
          };

          // Create an authenticated Octokit instance
          const octokit = await createAuthenticatedOctokit(credentials);

          // Fetch repositories using the Octokit instance
          return fetchAppRepositories(octokit);
        }),
      );

      // Combine all repositories from all installations
      allRepos = repoPromises.flat();

      logger.debug(
        MODULE_NAME,
        "Fetched repositories from multiple installations",
        {
          installationCount: installationIds.length,
          totalRepoCount: allRepos.length,
        },
      );
    } else {
      // Create credentials for OAuth authentication
      const accessToken = session.accessToken as string;
      const credentials: GitHubCredentials = {
        type: "oauth",
        token: accessToken,
      };

      // Create an authenticated Octokit instance
      const octokit = await createAuthenticatedOctokit(credentials);

      // Fetch repositories using the Octokit instance
      allRepos = await fetchRepositories(octokit);
    }

    // Apply repository filters
    let filteredRepos = allRepos;

    // Apply organization filters if provided (deprecated but maintained for backward compatibility)
    if (organizations.length > 0) {
      // Note: Organization filtering is deprecated in the individual-focused MVP
      // but we still support it for backward compatibility with existing clients
      filteredRepos = filteredRepos.filter((repo) => {
        const ownerName = repo.full_name.split("/")[0];
        return organizations.includes(ownerName);
      });

      logger.debug(MODULE_NAME, "Applied deprecated organization filters", {
        originalCount: allRepos.length,
        filteredCount: filteredRepos.length,
        organizations,
        note: "Organization filtering is deprecated in the individual-focused MVP",
      });
    }

    if (repositoryFilters.length > 0) {
      filteredRepos = filteredRepos.filter((repo) =>
        repositoryFilters.includes(repo.full_name),
      );

      logger.debug(MODULE_NAME, "Applied repository filters", {
        originalCount: allRepos.length,
        filteredCount: filteredRepos.length,
        repositoryFilters,
      });
    }

    const reposToAnalyze = filteredRepos.map((repo) => repo.full_name);

    logger.debug(MODULE_NAME, "Repositories to analyze after filtering", {
      count: reposToAnalyze.length,
    });

    if (reposToAnalyze.length === 0) {
      logger.warn(MODULE_NAME, "No repositories match the filter criteria");
      return new NextResponse(
        JSON.stringify({
          error: "No repositories match the specified filters",
          filterInfo: {
            // Organizations filtering is deprecated but included for backward compatibility
            organizations: organizations.length > 0 ? organizations : null,
            repositories:
              repositoryFilters.length > 0 ? repositoryFilters : null,
            contributors: contributors.length > 0 ? contributors : null,
            dateRange: { since, until },
          },
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const requestStartTime = Date.now();
    const commitFetchStartTime = Date.now();

    // Determine author filter
    let authorFilter: string | undefined = undefined;

    // If contributors has exactly one entry and it's 'me' or matches the session user,
    // set authorFilter to the current user
    if (contributors.length === 1) {
      if (contributors[0] === "me" || contributors[0] === session.user?.name) {
        authorFilter = session.user?.name || undefined;
        logger.debug(MODULE_NAME, "Filtering for current user's commits", {
          authorFilter,
        });
      } else {
        // Filter for specific contributor
        authorFilter = contributors[0];
        logger.debug(MODULE_NAME, "Filtering for specific contributor", {
          authorFilter,
        });
      }
    }

    logger.debug(MODULE_NAME, "Fetching commits with filters", {
      authorFilter,
      repoCount: reposToAnalyze.length,
      dateRange: { since, until },
    });

    // For each unique organization in reposToAnalyze, find the corresponding installation ID
    const orgToInstallationMap = new Map<string, number>();

    if (installationIds.length > 0) {
      reposToAnalyze.forEach((repoFullName) => {
        const orgName = repoFullName.split("/")[0];

        // Find an installation for this org if we don't already have one mapped
        if (!orgToInstallationMap.has(orgName)) {
          const matchingInstallation = allInstallations.find(
            (inst) =>
              inst.account?.login === orgName &&
              installationIds.includes(inst.id),
          );

          if (matchingInstallation) {
            orgToInstallationMap.set(orgName, matchingInstallation.id);
          }
        }
      });

      logger.debug(
        MODULE_NAME,
        "Created organization to installation mapping",
        {
          mappingCount: orgToInstallationMap.size,
          orgsWithInstallations: Array.from(orgToInstallationMap.keys()),
        },
      );
    }

    // Group repositories by installation ID for efficient fetching
    const reposByInstallation: Record<string, string[]> = {};

    // Initialize with a default key for OAuth
    reposByInstallation["oauth"] = [];

    reposToAnalyze.forEach((repoFullName) => {
      const orgName = repoFullName.split("/")[0];
      const installationId = orgToInstallationMap.get(orgName);

      if (installationId) {
        // Use the installation ID as the key
        const key = installationId.toString();
        if (!reposByInstallation[key]) {
          reposByInstallation[key] = [];
        }
        reposByInstallation[key].push(repoFullName);
      } else {
        // No installation found for this org, use OAuth
        reposByInstallation["oauth"].push(repoFullName);
      }
    });

    logger.debug(
      MODULE_NAME,
      "Grouped repositories by installation for fetching",
      {
        installationGroups: Object.keys(reposByInstallation).length,
        reposCounts: Object.fromEntries(
          Object.entries(reposByInstallation).map(([key, repos]) => [
            key,
            repos.length,
          ]),
        ),
      },
    );

    // Fetch commits from all installation groups in parallel
    const commitFetchPromises = [];

    // For each installation ID group
    for (const [key, repos] of Object.entries(reposByInstallation)) {
      if (repos.length === 0) continue;

      if (key === "oauth") {
        // Fetch with OAuth if the user has an access token
        if (session.accessToken) {
          // Create credentials for OAuth authentication
          const accessToken = session.accessToken as string;
          const credentials: GitHubCredentials = {
            type: "oauth",
            token: accessToken,
          };

          // Create an authenticated Octokit instance
          const octokit = await createAuthenticatedOctokit(credentials);

          // Fetch commits using the Octokit instance
          commitFetchPromises.push(
            fetchCommitsForRepositoriesWithOctokit(
              octokit,
              repos,
              since,
              until,
              authorFilter,
            ),
          );
        }
      } else {
        // Fetch with installation ID
        const installationId = parseInt(key, 10);

        // Create credentials for GitHub App authentication
        const credentials: GitHubCredentials = { type: "app", installationId };

        // Create an authenticated Octokit instance
        const octokit = await createAuthenticatedOctokit(credentials);

        // Fetch commits using the Octokit instance
        commitFetchPromises.push(
          fetchCommitsForRepositoriesWithOctokit(
            octokit,
            repos,
            since,
            until,
            authorFilter,
          ),
        );
      }
    }

    // Wait for all commit fetching to complete
    const commitResults = await Promise.all(commitFetchPromises);

    // Combine all commits
    const commits = commitResults.flat();

    const commitFetchEndTime = Date.now();

    logger.info(MODULE_NAME, "Fetched commits", {
      commitCount: commits.length,
      timeMs: commitFetchEndTime - commitFetchStartTime,
    });

    // Filter commits by contributor if needed
    let filteredCommits = commits;

    if (
      contributors.length > 0 &&
      !(
        contributors.length === 1 &&
        (contributors[0] === "me" || contributors[0] === session.user?.name)
      )
    ) {
      // Filtering for multiple contributors or a single contributor that isn't 'me'
      filteredCommits = commits.filter((commit) => {
        const commitAuthor = commit.author?.login || commit.commit.author?.name;
        return (
          contributors.includes(commitAuthor || "") ||
          (contributors.includes("me") && commitAuthor === session.user?.name)
        );
      });

      logger.debug(MODULE_NAME, "Applied contributor filters", {
        originalCount: commits.length,
        filteredCount: filteredCommits.length,
        contributors,
      });
    }

    // Always use chronological view (no grouping)
    // Simplified grouping for chronological view only
    const groupedResults: GroupedResult[] = [
      {
        groupKey: "all",
        groupName: "All Commits",
        commitCount: filteredCommits.length,
        repositories: [
          ...new Set(filteredCommits.map((c) => c.repository?.full_name || "")),
        ],
        dates: [
          ...new Set(
            filteredCommits.map(
              (c) => c.commit.author?.date?.split("T")[0] || "",
            ),
          ),
        ],
        commits: filteredCommits,
        // AI summary will be added later
      },
    ];

    // Generate overall AI summary only (no group summaries since we only use chronological view)
    logger.debug(MODULE_NAME, "Generating AI summary", {
      generateOverallSummary: true,
    });

    // Generate overall summary
    const aiSummaryStartTime = Date.now();
    let overallSummary = null;

    if (filteredCommits.length > 0) {
      overallSummary = await generateCommitSummary(
        filteredCommits,
        geminiApiKey,
      );
      logger.info(MODULE_NAME, "Generated overall AI summary", {
        timeMs: Date.now() - aiSummaryStartTime,
        keyThemes: overallSummary?.keyThemes?.length || 0,
        technicalAreas: overallSummary?.technicalAreas?.length || 0,
      });
    }

    // Generate basic overall stats
    const overallStats = generateBasicStats(filteredCommits);

    const totalTime = Date.now() - requestStartTime;
    logger.info(
      MODULE_NAME,
      "Completed summary request with filtering and grouping",
      {
        totalTimeMs: totalTime,
        commitCount: filteredCommits.length,
        groupCount: groupedResults.length,
        groupBy,
      },
    );

    // Prepare the response with all the data
    return NextResponse.json({
      user: session.user?.name,
      // Legacy fields for backward compatibility
      commits: filteredCommits,
      stats: overallStats,
      aiSummary: overallSummary,
      // Filter information
      filterInfo: {
        contributors: contributors.length > 0 ? contributors : null,
        // Organizations field is deprecated in the individual-focused MVP
        // but included for backward compatibility
        organizations: organizations.length > 0 ? organizations : null,
        repositories: repositoryFilters.length > 0 ? repositoryFilters : null,
        dateRange: { since, until },
      },
      groupedResults,
      // Authentication and installation info
      authMethod: installationIds.length > 0 ? "github_app" : "oauth",
      installationIds: installationIds.length > 0 ? installationIds : null,
      installations: allInstallations,
      currentInstallations:
        installationIds.length > 0
          ? allInstallations.filter((i) => installationIds.includes(i.id))
          : [],
    });
  } catch (error) {
    logger.error(MODULE_NAME, "Error generating summary", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check what kind of error we have
    const errorObj = (error as { name?: string; message?: string }) || {};
    const errorName = errorObj.name || "";
    const errorMsg = errorObj.message || "";

    const isAuthError =
      errorName === "HttpError" &&
      (errorMsg.includes("credentials") || errorMsg.includes("authentication"));

    const isAppError = errorMsg.includes(
      "GitHub App credentials not configured",
    );

    const errorMessage = isAppError
      ? "GitHub App not properly configured. Please contact the administrator."
      : isAuthError
        ? "GitHub authentication failed. Your authentication is invalid or expired."
        : "Failed to generate summary";

    const errorCode = isAppError
      ? "GITHUB_APP_CONFIG_ERROR"
      : isAuthError
        ? "GITHUB_AUTH_ERROR"
        : "API_ERROR";

    return new NextResponse(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        code: errorCode,
      }),
      {
        status: isAuthError || isAppError ? 403 : 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

function generateBasicStats(commits: Commit[]) {
  logger.debug(MODULE_NAME, "Generating basic stats", {
    commitCount: commits.length,
  });

  // Generate basic statistics about the commits
  const stats = {
    totalCommits: commits.length,
    repositories: [
      ...new Set(
        commits.map(
          (commit) =>
            commit.repository?.full_name ||
            commit.html_url.split("/").slice(3, 5).join("/"),
        ),
      ),
    ],
    dates: [
      ...new Set(
        commits.map(
          (commit) => commit.commit.author?.date?.split("T")[0] || "",
        ),
      ),
    ],
  };

  logger.debug(MODULE_NAME, "Basic stats generated", {
    totalCommits: stats.totalCommits,
    uniqueRepos: stats.repositories.length,
    uniqueDates: stats.dates.length,
  });

  return stats;
}

// Wrap the handler with standardized error handling
export const GET = withErrorHandling(handleGET, MODULE_NAME);
