# Security Auditor

Enhanced npm audit with differentiation between production and development vulnerabilities.

## Purpose

This script improves upon the standard `npm audit` by:

1. Differentiating between vulnerabilities in production vs. development dependencies
2. Providing configurable severity thresholds for reporting and build failure
3. Generating clear, color-coded, and grouped vulnerability reports
4. Setting appropriate exit codes for CI integration
5. Supporting allowlisting of specific advisories or packages

## Installation

```bash
# Install dependencies
cd scripts/security-auditor
npm install
npm run build
```

## Usage

```bash
# Basic usage with default options
npm run start

# Using CLI options
npm run start -- --fail-on-severity=high --fail-on-env=prod --report-min-severity=low

# Using npx
npx ts-node src/index.ts --fail-on-severity=high --fail-on-env=any
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--fail-on-severity <level>` | Minimum severity to cause a non-zero exit code | `high` |
| `--fail-on-env <scope>` | Environment scope for failure (`prod`, `any`) | `prod` |
| `--report-min-severity <level>` | Minimum severity to include in the report | `low` |
| `--include-dev` | Include development dependencies in reporting and failure consideration | `false` |
| `--exclude-dev` | Exclude development dependencies from reporting | `false` |
| `--allowlist-advisories <ids>` | Comma-separated list of advisory IDs to ignore | |
| `--allowlist-packages <patterns>` | Comma-separated list of package name patterns to ignore | |

## Exit Codes

- `0`: No vulnerabilities found that meet failure criteria
- `1`: Vulnerabilities found that meet failure criteria
- `2`: Script execution error

## CI Integration

### Integration with package.json

Add a script to your project's package.json:

```json
"scripts": {
  "audit:security": "ts-node ./scripts/security-auditor/src/index.ts --fail-on-severity=high --fail-on-env=prod"
}
```

### Integration with GitHub Actions Workflow

Example usage in a GitHub Actions workflow:

```yaml
jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run enhanced security audit
        run: npm run audit:security
```

## Report Format

The report is organized as follows:

1. Production vulnerabilities (grouped by severity)
2. Development vulnerabilities (grouped by severity)
3. Summary statistics

Each vulnerability entry includes:
- Package name and version
- Vulnerability title
- Severity level (color-coded)
- Dependency paths
- Advisory URL
- Recommended fix (if available)

## Troubleshooting

### Common Issues

- **npm audit fails**: Ensure you have a valid package.json and package-lock.json
- **Script exits with code 2**: Check the error message for execution problems
- **Unexpected exit code 1**: Review your configuration settings for failure thresholds