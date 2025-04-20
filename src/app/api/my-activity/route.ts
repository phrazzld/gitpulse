import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { safelyExtractError } from "@/lib/errors";
import { SessionInfo } from "@/types/api";
import {
  fetchAllRepositories,
  fetchRepositories,
  fetchAppRepositories,
  fetchCommitsForRepositories,
  fetchCommitsForRepositoriesWithOctokit,
  Commit,
  Repository,
} from "@/lib/githubData";
import {
  createAuthenticatedOctokit,
  GitHubCredentials,
  AppInstallation,
} from "@/lib/auth/githubAuth";
import { logger } from "@/lib/logger";
import {
  optimizedJsonResponse,
  generateETag,
  isCacheValid,
  notModifiedResponse,
  CacheTTL,
  generateCacheKey,
} from "@/lib/cache";
import {
  optimizeCommit,
  optimizeRepository,
  MinimalCommit,
  MinimalRepository,
} from "@/lib/optimize";
import {
  withErrorHandling,
  createApiErrorResponse,
} from "@/lib/auth/apiErrorHandler";
import { z } from "zod";
import {
  dateSchema,
  cursorSchema,
  limitSchema,
  validateQueryParams,
} from "@/lib/validation";

const MODULE_NAME = "api:my-activity";

// Response type for my-activity endpoint
type MyActivityResponse = {
  commits: MinimalCommit[];
  stats: {
    totalCommits: number;
    repositories: string[];
    dates: string[];
  };
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
  user: string;
  dateRange: {
    since: string;
    until: string;
  };
  error?: string;
  code?: string;
};

async function handleGET(request: NextRequest): Promise<NextResponse> {
  logger.debug(MODULE_NAME, "GET /api/my-activity request received", {
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    headers: Object.fromEntries(request.headers),
  });

  const session = (await getServerSession(
    authOptions,
  )) as unknown as SessionInfo;

  if (!session || !session.user) {
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

  // Validate query parameters
  const activityParamsSchema = z.object({
    since: dateSchema.optional(),
    until: dateSchema.optional(),
    cursor: cursorSchema,
    limit: limitSchema.optional(),
  });

  const validationResult = validateQueryParams(
    request.nextUrl.searchParams,
    activityParamsSchema,
  );

  if (!validationResult.success) {
    logger.warn(MODULE_NAME, "Invalid query parameters", {
      error: validationResult.error,
    });

    return createApiErrorResponse(
      new Error(`Validation error: ${validationResult.error}`),
      { params: Object.fromEntries(request.nextUrl.searchParams.entries()) },
      MODULE_NAME,
    );
  }

  // Get validated date range parameters
  const since = validationResult.data?.since || getDefaultSince();
  const until = validationResult.data?.until || getDefaultUntil();

  // Get validated cursor for pagination
  const cursor = validationResult.data?.cursor || null;
  const limit = validationResult.data?.limit || 50;

  try {
    // Get the authenticated user's info
    const userEmail = session.user.email;
    const userName = session.user.name;
    const userLogin = getUserLoginFromSession(session);

    logger.info(MODULE_NAME, "Fetching commits for authenticated user", {
      user: userName || userEmail,
      dateRange: { since, until },
      cursor,
      limit,
    });

    // We'll use the access token from the session and/or installation ID
    const accessToken = session.accessToken as string;
    const installationId = session.installationId as number;

    if (!accessToken && !installationId) {
      logger.error(MODULE_NAME, "No authentication method available", {
        hasAccessToken: !!accessToken,
        hasInstallationId: !!installationId,
      });

      return new NextResponse(
        JSON.stringify({
          error: "GitHub authentication required. Please sign in again.",
          code: "GITHUB_AUTH_ERROR",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Create credentials object for authentication
    const credentials: GitHubCredentials = installationId
      ? { type: "app", installationId }
      : { type: "oauth", token: accessToken };

    // Create an authenticated Octokit instance
    const octokit = await createAuthenticatedOctokit(credentials);

    // Fetch all repositories accessible to the user
    let repositories: Repository[] = [];
    try {
      // Fetch repositories based on the authentication method
      repositories = installationId
        ? await fetchAppRepositories(octokit)
        : await fetchRepositories(octokit);
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : { message: String(error) };
      logger.error(MODULE_NAME, "Error fetching repositories", {
        error: errorObj,
      });

      return new NextResponse(
        JSON.stringify({
          error:
            "Error fetching repositories: " +
            (error instanceof Error ? error.message : String(error)),
          code: "GITHUB_REPO_ERROR",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Get repository full names for fetching commits
    const repoFullNames = repositories.map((repo) => repo.full_name);

    // Fetch commits for all repositories
    let allCommits: Commit[] = [];
    try {
      // Use the new function with the authenticated Octokit instance
      allCommits = await fetchCommitsForRepositoriesWithOctokit(
        octokit,
        repoFullNames,
        since,
        until,
        userLogin, // Only fetch commits by the current user
      );
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : { message: String(error) };
      logger.error(MODULE_NAME, "Error fetching commits", { error: errorObj });

      return new NextResponse(
        JSON.stringify({
          error:
            "Error fetching commits: " +
            (error instanceof Error ? error.message : String(error)),
          code: "GITHUB_COMMIT_ERROR",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Optimize commits to reduce payload size
    const optimizedCommits = allCommits.map((commit) => optimizeCommit(commit));

    // Apply pagination using cursor
    const { pagedCommits, hasMore, nextCursor } = applyPagination(
      optimizedCommits,
      cursor,
      limit,
    );

    // Extract stats
    const stats = {
      totalCommits: allCommits.length,
      repositories: [
        ...new Set(
          allCommits.map((commit) => commit.repository?.full_name || ""),
        ),
      ],
      dates: [
        ...new Set(
          allCommits.map(
            (commit) => commit.commit.author?.date?.split("T")[0] || "",
          ),
        ),
      ],
    };

    // Construct the response
    const response: MyActivityResponse = {
      commits: pagedCommits,
      stats,
      pagination: {
        hasMore,
        ...(nextCursor && { nextCursor }),
      },
      user: userName || userEmail || "Unknown",
      dateRange: {
        since,
        until,
      },
    };

    logger.info(MODULE_NAME, "Successfully fetched user's activity", {
      totalCommits: allCommits.length,
      returnedCommits: pagedCommits.length,
      hasMore,
      repositories: stats.repositories.length,
    });

    // Create cache parameters for ETag generation
    const cacheParams = {
      user: userName || userEmail || "unknown",
      since,
      until,
      cursor,
      limit,
      commitCount: pagedCommits.length,
      totalCommits: allCommits.length,
      timestamp: Date.now(),
    };

    // Generate cache key and ETag
    const cacheKey = generateCacheKey(cacheParams, "my-activity");
    const etag = generateETag(cacheParams);

    // Check if client has valid cached data
    if (isCacheValid(request, etag)) {
      return notModifiedResponse(etag);
    }

    // Return the optimized and compressed response with cache headers
    return await optimizedJsonResponse(request, response, 200, {
      etag,
      maxAge: CacheTTL.SHORT, // Cache for 1 minute
      compress: true,
    });
  } catch (error: unknown) {
    const errorObj =
      error instanceof Error ? error : { message: String(error) };
    logger.error(MODULE_NAME, "Unexpected error processing request", {
      error: errorObj,
    });

    return await optimizedJsonResponse(
      request,
      {
        error:
          "An unexpected error occurred: " +
          (error instanceof Error ? error.message : String(error)),
        code: "UNEXPECTED_ERROR",
      },
      500,
    );
  }
}

// Wrap the handler with standardized error handling
export const GET = withErrorHandling(handleGET, MODULE_NAME);

// Helper function to get a default "since" date (30 days ago)
function getDefaultSince(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split("T")[0];
}

// Helper function to get default "until" date (today)
function getDefaultUntil(): string {
  return new Date().toISOString().split("T")[0];
}

// We now import generateETag from cache.ts

// Helper to extract user login from session
function getUserLoginFromSession(session: SessionInfo): string | undefined {
  if (session.profile?.login) {
    return session.profile.login;
  }

  // Fallback to username or email if login not available
  return session.user?.name || session.user?.email?.split("@")[0];
}

// Helper to apply cursor-based pagination
function applyPagination<T extends { sha: string }>(
  commits: T[],
  cursor: string | null,
  limit: number,
): {
  pagedCommits: T[];
  hasMore: boolean;
  nextCursor?: string;
} {
  if (commits.length === 0) {
    return { pagedCommits: [], hasMore: false };
  }

  // If we have a cursor, find its position
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = commits.findIndex((commit) => commit.sha === cursor);
    startIndex = cursorIndex !== -1 ? cursorIndex + 1 : 0;
  }

  // Get the page of commits
  const endIndex = Math.min(startIndex + limit, commits.length);
  const pagedCommits = commits.slice(startIndex, endIndex);

  // Check if there are more commits
  const hasMore = endIndex < commits.length;

  // Set the next cursor if there are more commits
  const nextCursor = hasMore ? commits[endIndex - 1].sha : undefined;

  return {
    pagedCommits,
    hasMore,
    nextCursor,
  };
}
