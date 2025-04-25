# Development Scripts

This directory contains utility scripts used for development, CI, and maintenance tasks.

## Available Scripts

### `audit-barrels.js`

Audits all index.ts barrel files in the project to determine which contain executable logic
versus those that are pure re-exports.

**Purpose:** To ensure that coverage statistics are accurate by excluding only pure barrel files
from test coverage calculations.

**Usage:**

```bash
node scripts/audit-barrels.js
```

**Output:**

- Lists all index.ts files found
- Classifies each file as either [PURE] or [LOGIC]
- Provides a summary count of each type
- Generates coverage exclusion patterns for pure barrels for use in jest.config.js

### `rotate-logs.sh`

Rotates and compresses application log files to prevent them from growing too large.

**Usage:**

```bash
./scripts/rotate-logs.sh
```

or via npm script:

```bash
npm run logs:rotate
```
