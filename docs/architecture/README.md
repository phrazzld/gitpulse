# Architecture Documentation

This directory contains documentation related to the architectural design, principles, and philosophy behind the GitPulse project.

## Contents

- `ATOMIC_DESIGN.md`: Documentation on our atomic design pattern implementation
- `DEVELOPMENT_PHILOSOPHY.md`: Core development principles and practices
- `DEVELOPMENT_PHILOSOPHY_APPENDIX_FRONTEND.md`: Frontend-specific development principles
- `DEVELOPMENT_PHILOSOPHY_APPENDIX_TESTING.md`: Testing-specific development principles
- `DEVELOPMENT_PHILOSOPHY_APPENDIX_TYPESCRIPT.md`: TypeScript-specific development principles

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # API endpoints (GitHub data, auth, etc.)
│   └── dashboard/        # Main application pages
├── components/           # Reusable UI components
│   ├── atoms/            # Basic, primitive components
│   ├── molecules/        # Combinations of atoms
│   ├── organisms/        # Complex components combining molecules
│   └── templates/        # Page layout templates
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities and services
│   ├── accessibility/    # Accessibility utilities and hooks
│   ├── auth/             # Authentication utilities
│   ├── github/           # GitHub API integration
│   └── tests/            # Test utilities
├── state/                # State management
├── styles/               # Global styles and themes
└── types/                # TypeScript type definitions
```

## Design Principles

1. **Modularity**: Small, focused components with clear responsibilities
2. **Separation of Concerns**: UI, data fetching, and business logic are separated
3. **Dependency Injection**: External dependencies are injected explicitly
4. **Type Safety**: Comprehensive TypeScript typing throughout the codebase
5. **Accessibility**: All components are designed with accessibility in mind
6. **Testing**: Components and utilities are designed for testability

See `DEVELOPMENT_PHILOSOPHY.md` for complete details.