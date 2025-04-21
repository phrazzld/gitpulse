/**
 * Hook for calculating activity metrics from Zustand store
 *
 * This hook provides computed metrics based on the summary and repository data
 * from the Zustand store. It transparently handles the computation without
 * requiring the parent component to manage this logic.
 */

import { useStore } from "../store";
import { StateSlice } from "../types";
import { CommitSummary } from "@/types/summary";
import { Repository } from "@/types/github";

export function useActivityMetrics() {
  // Get summary and repositories directly from store
  const summary = useStore((state) => state[StateSlice.Dashboard].summary);
  const repositories = useStore(
    (state) => state[StateSlice.Dashboard].repositories,
  );

  // Calculate metrics
  const commits = getCommitCount(summary);
  const repositoryCount = getRepositoryCount(summary, repositories);
  const activeDays = getActiveDaysCount(summary);

  return {
    commits,
    repositories: repositoryCount,
    activeDays,
  };
}

// Helper functions for activity metrics calculation
function getCommitCount(summary: CommitSummary | null): number {
  if (!summary || !summary.commits) {
    return 0;
  }
  return summary.commits.length;
}

function getRepositoryCount(
  summary: CommitSummary | null,
  repositories: Repository[],
): number {
  if (!summary || !summary.commits) {
    return repositories.length;
  }

  const repositoriesWithActivity = new Set();
  summary.commits.forEach((commit) => {
    // Cast to check for repository property (handle different commit types)
    const commitWithRepo = commit as { repository?: { id: string } };
    if (commitWithRepo.repository) {
      repositoriesWithActivity.add(commitWithRepo.repository.id);
    }
  });

  return repositoriesWithActivity.size || repositories.length;
}

function getActiveDaysCount(summary: CommitSummary | null): number {
  if (!summary || !summary.stats || !summary.stats.dates) {
    return 0;
  }

  // Get unique active days from the stats
  const uniqueDays = new Set();
  summary.stats.dates.forEach((day) => {
    uniqueDays.add(day);
  });

  return uniqueDays.size;
}
