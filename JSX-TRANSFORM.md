# JSX Transform Configuration

This document explains the JSX transform configuration in this project and how we handle the React JSX transform in different environments.

## Overview

Next.js 15.x with React 19.x uses the new JSX transform introduced in React 17. However, there's a specific requirement from Next.js that the TypeScript configuration should use `"jsx": "preserve"` to allow Next.js to apply its own transforms during the build process.

This creates a tension in the test environment:

1. **Console Warnings**: The older JSX transform warns about being outdated
2. **Test Failures**: There are errors about React elements from older versions of React

## Configuration

### For application code (Next.js)

- In `tsconfig.json`, we use `"jsx": "preserve"` as required by Next.js
- In `next.config.js`, we configure `compiler.jsx.runtime: "automatic"` to enable the new JSX transform

### For test environment (Jest)

- We suppress the warnings about outdated JSX transform in `jest.setup.js`
- We use a dedicated `.babelrc.js` to configure the JSX transformation in tests

## Current Status and Limitations

The current implementation:

- ✅ Successfully suppresses console warnings about outdated JSX transform
- ❌ Does not resolve the actual React element compatibility errors in tests
- ✅ Still allows the application to build and run correctly
- ❌ Some component tests are failing due to JSX transform incompatibilities

## Why not fix the actual problem?

The root issue is that Next.js requires `"jsx": "preserve"` in `tsconfig.json`, but this setting is incompatible with testing libraries expecting the new JSX transform. We can't change this setting without breaking Next.js.

After multiple approaches, it appears that this is a deeper compatibility issue between:

1. Next.js's requirement for `"jsx": "preserve"`
2. React 19's stricter checking of React element versions
3. Testing library components

**Potential future solutions:**

1. Downgrade React in the test environment
2. Create a separate tsconfig for tests
3. Wait for updates to the testing libraries to better support React 19

## References

- [Next.js TypeScript Documentation](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
- [React New JSX Transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
- [React 19 Compatibility Issues](https://github.com/facebook/react/issues)
