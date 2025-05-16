# GitPulse ESLint Plugin

This plugin contains custom ESLint rules specific to the GitPulse project.

## Rules

### no-direct-date-mock

This rule enforces the use of the centralized `dateMock` utility instead of direct date mocking in test files.

**Configuration:**

```javascript
"gitpulse/no-direct-date-mock": ["error", {
  allowedFiles: ["src/lib/tests/dateMock.ts"]
}]
```

**What it catches:**

- Direct assignment to `global.Date`
- Direct assignment to `Date.now`
- Using `jest.spyOn` on Date objects
- Using `Object.defineProperty` on Date

**Why it's important:**

1. Ensures consistent date mocking patterns across the codebase
2. Makes tests more maintainable
3. Provides proper TypeScript typing for mocked dates
4. Ensures proper cleanup after tests

**How to fix violations:**

Instead of direct date manipulation, use the dateMock utility:

```typescript
import { createMockDate } from '@/lib/tests/dateMock';

// In your test
const { restore } = createMockDate('2023-01-01T00:00:00Z');
// Your test code here
restore();
```