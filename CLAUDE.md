# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Claude Code Instructions - Core Project Guide

**IMPORTANT:** You MUST adhere to the principles and mandatory standards outlined in the full `DEVELOPMENT_PHILOSOPHY.md` document provided in context. This file is a concise reminder of key operational points for working within this repository.

## Build/Lint/Test Commands

- **Development:** `npm run dev` - Run Next.js dev server with Turbopack
- **Lint:** `npm run lint` - Run ESLint checks
- **Type Check:** `npm run typecheck` - Run TypeScript type checking
- **Test All:** `npm test` - Run all Jest tests
- **Test Single File:** `npx jest path/to/component.test.tsx` - Run specific test file
- **Test Watch:** `npm run test:watch` - Run tests in watch mode
- **Test Coverage:** `npm run test:coverage` - Generate test coverage report
- **CI Checks:** `npm run ci` - Run all checks (lint, typecheck, tests)

## Code Style Guidelines

- **TypeScript:** No `any` types allowed (`@typescript-eslint/no-explicit-any: error`)
- **Formatting:** Prettier enforced via pre-commit hooks
- **File Size:** Max 400 lines per file, 100 lines per function (enforced by ESLint)
- **Naming:** Meaningful, descriptive names; follow camelCase convention
- **Error Handling:** Use structured errors; handle all Promise rejections
- **Immutability:** Default to const; avoid modifying parameters

## Core Principles Reminder

- **Simplicity First:** Seek the simplest correct solution. Eliminate unnecessary complexity.
- **Modularity:** Build small, focused components with clear interfaces. Follow package-by-feature structure.
- **Design for Testability:** Non-negotiable. Structure code for easy automated testing. **NO mocking internal collaborators.** Difficulty testing REQUIRES refactoring the code under test first.
- **Maintainability:** Code for humans first. Clarity > Premature Optimization.
- **Explicit > Implicit:** Make dependencies, control flow, and contracts obvious.
- **Automate Everything:** Especially linting, formatting, testing, versioning via established project tooling.
- **Document _Why_, Not _How_:** Code should be self-documenting. Comments explain rationale.

## Mandatory Practices

- **Strict Configuration:** Use strictest settings for linters, formatters, and type checkers defined in project configuration files.
- **NEVER Suppress Errors/Warnings:** Fix the root cause. Directives to ignore linter/type errors are FORBIDDEN without explicit, reviewed justification and explanation.
- **NEVER Hardcode Secrets:** Use environment variables or designated secret managers.
- **NEVER Trust Input:** Validate all external input rigorously at system boundaries.
- **Conventional Commits:** All commit messages MUST follow the spec for automated versioning/changelogs.
- **Always write detailed multiline conventional commit messages**
- **Structured Logging:** Use the project's standard structured logging library to output JSON logs.
- **Context Propagation:** Ensure `correlation_id` (Trace/Request ID) is generated, propagated across boundaries, and included in ALL relevant logs.
- **Quality Gates:** All code MUST pass mandatory pre-commit hooks and all CI checks (lint, format, tests, coverage, security scan). Bypassing hooks (`--no-verify`) is FORBIDDEN.

**REMINDER:** This file highlights key operational points. Always refer to `DEVELOPMENT_PHILOSOPHY.md` and the relevant language-specific appendix (`DEVELOPMENT_PHILOSOPHY_APPENDIX_TYPESCRIPT.md`) for the complete standards and detailed guidelines.
