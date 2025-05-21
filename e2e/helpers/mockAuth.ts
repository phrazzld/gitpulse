import { Page } from '@playwright/test';

/**
 * Interface for the mock user data
 */
export interface MockUser {
  name: string;
  email: string;
  image?: string;
}

/**
 * Default mock user if none is provided
 */
const defaultMockUser: MockUser = {
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://github.com/ghost.png'
};

/**
 * DEPRECATED - This method is no longer used and is kept only for reference.
 * Mock authentication is now implemented using cookies via the global setup
 * in e2e/config/globalSetup.ts.
 * 
 * @deprecated Use the cookie-based approach with globalSetup and storageState instead.
 * 
 * For more information, see docs/E2E_MOCK_AUTH_STRATEGY.md
 */
export async function setupMockAuth(page: Page, mockUser: MockUser = defaultMockUser) {
  console.warn(
    'Warning: setupMockAuth is deprecated and should not be used. ' + 
    'The application now uses a cookie-based authentication approach with Playwright globalSetup.'
  );
  
  // This method is kept only for historical reference and should not be called.
  throw new Error(
    'setupMockAuth is deprecated. Use the cookie-based authentication approach. ' +
    'See docs/E2E_MOCK_AUTH_STRATEGY.md for details.'
  );
}

/**
 * Determines if tests are running in CI environment
 */
export function isRunningInCI(): boolean {
  return process.env.CI === 'true' || process.env.CI === '1';
}

/**
 * Determines if auth mocking is enabled
 */
export function isMockAuthEnabled(): boolean {
  const mockAuth = process.env.MOCK_AUTH === 'true';
  const e2eMockAuthEnabled = process.env.E2E_MOCK_AUTH_ENABLED === 'true';
  const inCI = isRunningInCI();
  
  // Log the environment state for debugging in CI
  if (inCI) {
    console.log(`Mock Auth Environment: MOCK_AUTH=${process.env.MOCK_AUTH}, E2E_MOCK_AUTH_ENABLED=${process.env.E2E_MOCK_AUTH_ENABLED}, CI=${process.env.CI}`);
  }
  
  return mockAuth || e2eMockAuthEnabled || inCI;
}