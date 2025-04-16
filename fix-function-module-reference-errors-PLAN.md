# T019: Fix Function/Module Reference Errors - PLAN

## Task Overview
Fix incorrect function references in API route files that are causing TypeScript errors. These errors prevent the codebase from successfully type-checking and building.

## Files to Modify
- `src/app/api/my-activity/route.ts`
- `src/app/api/my-org-activity/route.ts`
- `src/app/api/team-activity/route.ts`

## Analysis of Issues

Based on examining the code, I've identified the following issues:

1. In all three route files, there are references to `fetchAppRepositories` and `fetchRepositories` that are not being properly imported.

2. These files are importing `fetchAllRepositories` from `@/lib/githubData` which is a unified function that will internally call the correct repository fetching function (either `fetchAppRepositories` or `fetchRepositories`) based on the authentication method.

3. The TypeScript error `Cannot find name 'fetchAppRepositories'. Did you mean 'fetchAllRepositories'?` indicates that TypeScript can't find the referenced functions because they are not imported directly.

4. Looking at `src/lib/githubData.ts`, I can see that:
   - `fetchRepositories` and `fetchAppRepositories` are exported functions
   - `fetchAllRepositories` is a unified wrapper function that calls either of the above functions based on authentication method

## Implementation Approach

### Option 1: Import Missing Functions
We can fix the issue by importing `fetchRepositories` and `fetchAppRepositories` directly from `@/lib/githubData`.

### Option 2: Use the Unified Function
Since we're already importing `fetchAllRepositories`, which is designed to handle both authentication methods, we could modify the code to use this unified function instead.

I'll go with **Option 1** as it maintains the current code structure and intent, which appears to use different functions based on authentication method. This is the minimal change needed to fix the errors.

## Implementation Steps

1. For each of the three files:
   - Update the imports to include `fetchRepositories` and `fetchAppRepositories` from `@/lib/githubData`
   - Keep the existing code logic that uses these functions

2. Verify that TypeScript no longer reports errors related to these function references.

## Testing Plan

1. Run `npm run typecheck` to confirm that the TypeScript errors related to these function references are resolved.
2. Look for any new TypeScript errors that might have been introduced.