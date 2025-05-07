# Audit of @testing-library/react-hooks Usage

## 1. Direct Imports of @testing-library/react-hooks

- **In package.json**:
  - Listed as a devDependency: `"@testing-library/react-hooks": "^8.0.1"`
  - Version 8.0.1 is the latest version but is incompatible with React 19

- **In react-test-utils.ts**:
  - Direct import: `import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react-hooks';`
  - Used to implement the `renderHookSafely` utility function
  - The utility wraps the original library's methods with error handling and additional safety features

## 2. Core Utility: renderHookSafely Implementation

### Purpose of the Utility

`renderHookSafely` in `src/lib/tests/react-test-utils.ts` serves as a wrapper around the original `renderHook` function with these key features:

1. Wraps async operations with `act` to prevent React warnings
2. Provides error handling for async operations
3. Exposes the async utilities from the original library:
   - `waitForNextUpdate`
   - `waitFor`
   - `waitForValueToChange`

### Implementation Details

```typescript
export function renderHookSafely<Result, Props>(
  hookFn: (props: Props) => Result,
  options?: RenderHookOptions<Props>
): SafeRenderHookResult<Result, Props> {
  const result = renderHook(hookFn, options);

  // Wraps three async utilities from the original library:
  const safeWaitForNextUpdate = async (waitOptions?: { timeout?: number }) => {
    try {
      await act(async () => {
        await result.waitForNextUpdate(waitOptions);
      });
    } catch (error: unknown) {
      // Error handling
    }
  };

  const safeWaitFor = async (/* params */) => { /* ... */ };
  const safeWaitForValueToChange = async (/* params */) => { /* ... */ };

  return {
    ...result,
    waitForNextUpdate: safeWaitForNextUpdate,
    waitFor: safeWaitFor,
    waitForValueToChange: safeWaitForValueToChange
  };
}
```

## 3. Usage Patterns in Tests

Interestingly, none of the hook test files directly use `renderHookSafely`. Instead, they directly import and use `renderHook` and `act` from '@testing-library/react':

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
```

### Common Testing Patterns Observed

1. **Setup and Initial State Verification**:
   ```typescript
   const { result } = renderHook(() => useHook(props));
   expect(result.current.someValue).toBe(expectedValue);
   ```

2. **State Change Testing with `act`**:
   ```typescript
   act(() => {
     result.current.someFunction();
   });
   expect(result.current.someValue).toBe(newExpectedValue);
   ```

3. **Asynchronous Testing with `waitFor`**:
   ```typescript
   await act(async () => {
     await result.current.someAsyncFunction();
   });
   
   await waitFor(() => {
     expect(result.current.someValue).toBe(expectedValue);
   });
   ```

## 4. Hook Tests Using Testing Library React

The following hook test files already use `@testing-library/react` directly:

1. **src/hooks/dashboard/__tests__/useCommits.test.ts**
2. **src/hooks/dashboard/__tests__/useFilters.test.ts**
3. **src/hooks/dashboard/__tests__/useInstallations.test.ts**
4. **src/hooks/dashboard/__tests__/useRepositories.test.ts**
5. **src/hooks/dashboard/__tests__/useSummary.test.ts**

None of these files use the `renderHookSafely` utility, nor do they directly import from `@testing-library/react-hooks`.

## 5. Documentation Reference

`@testing-library/react-hooks` is referenced in `/docs/UI_PATTERNS.md` in the section about testing logic hooks:

```
### Testing Logic Hooks
- Test state updates in response to function calls
- Mock API calls and external dependencies
- Test error handling and edge cases
- Use `renderHook` from `@testing-library/react-hooks`
```

This documentation will need to be updated to reference the new approach.

## 6. Key Findings

1. **Direct Usage Scope**: The only direct usage of `@testing-library/react-hooks` is in the `react-test-utils.ts` utility file.

2. **Indirect Dependencies**: The utility function `renderHookSafely` depends on the library, but none of the actual hook tests appear to use this utility.

3. **Current Testing Practices**: All hook tests already import and use `renderHook`, `act`, and `waitFor` from `@testing-library/react` directly, which is the recommended approach for React 18+ and React 19 compatibility.

4. **Documentation References**: Only a documentation reference found in `UI_PATTERNS.md` that will need to be updated.

5. **Unused Utility**: `renderHookSafely` might not be actively used in the codebase anymore, as all hook tests directly use the React Testing Library imports.

## 7. Migration Implications

1. **Easy Migration Path**: Since actual tests already use `@testing-library/react`, the migration primarily involves:
   - Removing or updating the `renderHookSafely` utility
   - Updating package.json to remove the dependency
   - Updating documentation

2. **No Test Refactoring Needed**: Current hook tests don't need refactoring since they're already using the modern testing approach.

3. **No Direct Users of renderHookSafely**: No files found that directly use this utility, suggesting it may be vestigial.

## 8. Conclusion

The migration from `@testing-library/react-hooks` to `@testing-library/react` should be straightforward since:

1. Only one utility file directly imports from the old library
2. All actual hook tests already use the modern approach
3. No files appear to use the `renderHookSafely` utility
4. Only a documentation reference needs updating

This audit suggests that TASK-025 should be classified as a "Simple" task that primarily involves removing the unused utility and its dependency, with minimal impact on the actual test files.