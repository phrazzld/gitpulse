/**
 * Lighthouse Puppeteer Script
 * 
 * This script defines how Puppeteer will navigate through pages for Lighthouse testing.
 * It helps with authentication and other user flow needs.
 * 
 * For more information, see:
 * https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/advanced-setup.md#using-a-puppeteer-script
 */

/**
 * @param {puppeteer.Browser} browser - The Puppeteer browser instance
 * @param {{url: string}} context - The script context
 */
module.exports = async (browser, context) => {
  // Create a new page
  const page = await browser.newPage();

  // Set a realistic viewport size
  await page.setViewport({ width: 1280, height: 720 });

  // Navigate to the target URL
  await page.goto(context.url);

  // For authenticated pages, consider adding logic like:
  // if (context.url.includes('/dashboard')) {
  //   await page.goto('http://localhost:3000/api/auth/signin');
  //   // Handle authentication via test credentials
  //   await page.type('input[name="username"]', 'test-user');
  //   await page.type('input[name="password"]', 'test-pass');
  //   await Promise.all([
  //     page.click('button[type="submit"]'),
  //     page.waitForNavigation(),
  //   ]);
  //   // Now navigate to the dashboard
  //   await page.goto(context.url);
  // }

  // Use the test auth route for authenticated pages if appropriate
  if (context.url.includes('/dashboard')) {
    console.log('Using test auth login for dashboard page');
    await page.goto('http://localhost:3000/api/test-auth/login');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.goto(context.url);
    await page.waitForSelector('h1', { timeout: 5000 });
  }

  // Wait for network to be idle to ensure all resources are loaded
  await page.waitForNetworkIdle({ idleTime: 500 });

  // For SPA routes, wait for specific content to appear
  try {
    await page.waitForSelector('#main-content', { timeout: 5000 });
  } catch (error) {
    console.log('Main content selector not found, continuing with test');
  }

  // Return control to Lighthouse for the performance measurements
  return page;
};