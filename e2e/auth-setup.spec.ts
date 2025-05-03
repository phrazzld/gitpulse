/**
 * Simple test file to verify our authentication setup is working correctly
 */
import { test, expect } from '@playwright/test';

test('should have authentication cookie from global setup', async ({ page }) => {
  console.log('Testing authentication from global setup...');
  
  // Navigate to a protected route (dashboard)
  await page.goto('/dashboard');
  
  // Check that we're not redirected to login page
  expect(page.url()).not.toContain('/api/auth/signin');
  
  // We should see some dashboard elements if we're authenticated
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  
  // We can also check for user elements that would only show if authenticated
  await expect(page.locator('text=Mock User')).toBeVisible({ timeout: 10000 });
  
  console.log('Authentication from global setup verified successfully!');
});

// This test verifies we can access authenticated API endpoints
test('should be able to access authenticated API endpoints', async ({ page, request }) => {
  // Try to fetch a protected API route
  const response = await request.get('/api/repos');
  
  // Check that we get a successful response
  expect(response.status()).toBe(200);
  
  // Verify the response body is valid JSON
  const body = await response.json();
  expect(body).toBeDefined();
});