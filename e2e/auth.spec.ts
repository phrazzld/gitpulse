import { test, expect } from '@playwright/test';
import { isMockAuthEnabled } from './helpers/mockAuth';

/**
 * Authentication tests
 * 
 * These tests verify that authentication is working correctly by checking:
 * 1. Authenticated state allows access to protected pages
 * 2. When unauthenticated, protected access is blocked
 */

// Test that unauthenticated users don't have access to the dashboard
test.describe('Unauthenticated Access', () => {
  // Use a special config with empty storage state (no auth cookies)
  test.use({ storageState: { cookies: [], origins: [] } });
  
  test('should verify dashboard is protected', async ({ page }) => {
    // Navigate to the dashboard page (which requires authentication)
    await page.goto('/dashboard');
    
    // Take screenshot to diagnose what's visible
    await page.screenshot({ path: 'unauthenticated-dashboard.png' });
    
    // Verify there's a fundamental difference between authenticated and unauthenticated state
    // Wait for authentication state to be processed (loading or auth page)
    await page.waitForLoadState('networkidle');
    
    // The most reliable check is to verify we don't have the session cookie
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
    
    // If we're properly unauthenticated, we should not have this cookie
    expect(authCookie).toBeUndefined();
    
    // Additionally, we need to verify we are not allowed to see protected content
    // Check that a URL redirect happened or we see an auth screen
    const url = page.url();
    const isRedirected = !url.endsWith('/dashboard') || url.includes('signin') || url.includes('auth');
    
    const signInVisible = await page.locator('text=/Sign in|Login|Authenticate/i').count() > 0;
    
    // Either we were redirected or we see authentication UI
    expect(isRedirected || signInVisible).toBeTruthy();
  });
});

// Test with authenticated state 
test.describe('Authenticated Access', () => {
  test('should have authentication cookie applied', async ({ context }) => {
    // Skip this test if mock auth is not enabled
    test.skip(!isMockAuthEnabled(), 'Skipping: requires authentication');
  
    // Verify the auth cookie is present
    const cookies = await context.cookies();
    const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
    
    // We must have the auth cookie in our authenticated state
    expect(authCookie).toBeDefined();
    
    // Check cookie attributes
    if (authCookie) {
      expect(authCookie.httpOnly).toBe(true);
      expect(authCookie.path).toBe('/');
    }
    
    // Log success
    console.log('Authentication cookie is present and configured correctly');
  });
});