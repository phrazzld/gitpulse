# CI Scripts

This directory contains scripts for Continuous Integration (CI) operations and monitoring.

## Authentication Monitoring

### `validate-auth-tokens.js`
Comprehensive authentication token validation script for CI environments.

**Features**:
- Validates JWT token structure and NextAuth session tokens
- Checks NextAuth configuration and endpoint availability
- Verifies environment variables and authentication setup
- Tests session API responses and cookie handling
- Provides detailed debugging output for authentication issues

**Usage**:
```bash
# Run authentication token validation
npm run validate:auth-tokens

# Direct execution with custom URL and timeout
node scripts/ci/validate-auth-tokens.js http://localhost:3000 30000
```

**Output**:
- Detailed validation logs with timestamps
- Results saved to `ci-metrics/auth-token-validation.json`
- Comprehensive error messages for troubleshooting
- Authentication flow validation and readiness checks

### `verify-nextauth-initialization.js`
NextAuth initialization verification script for ensuring proper server readiness.

**Features**:
- Verifies NextAuth endpoints are responding with valid configuration
- Validates JWT secret is properly loaded and functional
- Tests NextAuth providers configuration (GitHub OAuth)
- Checks session handling readiness and validation
- Adds strategic delays for CI environment stability
- Comprehensive timing analysis and retry logic

**Usage**:
```bash
# Run NextAuth initialization verification
npm run verify:nextauth-init

# Direct execution with custom parameters
node scripts/ci/verify-nextauth-initialization.js http://localhost:3000 45000 2000
```

**Output**:
- Detailed verification logs with timing information
- Results saved to `ci-metrics/nextauth-initialization.json`
- CI-specific delays for authentication stability
- Comprehensive error reporting for initialization issues

### `monitor-auth-health.js`
Comprehensive monitoring script for authentication test health in CI environments.

**Features**:
- Executes authentication-specific E2E tests
- Collects detailed performance metrics
- Calculates health scores (0-100 scale)
- Generates actionable recommendations
- Triggers alerts based on configurable thresholds

**Usage**:
```bash
# Run authentication monitoring
npm run monitor:auth

# Direct execution
node scripts/ci/monitor-auth-health.js
```

**Output**:
- Metrics saved to `ci-metrics/auth-health-*.json`
- Latest metrics in `ci-metrics/auth-health-latest.json`
- Console reports with recommendations

### `generate-auth-dashboard.js`
Dashboard generator for authentication health visualization and trend analysis.

**Features**:
- Historical trend analysis with interactive charts
- Real-time status indicators
- Responsive web interface
- Comprehensive metric displays
- Automated recommendations display

**Usage**:
```bash
# Generate authentication dashboard
npm run dashboard:auth

# Direct execution  
node scripts/ci/generate-auth-dashboard.js
```

**Output**:
- Dashboard HTML at `ci-dashboard/index.html`
- Documentation at `ci-dashboard/README.md`
- Status badge data at `ci-dashboard/auth-health-badge.json`

## Integration

These scripts integrate with:
- GitHub Actions workflows (`.github/workflows/auth-monitoring.yml`)
- Main CI pipeline for automated monitoring
- Authentication troubleshooting documentation
- Enhanced authentication verification system

## Dependencies

- Node.js 22+
- Playwright (for E2E test execution)
- Chart.js (for dashboard visualizations)
- jq (for JSON processing in CI)

## Configuration

See [Authentication Monitoring Documentation](../docs/development/AUTHENTICATION_MONITORING.md) for detailed configuration options and usage guidelines.