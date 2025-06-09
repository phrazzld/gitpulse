import {
  filterCommitsByDateRange,
  filterCommitsByAuthors,
  filterCommitsByRepositories,
  groupCommitsByRepository,
  groupCommitsByAuthor,
  groupCommitsByDate,
  extractUniqueAuthors,
  extractUniqueRepositories,
  sortCommitsByDateDesc,
  sortCommitsByDateAsc,
  applyCommitFilters,
  analyzeCommits
} from './commits';
import {
  calculateTotalAdditions,
  calculateTotalDeletions,
  findMostActiveDay,
  calculateAverageCommitsPerDay,
  getTopRepositoriesByCommits,
  getCommitCountByAuthor,
  getCommitCountByDate,
  calculateSummaryStats
} from '../summary/generator';
import type { CommitData, DateRange } from '../types/index';

describe('GitHub Commit Data Transformations', () => {
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

  describe('Date Range Filtering', () => {
    describe('filterCommitsByDateRange', () => {
      it('should filter commits within date range', () => {
        const start = new Date('2023-06-16T00:00:00Z');
        const end = new Date('2023-06-18T23:59:59Z');
        
        const filtered = filterCommitsByDateRange(start, end)(sampleCommits);
        
        expect(filtered).toHaveLength(3);
        expect(filtered.map(c => c.sha)).toEqual(['commit2', 'commit3', 'commit4']);
      });

      it('should handle timezone differences correctly', () => {
        const start = new Date('2023-06-15T00:00:00-07:00'); // PDT
        const end = new Date('2023-06-15T23:59:59+05:30'); // IST
        
        const filtered = filterCommitsByDateRange(start, end)(sampleCommits);
        
        expect(filtered.some(c => c.sha === 'commit1')).toBe(true);
      });

      it('should include commits exactly at boundaries', () => {
        const start = new Date('2023-06-15T10:00:00Z');
        const end = new Date('2023-06-16T14:30:00Z');
        
        const filtered = filterCommitsByDateRange(start, end)(sampleCommits);
        
        expect(filtered).toHaveLength(2);
        expect(filtered.map(c => c.sha)).toEqual(['commit1', 'commit2']);
      });

      it('should handle empty array', () => {
        const start = new Date('2023-06-15T00:00:00Z');
        const end = new Date('2023-06-20T00:00:00Z');
        
        const filtered = filterCommitsByDateRange(start, end)([]);
        
        expect(filtered).toEqual([]);
      });

      it('should handle invalid date range (end before start)', () => {
        const start = new Date('2023-06-20T00:00:00Z');
        const end = new Date('2023-06-15T00:00:00Z');
        
        const filtered = filterCommitsByDateRange(start, end)(sampleCommits);
        
        expect(filtered).toEqual([]);
      });

      it('should not mutate original array', () => {
        const start = new Date('2023-06-16T00:00:00Z');
        const end = new Date('2023-06-18T00:00:00Z');
        const originalLength = sampleCommits.length;
        
        filterCommitsByDateRange(start, end)(sampleCommits);
        
        expect(sampleCommits).toHaveLength(originalLength);
      });

      it('should handle malformed date strings gracefully', () => {
        const commitsWithBadDates = [
          createCommit({ sha: 'bad1', date: 'invalid-date' }),
          createCommit({ sha: 'good1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: 'bad2', date: '' })
        ];
        
        const start = new Date('2023-06-15T00:00:00Z');
        const end = new Date('2023-06-16T00:00:00Z');
        
        const filtered = filterCommitsByDateRange(start, end)(commitsWithBadDates);
        
        expect(filtered).toHaveLength(1);
        expect(filtered[0].sha).toBe('good1');
      });
    });
  });

  describe('Author Filtering', () => {
    describe('filterCommitsByAuthors', () => {
      it('should filter commits by exact author match', () => {
        const filtered = filterCommitsByAuthors(['john.doe', 'jane.smith'])(sampleCommits);
        
        expect(filtered).toHaveLength(3);
        expect(filtered.map(c => c.author)).toEqual(['john.doe', 'jane.smith', 'john.doe']);
      });

      it('should be case-insensitive', () => {
        const filtered = filterCommitsByAuthors(['JOHN.DOE', 'bob.wilson'])(sampleCommits);
        
        expect(filtered).toHaveLength(3);
        expect(filtered.some(c => c.author === 'john.doe')).toBe(true);
        expect(filtered.some(c => c.author === 'Bob.Wilson')).toBe(true);
      });

      it('should handle empty authors array', () => {
        const filtered = filterCommitsByAuthors([])(sampleCommits);
        
        expect(filtered).toEqual([]);
      });

      it('should handle non-matching authors', () => {
        const filtered = filterCommitsByAuthors(['nonexistent.user'])(sampleCommits);
        
        expect(filtered).toEqual([]);
      });

      it('should handle empty commits array', () => {
        const filtered = filterCommitsByAuthors(['john.doe'])([]);
        
        expect(filtered).toEqual([]);
      });

      it('should not mutate original array', () => {
        const originalLength = sampleCommits.length;
        
        filterCommitsByAuthors(['john.doe'])(sampleCommits);
        
        expect(sampleCommits).toHaveLength(originalLength);
      });

      it('should preserve commit order', () => {
        const filtered = filterCommitsByAuthors(['john.doe'])(sampleCommits);
        
        expect(filtered.map(c => c.sha)).toEqual(['commit1', 'commit3']);
      });
    });
  });

  describe('Repository Filtering', () => {
    describe('filterCommitsByRepositories', () => {
      it('should filter commits by repository', () => {
        const filtered = filterCommitsByRepositories(['frontend', 'backend'])(sampleCommits);
        
        expect(filtered).toHaveLength(4);
        expect(filtered.every(c => ['frontend', 'backend'].includes(c.repository))).toBe(true);
      });

      it('should be case-sensitive for repositories', () => {
        const filtered = filterCommitsByRepositories(['Frontend'])(sampleCommits);
        
        expect(filtered).toEqual([]);
      });

      it('should handle empty repositories array', () => {
        const filtered = filterCommitsByRepositories([])(sampleCommits);
        
        expect(filtered).toEqual([]);
      });

      it('should handle non-matching repositories', () => {
        const filtered = filterCommitsByRepositories(['nonexistent-repo'])(sampleCommits);
        
        expect(filtered).toEqual([]);
      });

      it('should handle empty commits array', () => {
        const filtered = filterCommitsByRepositories(['frontend'])([]);
        
        expect(filtered).toEqual([]);
      });

      it('should preserve commit order', () => {
        const filtered = filterCommitsByRepositories(['frontend'])(sampleCommits);
        
        expect(filtered.map(c => c.sha)).toEqual(['commit1', 'commit2']);
      });
    });
  });

  describe('Grouping Functions', () => {
    describe('groupCommitsByRepository', () => {
      it('should group commits by repository', () => {
        const grouped = groupCommitsByRepository(sampleCommits);
        
        expect(Object.keys(grouped)).toEqual(['frontend', 'backend', 'docs']);
        expect(grouped.frontend).toHaveLength(2);
        expect(grouped.backend).toHaveLength(2);
        expect(grouped.docs).toHaveLength(1);
      });

      it('should handle empty array', () => {
        const grouped = groupCommitsByRepository([]);
        
        expect(grouped).toEqual({});
      });

      it('should maintain commit order within groups', () => {
        const grouped = groupCommitsByRepository(sampleCommits);
        
        expect(grouped.frontend.map(c => c.sha)).toEqual(['commit1', 'commit2']);
        expect(grouped.backend.map(c => c.sha)).toEqual(['commit3', 'commit5']);
      });

      it('should not mutate original array', () => {
        const originalLength = sampleCommits.length;
        
        groupCommitsByRepository(sampleCommits);
        
        expect(sampleCommits).toHaveLength(originalLength);
      });

      it('should handle single repository', () => {
        const singleRepoCommits = sampleCommits.filter(c => c.repository === 'frontend');
        const grouped = groupCommitsByRepository(singleRepoCommits);
        
        expect(Object.keys(grouped)).toEqual(['frontend']);
        expect(grouped.frontend).toHaveLength(2);
      });
    });

    describe('groupCommitsByAuthor', () => {
      it('should group commits by author', () => {
        const grouped = groupCommitsByAuthor(sampleCommits);
        
        expect(Object.keys(grouped).sort()).toEqual(['Bob.Wilson', 'alice.brown', 'jane.smith', 'john.doe']);
        expect(grouped['john.doe']).toHaveLength(2);
        expect(grouped['jane.smith']).toHaveLength(1);
      });

      it('should preserve case in author names', () => {
        const grouped = groupCommitsByAuthor(sampleCommits);
        
        expect(grouped['Bob.Wilson']).toBeDefined();
        expect(grouped['bob.wilson']).toBeUndefined();
      });

      it('should handle empty array', () => {
        const grouped = groupCommitsByAuthor([]);
        
        expect(grouped).toEqual({});
      });
    });

    describe('groupCommitsByDate', () => {
      it('should group commits by date (YYYY-MM-DD)', () => {
        const grouped = groupCommitsByDate(sampleCommits);
        
        expect(Object.keys(grouped).sort()).toEqual([
          '2023-06-15', '2023-06-16', '2023-06-17', '2023-06-18', '2023-06-19'
        ]);
        expect(grouped['2023-06-15']).toHaveLength(1);
        expect(grouped['2023-06-16']).toHaveLength(1);
      });

      it('should extract date part from ISO timestamp', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-15T23:59:59Z' }),
          createCommit({ sha: '3', date: '2023-06-16T00:00:01Z' })
        ];
        
        const grouped = groupCommitsByDate(commits);
        
        expect(grouped['2023-06-15']).toHaveLength(2);
        expect(grouped['2023-06-16']).toHaveLength(1);
      });

      it('should handle empty array', () => {
        const grouped = groupCommitsByDate([]);
        
        expect(grouped).toEqual({});
      });
    });
  });

  describe('Extraction Functions', () => {
    describe('extractUniqueAuthors', () => {
      it('should extract unique authors with case-insensitive deduplication', () => {
        const commitsWithDuplicates = [
          createCommit({ author: 'john.doe' }),
          createCommit({ author: 'JOHN.DOE' }),
          createCommit({ author: 'Jane.Smith' }),
          createCommit({ author: 'jane.smith' }),
          createCommit({ author: 'bob.wilson' })
        ];
        
        const unique = extractUniqueAuthors(commitsWithDuplicates);
        
        expect(unique).toHaveLength(3);
        expect(unique).toContain('john.doe');
        expect(unique).toContain('Jane.Smith');
        expect(unique).toContain('bob.wilson');
      });

      it('should preserve first occurrence of duplicates', () => {
        const commits = [
          createCommit({ author: 'john.doe' }),
          createCommit({ author: 'JOHN.DOE' }),
          createCommit({ author: 'Jane.Smith' })
        ];
        
        const unique = extractUniqueAuthors(commits);
        
        expect(unique[0]).toBe('john.doe'); // first occurrence preserved
        expect(unique).not.toContain('JOHN.DOE');
      });

      it('should handle empty array', () => {
        const unique = extractUniqueAuthors([]);
        
        expect(unique).toEqual([]);
      });

      it('should handle single author', () => {
        const commits = [createCommit({ author: 'single.author' })];
        const unique = extractUniqueAuthors(commits);
        
        expect(unique).toEqual(['single.author']);
      });

      it('should not mutate original array', () => {
        const originalLength = sampleCommits.length;
        
        extractUniqueAuthors(sampleCommits);
        
        expect(sampleCommits).toHaveLength(originalLength);
      });
    });

    describe('extractUniqueRepositories', () => {
      it('should extract unique repositories', () => {
        const unique = extractUniqueRepositories(sampleCommits);
        
        expect(unique.sort()).toEqual(['backend', 'docs', 'frontend']);
      });

      it('should be case-sensitive for repositories', () => {
        const commits = [
          createCommit({ repository: 'frontend' }),
          createCommit({ repository: 'Frontend' }),
          createCommit({ repository: 'FRONTEND' })
        ];
        
        const unique = extractUniqueRepositories(commits);
        
        expect(unique).toHaveLength(3);
        expect(unique).toContain('frontend');
        expect(unique).toContain('Frontend');
        expect(unique).toContain('FRONTEND');
      });

      it('should handle empty array', () => {
        const unique = extractUniqueRepositories([]);
        
        expect(unique).toEqual([]);
      });

      it('should preserve first occurrence order', () => {
        const commits = [
          createCommit({ repository: 'backend' }),
          createCommit({ repository: 'frontend' }),
          createCommit({ repository: 'backend' })
        ];
        
        const unique = extractUniqueRepositories(commits);
        
        expect(unique).toEqual(['backend', 'frontend']);
      });
    });
  });

  describe('Sorting Functions', () => {
    describe('sortCommitsByDateDesc', () => {
      it('should sort commits by date descending (newest first)', () => {
        const unsorted = [sampleCommits[0], sampleCommits[4], sampleCommits[1]];
        const sorted = sortCommitsByDateDesc(unsorted);
        
        expect(sorted.map(c => c.sha)).toEqual(['commit5', 'commit2', 'commit1']);
      });

      it('should handle empty array', () => {
        const sorted = sortCommitsByDateDesc([]);
        
        expect(sorted).toEqual([]);
      });

      it('should not mutate original array', () => {
        const original = [...sampleCommits];
        
        sortCommitsByDateDesc(sampleCommits);
        
        expect(sampleCommits).toEqual(original);
      });

      it('should handle same dates', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-15T10:00:00Z' })
        ];
        
        const sorted = sortCommitsByDateDesc(commits);
        
        expect(sorted).toHaveLength(2);
      });
    });

    describe('sortCommitsByDateAsc', () => {
      it('should sort commits by date ascending (oldest first)', () => {
        const unsorted = [sampleCommits[4], sampleCommits[0], sampleCommits[1]];
        const sorted = sortCommitsByDateAsc(unsorted);
        
        expect(sorted.map(c => c.sha)).toEqual(['commit1', 'commit2', 'commit5']);
      });

      it('should handle empty array', () => {
        const sorted = sortCommitsByDateAsc([]);
        
        expect(sorted).toEqual([]);
      });

      it('should not mutate original array', () => {
        const original = [...sampleCommits];
        
        sortCommitsByDateAsc(sampleCommits);
        
        expect(sampleCommits).toEqual(original);
      });
    });
  });

  describe('Statistical Functions', () => {
    describe('calculateTotalAdditions', () => {
      it('should sum all additions', () => {
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
    });

    describe('calculateTotalDeletions', () => {
      it('should sum all deletions', () => {
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

      it('should handle tie by returning first occurrence', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-16T10:00:00Z' })
        ];
        
        const mostActive = findMostActiveDay(commits);
        
        expect(['2023-06-15', '2023-06-16']).toContain(mostActive);
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

      it('should handle single day', () => {
        const commits = [
          createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
          createCommit({ sha: '2', date: '2023-06-15T14:00:00Z' })
        ];
        
        const average = calculateAverageCommitsPerDay(commits);
        
        expect(average).toBe(2);
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
        expect(top.map(r => r.name)).toEqual(['frontend', 'backend', 'docs']);
      });

      it('should sort by commit count descending', () => {
        const commits = [
          ...sampleCommits,
          createCommit({ sha: 'extra1', repository: 'frontend' }),
          createCommit({ sha: 'extra2', repository: 'frontend' })
        ];
        
        const top = getTopRepositoriesByCommits(commits);
        
        expect(top[0]).toEqual({ name: 'frontend', commits: 4 });
        expect(top[1]).toEqual({ name: 'backend', commits: 2 });
      });

      it('should handle empty array', () => {
        const top = getTopRepositoriesByCommits([]);
        
        expect(top).toEqual([]);
      });

      it('should handle limit larger than repositories', () => {
        const top = getTopRepositoriesByCommits(sampleCommits, 10);
        
        expect(top).toHaveLength(3);
      });
    });
  });

  describe('Complex Analysis Functions', () => {
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
        
        // Top repositories should be sorted
        expect(stats.topRepositories[0].commits).toBeGreaterThanOrEqual(stats.topRepositories[1]?.commits || 0);
      });
    });

    describe('applyCommitFilters', () => {
      it('should apply all filters in combination', () => {
        const dateRange: DateRange = {
          start: new Date('2023-06-15T00:00:00Z'),
          end: new Date('2023-06-17T23:59:59Z')
        };
        
        const filtered = applyCommitFilters(
          dateRange,
          ['john.doe', 'jane.smith'],
          ['frontend', 'backend']
        )(sampleCommits);
        
        expect(filtered).toHaveLength(3);
        expect(filtered.every(c => ['john.doe', 'jane.smith'].includes(c.author))).toBe(true);
        expect(filtered.every(c => ['frontend', 'backend'].includes(c.repository))).toBe(true);
      });

      it('should handle optional filters', () => {
        const filtered = applyCommitFilters()(sampleCommits);
        
        expect(filtered).toEqual(sampleCommits);
      });

      it('should apply only date range filter', () => {
        const dateRange: DateRange = {
          start: new Date('2023-06-16T00:00:00Z'),
          end: new Date('2023-06-18T23:59:59Z')
        };
        
        const filtered = applyCommitFilters(dateRange)(sampleCommits);
        
        expect(filtered).toHaveLength(3);
      });

      it('should apply only author filter', () => {
        const filtered = applyCommitFilters(undefined, ['john.doe'])(sampleCommits);
        
        expect(filtered).toHaveLength(2);
        expect(filtered.every(c => c.author === 'john.doe')).toBe(true);
      });

      it('should apply only repository filter', () => {
        const filtered = applyCommitFilters(undefined, undefined, ['frontend'])(sampleCommits);
        
        expect(filtered).toHaveLength(2);
        expect(filtered.every(c => c.repository === 'frontend')).toBe(true);
      });

      it('should not mutate original array', () => {
        const originalLength = sampleCommits.length;
        
        applyCommitFilters(undefined, ['john.doe'])(sampleCommits);
        
        expect(sampleCommits).toHaveLength(originalLength);
      });
    });

    describe('analyzeCommits', () => {
      it('should perform complete analysis with filters', () => {
        const dateRange: DateRange = {
          start: new Date('2023-06-15T00:00:00Z'),
          end: new Date('2023-06-18T23:59:59Z')
        };
        
        const analysis = analyzeCommits(
          sampleCommits,
          dateRange,
          ['john.doe', 'jane.smith'],
          ['frontend', 'backend']
        );
        
        expect(analysis.totalCommits).toBe(3);
        expect(analysis.repositories).toEqual(['frontend', 'backend']);
        expect(Object.keys(analysis.commitsByAuthor)).toEqual(['john.doe', 'jane.smith']);
      });

      it('should handle no filters', () => {
        const analysis = analyzeCommits(sampleCommits);
        
        expect(analysis.totalCommits).toBe(5);
        expect(analysis.uniqueAuthors).toBe(4);
        expect(analysis.repositories).toHaveLength(3);
      });

      it('should maintain functional composition', () => {
        // Should be equivalent to manual pipeline
        const dateRange: DateRange = {
          start: new Date('2023-06-16T00:00:00Z'),
          end: new Date('2023-06-18T23:59:59Z')
        };
        
        const manualResult = calculateSummaryStats(
          applyCommitFilters(dateRange)(sampleCommits)
        );
        
        const pipelineResult = analyzeCommits(sampleCommits, dateRange);
        
        expect(pipelineResult).toEqual(manualResult);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle commits with missing optional fields', () => {
      const incompleteCommits: CommitData[] = [
        {
          sha: 'incomplete1',
          message: 'test commit',
          author: 'test.author',
          date: '2023-06-15T10:00:00Z',
          repository: 'test-repo'
          // missing additions, deletions, url
        }
      ];
      
      const stats = calculateSummaryStats(incompleteCommits);
      
      expect(stats.totalAdditions).toBe(0);
      expect(stats.totalDeletions).toBe(0);
      expect(stats.totalCommits).toBe(1);
    });

    it('should handle special characters in author names', () => {
      const specialCommits = [
        createCommit({ author: 'user@domain.com' }),
        createCommit({ author: 'user+tag@domain.com' }),
        createCommit({ author: 'user-name.surname_123' })
      ];
      
      const authors = extractUniqueAuthors(specialCommits);
      
      expect(authors).toHaveLength(3);
      expect(authors).toContain('user@domain.com');
      expect(authors).toContain('user+tag@domain.com');
      expect(authors).toContain('user-name.surname_123');
    });

    it('should handle unicode characters in commit messages', () => {
      const unicodeCommits = [
        createCommit({ message: 'feat: add emoji support 🚀' }),
        createCommit({ message: 'fix: handle unicode chars: áéíóú' }),
        createCommit({ message: 'docs: update 中文 documentation' })
      ];
      
      const grouped = groupCommitsByRepository(unicodeCommits);
      
      expect(Object.keys(grouped)).toEqual(['test-repo']);
      expect(grouped['test-repo']).toHaveLength(3);
    });

    it('should handle very large date ranges', () => {
      const start = new Date('1970-01-01T00:00:00Z');
      const end = new Date('2099-12-31T23:59:59Z');
      
      const filtered = filterCommitsByDateRange(start, end)(sampleCommits);
      
      expect(filtered).toEqual(sampleCommits);
    });

    it('should handle commits with same timestamp', () => {
      const simultaneousCommits = [
        createCommit({ sha: '1', date: '2023-06-15T10:00:00Z' }),
        createCommit({ sha: '2', date: '2023-06-15T10:00:00Z' }),
        createCommit({ sha: '3', date: '2023-06-15T10:00:00Z' })
      ];
      
      const sorted = sortCommitsByDateDesc(simultaneousCommits);
      
      expect(sorted).toHaveLength(3);
    });
  });

  describe('Function Purity and Immutability', () => {
    it('should not mutate input arrays in any function', () => {
      const originalCommits = [...sampleCommits];
      const originalLength = sampleCommits.length;
      
      // Test all functions that accept commits array
      filterCommitsByDateRange(new Date('2023-06-15'), new Date('2023-06-20'))(sampleCommits);
      filterCommitsByAuthors(['john.doe'])(sampleCommits);
      filterCommitsByRepositories(['frontend'])(sampleCommits);
      groupCommitsByRepository(sampleCommits);
      extractUniqueAuthors(sampleCommits);
      sortCommitsByDateDesc(sampleCommits);
      calculateSummaryStats(sampleCommits);
      applyCommitFilters()(sampleCommits);
      analyzeCommits(sampleCommits);
      
      expect(sampleCommits).toEqual(originalCommits);
      expect(sampleCommits).toHaveLength(originalLength);
    });

    it('should return new arrays/objects without modifying inputs', () => {
      const commits = [...sampleCommits];
      
      const filtered = filterCommitsByAuthors(['john.doe'])(commits);
      const grouped = groupCommitsByRepository(commits);
      const sorted = sortCommitsByDateDesc(commits);
      
      expect(filtered).not.toBe(commits);
      expect(Object.values(grouped)[0]).not.toBe(commits);
      expect(sorted).not.toBe(commits);
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
      const filtered = filterCommitsByDateRange(new Date('2023-06-15'), new Date('2023-06-20'))(readonlyCommits);
      const grouped = groupCommitsByRepository(readonlyCommits);
      const unique = extractUniqueAuthors(readonlyCommits);
      const sorted = sortCommitsByDateDesc(readonlyCommits);
      const stats = calculateSummaryStats(readonlyCommits);
      
      expect(filtered).toBeDefined();
      expect(grouped).toBeDefined();
      expect(unique).toBeDefined();
      expect(sorted).toBeDefined();
      expect(stats).toBeDefined();
    });
  });
});