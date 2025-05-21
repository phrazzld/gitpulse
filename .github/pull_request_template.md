# Pull Request

## Description
Brief description of the changes in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring
- [ ] Testing improvements

## Testing Strategy
Describe your testing approach and what tests you've added/modified.

## Code Quality Checklist

### General
- [ ] My code follows the project's [DEVELOPMENT_PHILOSOPHY.md](../docs/DEVELOPMENT_PHILOSOPHY.md)
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings

### Testing Standards
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have followed TDD principles where appropriate

### Mocking Policies
- [ ] I have **only** mocked external dependencies (APIs, databases, file systems)
- [ ] No internal modules or collaborators are mocked
- [ ] All mocks are properly cleaned up after tests
- [ ] I have followed the "Mock ONLY True External System Boundaries" principle

### Date Mocking
- [ ] All date/time mocking uses the centralized `dateMock` utility from `@/lib/tests/dateMock`
- [ ] No direct manipulation of `global.Date` or `Date.now`
- [ ] All date mocks are properly restored using the `restore()` function
- [ ] I have followed the guidelines in [TESTING_GUIDELINES.md](../docs/TESTING_GUIDELINES.md#date-mocking)

### Error Testing
- [ ] All error cases are properly tested
- [ ] Edge cases are covered with appropriate tests
- [ ] Error handling follows the project's error handling strategy
- [ ] Error messages are user-friendly and informative

### Test Utilities
- [ ] I've used standard testing utilities from `@/lib/tests`
- [ ] No custom implementations that duplicate existing utilities
- [ ] Test helpers follow the established patterns

## Pre-Commit Checks
- [ ] All pre-commit hooks pass
- [ ] Linting passes with no errors
- [ ] Type checking passes with no errors
- [ ] Test coverage meets project requirements

## CI Environment Verification
- [ ] I have verified that my changes do not introduce CI failures
- [ ] All dependencies required by CI are explicitly listed in package.json
- [ ] I have tested my changes in a CI-like environment

## Breaking Changes
List any breaking changes and migration instructions if applicable.

## Related Issues
Closes #issue_number (if applicable)

## Additional Notes
Add any other context about the PR here.

## CI Failure Resolution
If this PR is fixing a CI failure:
- [ ] I have created a post-mortem document following the [CI Failure Post-mortem Process](../docs/CI_FAILURE_POSTMORTEM_PROCESS.md)
- [ ] I have implemented preventive measures to avoid similar failures in the future
- [ ] I have updated any relevant documentation