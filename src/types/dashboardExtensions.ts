/**
 * Extended Dashboard Types
 * 
 * This module provides extended type definitions for the dashboard interfaces
 * to handle null/undefined values in test scenarios.
 */

import { CommitSummary } from './dashboard';

/**
 * Extended CommitSummary interface that allows null/undefined stats
 * for test cases. This enables TypeScript to understand intentional edge cases
 * in tests without requiring @ts-ignore comments.
 */
export interface TestCommitSummary extends Omit<CommitSummary, 'stats'> {
  readonly stats?: {
    readonly totalCommits: number;
    readonly repositories: readonly string[];
    readonly dates: readonly string[];
  } | null;
}

/**
 * Default empty stats object for when stats are null/undefined
 */
export const DEFAULT_STATS = {
  totalCommits: 0,
  repositories: [] as string[],
  dates: [] as string[]
};

/**
 * Helper function to safely extract stats from a CommitSummary,
 * handling null/undefined values gracefully.
 */
export function getSafeStats(summary?: CommitSummary | TestCommitSummary | null) {
  return summary?.stats || DEFAULT_STATS;
}