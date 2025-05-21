# GitPulse CI/CD Configuration

This directory contains the configuration files for GitPulse's CI/CD pipelines.

## Workflows

### CI (`workflows/ci.yml`)

The main CI workflow runs on pushes to `master`/`main` and on pull requests. It:

- Installs dependencies
- Runs linting checks (ESLint)
- Runs TypeScript type checking
- Builds the Next.js application
- Builds Storybook
- Caches build artifacts for faster subsequent runs

This workflow ensures code quality and catches issues early in the development process.

### Storybook Accessibility (`workflows/storybook-a11y.yml`)

This workflow runs accessibility checks on Storybook stories whenever story files or Storybook configuration changes. It:

- Builds Storybook
- Runs accessibility checks on all stories
- Fails if any accessibility violations are detected

## Configuration

The CI workflows are configured to fail the build if any of the following occur:

- Linting errors (`npm run lint` fails)
- TypeScript type errors (`npm run typecheck` fails)
- Next.js build errors (`npm run build` fails)
- Storybook build errors (`npm run build-storybook` fails)
- Accessibility violations in Storybook stories

## Adding New Checks

When adding new checks to the CI pipeline, follow these guidelines:

1. Add the step to the appropriate workflow file
2. Ensure the step fails the build if checks fail
3. Update this README to document the new check
4. Test the workflow by making a test PR