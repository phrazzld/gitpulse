import { test, expect } from '@playwright/test';
import { setupMockAuth, isMockAuthEnabled } from './helpers/mockAuth';

// Tests that require authentication
test.describe('Dashboard Features', () => {
  
  // Use conditionals to skip tests if they can't be properly tested in the environment
  test('should display repository section when data is available', async ({ page }) => {
    // Skip this test if mock auth is not enabled and we're not in a development environment
    // that might have real auth setup
    test.skip(!isMockAuthEnabled() && process.env.NODE_ENV !== 'development', 
      'Skipping: requires authentication');
    
    // Setup mock authentication
    if (isMockAuthEnabled()) {
      await setupMockAuth(page);
    }
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // If using mock auth, we might need to handle API data responses differently
    if (isMockAuthEnabled()) {
      // Intercept API calls to return mock data
      await page.route('**/api/repos**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            repositories: [
              { id: 1, name: 'mock-repo-1', description: 'Mock Repository 1', url: 'https://github.com/org/mock-repo-1' },
              { id: 2, name: 'mock-repo-2', description: 'Mock Repository 2', url: 'https://github.com/org/mock-repo-2' }
            ]
          })
        });
      });
    }
    
    // Verify repository section is visible
    await expect(page.locator('[data-testid="repository-section"]')).toBeVisible({ timeout: 10000 });
    
    // Verify repository data is loaded (or mock data is shown)
    const repoCount = await page.locator('[data-testid="repository-item"]').count();
    expect(repoCount).toBeGreaterThan(0);
  });

  test('should filter commits when using filters panel', async ({ page }) => {
    // Skip this test if mock auth is not enabled and we're not in a development environment
    test.skip(!isMockAuthEnabled() && process.env.NODE_ENV !== 'development', 
      'Skipping: requires authentication');
    
    // Setup mock authentication
    if (isMockAuthEnabled()) {
      await setupMockAuth(page);
      
      // Intercept API calls to return mock data
      await page.route('**/api/repos**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            repositories: [
              { id: 1, name: 'mock-repo-1', description: 'Mock Repository 1', url: 'https://github.com/org/mock-repo-1' },
              { id: 2, name: 'mock-repo-2', description: 'Mock Repository 2', url: 'https://github.com/org/mock-repo-2' }
            ]
          })
        });
      });
      
      // Mock commits data
      await page.route('**/api/my-activity**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            commits: [
              { id: 'abc123', message: 'Fix bug', date: new Date().toISOString(), repo: 'mock-repo-1' },
              { id: 'def456', message: 'Add feature', date: new Date().toISOString(), repo: 'mock-repo-2' }
            ]
          })
        });
      });
    }
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Open filters panel
    await page.locator('[data-testid="filter-button"]').click();
    
    // Select a date range
    await page.locator('[data-testid="date-picker"]').click();
    await page.locator('[data-testid="date-last-week"]').click();
    
    // Apply filters
    await page.locator('[data-testid="apply-filters"]').click();
    
    // Verify filtered results are displayed
    await expect(page.locator('[data-testid="filtered-results-label"]')).toBeVisible({ timeout: 10000 });
  });
});