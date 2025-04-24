# BACKLOG

## High Priority

### Testing Infrastructure
- Add Jest configuration and test scripts to package.json
  ```json
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
  ```
- Add a `jest.config.js` file to standardize testing configuration:
  ```javascript
  module.exports = {
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*test*/**',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };
  ```
- Improve test coverage for critical paths

### Bug Investigations
- Investigate missing "My Activity" data issue - data isn't displaying despite existing
- Continue monitoring ActivityFeed error handling after B001 fix - track error rates in production

## Medium Priority

### Technical Debt - Code Organization
- Further break down `src/lib/github.ts` (853 lines) into smaller modules
- Decompose `OperationsPanel.tsx` (470 lines) into smaller sub-components
- Break down `src/app/api/summary/__tests__/handlers.test.ts` (502 lines) into logical test groups
- Centralize error handling logic by extracting `getErrorMessage`/`getSafeErrorMessage` to `src/lib/error.ts`

### Type Safety Improvements
- Replace `any[]` in `formatActivityCommits` with more specific union types
- Create a comprehensive ErrorType hierarchy for better type safety
- Improve type safety in areas with loose typing (e.g., Record<string, any>)

### Performance Optimization
- Identify and fix performance bottlenecks in data fetching and rendering
- Add appropriate memoization for computed values and components

## Standard Priority

### Testing Enhancements
- Add integration tests for data fetching and UI display
- Add end-to-end tests with a tool like Cypress or Playwright for critical user flows
- Add end-to-end tests for the summary generation workflow

### UI Improvements
- Move UI implementation to shadcn/ui
- Clarify the "Generate Summary" button to show what it summarizes (e.g., "Generate Team Summary for Last Week")
- Add a simple bar chart to the commit classification UI to visualize commit types and their proportions
- Implement basic temporal analysis to show activity trends over time using a line graph
- Update the comprehensive analysis to list specific projects included in the summary
- Highlight key achievements in the analysis output with the projects they relate to
- Make the UI fully responsive for mobile and desktop
- Ensure the UI meets basic accessibility standards (e.g., keyboard navigation, color contrast)
- Ensure WCAG 2.1 compliance for accessibility (e.g., screen reader support)

### Feature Enhancements
- Add server-side caching for GitHub API calls to speed up frequent queries
- Add basic logging for errors and user actions to monitor system health
- Expand data collection to include pull requests alongside commits
- Create a simple entity recognition service to tag people and repositories in commit messages
- Link commits to their related pull requests in the analysis output
- Track basic temporal metadata (e.g., commit times by day) for activity patterns
- Build a basic insight generation pipeline to process data and display results
- Calculate simple stats like commit frequency and active contributors in a stats module
- Analyze basic code complexity (e.g., lines of code per commit) in repositories
- Set up a hosting service for one AI model with basic access for analysis tasks
- Create a dynamic insight dashboard with a few interactive cards (e.g., recent activity, top contributors)
- Use Chart.js to add a time-series chart of commit activity to the UI
- Add a clickable summary in the UI to drill down to specific commits
- Show role-based insights (e.g., developer vs. manager) based on a user role dropdown
- Add a natural language query box for basic questions like "What did I do this week?"
- Build a "Daily Standup Prep" recap showing recent commits for developers
- Create a "Sprint Reflection" report with commit trends and top active projects
- Flag unusual activity (e.g., no commits in 3 days) as a basic risk alert
- Track individual commit counts over time as a simple "Personal Growth" feature
- Analyze PR review frequency to show basic team collaboration stats
- Predict feature completion dates using commit rates and a simple formula
- Summarize repository history and top contributors for an "Onboarding Accelerator" page
- Add a "Custom Insight" form to set basic alerts (e.g., "Notify me if commits drop below 5/day")
- Award a "Commit Streak" badge for 5 consecutive days of commits
- Design a simple plugin system with a sample plugin for a new stat
- Send a Slack notification for new insights or alerts
- Link GitHub commits to Jira tickets using basic ID matching
- Split data fetching, analysis, and UI into separate code modules
- Process insights in the background and email them daily
- Fetch only new GitHub data since the last update to reduce API calls
- Encrypt GitHub tokens in storage and transit
- Limit data access to match GitHub permissions for each user
- Check GDPR compliance for storing GitHub usernames and commit data
- Add a "Demo Mode" with fake data to preview the dashboard
- Enhance logging with performance metrics (e.g., API response times)
- Fine-tune the AI model for better commit analysis accuracy
- Use D3.js to add a heatmap of commit activity by hour and day
- Collect GitHub issues and comments for broader activity tracking
- Normalize feature names from PR titles in the entity recognition service
- Aggregate activity across repositories into a unified timeline
- Track seasonal commit trends (e.g., monthly patterns) in the temporal module
- Add a specialized AI model for code quality scoring
- Calculate code churn (added vs. removed lines) in the stats module
- Assess technical debt using commit message keywords (e.g., "fix", "hack")
- Build a network graph of PR reviews and comments for collaboration insights
- Suggest skill growth areas based on commit types (e.g., "Try more refactors")
- Recommend process tweaks (e.g., "Speed up PR reviews") from collaboration data
- Generate automated onboarding docs from repository summaries
- Add a no-code rule builder for custom insights (e.g., "Alert if PRs > 3 days old")
- Integrate with Trello to map commits to tasks

## Resolved Issues

### B001 - ActivityFeed Error Handling Issue
**Description:** When loading commits in the activity feed, users sometimes saw the error: "Failed to load activity data. Please try again.: Cannot read properties of undefined (reading 'message')". 

**Fix Implemented:**
1. Refactored error handling in `createActivityFetcher`
2. Enhanced `useProgressiveLoading` hook with safe error message extraction
3. Updated `ActivityFeed` to sanitize error messages
4. Added comprehensive error handling to `SummaryView`'s `loadCommits` function

**Status:** Fixed in tasks T031-T036