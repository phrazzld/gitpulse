# File Size Threshold Decision

## Current Situation

There are currently two different file size thresholds in the codebase:

1. **scripts/check-file-size.js**: 300 lines (including blank lines and comments)
2. **eslint.config.mjs** (`max-lines` rule): 500 lines (excluding blank lines and comments)

This inconsistency can lead to confusion and contradictory warnings during development.

## Considerations

When determining an appropriate threshold for file size limits, the following factors were considered:

1. **Code Readability**: Smaller files are generally easier to understand and maintain
2. **Module Cohesion**: Files should represent cohesive units of functionality
3. **Practical Reality**: Some files legitimately need to be larger (e.g., complex components)
4. **Industry Standards**: Common recommendations range from 200-500 lines
5. **Codebase Context**: The project's specific needs and architecture
6. **Current File Sizes**: The distribution of file sizes in the existing codebase

## Decision

**The standard file size threshold for the GitPulse project will be set to 400 lines (excluding blank lines and comments).**

### Rationale

- This threshold balances readability concerns with practical reality
- By excluding blank lines and comments, we encourage proper documentation without penalizing well-documented code
- The threshold is strict enough to prevent excessive file sizes but flexible enough for complex components
- 400 lines strikes a middle ground between the current thresholds (300 and 500)

## Implementation Plan

1. Update `scripts/check-file-size.js` to use the new threshold of 400 lines and modify it to exclude blank lines and comments for consistency with ESLint
2. Update the ESLint configuration (`max-lines` rule) to use the new threshold of 400 lines
3. Document this decision in the project's development standards
