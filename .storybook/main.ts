import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/nextjs",
    "options": {
      // Options for the Next.js framework
      "nextConfigPath": "../next.config.js"
    }
  },
  "docs": {
    "autodocs": "tag"
  },
  "staticDirs": [
    "../public"
  ],
  // Add webpack configuration to handle Next.js features
  "webpackFinal": async (config) => {
    // Add mock for Next.js features
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'next/image': require.resolve('./nextjs-setup.js')
      }
    };

    return config;
  }
};
export default config;