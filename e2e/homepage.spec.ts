import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage correctly', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Verify the page has loaded by checking for expected content
    await expect(page).toHaveTitle(/GitPulse/);
  });
});