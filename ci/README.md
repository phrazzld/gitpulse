# CI Documentation

This directory contains documentation related to continuous integration processes, post-mortems, and CI-related guidelines for the GitPulse project.

## Contents

- `CI_FAILURE_POSTMORTEM_PROCESS.md`: The process for analyzing and documenting CI failures
- `CI_FAILURE_POSTMORTEM_TEMPLATE.md`: Template for CI failure post-mortems
- `CI_FAILURE_SUMMARY.md`: Summary of recent CI failures and trends

## Post-mortems

The `postmortems/` directory contains historical post-mortem documents for significant CI failures, organized by date.

## CI Process

Our CI pipeline includes:

1. Linting and type checking
2. Unit and integration testing
3. Accessibility testing through Storybook
4. End-to-end testing with Playwright
5. Performance budget checks with Lighthouse
6. Dependency security audits

## Running CI Checks Locally

To simulate CI checks locally before pushing:

```bash
# Run the full check suite
npm run check:all

# Run individual checks
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:a11y
```

## Handling CI Failures

When a CI failure occurs:

1. Analyze the failure using logs and artifacts
2. Follow the post-mortem process documented in `CI_FAILURE_POSTMORTEM_PROCESS.md`
3. Create a post-mortem document using the template
4. Implement fixes and preventive measures
5. Update documentation if necessary