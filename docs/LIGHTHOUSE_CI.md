# Lighthouse CI Performance Budgets

This document describes how we use Lighthouse CI to enforce performance budgets and ensure high quality user experiences.

## Overview

Lighthouse CI is a suite of tools that enables automated testing of website performance, accessibility, SEO, and best practices. We've integrated Lighthouse CI into our development workflow to:

1. Define performance budgets for our application
2. Automatically test performance metrics against these budgets
3. Fail builds when performance degrades beyond acceptable thresholds
4. Generate comprehensive reports of performance measurements

## Performance Budgets

We've defined the following performance budgets for GitPulse:

### Core Web Vitals Metrics

| Metric | Error Threshold | Warning Threshold | Description |
|--------|----------------|-------------------|-------------|
| Largest Contentful Paint (LCP) | > 2.5s | > 2.0s | Time until the largest content element is visible |
| First Contentful Paint (FCP) | > 2.0s | > 1.8s | Time until first content is painted |
| Cumulative Layout Shift (CLS) | > 0.1 | > 0.05 | Measures visual stability |
| Total Blocking Time (TBT) | > 300ms | > 200ms | Sum of blocking time between FCP and TTI |
| Speed Index | > 3.8s | > 3.0s | How quickly content is visually populated |
| Time to Interactive (TTI) | > 3.5s | > 3.0s | Time until the page is fully interactive |

### Resource Budgets

| Resource | Limit | Description |
|----------|-------|-------------|
| JavaScript (total) | 400 KB | Max combined JS file size |
| CSS (total) | 100 KB | Max combined CSS file size |
| Images (total) | 300 KB | Max combined image size |
| Fonts | 5 | Max number of font files |
| Third-Party Resources | 10 | Max number of third-party resources |
| Total Page Weight | 1 MB | Max combined size of all resources |

## Running Lighthouse Locally

We've added several npm scripts to make running Lighthouse easy:

```bash
# Run a full Lighthouse audit (collect + assert)
npm run lighthouse

# Only collect Lighthouse data (no assertions)
npm run lighthouse:collect

# Run assertions against previously collected data
npm run lighthouse:assert

# Run Lighthouse in CI mode
npm run lighthouse:ci
```

## CI Integration

Lighthouse CI is integrated into our GitHub Actions workflow. For each PR and merge to master/main, our CI pipeline:

1. Builds the application
2. Starts a local server with the built app
3. Runs Lighthouse tests against the local server
4. Fails the build if any performance budgets are exceeded
5. Uploads the Lighthouse reports as artifacts
6. Adds a PR comment with a summary of the results

### GitHub Actions Configuration

The Lighthouse CI step is added to our `.github/workflows/ci.yml` file after the build step. It uses the [Lighthouse CI Action](https://github.com/treosh/lighthouse-ci-action) to run the tests and report results.

## Interpreting Results

Lighthouse generates scores for four key categories:

- **Performance**: How quickly the page loads and becomes responsive
- **Accessibility**: How accessible the page is to users with disabilities
- **Best Practices**: Adherence to web development best practices
- **SEO**: Search engine optimization factors

Each category receives a score from 0-100, with higher being better.

### Performance Score Breakdown

The Performance score is computed from the following metrics:

- **First Contentful Paint**: When the first content appears
- **Speed Index**: How quickly content is visually displayed
- **Largest Contentful Paint**: When the largest content element appears
- **Time to Interactive**: When the page becomes fully interactive
- **Total Blocking Time**: Amount of time the main thread is blocked
- **Cumulative Layout Shift**: Measure of visual stability

## Troubleshooting

If Lighthouse tests are failing in CI but passing locally, consider:

1. **Network Differences**: CI environments often have bandwidth limitations
2. **CPU Differences**: CI runners may have different CPU constraints
3. **Variability**: Performance tests naturally have some variability

## Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)