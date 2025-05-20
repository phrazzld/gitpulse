# CI Failure Summary

This document serves as a central reference for tracking CI failures and their resolutions in the GitPulse project.

## Recent CI Failures

| Date | Failure ID | Description | Severity | Status | Post-mortem |
|------|------------|-------------|----------|--------|------------|
| 2025-05-15 | [Run #512](https://github.com/organization/gitpulse/actions/runs/512) | TypeScript version conflict | High | Resolved | [View](../postmortems/2025-05-15-typescript-version-conflict.md) |

## Failure Categories

### Environment Issues

- **Missing Dependencies**: Failures due to missing or conflicting package dependencies
  - Example: [TypeScript version conflict](../postmortems/2025-05-15-typescript-version-conflict.md)

### Test Failures

- **Flaky Tests**: Tests that intermittently fail due to timing or environmental conditions
- **Broken Tests**: Tests that consistently fail due to application code changes

### Build Failures

- **Compilation Errors**: TypeScript or JavaScript compilation failures
- **Asset Processing**: Failures in processing CSS, images, or other assets

### Deployment Failures

- **Infrastructure Issues**: Problems with deployment infrastructure
- **Configuration Errors**: Misconfiguration of deployment settings

## Common Patterns and Trends

This section will be updated based on failure patterns observed over time.

### Current Trends

- TypeScript dependency management has been a recurring issue (1 incidents)

## Key Metrics

| Metric | Current | Previous Month | Trend |
|--------|---------|----------------|-------|
| Total CI Failures | 1 | - | - |
| Mean Time to Resolve | 24h | - | - |
| Recurring Issue Rate | 0% | - | - |
| Action Item Completion | 25% | - | - |

## Upcoming Improvements

| Improvement | Status | Target Date |
|-------------|--------|-------------|
| CI Environment Documentation | In Progress | 2025-05-25 |
| Dependency Validation Script | Planned | 2025-05-30 |
| Local CI Simulation | Planned | 2025-06-05 |

## Post-mortem Archive

For a complete list of all previous CI failure post-mortems, see the [postmortems](../postmortems/) directory.

---

**Document Metadata:**
- Last Updated: 2025-05-20
- Update Frequency: Weekly