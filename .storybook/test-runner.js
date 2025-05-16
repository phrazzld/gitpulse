const { injectAxe, checkA11y, configureAxe } = require('axe-playwright');
const { getStoryContext } = require('@storybook/test-runner');

module.exports = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    // Get story context to access parameters
    const storyContext = await getStoryContext(page, context);
    const a11yParams = storyContext.parameters?.a11y || {};
    
    console.log(`Story: ${context.title} - ${context.name}`);
    console.log('Story context:', JSON.stringify(storyContext.parameters, null, 2));
    
    // If skipTests is configured, skip a11y testing
    if (a11yParams.disable) {
      console.log('Skipping a11y tests for this story');
      return;
    }
    
    // Configure axe with story-specific rules if provided
    if (a11yParams.config) {
      await configureAxe(page, a11yParams.config);
    }
    
    // Run accessibility checks
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};