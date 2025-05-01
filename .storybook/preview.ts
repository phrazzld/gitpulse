import type { Preview } from '@storybook/react'
import '../src/app/globals.css'

/**
 * This is the Storybook preview configuration.
 * It includes:
 * - Global styles import
 * - Next.js feature mocks
 * - Background presets
 * - Control matchers for better controls panel experience
 * - Decorator for themeing consistency
 */
const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#1b2b34', // --dark-slate
        },
        {
          name: 'darker',
          value: '#121212', // --background-secondary
        },
        {
          name: 'light',
          value: '#ffffff', // --foreground
        },
        {
          name: 'transparent',
          value: 'transparent',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
};

export default preview;