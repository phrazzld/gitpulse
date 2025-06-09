/**
 * Summary generation logic for GitPulse
 * Pure functions for calculating statistics and generating summaries from commit data
 */

import { pipe } from '../../lib/functional/index';
import { 
  groupCommitsByDate, 
  groupCommitsByAuthor, 
  groupCommitsByRepository,
  extractUniqueAuthors,
  extractUniqueRepositories 
} from '../github/commits';
import type { CommitData, SummaryStats } from '../types/index';

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
 * Find the most active day (day with most commits)
 */
export const findMostActiveDay = 
  (commits: readonly CommitData[]): string => {
    if (commits.length === 0) return '';
    
    return pipe(
      commits,
      groupCommitsByDate,
      Object.entries,
      (entries: [string, CommitData[]][]) => 
        entries.sort(([, commitsA], [, commitsB]) => commitsB.length - commitsA.length),
      (sortedEntries: [string, CommitData[]][]) => sortedEntries[0]?.[0] || ''
    );
  };

/**
 * Calculate average commits per day
 */
export const calculateAverageCommitsPerDay = 
  (commits: readonly CommitData[]): number => {
    if (commits.length === 0) return 0;
    
    return pipe(
      commits,
      groupCommitsByDate,
      Object.keys,
      (uniqueDays: string[]) => uniqueDays.length === 0 ? 0 : commits.length / uniqueDays.length
    );
  };

/**
 * Get top repositories by commit count
 */
export const getTopRepositoriesByCommits = 
  (commits: readonly CommitData[], limit: number = 10): Array<{ name: string; commits: number }> => {
    return pipe(
      commits,
      groupCommitsByRepository,
      Object.entries,
      (entries: [string, CommitData[]][]) => 
        entries.map(([name, repoCommits]) => ({ name, commits: repoCommits.length })),
      (repos: Array<{ name: string; commits: number }>) => 
        repos.sort((a, b) => b.commits - a.commits),
      (sortedRepos: Array<{ name: string; commits: number }>) => 
        sortedRepos.slice(0, limit)
    );
  };

/**
 * Calculate daily commit frequency statistics
 */
export const calculateDailyStats = (commits: readonly CommitData[]) => {
  const commitsByDay = getCommitCountByDate(commits);
  const dailyCounts = Object.values(commitsByDay);
  
  if (dailyCounts.length === 0) {
    return {
      averagePerDay: 0,
      maxPerDay: 0,
      minPerDay: 0,
      totalDays: 0
    };
  }
  
  return {
    averagePerDay: dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length,
    maxPerDay: Math.max(...dailyCounts),
    minPerDay: Math.min(...dailyCounts),
    totalDays: dailyCounts.length
  };
};

/**
 * Calculate author contribution statistics
 */
export const calculateAuthorStats = (commits: readonly CommitData[]) => {
  const commitsByAuthor = getCommitCountByAuthor(commits);
  const authorCounts = Object.values(commitsByAuthor);
  
  if (authorCounts.length === 0) {
    return {
      totalAuthors: 0,
      averageCommitsPerAuthor: 0,
      topAuthor: '',
      authorDistribution: {}
    };
  }
  
  const sortedAuthors = Object.entries(commitsByAuthor)
    .sort(([, a], [, b]) => b - a);
  
  return {
    totalAuthors: authorCounts.length,
    averageCommitsPerAuthor: authorCounts.reduce((sum, count) => sum + count, 0) / authorCounts.length,
    topAuthor: sortedAuthors[0]?.[0] || '',
    authorDistribution: commitsByAuthor
  };
};

/**
 * Calculate repository statistics
 */
export const calculateRepositoryStats = (commits: readonly CommitData[]) => {
  const topRepositories = getTopRepositoriesByCommits(commits);
  const uniqueRepositories = extractUniqueRepositories(commits);
  
  return {
    totalRepositories: uniqueRepositories.length,
    repositories: uniqueRepositories,
    topRepositories,
    repositoryDistribution: topRepositories.reduce((acc, repo) => ({
      ...acc,
      [repo.name]: repo.commits
    }), {} as Record<string, number>)
  };
};

/**
 * Calculate code change statistics
 */
export const calculateCodeChangeStats = (commits: readonly CommitData[]) => {
  const totalAdditions = calculateTotalAdditions(commits);
  const totalDeletions = calculateTotalDeletions(commits);
  const totalChanges = totalAdditions + totalDeletions;
  
  const commitsWithChanges = commits.filter(c => 
    (c.additions !== undefined && c.additions > 0) || 
    (c.deletions !== undefined && c.deletions > 0)
  );
  
  return {
    totalAdditions,
    totalDeletions,
    totalChanges,
    netChanges: totalAdditions - totalDeletions,
    averageAdditionsPerCommit: commitsWithChanges.length > 0 ? totalAdditions / commitsWithChanges.length : 0,
    averageDeletionsPerCommit: commitsWithChanges.length > 0 ? totalDeletions / commitsWithChanges.length : 0,
    commitsWithCodeChanges: commitsWithChanges.length
  };
};

/**
 * Calculate comprehensive summary statistics using functional composition
 */
export const calculateSummaryStats = 
  (commits: readonly CommitData[]): SummaryStats => {
    // Use functional composition to build statistics
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
 * Generate comprehensive analysis with all statistics
 */
export const generateComprehensiveAnalysis = (commits: readonly CommitData[]) => {
  const summaryStats = calculateSummaryStats(commits);
  const dailyStats = calculateDailyStats(commits);
  const authorStats = calculateAuthorStats(commits);
  const repositoryStats = calculateRepositoryStats(commits);
  const codeChangeStats = calculateCodeChangeStats(commits);
  
  return {
    summary: summaryStats,
    daily: dailyStats,
    authors: authorStats,
    repositories: repositoryStats,
    codeChanges: codeChangeStats,
    metadata: {
      generatedAt: new Date(),
      totalCommitsAnalyzed: commits.length,
      analysisVersion: '1.0.0'
    }
  };
};

/**
 * Generate time-series analysis for commits
 */
export const generateTimeSeriesAnalysis = (commits: readonly CommitData[]) => {
  const commitsByDay = getCommitCountByDate(commits);
  const sortedDates = Object.keys(commitsByDay).sort();
  
  if (sortedDates.length === 0) {
    return {
      timeline: [],
      totalDays: 0,
      firstCommitDate: null,
      lastCommitDate: null,
      longestStreak: 0,
      totalActiveDays: 0
    };
  }
  
  const timeline = sortedDates.map(date => ({
    date,
    commits: commitsByDay[date],
    cumulativeCommits: sortedDates
      .slice(0, sortedDates.indexOf(date) + 1)
      .reduce((sum, d) => sum + commitsByDay[d], 0)
  }));
  
  // Calculate longest streak of consecutive days with commits
  let longestStreak = 0;
  let currentStreak = 0;
  
  const allDates = new Set(sortedDates);
  const startDate = new Date(sortedDates[0]);
  const endDate = new Date(sortedDates[sortedDates.length - 1]);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (allDates.has(dateStr)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return {
    timeline,
    totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    firstCommitDate: sortedDates[0],
    lastCommitDate: sortedDates[sortedDates.length - 1],
    longestStreak,
    totalActiveDays: sortedDates.length
  };
};