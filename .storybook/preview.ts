import type { Preview } from '@storybook/react'
import '../src/app/globals.css'

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
  },
};

export default preview;