/**
 * Tests for summary API handlers using direct mocks
 * @jest-environment node
 */

// Import the handlers directly
import { 
  filterRepositoriesByOrgAndRepoNames,
  mapRepositoriesToInstallations,
  filterCommitsByContributor,
  groupCommitsByFilter,
  prepareSummaryResponse
} from '../handlers';

// Mock dependencies without relying on GitHub imports
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
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

describe('Summary API Handlers', () => {
  describe('filterRepositoriesByOrgAndRepoNames', () => {
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
  });
  
  describe('filterCommitsByContributor', () => {
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
  });

  describe('groupCommitsByFilter', () => {
    it('should group commits chronologically', () => {
      const testCommits = [
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
      
      const result = groupCommitsByFilter(testCommits, 'chronological');
      
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
      expect(result[0].commits).toEqual(testCommits);
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
        ]
      }
    ];

    const mockSummary = {
      keyThemes: ['Theme 1', 'Theme 2'],
      technicalAreas: ['Area 1', 'Area 2'],
      summary: 'This is a summary'
    };

    const mockFilterInfo = {
      contributors: ['alice', 'bob'],
      organizations: ['org'],
      repositories: null,
      dateRange: {
        since: '2023-01-01',
        until: '2023-01-31'
      }
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