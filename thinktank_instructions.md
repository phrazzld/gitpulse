# Instructions for Completing Atomic Design Migration with Robust Testing

You are a senior software architect tasked with creating a comprehensive, actionable plan to complete our Atomic Design migration and fix all failing tests. We need a TODO.md file with narrowly-scoped, well-defined atomic tasks that can be completed independently where possible.

## Project Context
- We've started refactoring to Atomic Design (atoms, molecules, organisms, templates, pages)
- CI pipeline is failing due to tests not being updated to match the new architecture
- We need to complete the migration AND establish consistent testing patterns

## Deliverable Requirements
Create a TODO.md file with:

1. **Atomic Tasks**: Each task should be small, self-contained, and accomplishable in 1-2 hours maximum
2. **Clear Structure**: Use a consistent format for tasks with:
   - A unique task ID (e.g., `TASK-001`)
   - A descriptive title
   - A priority level (high, medium, low)
   - Precise success criteria (how we know when it's done)
   - Dependencies on other tasks (if any)
   - Estimated effort (small, medium, large)

3. **Categorization**: Group tasks into these sections:
   - Component Migration (completing the Atomic Design implementation)
   - ESM Module Import Issues
   - Testing Infrastructure Improvements
   - Component Tests Refactoring
   - GitHub Module Mocking Strategy
   - React Hooks Testing Patterns
   - Storybook Accessibility Testing

4. **Implementation Order**: Provide a suggested implementation sequence that:
   - Addresses highest priority issues first
   - Respects dependencies between tasks
   - Builds foundations before dependent work

5. **Testing Standards**: Define specific testing patterns to standardize across the codebase:
   - How to structure React component tests (React Testing Library patterns)
   - Best practices for mocking, including GitHub modules
   - Proper hook testing approach
   - Component accessibility testing strategy

The TODO.md should be highly actionable, with concrete steps that any developer could pick up and implement without needing further clarification. Include specific file paths, code patterns, and examples where appropriate.

## Key Focus Areas
- Complete the Atomic Design structure properly (not just fix tests)
- Establish consistent testing patterns across the entire codebase
- Make all tests pass with the new architecture
- Create a testing approach that is resilient to future refactoring
- Ensure accessibility testing is properly configured and working

The plan should ensure we don't just fix immediate issues but set up proper patterns for future development.