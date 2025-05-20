# CI Failure Post-mortem Template

## Basic Information

- **Date of Failure**: YYYY-MM-DD
- **Failure ID**: [CI Run ID or Link]
- **Affected Branch/PR**: [Branch name or PR number]
- **Discovered By**: [Name/Team]
- **Resolved By**: [Name/Team]
- **Resolution Date**: YYYY-MM-DD

## Summary

A brief (1-2 paragraph) summary of the CI failure that occurred.

## Timeline

| Time | Event |
|------|-------|
| YYYY-MM-DD HH:MM | CI pipeline started |
| YYYY-MM-DD HH:MM | Failure occurred |
| YYYY-MM-DD HH:MM | Failure discovered |
| YYYY-MM-DD HH:MM | Investigation started |
| YYYY-MM-DD HH:MM | Root cause identified |
| YYYY-MM-DD HH:MM | Fix implemented |
| YYYY-MM-DD HH:MM | Fix verified |

## Failure Details

### Symptoms

Describe the observed symptoms of the failure:
- Error messages
- Failed tests
- Build artifacts
- Screenshots/logs

### Impact

- **Severity**: [Critical/High/Medium/Low]
- **Scope**: [Number of builds/PRs affected]
- **Duration**: [How long the issue persisted]
- **Development Impact**: [How it affected the team]

### Root Cause Analysis

#### What Happened

A detailed explanation of what happened, including relevant code snippets, configs, or logs.

#### Why It Happened

The underlying reasons for the failure:
- Technical causes
- Process causes
- Human factors

#### How It Was Detected

- How was the failure detected?
- What monitoring or alerts were triggered?
- What could have helped detect it sooner?

## Resolution

### Immediate Fix

What was done to immediately resolve the issue?

```
# Example code or configuration changes
```

### Long-term Solution

What steps are being taken to prevent this issue from recurring?

## Learnings

### What Went Well

- List things that worked well in handling this failure

### What Went Poorly

- List areas for improvement in handling similar failures

### Preventive Measures

| Preventive Measure | Owner | Due Date | Status |
|--------------------|-------|----------|--------|
| [Action item 1] | [Owner] | YYYY-MM-DD | [Open/In Progress/Completed] |
| [Action item 2] | [Owner] | YYYY-MM-DD | [Open/In Progress/Completed] |

## Related Issues

- Link to GitHub issues created for follow-up actions
- Link to related documentation

## Appendix

Any additional information, data, or context that helps understand the failure.

---

**Document Metadata:**
- Template Version: 1.0
- Last Updated: 2025-05-20