/**
 * Utility functions for the GitPulse API
 */

import { Commit } from "./github/types";
import { CommitStats } from "@/types/api";
import { logger } from "./logger";

const MODULE_NAME = "api-utils";

/**
 * Generates basic statistics about a collection of commits
 * 
 * @param commits - Array of Git commits to analyze
 * @returns CommitStats object containing aggregate statistics
 */
export function generateBasicStats(commits: readonly Commit[]): CommitStats {
  logger.debug(MODULE_NAME, "Generating basic stats", { commitCount: commits.length });
  
  // Generate basic statistics about the commits
  const stats: CommitStats = {
    totalCommits: commits.length,
    repositories: [...new Set(commits.map((commit) => 
      commit.repository?.full_name || commit.html_url.split('/').slice(3, 5).join('/')
    ))],
    dates: [...new Set(commits.map((commit) => 
      commit.commit.author?.date?.split('T')[0] || ''
    ))],
  };
  
  logger.debug(MODULE_NAME, "Basic stats generated", {
    totalCommits: stats.totalCommits,
    uniqueRepos: stats.repositories.length,
    uniqueDates: stats.dates.length
  });
  
  return stats;
}

/**
 * Extracts unique repository names from commits
 * 
 * @param commits - Array of Git commits to analyze
 * @returns Array of unique repository names
 */
export function extractUniqueRepositories(commits: readonly Commit[]): readonly string[] {
  return [...new Set(commits.map((commit) => 
    commit.repository?.full_name || commit.html_url.split('/').slice(3, 5).join('/')
  ))];
}

/**
 * Extracts unique dates from commits
 * 
 * @param commits - Array of Git commits to analyze
 * @returns Array of unique dates in YYYY-MM-DD format
 */
export function extractUniqueDates(commits: readonly Commit[]): readonly string[] {
  return [...new Set(commits.map((commit) => 
    commit.commit.author?.date?.split('T')[0] || ''
  ))];
}