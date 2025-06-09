import {
  validateDateRange,
  validateRepositories,
  validateUsers,
  validateBranch,
  validateSummaryRequest,
  createErrorMessage,
  createValidationConfig as legacyCreateValidationConfig,
  ValidationConfig
} from './summary';
import { createValidationConfig } from '../config/index';
import type { DateRange, SummaryRequest, ValidationError, Config } from '../types/index';

describe('Summary Validation', () => {
  // Default validation config for tests
  const defaultConfig = createValidationConfig();
  describe('createErrorMessage', () => {
    it('should return message for known key', () => {
      const message = createErrorMessage('validation.dateRange.invalidStartDate');
      expect(message).toBe('Start date is not a valid date');
    });

    it('should interpolate parameters', () => {
      const message = createErrorMessage('validation.dateRange.tooLong', {
        maxDays: 365,
        selectedDays: 400
      });
      expect(message).toBe('Date range cannot exceed 365 days (selected: 400 days)');
    });

    it('should handle multiple parameters', () => {
      const message = createErrorMessage('validation.repositories.tooMany', {
        maxRepos: 100,
        count: 150
      });
      expect(message).toBe('Cannot process more than 100 repositories (selected: 150)');
    });

    it('should return key if message not found', () => {
      const message = createErrorMessage('unknown.key');
      expect(message).toBe('unknown.key');
    });
  });

  describe('validateDateRange', () => {
    const validStart = new Date('2023-01-01');
    const validEnd = new Date('2023-01-31');

    it('should accept valid date range', () => {
      const result = validateDateRange(validStart, validEnd, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.start).toEqual(validStart);
        expect(result.data.end).toEqual(validEnd);
      }
    });

    it('should reject invalid start date', () => {
      const invalidStart = new Date('invalid');
      const result = validateDateRange(invalidStart, validEnd, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start date is not a valid date');
      }
    });

    it('should reject invalid end date', () => {
      const invalidEnd = new Date('invalid');
      const result = validateDateRange(validStart, invalidEnd, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('End date is not a valid date');
      }
    });

    it('should reject both invalid dates', () => {
      const invalidStart = new Date('invalid');
      const invalidEnd = new Date('invalid');
      const result = validateDateRange(invalidStart, invalidEnd, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toHaveLength(2);
        expect(result.error).toContain('Start date is not a valid date');
        expect(result.error).toContain('End date is not a valid date');
      }
    });

    it('should reject start date after end date', () => {
      const result = validateDateRange(validEnd, validStart, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start date must be before end date');
      }
    });

    it('should reject future dates by default', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const result = validateDateRange(validStart, futureDate, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Dates cannot be in the future');
      }
    });

    it('should allow future dates when configured', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30); // 30 days in future
      
      const result = validateDateRange(today, futureDate, createValidationConfig({ allowFutureDates: true }));
      
      expect(result.success).toBe(true);
    });

    it('should reject date range exceeding max days', () => {
      const longEnd = new Date('2024-01-02'); // 366 days
      const result = validateDateRange(validStart, longEnd, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('cannot exceed 365 days'))).toBe(true);
      }
    });

    it('should respect custom max days configuration', () => {
      const longEnd = new Date('2023-02-15'); // 45 days
      const result = validateDateRange(validStart, longEnd, createValidationConfig({ maxDateRangeDays: 30 }));
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('cannot exceed 30 days'))).toBe(true);
      }
    });

    it('should accept single-day date ranges', () => {
      const sameDay = new Date('2023-01-01');
      const result = validateDateRange(sameDay, sameDay, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.start).toEqual(sameDay);
        expect(result.data.end).toEqual(sameDay);
      }
    });

    it('should still reject backwards date ranges', () => {
      const earlier = new Date('2023-01-01');
      const later = new Date('2023-01-05');
      // Test backwards range (start after end)
      const result = validateDateRange(later, earlier, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Start date must be before end date');
      }
    });

    it('should collect multiple errors', () => {
      const longPastDate = new Date('2020-01-01');
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const result = validateDateRange(futureDate, longPastDate, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThanOrEqual(2);
        expect(result.error.some(e => e.includes('Start date must be before end date'))).toBe(true);
      }
    });
  });

  describe('validateRepositories', () => {
    it('should accept valid repository list', () => {
      const repos = ['owner/repo1', 'owner/repo2', 'org/project'];
      const result = validateRepositories(repos, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(repos);
      }
    });

    it('should reject non-array input', () => {
      const result = validateRepositories('not-an-array' as any, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Repositories must be provided as an array');
      }
    });

    it('should reject empty array', () => {
      const result = validateRepositories([], defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('At least one repository must be selected');
      }
    });

    it('should reject too many repositories', () => {
      const repos = Array(101).fill('owner/repo');
      const result = validateRepositories(repos, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Cannot process more than 100 repositories'))).toBe(true);
      }
    });

    it('should respect custom repository limit', () => {
      const repos = Array(11).fill('owner/repo');
      const result = validateRepositories(repos, createValidationConfig({ maxRepositories: 10 }));
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Cannot process more than 10 repositories'))).toBe(true);
      }
    });

    it('should reject invalid repository format', () => {
      const repos = ['invalid-format', 'owner/repo', 'also invalid', '@owner/repo'];
      const result = validateRepositories(repos, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Invalid repository format'))).toBe(true);
        expect(result.error.some(e => e.includes('invalid-format'))).toBe(true);
      }
    });

    it('should handle special characters in valid repository names', () => {
      const repos = ['owner-name/repo.name', 'org_name/project-123', 'user/repo_v2.0'];
      const result = validateRepositories(repos, defaultConfig);
      
      expect(result.success).toBe(true);
    });

    it('should reject duplicates', () => {
      const repos = ['owner/repo1', 'owner/repo2', 'owner/repo1'];
      const result = validateRepositories(repos, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Duplicate repositories are not allowed'))).toBe(true);
        expect(result.error.some(e => e.includes('owner/repo1'))).toBe(true);
      }
    });

    it('should collect multiple errors', () => {
      const repos = ['invalid', ...Array(101).fill('owner/repo'), 'owner/repo'];
      const result = validateRepositories(repos, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThan(1);
        expect(result.error.some(e => e.includes('Invalid repository format'))).toBe(true);
        expect(result.error.some(e => e.includes('Cannot process more than'))).toBe(true);
        expect(result.error.some(e => e.includes('Duplicate'))).toBe(true);
      }
    });
  });

  describe('validateUsers', () => {
    it('should accept undefined users', () => {
      const result = validateUsers(undefined, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should accept valid user list', () => {
      const users = ['user1', 'user-2', 'user_3'];
      const result = validateUsers(users, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(users);
      }
    });

    it('should reject non-array input', () => {
      const result = validateUsers('not-an-array' as any, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Users must be provided as an array');
      }
    });

    it('should accept empty array', () => {
      const result = validateUsers([], defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should reject too many users', () => {
      const users = Array(51).fill('user').map((u, i) => `${u}${i}`);
      const result = validateUsers(users, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Cannot filter by more than 50 users'))).toBe(true);
      }
    });

    it('should respect custom user limit', () => {
      const users = Array(6).fill('user').map((u, i) => `${u}${i}`);
      const result = validateUsers(users, createValidationConfig({ maxUsers: 5 }));
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Cannot filter by more than 5 users'))).toBe(true);
      }
    });

    it('should reject invalid usernames', () => {
      const users = [
        'valid-user',
        '-invalid',
        'invalid-',
        'in valid',
        'in@valid',
        'a'.repeat(40), // too long
        '' // empty
      ];
      const result = validateUsers(users, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Invalid GitHub username'))).toBe(true);
      }
    });

    it('should accept single character usernames', () => {
      const users = ['a', 'b', 'c'];
      const result = validateUsers(users, defaultConfig);
      
      expect(result.success).toBe(true);
    });

    it('should reject duplicates (case-insensitive)', () => {
      const users = ['user1', 'User2', 'USER1'];
      const result = validateUsers(users, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('Duplicate users are not allowed'))).toBe(true);
      }
    });

    it('should collect multiple errors', () => {
      const users = [
        ...Array(51).fill('user').map((u, i) => `${u}${i}`),
        'invalid-',
        'user1' // duplicate
      ];
      const result = validateUsers(users, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThan(1);
      }
    });
  });

  describe('validateBranch', () => {
    it('should accept undefined branch', () => {
      const result = validateBranch(undefined, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should accept valid branch names', () => {
      const branches = [
        'main',
        'feature/new-feature',
        'bugfix/issue-123',
        'release-1.0.0',
        'hotfix_urgent'
      ];
      
      branches.forEach(branch => {
        const result = validateBranch(branch, defaultConfig);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(branch);
        }
      });
    });

    it('should reject non-string input', () => {
      const result = validateBranch(123 as any, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Branch name must be a string');
      }
    });

    it('should reject empty branch name', () => {
      const result = validateBranch('   ', defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Branch name cannot be empty');
      }
    });

    it('should reject too long branch name', () => {
      const longBranch = 'a'.repeat(251);
      const result = validateBranch(longBranch, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.includes('too long'))).toBe(true);
        expect(result.error.some(e => e.includes('251'))).toBe(true);
      }
    });

    it('should reject invalid characters', () => {
      const invalidBranches = [
        'branch name', // space
        'branch@name', // @
        'branch#name', // #
        'branch*name', // *
        'branch\\name' // backslash
      ];
      
      invalidBranches.forEach(branch => {
        const result = validateBranch(branch, defaultConfig);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.some(e => e.includes('invalid characters'))).toBe(true);
        }
      });
    });

    it('should collect multiple errors', () => {
      const invalidBranch = 'a b'.repeat(126); // invalid chars and too long
      const result = validateBranch(invalidBranch, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBe(2);
        expect(result.error.some(e => e.includes('too long'))).toBe(true);
        expect(result.error.some(e => e.includes('invalid characters'))).toBe(true);
      }
    });
  });

  describe('validateSummaryRequest', () => {
    const validRequest: SummaryRequest = {
      repositories: ['owner/repo1', 'owner/repo2'],
      dateRange: {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31')
      }
    };

    it('should accept valid summary request', () => {
      const result = validateSummaryRequest(validRequest, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repositories).toEqual(validRequest.repositories);
        expect(result.data.dateRange.start).toEqual(validRequest.dateRange.start);
        expect(result.data.dateRange.end).toEqual(validRequest.dateRange.end);
        expect(result.data.includePrivate).toBe(false);
      }
    });

    it('should accept request with all optional fields', () => {
      const fullRequest = {
        ...validRequest,
        users: ['user1', 'user2'],
        branch: 'main',
        includePrivate: true
      };
      
      const result = validateSummaryRequest(fullRequest, defaultConfig);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.users).toEqual(['user1', 'user2']);
        expect(result.data.branch).toBe('main');
        expect(result.data.includePrivate).toBe(true);
      }
    });

    it('should reject non-object request', () => {
      const result = validateSummaryRequest(null, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error[0].field).toBe('request');
        expect(result.error[0].code).toBe('INVALID_TYPE');
      }
    });

    it('should reject missing date range', () => {
      const request = {
        repositories: ['owner/repo']
      };
      
      const result = validateSummaryRequest(request, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.field === 'dateRange')).toBe(true);
        expect(result.error.some(e => e.code === 'MISSING_FIELD')).toBe(true);
      }
    });

    it('should reject missing repositories', () => {
      const request = {
        dateRange: {
          start: '2023-01-01',
          end: '2023-01-31'
        }
      };
      
      const result = validateSummaryRequest(request, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.field === 'repositories')).toBe(true);
        expect(result.error.some(e => e.code === 'MISSING_FIELD')).toBe(true);
      }
    });

    it('should collect errors from all fields', () => {
      const request = {
        repositories: ['invalid', 'owner/repo', 'owner/repo'], // invalid + duplicate
        dateRange: {
          start: '2023-12-01',
          end: '2023-01-01' // end before start
        },
        users: ['invalid-', 'user1', 'user1'], // invalid + duplicate
        branch: 'invalid branch name' // spaces
      };
      
      const result = validateSummaryRequest(request, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.field === 'dateRange')).toBe(true);
        expect(result.error.some(e => e.field === 'repositories')).toBe(true);
        expect(result.error.some(e => e.field === 'users')).toBe(true);
        expect(result.error.some(e => e.field === 'branch')).toBe(true);
      }
    });

    it('should handle invalid date strings', () => {
      const request = {
        repositories: ['owner/repo'],
        dateRange: {
          start: 'invalid-date',
          end: 'also-invalid'
        }
      };
      
      const result = validateSummaryRequest(request, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => e.field === 'dateRange')).toBe(true);
        expect(result.error.some(e => e.message.includes('not a valid date'))).toBe(true);
      }
    });

    it('should respect custom configuration', () => {
      const request = {
        repositories: Array(11).fill('owner/repo'),
        dateRange: {
          start: '2023-01-01',
          end: '2023-02-15' // 45 days
        }
      };
      
      const config = createValidationConfig({
        maxRepositories: 10,
        maxDateRangeDays: 30
      });
      
      const result = validateSummaryRequest(request, config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.some(e => 
          e.message.includes('Cannot process more than 10 repositories')
        )).toBe(true);
        expect(result.error.some(e => 
          e.message.includes('cannot exceed 30 days')
        )).toBe(true);
      }
    });
  });

  describe('createValidationConfig', () => {
    it('should return default config when no app config provided', () => {
      const config = createValidationConfig();
      
      expect(config).toEqual({
        maxRepositories: 100,
        maxDateRangeDays: 365,
        maxUsers: 50,
        allowFutureDates: false,
        minDateRangeDays: 0,
        maxBranchNameLength: 250
      });
    });

    it('should return default config when no overrides provided', () => {
      const config = createValidationConfig();
      
      expect(config.maxRepositories).toBe(100);
      expect(config.maxDateRangeDays).toBe(365);
      expect(config.maxUsers).toBe(50);
    });

    it('should use partial overrides when provided', () => {
      const config = createValidationConfig({
        maxRepositories: 50,
        maxDateRangeDays: 180,
        maxUsers: 25
      });
      
      expect(config.maxRepositories).toBe(50);
      expect(config.maxDateRangeDays).toBe(180);
      expect(config.maxUsers).toBe(25);
      expect(config.allowFutureDates).toBe(false);
      expect(config.minDateRangeDays).toBe(0);
    });

    it('should use defaults for missing limit values', () => {
      const config = createValidationConfig({
        maxRepositories: 50
        // Other values should use defaults
      });
      
      expect(config.maxRepositories).toBe(50);
      expect(config.maxDateRangeDays).toBe(365); // default
      expect(config.maxUsers).toBe(50); // default
      expect(config.allowFutureDates).toBe(false);
    });
  });

  describe('Edge Cases and Error Messages', () => {
    it('should handle malformed date objects gracefully', () => {
      const result = validateDateRange(
        new Date('2023-01-01'),
        {} as Date, // malformed date object
        defaultConfig
      );
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('End date is not a valid date');
      }
    });

    it('should provide actionable error messages', () => {
      const repos = Array(150).fill('owner/repo');
      const result = validateRepositories(repos, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        // Message should include both limit and actual count
        expect(result.error.some(e => 
          e.includes('100') && e.includes('150')
        )).toBe(true);
      }
    });

    it('should truncate long lists in error messages', () => {
      const invalidRepos = Array(10).fill(null).map((_, i) => `invalid${i}`);
      const result = validateRepositories(invalidRepos, defaultConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.find(e => e.includes('Invalid repository format'));
        expect(errorMsg).toBeDefined();
        expect(errorMsg).toContain('...');
        expect(errorMsg).not.toContain('invalid9'); // should be truncated
      }
    });

    it('should handle concurrent validation of multiple fields', () => {
      const request = {
        repositories: ['owner/repo'],
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-01-31')
        },
        users: ['user1'],
        branch: 'main'
      };
      
      const result = validateSummaryRequest(request, defaultConfig);
      
      expect(result.success).toBe(true);
      // All validations should run independently
    });
  });

  describe('Function Purity', () => {
    it('should not mutate input arrays', () => {
      const repos = ['owner/repo1', 'owner/repo2'];
      const originalRepos = [...repos];
      
      validateRepositories(repos, defaultConfig);
      
      expect(repos).toEqual(originalRepos);
    });

    it('should not mutate input objects', () => {
      const request = {
        repositories: ['owner/repo'],
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-01-31')
        }
      };
      const originalRequest = JSON.parse(JSON.stringify(request));
      
      validateSummaryRequest(request, defaultConfig);
      
      expect(JSON.parse(JSON.stringify(request))).toEqual(originalRequest);
    });

    it('should produce consistent results', () => {
      const repos = ['owner/repo1', 'owner/repo2'];
      
      const result1 = validateRepositories(repos, defaultConfig);
      const result2 = validateRepositories(repos, defaultConfig);
      
      expect(result1).toEqual(result2);
    });

    it('should work with readonly arrays', () => {
      const repos: readonly string[] = ['owner/repo1', 'owner/repo2'];
      const users: readonly string[] = ['user1', 'user2'];
      
      const repoResult = validateRepositories(repos, defaultConfig);
      const userResult = validateUsers(users, defaultConfig);
      
      expect(repoResult.success).toBe(true);
      expect(userResult.success).toBe(true);
    });
  });
});