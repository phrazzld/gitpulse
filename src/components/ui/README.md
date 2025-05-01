# UI Component Library

This directory contains reusable UI components that are intended to be:

- **Simple**: Focused on a single responsibility
- **Presentational**: UI-focused with minimal business logic 
- **Reusable**: Can be used across multiple features
- **Well-documented**: Include proper TypeScript documentation and Storybook stories

## Component Requirements

Components in this directory should:

1. Be primarily driven by props rather than context or global state
2. Have clear, well-defined interfaces with proper TypeScript types
3. Include Storybook stories demonstrating their usage and variants
4. Follow consistent naming and documentation patterns

## Directory Structure

Each component should be placed directly in this directory with its associated files:

```
/ui
├── ComponentName.tsx       # The component implementation
├── ComponentName.stories.tsx  # Storybook stories
└── ComponentName.test.tsx  # Tests (if applicable)
```

## Accessing Components

Import UI components using the path alias:

```typescript
import ComponentName from '@/components/ui/ComponentName';
```