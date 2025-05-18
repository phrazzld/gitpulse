/**
 * Tests for summary API handlers
 * @jest-environment node
 */

import { createSummaryHandlers, SummaryHandlerDependencies } from '../handlers';
import { Repository, Commit, AppInstallation } from '@/lib/github/types';

// Create mock dependencies
const createMockDependencies = (): SummaryHandlerDependencies => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  githubService: {
    fetchAllRepositories: jest.fn().mockResolvedValue([]),
    fetchCommitsForRepositories: jest.fn().mockResolvedValue([])
  },
  geminiService: {
    generateCommitSummary: jest.fn().mockResolvedValue({ 
      keyThemes: [], 
      technicalAreas: [], 
      summary: '' 
    })
  },
  apiUtils: {
    extractUniqueDates: jest.fn((commits: readonly Commit[]) => []),
    extractUniqueRepositories: jest.fn((commits: readonly Commit[]) => []),
    generateBasicStats: jest.fn((commits: readonly Commit[]) => ({
      totalCommits: commits.length,
      filesChanged: 0,
      additions: 0,
      deletions: 0,
      repositories: [],
      dates: []
    }))
  }
});

describe('Summary API Handlers', () => {
  let mockDeps: SummaryHandlerDependencies;
  let handlers: ReturnType<typeof createSummaryHandlers>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockDeps = createMockDependencies();
    handlers = createSummaryHandlers(mockDeps);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('filterRepositoriesByOrgAndRepoNames', () => {
    const mockRepositories: Repository[] = [
      { id: 1, full_name: 'org1/repo1', name: 'repo1', owner: { login: 'org1' }, private: false, html_url: '', description: null },
      { id: 2, full_name: 'org1/repo2', name: 'repo2', owner: { login: 'org1' }, private: false, html_url: '', description: null },
      { id: 3, full_name: 'org2/repo3', name: 'repo3', owner: { login: 'org2' }, private: false, html_url: '', description: null },
      { id: 4, full_name: 'org3/repo4', name: 'repo4', owner: { login: 'org3' }, private: false, html_url: '', description: null }
    ];

    it('should return all repositories when no filters are provided', () => {
      const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories);
      expect(result).toHaveLength(4);
      expect(result).toEqual(mockRepositories);
      expect(mockDeps.logger.debug).toHaveBeenCalledWith(
        'api:summary:handlers',
        'Filtering repositories',
        expect.objectContaining({
          totalRepos: 4,
          organizationFilters: 0,
          repositoryFilters: 0
        })
      );
    });

    it('should filter repositories by organization name', () => {
      const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org1']);
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('org1/repo1');
      expect(result[1].full_name).toBe('org1/repo2');
    });

    it('should filter repositories by repository full name', () => {
      const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories, [], ['org1/repo1', 'org2/repo3']);
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('org1/repo1');
      expect(result[1].full_name).toBe('org2/repo3');
    });

    it('should apply both organization and repository filters', () => {
      const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org1'], ['org1/repo1']);
      expect(result).toHaveLength(1);
      expect(result[0].full_name).toBe('org1/repo1');
    });

    it('should return empty array when no repositories match the filters', () => {
      const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org4']);
      expect(result).toHaveLength(0);
    });
  });

  describe('mapRepositoriesToInstallations', () => {
    const mockInstallations: AppInstallation[] = [
      { id: 101, account: { login: 'org1' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' },
      { id: 102, account: { login: 'org2' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' }
    ];

    it('should map repositories to their installations', () => {
      const result = handlers.mapRepositoriesToInstallations(
        ['org1/repo1', 'org1/repo2', 'org2/repo3', 'org3/repo4'],
        mockInstallations,
        [101, 102]
      );
      
      expect(result.orgToInstallationMap.get('org1')).toBe(101);
      expect(result.orgToInstallationMap.get('org2')).toBe(102);
      expect(result.reposByInstallation['101']).toEqual(['org1/repo1', 'org1/repo2']);
      expect(result.reposByInstallation['102']).toEqual(['org2/repo3']);
      expect(result.reposByInstallation['oauth']).toEqual(['org3/repo4']); // No installation for org3
    });

    it('should handle repositories without installations', () => {
      const result = handlers.mapRepositoriesToInstallations(
        ['org3/repo4', 'org4/repo5'],
        mockInstallations,
        [101, 102]
      );
      
      expect(result.orgToInstallationMap.size).toBe(0);
      expect(result.reposByInstallation['oauth']).toEqual(['org3/repo4', 'org4/repo5']);
    });

    it('should work with no installation IDs', () => {
      const result = handlers.mapRepositoriesToInstallations(
        ['org1/repo1', 'org2/repo3'],
        mockInstallations,
        []
      );
      
      expect(result.orgToInstallationMap.size).toBe(0);
      expect(result.reposByInstallation['oauth']).toEqual(['org1/repo1', 'org2/repo3']);
    });
  });
  
  describe('fetchCommitsWithAuthMethod', () => {
    const mockCommits: Commit[] = [
      { 
        sha: '1', 
        commit: { 
          author: { name: 'Alice', email: 'alice@example.com', date: '2023-01-01T00:00:00Z' },
          message: 'Commit 1'
        }, 
        author: { login: 'alice', avatar_url: '' },
        html_url: 'https://github.com/org/repo1/commit/1',
        repository: { full_name: 'org/repo1' }
      },
      { 
        sha: '2', 
        commit: { 
          author: { name: 'Bob', email: 'bob@example.com', date: '2023-01-02T00:00:00Z' },
          message: 'Commit 2'
        }, 
        author: { login: 'bob', avatar_url: '' },
        html_url: 'https://github.com/org/repo2/commit/2',
        repository: { full_name: 'org/repo2' }
      }
    ];

    const reposByInstallation = {
      'oauth': ['org/repo1'],
      '101': ['org/repo2']
    };

    beforeEach(() => {
      // Reset mocks and set up proper mock implementations
      jest.clearAllMocks();
      
      // Set up the mock implementation to return different commits based on auth method
      (mockDeps.githubService.fetchCommitsForRepositories as jest.Mock).mockImplementation(
        async (accessToken, installationId, repos, since, until, author) => {
          // Return different commits based on the auth method
          if (installationId === 101) {
            return Promise.resolve([mockCommits[1]]); // Installation auth returns the second commit
          } else {
            return Promise.resolve([mockCommits[0]]); // OAuth returns the first commit
          }
        }
      );
    });

    it('should fetch commits using both OAuth and GitHub App installations', async () => {
      const result = await handlers.fetchCommitsWithAuthMethod(
        reposByInstallation,
        'fake-token',
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Should have called fetchCommitsForRepositories twice - once for OAuth, once for installation
      expect(mockDeps.githubService.fetchCommitsForRepositories).toHaveBeenCalledTimes(2);
      
      // First call should be for OAuth (no installation ID)
      expect(mockDeps.githubService.fetchCommitsForRepositories).toHaveBeenCalledWith(
        'fake-token',
        undefined,
        ['org/repo1'],
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Second call should be for installation 101
      expect(mockDeps.githubService.fetchCommitsForRepositories).toHaveBeenCalledWith(
        'fake-token',
        101,
        ['org/repo2'],
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Result should include both commits
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockCommits[0]);
      expect(result).toContainEqual(mockCommits[1]);
    });

    it('should handle empty repository lists', async () => {
      const result = await handlers.fetchCommitsWithAuthMethod(
        { 'oauth': [], '101': [] },
        'fake-token',
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Should not have called fetchCommitsForRepositories since no repos to fetch
      expect(mockDeps.githubService.fetchCommitsForRepositories).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('should skip OAuth fetching when no access token is provided', async () => {
      const result = await handlers.fetchCommitsWithAuthMethod(
        { 'oauth': ['org/repo1'], '101': ['org/repo2'] },
        undefined,
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Should have called fetchCommitsForRepositories only once - for the installation
      expect(mockDeps.githubService.fetchCommitsForRepositories).toHaveBeenCalledTimes(1);
      expect(mockDeps.githubService.fetchCommitsForRepositories).toHaveBeenCalledWith(
        undefined,
        101,
        ['org/repo2'],
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Result should include only the installation commit
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockCommits[1]);
    });
  });

  describe('filterCommitsByContributor', () => {
    const mockCommits: Commit[] = [
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
      },
      { 
        sha: '3', 
        commit: { 
          author: { name: 'Charlie', email: 'charlie@example.com', date: '2023-01-03T00:00:00Z' },
          message: 'Commit 3'
        }, 
        author: null,
        html_url: 'https://github.com/org/repo/commit/3',
        repository: { full_name: 'org/repo' }
      }
    ];

    it('should return all commits when no contributors are specified', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, [], undefined);
      expect(result).toEqual(mockCommits);
      expect(result).toHaveLength(3);
    });

    it('should filter commits by contributor login', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['alice'], undefined);
      expect(result).toHaveLength(1);
      expect(result[0].sha).toBe('1');
      expect(result[0].author!.login).toBe('alice');
    });

    it('should filter commits for multiple contributors', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['alice', 'bob'], undefined);
      expect(result).toHaveLength(2);
      expect(result[0].sha).toBe('1');
      expect(result[1].sha).toBe('2');
    });

    it('should filter commits by contributor name when author login is null', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['Charlie'], undefined);
      expect(result).toHaveLength(1);
      expect(result[0].sha).toBe('3');
    });

    it('should not filter when contributors includes only "me" and currentUserName matches', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['me'], 'alice');
      expect(result).toEqual(mockCommits); // No filtering applied at this layer for single "me"
      expect(result).toHaveLength(3);
    });

    it('should filter for "me" when included with other contributors', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['me', 'bob'], 'alice');
      expect(result).toHaveLength(2);
      expect(result[0].sha).toBe('1'); // alice is matched as "me"
      expect(result[1].sha).toBe('2'); // bob is directly matched
    });

    it('should handle "me" properly when currentUserName is not provided', () => {
      const result = handlers.filterCommitsByContributor(mockCommits, ['me'], undefined);
      expect(result).toEqual(mockCommits); // Returns all when single "me" and no current user
      expect(result).toHaveLength(3);
    });
  });

  describe('groupCommitsByFilter', () => {
    const mockCommits: Commit[] = [
      { 
        sha: '1', 
        commit: { 
          author: { name: 'Alice', email: 'alice@example.com', date: '2023-01-01T00:00:00Z' },
          message: 'Commit 1'
        },
        author: { login: 'alice', avatar_url: '' },
        html_url: 'https://github.com/org/repo/commit/1',
        repository: { full_name: 'org/repo' }
      }
    ];

    beforeEach(() => {
      (mockDeps.apiUtils.extractUniqueRepositories as jest.Mock).mockReturnValue(['org/repo']);
      (mockDeps.apiUtils.extractUniqueDates as jest.Mock).mockReturnValue(['2023-01-01']);
    });

    it('should group commits chronologically', () => {
      const result = handlers.groupCommitsByFilter(mockCommits, 'chronological');
      expect(result).toHaveLength(1);
      expect(result[0].groupKey).toBe('all');
      expect(result[0].groupName).toBe('All Commits');
      expect(result[0].commitCount).toBe(1);
      expect(result[0].commits).toEqual(mockCommits);
      expect(result[0].repositories).toEqual(['org/repo']);
      expect(result[0].dates).toEqual(['2023-01-01']);
    });

    it('should call utility functions for metadata', () => {
      handlers.groupCommitsByFilter(mockCommits, 'chronological');
      expect(mockDeps.apiUtils.extractUniqueRepositories).toHaveBeenCalledWith(mockCommits);
      expect(mockDeps.apiUtils.extractUniqueDates).toHaveBeenCalledWith(mockCommits);
    });
  });

  describe('generateSummaryData', () => {
    const groupedResults = [{
      groupKey: 'all',
      groupName: 'All Commits',
      commitCount: 1,
      repositories: ['org/repo'],
      dates: ['2023-01-01'],
      commits: [
        { 
          sha: '1', 
          commit: { 
            author: { name: 'Alice', email: 'alice@example.com', date: '2023-01-01T00:00:00Z' },
            message: 'Commit 1'
          },
          author: { login: 'alice', avatar_url: '' },
          html_url: 'https://github.com/org/repo/commit/1',
          repository: { full_name: 'org/repo' }
        }
      ]
    }];

    beforeEach(() => {
      (mockDeps.geminiService.generateCommitSummary as jest.Mock).mockResolvedValue({
        keyThemes: ['Testing'],
        technicalAreas: ['Unit Tests'],
        summary: 'Added unit tests'
      });
    });

    it('should generate overall summary for commits', async () => {
      const result = await handlers.generateSummaryData(groupedResults, 'fake-api-key', false);
      
      expect(mockDeps.geminiService.generateCommitSummary).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ sha: '1' })]),
        'fake-api-key'
      );
      
      expect(result.overallSummary).toEqual({
        keyThemes: ['Testing'],
        technicalAreas: ['Unit Tests'],
        summary: 'Added unit tests'
      });
      
      expect(result.groupedResults).toEqual(groupedResults);
    });

    it('should handle empty grouped results', async () => {
      const result = await handlers.generateSummaryData([], 'fake-api-key', false);
      
      expect(mockDeps.geminiService.generateCommitSummary).not.toHaveBeenCalled();
      expect(result.overallSummary).toBeNull();
      expect(result.groupedResults).toEqual([]);
    });

    it('should handle empty commits in groups', async () => {
      const emptyGroup = [{
        groupKey: 'all',
        groupName: 'All Commits',
        commitCount: 0,
        repositories: [],
        dates: [],
        commits: []
      }];
      
      const result = await handlers.generateSummaryData(emptyGroup, 'fake-api-key', false);
      
      expect(mockDeps.geminiService.generateCommitSummary).not.toHaveBeenCalled();
      expect(result.overallSummary).toBeNull();
    });
  });

  describe('prepareSummaryResponse', () => {
    const groupedResults = [{
      groupKey: 'all',
      groupName: 'All Commits',
      commitCount: 1,
      repositories: ['org/repo'],
      dates: ['2023-01-01'],
      commits: [
        { 
          sha: '1', 
          commit: { 
            author: { name: 'Alice', email: 'alice@example.com', date: '2023-01-01T00:00:00Z' },
            message: 'Commit 1'
          },
          author: { login: 'alice', avatar_url: '' },
          html_url: 'https://github.com/org/repo/commit/1',
          repository: { full_name: 'org/repo' }
        }
      ]
    }];

    const overallSummary = {
      keyThemes: ['Testing'],
      technicalAreas: ['Unit Tests'],
      summary: 'Added unit tests'
    };

    const filterInfo = {
      contributors: ['alice'],
      organizations: ['org'],
      repositories: ['org/repo'],
      dateRange: { since: '2023-01-01', until: '2023-01-31' }
    };

    beforeEach(() => {
      (mockDeps.apiUtils.generateBasicStats as jest.Mock).mockReturnValue({
        totalCommits: 1,
        filesChanged: 3,
        additions: 100,
        deletions: 20
      });
    });

    it('should prepare response with all fields', () => {
      const mockInstallations: AppInstallation[] = [
        { id: 101, account: { login: 'org' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' }
      ];

      const result = handlers.prepareSummaryResponse(
        groupedResults,
        overallSummary,
        filterInfo,
        'alice',
        'github_app',
        [101],
        mockInstallations
      );

      expect(result).toEqual({
        user: 'alice',
        commits: groupedResults[0].commits,
        stats: {
          totalCommits: 1,
          filesChanged: 3,
          additions: 100,
          deletions: 20
        },
        aiSummary: overallSummary,
        filterInfo,
        groupedResults,
        authMethod: 'github_app',
        installationIds: [101],
        installations: mockInstallations,
        currentInstallations: mockInstallations
      });
    });

    it('should handle OAuth auth method', () => {
      const result = handlers.prepareSummaryResponse(
        groupedResults,
        overallSummary,
        filterInfo,
        'alice',
        'oauth',
        [],
        []
      );

      expect(result.authMethod).toBe('oauth');
      expect(result.installationIds).toBeNull();
      expect(result.currentInstallations).toEqual([]);
    });
  });
});