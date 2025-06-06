# Development Documentation

This directory contains documentation related to development practices, tools, and guidelines for the GitPulse project.

## Contents

- `CHROMATIC_SETUP.md`: Configuration and setup for Chromatic visual testing
- `CI_WORKFLOW_ALIGNMENT.md`: CI workflow relationships and configuration alignment guide
- `COMPONENT_LIBRARY.md`: Overview of the component library structure
- `DEPENDENCY_MANAGEMENT.md`: Guidelines for managing dependencies
- `LIGHTHOUSE_CI.md`: Configuration and usage of Lighthouse CI
- `STORYBOOK.md`: Storybook setup and usage guidelines
- `STORYBOOK_CI.md`: Storybook CI testing and troubleshooting guide
- `UI_PATTERNS.md`: UI design patterns and implementations

## Development Workflow

See the main README.md for the standard development workflow.

### Key Commands

```bash
# Start development server
npm run dev

# Start development server with logging
npm run dev:log

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run storybook
npm run storybook

# Build storybook
npm run build-storybook
```

## Component Development

We follow an atomic design pattern for our components. See `../architecture/ATOMIC_DESIGN.md` for more details.

Components should be:
- Small and focused
- Well-tested
- Accessible
- Type-safe
- Properly documented with Storybook stories