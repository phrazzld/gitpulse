import { chromium, FullConfig } from '@playwright/test';
import { isMockAuthEnabled } from './helpers/mockAuth';

/**
 * Global setup for Playwright tests
 * 
 * This runs before tests and can be used for environment setup
 */
async function globalSetup(config: FullConfig) {
  console.log(`Running global setup for Playwright tests...`);
  
  // Log environment info
  console.log(`CI environment: ${process.env.CI ? 'Yes' : 'No'}`);
  console.log(`Mock Auth enabled: ${isMockAuthEnabled() ? 'Yes' : 'No'}`);
  
  // Additional global setup can be added here if needed
  // For example, you could pre-build the app, or seed a test database
}

export default globalSetup;