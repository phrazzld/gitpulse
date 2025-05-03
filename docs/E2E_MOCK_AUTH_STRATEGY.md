# E2E Testing Mock Authentication Strategy

This document outlines the cookie-based mock authentication strategy for E2E tests in GitPulse. This approach replaces the localStorage-based authentication with a more secure cookie-based approach that works reliably in CI environments.

## 1. Mock Cookie Structure

The mock authentication cookie will be designed to mimic the NextAuth.js session cookie structure:

- **Cookie Name**: `next-auth.session-token` (matches NextAuth.js naming)
- **Cookie Content**: Base64-encoded JSON object containing:
  ```json
  {
    "user": {
      "id": "mock-user-id",
      "name": "Mock User",
      "email": "mock@example.com",
      "image": "https://github.com/ghost.png"
    },
    "expires": "2099-12-31T23:59:59.999Z",
    "accessToken": "mock-github-token",
    "installationId": 12345678
  }
  ```
- **Cookie Attributes**:
  - `HttpOnly`: true (prevents JavaScript access, enhancing security)
  - `Secure`: conditional (true in production, false in development for localhost testing)
  - `SameSite`: "Lax" (standard for authentication cookies)
  - `Path`: "/" (accessible across the entire site)
  - `MaxAge`: 24 hours (in seconds: 86400)

## 2. API Endpoint Specification

A test-only API endpoint will be implemented to generate and set the mock authentication cookie:

- **API Path**: `/api/test-auth/login`
- **Method**: POST
- **Request Body** (Optional customization):
  ```json
  {
    "userId": "custom-user-id",
    "userName": "Custom Name",
    "userEmail": "custom@example.com"
  }
  ```
- **Response**:
  - **Status**: 200 OK
  - **Headers**: 
    - `Set-Cookie`: Contains the session cookie with defined attributes
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Mock authentication successful"
    }
    ```

## 3. Environment Gating Mechanism

To ensure the mock authentication is only available in test environments:

- **Primary Gate**: `process.env.NODE_ENV === 'test'`
- **Secondary Gate**: `process.env.E2E_MOCK_AUTH_ENABLED === 'true'`
- **Both conditions** must be met to enable the mock auth endpoint
- If conditions are not met, endpoint will return 404 Not Found
- **Additional Development Check**: `process.env.ALLOW_E2E_IN_DEV === 'true'` (allows using in development if explicitly enabled)

## 4. Implementation Notes

1. **Security Considerations**:
   - Cookie-based approach is more secure than localStorage in CI environments
   - Environment gating prevents accidental exposure in production
   - HttpOnly flag prevents JavaScript access to cookie content
   - No real credentials are exposed

2. **Integration with NextAuth.js**:
   - This approach mimics how NextAuth.js handles auth cookies in production
   - The cookie structure matches NextAuth.js expectations

3. **Playwright Integration**:
   - Will use Playwright's `globalSetup.ts` to call the mock auth API
   - Will save cookie state using Playwright's `storageState` feature
   - All tests will start with authenticated state loaded automatically

4. **Usage in CI**:
   - CI pipeline will set `NODE_ENV=test` and `E2E_MOCK_AUTH_ENABLED=true`
   - Authentication will be performed once during global setup
   - Tests can focus on functionality rather than authentication steps

## 5. Migration Path

Current E2E tests using localStorage-based authentication will be refactored to:

1. Remove explicit UI login steps
2. Remove localStorage manipulation
3. Rely on the pre-authenticated state from globalSetup
4. Update API mocking where necessary