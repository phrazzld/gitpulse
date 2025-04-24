/**
 * API route for generating summaries of GitHub activity
 * 
 * This module handles HTTP requests, authentication, and parameter validation.
 * Core business logic is delegated to handler functions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { 
  getAllAppInstallations,
  fetchAllRepositories,
  AppInstallation
} from "@/lib/github";
import { logger } from "@/lib/logger";
import {
  filterRepositoriesByOrgAndRepoNames,
  mapRepositoriesToInstallations,
  fetchCommitsWithAuthMethod,
  filterCommitsByContributor,
  groupCommitsByFilter,
  generateSummaryData,
  prepareSummaryResponse
} from "./handlers";
import { FilterInfo, GroupBy } from "@/types/api";

const MODULE_NAME = "api:summary";

export async function GET(request: NextRequest) {
  logger.debug(MODULE_NAME, "GET /api/summary request received", { 
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    headers: Object.fromEntries(request.headers)
  });
  
  // 1. Authentication and Session Management
  const session = await getServerSession(authOptions);
  
  if (!session) {
    logger.warn(MODULE_NAME, "Unauthorized request - no valid session", { 
      sessionExists: !!session
    });
    
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  
  // 2. Request Parameter Parsing
  const searchParams = request.nextUrl.searchParams;
  
  // Installation IDs
  let requestedInstallationIds = searchParams.get('installation_ids');
  let installationIds: number[] = [];
  
  if (requestedInstallationIds) {
    // Parse comma-separated installation IDs
    installationIds = requestedInstallationIds
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));
      
    logger.debug(MODULE_NAME, "Parsed installation IDs from request", { installationIds });
  } else if (session.installationId) {
    // If no IDs provided but session has one, use that
    installationIds = [session.installationId];
  }
  
  // Date range parameters (required)
  const since = searchParams.get("since");
  const until = searchParams.get("until");
  
  // Filter parameters
  const contributorsParam = searchParams.get("contributors");
  const contributors = contributorsParam ? contributorsParam.split(",") : [];
  
  const organizationsParam = searchParams.get("organizations");
  const organizations = organizationsParam ? organizationsParam.split(",") : [];
  
  const repositoriesParam = searchParams.get("repositories");
  const repositoryFilters = repositoriesParam ? repositoriesParam.split(",") : [];
  
  // Always use chronological view as we've standardized on it
  const groupBy: GroupBy = 'chronological';
  
  // No longer need group summaries as we only use chronological view
  const generateGroupSummaries = false;
  
  logger.debug(MODULE_NAME, "Parsed query parameters", {
    since,
    until,
    contributors,
    organizations,
    repositories: repositoryFilters,
    groupBy,
    generateGroupSummaries
  });
  
  // 3. Validation
  if (!since || !until) {
    logger.warn(MODULE_NAME, "Missing required date parameters");
    return new NextResponse(JSON.stringify({ error: "Missing required parameters: since and until dates" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Verify Gemini API key
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    logger.error(MODULE_NAME, "Missing Gemini API key in environment variables");
    return new NextResponse(JSON.stringify({ error: "Server configuration error: Missing Gemini API key" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  
  try {
    // 4. GitHub App Installation Management
    // Get all available installations if we have an access token
    let allInstallations: AppInstallation[] = [];
    if (session.accessToken) {
      try {
        allInstallations = await getAllAppInstallations(session.accessToken);
        logger.info(MODULE_NAME, "Retrieved all GitHub App installations", {
          count: allInstallations.length,
          accounts: allInstallations.filter(i => i.account).map(i => i.account?.login)
        });
        
        // If we don't have any installation IDs yet, use the first available installation
        if (installationIds.length === 0 && allInstallations.length > 0) {
          installationIds = [allInstallations[0].id];
          logger.info(MODULE_NAME, "Using first available installation", {
            installationId: allInstallations[0].id,
            account: allInstallations[0].account?.login || 'unknown'
          });
        }
        
        // Validate that the requested installation IDs are in our list
        if (installationIds.length > 0 && allInstallations.length > 0) {
          // Filter to only valid installation IDs
          const validInstallationIds = installationIds.filter(id => 
            allInstallations.some(inst => inst.id === id)
          );
          
          // Log any invalid IDs that were filtered out
          const invalidIds = installationIds.filter(id => 
            !validInstallationIds.includes(id)
          );
          
          if (invalidIds.length > 0) {
            logger.warn(MODULE_NAME, "Some requested installation IDs not found in user's installations", {
              invalidIds,
              availableIds: allInstallations.map(i => i.id)
            });
          }
          
          // If none of the requested IDs are valid, fallback to the first available
          if (validInstallationIds.length === 0 && allInstallations.length > 0) {
            installationIds = [allInstallations[0].id];
            logger.warn(MODULE_NAME, "No valid installation IDs found, using default", {
              defaultId: allInstallations[0].id
            });
          } else {
            installationIds = validInstallationIds;
          }
        }
      } catch (error) {
        logger.warn(MODULE_NAME, "Error getting all GitHub App installations", { error });
      }
    }
    
    // Also check for installation ID in cookies if we don't have any
    if (installationIds.length === 0) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader && cookieHeader.includes('github_installation_id=')) {
        const match = cookieHeader.match(/github_installation_id=([^;]+)/);
        if (match && match[1]) {
          const cookieId = parseInt(match[1], 10);
          installationIds = [cookieId];
          logger.info(MODULE_NAME, "Found installation ID in cookie", { installationId: cookieId });
        }
      }
    }
    
    // If we don't have either auth method, we can't proceed
    if (installationIds.length === 0 && !session.accessToken) {
      logger.warn(MODULE_NAME, "No authentication method available", {
        hasAccessToken: !!session.accessToken,
        hasInstallationIds: installationIds.length > 0
      });
      
      return new NextResponse(JSON.stringify({ 
        error: "GitHub authentication required",
        needsInstallation: true,
        message: "Please install the GitHub App to access your repositories."
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    logger.info(MODULE_NAME, "Authenticated user requesting summary", { 
      user: session.user?.email || session.user?.name || 'unknown',
      authMethod: installationIds.length > 0 ? "GitHub App" : "OAuth",
      installationCount: installationIds.length
    });
    
    // 5. Core Business Logic - Use handlers

    // Start measuring request time
    const requestStartTime = Date.now();

    // Prepare filter info for the response
    const filterInfo: FilterInfo = {
      contributors: contributors.length > 0 ? contributors : null,
      organizations: organizations.length > 0 ? organizations : null,
      repositories: repositoryFilters.length > 0 ? repositoryFilters : null,
      dateRange: { since, until }
    };

    // Fetch repositories using appropriate auth method
    logger.info(MODULE_NAME, "Fetching all accessible repos", {
      authMethod: installationIds.length > 0 ? "GitHub App" : "OAuth",
      installationCount: installationIds.length
    });
    
    // Fetch repositories from all selected installations
    let allRepos = [];
    
    if (installationIds.length > 0) {
      // Fetch repos from all installations in parallel
      const repoPromises = installationIds.map(id => 
        fetchAllRepositories(session.accessToken, id)
      );
      
      const repoResults = await Promise.all(repoPromises);
      
      // Combine all repositories from all installations
      allRepos = repoResults.flat();
      
      logger.debug(MODULE_NAME, "Fetched repositories from multiple installations", {
        installationCount: installationIds.length,
        totalRepoCount: allRepos.length
      });
    } else {
      // Fetch with OAuth only
      allRepos = await fetchAllRepositories(session.accessToken);
    }

    // Filter repositories by organization and repository name
    const filteredRepos = filterRepositoriesByOrgAndRepoNames(allRepos, organizations, repositoryFilters);
    
    const reposToAnalyze = filteredRepos.map(repo => repo.full_name);
    
    logger.debug(MODULE_NAME, "Repositories to analyze after filtering", { 
      count: reposToAnalyze.length
    });
    
    if (reposToAnalyze.length === 0) {
      logger.warn(MODULE_NAME, "No repositories match the filter criteria");
      return new NextResponse(JSON.stringify({ 
        error: "No repositories match the specified filters",
        filterInfo
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    
    // Map repositories to installations for efficient fetching
    const { reposByInstallation } = mapRepositoriesToInstallations(
      reposToAnalyze, 
      allInstallations, 
      installationIds
    );
    
    // Determine author filter for GitHub API queries
    let authorFilter: string | undefined = undefined;
    
    // If contributors has exactly one entry and it's 'me' or matches the session user,
    // set authorFilter to the current user
    if (contributors.length === 1) {
      if (contributors[0] === 'me' || contributors[0] === session.user?.name) {
        authorFilter = session.user?.name || undefined;
        logger.debug(MODULE_NAME, "Filtering for current user's commits", { authorFilter });
      } else {
        // Filter for specific contributor
        authorFilter = contributors[0];
        logger.debug(MODULE_NAME, "Filtering for specific contributor", { authorFilter });
      }
    }
    
    // Fetch commits with appropriate auth methods
    const commitFetchStartTime = Date.now();
    const commits = await fetchCommitsWithAuthMethod(
      reposByInstallation,
      session.accessToken,
      since,
      until,
      authorFilter
    );
    logger.info(MODULE_NAME, "Fetched commits", {
      commitCount: commits.length,
      timeMs: Date.now() - commitFetchStartTime,
    });
    
    // Apply further contributor filtering if needed
    const filteredCommits = filterCommitsByContributor(commits, contributors, session.user?.name || undefined);
    
    // Group commits chronologically
    const groupedResults = groupCommitsByFilter(filteredCommits, groupBy);
    
    // Generate AI summary
    const aiSummaryStartTime = Date.now();
    const { groupedResults: summaryResults, overallSummary } = await generateSummaryData(
      groupedResults,
      geminiApiKey,
      generateGroupSummaries
    );
    
    // Prepare final response
    const summaryResponse = prepareSummaryResponse(
      summaryResults,
      overallSummary,
      filterInfo,
      session.user?.name || undefined,
      installationIds.length > 0 ? "github_app" : "oauth",
      installationIds,
      allInstallations
    );
    
    const totalTime = Date.now() - requestStartTime;
    logger.info(MODULE_NAME, "Completed summary request", {
      totalTimeMs: totalTime,
      commitCount: filteredCommits.length,
      groupCount: summaryResults.length,
      groupBy
    });
    
    return NextResponse.json(summaryResponse);
  } catch (error) {
    logger.error(MODULE_NAME, "Error generating summary", { 
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check what kind of error we have
    const errorObj = error as { name?: string; message?: string } || {};
    const errorName = errorObj.name || '';
    const errorMsg = errorObj.message || '';
    
    const isAuthError = errorName === 'HttpError' && 
                      (errorMsg.includes('credentials') || 
                      errorMsg.includes('authentication'));
    
    const isAppError = errorMsg.includes('GitHub App credentials not configured');
    
    let errorMessage = "Failed to generate summary";
    let errorCode = "API_ERROR";
    
    if (isAppError) {
      errorMessage = "GitHub App not properly configured. Please contact the administrator.";
      errorCode = "GITHUB_APP_CONFIG_ERROR";
    } else if (isAuthError) {
      errorMessage = "GitHub authentication failed. Your authentication is invalid or expired.";
      errorCode = "GITHUB_AUTH_ERROR";
    }
    
    return new NextResponse(JSON.stringify({ 
      error: errorMessage, 
      details: error instanceof Error ? error.message : "Unknown error",
      code: errorCode
    }), {
      status: (isAuthError || isAppError) ? 403 : 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}