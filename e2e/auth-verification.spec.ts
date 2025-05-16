import { test, expect } from '@playwright/test';

/**
 * This test verifies that our authentication configuration is working correctly.
 * It simply checks that the auth cookie is set correctly.
 */
test('should have authentication cookie properly configured', async ({ page, context }) => {
  // Go to homepage
  await page.goto('/');
  
  // Verify the cookie exists in the context
  const cookies = await context.cookies();
  const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
  
  // Make sure the cookie exists
  expect(authCookie).toBeDefined();
  
  // Type assertion to handle the possibility of undefined
  if (authCookie) {
    expect(authCookie.httpOnly).toBe(true);
    expect(authCookie.path).toBe('/');
  }
  
  // This is enough verification for the configuration task
  console.log('✅ Authentication cookie is properly configured');
});