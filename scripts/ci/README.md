# CI Scripts

This directory contains scripts for Continuous Integration (CI) operations and monitoring.

## Authentication Monitoring

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