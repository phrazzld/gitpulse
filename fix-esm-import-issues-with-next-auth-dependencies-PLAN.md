# T003: Fix ESM import issues with next-auth dependencies

## Task Assessment
- **Complexity**: Simple
- **Scope**: Single file change to update Jest configuration
- **Dependencies**: T001, T002 (already completed)

## Approach
1. Examine the current Jest configuration in `jest.config.js` file
2. Identify the current `transformIgnorePatterns` setting
3. Update the pattern to include the ESM modules from next-auth and its dependencies (jose, openid-client)
4. Run tests that import next-auth to verify the fix
5. Make sure the change doesn't break existing tests

## Implementation Plan
1. Add the missing ESM packages to the `transformIgnorePatterns` array:
   - `jose` - Used by next-auth for JWT operations
   - `next-auth` - Authentication framework
   - `openid-client` - Used by next-auth for OAuth

2. Expected change:
   ```javascript
   transformIgnorePatterns: [
     // Transform ESM modules from node_modules for testing
     "/node_modules/(?!(octokit|@octokit|jose|next-auth|openid-client)/)",
     "^.+\\.module\\.(css|sass|scss)$",
   ],
   ```

3. Verification:
   - Run a specific test that imports next-auth
   - `export CI=true && npm test -- --testPathPattern=src/__tests__/api/my-activity.test.ts`