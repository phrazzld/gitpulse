# `any` Type Usage Summary

The following files contain usages of `any` type that will need to be replaced in task T005:

1. `src/app/api/auth/[...nextauth]/route.ts` (2 occurrences)
2. `src/app/api/my-activity/route.ts` (4 occurrences)
3. `src/app/api/my-org-activity/route.ts` (4 occurrences)
4. `src/app/api/repos/route.ts` (1 occurrence)
5. `src/app/api/summary/route.ts` (1 occurrence)
6. `src/app/api/team-activity/route.ts` (3 occurrences)
7. `src/components/FilterPanel.tsx` (1 occurrence)
8. `src/components/GroupedResultsView.tsx` (3 occurrences)
9. `src/hooks/useDebounce.ts` (4 occurrences)
10. `src/lib/activity.ts` (1 occurrence)
11. `src/lib/auth/apiAuth.ts` (1 occurrence)
12. `src/lib/auth/apiErrorHandler.ts` (4 occurrences)
13. `src/lib/auth/clientAuth.ts` (2 occurrences)
14. `src/lib/auth/githubAuth.ts` (2 occurrences)
15. `src/lib/cache.ts` (6 occurrences)
16. `src/lib/compress.ts` (1 occurrence)
17. `src/lib/githubData.ts` (4 occurrences)
18. `src/lib/localStorageCache.ts` (1 occurrence)
19. `src/lib/logger.ts` (7 occurrences)

Total: 52 occurrences of `any` type that need to be addressed.

In most cases, the `any` type should be replaced with:
- More specific types based on actual data structure
- `unknown` for values of uncertain type (followed by type narrowing)
- Generic types for functions that need to handle multiple types
- Type unions for values that could be one of several specific types

This information will be useful for task T005, which depends on this task.