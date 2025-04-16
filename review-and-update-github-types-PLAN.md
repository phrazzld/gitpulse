# Review and Update GitHub Types - Task Plan

## Task ID
Review and Update GitHub Types

## Brief Approach
1. Review existing types in `src/types/github.ts` and compare with types used in `src/lib/auth/githubAuth.ts` and `src/lib/githubData.ts`
2. Identify any discrepancies or duplications between these files
3. Update `src/types/github.ts` to include any missing types that have been defined in other files
4. Ensure consistent type definitions across the codebase
5. Make necessary modifications to resolve any type issues

## Analysis
After reviewing the relevant files, I've identified:

1. The `Installation` and `InstallationAccount` types in `src/types/github.ts` are similar but not identical to the `AppInstallation` type in `src/lib/auth/githubAuth.ts`
2. The `Repository` type exists in both `src/types/github.ts` and `src/lib/githubData.ts` with different properties
3. The `Commit` type is defined in `src/lib/githubData.ts` but not in `src/types/github.ts`
4. The `GitHubCredentials` type is defined in `src/lib/auth/githubAuth.ts` but not in `src/types/github.ts`

The plan is to update `src/types/github.ts` to:
1. Export the `GitHubCredentials` type from `src/types/github.ts`
2. Update the `Installation` type to match the `AppInstallation` interface
3. Update the `Repository` type to include all properties used in the codebase
4. Add the `Commit` type to `src/types/github.ts`