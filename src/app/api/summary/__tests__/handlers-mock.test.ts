/**
 * Tests for summary API handlers using direct mocks
 * @jest-environment node
 */

// Import the factory
import { createSummaryHandlers, SummaryHandlerDependencies } from '../handlers';

// Mock dependencies without relying on GitHub imports
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the GitHub module to avoid ESM issues
jest.mock('@/lib/github', () => ({
  fetchCommitsForRepositories: jest.fn().mockResolvedValue([]),
  fetchAllRepositories: jest.fn().mockResolvedValue([]),
  getAllAppInstallations: jest.fn().mockResolvedValue([])
}));

// Create test data directly
const mockRepositories = [
  { id: 1, full_name: 'org1/repo1', name: 'repo1', owner: { login: 'org1' }, private: false, html_url: '', description: null },
  { id: 2, full_name: 'org1/repo2', name: 'repo2', owner: { login: 'org1' }, private: false, html_url: '', description: null },
  { id: 3, full_name: 'org2/repo3', name: 'repo3', owner: { login: 'org2' }, private: false, html_url: '', description: null },
  { id: 4, full_name: 'org3/repo4', name: 'repo4', owner: { login: 'org3' }, private: false, html_url: '', description: null }
];

const mockInstallations = [
  { id: 101, account: { login: 'org1' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' },
  { id: 102, account: { login: 'org2' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' }
];

const mockCommits = [
  { 
    sha: '1', 
    commit: { 
      author: { name: 'Alice', email: 'alice@example.com', date: '2023-01-01T00:00:00Z' },
      message: 'Commit 1'
    }, 
    author: { login: 'alice', avatar_url: '' },
    html_url: 'https://github.com/org/repo/commit/1',
    repository: { full_name: 'org/repo' }
  },
  { 
    sha: '2', 
    commit: { 
      author: { name: 'Bob', email: 'bob@example.com', date: '2023-01-02T00:00:00Z' },
      message: 'Commit 2'
    }, 
    author: { login: 'bob', avatar_url: '' },
    html_url: 'https://github.com/org/repo/commit/2',
    repository: { full_name: 'org/repo' }
  }
];

// Create mock dependencies
const createMockDependencies = (): SummaryHandlerDependencies => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  githubService: {
    fetchAllRepositories: jest.fn(),
    fetchCommitsForRepositories: jest.fn()
  },
  geminiService: {
    generateCommitSummary: jest.fn()
  },
  apiUtils: {
    extractUniqueDates: jest.fn((commits: readonly any[]) => ['2023-01-01'] as const),
    extractUniqueRepositories: jest.fn((commits: readonly any[]) => ['org/repo'] as const),
    generateBasicStats: jest.fn((commits: readonly any[]) => ({
      totalCommits: commits.length,
      filesChanged: 10,
      additions: 100,
      deletions: 50,
      repositories: ['org/repo'],
      dates: ['2023-01-01']
    }))
  }
});

describe('Summary API Handlers with Direct Mocks', () => {
  let mockDeps: SummaryHandlerDependencies;
  let handlers: ReturnType<typeof createSummaryHandlers>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeps = createMockDependencies();
    handlers = createSummaryHandlers(mockDeps);
  });

  describe('filterRepositoriesByOrgAndRepoNames', () => {
    it('should filter by organization correctly', () => {
      const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org1']);
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('org1/repo1');
      expect(result[1].full_name).toBe('org1/repo2');
    });

    it('should filter by repository name correctly', () => {
      const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories, [], ['org1/repo1', 'org2/repo3']);
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('org1/repo1');
      expect(result[1].full_name).toBe('org2/repo3');
    });
  });

  describe('mapRepositoriesToInstallations', () => {
    it('should map repositories to installations', () => {
      const result = handlers.mapRepositoriesToInstallations(
        ['org1/repo1', 'org2/repo3', 'org3/repo4'],
        mockInstallations,
        [101, 102]
      );

      expect(result.orgToInstallationMap.get('org1')).toBe(101);
      expect(result.orgToInstallationMap.get('org2')).toBe(102);
      expect(result.reposByInstallation['101']).toEqual(['org1/repo1']);
      expect(result.reposByInstallation['102']).toEqual(['org2/repo3']);
      expect(result.reposByInstallation['oauth']).toEqual(['org3/repo4']); // No installation for org3
    });
  });

  describe('filterCommitsByContributor', () => {
    it('should filter commits by contributor', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['alice']);
      expect(result).toHaveLength(1);
      expect(result[0].author!.login).toBe('alice');
    });

    it('should handle "me" filter correctly', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['me'], 'alice');
      expect(result).toHaveLength(1);
      expect(result[0].author!.login).toBe('alice'); // Only alice's commit
    });
  });

  describe('groupCommitsByFilter', () => {
    it('should group commits correctly', () => {
      const result = handlers.groupCommitsByFilter(mockCommits, 'chronological');
      expect(result).toHaveLength(1);
      expect(result[0].groupKey).toBe('all');
      expect(result[0].commits).toEqual(mockCommits);
    });
  });

  describe('prepareSummaryResponse', () => {
    it('should prepare response with all fields', () => {
      const groupedResults = [{
        groupKey: 'all',
        groupName: 'All Commits',
        commitCount: 2,
        repositories: ['org/repo'],
        dates: ['2023-01-01'],
        commits: mockCommits
      }];

      const result = handlers.prepareSummaryResponse(
        groupedResults,
        { keyThemes: ['Testing'], technicalAreas: ['Unit Tests'] },
        { 
          contributors: null, 
          organizations: null, 
          repositories: null, 
          dateRange: { since: '2023-01-01', until: '2023-01-31' } 
        },
        'alice',
        'oauth',
        [],
        []
      );

      expect(result.user).toBe('alice');
      expect(result.authMethod).toBe('oauth');
      expect(result.commits).toEqual(mockCommits);
      expect(result.groupedResults).toEqual(groupedResults);
    });
  });
});