# CRITICAL ISSUES TO FIX BEFORE MERGING

These critical issues must be addressed before the Atomic Design/Test Library migration PR can be merged.

## Issue 1: Forbidden `any` Type Usage
- **Location**: `src/lib/tests/react-test-utils.ts` and potentially other files
- **Violation**: TypeScript coding standards forbid the use of `any` types
- **Fix**: Replace all instances of `any` with specific types, generics, or `unknown` with proper type guards

## Issue 2: Global Mocking and Internal Collaborator Mocking
- **Location**: `src/lib/tests/react-test-utils.ts` and component tests
- **Violation**: Testing strategy forbids mocking internal collaborators
- **Fix**: Remove global mocks, use proper dependency injection, refactor components to be more testable

## Issue 3: Reliance on `--legacy-peer-deps`
- **Location**: `.github/workflows/ci.yml` and `docs/DEPENDENCY_MANAGEMENT.md`
- **Violation**: Proper dependency management requires resolving conflicts, not bypassing them
- **Fix**: Identify and properly resolve all peer dependency conflicts, remove the flag

## Issue 4: Fragile and Non-Idiomatic Hook Testing Utilities
- **Location**: `src/lib/tests/react-test-utils.ts`
- **Violation**: Simplicity First principle, unnecessarily complex test utilities
- **Fix**: Use React Testing Library's native utilities, remove custom implementations

## Issue 5: Missing or Incorrectly Enforced CI Quality Gates
- **Location**: `.github/workflows/ci.yml`
- **Violation**: CI should enforce strict quality gates for coverage, E2E testing, accessibility, and performance
- **Fix**: Update CI workflow to enforce proper thresholds and include all required quality checks

## Issue 6: Inadequate Dependency Audit Level in CI
- **Location**: `.github/workflows/ci.yml`
- **Violation**: Security policy requires failing builds on critical and high vulnerabilities
- **Fix**: Update npm audit command to fail on appropriate severity levels

## Issue 7: Suppression of TypeScript/Linter Errors
- **Location**: Potentially multiple files
- **Violation**: Coding standards require addressing root causes, not suppressing errors
- **Fix**: Search for and remove all error suppressions, fixing the underlying issues

---

All non-blocker issues from the code review have been moved to the BACKLOG.md file for future sprints.