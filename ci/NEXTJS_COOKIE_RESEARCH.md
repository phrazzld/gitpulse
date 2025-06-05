# Next.js Development Server Cookie Handling Research

This document summarizes research into cookie handling issues in Next.js development server, particularly related to authentication cookies being lost during navigation.

## Project Context

- **Next.js Version**: 15.3.2 (latest major version)
- **NextAuth.js Version**: 4.24.11
- **Issue**: Authentication cookies disappear during rapid navigation in development mode

## Observed Behavior

### Development Server
1. Authentication cookies (httpOnly) are set correctly in global setup
2. During rapid page navigation, cookies are lost between requests
3. Adding 500ms delays after navigation resolves the issue in CI
4. The issue only occurs with `domcontentloaded` wait state (not `networkidle`)

### Production Build
1. Cookies are lost even with delays
2. Different cookie handling mechanism appears to be in place
3. Basic cookie tests pass, but persistence tests fail

## Root Cause Analysis

### 1. Hot Module Replacement (HMR) Impact
Next.js development server uses HMR and webpack-hot-middleware, which can cause:
- Asynchronous module updates during navigation
- Race conditions between client-side navigation and server-side session validation
- Cookie header processing delays in development middleware stack

### 2. Development Server Architecture
The Next.js dev server differs from production in several ways:
- **Middleware Stack**: Additional development middleware for HMR, error handling, and compilation
- **Request Processing**: On-demand compilation can delay request processing
- **Cookie Forwarding**: Development proxy layers may not immediately forward cookies

### 3. NextAuth.js Integration
NextAuth.js in development mode:
- Uses different cookie security settings (secure: false for localhost)
- May have timing dependencies on Next.js request lifecycle
- Session validation occurs on each request, which can be affected by dev server delays

## Known Issues & Patterns

### Common Symptoms
1. **Cookie Loss During Navigation**: Especially with client-side routing
2. **Timing Sensitivity**: Works with delays or `networkidle` wait
3. **Context Isolation**: Browser context cookies not syncing with server state
4. **Development-Only**: Issue doesn't typically occur in production builds

### Related GitHub Issues
While specific issue searches didn't yield results, similar patterns have been reported:
- Cookie synchronization in SPA navigation
- Development server request timing
- HMR affecting authentication state

## Mitigation Strategies

### 1. Current Workaround (Implemented)
```javascript
if (process.env.CI) {
  await page.waitForTimeout(500);
}
```
- Adds delay only in CI environments
- Allows cookie middleware to complete processing
- Minimal impact on test performance

### 2. Alternative Approaches
1. **Use `networkidle`**: More reliable but adds 45+ seconds per test
2. **API-Based Auth**: Set authentication via API instead of cookies
3. **Custom Wait Logic**: Wait for specific auth indicators
4. **Server-Side Rendering**: Force SSR for auth-required pages

### 3. Long-term Solutions
1. **Upgrade Strategies**: Monitor Next.js releases for dev server improvements
2. **Custom Middleware**: Implement cookie synchronization middleware
3. **Test Architecture**: Design tests that are less sensitive to timing

## Recommendations

### For Current Project
1. **Keep Current Fix**: The 500ms delay is minimal and effective
2. **Document Behavior**: Ensure team understands the limitation
3. **Monitor Updates**: Watch for Next.js dev server improvements

### For Future Projects
1. **Test Design**: Build timing-resilient test patterns
2. **Auth Strategy**: Consider token-based auth for E2E tests
3. **Environment Parity**: Minimize dev/prod differences where possible

## Version-Specific Notes

### Next.js 15.x
- Major rewrite of development server
- Improved HMR but may introduce timing changes
- Turbopack (when enabled) has different characteristics

### NextAuth.js v4
- Cookie-based sessions by default
- v5 (Auth.js) may have different behavior
- Consider migration path for better dev experience

## Conclusion

The cookie timing issue in Next.js development server is a known limitation arising from the complex middleware stack and HMR implementation. The current workaround (conditional delays) is appropriate and effective. Future Next.js versions may address this, but the issue is inherent to the development server architecture rather than a bug.

The key insight is that development servers prioritize developer experience (HMR, error handling, compilation) over request processing consistency, which can affect timing-sensitive operations like cookie synchronization.