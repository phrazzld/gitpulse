/**
 * Tests for summary API handlers
 */

import { 
  filterRepositoriesByOrgAndRepoNames,
  mapRepositoriesToInstallations,
  fetchCommitsWithAuthMethod,
  filterCommitsByContributor,
  groupCommitsByFilter,
  generateSummaryData,
  prepareSummaryResponse
} from '../handlers';
import { Repository, Commit, AppInstallation } from '@/lib/github';
import { fetchCommitsForRepositories } from '@/lib/github';
import { generateCommitSummary } from '@/lib/gemini';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('@/lib/gemini', () => ({
  generateCommitSummary: jest.fn()
}));

jest.mock('@/lib/github', () => ({
  ...jest.requireActual('@/lib/github'),
  fetchCommitsForRepositories: jest.fn()
}));

describe('Summary API Handlers', () => {
  beforeEach(() => {
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
      const result = filterRepositoriesByOrgAndRepoNames(mockRepositories);
      expect(result).toHaveLength(4);
      expect(result).toEqual(mockRepositories);
    });

    it('should filter repositories by organization name', () => {
      const result = filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org1']);
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('org1/repo1');
      expect(result[1].full_name).toBe('org1/repo2');
    });

    it('should filter repositories by repository full name', () => {
      const result = filterRepositoriesByOrgAndRepoNames(mockRepositories, [], ['org1/repo1', 'org2/repo3']);
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('org1/repo1');
      expect(result[1].full_name).toBe('org2/repo3');
    });

    it('should apply both organization and repository filters', () => {
      const result = filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org1'], ['org1/repo1']);
      expect(result).toHaveLength(1);
      expect(result[0].full_name).toBe('org1/repo1');
    });

    it('should return empty array when no repositories match the filters', () => {
      const result = filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org4']);
      expect(result).toHaveLength(0);
    });
  });

  describe('mapRepositoriesToInstallations', () => {
    const mockInstallations: AppInstallation[] = [
      { id: 101, account: { login: 'org1' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' },
      { id: 102, account: { login: 'org2' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' }
    ];

    const reposToAnalyze = ['org1/repo1', 'org1/repo2', 'org2/repo3', 'org3/repo4'];
    
    it('should map repositories to installations correctly', () => {
      const result = mapRepositoriesToInstallations(reposToAnalyze, mockInstallations, [101, 102]);
      
      // Check org to installation map
      expect(result.orgToInstallationMap.size).toBe(2);
      expect(result.orgToInstallationMap.get('org1')).toBe(101);
      expect(result.orgToInstallationMap.get('org2')).toBe(102);
      
      // Check repos by installation
      expect(Object.keys(result.reposByInstallation)).toHaveLength(3); // oauth + 2 installations
      expect(result.reposByInstallation['101']).toEqual(['org1/repo1', 'org1/repo2']);
      expect(result.reposByInstallation['102']).toEqual(['org2/repo3']);
      expect(result.reposByInstallation['oauth']).toEqual(['org3/repo4']);
    });

    it('should default to OAuth when installation IDs are empty', () => {
      const result = mapRepositoriesToInstallations(reposToAnalyze, mockInstallations, []);
      
      expect(result.orgToInstallationMap.size).toBe(0);
      expect(Object.keys(result.reposByInstallation)).toHaveLength(1);
      expect(result.reposByInstallation['oauth']).toEqual(reposToAnalyze);
    });

    it('should filter installations by the provided IDs', () => {
      const result = mapRepositoriesToInstallations(reposToAnalyze, mockInstallations, [101]); // Only include org1
      
      expect(result.orgToInstallationMap.size).toBe(1);
      expect(result.orgToInstallationMap.get('org1')).toBe(101);
      expect(result.orgToInstallationMap.has('org2')).toBe(false);
      
      expect(result.reposByInstallation['101']).toEqual(['org1/repo1', 'org1/repo2']);
      expect(result.reposByInstallation['oauth']).toEqual(['org2/repo3', 'org3/repo4']);
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
      (fetchCommitsForRepositories as jest.Mock).mockImplementation((accessToken, installationId, repos) => {
        // Return different commits based on the auth method
        if (installationId) {
          return Promise.resolve([mockCommits[1]]); // Installation auth returns the second commit
        } else {
          return Promise.resolve([mockCommits[0]]); // OAuth returns the first commit
        }
      });
    });

    it('should fetch commits using both OAuth and GitHub App installations', async () => {
      const result = await fetchCommitsWithAuthMethod(
        reposByInstallation,
        'fake-token',
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Should have called fetchCommitsForRepositories twice - once for OAuth, once for installation
      expect(fetchCommitsForRepositories).toHaveBeenCalledTimes(2);
      
      // First call should be for OAuth
      expect(fetchCommitsForRepositories).toHaveBeenCalledWith(
        'fake-token',
        undefined,
        ['org/repo1'],
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Second call should be for installation 101
      expect(fetchCommitsForRepositories).toHaveBeenCalledWith(
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
      const result = await fetchCommitsWithAuthMethod(
        { 'oauth': [], '101': [] },
        'fake-token',
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Should not have called fetchCommitsForRepositories
      expect(fetchCommitsForRepositories).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('should skip OAuth fetching when no access token is provided', async () => {
      const result = await fetchCommitsWithAuthMethod(
        { 'oauth': ['org/repo1'], '101': ['org/repo2'] },
        undefined,
        '2023-01-01',
        '2023-01-31',
        undefined
      );
      
      // Should have called fetchCommitsForRepositories only once - for the installation
      expect(fetchCommitsForRepositories).toHaveBeenCalledTimes(1);
      expect(fetchCommitsForRepositories).toHaveBeenCalledWith(
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
        author: { login: 'charlie', avatar_url: '' },
        html_url: 'https://github.com/org/repo/commit/3',
        repository: { full_name: 'org/repo' }
      }
    ];

    it('should return all commits when no contributors filter is provided', () => {
      const result = filterCommitsByContributor(mockCommits, []);
      expect(result).toHaveLength(3);
    });

    it('should filter commits by contributor login', () => {
      const result = filterCommitsByContributor(mockCommits, ['alice', 'charlie']);
      expect(result).toHaveLength(2);
      expect(result[0].author?.login).toBe('alice');
      expect(result[1].author?.login).toBe('charlie');
    });

    it('should handle the "me" special case', () => {
      const result = filterCommitsByContributor(mockCommits, ['me'], 'bob');
      expect(result).toHaveLength(1);
      expect(result[0].author?.login).toBe('bob');
    });

    it('should not filter single contributor when it matches current user', () => {
      const result = filterCommitsByContributor(mockCommits, ['bob'], 'bob');
      expect(result).toHaveLength(3); // No filtering when single contributor matches user
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

    it('should group commits chronologically', () => {
      const result = groupCommitsByFilter(mockCommits, 'chronological');
      
      expect(result).toHaveLength(1);
      expect(result[0].groupKey).toBe('all');
      expect(result[0].groupName).toBe('All Commits');
      expect(result[0].commitCount).toBe(2);
      expect(result[0].repositories).toHaveLength(2);
      expect(result[0].repositories).toContain('org/repo1');
      expect(result[0].repositories).toContain('org/repo2');
      expect(result[0].dates).toHaveLength(2);
      expect(result[0].dates).toContain('2023-01-01');
      expect(result[0].dates).toContain('2023-01-02');
      expect(result[0].commits).toEqual(mockCommits);
    });
  });

  describe('generateSummaryData', () => {
    const mockGroupedResults = [
      {
        groupKey: 'all',
        groupName: 'All Commits',
        commitCount: 2,
        repositories: ['org/repo1', 'org/repo2'],
        dates: ['2023-01-01', '2023-01-02'],
        commits: [
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
        ] as Commit[]
      }
    ];

    const mockSummary = {
      keyThemes: ['Theme 1', 'Theme 2'],
      technicalAreas: ['Area 1', 'Area 2'],
      summary: 'This is a summary'
    };

    beforeEach(() => {
      (generateCommitSummary as jest.Mock).mockResolvedValue(mockSummary);
    });

    it('should generate overall summary when commits exist', async () => {
      const result = await generateSummaryData(mockGroupedResults, 'fake-api-key');
      
      expect(generateCommitSummary).toHaveBeenCalledWith(mockGroupedResults[0].commits, 'fake-api-key');
      expect(result.overallSummary).toEqual(mockSummary);
      expect(result.groupedResults).toEqual(mockGroupedResults);
    });

    it('should return null for overall summary when no commits exist', async () => {
      const emptyGroupedResults = [{ ...mockGroupedResults[0], commits: [], commitCount: 0 }];
      const result = await generateSummaryData(emptyGroupedResults, 'fake-api-key');
      
      expect(generateCommitSummary).not.toHaveBeenCalled();
      expect(result.overallSummary).toBeNull();
    });

    it('should generate group summaries when requested', async () => {
      const result = await generateSummaryData(mockGroupedResults, 'fake-api-key', true);
      
      expect(generateCommitSummary).toHaveBeenCalledTimes(2); // Once for overall, once for group
      expect(result.groupedResults[0].aiSummary).toEqual(mockSummary);
    });
  });

  describe('prepareSummaryResponse', () => {
    const mockGroupedResults = [
      {
        groupKey: 'all',
        groupName: 'All Commits',
        commitCount: 2,
        repositories: ['org/repo1', 'org/repo2'],
        dates: ['2023-01-01', '2023-01-02'],
        commits: [
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
        ] as Commit[]
      }
    ];

    const mockFilterInfo = {
      contributors: ['alice', 'bob'],
      organizations: ['org'],
      repositories: null,
      dateRange: {
        since: '2023-01-01',
        until: '2023-01-31'
      }
    };

    const mockInstallations: AppInstallation[] = [
      { id: 101, account: { login: 'org1' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' },
      { id: 102, account: { login: 'org2' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' }
    ];

    const mockSummary = {
      keyThemes: ['Theme 1', 'Theme 2'],
      technicalAreas: ['Area 1', 'Area 2'],
      summary: 'This is a summary'
    };

    it('should prepare the response with all required fields', () => {
      const result = prepareSummaryResponse(
        mockGroupedResults,
        mockSummary,
        mockFilterInfo,
        'TestUser',
        'github_app',
        [101],
        mockInstallations
      );
      
      expect(result.user).toBe('TestUser');
      expect(result.commits).toHaveLength(2);
      expect(result.aiSummary).toEqual(mockSummary);
      expect(result.filterInfo).toEqual(mockFilterInfo);
      expect(result.groupedResults).toEqual(mockGroupedResults);
      expect(result.authMethod).toBe('github_app');
      expect(result.installationIds).toEqual([101]);
      expect(result.installations).toEqual(mockInstallations);
      expect(result.currentInstallations).toHaveLength(1);
      expect(result.currentInstallations[0].id).toBe(101);
    });

    it('should handle empty installations', () => {
      const result = prepareSummaryResponse(
        mockGroupedResults,
        mockSummary,
        mockFilterInfo,
        'TestUser',
        'oauth'
      );
      
      expect(result.authMethod).toBe('oauth');
      expect(result.installationIds).toBeNull();
      expect(result.installations).toEqual([]);
      expect(result.currentInstallations).toEqual([]);
    });
  });
});