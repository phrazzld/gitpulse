/**
 * This is a simple script to test our global setup
 * We can run this directly without the full test suite to verify that cookies are being set
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function testGlobalSetup() {
  console.log('Testing global setup for authentication...');
  
  // Mock environment variables
  const env = process.env as unknown as Record<string, string>;
  env.NODE_ENV = 'test';
  env.E2E_MOCK_AUTH_ENABLED = 'true';
  
  // Import and run our global setup
  const globalSetupPath = path.resolve(__dirname, './config/globalSetup.ts');
  console.log(`Importing global setup from: ${globalSetupPath}`);
  
  const globalSetup = require(globalSetupPath).default;
  
  // Mock config similar to Playwright's
  const mockConfig = {
    projects: [
      {
        use: {
          baseURL: 'http://localhost:3000'
        }
      }
    ]
  };
  
  try {
    // Run global setup
    await globalSetup(mockConfig);
    
    // Check if storageState.json was created
    const storageStatePath = path.resolve(__dirname, './storageState.json');
    if (fs.existsSync(storageStatePath)) {
      console.log(`Storage state file exists at: ${storageStatePath}`);
      
      // Read and parse the file
      const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));
      
      // Check if auth cookie exists
      const authCookie = storageState.cookies.find((cookie: { name: string }) => cookie.name === 'next-auth.session-token');
      
      if (authCookie) {
        console.log('Auth cookie found in storage state. Global setup succeeded!');
        console.log('Cookie domain:', authCookie.domain);
        console.log('Cookie path:', authCookie.path);
        console.log('Cookie sameSite:', authCookie.sameSite);
        console.log('Cookie httpOnly:', authCookie.httpOnly);
      } else {
        console.error('Auth cookie not found in storage state!');
        process.exit(1);
      }
    } else {
      console.error(`Storage state file was not created at: ${storageStatePath}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error testing global setup:', error);
    process.exit(1);
  }
}

// Run the test
testGlobalSetup().catch(console.error);