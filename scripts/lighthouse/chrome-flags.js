/**
 * Chrome Flags Configuration for Lighthouse CI
 * 
 * These flags are used to ensure consistent behavior in headless environments,
 * especially in CI settings.
 * 
 * For more information, see:
 * https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#chromeflags
 */

module.exports = [
  // Run Chrome in headless mode (required for most CI environments)
  '--headless',
  
  // Disable GPU hardware acceleration
  '--disable-gpu',
  
  // Disable Chrome's sandbox (may be required in certain CI environments)
  // Note: This has security implications, but is commonly needed for Docker/CI
  '--no-sandbox',
  
  // Disable the /dev/shm usage (helps with memory limits in CI containers)
  '--disable-dev-shm-usage',
  
  // Disable various background services to minimize resource usage
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-features=TranslateUI,BlinkGenPropertyTrees',
  '--disable-ipc-flooding-protection',
  '--disable-renderer-backgrounding',
  
  // Required for newer versions of Chrome in Docker
  '--disable-features=DialMediaRouteProvider',
  
  // Prevent memory issues
  '--disable-hang-monitor',
  
  // Various performance improvements
  '--no-first-run',
  '--no-default-browser-check',
  '--no-pings',
  '--password-store=basic',
  
  // Set a consistent window size
  '--window-size=1280,720',
  
  // Set performance mode
  '--force-prefers-reduced-motion',
  '--force-color-profile=srgb',
];