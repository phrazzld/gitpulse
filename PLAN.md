# Remediation Plan – Sprint 1

## Executive Summary

This remediation plan targets critical and high-severity flaws in the Jest testing framework implementation, as identified in the recent code review. The strike order prioritizes foundational fixes (fixing broken imports, enforcing type safety, security auditing) before addressing configuration, documentation, and coverage concerns. This ensures that the testing infrastructure functions correctly, adheres to project standards, and future development cannot regress on these fronts. Each fix is traced to a specific code review ID for accountability.

## Strike List

| Seq | CR‑ID | Title                                        | Effort | Owner |
| --- | ----- | -------------------------------------------- | ------ | ----- |
| 1   | cr‑01 | Fix non-idiomatic import in Jest setup       | xs     | core  |
| 2   | cr‑03 | Enforce type safety for all test files       | s      | core  |
| 3   | cr‑04 | Automate security audit of dependencies      | xs     | core  |
| 4   | cr‑12 | Add `engines` field to package.json          | xs     | core  |
| 5   | cr‑02 | Raise and enforce test coverage thresholds   | s      | core  |
| 6   | cr‑05 | Add Prettier and code format enforcement     | s      | core  |
| 7   | cr‑07 | Add type annotations in example test         | xs     | core  |
| 8   | cr‑08 | Reinforce mocking policy in docs/setup       | xs     | core  |
| 9   | cr‑06 | Refine Jest coverage exclusion patterns      | m      | core  |
| 10  | cr‑09 | Improve example test with real functionality | s      | core  |

## Detailed Remedies

### cr‑01 Fix Non‑idiomatic Import in Jest Setup

- **Problem:** `jest.setup.js` uses ESModule `import` syntax, which is invalid in Node.js CJS config context.
- **Impact:** Jest setup fails to run, breaking all test execution in JS context (BLOCKER).
- **Chosen Fix:** Switch to `require()` in `jest.setup.js` and document rationale.
- **Steps:**
  1. Replace `import '@testing-library/jest-dom'` with `require('@testing-library/jest-dom')` in `jest.setup.js`.
  2. Add a comment explaining the CJS/Node.js requirement.
  3. Verify tests can now start execution with `npm test`.
- **Done-When:** Jest runs setup without syntax errors in both local and CI environments.
- **Effort:** xs

### cr‑03 Enforce Type Safety for All Test Files

- **Problem:** Test files are not type-checked; type errors in tests can silently pass to CI.
- **Impact:** Type errors in tests can cause runtime failures, break test reliability, and undermine TypeScript's value (BLOCKER).
- **Chosen Fix:** Add `tsc --noEmit` for test files and integrate with CI.
- **Steps:**
  1. Ensure all test files (`*.test.ts`, `__tests__`) are included in `tsconfig.json` (check and modify the `include` array).
  2. Verify the `"typecheck": "tsc --noEmit"` script in `package.json` uses this configuration.
  3. Run `npm run typecheck` to verify all test files are checked.
  4. Ensure CI pipeline executes the typecheck script and fails on errors.
  5. Update README to clearly document this requirement.
- **Done-When:** Type errors in test files cause the typecheck command to fail; CI enforces type checks.
- **Effort:** s

### cr‑04 Automate Security Audit of Dependencies

- **Problem:** No automated check for vulnerable dependencies.
- **Impact:** Vulnerabilities in dependencies may go undetected, risking exploits or compliance failures (BLOCKER).
- **Chosen Fix:** Add `npm audit` script and integrate with CI.
- **Steps:**
  1. Add `"audit": "npm audit --audit-level=high"` to the `scripts` section in `package.json`.
  2. Update CI pipeline configuration to run this script and fail on issues.
  3. Document security audit expectations in README.
- **Done-When:** CI fails on new high/critical vulnerabilities; developers can run the audit locally.
- **Effort:** xs

### cr‑12 Add `engines` Field to package.json

- **Problem:** `package.json` lacks `engines` field to enforce Node.js version requirements.
- **Impact:** Potential runtime issues due to incorrect Node.js versions (LOW).
- **Chosen Fix:** Add `engines` field with appropriate Node.js version constraint.
- **Steps:**
  1. Edit `package.json`.
  2. Add `"engines": { "node": ">=18.17.0" }` (adjust version based on project needs).
  3. Commit change and verify it's applied.
- **Done-When:** `package.json` includes the `engines` field with appropriate version constraint.
- **Effort:** xs

### cr‑02 Raise and Enforce Test Coverage Thresholds

- **Problem:** Jest coverage thresholds are set below the documented minimums (current: 70%; required: 85%/95%).
- **Impact:** Low coverage allows untested logic to slip into production, increasing defect rate and maintenance cost (BLOCKER).
- **Chosen Fix:** Update thresholds in `jest.config.js` to meet or exceed requirements.
- **Steps:**
  1. In `jest.config.js`, set `coverageThreshold.global` to at least 85% for statements, branches, functions, and lines.
  2. Identify core logic paths (e.g., `src/lib/`, `src/app/api/summary/handlers.ts`) and add stricter per-path thresholds (95%).
  3. Update README and contribution docs to reflect coverage requirements.
  4. Create follow-up tasks to write tests needed to meet these thresholds.
- **Done-When:** `jest.config.js` reflects the 85%/95% thresholds; CI enforces these thresholds; follow-up tasks created.
- **Effort:** s

### cr‑05 Add Prettier and Code Format Enforcement

- **Problem:** No Prettier config or auto-formatting; formatting drift is unchecked.
- **Impact:** Inconsistent code style, noisy diffs, and code review friction (HIGH).
- **Chosen Fix:** Add Prettier, configuration, and pre-commit hooks.
- **Steps:**
  1. Run `npm install --save-dev prettier` to add the dependency.
  2. Create `.prettierrc.json` with appropriate formatting rules.
  3. Create `.prettierignore` to exclude appropriate files/directories.
  4. Configure Husky and lint-staged to format staged files before commit.
  5. Add a `format` script to `package.json`.
  6. Ensure CI runs Prettier check and fails on violations.
  7. Run `prettier --write .` once to format the codebase.
  8. Document formatting workflow in README.
- **Done-When:** Pre-commit hooks auto-format code; CI fails on format violations; documentation is clear.
- **Effort:** s

### cr‑07 Add Type Annotations in Example Test

- **Problem:** Example test (`example.test.ts`) lacks explicit type annotations.
- **Impact:** Weakens type safety discipline, sets poor precedent for future tests (HIGH).
- **Chosen Fix:** Add explicit types and configure linting to enforce.
- **Steps:**
  1. Update `example.test.ts` to use explicit type annotations, even in trivial tests.
  2. Ensure ESLint is configured to check test files and enforce typing rules.
  3. Run typecheck and lint to confirm enforcement.
- **Done-When:** All tests have explicit types; lint/typecheck catch violations.
- **Effort:** xs

### cr‑08 Reinforce Mocking Policy in Docs/Setup

- **Problem:** Mocking policy (no internal mocking) is not enforced in test setup or documentation.
- **Impact:** Internal mocks may creep in, violating test philosophy and risking brittle tests (HIGH).
- **Chosen Fix:** Add clear policy statements to setup files and documentation.
- **Steps:**
  1. Add a prominent comment to `jest.setup.js` stating: "Mocking of internal modules is strictly forbidden. Only mock true external boundaries."
  2. Update README's testing section to match the language in DEVELOPMENT_PHILOSOPHY.md regarding mocking policy.
  3. Add clear examples of what can and cannot be mocked.
- **Done-When:** Policy is explicit in setup files and README; reviewers can cite specific guidance.
- **Effort:** xs

### cr‑06 Refine Jest Coverage Exclusion Patterns

- **Problem:** Coverage exclusion patterns are overly broad (`!src/**/index.ts`), potentially hiding untested logic.
- **Impact:** Real logic in excluded files can escape coverage checks, producing false confidence (HIGH).
- **Chosen Fix:** Audit all excluded files and narrow exclusion patterns.
- **Steps:**
  1. Audit all `src/**/index.ts` files to identify those containing executable logic.
  2. Update `collectCoverageFrom` in `jest.config.js` to exclude only pure re-export files.
  3. Replace broad patterns with specific file exclusions where appropriate.
  4. Run coverage report to confirm improved accuracy.
- **Done-When:** No logic-containing files are excluded from coverage; exclusion patterns are precise.
- **Effort:** m

### cr‑09 Improve Example Test with Real Functionality

- **Problem:** Example test only verifies Jest setup with trivial assertion (`1 + 1 = 2`).
- **Impact:** Doesn't demonstrate proper testing practices or provide value in verifying actual code (MEDIUM).
- **Chosen Fix:** Replace or supplement with test of actual project functionality.
- **Steps:**
  1. Identify a simple utility function in `src/lib/` that can be tested easily.
  2. Create a proper test file demonstrating best practices (type annotations, multiple test cases, edge cases).
  3. Include both happy path and error case testing.
  4. Add comments explaining the testing approach.
- **Done-When:** Project contains an exemplary test that demonstrates proper practices and tests real functionality.
- **Effort:** s

## Standards Alignment

- Each remedy directly supports the project's core principles:

  - **Simplicity**: Making config clear and consistent (cr‑01, cr‑05)
  - **Modularity**: Ensuring coverage includes all important logic (cr‑06)
  - **Testability**: Enforcing coverage, type safety, and mocking policy (cr‑02, cr‑03, cr‑08)
  - **Coding Standards**: Proper formatting, typing, and documentation (cr‑05, cr‑07)
  - **Security**: Detecting vulnerable dependencies (cr‑04)

- These fixes align with requirements in:
  - `DEVELOPMENT_PHILOSOPHY.md` (coverage requirements, mocking policy)
  - `DEVELOPMENT_PHILOSOPHY_APPENDIX_TYPESCRIPT.md` (typing, formatting)
  - Project tooling standards (Jest, Prettier, ESLint)

## Validation Checklist

- [ ] `npm test` runs without errors, syntax issues, or type errors
- [ ] `npm run typecheck` passes for both production and test code
- [ ] `npm run audit` passes without high/critical vulnerabilities
- [ ] `npm run test:coverage` report meets coverage thresholds
- [ ] Prettier configuration is working (pre-commit hooks format code)
- [ ] Documentation (README, setup comments) clearly explains requirements
- [ ] CI pipeline executes and enforces all quality gates
- [ ] No regressions in existing functionality
