# Task ID: T001CI

## Title: Refactor github modules for dependency injection

## Original Ticket Text:
**T001CI: Refactor github modules for dependency injection**
- Modify modules in `src/lib/github/` (repositories, auth, commits, utils) to accept Octokit client and fetch functions as explicit dependencies
- Export interfaces for external dependencies where needed
- Modules should no longer instantiate external clients internally

## Implementation Approach Analysis Prompt:

You are tasked with analyzing a specific development task. Your goal is to provide a thorough analysis of the implementation approach, constraints, best practices, and potential challenges.

Please analyze the following task and provide a comprehensive implementation plan:

### Task Context:
This task is part of resolving CI failures in the GitPulse project. The core issue is that the current tests are mocking internal module functions instead of external dependencies, which violates the project's "Mock ONLY True External System Boundaries" policy. The modules in src/lib/github/ need refactoring to support dependency injection so that external clients (Octokit) can be injected rather than created internally.

### Current Architecture:
- GitHub modules currently instantiate their own Octokit clients internally
- Tests are attempting to mock these internal instantiations, causing failures
- This approach violates testing best practices outlined in DEVELOPMENT_PHILOSOPHY.md

### Required Changes:
1. Refactor all modules in src/lib/github/ to accept dependencies via constructor or function parameters
2. Define interfaces for external dependencies (Octokit client, fetch function)
3. Remove all internal instantiation of external clients
4. Ensure backward compatibility where possible

### Constraints:
- Must follow TypeScript best practices from DEVELOPMENT_PHILOSOPHY_APPENDIX_TYPESCRIPT.md
- Cannot use any type - must use specific types or interfaces
- Must maintain strict separation of concerns (core logic from infrastructure)
- Must be testable without mocking internal collaborators
- Must pass strict TypeScript compilation

### Expected Outcome:
- Clean dependency injection implementation
- Interfaces for external dependencies
- No internal client instantiation
- Improved testability following project standards

Please provide:
1. Detailed implementation steps
2. Interface designs
3. Code structure recommendations
4. Potential challenges and solutions
5. Testing approach
6. Migration strategy for existing code