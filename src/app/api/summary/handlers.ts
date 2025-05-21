/**
 * Handlers for the summary API endpoint
 * 
 * This module contains functions for processing repositories, fetching commits,
 * and generating summaries. It extracts the business logic from the route
 * handler to make it more testable and maintainable.
 */

import { 
  AppInstallation,
  Repository,
  Commit
} from "@/lib/github/types";
import { 
  FilterInfo, 
  GroupBy, 
  GroupedResult, 
  CommitStats, 
  SummaryResponse
} from "@/types/api";

/**
 * Configuration for logging module name
 */
const MODULE_NAME = "api:summary:handlers";

/**
 * External dependencies for summary handlers
 */
export interface SummaryHandlerDependencies {
  /** Logger for debugging and info messages */
  logger: {
    debug: (module: string, message: string, data?: any) => void;
    info: (module: string, message: string, data?: any) => void;
    warn: (module: string, message: string, data?: any) => void;
    error: (module: string, message: string, data?: any) => void;
  };
  
  /** GitHub service functions */
  githubService: {
    fetchAllRepositories: (accessToken: string | undefined, installationId?: number) => Promise<Repository[]>;
    fetchCommitsForRepositories: (
      accessToken: string | undefined,
      installationId: number | undefined,
      repositories: string[],
      since: string,
      until: string,
      author?: string
    ) => Promise<Commit[]>;
  };
  
  /** Gemini service for AI summaries */
  geminiService: {
    generateCommitSummary: (commits: Commit[], apiKey: string) => Promise<any>;
  };
  
  /** API utilities for data processing */
  apiUtils: {
    extractUniqueDates: (commits: readonly Commit[]) => readonly string[];
    extractUniqueRepositories: (commits: readonly Commit[]) => readonly string[];
    generateBasicStats: (commits: readonly Commit[]) => CommitStats;
  };
}

/**
 * Factory function to create summary handlers with injected dependencies
 * @param deps External dependencies for the handlers
 * @returns Object containing all handler functions
 */
export function createSummaryHandlers(deps: SummaryHandlerDependencies) {
  const { logger, githubService, geminiService, apiUtils } = deps;

  /**
   * Filter repositories by organization and repository names
   * 
   * @param repositories - Array of repositories to filter
   * @param organizations - Array of organization names to include (empty means no filter)
   * @param repositoryFilters - Array of repository full names to include (empty means no filter)
   * @returns Filtered array of repositories
   */
  function filterRepositoriesByOrgAndRepoNames(
    repositories: readonly Repository[],
    organizations: readonly string[] = [],
    repositoryFilters: readonly string[] = []
  ): Repository[] {
    logger.debug(MODULE_NAME, "Filtering repositories", {
      totalRepos: repositories.length,
      organizationFilters: organizations.length,
      repositoryFilters: repositoryFilters.length
    });

    let filteredRepos = [...repositories];

    // Apply organization filter if specified
    if (organizations.length > 0) {
      filteredRepos = filteredRepos.filter(repo => {
        const orgName = repo.full_name.split('/')[0];
        return organizations.includes(orgName);
      });
      
      logger.debug(MODULE_NAME, "Applied organization filters", {
        originalCount: repositories.length,
        filteredCount: filteredRepos.length,
        organizations
      });
    }

    // Apply repository filter if specified
    if (repositoryFilters.length > 0) {
      filteredRepos = filteredRepos.filter(repo => 
        repositoryFilters.includes(repo.full_name)
      );
      
      logger.debug(MODULE_NAME, "Applied repository filters", {
        originalCount: repositories.length,
        filteredCount: filteredRepos.length,
        repositoryFilters
      });
    }

    return filteredRepos;
  }

/**
 * Maps repositories to installations for efficient fetching
 * 
 * @param reposToAnalyze - Array of repository full names
 * @param installations - Array of GitHub App installations
 * @param installationIds - Array of selected installation IDs
 * @returns Object mapping repositories to installation IDs
 */
  function mapRepositoriesToInstallations(
  reposToAnalyze: readonly string[],
  installations: readonly AppInstallation[],
  installationIds: readonly number[]
): {
  orgToInstallationMap: Map<string, number>,
  reposByInstallation: Record<string, string[]>
} {
  logger.debug(MODULE_NAME, "Mapping repositories to installations", {
    repoCount: reposToAnalyze.length,
    installationsCount: installations.length,
    selectedInstallationIds: installationIds.length
  });

  // Create mapping from organizations to installation IDs
  const orgToInstallationMap = new Map<string, number>();
    
  if (installationIds.length > 0) {
    reposToAnalyze.forEach(repoFullName => {
      const orgName = repoFullName.split('/')[0];
      
      // Find an installation for this org if we don't already have one mapped
      if (!orgToInstallationMap.has(orgName)) {
        const matchingInstallation = installations.find(
          inst => inst.account?.login === orgName && installationIds.includes(inst.id)
        );
        
        if (matchingInstallation) {
          orgToInstallationMap.set(orgName, matchingInstallation.id);
        }
      }
    });
    
    logger.debug(MODULE_NAME, "Created organization to installation mapping", {
      mappingCount: orgToInstallationMap.size,
      orgsWithInstallations: Array.from(orgToInstallationMap.keys())
    });
  }

  // Group repositories by installation ID for efficient fetching
  const reposByInstallation: Record<string, string[]> = {};
  
  // Initialize with a default key for OAuth
  reposByInstallation['oauth'] = [];
  
  reposToAnalyze.forEach(repoFullName => {
    const orgName = repoFullName.split('/')[0];
    const installId = orgToInstallationMap.get(orgName);
    
    if (installId) {
      // Use the installation ID as the key
      const key = installId.toString();
      if (!reposByInstallation[key]) {
        reposByInstallation[key] = [];
      }
      reposByInstallation[key].push(repoFullName);
    } else {
      // No installation found for this org, use OAuth
      reposByInstallation['oauth'].push(repoFullName);
    }
  });

  logger.debug(MODULE_NAME, "Grouped repositories by installation for fetching", {
    installationGroups: Object.keys(reposByInstallation).length,
    reposCounts: Object.fromEntries(
      Object.entries(reposByInstallation).map(([key, repos]) => [key, repos.length])
    )
  });

  return { orgToInstallationMap, reposByInstallation };
}

/**
 * Fetch commits from repositories using appropriate authentication methods
 * 
 * @param reposByInstallation - Object mapping of repos grouped by installation
 * @param accessToken - OAuth access token
 * @param since - Start date for commit history
 * @param until - End date for commit history
 * @param authorFilter - Optional filter for commit author
 * @returns Array of fetched commits
 */
  async function fetchCommitsWithAuthMethod(
  reposByInstallation: Record<string, string[]>,
  accessToken: string | undefined,
  since: string,
  until: string,
  authorFilter?: string
): Promise<Commit[]> {
    // Validate inputs
    if (!since || !until) {
      logger.warn(MODULE_NAME, 'Missing required date parameters', { since, until });
      return [];
    }
  const commitFetchStartTime = Date.now();
  logger.debug(MODULE_NAME, "Fetching commits with installation mapping", {
    installationGroups: Object.keys(reposByInstallation).length,
    hasAccessToken: !!accessToken,
    dateRange: { since, until },
    authorFilter
  });

  // Fetch commits from all installation groups in parallel
  const commitFetchPromises: Promise<Commit[]>[] = [];
  
  // For each installation ID group
  for (const [key, repos] of Object.entries(reposByInstallation)) {
    if (!repos || repos.length === 0) {
      logger.debug(MODULE_NAME, 'Skipping empty repository group', { key });
      continue;
    }
    
    try {
      if (key === 'oauth') {
        // Fetch with OAuth if the user has an access token
        if (accessToken) {
          commitFetchPromises.push(
            githubService.fetchCommitsForRepositories(
              accessToken,
              undefined, // No installation ID for OAuth
              repos,
              since,
              until,
              authorFilter
            )
          );
        }
      } else {
        // Fetch with installation ID
        const installId = parseInt(key, 10);
        commitFetchPromises.push(
          githubService.fetchCommitsForRepositories(
            accessToken,
            installId,
            repos,
            since,
            until,
            authorFilter
          )
        );
      }
    } catch (error) {
      // Log error but continue with other repository groups
      logger.error(MODULE_NAME, `Error fetching commits for installation ${key}`, {
        error,
        repos,
        installId: key !== 'oauth' ? parseInt(key, 10) : undefined
      });
      // Return empty array for this group
      commitFetchPromises.push(Promise.resolve([]));
    }
  }
  
  // Wait for all commit fetching to complete, handling errors
  let commitResults: Commit[][] = [];
  try {
    commitResults = await Promise.all(commitFetchPromises);
  } catch (error) {
    logger.error(MODULE_NAME, 'Error in Promise.all for commit fetching', { error });
    // Continue with any results we have
    commitResults = [];
  }
  
  // Combine all commits
  const commits = commitResults.flat();
  
  const commitFetchEndTime = Date.now();
  
  logger.info(MODULE_NAME, "Fetched commits with multiple auth methods", {
    commitCount: commits.length,
    timeMs: commitFetchEndTime - commitFetchStartTime,
  });

  return commits;
}

/**
 * Filter commits by contributor names
 * 
 * @param commits - Array of commits to filter
 * @param contributors - Array of contributor names to include
 * @param currentUserName - Name of the currently authenticated user (for 'me' filter)
 * @returns Filtered array of commits
 */
  function filterCommitsByContributor(
  commits: readonly Commit[],
  contributors: readonly string[],
  currentUserName?: string
): Commit[] {
  if (contributors.length === 0) {
    return [...commits];
  }
  
  // If single contributor is 'me', filter for current user
  if (contributors.length === 1 && contributors[0] === 'me') {
    if (!currentUserName) {
      // If we don't know who "me" is, return empty array
      logger.warn(MODULE_NAME, "Cannot filter for 'me' without current user name");
      return [];
    }
    // Filter for commits by the current user
    const filteredCommits = commits.filter(commit => {
      const commitAuthor = commit.author?.login || commit.commit.author?.name;
      return commitAuthor === currentUserName;
    });
    return filteredCommits;
  }
  
  // If single contributor matches current user directly, filter for that user
  if (contributors.length === 1 && contributors[0] === currentUserName) {
    const filteredCommits = commits.filter(commit => {
      const commitAuthor = commit.author?.login || commit.commit.author?.name;
      return commitAuthor === currentUserName;
    });
    return filteredCommits;
  }

  // Filter for multiple contributors or a specific contributor that isn't 'me'
  const filteredCommits = commits.filter(commit => {
    const commitAuthor = commit.author?.login || commit.commit.author?.name;
    return contributors.includes(commitAuthor || '') || 
            (contributors.includes('me') && commitAuthor === currentUserName);
  });
  
  logger.debug(MODULE_NAME, "Applied contributor filters", {
    originalCount: commits.length,
    filteredCount: filteredCommits.length,
    contributors,
    currentUser: currentUserName
  });

  return filteredCommits;
}

/**
 * Group commits based on specified criteria
 * 
 * @param commits - Array of commits to group
 * @param groupBy - Grouping strategy to apply
 * @returns Array of grouped results
 */
  function groupCommitsByFilter(
  commits: readonly Commit[],
  groupBy: GroupBy = 'chronological'
): GroupedResult[] {
  logger.debug(MODULE_NAME, "Grouping commits", {
    commitCount: commits.length,
    groupBy
  });

  // Currently only supporting chronological view as per application standardization
  // But this function can be expanded to support other grouping types if needed
  const groupedResults: GroupedResult[] = [{
    groupKey: 'all',
    groupName: 'All Commits',
    commitCount: commits.length,
    repositories: apiUtils.extractUniqueRepositories(commits),
    dates: apiUtils.extractUniqueDates(commits),
    commits: commits,
    // AI summary will be added later
  }];

  return groupedResults;
}

/**
 * Generate summary data for commits including AI summary if required
 * 
 * @param groupedResults - Array of grouped commit results
 * @param geminiApiKey - API key for Gemini AI service
 * @param generateGroupSummaries - Whether to generate summaries for each group
 * @returns Updated grouped results with AI summaries
 */
  async function generateSummaryData(
  groupedResults: GroupedResult[],
  geminiApiKey: string,
  generateGroupSummaries: boolean = false
): Promise<{
  groupedResults: GroupedResult[],
  overallSummary: any | null
}> {
  logger.debug(MODULE_NAME, "Generating summary data", {
    groupCount: groupedResults.length,
    generateGroupSummaries
  });

  // For now we only generate overall summary as per application standards
  let overallSummary = null;
  const aiSummaryStartTime = Date.now();

  // Use the first group (all commits) for the overall summary
  if (groupedResults.length > 0 && groupedResults[0].commits.length > 0) {
    try {
      // Cast readonly array to mutable array for API compatibility
      const commits = [...groupedResults[0].commits];
      
      // Validate API key
      if (!geminiApiKey) {
        logger.error(MODULE_NAME, 'Missing Gemini API key');
        // Continue without AI summary
      } else {
        overallSummary = await geminiService.generateCommitSummary(commits, geminiApiKey);
        logger.info(MODULE_NAME, "Generated overall AI summary", {
          timeMs: Date.now() - aiSummaryStartTime,
          keyThemes: overallSummary?.keyThemes?.length || 0,
          technicalAreas: overallSummary?.technicalAreas?.length || 0
        });
      }
    } catch (error) {
      logger.error(MODULE_NAME, 'Error generating AI summary', { error });
      // Continue without AI summary
      overallSummary = null;
    }
  }

  // If group summaries are requested, generate them
  // (Currently not used in our application but included for future flexibility)
  if (generateGroupSummaries) {
    try {
      const groupSummaryPromises = groupedResults.map(async (group) => {
        if (group.commits.length > 0) {
          try {
            // Cast readonly array to mutable array for API compatibility
            const commits = [...group.commits];
            const groupSummary = await geminiService.generateCommitSummary(commits, geminiApiKey);
            return { ...group, aiSummary: groupSummary };
          } catch (error) {
            logger.error(MODULE_NAME, 'Error generating group summary', { 
              error, 
              groupKey: group.groupKey,
              commitCount: group.commits.length 
            });
            // Return group without AI summary on error
            return group;
          }
        }
        return group;
      });
      
      let updatedGroups = [];
      try {
        updatedGroups = await Promise.all(groupSummaryPromises);
      } catch (error) {
        logger.error(MODULE_NAME, 'Error in Promise.all for group summaries', { error });
        // Fall back to original groups
        updatedGroups = groupedResults;
      }
      
      return { groupedResults: updatedGroups, overallSummary };
    } catch (error) {
      logger.error(MODULE_NAME, 'Error in group summary generation', { error });
      // Return original data
      return { groupedResults, overallSummary };
    }
  }

  return { groupedResults, overallSummary };
}

/**
 * Prepare the summary API response object
 * 
 * @param groupedResults - Array of grouped commit results
 * @param overallSummary - Generated AI summary
 * @param filterInfo - Information about applied filters
 * @param userName - Name of the authenticated user
 * @param authMethod - Authentication method used
 * @param installationIds - Array of GitHub App installation IDs
 * @param installations - Array of all GitHub App installations
 * @returns Prepared summary response object
 */
  function prepareSummaryResponse(
  groupedResults: GroupedResult[],
  overallSummary: any,
  filterInfo: FilterInfo,
  userName?: string,
  authMethod: "github_app" | "oauth" = "oauth",
  installationIds: readonly number[] = [],
  installations: readonly AppInstallation[] = []
): SummaryResponse {
  logger.debug(MODULE_NAME, "Preparing summary response", {
    groupCount: groupedResults.length,
    hasAiSummary: !!overallSummary,
    authMethod,
    installationCount: installationIds.length
  });

  // Always use the first group (all commits) for overall stats
  const allCommits = groupedResults.length > 0 ? groupedResults[0].commits : [];
  const stats = apiUtils.generateBasicStats(allCommits);

  return {
    user: userName,
    // Legacy fields for backward compatibility
    commits: allCommits,
    stats,
    aiSummary: overallSummary,
    // Filter and group information
    filterInfo,
    groupedResults,
    // Authentication and installation info
    authMethod,
    installationIds: installationIds.length > 0 ? installationIds : null,
    installations,
    currentInstallations: installationIds.length > 0 
      ? installations.filter(i => installationIds.includes(i.id))
      : []
  };
  }

  // Return all handler functions
  return {
    filterRepositoriesByOrgAndRepoNames,
    mapRepositoriesToInstallations,
    fetchCommitsWithAuthMethod,
    filterCommitsByContributor,
    groupCommitsByFilter,
    generateSummaryData,
    prepareSummaryResponse
  };
}

/**
 * Type for the object returned by createSummaryHandlers
 */
export type SummaryHandlers = ReturnType<typeof createSummaryHandlers>;