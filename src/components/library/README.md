# GitPulse Component Library

This directory contains reusable UI components built with React, TypeScript, and Tailwind CSS.

## Structure

- `src/components/library/` - Main component files
- `src/components/library/__tests__/` - Unit tests for components
- `src/components/library/utils/` - Shared utilities for components

## Design Principles

- **Simplicity**: Components should be focused and serve a single purpose
- **Consistency**: Components use a shared design token system from `src/styles/tokens.css`
- **Accessibility**: All components follow accessibility best practices
- **TypeScript-first**: Strong typing for all components and props
- **Testability**: Components are designed to be easy to test in isolation

## Core Components

- Button - Primary action button with variants
- Input - Text input with validation states
- Card - Container component for content

## Usage

Import components from the barrel file:

```tsx
import { Button, Input, Card } from "@/components/library";
```

See `docs/components.md` for complete documentation and examples.
