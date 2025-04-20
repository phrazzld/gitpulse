# TypeScript Configuration Documentation

This document explains key TypeScript configuration choices in the GitPulse project.

## Configuration Files

The project uses three TypeScript configuration files:

1. **`tsconfig.json`** - The base configuration inherited by the other configs
2. **`tsconfig.app.json`** - Configuration for application code (excluding tests)
3. **`tsconfig.test.json`** - Configuration for test files (with specific relaxations)

## TypeScript Configuration Strategy

### Application Code (`tsconfig.app.json`)

Application code uses the strictest TypeScript settings:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"]
}
```

The application code configuration:

- Inherits all strict settings from `tsconfig.json`
- Maintains full type safety for production code
- Excludes test files from the compilation scope
- Is used by the main `npm run typecheck` command and pre-commit hooks

### Test Code (`tsconfig.test.json`)

Test files have specific configuration needs:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": false
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": []
}
```

The test code configuration:

- Maintains most strict settings (explicit flags instead of `strict: true`)
- Disables `exactOptionalPropertyTypes` to accommodate mock patterns
- Allows two-stage casting (`as unknown as Type`) with proper documentation
- Is used by the `npm run typecheck:tests` command

## Type Casting in Tests

### Acceptable Patterns

In test files, two-stage casting (`as unknown as Type`) is permitted with the following guidelines:

1. **Documentation Required**: All casts must be documented with comments explaining why the cast is necessary and its safety implications.

2. **Limited Scope**: Only used for:

   - Mocking complex external libraries (e.g., Octokit)
   - Testing error handling boundaries
   - Edge case testing

3. **Proper Comments**: Casts should have explanatory comments:

```typescript
// This is an intentional two-stage cast for our incomplete mock Octokit
// We need this because the mock is missing properties required by the full type
return mockOctokit as unknown as Octokit;
```

### Prohibited Patterns

Even in tests, the following are not allowed:

1. **Direct `as any` casts**: These should be replaced with proper interfaces
2. **Undocumented casts**: All type assertions must have explanatory comments
3. **Unnecessary casts**: Use proper typing when possible

## NPM Scripts

The project has dedicated commands for type checking:

- `npm run typecheck` - Check application code (using `tsconfig.app.json`)
- `npm run typecheck:tests` - Check test files (using `tsconfig.test.json`)
- `npm run typecheck:all` - Check all files using the base config

## Pre-commit Hooks

The `lint-staged` configuration uses the application-specific TypeScript config:

```json
"*.{ts,tsx}": [
  "eslint",
  "bash -c 'tsc --skipLibCheck --noEmit --project tsconfig.app.json'",
  "prettier --write --end-of-line lf",
  "node ./scripts/check-file-size.js"
]
```

This ensures:

- Application code maintains strict typing
- Pre-commit hooks avoid failing on intentional test-specific type casts
- Code quality is enforced without hindering testing patterns

## skipLibCheck Flag

### What is skipLibCheck?

The `skipLibCheck` flag tells TypeScript to skip type checking of declaration files (`.d.ts` files) in node_modules and other dependencies.

### Where is it used in our project?

1. In `tsconfig.json` as a compiler option:

   ```json
   {
     "compilerOptions": {
       "skipLibCheck": true
       // other options...
     }
   }
   ```

2. In the `typecheck` script in `package.json`:

   ```json
   "typecheck": "tsc --noEmit --skipLibCheck --project tsconfig.json"
   ```

3. In the `lint-staged` configuration for TypeScript files:
   ```json
   "lint-staged": {
     "*.{ts,tsx}": [
       // other steps...
       "tsc --skipLibCheck --noEmit"
     ]
   }
   ```

### Why we use skipLibCheck

We conducted comprehensive testing in April 2025 as part of Task T022 (documented in `docs/skipLibCheck-findings.md`) to evaluate this flag. We found:

1. **Type Errors in Dependencies**:

   - Multiple type errors were found in node_modules dependencies when the flag was disabled.
   - These included missing module declarations, interface conflicts, and reference errors.
   - Most notably, there were issues with `next-auth`, Jest type definitions, and their dependencies.

2. **Build Reliability**:

   - Without skipLibCheck, builds would fail due to errors in third-party code we cannot fix.
   - These failures would block development despite our own code being type-safe.

3. **Scope of Responsibility**:
   - Our focus should be on type-checking our own source code, not third-party dependencies.
   - We rely on package maintainers to ensure type consistency within their own packages.

### Test Results

Our testing found two contradicting results:

1. **Performance**:

   - Initial test scripts suggested that type checking without skipLibCheck was faster (1.3x).
   - However, those tests didn't account for all errors that would terminate checking early.
   - When using the actual npm scripts, disabling skipLibCheck caused build failures.

2. **Error Detection**:
   - Multiple type errors were detected in dependencies (next-auth, Jest types, etc.).
   - These errors don't affect runtime functionality but would block builds.

### Current Recommendation

We recommend **continuing to use** the `skipLibCheck` flag in this project because:

- It prevents build failures due to type errors in dependencies we cannot fix
- It maintains focus on ensuring type safety in our own code
- It follows standard practice in the TypeScript ecosystem, especially for Next.js projects
- The alternative would require maintaining manual type declaration overrides for dependencies

### Future Considerations

We should periodically re-evaluate this decision as the project evolves:

- When upgrading major dependencies, especially TypeScript, Next.js, and next-auth
- If build performance becomes problematic
- Consider adding more specific type declarations for critical dependencies
