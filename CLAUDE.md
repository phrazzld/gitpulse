# GitPulse Development Guide

This guide outlines our development principles and practices for building robust, maintainable, and reliable software.

## Git Workflow

### Commit Style
- **Conventional Commits**: Use structured format: `type(scope): description`
  - Types: feat, fix, docs, style, refactor, test, chore, etc.
  - Example: `feat(auth): implement GitHub OAuth login`
- **Atomic Commits**: Each commit should encapsulate exactly one logical change
- Use present tense in commit messages
- Keep messages clear, concise and descriptive

## Commands

### Development
- `npm run dev` - Start development server
- `npm run dev:log` - Start development server with logging to file
- `npm run logs:rotate` - Rotate log files

### Quality & Testing
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run validate:coverage` - Validate Jest coverage JSON format
- `node scripts/coverage/validate-coverage-format.js` - Manual coverage validation

## Project Structure
- `src/lib` - Core utilities and services
- `src/app` - Next.js app router pages and API routes
- `src/types` - TypeScript type definitions
- `scripts` - Utility scripts for development

## Authentication Flow
- GitHub OAuth is used for authentication
- Access tokens are stored in NextAuth.js sessions
- Tokens may expire or be revoked, requiring re-authentication
- The app handles invalid tokens by showing clear error messages
- Users can sign out and sign back in to refresh their token

## Engineering Best Practices

### Logging & Observability
- Implement structured logging (JSON format) consistently
- Include correlation IDs for request tracing
- Establish meaningful metrics aligned with user experience

### Testing
- Maintain high test coverage (unit, integration, end-to-end)
- Write deterministic, repeatable, and efficient tests
- Integrate automated testing into CI pipelines

### Documentation
- Document the **why** behind design decisions
- Keep documentation close to the codebase in markdown
- Update documentation as part of the Definition of Done

### Architecture & Design
- Embrace modularity and loose coupling
- Separate infrastructure and business logic
- Design for resilience with graceful degradation

### Security-First Mindset
- Assume all inputs could be hostile; build secure defaults
- Regularly perform dependency scans
- Default to encryption in transit and at rest

### Performance & Scalability
- Establish and maintain performance benchmarks
- Monitor critical metrics (response times, throughput, latency)
- Ensure horizontal scalability

### Continuous Improvement
- Regularly conduct retrospectives
- Actively manage and reduce technical debt

## Coverage Validation

### Overview
Coverage format validation prevents CI failures caused by malformed Jest coverage JSON files. The validation script checks for common syntax errors and provides actionable fix suggestions.

### Usage
- **Local validation**: `npm run validate:coverage`
- **Specific file**: `node scripts/coverage/validate-coverage-format.js coverage/coverage-final.json`
- **Help**: `node scripts/coverage/validate-coverage-format.js --help`

### Common Issues and Solutions
- **Leading comma errors**: Remove commas at the beginning of JSON files
- **Trailing comma errors**: Remove extra commas before closing braces/brackets
- **Incomplete JSON**: Ensure files aren't truncated during generation
- **Empty coverage files**: Regenerate with `npm test -- --coverage`

### Integration
- Run validation before commits to catch issues early
- Coverage validation is part of the local development workflow
- CI will fail if malformed coverage files are detected

### Troubleshooting
If validation fails:
1. Check the specific error message and suggested fix
2. Regenerate coverage: `npm test -- --coverage`
3. Verify Jest configuration in `jest.config.js`
4. Review recent changes to test files or configuration
5. For persistent issues, check `scripts/coverage/validate-coverage-format.js` logs