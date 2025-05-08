# Migration Plan: @testing-library/react-hooks to React Testing Library

## Status
✅ **COMPLETED**: All migration tasks have been successfully completed. The project now uses the native `renderHook` functionality from `@testing-library/react` and is compatible with React 19.

## Context
Our project previously used `@testing-library/react-hooks` (v8.0.1) to test React hooks. However, this library was incompatible with React 19 and @types/react v19, causing CI failures due to dependency conflicts.

## Objective
Create a comprehensive migration plan to replace `@testing-library/react-hooks` with the native `renderHook` functionality from `@testing-library/react` (v16.3.0+), which properly supports React 19.

## Requirements
1. Identify all current usages of @testing-library/react-hooks in the codebase
2. Determine the pattern differences between the old and new approaches
3. Create a step-by-step migration plan with detailed, atomic tasks
4. Ensure the plan addresses all edge cases and test scenarios
5. Include specific code examples showing the before/after transformations
6. Organize tasks by priority, dependencies, and complexity
7. Define clear success criteria for each task

## Deliverables
1. A detailed analysis of the current testing patterns
2. A comprehensive set of migration tasks in the format of TODO.md tasks
3. Code examples for each type of migration scenario
4. Guidelines for handling complex test scenarios

## Task Format
Each task should follow this format:
```
- [ ] **TASK-XXX: [Task Title]**
  - **Priority**: [High/Medium/Low]
  - **Effort**: [Small/Medium/Large]
  - **Dependencies**: [Any dependent tasks]
  - **Success Criteria**: [Clear measures of completion]
  - **Description**:
  - [ ] [Detailed subtask 1]
  - [ ] [Detailed subtask 2]
  - [ ] [Detailed subtask 3]
```

## Special Considerations
1. The migration must maintain test coverage and quality
2. Changes should align with the project's development philosophy
3. Consider any side effects on the testing infrastructure
4. Ensure backward compatibility where possible
5. Prefer direct refactoring over complex workarounds
6. Address any TypeScript-specific challenges

## Output Example
The output should include tasks like:
- Create hook testing utility using @testing-library/react
- Update useInstallations tests to use new pattern
- Update useCommits tests to use new pattern
- Add test documentation for the new hook testing approach
- Update CI workflows to work with the new testing approach

But with much more detail, proper task numbering, and specific implementation guidance.