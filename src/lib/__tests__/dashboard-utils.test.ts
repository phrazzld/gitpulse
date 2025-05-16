import { jest } from '@jest/globals';
import { mockDate, mockConsole } from '../tests';
import {
  getTodayDate,
  getLastWeekDate,
  formatDateToISOString,
  getGitHubAppInstallUrl,
  createDateRange,
  getDefaultDateRange
} from '../dashboard-utils';

// Store original environment variables and Date constructor
const originalEnv = process.env;

describe('Dashboard utilities', () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Mock console.error to prevent test output pollution
    restoreConsole = mockConsole(['error']);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    restoreConsole();
  });

  describe('formatDateToISOString', () => {
    it('formats a date object to ISO date string (YYYY-MM-DD)', () => {
      const testDate = new Date('2023-04-15T12:00:00Z');
      expect(formatDateToISOString(testDate)).toBe('2023-04-15');
    });
  });

  describe('getTodayDate', () => {
    it('returns today\'s date in ISO format', () => {
      // Mock Date using our utility
      const { restore } = mockDate('2023-05-20T12:00:00Z');
      
      try {
        expect(getTodayDate()).toBe('2023-05-20');
      } finally {
        // Always restore the Date constructor
        restore();
      }
    });
  });

  describe('getLastWeekDate', () => {
    it('returns the date from 7 days ago in ISO format', () => {
      // Mock Date using our utility
      const { restore } = mockDate('2023-05-20T12:00:00Z');
      
      try {
        expect(getLastWeekDate()).toBe('2023-05-13');
      } finally {
        // Always restore the Date constructor
        restore();
      }
    });
  });

  describe('getGitHubAppInstallUrl', () => {
    it('returns the correct GitHub App install URL when env var is set', () => {
      process.env.NEXT_PUBLIC_GITHUB_APP_NAME = 'test-app';
      
      expect(getGitHubAppInstallUrl()).toBe('https://github.com/apps/test-app/installations/new');
    });
    
    it('returns an error indicator when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
      
      expect(getGitHubAppInstallUrl()).toBe('#github-app-not-configured');
      expect(console.error).toHaveBeenCalledWith(
        'GitHub App name not configured. Please set NEXT_PUBLIC_GITHUB_APP_NAME environment variable.'
      );
    });
  });

  describe('createDateRange', () => {
    it('creates a date range object with the provided dates', () => {
      const since = '2023-04-01';
      const until = '2023-04-30';
      
      const result = createDateRange(since, until);
      
      expect(result).toEqual({
        since: '2023-04-01',
        until: '2023-04-30'
      });
    });
  });

  describe('getDefaultDateRange', () => {
    it('returns a date range from a week ago to today', () => {
      // Mock Date using our utility
      const { restore } = mockDate('2023-05-20T12:00:00Z');
      
      try {
        // Call the function under test
        const dateRange = getDefaultDateRange();
        
        // Verify the result
        expect(dateRange).toEqual({
          since: '2023-05-13',
          until: '2023-05-20'
        });
      } finally {
        // Always restore the Date constructor
        restore();
      }
    });
  });
});