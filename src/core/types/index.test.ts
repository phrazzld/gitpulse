import {
  CommitData,
  Repository,
  Contributor,
  DateRange,
  SummaryRequest,
  SummaryStats,
  SummaryContent,
  Summary,
  GitHubCommitResponse,
  ValidationError,
  Config,
  isCommitData,
  isRepository,
  isSummaryRequest
} from './index';

describe('Core Domain Types', () => {
  describe('CommitData', () => {
    it('should represent commit data with required fields', () => {
      const commit: CommitData = {
        sha: 'abc123',
        message: 'feat: add new feature',
        author: 'john.doe',
        date: '2023-12-01T10:00:00Z',
        repository: 'my-repo'
      };

      expect(commit.sha).toBe('abc123');
      expect(commit.message).toBe('feat: add new feature');
      expect(commit.author).toBe('john.doe');
      expect(commit.date).toBe('2023-12-01T10:00:00Z');
      expect(commit.repository).toBe('my-repo');
    });

    it('should support optional fields', () => {
      const commit: CommitData = {
        sha: 'abc123',
        message: 'feat: add new feature',
        author: 'john.doe',
        date: '2023-12-01T10:00:00Z',
        repository: 'my-repo',
        additions: 50,
        deletions: 10,
        url: 'https://github.com/owner/repo/commit/abc123'
      };

      expect(commit.additions).toBe(50);
      expect(commit.deletions).toBe(10);
      expect(commit.url).toBe('https://github.com/owner/repo/commit/abc123');
    });

    it('should be readonly', () => {
      const commit: CommitData = {
        sha: 'abc123',
        message: 'feat: add new feature',
        author: 'john.doe',
        date: '2023-12-01T10:00:00Z',
        repository: 'my-repo'
      };

      // TypeScript should prevent these mutations at compile time
      // commit.sha = 'def456';  // readonly property
      // commit.message = 'different message';  // readonly property

      expect(commit.sha).toBe('abc123');
    });
  });

  describe('Repository', () => {
    it('should represent repository information', () => {
      const repo: Repository = {
        name: 'my-repo',
        fullName: 'owner/my-repo',
        owner: 'owner',
        description: 'A great repository',
        isPrivate: false,
        defaultBranch: 'main',
        language: 'TypeScript',
        topics: ['web', 'typescript', 'react']
      };

      expect(repo.name).toBe('my-repo');
      expect(repo.fullName).toBe('owner/my-repo');
      expect(repo.owner).toBe('owner');
      expect(repo.isPrivate).toBe(false);
      expect(repo.defaultBranch).toBe('main');
      expect(repo.topics).toEqual(['web', 'typescript', 'react']);
    });

    it('should handle minimal repository data', () => {
      const repo: Repository = {
        name: 'minimal-repo',
        fullName: 'owner/minimal-repo',
        owner: 'owner',
        isPrivate: true,
        defaultBranch: 'master',
        topics: []
      };

      expect(repo.description).toBeUndefined();
      expect(repo.language).toBeUndefined();
      expect(repo.topics).toEqual([]);
    });
  });

  describe('DateRange', () => {
    it('should represent date range with start and end dates', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-12-31');
      
      const dateRange: DateRange = { start, end };

      expect(dateRange.start).toBe(start);
      expect(dateRange.end).toBe(end);
      expect(dateRange.start.getTime()).toBeLessThan(dateRange.end.getTime());
    });

    it('should be immutable', () => {
      const dateRange: DateRange = {
        start: new Date('2023-01-01T00:00:00Z'),
        end: new Date('2023-12-31T23:59:59Z')
      };

      // TypeScript should prevent mutations
      // dateRange.start = new Date('2023-02-01');  // readonly property

      expect(dateRange.start.getUTCFullYear()).toBe(2023);
    });
  });

  describe('SummaryRequest', () => {
    it('should represent summary request with required fields', () => {
      const request: SummaryRequest = {
        repositories: ['repo1', 'repo2'],
        dateRange: {
          start: new Date('2023-01-01T00:00:00Z'),
          end: new Date('2023-12-31T23:59:59Z')
        }
      };

      expect(request.repositories).toEqual(['repo1', 'repo2']);
      expect(request.dateRange.start.getUTCFullYear()).toBe(2023);
      expect(request.dateRange.end.getUTCFullYear()).toBe(2023);
    });

    it('should support optional filters', () => {
      const request: SummaryRequest = {
        repositories: ['repo1'],
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-12-31')
        },
        users: ['john.doe', 'jane.smith'],
        includePrivate: true,
        branch: 'develop'
      };

      expect(request.users).toEqual(['john.doe', 'jane.smith']);
      expect(request.includePrivate).toBe(true);
      expect(request.branch).toBe('develop');
    });

    it('should maintain readonly array invariants', () => {
      const request: SummaryRequest = {
        repositories: ['repo1', 'repo2'],
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-12-31')
        },
        users: ['user1', 'user2']
      };

      // Arrays should be readonly
      // request.repositories.push('repo3');  // readonly array
      // request.users!.push('user3');  // readonly array

      expect(request.repositories.length).toBe(2);
    });
  });

  describe('SummaryStats', () => {
    it('should represent comprehensive summary statistics', () => {
      const stats: SummaryStats = {
        totalCommits: 150,
        uniqueAuthors: 5,
        repositories: ['repo1', 'repo2', 'repo3'],
        mostActiveDay: '2023-06-15',
        averageCommitsPerDay: 2.5,
        totalAdditions: 1250,
        totalDeletions: 450,
        commitsByDay: {
          '2023-06-15': 8,
          '2023-06-16': 3,
          '2023-06-17': 5
        },
        commitsByAuthor: {
          'john.doe': 60,
          'jane.smith': 45,
          'bob.wilson': 30,
          'alice.brown': 15
        },
        topRepositories: [
          { name: 'repo1', commits: 80 },
          { name: 'repo2', commits: 45 },
          { name: 'repo3', commits: 25 }
        ]
      };

      expect(stats.totalCommits).toBe(150);
      expect(stats.uniqueAuthors).toBe(5);
      expect(stats.repositories).toHaveLength(3);
      expect(stats.mostActiveDay).toBe('2023-06-15');
      expect(stats.averageCommitsPerDay).toBe(2.5);
      expect(stats.topRepositories[0].commits).toBe(80);
    });

    it('should handle empty statistics', () => {
      const stats: SummaryStats = {
        totalCommits: 0,
        uniqueAuthors: 0,
        repositories: [],
        mostActiveDay: '',
        averageCommitsPerDay: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        commitsByDay: {},
        commitsByAuthor: {},
        topRepositories: []
      };

      expect(stats.totalCommits).toBe(0);
      expect(stats.repositories).toEqual([]);
      expect(stats.topRepositories).toEqual([]);
    });
  });

  describe('Complete Summary', () => {
    it('should combine request, stats, and content', () => {
      const request: SummaryRequest = {
        repositories: ['repo1'],
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-12-31')
        }
      };

      const stats: SummaryStats = {
        totalCommits: 50,
        uniqueAuthors: 3,
        repositories: ['repo1'],
        mostActiveDay: '2023-06-15',
        averageCommitsPerDay: 1.5,
        totalAdditions: 500,
        totalDeletions: 100,
        commitsByDay: { '2023-06-15': 5 },
        commitsByAuthor: { 'john.doe': 30 },
        topRepositories: [{ name: 'repo1', commits: 50 }]
      };

      const content: SummaryContent = {
        overview: 'Active development period with focus on new features.',
        keyThemes: ['feature development', 'bug fixes', 'performance'],
        technicalFocus: ['TypeScript', 'React', 'API'],
        accomplishments: ['Completed user authentication', 'Improved performance'],
        commitTypes: {
          'feat': 20,
          'fix': 15,
          'refactor': 10,
          'docs': 5
        },
        timelineHighlights: [
          { date: '2023-06-15', description: 'Major feature release' },
          { date: '2023-06-20', description: 'Performance improvements' }
        ]
      };

      const generatedAt = new Date('2023-12-01T12:00:00Z');

      const summary: Summary = {
        request,
        stats,
        content,
        generatedAt
      };

      expect(summary.request.repositories).toEqual(['repo1']);
      expect(summary.stats.totalCommits).toBe(50);
      expect(summary.content.overview).toContain('Active development');
      expect(summary.generatedAt).toBe(generatedAt);
    });
  });

  describe('Type Guards', () => {
    describe('isCommitData', () => {
      it('should validate correct CommitData objects', () => {
        const validCommit = {
          sha: 'abc123',
          message: 'feat: add feature',
          author: 'john.doe',
          date: '2023-12-01T10:00:00Z',
          repository: 'my-repo'
        };

        expect(isCommitData(validCommit)).toBe(true);
      });

      it('should validate CommitData with optional fields', () => {
        const validCommit = {
          sha: 'abc123',
          message: 'feat: add feature',
          author: 'john.doe',
          date: '2023-12-01T10:00:00Z',
          repository: 'my-repo',
          additions: 50,
          deletions: 10,
          url: 'https://github.com/owner/repo/commit/abc123'
        };

        expect(isCommitData(validCommit)).toBe(true);
      });

      it('should reject invalid objects', () => {
        expect(isCommitData(null)).toBe(false);
        expect(isCommitData(undefined)).toBe(false);
        expect(isCommitData('string')).toBe(false);
        expect(isCommitData(42)).toBe(false);
        expect(isCommitData({})).toBe(false);
        
        expect(isCommitData({
          sha: 'abc123',
          message: 'feat: add feature',
          author: 'john.doe',
          date: '2023-12-01T10:00:00Z'
          // missing repository
        })).toBe(false);

        expect(isCommitData({
          sha: 123, // wrong type
          message: 'feat: add feature',
          author: 'john.doe',
          date: '2023-12-01T10:00:00Z',
          repository: 'my-repo'
        })).toBe(false);
      });

      it('should enable type narrowing', () => {
        const maybeCommit: unknown = {
          sha: 'abc123',
          message: 'feat: add feature',
          author: 'john.doe',
          date: '2023-12-01T10:00:00Z',
          repository: 'my-repo'
        };

        if (isCommitData(maybeCommit)) {
          // TypeScript should infer CommitData type here
          expect(maybeCommit.sha).toBe('abc123');
          expect(maybeCommit.message).toBe('feat: add feature');
          expect(maybeCommit.author).toBe('john.doe');
        }
      });
    });

    describe('isRepository', () => {
      it('should validate correct Repository objects', () => {
        const validRepo = {
          name: 'my-repo',
          fullName: 'owner/my-repo',
          owner: 'owner',
          isPrivate: false,
          defaultBranch: 'main',
          topics: ['web', 'typescript']
        };

        expect(isRepository(validRepo)).toBe(true);
      });

      it('should validate Repository with optional fields', () => {
        const validRepo = {
          name: 'my-repo',
          fullName: 'owner/my-repo',
          owner: 'owner',
          description: 'A great repo',
          isPrivate: true,
          defaultBranch: 'master',
          language: 'TypeScript',
          topics: []
        };

        expect(isRepository(validRepo)).toBe(true);
      });

      it('should reject invalid objects', () => {
        expect(isRepository(null)).toBe(false);
        expect(isRepository({})).toBe(false);
        
        expect(isRepository({
          name: 'my-repo',
          fullName: 'owner/my-repo',
          owner: 'owner',
          isPrivate: 'false', // wrong type
          defaultBranch: 'main',
          topics: []
        })).toBe(false);

        expect(isRepository({
          name: 'my-repo',
          fullName: 'owner/my-repo',
          owner: 'owner',
          isPrivate: false,
          defaultBranch: 'main',
          topics: 'not-array' // wrong type
        })).toBe(false);
      });
    });

    describe('isSummaryRequest', () => {
      it('should validate correct SummaryRequest objects', () => {
        const validRequest = {
          repositories: ['repo1', 'repo2'],
          dateRange: {
            start: new Date('2023-01-01'),
            end: new Date('2023-12-31')
          }
        };

        expect(isSummaryRequest(validRequest)).toBe(true);
      });

      it('should validate SummaryRequest with optional fields', () => {
        const validRequest = {
          repositories: ['repo1'],
          dateRange: {
            start: new Date('2023-01-01'),
            end: new Date('2023-12-31')
          },
          users: ['john.doe'],
          includePrivate: true,
          branch: 'develop'
        };

        expect(isSummaryRequest(validRequest)).toBe(true);
      });

      it('should reject invalid objects', () => {
        expect(isSummaryRequest(null)).toBe(false);
        expect(isSummaryRequest({})).toBe(false);
        
        expect(isSummaryRequest({
          repositories: 'not-array', // wrong type
          dateRange: {
            start: new Date('2023-01-01'),
            end: new Date('2023-12-31')
          }
        })).toBe(false);

        expect(isSummaryRequest({
          repositories: ['repo1'],
          dateRange: {
            start: '2023-01-01', // should be Date
            end: new Date('2023-12-31')
          }
        })).toBe(false);

        expect(isSummaryRequest({
          repositories: ['repo1'],
          dateRange: null // should be object
        })).toBe(false);
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle date ranges correctly', () => {
      const dateRange: DateRange = {
        start: new Date('2023-01-01T00:00:00Z'),
        end: new Date('2023-12-31T23:59:59Z')
      };

      expect(dateRange.start.getTime()).toBeLessThan(dateRange.end.getTime());
      expect(dateRange.start.getUTCFullYear()).toBe(2023);
      expect(dateRange.end.getUTCFullYear()).toBe(2023);
    });

    it('should handle empty arrays correctly', () => {
      const request: SummaryRequest = {
        repositories: [],
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-12-31')
        },
        users: []
      };

      expect(request.repositories).toEqual([]);
      expect(request.users).toEqual([]);
    });

    it('should handle special characters in strings', () => {
      const commit: CommitData = {
        sha: 'abc123-def456',
        message: 'fix: handle unicode characters 🚀 and special chars: @#$%',
        author: 'user.name+tag@domain.co.uk',
        date: '2023-12-01T10:00:00.123Z',
        repository: 'org/repo-name_with.special-chars'
      };

      expect(commit.message).toContain('🚀');
      expect(commit.author).toContain('@domain.co.uk');
      expect(commit.repository).toContain('_with.special-chars');
    });

    it('should maintain null safety', () => {
      const partialCommit: Partial<CommitData> = {
        sha: 'abc123',
        message: 'feat: add feature'
        // other fields are undefined
      };

      expect(partialCommit.author).toBeUndefined();
      expect(partialCommit.date).toBeUndefined();
      expect(partialCommit.repository).toBeUndefined();
    });
  });

  describe('Configuration Types', () => {
    it('should represent application configuration', () => {
      const config: Config = {
        github: {
          apiUrl: 'https://api.github.com',
          timeout: 30000,
          rateLimit: {
            maxRequests: 5000,
            windowMs: 3600000
          }
        },
        limits: {
          maxRepositories: 50,
          maxDateRangeDays: 365,
          maxUsers: 20
        },
        ai: {
          provider: 'openai',
          apiKey: 'sk-...',
          model: 'gpt-4',
          maxTokens: 4000
        }
      };

      expect(config.github.apiUrl).toBe('https://api.github.com');
      expect(config.limits.maxRepositories).toBe(50);
      expect(config.ai.provider).toBe('openai');
    });
  });

  describe('GitHub API Types', () => {
    it('should represent GitHub commit response', () => {
      const response: GitHubCommitResponse = {
        sha: 'abc123',
        commit: {
          message: 'feat: add new feature',
          author: {
            name: 'John Doe',
            email: 'john@example.com',
            date: '2023-12-01T10:00:00Z'
          }
        },
        author: {
          login: 'johndoe',
          avatar_url: 'https://github.com/johndoe.png',
          html_url: 'https://github.com/johndoe'
        },
        stats: {
          additions: 50,
          deletions: 10,
          total: 60
        },
        html_url: 'https://github.com/owner/repo/commit/abc123'
      };

      expect(response.sha).toBe('abc123');
      expect(response.commit.author.name).toBe('John Doe');
      expect(response.author?.login).toBe('johndoe');
      expect(response.stats?.additions).toBe(50);
    });
  });
});