# Remaining Test Fixes for T002CI-FIX

## Issues to Fix

### 1. commits.test.ts
- `fetchRepositoryCommits` doesn't throw error for unsupported auth methods - it returns empty array instead
- `fetchCommitsForRepositories` batch size is 5, not 30 as expected by test

### 2. utils.test.ts
- `checkRateLimit` returns a transformed object with additional fields (usedPercent, converted reset time)
- Module name is "github:utils" not "utils"
- `parseTokenScopes` doesn't trim whitespace
- `validateTokenScopes` has different return object shape

### 3. index.test.ts
- Index module doesn't re-export individual functions from repositories, commits, and utils modules

### 4. auth.test.ts
- `getAllAppInstallations` returns installations.installations not just installations
- Environment variables for GitHub App credentials are missing in tests

## Fixes to Apply

1. Fix fetchRepositoryCommits to throw error for unsupported auth methods
2. Change batch size in fetchCommitsForRepositories to 30
3. Update utils tests to match actual function behavior
4. Fix index.ts to re-export all functions
5. Fix auth tests to match actual response structure
6. Add environment variable mocks for tests