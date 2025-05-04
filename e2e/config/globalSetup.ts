import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { isMockAuthEnabled } from '../helpers/mockAuth';

/**
 * Global setup for Playwright tests using direct cookie creation
 * This avoids relying on the API endpoint working and just creates the cookie directly
 */
async function globalSetup(config: FullConfig) {
  console.log(`Running global setup for Playwright tests...`);
  
  // Log environment info
  console.log(`CI environment: ${process.env.CI ? 'Yes' : 'No'}`);
  console.log(`Mock Auth enabled: ${isMockAuthEnabled() ? 'Yes' : 'No'}`);
  console.log(`Environment variables: NODE_ENV=${process.env.NODE_ENV}, E2E_MOCK_AUTH_ENABLED=${process.env.E2E_MOCK_AUTH_ENABLED}, NEXTAUTH_SECRET=${process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set'}`);
  console.log(`Working directory: ${process.cwd()}`);
  
  // Skip if mock auth is not enabled
  if (!isMockAuthEnabled()) {
    console.log('Mock authentication is not enabled, skipping auth setup');
    return;
  }

  // Get base URL from config
  const { baseURL } = config.projects[0].use;
  if (!baseURL) {
    throw new Error('baseURL must be specified in the Playwright config');
  }

  console.log(`Using base URL: ${baseURL}`);

  // Launch a browser
  const browser = await chromium.launch();
  
  try {
    // Create a new browser context
    const context = await browser.newContext();
    
    // Create the mock session data - this matches the structure from the API endpoint
    const mockSessionData = {
      user: {
        id: 'playwright-test-user',
        name: 'Playwright Test User',
        email: 'playwright@example.com',
        image: 'https://github.com/ghost.png',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      accessToken: 'mock-github-token',
      installationId: 12345678
    };
    
    // Create cookie value by base64 encoding the session data
    const cookieValue = Buffer.from(JSON.stringify(mockSessionData)).toString('base64');
    
    // Add the cookie directly to the context
    const domain = new URL(baseURL).hostname;
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: cookieValue,
        domain,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      }
    ]);
    
    console.log('Added mock authentication cookie to browser context');
    
    // Ensure storage directory exists
    const storageStatePath = path.resolve(__dirname, '../storageState.json');
    const storageStateDir = path.dirname(storageStatePath);
    if (!fs.existsSync(storageStateDir)) {
      fs.mkdirSync(storageStateDir, { recursive: true });
    }
    
    // Save the authenticated state to a file
    await context.storageState({ path: storageStatePath });
    console.log(`Authenticated state saved to: ${storageStatePath}`);
    
    // Verify the cookie was set by checking storage state
    const state = await context.storageState();
    const authCookie = state.cookies.find(cookie => cookie.name === 'next-auth.session-token');
    
    if (!authCookie) {
      console.error('Available cookies:', JSON.stringify(state.cookies, null, 2));
      throw new Error('Authentication cookie not found in storage state');
    }
    
    console.log('Authentication cookie verified in storage state');
    console.log(`Cookie details: domain=${authCookie.domain}, path=${authCookie.path}, httpOnly=${authCookie.httpOnly}, secure=${authCookie.secure}, sameSite=${authCookie.sameSite}`);
    
    // Write the storage state to a separate debug file in CI for troubleshooting
    if (process.env.CI) {
      const debugPath = path.resolve(__dirname, '../storageState-debug.json');
      fs.writeFileSync(debugPath, JSON.stringify(state, null, 2));
      console.log(`Wrote debug storage state to: ${debugPath}`);
    }
    
  } catch (error) {
    console.error('Error during authentication setup:', error);
    throw error; // Re-throw to fail the setup
  } finally {
    // Close the browser
    await browser.close();
  }
}

export default globalSetup;