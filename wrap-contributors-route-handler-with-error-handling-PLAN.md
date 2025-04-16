# T001: Wrap `contributors/route.ts` handler with `withErrorHandling` HOF

## Task Description
Import `withErrorHandling` from `src/lib/auth/apiErrorHandler.ts` and wrap the main `GET` function in `src/app/api/contributors/route.ts`. Ensure the module name is passed correctly for logging context.

## Assessment
This is a simple task that involves modifying a single file to use the existing error handling HOF (Higher Order Function). The modification is straightforward and involves:
1. Adding an import statement for the `withErrorHandling` function
2. Wrapping the existing `GET` function with the HOF
3. Providing the module name for logging context

## Approach
1. Analyze the current structure of `src/app/api/contributors/route.ts`
2. Review `src/lib/auth/apiErrorHandler.ts` to understand how the `withErrorHandling` HOF works
3. Determine the appropriate module name for logging
4. Make the necessary changes to wrap the `GET` function
5. Test the implementation

## Success Criteria
- The `GET` function in `src/app/api/contributors/route.ts` is wrapped with the `withErrorHandling` HOF
- The module name is correctly passed for logging context
- The API route continues to function correctly
- Errors are consistently handled according to the project's error handling strategy