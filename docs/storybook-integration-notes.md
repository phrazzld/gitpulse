# Storybook Integration Plan for GitPulse

This document outlines the approach for integrating Storybook with GitPulse's tech stack, which includes Next.js 15, React 19, TypeScript, and TailwindCSS 4.

## Project Stack Analysis

- **Next.js Version**: 15.2.4 (App Router)
- **React Version**: 19.0.0
- **TypeScript**: Version 5+
- **TailwindCSS**: Version 4+
- **CSS Strategy**: Global CSS with TailwindCSS (@import "tailwindcss")
- **Project Structure**: Uses Next.js App Router pattern
- **Styling Variables**: Custom CSS variables for theming (dark-slate, neon-green, etc.)

## Storybook Setup Strategy

### Builder Selection

We'll use the Vite builder instead of Webpack for several key advantages:
- Faster build times and hot module replacement
- Better developer experience with quick refresh
- Lower memory consumption
- Native ESM support

### Needed Storybook Addons

1. **Core Addons**:
   - `@storybook/addon-essentials` - Core UI and features
   - `@storybook/addon-interactions` - Testing interactions
   - `@storybook/addon-links` - Story linking
   - `@storybook/addon-a11y` - Accessibility checks

2. **Next.js Integration**:
   - Initially we'll use basic mocking for Next.js features
   - Add `@storybook/nextjs` addon only if basic mocking proves insufficient

3. **TailwindCSS Integration**:
   - For Vite builder, we'll need tailwind integration addon
   - Potential options:
     - `@storybook/addon-styling` (if compatible with Vite)
     - Custom PostCSS configuration in `.storybook/main.ts`

### Handling Next.js Features

Based on codebase analysis, we need to handle:

1. **next/image**:
   - Used throughout the application for user avatars and organization icons
   - Implementation: Create unoptimized image mock:
   ```typescript
   import * as NextImage from 'next/image';
   const OriginalNextImage = NextImage.default;
   Object.defineProperty(NextImage, 'default', {
     configurable: true,
     value: (props) => <OriginalNextImage {...props} unoptimized />,
   });
   ```

2. **next/link**:
   - Not widely used in the current codebase but may be added later
   - Implementation: Basic passthrough to anchor elements if needed

3. **useRouter**:
   - Used for protected routes, navigation, and page operations
   - Implementation: Mock the essential methods:
   ```typescript
   import { useRouter } from 'next/navigation';
   
   // Mock implementation
   jest.mock('next/navigation', () => ({
     useRouter: () => ({
       push: jest.fn(),
       replace: jest.fn(),
       refresh: jest.fn(),
       back: jest.fn(),
       prefetch: jest.fn(),
       pathname: '/',
       query: {},
     }),
   }));
   ```

### Global Styles Integration

1. **Approach**:
   - Import application's `globals.css` directly in `.storybook/preview.ts`
   - Ensure TailwindCSS directives are properly processed
   
2. **Theme Variables**:
   - Use the project's CSS custom properties (--dark-slate, --neon-green, etc.)
   - Configure Storybook backgrounds to match application theming

### Potential Configuration Hurdles

1. **TailwindCSS Processing**:
   - Ensure PostCSS is correctly configured for Vite
   - May require additional configuration in `.storybook/main.ts`

2. **Next.js App Router Compatibility**:
   - App Router uses React Server Components which aren't compatible with Storybook
   - Solution: Focus stories on client components, mock server component behavior

3. **React 19 Compatibility**:
   - Storybook may need specific configurations to work with React 19
   - Potential solution: Ensure latest Storybook version is used

4. **TypeScript Integration**:
   - Ensure proper type definitions for stories
   - Use Component Story Format (CSF) 3.0 with TypeScript types

## Example Configuration

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    // TailwindCSS integration (exact addon name to be confirmed)
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  // May need to add if components reference public assets
  // staticDirs: ['../public'],
};

export default config;
```

### .storybook/preview.ts

```typescript
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

// Optional: Basic Mock for next/image
import * as NextImage from 'next/image';
const OriginalNextImage = NextImage.default;
Object.defineProperty(NextImage, 'default', {
  configurable: true,
  value: (props) => <OriginalNextImage {...props} unoptimized />,
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark-slate',
      values: [
        { name: 'dark-slate', value: 'var(--dark-slate)' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default preview;
```

## Next Steps and Decision Points

1. **Styling Addon Decision**:
   - Confirm exact addon needed for Vite + TailwindCSS integration
   - Test if basic PostCSS config is sufficient or if addon is required

2. **Static Directory Necessity**:
   - Determine if components reference assets from /public directory
   - Configure staticDirs if needed

3. **Next.js Feature Mocking Approach**:
   - Confirm if basic mocks in preview.ts are sufficient
   - Evaluate need for @storybook/nextjs addon

4. **React 19 Compatibility**:
   - Monitor for any issues with Storybook + React 19
   - Be prepared to implement workarounds if needed

## Reference Resources

- [Storybook Official Documentation](https://storybook.js.org/docs/)
- [Storybook for Next.js](https://storybook.js.org/docs/get-started/nextjs)
- [Vite Builder Documentation](https://storybook.js.org/docs/builders/vite)
- [TailwindCSS with Storybook](https://storybook.js.org/recipes/tailwindcss)