# GitPulse Scripts

This directory contains utility scripts for development, CI, and codebase maintenance.

## Available Scripts

### check-file-size.js

Checks for large files in the codebase and issues warnings for files that exceed the recommended line count threshold.

```bash
node ./scripts/check-file-size.js <path1> <path2> ...
```

### check-skipped-tests.js

Detects skipped tests in the codebase and ensures they have proper justification.

Features:

- Identifies tests marked with `it.skip`, `test.skip`, `describe.skip`, `xit`, `xdescribe`
- Detects commented-out test blocks (`// it`, `// test`, `// describe`)
- Requires SKIP-REASON comments for justification
- Used in CI to prevent unjustified skipped tests from being merged

```bash
# Run manually
node ./scripts/check-skipped-tests.js

# Used in CI via npm script
npm run test:no-skips
```

#### How to Properly Skip Tests

If you need to skip a test, add a `// SKIP-REASON: explanation` comment to the same line:

```javascript
// Good examples with justification:
it.skip('should handle legacy data format', () => { ... }); // SKIP-REASON: Legacy format no longer used after API v2 migration

// it('has been moved to separate test file', () => { ... }); // SKIP-REASON: Test now exists in auth-flow.test.ts

describe.skip('Enterprise features', () => { ... }); // SKIP-REASON: Enterprise features on hold until Q3 2025
```

### rotate-logs.sh

Rotates application log files to prevent them from growing too large.

```bash
./scripts/rotate-logs.sh
```
