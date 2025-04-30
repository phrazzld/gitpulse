# BACKLOG

- set up e2e tests

## High Priority

### Technical Foundation

- **Refactor**: Implement atomic design pattern and Storybook-driven development
  - **Complexity**: High
  - **Rationale**: Current component structure lacks clear hierarchy and leads to performance issues in testing environments
  - **Expected Outcome**: 
    - Components organized as atoms, molecules, and organisms
    - Storybook-first development approach for all UI components
    - Improved component isolation, testability, and performance
    - Clear separation of presentation and logic
    - Progressive enhancement of complex components
  - **Dependencies**: None

- **Tooling**: Initialize Storybook and baseline component library

- **Refactor**: Break down `OperationsPanel.tsx` (470 lines) into smaller sub-components
  - **Complexity**: Medium
  - **Rationale**: Large component slows feature delivery; modular components speed up UI iterations
  - **Expected Outcome**: Clear separation into smaller, focused components with single responsibilities
  - **Dependencies**: None

- **Enhancement**: Centralize error handling logic in `src/lib/error.ts`
  - **Complexity**: Simple
  - **Rationale**: Avoid duplicated logic; consistent user messaging across the application
  - **Expected Outcome**: Common error utilities used consistently throughout the codebase
  - **Dependencies**: None

- **Enhancement**: Replace loose typings (`any[]`, `Record<string, any>`) with strict types
  - **Complexity**: Medium
  - **Rationale**: Prevent runtime errors; improve developer experience via auto-completion
  - **Expected Outcome**: All exported functions and modules use explicit TypeScript types; `tsc` passes with no `any` warnings
  - **Dependencies**: None

### Core Functionality & Testing

- **Feature**: Configure and validate Jest testing framework
  - **Complexity**: Simple
  - **Rationale**: Establishes baseline test infrastructure for reliable code validation
  - **Expected Outcome**: `npm test`, `npm run test:watch`, and `npm run test:coverage` run successfully; Jest configuration and test scripts in place
  - **Dependencies**: None

- **Enhancement**: Improve test coverage for critical paths
  - **Complexity**: Medium
  - **Rationale**: Prevent regressions in core workflows (summary generation, activity feed)
  - **Expected Outcome**: Addition of unit tests for `createActivityFetcher`, `useProgressiveLoading`, summary API handlers, raising coverage to ≥ 90% on those modules
  - **Dependencies**: Jest configuration

- **Fix**: Investigate and resolve missing "My Activity" data issue
  - **Complexity**: Medium
  - **Rationale**: Critical bug impacting core user value proposition (viewing personal activity)
  - **Expected Outcome**: Users can reliably see their activity data; verified with automated tests
  - **Dependencies**: None

- **Enhancement**: Implement production error monitoring for ActivityFeed
  - **Complexity**: Medium
  - **Rationale**: Proactively catch and track runtime errors post B001 fix
  - **Expected Outcome**: Errors logged to monitoring service with context; dashboard of real-time error trends
  - **Dependencies**: None

### Data Collection & Infrastructure

- **Feature**: Expand data collection to include pull requests and link to commits
  - **Complexity**: Medium
  - **Rationale**: Provides a fuller picture of team activity; enables richer insights
  - **Expected Outcome**: PRs are fetched, displayed, and linked to their relevant commits in the UI
  - **Dependencies**: None

- **Enhancement**: Implement robust server-side caching for GitHub API calls
  - **Complexity**: Medium
  - **Rationale**: Reduces GitHub API rate limit consumption, improves application performance
  - **Expected Outcome**: Repeated requests for the same data return cached results quickly; observable reduction in API calls
  - **Dependencies**: None

### Security & Compliance

- **Enhancement**: Encrypt GitHub tokens in storage and transit
  - **Complexity**: Medium
  - **Rationale**: Protects user credentials; complies with security best practices
  - **Expected Outcome**: Tokens stored in secure vault; HTTPS enforced; no tokens in logs
  - **Dependencies**: None

- **Enhancement**: Limit data access to match GitHub permissions per user
  - **Complexity**: Medium
  - **Rationale**: Prevents unauthorized data access; maintains proper security boundaries
  - **Expected Outcome**: Users can only access data from repositories they have GitHub permissions for
  - **Dependencies**: None

## Medium Priority

### Monetization & Pricing

- **Feature**: Design and implement pricing tiers
  - **Complexity**: Medium
  - **Rationale**: Establishes revenue model for sustainable product development
  - **Expected Outcome**: Clear pricing page with feature comparison table for Free, Pro, and Team tiers
  - **Dependencies**: None

- **Feature**: Integrate Stripe payment processing
  - **Complexity**: Medium
  - **Rationale**: Industry-standard payment solution for subscription management
  - **Expected Outcome**: Complete checkout flow for subscription creation and management
  - **Dependencies**: Pricing tier design

### User Interface & Experience

- **Enhancement**: Migrate to shadcn/ui design system
  - **Complexity**: Medium
  - **Rationale**: Consistent styling, accessible components, faster UI development
  - **Expected Outcome**: All core UI components use shadcn primitives; theme tokens applied
  - **Dependencies**: None

- **Enhancement**: Make the UI fully responsive for mobile and desktop
  - **Complexity**: Medium
  - **Rationale**: Ensures usability across different devices, broadening accessibility
  - **Expected Outcome**: Application layout adapts gracefully to various screen widths
  - **Dependencies**: shadcn/ui migration

- **Enhancement**: Ensure WCAG 2.1 compliance for accessibility
  - **Complexity**: Medium
  - **Rationale**: Makes the application usable for people with disabilities; meets compliance standards
  - **Expected Outcome**: Application passes accessibility audits (keyboard navigation, screen readers, color contrast)
  - **Dependencies**: shadcn/ui migration

- **Enhancement**: Clarify the "Generate Summary" button context
  - **Complexity**: Simple
  - **Rationale**: Improves usability by making the action clear based on current context
  - **Expected Outcome**: Button text dynamically updates (e.g., "Generate Team Summary for Last Week")
  - **Dependencies**: None

### Performance Optimization

- **Enhancement**: Fetch only new GitHub data since the last update
  - **Complexity**: Medium
  - **Rationale**: Significantly reduces API usage, speeds up data refresh times
  - **Expected Outcome**: Incremental data fetching implemented; faster refresh performance
  - **Dependencies**: None

- **Enhancement**: Add appropriate memoization for computed values and components
  - **Complexity**: Simple
  - **Rationale**: Prevent unnecessary re-renders and recalculations
  - **Expected Outcome**: Key selectors and components wrapped in `useMemo`/`React.memo`; reduced CPU usage
  - **Dependencies**: None

- **Enhancement**: Profile and optimize data fetching and rendering performance
  - **Complexity**: Medium
  - **Rationale**: Improves user experience with faster UI and data loading
  - **Expected Outcome**: Identified and resolved performance bottlenecks; measurable improvement in loading times
  - **Dependencies**: None

### Testing & Quality Assurance

- **Feature**: Add integration tests for data fetching and UI display
  - **Complexity**: Medium
  - **Rationale**: Ensure end-to-end reliability across the stack
  - **Expected Outcome**: Test suite covering key API endpoints and UI interactions
  - **Dependencies**: Jest configuration

- **Feature**: Implement end-to-end tests for critical user flows
  - **Complexity**: Medium
  - **Rationale**: Verifies that different parts of the system work together correctly
  - **Expected Outcome**: Playwright/Cypress tests for login, summary generation, and activity viewing
  - **Dependencies**: Integration tests

- **Refactor**: Break down `src/app/api/summary/__tests__/handlers.test.ts` (502 lines)
  - **Complexity**: Simple
  - **Rationale**: Improves test maintainability and readability
  - **Expected Outcome**: Large test file split into logical groups by functionality
  - **Dependencies**: None

### Data Visualization & Insights

- **Feature**: Add basic visualizations for commit activity
  - **Complexity**: Medium
  - **Rationale**: Makes trends and patterns easier to spot; enhances data comprehension
  - **Expected Outcome**: Bar charts for commit types and line graphs for activity trends
  - **Dependencies**: None

- **Feature**: Calculate and display simple statistics
  - **Complexity**: Medium
  - **Rationale**: Provides immediate, quantifiable value from the collected data
  - **Expected Outcome**: Stats module with metrics like commit frequency and active contributors
  - **Dependencies**: None

- **Feature**: Implement a "Daily Standup Prep" view
  - **Complexity**: Medium
  - **Rationale**: Provides a direct, practical use case for developers
  - **Expected Outcome**: View showing recent commits/PRs for quick standup preparation
  - **Dependencies**: PR data collection

### Observability & Reliability

- **Enhancement**: Implement structured logging for critical events
  - **Complexity**: Medium
  - **Rationale**: Essential for monitoring system health and debugging production issues
  - **Expected Outcome**: Key application events logged with context (timestamps, IDs, error details)
  - **Dependencies**: None

- **Enhancement**: Implement monitoring for key application metrics
  - **Complexity**: Medium
  - **Rationale**: Provides visibility into application health and performance
  - **Expected Outcome**: Dashboard tracking error rates, API latency, and request volume
  - **Dependencies**: Structured logging

## Low Priority

### Advanced Features

- **Feature**: Create a "Sprint Reflection" report
  - **Complexity**: Medium
  - **Rationale**: Provides value for agile teams during retrospectives
  - **Expected Outcome**: Report summarizing activity and trends over a sprint period
  - **Dependencies**: Stats module

- **Feature**: Link GitHub commits to Jira/Trello tickets
  - **Complexity**: Medium
  - **Rationale**: Connects development activity to project management tasks
  - **Expected Outcome**: Commits and PRs linked to their corresponding tickets
  - **Dependencies**: PR data collection

- **Feature**: Implement basic entity recognition in commit messages
  - **Complexity**: Complex
  - **Rationale**: Allows for tagging and filtering based on mentioned people or repositories
  - **Expected Outcome**: Service identifying @mentions and repo references in text content
  - **Dependencies**: None

- **Feature**: Add clickable drill-downs for commits and PRs
  - **Complexity**: Simple
  - **Rationale**: Improves navigability and allows users to investigate details
  - **Expected Outcome**: Summary items link to detailed views of specific commits or PRs
  - **Dependencies**: None

### Visualization Enhancements

- **Feature**: Add temporal heatmap for commit activity by hour/day
  - **Complexity**: Medium
  - **Rationale**: Reveals productivity patterns and working schedules
  - **Expected Outcome**: D3.js heatmap visualization showing activity concentration
  - **Dependencies**: None

- **Feature**: Highlight key achievements with projects they relate to
  - **Complexity**: Medium
  - **Rationale**: Provides context and importance to activity summaries
  - **Expected Outcome**: Analysis output connects achievements to specific projects
  - **Dependencies**: Entity recognition

### User Engagement

- **Feature**: Add a "Demo Mode" with fake data
  - **Complexity**: Medium
  - **Rationale**: Allows preview of features without GitHub integration
  - **Expected Outcome**: Realistic demo data for showcasing application capabilities
  - **Dependencies**: None

- **Feature**: Implement "Commit Streak" badge
  - **Complexity**: Simple
  - **Rationale**: Increases engagement through gamification
  - **Expected Outcome**: Badge awarded for consecutive days of commits
  - **Dependencies**: None

### Integration & Extensibility

- **Feature**: Send Slack notifications for insights and alerts
  - **Complexity**: Medium
  - **Rationale**: Improves workflow integration and increases engagement
  - **Expected Outcome**: Configurable Slack notifications for important insights
  - **Dependencies**: None

- **Research**: Design plugin system for custom insights
  - **Complexity**: Complex
  - **Rationale**: Allows for extensibility and third-party integrations
  - **Expected Outcome**: Architecture document and prototype for plugin system
  - **Dependencies**: None

### Alternative Payment Methods

- **Feature**: Accept Bitcoin payments
  - **Complexity**: Complex
  - **Rationale**: Expand payment options for privacy-conscious users and crypto enthusiasts
  - **Expected Outcome**: Bitcoin payment option in checkout flow with invoicing
  - **Dependencies**: Stripe integration, pricing tiers

- **Feature**: Implement Lightning Network payments
  - **Complexity**: Complex
  - **Rationale**: Offer fast, low-fee Bitcoin payments for micro-transactions
  - **Expected Outcome**: Lightning payment option with QR code generation and payment verification
  - **Dependencies**: Bitcoin payment support

## Future Considerations

### Advanced Analytics

- **Feature**: Predict feature completion dates using commit rates
- **Feature**: Calculate code churn (added vs. removed lines) metrics
- **Feature**: Assess technical debt using commit message keywords
- **Feature**: Build network graph of PR reviews and comments for collaboration insights
- **Feature**: Track seasonal commit trends (monthly patterns)

### AI and Machine Learning

- **Feature**: Fine-tune AI model for better commit analysis accuracy
- **Feature**: Add specialized model for code quality scoring
- **Feature**: Enable natural language queries about development activity
- **Feature**: Generate automated onboarding docs from repository summaries
- **Feature**: Suggest skill growth areas based on commit types

### Integration and Scaling

- **Feature**: Process insights in background and email daily summaries
- **Feature**: Add no-code rule builder for custom insights and alerts
- **Feature**: Recommend process improvements from collaboration data
- **Feature**: Aggregate activity across repositories into unified timeline
- **Feature**: Integrate with additional project management tools

## Resolved Issues

### B001 - ActivityFeed Error Handling Issue
**Description:** When loading commits in the activity feed, users sometimes saw the error: "Failed to load activity data. Please try again.: Cannot read properties of undefined (reading 'message')".

**Fix Implemented:**
1. Refactored error handling in `createActivityFetcher`
2. Enhanced `useProgressiveLoading` hook with safe error message extraction
3. Updated `ActivityFeed` to sanitize error messages
4. Added comprehensive error handling to `SummaryView`'s `loadCommits` function

**Status:** Fixed in tasks T031-T036

## Completed Tasks

### C001 - GitHub Service Module Refactoring
**Description:** Decomposition of the monolithic `src/lib/github.ts` (853 lines) into discrete, focused service modules.

**Implementation:**
1. Created modular architecture with separate files for different concerns
2. Extracted types to `types.ts`
3. Extracted utilities to `utils.ts`
4. Extracted authentication logic to `auth.ts`
5. Extracted repository operations to `repositories.ts`
6. Extracted commit operations to `commits.ts`
7. Created barrel file `index.ts` for backward compatibility
8. Added comprehensive documentation and tests

**Status:** Completed
