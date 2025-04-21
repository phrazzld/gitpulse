# Mock Reference for Tests

This document provides standard mock implementations for tests to ensure consistency across test files.

## Installation Helper Mock

```javascript
// Mock the installation helper
jest.mock("@/lib/auth/installationHelper", () => ({
  resolveInstallationId: jest.fn().mockImplementation(() => ({
    isValid: true,
    id: 123456,
    source: "query",
  })),
  resolveMultipleInstallationIds: jest.fn().mockImplementation(() => [123456]),
  requireInstallationId: jest.fn().mockImplementation(() => 123456),
  InstallationIdSource: {
    QUERY: "query",
    SESSION: "session",
    COOKIE: "cookie",
    AVAILABLE_INSTALLATIONS: "available_installations",
    FALLBACK: "fallback",
    NONE: "none",
  },
}));
```

### Customizing the Installation Helper Mock

For tests that need to test specific scenarios, you can customize the mock behavior:

```javascript
// Import the mocked functions after setting up the mock
import { resolveInstallationId } from "@/lib/auth/installationHelper";

// Mock an invalid installation ID result
resolveInstallationId.mockImplementationOnce(() => ({
  isValid: false,
  source: "none",
  error: "Invalid installation ID",
}));

// Mock an ID from a specific source
resolveInstallationId.mockImplementationOnce(() => ({
  isValid: true,
  id: 789012,
  source: "cookie",
}));

// Mock requireInstallationId to throw an error
import { requireInstallationId } from "@/lib/auth/installationHelper";
requireInstallationId.mockImplementationOnce(() => {
  const error = new Error("No valid installation ID found");
  Object.assign(error, {
    code: "INSTALLATION_ID_REQUIRED",
    needsInstallation: true,
    source: "none",
  });
  throw error;
});
```

Remember to reset the mocks between tests:

```javascript
beforeEach(() => {
  resolveInstallationId.mockReset();
  resolveMultipleInstallationIds.mockReset();
  requireInstallationId.mockReset();
});
```
