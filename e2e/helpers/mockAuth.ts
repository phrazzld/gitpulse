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
 * Sets up a mock NextAuth session for testing
 * This bypasses the actual OAuth flow for CI and testing environments
 * 
 * @param page - Playwright Page object
 * @param mockUser - Optional user data to use in the session
 */
export async function setupMockAuth(page: Page, mockUser: MockUser = defaultMockUser) {
  // Create a mock session that mimics what NextAuth would store
  const mockSession = {
    user: mockUser,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    accessToken: 'mock-github-token',
    installationId: 12345678
  };

  // Store the session in localStorage to simulate being logged in
  await page.evaluate((session) => {
    // Create a key that matches NextAuth's session key format
    window.localStorage.setItem('next-auth.session-token', JSON.stringify(session));
    
    // Also set a flag to indicate we're using a mock session
    window.localStorage.setItem('mock-auth-enabled', 'true');
  }, mockSession);

  // Add a script to the page that will intercept fetch requests to auth endpoints
  await page.addInitScript(() => {
    const originalFetch = window.fetch;
    
    // Override fetch to intercept requests to NextAuth endpoints
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Check if this is a request to NextAuth session endpoint
      if (url.includes('/api/auth/session')) {
        const mockSession = localStorage.getItem('next-auth.session-token');
        if (mockSession) {
          return new Response(mockSession, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // For all other requests, use the original fetch
      return originalFetch(input, init);
    };
  });
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
  return process.env.MOCK_AUTH === 'true' 
    || process.env.E2E_MOCK_AUTH_ENABLED === 'true'
    || isRunningInCI();
}