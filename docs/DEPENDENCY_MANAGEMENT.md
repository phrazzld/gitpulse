# Dependency Management

This document outlines our approach to managing dependencies in the GitPulse project.

## Table of Contents

1. [Introduction](#introduction)
2. [Peer Dependencies](#peer-dependencies)
3. [CI Configuration](#ci-configuration)
4. [Dependency Auditing](#dependency-auditing)
5. [Best Practices](#best-practices)

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

For example, we've successfully migrated from `@testing-library/react-hooks` to the native `renderHook` functionality in `@testing-library/react` v16.3.0, which is fully compatible with React 19.

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

## Best Practices

1. **Adding Dependencies**:
   - Before adding a new dependency, check if the functionality can be implemented with existing dependencies
   - Prefer widely-used, well-maintained packages
   - Verify compatibility with our core dependencies (React, Next.js, etc.)

2. **Updating Dependencies**:
   - Prefer semver-compatible updates
   - Test thoroughly after updating major versions
   - Update related packages together (e.g., React and React DOM)

3. **Removing Dependencies**:
   - Regularly review the dependency list to identify unused packages
   - When removing a dependency, ensure all imports are also removed
   - Verify that tests still pass after removing dependencies