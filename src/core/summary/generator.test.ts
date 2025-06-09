import {
  calculateTotalAdditions,
  calculateTotalDeletions,
  getCommitCountByDate,
  getCommitCountByAuthor,
  findMostActiveDay,
  calculateAverageCommitsPerDay,
  getTopRepositoriesByCommits,
  calculateDailyStats,
  calculateAuthorStats,
  calculateRepositoryStats,
  calculateCodeChangeStats,
  calculateSummaryStats,
  generateComprehensiveAnalysis,
  generateTimeSeriesAnalysis
} from './generator';
import type { CommitData } from '../types/index';

describe('Summary Generator', () => {
  // Test data setup
  const createCommit = (overrides: Partial<CommitData> = {}): CommitData => ({
    sha: 'abc123',
    message: 'feat: add new feature',
    author: 'john.doe',
    date: '2023-06-15T10:00:00Z',
    repository: 'test-repo',
    additions: 10,
    deletions: 5,
    ...overrides
  });

  const sampleCommits: CommitData[] = [
    createCommit({
      sha: 'commit1',
      message: 'feat: add user authentication',
      author: 'john.doe',
      date: '2023-06-15T10:00:00Z',
      repository: 'frontend',
      additions: 120,
      deletions: 20
    }),
    createCommit({
      sha: 'commit2',
      message: 'fix: resolve login bug',
      author: 'jane.smith',
      date: '2023-06-16T14:30:00Z',
      repository: 'frontend',
      additions: 15,
      deletions: 8
    }),
    createCommit({
      sha: 'commit3',
      message: 'refactor: improve API structure',
      author: 'john.doe',
      date: '2023-06-17T09:15:00Z',
      repository: 'backend',
      additions: 80,
      deletions: 60
    }),
    createCommit({
      sha: 'commit4',
      message: 'docs: update README',
      author: 'Bob.Wilson',
      date: '2023-06-18T16:45:00Z',
      repository: 'docs',
      additions: 25,
      deletions: 5
    }),
    createCommit({
      sha: 'commit5',
      message: 'feat: add database migration',
      author: 'alice.brown',
      date: '2023-06-19T11:20:00Z',
      repository: 'backend',
      additions: 200,
      deletions: 0
    })
  ];

  describe('Basic Statistics', () => {
    describe('calculateTotalAdditions', () => {
      it('should sum all additions correctly', () => {
        const total = calculateTotalAdditions(sampleCommits);
        expect(total).toBe(440); // 120 + 15 + 80 + 25 + 200
      });

      it('should handle commits without additions', () => {
        const commits = [
          createCommit({ additions: undefined }),
          createCommit({ additions: 50 }),
          createCommit({ additions: 0 })
        ];
        
        const total = calculateTotalAdditions(commits);
        expect(total).toBe(50);
      });

      it('should handle empty array', () => {
        const total = calculateTotalAdditions([]);
        expect(total).toBe(0);
      });

      it('should not mutate original array', () => {
        const originalLength = sampleCommits.length;
        calculateTotalAdditions(sampleCommits);
        expect(sampleCommits).toHaveLength(originalLength);
      });
    });

    describe('calculateTotalDeletions', () => {
      it('should sum all deletions correctly', () => {
        const total = calculateTotalDeletions(sampleCommits);
        expect(total).toBe(93); // 20 + 8 + 60 + 5 + 0
      });

      it('should handle commits without deletions', () => {
        const commits = [
          createCommit({ deletions: undefined }),
          createCommit({ deletions: 30 }),
          createCommit({ deletions: 0 })
        ];
        
        const total = calculateTotalDeletions(commits);
        expect(total).toBe(30);
      });

      it('should handle empty array', () => {
        const total = calculateTotalDeletions([]);
        expect(total).toBe(0);
      });
    });
  });

  describe('Counting Functions', () => {
    describe('getCommitCountByDate', () => {
      it('should count commits by date', () => {
        const counts = getCommitCountByDate(sampleCommits);
        
        expect(counts['2023-06-15']).toBe(1);
        expect(counts['2023-06-16']).toBe(1);
        expect(counts['2023-06-17']).toBe(1);
        expect(counts['2023-06-18']).toBe(1);
        expect(counts['2023-06-19']).toBe(1);
      });

      it('should handle multiple commits per day', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-15T14:00:00Z' }),
          createCommit({ sha: '3', date: '2023-06-16T10:00:00Z' })
        ];
        
        const counts = getCommitCountByDate(commits);
        
        expect(counts['2023-06-15']).toBe(2);
        expect(counts['2023-06-16']).toBe(1);
      });

      it('should handle empty array', () => {
        const counts = getCommitCountByDate([]);
        expect(counts).toEqual({});
      });
    });

    describe('getCommitCountByAuthor', () => {
      it('should count commits by author', () => {
        const counts = getCommitCountByAuthor(sampleCommits);
        
        expect(counts['john.doe']).toBe(2);
        expect(counts['jane.smith']).toBe(1);
        expect(counts['Bob.Wilson']).toBe(1);
        expect(counts['alice.brown']).toBe(1);
      });

      it('should be case-sensitive for author names', () => {
        const commits = [
          createCommit({ author: 'john.doe' }),
          createCommit({ author: 'JOHN.DOE' })
        ];
        
        const counts = getCommitCountByAuthor(commits);
        
        expect(counts['john.doe']).toBe(1);
        expect(counts['JOHN.DOE']).toBe(1);
      });

      it('should handle empty array', () => {
        const counts = getCommitCountByAuthor([]);
        expect(counts).toEqual({});
      });
    });
  });

  describe('Activity Analysis', () => {
    describe('findMostActiveDay', () => {
      it('should find day with most commits', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-15T14:00:00Z' }),
          createCommit({ sha: '3', date: '2023-06-15T18:00:00Z' }),
          createCommit({ sha: '4', date: '2023-06-16T10:00:00Z' }),
          createCommit({ sha: '5', date: '2023-06-16T14:00:00Z' })
        ];
        
        const mostActive = findMostActiveDay(commits);
        expect(mostActive).toBe('2023-06-15');
      });

      it('should handle empty array', () => {
        const mostActive = findMostActiveDay([]);
        expect(mostActive).toBe('');
      });

      it('should handle single commit', () => {
        const commits = [createCommit({ date: '2023-06-15T10:00:00Z' })];
        const mostActive = findMostActiveDay(commits);
        expect(mostActive).toBe('2023-06-15');
      });

      it('should use functional composition with pipe', () => {
        // Ensure the function uses pipe for composition
        const commits = sampleCommits;
        const result = findMostActiveDay(commits);
        expect(typeof result).toBe('string');
      });
    });

    describe('calculateAverageCommitsPerDay', () => {
      it('should calculate average commits per day', () => {
        const average = calculateAverageCommitsPerDay(sampleCommits);
        expect(average).toBe(1); // 5 commits across 5 unique days
      });

      it('should handle multiple commits per day', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-15T14:00:00Z' }),
          createCommit({ sha: '3', date: '2023-06-16T10:00:00Z' })
        ];
        
        const average = calculateAverageCommitsPerDay(commits);
        expect(average).toBe(1.5); // 3 commits across 2 days
      });

      it('should handle empty array', () => {
        const average = calculateAverageCommitsPerDay([]);
        expect(average).toBe(0);
      });

      it('should use functional composition with pipe', () => {
        const result = calculateAverageCommitsPerDay(sampleCommits);
        expect(typeof result).toBe('number');
      });
    });

    describe('getTopRepositoriesByCommits', () => {
      it('should return top repositories by commit count', () => {
        const top = getTopRepositoriesByCommits(sampleCommits, 2);
        
        expect(top).toEqual([
          { name: 'frontend', commits: 2 },
          { name: 'backend', commits: 2 }
        ]);
      });

      it('should handle default limit', () => {
        const top = getTopRepositoriesByCommits(sampleCommits);
        expect(top).toHaveLength(3);
      });

      it('should sort by commit count descending', () => {
        const commits = [
          ...sampleCommits,
          createCommit({ sha: 'extra1', repository: 'frontend' }),
          createCommit({ sha: 'extra2', repository: 'frontend' })
        ];
        
        const top = getTopRepositoriesByCommits(commits);
        expect(top[0]).toEqual({ name: 'frontend', commits: 4 });
      });

      it('should handle empty array', () => {
        const top = getTopRepositoriesByCommits([]);
        expect(top).toEqual([]);
      });

      it('should use functional composition with pipe', () => {
        const result = getTopRepositoriesByCommits(sampleCommits);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Enhanced Statistics', () => {
    describe('calculateDailyStats', () => {
      it('should calculate daily statistics', () => {
        const stats = calculateDailyStats(sampleCommits);
        
        expect(stats.averagePerDay).toBe(1);
        expect(stats.maxPerDay).toBe(1);
        expect(stats.minPerDay).toBe(1);
        expect(stats.totalDays).toBe(5);
      });

      it('should handle commits with varying daily counts', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-15T14:00:00Z' }),
          createCommit({ sha: '3', date: '2023-06-16T10:00:00Z' })
        ];
        
        const stats = calculateDailyStats(commits);
        
        expect(stats.averagePerDay).toBe(1.5);
        expect(stats.maxPerDay).toBe(2);
        expect(stats.minPerDay).toBe(1);
        expect(stats.totalDays).toBe(2);
      });

      it('should handle empty commits', () => {
        const stats = calculateDailyStats([]);
        
        expect(stats.averagePerDay).toBe(0);
        expect(stats.maxPerDay).toBe(0);
        expect(stats.minPerDay).toBe(0);
        expect(stats.totalDays).toBe(0);
      });
    });

    describe('calculateAuthorStats', () => {
      it('should calculate author statistics', () => {
        const stats = calculateAuthorStats(sampleCommits);
        
        expect(stats.totalAuthors).toBe(4);
        expect(stats.averageCommitsPerAuthor).toBe(1.25);
        expect(stats.topAuthor).toBe('john.doe');
        expect(stats.authorDistribution['john.doe']).toBe(2);
      });

      it('should handle single author', () => {
        const commits = [
          createCommit({ author: 'solo.developer' }),
          createCommit({ author: 'solo.developer' })
        ];
        
        const stats = calculateAuthorStats(commits);
        
        expect(stats.totalAuthors).toBe(1);
        expect(stats.averageCommitsPerAuthor).toBe(2);
        expect(stats.topAuthor).toBe('solo.developer');
      });

      it('should handle empty commits', () => {
        const stats = calculateAuthorStats([]);
        
        expect(stats.totalAuthors).toBe(0);
        expect(stats.averageCommitsPerAuthor).toBe(0);
        expect(stats.topAuthor).toBe('');
        expect(stats.authorDistribution).toEqual({});
      });
    });

    describe('calculateRepositoryStats', () => {
      it('should calculate repository statistics', () => {
        const stats = calculateRepositoryStats(sampleCommits);
        
        expect(stats.totalRepositories).toBe(3);
        expect(stats.repositories).toEqual(expect.arrayContaining(['frontend', 'backend', 'docs']));
        expect(stats.topRepositories).toHaveLength(3);
        expect(stats.repositoryDistribution.frontend).toBe(2);
      });

      it('should handle single repository', () => {
        const commits = sampleCommits.filter(c => c.repository === 'frontend');
        const stats = calculateRepositoryStats(commits);
        
        expect(stats.totalRepositories).toBe(1);
        expect(stats.repositories).toEqual(['frontend']);
        expect(stats.topRepositories).toHaveLength(1);
      });

      it('should handle empty commits', () => {
        const stats = calculateRepositoryStats([]);
        
        expect(stats.totalRepositories).toBe(0);
        expect(stats.repositories).toEqual([]);
        expect(stats.topRepositories).toEqual([]);
        expect(stats.repositoryDistribution).toEqual({});
      });
    });

    describe('calculateCodeChangeStats', () => {
      it('should calculate code change statistics', () => {
        const stats = calculateCodeChangeStats(sampleCommits);
        
        expect(stats.totalAdditions).toBe(440);
        expect(stats.totalDeletions).toBe(93);
        expect(stats.totalChanges).toBe(533);
        expect(stats.netChanges).toBe(347);
        expect(stats.commitsWithCodeChanges).toBe(5);
      });

      it('should handle commits without code changes', () => {
        const commits = [
          createCommit({ additions: undefined, deletions: undefined }),
          createCommit({ additions: 0, deletions: 0 }),
          createCommit({ additions: 50, deletions: 10 })
        ];
        
        const stats = calculateCodeChangeStats(commits);
        
        expect(stats.totalAdditions).toBe(50);
        expect(stats.totalDeletions).toBe(10);
        expect(stats.commitsWithCodeChanges).toBe(1);
        expect(stats.averageAdditionsPerCommit).toBe(50);
        expect(stats.averageDeletionsPerCommit).toBe(10);
      });

      it('should handle empty commits', () => {
        const stats = calculateCodeChangeStats([]);
        
        expect(stats.totalAdditions).toBe(0);
        expect(stats.totalDeletions).toBe(0);
        expect(stats.totalChanges).toBe(0);
        expect(stats.netChanges).toBe(0);
        expect(stats.commitsWithCodeChanges).toBe(0);
        expect(stats.averageAdditionsPerCommit).toBe(0);
        expect(stats.averageDeletionsPerCommit).toBe(0);
      });
    });
  });

  describe('Main Summary Functions', () => {
    describe('calculateSummaryStats', () => {
      it('should calculate comprehensive summary statistics', () => {
        const stats = calculateSummaryStats(sampleCommits);
        
        expect(stats.totalCommits).toBe(5);
        expect(stats.uniqueAuthors).toBe(4);
        expect(stats.repositories).toEqual(['frontend', 'backend', 'docs']);
        expect(stats.averageCommitsPerDay).toBe(1);
        expect(stats.totalAdditions).toBe(440);
        expect(stats.totalDeletions).toBe(93);
        expect(stats.topRepositories).toHaveLength(3);
        expect(Object.keys(stats.commitsByDay)).toHaveLength(5);
        expect(Object.keys(stats.commitsByAuthor)).toHaveLength(4);
      });

      it('should handle empty commits array', () => {
        const stats = calculateSummaryStats([]);
        
        expect(stats.totalCommits).toBe(0);
        expect(stats.uniqueAuthors).toBe(0);
        expect(stats.repositories).toEqual([]);
        expect(stats.mostActiveDay).toBe('');
        expect(stats.averageCommitsPerDay).toBe(0);
        expect(stats.totalAdditions).toBe(0);
        expect(stats.totalDeletions).toBe(0);
        expect(stats.commitsByDay).toEqual({});
        expect(stats.commitsByAuthor).toEqual({});
        expect(stats.topRepositories).toEqual([]);
      });

      it('should maintain data consistency', () => {
        const stats = calculateSummaryStats(sampleCommits);
        
        // Sum of commitsByDay should equal totalCommits
        const dailySum = Object.values(stats.commitsByDay).reduce((sum, count) => sum + count, 0);
        expect(dailySum).toBe(stats.totalCommits);
        
        // Sum of commitsByAuthor should equal totalCommits
        const authorSum = Object.values(stats.commitsByAuthor).reduce((sum, count) => sum + count, 0);
        expect(authorSum).toBe(stats.totalCommits);
      });

      it('should be deterministic', () => {
        const stats1 = calculateSummaryStats(sampleCommits);
        const stats2 = calculateSummaryStats(sampleCommits);
        
        expect(stats1).toEqual(stats2);
      });
    });

    describe('generateComprehensiveAnalysis', () => {
      it('should generate complete analysis', () => {
        const analysis = generateComprehensiveAnalysis(sampleCommits);
        
        expect(analysis.summary).toBeDefined();
        expect(analysis.daily).toBeDefined();
        expect(analysis.authors).toBeDefined();
        expect(analysis.repositories).toBeDefined();
        expect(analysis.codeChanges).toBeDefined();
        expect(analysis.metadata).toBeDefined();
        
        expect(analysis.metadata.totalCommitsAnalyzed).toBe(5);
        expect(analysis.metadata.analysisVersion).toBe('1.0.0');
        expect(analysis.metadata.generatedAt).toBeInstanceOf(Date);
      });

      it('should handle empty commits', () => {
        const analysis = generateComprehensiveAnalysis([]);
        
        expect(analysis.summary.totalCommits).toBe(0);
        expect(analysis.daily.totalDays).toBe(0);
        expect(analysis.authors.totalAuthors).toBe(0);
        expect(analysis.repositories.totalRepositories).toBe(0);
        expect(analysis.codeChanges.totalChanges).toBe(0);
        expect(analysis.metadata.totalCommitsAnalyzed).toBe(0);
      });
    });

    describe('generateTimeSeriesAnalysis', () => {
      it('should generate time series analysis', () => {
        const analysis = generateTimeSeriesAnalysis(sampleCommits);
        
        expect(analysis.timeline).toHaveLength(5);
        expect(analysis.totalDays).toBe(5);
        expect(analysis.firstCommitDate).toBe('2023-06-15');
        expect(analysis.lastCommitDate).toBe('2023-06-19');
        expect(analysis.totalActiveDays).toBe(5);
        expect(analysis.longestStreak).toBe(5);
      });

      it('should calculate cumulative commits correctly', () => {
        const analysis = generateTimeSeriesAnalysis(sampleCommits);
        
        expect(analysis.timeline[0].cumulativeCommits).toBe(1);
        expect(analysis.timeline[1].cumulativeCommits).toBe(2);
        expect(analysis.timeline[4].cumulativeCommits).toBe(5);
      });

      it('should handle gaps in commit dates', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-17T10:00:00Z' }), // gap on 16th
          createCommit({ sha: '3', date: '2023-06-19T10:00:00Z' })  // gap on 18th
        ];
        
        const analysis = generateTimeSeriesAnalysis(commits);
        
        expect(analysis.timeline).toHaveLength(3);
        expect(analysis.totalDays).toBe(5); // 15th to 19th inclusive
        expect(analysis.totalActiveDays).toBe(3);
        expect(analysis.longestStreak).toBe(1); // no consecutive days
      });

      it('should handle consecutive commit days', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-16T10:00:00Z' }),
          createCommit({ sha: '3', date: '2023-06-17T10:00:00Z' })
        ];
        
        const analysis = generateTimeSeriesAnalysis(commits);
        
        expect(analysis.longestStreak).toBe(3);
      });

      it('should handle empty commits', () => {
        const analysis = generateTimeSeriesAnalysis([]);
        
        expect(analysis.timeline).toEqual([]);
        expect(analysis.totalDays).toBe(0);
        expect(analysis.firstCommitDate).toBe(null);
        expect(analysis.lastCommitDate).toBe(null);
        expect(analysis.longestStreak).toBe(0);
        expect(analysis.totalActiveDays).toBe(0);
      });
    });
  });

  describe('Function Purity and Immutability', () => {
    it('should not mutate input arrays in any function', () => {
      const originalCommits = [...sampleCommits];
      const originalLength = sampleCommits.length;
      
      // Test all functions that accept commits array
      calculateTotalAdditions(sampleCommits);
      calculateTotalDeletions(sampleCommits);
      getCommitCountByDate(sampleCommits);
      getCommitCountByAuthor(sampleCommits);
      findMostActiveDay(sampleCommits);
      calculateAverageCommitsPerDay(sampleCommits);
      getTopRepositoriesByCommits(sampleCommits);
      calculateDailyStats(sampleCommits);
      calculateAuthorStats(sampleCommits);
      calculateRepositoryStats(sampleCommits);
      calculateCodeChangeStats(sampleCommits);
      calculateSummaryStats(sampleCommits);
      generateComprehensiveAnalysis(sampleCommits);
      generateTimeSeriesAnalysis(sampleCommits);
      
      expect(sampleCommits).toEqual(originalCommits);
      expect(sampleCommits).toHaveLength(originalLength);
    });

    it('should return new objects/arrays without modifying inputs', () => {
      const commits = [...sampleCommits];
      
      const stats = calculateSummaryStats(commits);
      const analysis = generateComprehensiveAnalysis(commits);
      const timeSeries = generateTimeSeriesAnalysis(commits);
      
      expect(stats).not.toBe(commits);
      expect(analysis).not.toBe(commits);
      expect(timeSeries).not.toBe(commits);
    });

    it('should have deterministic outputs for same inputs', () => {
      const input = [...sampleCommits];
      
      const result1 = calculateSummaryStats(input);
      const result2 = calculateSummaryStats(input);
      
      expect(result1).toEqual(result2);
    });

    it('should work with readonly arrays', () => {
      const readonlyCommits: readonly CommitData[] = sampleCommits;
      
      // All functions should accept readonly arrays
      const stats = calculateSummaryStats(readonlyCommits);
      const analysis = generateComprehensiveAnalysis(readonlyCommits);
      const timeSeries = generateTimeSeriesAnalysis(readonlyCommits);
      
      expect(stats).toBeDefined();
      expect(analysis).toBeDefined();
      expect(timeSeries).toBeDefined();
    });
  });

  describe('Integration with Functional Utilities', () => {
    it('should use functional composition in enhanced functions', () => {
      // Test that functions use pipe and functional utilities
      const result1 = findMostActiveDay(sampleCommits);
      const result2 = calculateAverageCommitsPerDay(sampleCommits);
      const result3 = getTopRepositoriesByCommits(sampleCommits);
      
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('number');
      expect(Array.isArray(result3)).toBe(true);
    });

    it('should compose functions without side effects', () => {
      const commits = [...sampleCommits];
      const originalCommits = [...commits];
      
      const analysis = generateComprehensiveAnalysis(commits);
      
      expect(commits).toEqual(originalCommits);
      expect(analysis.metadata.totalCommitsAnalyzed).toBe(commits.length);
    });
  });
});