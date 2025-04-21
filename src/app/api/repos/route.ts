import { NextRequest, NextResponse } from "next/server";
import {
  fetchRepositories,
  fetchAppRepositories,
  Repository,
} from "@/lib/githubData";
import {
  getAllAppInstallations,
  AppInstallation,
  createAuthenticatedOctokit,
  GitHubCredentials,
} from "@/lib/auth/githubAuth";
import { logger } from "@/lib/logger";
import {
  generateETag,
  isCacheValid,
  notModifiedResponse,
  cachedJsonResponse,
  CacheTTL,
  generateCacheControl,
  generateCacheKey,
} from "@/lib/cache";
import { withAuthValidation, ApiRouteHandler } from "@/lib/auth/apiAuth";
import { SessionInfo } from "@/types/api";
import { z } from "zod";
import { validateQueryParams } from "@/lib/validation";
import { resolveInstallationId } from "@/lib/auth/installationHelper";
import {
  withErrorHandling,
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/auth/apiErrorHandler";

const MODULE_NAME = "api:repos";

// Define a type for the optimized repository metadata
type OptimizedRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  language: string | null;
};

// Function to extract only the necessary repository fields
function optimizeRepositoryData(repo: Repository): OptimizedRepository {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner: {
      login: repo.owner.login,
    },
    private: repo.private,
    language: repo.language || null,
  };
}

async function handleGetRepositories(
  request: NextRequest,
  session: SessionInfo,
) {
  logger.debug(MODULE_NAME, "GET /api/repos request received", {
    url: request.url,
    // Sanitize headers by only including non-sensitive ones
    headers: {
      host: request.headers.get("host") || "",
      referer: request.headers.get("referer") || "",
      "user-agent": request.headers.get("user-agent") || "",
      "content-type": request.headers.get("content-type") || "",
      accept: request.headers.get("accept") || "",
      "has-authorization": request.headers.has("authorization")
        ? "true"
        : "false",
      "has-cookie": request.headers.has("cookie") ? "true" : "false",
    },
  });

  // Resolve installation ID from request, session, and cookies
  const installationResult = resolveInstallationId({
    req: request,
    session,
    availableInstallations: [], // Will fetch installations later
    validateAgainstAvailable: false, // Will validate after fetching installations
  });

  let installationId = installationResult.isValid
    ? installationResult.id
    : session.installationId;

  logger.debug(MODULE_NAME, "Resolved installation ID", {
    source: installationResult.source,
    isValid: installationResult.isValid,
    hasId: !!installationId,
  });

  // Create cache key parameters
  const cacheParams = {
    user: session.user?.email || "unknown",
    installationId: installationId || "oauth",
    timestamp: Math.floor((Date.now() / CacheTTL.LONG) * 1000), // Cache busts every 1 hour
  };

  // Generate consistent cache key and ETag
  const cacheKey = generateCacheKey(cacheParams, "repos");
  const etag = generateETag(cacheParams);

  // Check if client has a valid cached response
  if (isCacheValid(request, etag)) {
    logger.info(
      MODULE_NAME,
      "Returning 304 Not Modified - client has current data",
      {
        cacheKey,
        etag,
      },
    );

    return notModifiedResponse(
      etag,
      generateCacheControl(CacheTTL.LONG, CacheTTL.LONG * 2),
    );
  }

  // Get all available installations if we have an access token
  let allInstallations: AppInstallation[] = [];
  if (session.accessToken) {
    try {
      allInstallations = await getAllAppInstallations(session.accessToken);
      logger.info(MODULE_NAME, "Retrieved all GitHub App installations", {
        count: allInstallations.length,
        // Don't log actual account names, just account count
        accountCount: allInstallations.filter((i) => i.account).length,
      });

      // Now that we have fetched all installations, validate the installation ID against them
      const validatedInstallationResult = resolveInstallationId({
        req: request,
        session,
        availableInstallations: allInstallations,
        validateAgainstAvailable: true,
        useFirstAvailableAsFallback: true,
      });

      // Use the validated installation ID if it's valid
      if (
        validatedInstallationResult.isValid &&
        validatedInstallationResult.id
      ) {
        installationId = validatedInstallationResult.id;
        logger.info(MODULE_NAME, "Using validated installation ID", {
          installationId,
          source: validatedInstallationResult.source,
        });
      }
    } catch (error) {
      logger.warn(MODULE_NAME, "Error getting all GitHub App installations", {
        error,
      });
    }
  }

  // If we still don't have an installation ID after checking all sources,
  // attempt one final resolution with useFirstAvailableAsFallback
  if (!installationId && allInstallations.length > 0) {
    const fallbackResult = resolveInstallationId({
      availableInstallations: allInstallations,
      useFirstAvailableAsFallback: true,
    });

    if (fallbackResult.isValid && fallbackResult.id) {
      installationId = fallbackResult.id;
      logger.info(MODULE_NAME, "Using fallback installation ID", {
        source: fallbackResult.source,
        installationId,
      });
    }
  }

  // If we don't have either auth method, we can't proceed
  if (!installationId && !session.accessToken) {
    logger.warn(MODULE_NAME, "No authentication method available", {
      hasAccessToken: !!session.accessToken,
      hasInstallationId: !!installationId,
    });

    const error = new Error(
      "GitHub authentication required. Please install the GitHub App to access your repositories.",
    );
    error.name = "GitHubAuthError";
    throw error;
  }

  logger.info(MODULE_NAME, "Authenticated user requesting repositories", {
    // Only log that there is a user, not the specific user identity
    userAuthenticated: !!session.user,
    authMethod: installationId ? "GitHub App" : "OAuth",
  });

  try {
    logger.debug(MODULE_NAME, "Fetching all user repositories");
    const startTime = Date.now();

    // Create credentials object for authentication
    const credentials: GitHubCredentials = installationId
      ? { type: "app", installationId }
      : { type: "oauth", token: session.accessToken ?? "" };

    // Log authentication method being used
    if (installationId) {
      logger.debug(MODULE_NAME, "Using GitHub App installation", {
        installationId,
      });
    } else if (session.accessToken) {
      // Only log that we have a token, not any details about it
      logger.debug(MODULE_NAME, "Using GitHub access token", {
        hasToken: true,
      });
    }

    // Create an authenticated Octokit instance
    const octokit = await createAuthenticatedOctokit(credentials);

    // Call the appropriate repository fetching function with the authenticated Octokit instance
    const rawRepositories = installationId
      ? await fetchAppRepositories(octokit)
      : await fetchRepositories(octokit);

    // Optimize the repository data by extracting only necessary fields
    const repositories = rawRepositories.map(optimizeRepositoryData);

    const endTime = Date.now();

    // Group repositories by owner (could be user or organization)
    // Note: While organization features are not actively used in the individual-focused MVP,
    // we still track repository ownership for logging and diagnostics
    const reposByOwner = repositories.reduce(
      (acc, repo) => {
        const ownerName = repo.full_name.split("/")[0];
        if (!acc[ownerName]) {
          acc[ownerName] = [];
        }
        acc[ownerName].push(repo.full_name);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    // Compute owner-level statistics
    const ownerStats = Object.entries(reposByOwner).map(([owner, repos]) => ({
      owner,
      repoCount: repos.length,
      repoNames: repos,
    }));

    // Log detailed repository information
    logger.info(MODULE_NAME, "Successfully fetched repositories", {
      count: repositories.length,
      timeMs: endTime - startTime,
      languages: Array.from(
        new Set(repositories.map((repo) => repo.language).filter(Boolean)),
      ),
      private: repositories.filter((repo) => repo.private).length,
      public: repositories.filter((repo) => !repo.private).length,
      ownerCount: Object.keys(reposByOwner).length,
      ownerSummary: ownerStats.map(
        (stat) => `${stat.owner}: ${stat.repoCount} repos`,
      ),
      authMethod: installationId ? "GitHub App" : "OAuth",
    });

    // Log additional debugging info for troubleshooting
    logger.debug(MODULE_NAME, "Repository fetch details", {
      fetchTimeMs: endTime - startTime,
      // Don't log actual user info, just that we have a user
      hasUser: !!session.user,
      ownerCount: ownerStats.length,
    });

    // Create response object
    const responseData = {
      repositories,
      authMethod: installationId ? "github_app" : "oauth",
      installationId: installationId || null,
      installationIds: installationId ? [installationId] : [],
      installations: allInstallations,
      currentInstallation: allInstallations.find(
        (i) => i.id === installationId,
      ),
      currentInstallations: installationId
        ? allInstallations.filter((i) => i.id === installationId)
        : [],
    };

    // Return cached JSON response with appropriate headers
    return createApiSuccessResponse(responseData, 200, {
      etag,
      maxAge: CacheTTL.LONG, // Cache for 1 hour
      staleWhileRevalidate: CacheTTL.LONG * 2, // Allow stale content for 2 hours while revalidating
    });
  } catch (error) {
    // The error will be caught and handled by the withErrorHandling wrapper
    throw error;
  }
}

// Export the authenticated handler with standardized error handling
// First apply auth validation, then wrap with error handling
const authenticatedHandler = withAuthValidation(
  handleGetRepositories as ApiRouteHandler,
);
export const GET = withErrorHandling(authenticatedHandler, MODULE_NAME);
