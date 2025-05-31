const { injectAxe, checkA11y, configureAxe } = require('axe-playwright');
// Note: getStoryContext removed due to Storybook 8 circular dependency issue
// Using direct storyStore access with circular reference handling instead
const path = require('path');
const fs = require('fs');
const { A11yResultsCollector } = require('./utils/a11y-results-collector');
const { customTestResultDependsOnViolations } = require('./utils/custom-a11y-test-utils');

// Default axe configuration with enhanced rules
const defaultAxeConfig = {
  rules: [
    // Color contrast rules
    {
      id: 'color-contrast',
      enabled: true,
      options: {
        noScroll: true,
        // WCAG Level AA requires 4.5:1 for normal text, 3:1 for large text
        // These are the default values but we're making them explicit
        contrastRatio: { 
          normal: 4.5,
          large: 3,
          nonText: 3
        }
      }
    },
    // Form field rules
    { id: 'label', enabled: true },
    { id: 'aria-required-attr', enabled: true },
    { id: 'aria-roles', enabled: true },
    // Focus and keyboard navigation rules
    { id: 'focus-order-semantics', enabled: true },
    { id: 'tabindex', enabled: true },
    // Image and media rules
    { id: 'image-alt', enabled: true },
    // Structure and landmarks
    { id: 'region', enabled: true },
    { id: 'landmark-banner-is-top-level', enabled: true },
    { id: 'landmark-complementary-is-top-level', enabled: true },
    { id: 'landmark-main-is-top-level', enabled: true },
    { id: 'landmark-no-duplicate', enabled: true },
    { id: 'landmark-one-main', enabled: true },
    { id: 'page-has-heading-one', enabled: true },
  ]
};

// Initialize results collector
const resultsCollector = new A11yResultsCollector();

// Create results directory if it doesn't exist
const ensureResultsDirectory = () => {
  const resultsDir = path.resolve(__dirname, '../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  return resultsDir;
};

// Get component type from title path (atoms/molecules/organisms)
const getComponentType = (titlePath) => {
  if (!titlePath) return 'unknown';
  
  const pathSegments = titlePath.toLowerCase().split('/');
  
  // Look for common component hierarchy terms
  for (const segment of pathSegments) {
    if (['atoms', 'molecules', 'organisms', 'templates', 'pages'].includes(segment)) {
      return segment;
    }
  }
  
  return 'component';
};

// Configure rules based on component type
const getTypeSpecificRules = (componentType) => {
  // Rules can be customized based on component type
  // For example, atomic design levels might have different requirements
  switch(componentType) {
    case 'atoms':
      // Atoms often have specific accessibility requirements as building blocks
      return [
        { id: 'color-contrast', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'aria-roles', enabled: true },
        { id: 'tabindex', enabled: true },
        { id: 'aria-allowed-attr', enabled: true },
      ];
    case 'molecules':
      // Molecules combine atoms and may have additional requirements
      return [
        { id: 'color-contrast', enabled: true },
        { id: 'label', enabled: true }, 
        { id: 'form-field-multiple-labels', enabled: true },
        { id: 'nested-interactive', enabled: true },
        { id: 'aria-required-attr', enabled: true },
      ];
    case 'organisms':
      // Organisms may have complex structures that need specific testing
      return [
        { id: 'landmark-one-main', enabled: true },
        { id: 'region', enabled: true },
        { id: 'landmark-banner-is-top-level', enabled: true },
        { id: 'landmark-complementary-is-top-level', enabled: true },
        { id: 'duplicate-id-aria', enabled: true },
      ];
    default:
      return [];
  }
};

// Save results after all tests are complete
const saveTestResults = () => {
  // Check if this is the last test to run (only in test-storybook mode)
  if (process.env.STORYBOOK_TESTING === 'true') {
    const resultsDir = ensureResultsDirectory();
    
    // Save JSON results for CI processing
    resultsCollector.saveResults(path.join(resultsDir, 'a11y-results.json'));
    
    // Generate and save Markdown summary
    const markdownSummary = resultsCollector.generateMarkdownSummary();
    fs.writeFileSync(
      path.join(resultsDir, 'a11y-summary.md'),
      markdownSummary,
      'utf8'
    );
    
    console.log('✅ Accessibility test results saved to test-results directory');
  }
};

module.exports = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    // Get story context to access parameters and check if it should be tested
    // Using workaround for Storybook 8 circular dependency issue with getStoryContext
    let storyContext;
    try {
      storyContext = await page.evaluate(
        async ({ storyId }) => {
          const getCircularReplacer = () => {
            const seen = new WeakSet();
            return (key, value) => {
              if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                  return;
                }
                seen.add(value);
              }
              return value;
            };
          };

          return JSON.parse(
            JSON.stringify(
              await globalThis.__STORYBOOK_PREVIEW__.storyStore.loadStory({ storyId }),
              getCircularReplacer()
            )
          );
        },
        { storyId: context.id }
      );
    } catch (error) {
      console.warn(`Failed to get story context for ${context.title} - ${context.name}:`, error.message);
      // Fallback to basic context structure for accessibility testing
      storyContext = {
        parameters: {},
        title: context.title,
        name: context.name
      };
    }
    const a11yParams = storyContext.parameters?.a11y || {};
    
    // Log info about current story for debugging
    console.log(`Testing story: ${context.title} - ${context.name}`);
    
    // If skipTests is configured, skip a11y testing
    if (a11yParams.disable) {
      console.log('⏭️ Skipping a11y tests for this story (disabled in parameters)');
      return;
    }
    
    try {
      // Determine component type from context
      const componentType = getComponentType(context.title);
      console.log(`Component type: ${componentType}`);
      
      // Merge default config with type-specific rules and any story-specific config
      const typeSpecificRules = getTypeSpecificRules(componentType);
      const storySpecificRules = a11yParams.config?.rules || [];
      
      const axeConfig = {
        ...defaultAxeConfig,
        rules: [
          ...defaultAxeConfig.rules,
          ...typeSpecificRules,
          ...storySpecificRules
        ]
      };
      
      // Configure axe with the merged configuration
      await configureAxe(page, axeConfig);
      
      // Run accessibility checks with enhanced options
      const violations = await checkA11y(
        page, 
        '#storybook-root', 
        {
          // Provide detailed report for better understanding of issues
          detailedReport: true,
          detailedReportOptions: {
            html: true,
          },
          // Use custom test result handler to control test failures
          resultHandler: async (axeResults) => {
            // Extract total check count for reporting
            const checkCount = axeResults.passes.length + 
                              axeResults.incomplete.length + 
                              axeResults.violations.length;
            
            // Track results in collector for comprehensive reporting
            resultsCollector.recordResults(
              context.title, 
              context.name,
              axeResults.violations,
              checkCount
            );
            
            const totalViolations = axeResults.violations.length;
            
            // Group violations by impact for better reporting
            const violationsByImpact = {
              critical: axeResults.violations.filter(v => v.impact === 'critical').length,
              serious: axeResults.violations.filter(v => v.impact === 'serious').length,
              moderate: axeResults.violations.filter(v => v.impact === 'moderate').length,
              minor: axeResults.violations.filter(v => v.impact === 'minor').length,
            };
            
            // Improved logging with structured information
            if (totalViolations > 0) {
              console.log('🔍 Accessibility violations found:');
              console.log('----------------------------');
              console.log(`Total: ${totalViolations} violation(s)`);
              console.log(`Critical: ${violationsByImpact.critical}`);
              console.log(`Serious: ${violationsByImpact.serious}`);
              console.log(`Moderate: ${violationsByImpact.moderate}`);
              console.log(`Minor: ${violationsByImpact.minor}`);
              console.log('----------------------------');
              
              // Log individual violations with more details
              axeResults.violations.forEach((violation, index) => {
                console.log(`Violation #${index + 1}: ${violation.id} (${violation.impact})`);
                console.log(`Description: ${violation.description}`);
                console.log(`Help: ${violation.help}`);
                console.log(`WCAG: ${violation.tags.filter(t => t.includes('wcag')).join(', ')}`);
                console.log(`Help URL: ${violation.helpUrl}`);
                console.log(`Affected nodes: ${violation.nodes.length}`);
                console.log('----------------------------');
              });
            } else {
              console.log('✅ No accessibility violations found');
            }
            
            // Use custom function to determine if test should fail
            const shouldFail = customTestResultDependsOnViolations(axeResults.violations);
            return { violations: axeResults.violations, results: axeResults, shouldFail };
          }
        }
      );
      
      // Save results after each story is tested (in case of early termination)
      saveTestResults();
      
    } catch (error) {
      console.error('❌ Error during accessibility testing:', error);
      // Still try to save results if an error occurs
      saveTestResults();
      throw error;
    }
  },
  
  // Provide a hook that runs after all tests are complete
  async afterAll() {
    // Save the final results
    saveTestResults();
  }
};