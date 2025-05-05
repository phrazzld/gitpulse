# CI Failures and Updates

This document summarizes the changes made to fix CI failures in the GitPulse project. It covers the Jest ESM module import issues, Storybook accessibility test failures, component test fixes for the Atomic Design pattern, and E2E test improvements.

## 1. Jest ESM Module Import Issues

### Problem

Our test suite was failing due to ESM (ECMAScript Modules) compatibility issues with error messages like:

```
SyntaxError: Cannot use import statement outside a module
  at /home/runner/work/gitpulse/gitpulse/node_modules/octokit/dist-bundle/index.js:2
```

Many modern JavaScript packages use ESM, but Jest was originally designed to work with CommonJS modules. This caused import errors for packages like Octokit and its dependencies.

### Solution

We implemented a comprehensive ESM compatibility layer with the following changes:

1. **Created a dedicated ESM setup file (`jest.setup.esm.js`)**:
   - Added global polyfills for `structuredClone`, `TextEncoder/TextDecoder`
   - Implemented mock `fetch` API for tests
   - Added polyfills for `Headers` and `ReadableStream` classes
   - Set up test environment variables

2. **Updated Jest configuration (`jest.config.js`)**:
   - Added `jest.setup.esm.js` to `setupFilesAfterEnv`
   - Expanded `transformIgnorePatterns` to process all ESM modules:
     ```javascript
     transformIgnorePatterns: [
       '/node_modules/(?!(' + [
         // Octokit packages
         'octokit',
         '@octokit',
         
         // Dependencies of Octokit that might use ESM
         'node-fetch',
         'fetch-blob', 
         'formdata-polyfill',
         'data-uri-to-buffer',
         'web-streams-polyfill',
         
         // Additional ESM packages
         'is-plain-object',
         'universal-user-agent',
         'once',
         'wrappy',
         'tr46',
         'whatwg-url',
         'punycode',
         'webidl-conversions',
         
         // Additional dependencies that might be using ESM
         'before-after-hook',
         'deprecation',
         'stream-buffers',
         'undici',
         'hpagent',
         '@sindresorhus/is',
         'form-data-encoder',
         'ms',
         'querystringify',
         'requires-port',
         'url-parse'
       ].join('|') + ')/)' 
     ]
     ```

3. **Added proper module aliases** to ensure imports resolve correctly:
   ```javascript
   moduleNameMapper: {
     '^@/components/(.*)$': '<rootDir>/src/components/$1',
     '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
     '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
   }
   ```

4. **Set up test coverage thresholds** to ensure code quality:
   ```javascript
   coverageThreshold: {
     global: {
       branches: 80,
       functions: 80,
       lines: 80,
       statements: 80,
     },
     './src/components/atoms/': {
       branches: 90,
       functions: 90,
       lines: 90,
       statements: 90,
     },
     // ...additional thresholds for molecules and organisms
   }
   ```

5. **Fixed mock import patterns** in specific test files:
   - Updated mocks in `src/lib/github/__tests__/` to use compatible import/export patterns
   - Fixed circular dependencies in test files
   - Implemented proper mocking patterns that work with ESM modules

## 2. Storybook Accessibility Test Failures

### Problem

Storybook accessibility (a11y) tests were failing with errors like:

```
Expected value to strictly be equal to:
  0
Received:
  1

Message:
  1 accessibility violation was detected
```

These failures were due to missing ARIA attributes, insufficient color contrast, and other accessibility issues in our components.

### Solution

We implemented comprehensive accessibility fixes across our component library:

1. **Button Component (`src/components/atoms/Button.tsx`)**:
   - Added proper ARIA attributes (`aria-busy`, `aria-label`)
   - Ensured sufficient color contrast in all button variants
   - Added accessible loading state with screen reader support
   - Improved focus states with visible focus rings:
     ```typescript
     <button
       type={type}
       onClick={onClick}
       disabled={disabled || loading}
       aria-busy={loading}
       aria-label={ariaLabel}
       className={`
         font-medium rounded-md transition-all duration-200
         focus:outline-none focus:ring-2 focus:ring-offset-2
         flex items-center justify-center
         ${sizeClasses[size]}
         ${className}
       `}
       // ...
     >
     ```

2. **Button Stories (`src/components/atoms/Button.stories.tsx`)**:
   - Added specific a11y testing configuration:
     ```javascript
     a11y: {
       config: {
         rules: [
           {
             // Ensure proper contrast ratio
             id: 'color-contrast',
             enabled: true
           },
           {
             // Ensure proper ARIA roles
             id: 'button-name',
             enabled: true
           },
           {
             // Ensure interactive elements are keyboard accessible
             id: 'interactive-supports-focus',
             enabled: true
           }
         ]
       }
     }
     ```
   - Created specific test cases for accessibility features
   - Added comprehensive documentation for accessibility features

3. **OperationsPanel Stories (`src/components/organisms/OperationsPanel.stories.tsx`)**:
   - Added accessibility testing configuration
   - Ensured proper color contrast in dark/light themes:
     ```javascript
     backgrounds: {
       default: 'dark',
       values: [
         { name: 'dark', value: '#1b2b34' },
         { name: 'light', value: '#ffffff' },
       ],
     }
     ```
   - Enhanced documentation with accessibility considerations

4. **Other UI Components**:
   - Improved `ModeSelector`, `LoadMoreButton`, and `AuthLoadingScreen` components
   - Added proper aria attributes to all interactive elements
   - Ensured keyboard navigation support across the interface

## 3. Component Test Fixes for Atomic Design Pattern

### Problem

After refactoring our components to follow the Atomic Design pattern (atoms, molecules, organisms, templates), many tests were broken due to import path changes and component restructuring. Specific errors included:

```
expect(received).toBeGreaterThan(expected)
Expected: > 0
Received:   0
```

and 

```
TypeError: Cannot redefine property: getLastWeekDate
```

### Solution

We updated our component tests to align with the Atomic Design pattern:

1. **Updated Import Paths**:
   - Changed imports from flat structure to hierarchical Atomic Design structure
   - Example: `@/components/Button` → `@/components/atoms/Button`

2. **Moved OperationsPanel Tests**:
   - Moved from `src/components/dashboard/__tests__/OperationsPanel.test.tsx` to `src/components/organisms/__tests__/OperationsPanel.test.tsx`
   - Updated all imports and test assertions

3. **Updated Mock Patterns**:
   - Adjusted test mocks to match the new component abstractions
   - Created specialized mocks for atomic component interactions
   - Fixed property redefinition issues by using proper Jest mocking patterns:
     ```javascript
     // Instead of direct property assignment
     // utils.getLastWeekDate = jest.fn()
     
     // Use proper Jest mocking
     jest.spyOn(utils, 'getLastWeekDate').mockImplementation(() => mockDate)
     ```

4. **Enhanced Test Coverage**:
   - Implemented stricter test coverage requirements for atomic components:
     - Atoms: 90% coverage (branches, functions, lines, statements)
     - Molecules: 85% coverage
     - Organisms: 80% coverage

5. **Component-Specific Test Improvements**:
   - `Button.test.tsx`: Added tests for all variants, sizes, states
   - `OperationsPanel.test.tsx`: Updated tests for new prop structure and carefully constructed test subjects to ensure proper rendering

## 4. E2E Test Improvements

### Problem

End-to-end tests were unreliable, especially in CI environments, due to authentication issues, timing problems, and insufficient error handling.

### Solution

We made several key improvements to our E2E testing strategy:

1. **Improved Authentication Handling**:
   - Created a robust `globalSetup.ts` in `e2e/config/` that directly manages authentication cookies:
     ```typescript
     // Create the mock session data
     const mockSessionData = {
       user: {
         id: 'playwright-test-user',
         name: 'Playwright Test User',
         email: 'playwright@example.com',
         image: 'https://github.com/ghost.png',
       },
       expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
       accessToken: 'mock-github-token',
       installationId: 12345678
     };
     
     // Create cookie value by base64 encoding the session data
     const cookieValue = Buffer.from(JSON.stringify(mockSessionData)).toString('base64');
     
     // Add the cookie directly to the context
     await context.addCookies([
       {
         name: 'next-auth.session-token',
         value: cookieValue,
         domain,
         path: '/',
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'Lax',
         expires: Math.floor(Date.now() / 1000) + 86400,
       }
     ]);
     ```
   - Implemented storage state sharing between tests to reduce authentication overhead
   - Added detailed logging for authentication processes
   - Created validation checks to ensure authentication succeeded

2. **Enhanced CI Compatibility**:
   - Added environment-aware configurations in `playwright.config.ts`:
     ```typescript
     timeout: process.env.CI ? 60 * 1000 : 30 * 1000, // Longer timeout in CI
     expect: {
       timeout: process.env.CI ? 10000 : 5000 // Longer timeout in CI
     },
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     ```
   - Implemented retry logic specific to CI environments
   - Added screenshot and video capture for failed tests:
     ```typescript
     screenshot: 'only-on-failure',
     video: process.env.CI ? 'on-first-retry' : 'off',
     ```

3. **Improved Error Handling and Debugging**:
   - Added detailed error logs for authentication failures
   - Implemented storage state debugging in CI environments:
     ```typescript
     // Write the storage state to a separate debug file in CI for troubleshooting
     if (process.env.CI) {
       const debugPath = path.resolve(__dirname, '../storageState-debug.json');
       fs.writeFileSync(debugPath, JSON.stringify(state, null, 2));
       console.log(`Wrote debug storage state to: ${debugPath}`);
     }
     ```
   - Added trace collection for failed tests

4. **Enhanced Browser Support**:
   - Configured tests to run across Chromium, Firefox, and WebKit:
     ```typescript
     projects: [
       {
         name: 'chromium',
         use: { 
           ...devices['Desktop Chrome'],
           storageState: './e2e/storageState.json',
         },
       },
       {
         name: 'firefox',
         use: { 
           ...devices['Desktop Firefox'],
           storageState: './e2e/storageState.json', 
         },
       },
       {
         name: 'webkit',
         use: { 
           ...devices['Desktop Safari'],
           storageState: './e2e/storageState.json',
         },
       },
     ],
     ```
   - Ensured consistent authentication state across browsers
   - Standardized timeouts and retry policies

5. **Performance Optimizations**:
   - Added support for reusing existing dev servers:
     ```typescript
     webServer: process.env.CI ? undefined : {
       command: 'NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run dev',
       url: 'http://localhost:3000',
       reuseExistingServer: true,
       stdout: 'pipe',
       stderr: 'pipe',
       env: {
         NODE_ENV: 'test',
         E2E_MOCK_AUTH_ENABLED: 'true',
       },
     },
     ```
   - Implemented parallel test execution where possible
   - Optimized resource usage in CI environments

These improvements have significantly enhanced the reliability and maintainability of our test suite, ensuring our CI pipeline can effectively catch regressions before they reach production.