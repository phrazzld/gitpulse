# CI Failure Analysis - April 21, 2025

## Issue Overview

The CI build failed on PR #12 (feat/layout-navigation-redesign) with test failures in the GitHub setup validation tests. The tests expect a 302 HTTP status code for redirects, but they're receiving 307 status codes instead.

## Detailed Analysis

### Failed Tests

The failing tests are all in `src/__tests__/api/validation/github-setup.test.ts`:

1. "should redirect with error for non-integer installation IDs"
2. "should redirect with error for negative installation IDs"
3. "should redirect with error for non-numeric installation IDs"
4. "should redirect with error for missing installation ID"
5. "should redirect to homepage when no session exists"

All of these tests expect a 302 HTTP status code in their assertions:

```javascript
expect(response.status).toBe(302); // Redirect status
```

However, the actual implementation is using `NextResponse.redirect()` which returns a 307 Temporary Redirect by default in Next.js.

### Root Cause

The issue is a mismatch between the expected behavior in tests and the actual behavior of the Next.js API:

1. **Test Expectations**: The tests were written expecting a 302 (Found) status code for redirects.
2. **Actual Behavior**: `NextResponse.redirect()` in Next.js returns a 307 (Temporary Redirect) status code by default.

This discrepancy appears to be the result of changes in the Next.js API without corresponding updates to the test suite.

### Technical Details

1. In Next.js, `NextResponse.redirect()` uses a 307 Temporary Redirect by default.
2. The mock implementation in the test file `src/__tests__/api/validation/github-setup.test.ts` is using:
   ```javascript
   return NextResponse.redirect(
     new URL("/dashboard?error=invalid_installation_id", "https://example.com"),
   );
   ```
3. This matches the actual implementation in `src/app/api/github/setup/route.ts` which also uses `NextResponse.redirect()` without specifying a status code.

## Proposed Solutions

There are two possible solutions:

### Option 1: Update Tests to Expect 307 (Recommended)

Modify the test assertions to expect 307 instead of 302:

```javascript
expect(response.status).toBe(307); // Temporary Redirect status
```

This matches the current behavior of Next.js and requires minimal changes.

### Option 2: Modify Code to Use 302 Status

Explicitly specify a 302 status code in all `NextResponse.redirect()` calls:

```javascript
return NextResponse.redirect(
  new URL("/dashboard?error=invalid_installation_id", "https://example.com"),
  302, // Explicitly specify 302 status code
);
```

This would require changes to all redirect calls in both the test file and the actual implementation.

## Implementation Plan

1. Update the test file to expect 307 status codes instead of 302
2. Verify tests pass with this change
3. Consider adding a comment explaining the status code choice to avoid future confusion

## Additional Context

Next.js's choice of 307 over 302 for redirects is deliberate. A 307 redirect preserves the HTTP method when redirecting, unlike 302 which might convert POST requests to GET. This makes 307 a safer default choice for an API that might handle various HTTP methods.
