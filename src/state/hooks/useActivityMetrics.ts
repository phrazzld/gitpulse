/**
 * Hook for calculating activity metrics from Zustand store
 *
 * This hook provides computed metrics based on the summary and repository data
 * from the Zustand store. It transparently handles the computation without
 * requiring the parent component to manage this logic.
 *
 * This hook uses the safe store access patterns to ensure proper error handling
 * and type safety.
 */

import { useSafeSelector } from "./useSafeStore";
import { StateSlice } from "../types";
import { CommitSummary } from "@/types/summary";
import { Repository } from "@/types/github";

export function useActivityMetrics() {
  // Safely get summary and repositories with proper fallbacks
  const summary = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.summary,
    null as CommitSummary | null,
  );

  const repositories = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.repositories,
    [] as Repository[],
  );

  // Calculate metrics with guaranteed type safety
  const commits = getCommitCount(summary);
  const repositoryCount = getRepositoryCount(summary, repositories);
  const activeDays = getActiveDaysCount(summary);

  return {
    commits,
    repositories: repositoryCount,
    activeDays,
  };
}

/**
 * Calculate the total number of commits from summary data
 *
 * @param summary The commit summary or null if not available
 * @returns The number of commits or 0 if no data
 */
function getCommitCount(summary: CommitSummary | null): number {
  if (!summary?.commits) {
    return 0;
  }
  return summary.commits.length;
}

/**
 * Calculate the number of repositories with activity
 *
 * @param summary The commit summary or null if not available
 * @param repositories The list of repositories or empty array if not available
 * @returns The number of repositories with activity or total repository count
 */
function getRepositoryCount(
  summary: CommitSummary | null,
  repositories: Repository[],
): number {
  if (!summary?.commits) {
    return repositories.length;
  }

  const repositoriesWithActivity = new Set<string>();
  summary.commits.forEach((commit) => {
    // Cast to check for repository property (handle different commit types)
    const commitWithRepo = commit as { repository?: { id: string } };
    if (commitWithRepo.repository?.id) {
      repositoriesWithActivity.add(commitWithRepo.repository.id);
    }
  });

  return repositoriesWithActivity.size || repositories.length;
}

/**
 * Calculate the number of unique active days
 *
 * @param summary The commit summary or null if not available
 * @returns The number of unique active days or 0 if no data
 */
function getActiveDaysCount(summary: CommitSummary | null): number {
  if (!summary?.stats?.dates) {
    return 0;
  }

  // Get unique active days from the stats
  const uniqueDays = new Set<string>();
  summary.stats.dates.forEach((day) => {
    uniqueDays.add(day);
  });

  return uniqueDays.size;
}
