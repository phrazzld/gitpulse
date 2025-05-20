# CI Failure Post-mortem: TypeScript Version Conflict

## Basic Information

- **Date of Failure**: 2025-05-15
- **Failure ID**: [GitHub Actions Run #512](https://github.com/organization/gitpulse/actions/runs/512)
- **Affected Branch/PR**: PR #87, Branch: feature/atomic-design-storybook
- **Discovered By**: Alex Chen
- **Resolved By**: Taylor Smith
- **Resolution Date**: 2025-05-16

## Summary

A CI failure occurred during the merge of the Atomic Design and Storybook Migration PR. The pipeline failed during the TypeScript compilation step with errors indicating type incompatibilities. The root cause was a mismatch between the TypeScript version specified in package.json and the version used by ts-node in the security audit script. The issue affected all PR builds for approximately 24 hours and blocked the deployment of critical accessibility improvements.

## Timeline

| Time | Event |
|------|-------|
| 2025-05-15 09:34 | PR #87 created and CI pipeline triggered |
| 2025-05-15 09:45 | CI pipeline failed during TypeScript type checking |
| 2025-05-15 10:12 | Failure discovered by Alex during PR review |
| 2025-05-15 10:30 | Investigation started by Taylor |
| 2025-05-15 14:17 | Root cause identified: ts-node version conflict |
| 2025-05-16 08:45 | Fix implemented: added ts-node to devDependencies |
| 2025-05-16 09:12 | Fix verified with successful CI run |

## Failure Details

### Symptoms

TypeScript compilation failed with errors like:

```
error TS2339: Property 'includes' does not exist on type 'PathOrFileDescriptor'.
  Property 'includes' does not exist on type 'number'.
```

The security audit script (`scripts/security-auditor/src/index.ts`) failed to run with:

```
Error: Cannot find module 'typescript'
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:995:15)
```

### Impact

- **Severity**: High
- **Scope**: All PRs to master branch (4 PRs affected)
- **Duration**: 24 hours
- **Development Impact**: Blocked deployment of accessibility improvements, delayed 4 developers' work

### Root Cause Analysis

#### What Happened

When the security audit script was added to the CI pipeline, it used ts-node to execute TypeScript files directly. However, ts-node was not explicitly added as a dependency in the project's package.json. The CI environment did not have ts-node installed globally, unlike most developers' local environments where it was available.

#### Why It Happened

1. **Technical Causes**:
   - Missing explicit dependency on ts-node in package.json
   - Reliance on globally installed packages in the CI environment
   - No test for the CI workflow before merging

2. **Process Causes**:
   - No CI environment verification checklist was followed before PR
   - Insufficient testing of new CI steps in an isolated environment

3. **Human Factors**:
   - Assumption that the CI environment would match developer environments
   - Overlooked dependency during code review

#### How It Was Detected

- The failure was detected through normal CI monitoring
- CI pipeline email notifications alerted the team
- The issue could have been detected earlier with a pre-merge CI environment verification test

## Resolution

### Immediate Fix

Added ts-node to devDependencies in package.json:

```diff
"devDependencies": {
  "typescript": "^5.0.4",
+ "ts-node": "^10.9.1",
  // other dependencies
}
```

### Long-term Solution

1. Created a CI environment verification step in the PR template
2. Added explicit checks for all required dependencies in CI scripts
3. Implemented a pre-merge test workflow that simulates the CI environment

## Learnings

### What Went Well

- Quick identification of the missing dependency once investigation started
- Simple fix that could be applied without major changes
- Clear error messages helped pinpoint the issue

### What Went Poorly

- Took too long to start investigating (delay between discovery and investigation)
- No systematic check for dependency completeness before merging
- Multiple PRs were affected before the fix was implemented

### Preventive Measures

| Preventive Measure | Owner | Due Date | Status |
|--------------------|-------|----------|--------|
| Update PR template to include CI environment verification | Taylor | 2025-05-20 | Completed |
| Create documentation for CI environment setup | Alex | 2025-05-25 | In Progress |
| Add dependency validation script to pre-commit hooks | Jamie | 2025-05-30 | Open |
| Establish CI simulation in local dev environment | Riley | 2025-06-05 | Open |

## Related Issues

- [#92 Add ts-node to project dependencies](https://github.com/organization/gitpulse/issues/92)
- [#94 Improve CI dependency validation](https://github.com/organization/gitpulse/issues/94)
- [#95 Document CI environment requirements](https://github.com/organization/gitpulse/issues/95)

## Appendix

### Full Error Log

```
> gitpulse@0.1.0 security-audit
> cd scripts/security-auditor && ts-node src/index.ts

Error: Cannot find module 'typescript'
Require stack:
- /Users/runner/.nvm/versions/node/v16.14.0/lib/node_modules/ts-node/dist/index.js
- /Users/runner/.nvm/versions/node/v16.14.0/lib/node_modules/ts-node/dist/bin.js
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:995:15)
    at Function.Module._load (node:internal/modules/cjs/loader:841:27)
error Command failed with exit code 1.
```

### Resolution Confirmation

After adding ts-node to package.json, the CI pipeline completed successfully:

```
> gitpulse@0.1.0 security-audit
> cd scripts/security-auditor && ts-node src/index.ts

Analyzing npm audit results...
No critical or high severity issues found in production dependencies.
```

---

**Document Metadata:**
- Template Version: 1.0
- Last Updated: 2025-05-16