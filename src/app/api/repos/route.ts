import { NextRequest, NextResponse } from "next/server";
import { fetchRepositories, fetchAppRepositories, Repository } from "@/lib/githubData";
import { getAllAppInstallations, AppInstallation, createAuthenticatedOctokit, GitHubCredentials } from "@/lib/auth/githubAuth";
import { logger } from "@/lib/logger";
import { generateETag, isCacheValid, notModifiedResponse, cachedJsonResponse, CacheTTL, generateCacheControl, generateCacheKey } from "@/lib/cache";
import { withAuthValidation } from "@/lib/auth/apiAuth";

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
      login: repo.owner.login
    },
    private: repo.private,
    language: repo.language || null
  };
}

async function handleGetRepositories(request: NextRequest, session: any) {
  logger.debug(MODULE_NAME, "GET /api/repos request received", { 
    url: request.url,
    headers: Object.fromEntries([...request.headers.entries()])
  });
  
  // Get installation ID from query parameter if present
  let requestedInstallationId = request.nextUrl.searchParams.get('installation_id');
  let installationId = requestedInstallationId ? parseInt(requestedInstallationId, 10) : session.installationId;
  
  // Create cache key parameters
  const cacheParams = {
    user: session.user?.email || 'unknown',
    installationId: installationId || 'oauth',
    timestamp: Math.floor(Date.now() / CacheTTL.LONG * 1000) // Cache busts every 1 hour
  };
  
  // Generate consistent cache key and ETag
  const cacheKey = generateCacheKey(cacheParams, 'repos');
  const etag = generateETag(cacheParams);
  
  // Check if client has a valid cached response
  if (isCacheValid(request, etag)) {
    logger.info(MODULE_NAME, "Returning 304 Not Modified - client has current data", {
      cacheKey,
      etag
    });
    
    return notModifiedResponse(etag, generateCacheControl(CacheTTL.LONG, CacheTTL.LONG * 2));
  }
  
  // Get all available installations if we have an access token
  let allInstallations: AppInstallation[] = [];
  if (session.accessToken) {
    try {
      allInstallations = await getAllAppInstallations(session.accessToken);
      logger.info(MODULE_NAME, "Retrieved all GitHub App installations", {
        count: allInstallations.length,
        accounts: allInstallations.filter(i => i.account).map(i => i.account?.login)
      });
      
      // If we don't have an installation ID yet, use the first available installation
      if (!installationId && allInstallations.length > 0) {
        installationId = allInstallations[0].id;
        logger.info(MODULE_NAME, "Using first available installation", {
          installationId,
          account: allInstallations[0].account?.login || 'unknown'
        });
      }
      
      // Validate that the requested installation ID is in our list
      if (requestedInstallationId && allInstallations.length > 0) {
        const parsedId = parseInt(requestedInstallationId, 10);
        const validInstallation = allInstallations.find(
          inst => inst.id === parsedId
        );
        
        if (!validInstallation) {
          logger.warn(MODULE_NAME, "Requested installation ID not found in user's installations", {
            requestedId: requestedInstallationId,
            availableIds: allInstallations.map(i => i.id)
          });
          // Fallback to the first available installation
          installationId = allInstallations[0].id;
        }
      }
    } catch (error) {
      logger.warn(MODULE_NAME, "Error getting all GitHub App installations", { error });
    }
  }
  
  // Also check for installation ID in cookies if we still don't have one
  if (!installationId) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader && cookieHeader.includes('github_installation_id=')) {
      const match = cookieHeader.match(/github_installation_id=([^;]+)/);
      if (match && match[1]) {
        installationId = parseInt(match[1], 10);
        logger.info(MODULE_NAME, "Found installation ID in cookie", { installationId });
      }
    }
  }
  
  // If we don't have either auth method, we can't proceed
  if (!installationId && !session.accessToken) {
    logger.warn(MODULE_NAME, "No authentication method available", {
      hasAccessToken: !!session.accessToken,
      hasInstallationId: !!installationId
    });
    
    return cachedJsonResponse({ 
      error: "GitHub authentication required",
      needsInstallation: true,
      message: "Please install the GitHub App to access your repositories."
    }, 403);
  }
  
  logger.info(MODULE_NAME, "Authenticated user requesting repositories", { 
    user: session.user?.email || session.user?.name || 'unknown',
    authMethod: installationId ? "GitHub App" : "OAuth"
  });

  try {
    logger.debug(MODULE_NAME, "Fetching all user repositories");
    const startTime = Date.now();
    
    // Create credentials object for authentication
    const credentials: GitHubCredentials = installationId
      ? { type: 'app', installationId }
      : { type: 'oauth', token: session.accessToken };
    
    // Log authentication method being used
    if (installationId) {
      logger.debug(MODULE_NAME, "Using GitHub App installation", { installationId });
    } else if (session.accessToken) {
      // Log GitHub token info (safely)
      const tokenInfo = {
        length: session.accessToken?.length,
        prefix: session.accessToken?.substring(0, 4) + '...',
      };
      logger.debug(MODULE_NAME, "Using GitHub access token", tokenInfo);
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
    
    // Group repositories by organization
    const orgRepos = repositories.reduce((acc, repo) => {
      const orgName = repo.full_name.split('/')[0];
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push(repo.full_name);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Compute organization-level statistics
    const orgStats = Object.entries(orgRepos).map(([org, repos]) => ({
      organization: org,
      repoCount: repos.length,
      repoNames: repos,
    }));
    
    // Log detailed repository information
    logger.info(MODULE_NAME, "Successfully fetched repositories", { 
      count: repositories.length,
      timeMs: endTime - startTime,
      languages: Array.from(new Set(repositories.map(repo => repo.language).filter(Boolean))),
      private: repositories.filter(repo => repo.private).length,
      public: repositories.filter(repo => !repo.private).length,
      organizationCount: Object.keys(orgRepos).length,
      organizationSummary: orgStats.map(stat => `${stat.organization}: ${stat.repoCount} repos`),
      authMethod: installationId ? "GitHub App" : "OAuth"
    });
    
    // Log additional debugging info for troubleshooting
    logger.debug(MODULE_NAME, "Repository fetch details", {
      fetchTimeMs: endTime - startTime,
      userInfo: {
        name: session.user?.name,
        email: session.user?.email,
      },
      organizationDetails: orgStats
    });

    // Create response object
    const responseData = {
      repositories,
      authMethod: installationId ? "github_app" : "oauth",
      installationId: installationId || null,
      installationIds: installationId ? [installationId] : [],
      installations: allInstallations,
      currentInstallation: allInstallations.find(i => i.id === installationId),
      currentInstallations: installationId 
        ? allInstallations.filter(i => i.id === installationId) 
        : []
    };

    // Return cached JSON response with appropriate headers
    return cachedJsonResponse(responseData, 200, {
      etag,
      maxAge: CacheTTL.LONG, // Cache for 1 hour
      staleWhileRevalidate: CacheTTL.LONG * 2 // Allow stale content for 2 hours while revalidating
    });
    
  } catch (error) {
    logger.error(MODULE_NAME, "Error fetching repositories", { error });
    
    // Import GitHubError classes directly in this file
    const { 
      GitHubAuthError, 
      GitHubConfigError, 
      GitHubRateLimitError, 
      GitHubNotFoundError,
      GitHubApiError,
      GitHubError 
    } = await import('@/lib/errors');
    
    let errorMessage = "Failed to fetch repositories";
    let errorCode = "API_ERROR";
    let statusCode = 500;
    let signOutRequired = false;
    let errorDetails = "";
    let needsInstallation = false;

    // Check for specific error types based on our custom error classes
    if (error instanceof GitHubConfigError) {
      errorMessage = "GitHub App not properly configured. Please contact the administrator.";
      errorCode = "GITHUB_APP_CONFIG_ERROR";
      statusCode = 500;
      errorDetails = error.message;
    } else if (error instanceof GitHubAuthError) {
      if (error.message.includes('scope')) {
        errorMessage = "Your GitHub token is missing required permissions. Please sign out and sign in again to grant access to your repositories.";
        errorCode = "GITHUB_SCOPE_ERROR";
      } else {
        errorMessage = "GitHub authentication failed. Your access token is invalid or expired.";
        errorCode = "GITHUB_AUTH_ERROR";
      }
      statusCode = 403; // Use 403 instead of 401 to prevent automatic browser redirects
      signOutRequired = true;
      errorDetails = error.message;
    } else if (error instanceof GitHubRateLimitError) {
      errorMessage = "GitHub API rate limit exceeded. Please try again later.";
      errorCode = "GITHUB_RATE_LIMIT_ERROR";
      statusCode = 429;
      // Add reset time if available
      const resetTime = error.resetTimestamp ? 
        new Date(error.resetTimestamp * 1000).toISOString() : 
        "unknown";
      errorDetails = `Rate limit exceeded. Reset at ${resetTime}`;
    } else if (error instanceof GitHubNotFoundError) {
      errorMessage = "GitHub resource not found.";
      errorCode = "GITHUB_NOT_FOUND_ERROR";
      statusCode = 404;
      errorDetails = error.message;
    } else if (error instanceof GitHubApiError) {
      errorMessage = "GitHub API error occurred.";
      errorCode = "GITHUB_API_ERROR";
      statusCode = error.status;
      errorDetails = error.message;
    } else {
      // For any other type of error, including generic GitHubError
      errorMessage = "Failed to fetch repositories";
      errorCode = "API_ERROR";
      statusCode = 500;
      errorDetails = error instanceof Error ? error.message : String(error);
    }
    
    // Use 403 for auth errors rather than 401 to prevent automatic browser redirects
    return cachedJsonResponse({ 
      error: errorMessage,
      details: errorDetails,
      code: errorCode,
      signOutRequired: signOutRequired,
      needsInstallation: needsInstallation
    }, statusCode);
  }
}

// Export the authenticated handler
export const GET = withAuthValidation(handleGetRepositories);