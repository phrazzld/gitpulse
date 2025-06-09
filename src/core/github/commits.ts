/**
 * Pure functions for GitHub commit data transformations
 * No side effects, no external dependencies - just data transformations
 */

import { pipe, groupBy, sortBy, filter, map, uniqueBy } from '../../lib/functional/index';
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

/**
 * Calculate total additions across all commits
 */
export const calculateTotalAdditions = 
  (commits: readonly CommitData[]): number =>
    commits.reduce((total, commit) => total + (commit.additions || 0), 0);

/**
 * Calculate total deletions across all commits
 */
export const calculateTotalDeletions = 
  (commits: readonly CommitData[]): number =>
    commits.reduce((total, commit) => total + (commit.deletions || 0), 0);

/**
 * Find the most active day (day with most commits)
 */
export const findMostActiveDay = 
  (commits: readonly CommitData[]): string => {
    const commitsByDate = groupCommitsByDate(commits);
    const entries = Object.entries(commitsByDate);
    
    if (entries.length === 0) return '';
    
    return entries
      .sort(([, commitsA], [, commitsB]) => commitsB.length - commitsA.length)[0][0];
  };

/**
 * Calculate average commits per day
 */
export const calculateAverageCommitsPerDay = 
  (commits: readonly CommitData[]): number => {
    const commitsByDate = groupCommitsByDate(commits);
    const uniqueDays = Object.keys(commitsByDate).length;
    
    if (uniqueDays === 0) return 0;
    
    return commits.length / uniqueDays;
  };

/**
 * Get top repositories by commit count
 */
export const getTopRepositoriesByCommits = 
  (commits: readonly CommitData[], limit: number = 10): Array<{ name: string; commits: number }> => {
    const commitsByRepo = groupCommitsByRepository(commits);
    
    return Object.entries(commitsByRepo)
      .map(([name, repoCommits]) => ({ name, commits: repoCommits.length }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, limit);
  };

/**
 * Get commits count by author
 */
export const getCommitCountByAuthor = 
  (commits: readonly CommitData[]): Record<string, number> => {
    const commitsByAuthor = groupCommitsByAuthor(commits);
    
    return Object.entries(commitsByAuthor).reduce((acc, [author, authorCommits]) => ({
      ...acc,
      [author]: authorCommits.length
    }), {} as Record<string, number>);
  };

/**
 * Get commits count by date
 */
export const getCommitCountByDate = 
  (commits: readonly CommitData[]): Record<string, number> => {
    const commitsByDate = groupCommitsByDate(commits);
    
    return Object.entries(commitsByDate).reduce((acc, [date, dateCommits]) => ({
      ...acc,
      [date]: dateCommits.length
    }), {} as Record<string, number>);
  };

/**
 * Calculate comprehensive summary statistics
 */
export const calculateSummaryStats = 
  (commits: readonly CommitData[]): SummaryStats => {
    const uniqueAuthors = extractUniqueAuthors(commits);
    const uniqueRepositories = extractUniqueRepositories(commits);
    const mostActiveDay = findMostActiveDay(commits);
    const averageCommitsPerDay = calculateAverageCommitsPerDay(commits);
    const totalAdditions = calculateTotalAdditions(commits);
    const totalDeletions = calculateTotalDeletions(commits);
    const commitsByDay = getCommitCountByDate(commits);
    const commitsByAuthor = getCommitCountByAuthor(commits);
    const topRepositories = getTopRepositoriesByCommits(commits, 5);
    
    return {
      totalCommits: commits.length,
      uniqueAuthors: uniqueAuthors.length,
      repositories: uniqueRepositories,
      mostActiveDay,
      averageCommitsPerDay,
      totalAdditions,
      totalDeletions,
      commitsByDay,
      commitsByAuthor,
      topRepositories
    };
  };

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