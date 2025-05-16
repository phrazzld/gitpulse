/**
 * Lighthouse CI Configuration
 * 
 * This file defines:
 * 1. Performance budgets for the application
 * 2. Assertions for key metrics that will fail CI if not met
 * 3. Collection and storage settings for reports
 * 
 * For more information on configuration options, see:
 * https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */

module.exports = {
  ci: {
    collect: {
      // The number of runs to do per URL
      numberOfRuns: 3,

      // Using the puppeteer method for more reliable CI runs
      method: 'puppeteer',

      // Puppeteer launcher options
      puppeteerScript: './scripts/lighthouse/lighthouse-puppeteer.js',

      // Lighthouse can collect from a local development server or deployed URLs
      // In CI, we'll use the locally built version for testing
      url: ['http://localhost:3000/'],

      // Set a generous timeout for server startup
      startServerReadyTimeout: 60000,

      // Chrome flags for better performance in CI environments
      chromeFlagsConfig: './scripts/lighthouse/chrome-flags.js',

      // Terminate the server when done
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    
    upload: {
      // Store results as a GitHub artifact (in CI environment)
      // and locally as JSON files
      target: 'filesystem',
      outputDir: './lighthouse-results',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
    
    assert: {
      // Define assertions that will cause the CI to fail if not met
      // These assertions align with the Core Web Vitals
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Performance
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['warning', { maxNumericValue: 3800 }],
        'interactive': ['warning', { maxNumericValue: 3500 }],
        
        // Accessibility
        'color-contrast': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'html-has-lang': ['error', { minScore: 1 }],
        'aria-allowed-attr': ['error', { minScore: 1 }],
        'aria-required-attr': ['error', { minScore: 1 }],
        
        // Best Practices
        'no-vulnerable-libraries': ['error', { minScore: 1 }],
        'doctype': ['error', { minScore: 1 }],
        'js-libraries': ['warning', { minScore: 1 }],
        
        // SEO
        'meta-description': ['warning', { minScore: 1 }],
        'link-text': ['warning', { minScore: 0.9 }],
        
        // Budgets
        'resource-summary:font:count': ['error', { maxNumericValue: 5 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 400000 }], // 400 KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100 KB
        'resource-summary:image:size': ['error', { maxNumericValue: 300000 }], // 300 KB
        'resource-summary:third-party:count': ['warning', { maxNumericValue: 10 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 1000000 }], // 1 MB
      },
    },
  },
};