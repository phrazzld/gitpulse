# T020: Remove Explicit `any` Types - PLAN

## Task Overview
Remove the use of explicit `any` types throughout the codebase to improve type safety, adherence to TypeScript best practices, and reduce potential runtime errors. 

## Analysis of the Problem

Based on the initial scan, there are multiple files with explicit `any` types:

1. **Test Files**:
   - `src/__tests__/api-test-utils.ts`
   - `src/__tests__/api/additional-routes.test.ts`

2. **Type Definition Files**:
   - `src/types/github.ts`
   - `src/types/summary.ts`
   - `src/lib/optimize.ts`

3. **Potential Other Files**:
   - Files in `src/lib/` directory

The main issue is the use of `any` type which:
- Undermines TypeScript's type safety benefits
- Makes refactoring more risky
- Can lead to runtime errors that could be caught at compile time
- Hinders code maintainability 

## Implementation Strategy

The implementation will follow a thoughtful pattern of replacing `any` types with more specific or, when that's not possible, safer alternatives:

1. **Use `unknown` instead of `any`**: The `unknown` type requires type checking before operations, which is safer
2. **Create specific interfaces/types**: Where possible, define appropriate types for the data
3. **Use generic types**: Where flexibility is needed but with constraints
4. **Use type unions**: When a variable can be one of several specific types

### Replacement Guidelines:

- `any[]` → Replace with `unknown[]` or a specific type like `T[]`
- `Record<string, any>` → Replace with `Record<string, unknown>` or define a specific type
- Function parameters → Replace with appropriate specific types or generics
- Function return types → Add explicit return types where missing

## Implementation Plan

### 1. Test Files (Medium Priority)
These don't affect production code but maintaining type safety in tests is still important:

- `src/__tests__/api-test-utils.ts`:
  - Replace explicit `any` function parameters with more specific types
  - For mock data handlers, use appropriate return types

- `src/__tests__/api/additional-routes.test.ts`:
  - Replace NextRequest function casting to use appropriate types

### 2. Type Definition Files (High Priority)
These are critical as they define types used throughout the application:

- `src/types/github.ts`:
  - Replace index signatures using `any` with `unknown`
  - Define more specific types for repository and commit properties

- `src/types/summary.ts`:
  - Create a proper type for the commits array instead of `any[]`

- `src/lib/optimize.ts`:
  - Replace the `any` parameter in `optimizeContributor` with a proper interface
  - Update `removeNullValues` function to use generics properly

### 3. Remaining Files (As Discovered)
- Search for and address any additional instances of `any` throughout the codebase

## Testing Strategy
- Run TypeScript compiler with `--noEmit` to verify type errors are resolved
- Run ESLint with the `@typescript-eslint/no-explicit-any` rule set to error
- Ensure tests continue to pass after the changes

## Verification Strategy
- Run `npm run typecheck` to verify all TypeScript errors are resolved
- Run tests to ensure functionality is preserved