/**
 * Handlers for the summary API endpoint
 * 
 * This module contains functions for processing repositories, fetching commits,
 * and generating summaries. It extracts the business logic from the route
 * handler to make it more testable and maintainable.
 */

import { logger } from "@/lib/logger";
import { 
  AppInstallation,
  Repository,
  Commit
} from "@/lib/github/types";
import { fetchAllRepositories } from "@/lib/github/repositories"; 
import { fetchCommitsForRepositories } from "@/lib/github/commits";
import { generateCommitSummary } from "@/lib/gemini";
import { 
  FilterInfo, 
  GroupBy, 
  GroupedResult, 
  CommitStats, 
  SummaryResponse
} from "@/types/api";
import { extractUniqueDates, extractUniqueRepositories, generateBasicStats } from "@/lib/api-utils";

const MODULE_NAME = "api:summary:handlers";

/**
 * Filter repositories by organization and repository names
 * 
 * @param repositories - Array of repositories to filter
 * @param organizations - Array of organization names to include (empty means no filter)
 * @param repositoryFilters - Array of repository full names to include (empty means no filter)
 * @returns Filtered array of repositories
 */
export function filterRepositoriesByOrgAndRepoNames(
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
export function mapRepositoriesToInstallations(
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
export async function fetchCommitsWithAuthMethod(
  reposByInstallation: Record<string, string[]>,
  accessToken: string | undefined,
  since: string,
  until: string,
  authorFilter?: string
): Promise<Commit[]> {
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
    if (repos.length === 0) continue;
    
    if (key === 'oauth') {
      // Fetch with OAuth if the user has an access token
      if (accessToken) {
        commitFetchPromises.push(
          fetchCommitsForRepositories(
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
        fetchCommitsForRepositories(
          accessToken,
          installId,
          repos,
          since,
          until,
          authorFilter
        )
      );
    }
  }
  
  // Wait for all commit fetching to complete
  const commitResults = await Promise.all(commitFetchPromises);
  
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
export function filterCommitsByContributor(
  commits: readonly Commit[],
  contributors: readonly string[],
  currentUserName?: string
): Commit[] {
  if (contributors.length === 0) {
    return [...commits];
  }
  
  // If single contributor that is 'me' or matches current user, we already filtered
  // at the GitHub API level, so don't filter again
  if (contributors.length === 1 && 
      (contributors[0] === 'me' || contributors[0] === currentUserName)) {
    return [...commits];
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
export function groupCommitsByFilter(
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
    repositories: extractUniqueRepositories(commits),
    dates: extractUniqueDates(commits),
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
export async function generateSummaryData(
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
    // Cast readonly array to mutable array for API compatibility
    const commits = [...groupedResults[0].commits];
    overallSummary = await generateCommitSummary(commits, geminiApiKey);
    logger.info(MODULE_NAME, "Generated overall AI summary", {
      timeMs: Date.now() - aiSummaryStartTime,
      keyThemes: overallSummary?.keyThemes?.length || 0,
      technicalAreas: overallSummary?.technicalAreas?.length || 0
    });
  }

  // If group summaries are requested, generate them
  // (Currently not used in our application but included for future flexibility)
  if (generateGroupSummaries) {
    const updatedGroups = await Promise.all(
      groupedResults.map(async (group) => {
        if (group.commits.length > 0) {
          // Cast readonly array to mutable array for API compatibility
          const commits = [...group.commits];
          const groupSummary = await generateCommitSummary(commits, geminiApiKey);
          return { ...group, aiSummary: groupSummary };
        }
        return group;
      })
    );
    
    return { groupedResults: updatedGroups, overallSummary };
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
export function prepareSummaryResponse(
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
  const stats = generateBasicStats(allCommits);

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