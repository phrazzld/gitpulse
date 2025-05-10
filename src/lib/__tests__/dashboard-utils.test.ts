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
      // Create a fixed test date
      const testDate = new Date('2023-05-20T12:00:00Z');
      const expectedLastWeekDate = '2023-05-13';
      
      // Save the original Date constructor
      const originalDate = global.Date;
      const originalNow = Date.now;
      
      try {
        // Mock Date.now to return our fixed date timestamp
        Date.now = jest.fn(() => testDate.getTime());
        
        // Mock Date constructor
        global.Date = class extends originalDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              // When called with no args, return our fixed date
              super(testDate);
            } else {
              // Otherwise call the original constructor with explicit args
              if (args.length === 1) {
                super(args[0]);
              } else if (args.length === 2) {
                super(args[0], args[1]);
              } else if (args.length === 3) {
                super(args[0], args[1], args[2]);
              } else if (args.length === 4) {
                super(args[0], args[1], args[2], args[3]);
              } else if (args.length === 5) {
                super(args[0], args[1], args[2], args[3], args[4]);
              } else if (args.length === 6) {
                super(args[0], args[1], args[2], args[3], args[4], args[5]);
              } else if (args.length === 7) {
                super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
              } else {
                super(args[0]);
              }
            }
          }
        } as typeof Date;
        
        // Create a custom implementation for getLastWeekDate to validate
        // We create a date object exactly 7 days before our test date
        const lastWeekDate = new Date(testDate);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        const lastWeekString = formatDateToISOString(lastWeekDate);
        
        expect(getLastWeekDate()).toBe(expectedLastWeekDate);
        expect(lastWeekString).toBe(expectedLastWeekDate);
      } finally {
        // Always restore Date constructor and methods
        global.Date = originalDate;
        Date.now = originalNow;
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
      // Create a proper spy on the actual module functions
      const dashboardUtils = require('../dashboard-utils');
      
      // Store original functions before spying
      const originalGetTodayDate = dashboardUtils.getTodayDate;
      const originalGetLastWeekDate = dashboardUtils.getLastWeekDate;
      
      try {
        // Create spies with mock implementations
        jest.spyOn(dashboardUtils, 'getTodayDate').mockReturnValue('2023-05-20');
        jest.spyOn(dashboardUtils, 'getLastWeekDate').mockReturnValue('2023-05-13');
        
        // Call the function under test
        const dateRange = dashboardUtils.getDefaultDateRange();
        
        // Verify the result
        expect(dateRange).toEqual({
          since: '2023-05-13',
          until: '2023-05-20'
        });
        
        // Verify the spies were called
        expect(dashboardUtils.getTodayDate).toHaveBeenCalledTimes(1);
        expect(dashboardUtils.getLastWeekDate).toHaveBeenCalledTimes(1);
      } finally {
        // Restore original functions (important to avoid affecting other tests)
        dashboardUtils.getTodayDate = originalGetTodayDate;
        dashboardUtils.getLastWeekDate = originalGetLastWeekDate;
        
        // Alternative approach: use mockRestore if you're using jest.spyOn properly
        if (jest.isMockFunction(dashboardUtils.getTodayDate)) {
          (dashboardUtils.getTodayDate as jest.Mock).mockRestore();
        }
        
        if (jest.isMockFunction(dashboardUtils.getLastWeekDate)) {
          (dashboardUtils.getLastWeekDate as jest.Mock).mockRestore();
        }
      }
    });
  });
});