# Dependency Management

This document outlines our approach to managing dependencies in the GitPulse project.

## Table of Contents

1. [Introduction](#introduction)
2. [Peer Dependencies](#peer-dependencies)
   - [Current Approach](#current-approach)
   - [Strategy](#strategy)
   - [Handling Version Conflicts](#handling-version-conflicts)
3. [CI Configuration](#ci-configuration)
4. [Dependency Auditing](#dependency-auditing)
5. [Version Alignment](#version-alignment)
6. [Best Practices](#best-practices)

## Introduction

Properly managing dependencies is critical for maintaining a stable, secure, and maintainable codebase. This document provides guidelines for handling dependencies in the GitPulse project.

## Peer Dependencies

### Current Approach

GitPulse uses standard dependency management without relying on the `--legacy-peer-deps` flag. We maintain compatible versions of all dependencies to ensure smooth installation and operation without dependency conflicts.

### Strategy

Our dependency management strategy includes:

1. Using compatible versions of dependencies, especially for React and its ecosystem
2. Leveraging native functionality where available instead of additional dependencies
3. Regularly updating dependencies to maintain compatibility and security
4. Ensuring type definitions are aligned with their corresponding libraries
5. Following a structured approach to resolve version conflicts

For example, we've successfully migrated from `@testing-library/react-hooks` to the native `renderHook` functionality in `@testing-library/react` v16.3.0, which is fully compatible with React 19.

### Handling Version Conflicts

When encountering dependency version conflicts:

1. **Identify the conflict**: Use `npm ls <package-name>` to identify conflicting versions
2. **Check compatibility**: Review documentation to determine if newer versions are backward compatible
3. **Update related packages**: When updating one package in an ecosystem, update related packages together
4. **Test thoroughly**: After resolving conflicts, thoroughly test the application
5. **Document decisions**: Document any specific version constraints and the rationale behind them

This approach helps us maintain a clean dependency tree without resorting to the `--legacy-peer-deps` flag, which can hide underlying compatibility issues.

## CI Configuration

Our CI workflows are configured to:

1. Use `npm ci` to install dependencies
2. Run security audits with `npm audit --audit-level=high`
3. Perform TypeScript type checking with `npm run typecheck`

This ensures that our dependency tree remains consistent and that potential security vulnerabilities are caught early.

## Dependency Auditing

We regularly audit our dependencies to:

1. Identify and remove unused packages
2. Update outdated dependencies
3. Address security vulnerabilities

### Commands for Local Auditing

```bash
# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities automatically (where possible)
npm audit fix
```

## Version Alignment

For critical interdependent packages, we follow these alignment rules:

1. **React Ecosystem**:
   - React, React DOM, and related packages should use the same major version
   - Type definitions (@types/react, @types/react-dom) must match their package versions
   - Testing libraries must be compatible with the React version

2. **Next.js Ecosystem**:
   - eslint-config-next version should match the Next.js version
   - Next.js plugins should be compatible with the Next.js version
   - Storybook configuration must be compatible with Next.js

## Best Practices

1. **Adding Dependencies**:
   - Before adding a new dependency, check if the functionality can be implemented with existing dependencies
   - Prefer widely-used, well-maintained packages with good TypeScript support
   - Verify compatibility with our core dependencies (React, Next.js, etc.)
   - Consider bundle size impact, especially for client-side code
   - Check for security vulnerabilities before adding

2. **Updating Dependencies**:
   - Prefer semver-compatible updates
   - Test thoroughly after updating major versions
   - Update related packages together (e.g., React and React DOM)
   - Carefully review breaking changes and migration guides
   - Update type definitions alongside their corresponding packages

3. **Removing Dependencies**:
   - Regularly review the dependency list to identify unused packages
   - When removing a dependency, ensure all imports are also removed
   - Verify that tests still pass after removing dependencies
   - Check for transitive dependencies that may no longer be needed

4. **Security and Maintenance**:
   - Regularly run `npm audit` to check for vulnerabilities
   - Address critical and high severity issues promptly
   - Consider using automated tools like Dependabot for updates
   - Document any decisions to pin specific versions for compatibility reasons
   - Regularly update devDependencies to benefit from tooling improvements

5. **Type Definitions**:
   - Ensure @types packages are aligned with their library versions
   - Prefer packages with bundled TypeScript definitions
   - For packages without types, maintain custom type definitions in a structured way