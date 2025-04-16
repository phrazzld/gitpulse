# T002: Fix repository commits mock structure

## Task Assessment
- **Complexity**: Simple
- **Scope**: Single file change to fix test data structure
- **Dependencies**: T001 (already completed)

## Approach
1. Examine the `src/lib/githubData.test.ts` file to locate the failing test for repository commits
2. Identify the current mock structure provided in the test
3. Compare it with the expected structure in the test assertions
4. Update either the mock data or test assertions to align the structures
5. Focus on the `fullName` property mentioned in the task description
6. Run the specific test to verify the fix
7. Run all tests for the githubData module to ensure no regressions

## Implementation Plan
- Update the mock structure in the test file to match the expected format
- Ensure the mock includes the necessary properties in the correct format
- Make minimal changes to fix only the specific issue