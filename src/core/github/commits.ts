/**
 * Pure functions for GitHub commit data transformations
 * No side effects, no external dependencies - just data transformations
 */

import { pipe, groupBy, sortBy, filter, map, uniqueBy } from '../../lib/functional/index';
import { calculateSummaryStats } from '../summary/generator';
import type { CommitData, DateRange, SummaryStats } from '../types/index';

/**
 * Filter commits by date range
 */
export const filterCommitsByDateRange = 
  (start: Date, end: Date) => 
  (commits: readonly CommitData[]): CommitData[] =>
    commits.filter(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= start && commitDate <= end;
    });

/**
 * Filter commits by specific authors
 */
export const filterCommitsByAuthors = 
  (authors: readonly string[]) => 
  (commits: readonly CommitData[]): CommitData[] => {
    const authorSet = new Set(authors.map(a => a.toLowerCase()));
    return commits.filter(commit => authorSet.has(commit.author.toLowerCase()));
  };

/**
 * Filter commits by repositories
 */
export const filterCommitsByRepositories = 
  (repositories: readonly string[]) => 
  (commits: readonly CommitData[]): CommitData[] => {
    const repoSet = new Set(repositories);
    return commits.filter(commit => repoSet.has(commit.repository));
  };

/**
 * Group commits by repository
 */
export const groupCommitsByRepository = 
  (commits: readonly CommitData[]): Record<string, CommitData[]> =>
    groupBy((commit: CommitData) => commit.repository)(commits);

/**
 * Group commits by author
 */
export const groupCommitsByAuthor = 
  (commits: readonly CommitData[]): Record<string, CommitData[]> =>
    groupBy((commit: CommitData) => commit.author)(commits);

/**
 * Group commits by date (YYYY-MM-DD format)
 */
export const groupCommitsByDate = 
  (commits: readonly CommitData[]): Record<string, CommitData[]> =>
    groupBy((commit: CommitData) => commit.date.split('T')[0])(commits);

/**
 * Extract unique authors from commits
 */
export const extractUniqueAuthors = 
  (commits: readonly CommitData[]): string[] =>
    uniqueBy((commit: CommitData) => commit.author.toLowerCase())(commits)
      .map(commit => commit.author);

/**
 * Extract unique repositories from commits
 */
export const extractUniqueRepositories = 
  (commits: readonly CommitData[]): string[] =>
    uniqueBy((commit: CommitData) => commit.repository)(commits)
      .map(commit => commit.repository);

/**
 * Sort commits by date (newest first)
 */
export const sortCommitsByDateDesc = 
  (commits: readonly CommitData[]): CommitData[] =>
    sortBy((a: CommitData, b: CommitData) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )(commits);

/**
 * Sort commits by date (oldest first)
 */
export const sortCommitsByDateAsc = 
  (commits: readonly CommitData[]): CommitData[] =>
    sortBy((a: CommitData, b: CommitData) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )(commits);

// Summary statistics functions moved to src/core/summary/generator.ts

/**
 * Apply multiple filters to commits in a composable way
 */
export const applyCommitFilters = (
  dateRange?: DateRange,
  authors?: readonly string[],
  repositories?: readonly string[]
) => (commits: readonly CommitData[]): CommitData[] => {
  let filteredCommits = [...commits];
  
  if (dateRange) {
    filteredCommits = filterCommitsByDateRange(dateRange.start, dateRange.end)(filteredCommits);
  }
  
  if (authors && authors.length > 0) {
    filteredCommits = filterCommitsByAuthors(authors)(filteredCommits);
  }
  
  if (repositories && repositories.length > 0) {
    filteredCommits = filterCommitsByRepositories(repositories)(filteredCommits);
  }
  
  return filteredCommits;
};

/**
 * Process commits through a complete analysis pipeline
 */
export const analyzeCommits = (
  commits: readonly CommitData[],
  dateRange?: DateRange,
  authors?: readonly string[],
  repositories?: readonly string[]
): SummaryStats => {
  return pipe(
    commits,
    applyCommitFilters(dateRange, authors, repositories),
    calculateSummaryStats
  );
};