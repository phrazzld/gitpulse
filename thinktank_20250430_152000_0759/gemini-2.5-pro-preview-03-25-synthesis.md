Okay, let's synthesize the insights and create a robust solution to fix the Storybook freeze for the `AuthLoadingScreen` component.

The core issue stems from performance-intensive CSS features (`backdrop-filter`, animations like `animate-spin`, `animate-pulse`) running within the Storybook environment, exacerbated by a brittle detection mechanism (`window.location.href.includes('localhost:6006')`).

We'll adopt the **explicit prop approach** recommended by GPT-4.1 as it's the most maintainable and testable solution, keeping the component free of environment-specific hacks. We'll combine this with organizational improvements and Storybook configuration best practices highlighted by the other models.

**1. Define Component Props (Optional but Recommended)**

Create a separate types file for better organization.

```typescript
/*
 * File: /src/components/ui/AuthLoadingScreen.types.ts
 * Description: Defines the props interface for the AuthLoadingScreen component.
 */
export interface AuthLoadingScreenProps {
  /** Primary message displayed as a title */
  message?: string;
  /** Secondary message displayed below the status line */
  subMessage?: string;
  /** Status line message displayed with animation */
  statusMessage?: string;
  /** Footer message displayed at the bottom */
  footerMessage?: string;
  /** Primary accent color (default: #00ff87 - neon green) */
  primaryColor?: string;
  /** Secondary accent color (default: #3b8eea - electric blue) */
  secondaryColor?: string;
  /** Text color (default: #ffffff - white) */
  textColor?: string;
  /** Background for the entire screen (default: var(--gradient-bg) or fallback) */
  background?: string;
  /** Card background color (default: rgba(27, 43, 52, 0.7) - dark slate with opacity) */
  cardBackground?: string;
  /** Optional CSS class name to apply to the container */
  className?: string;
  /**
   * Disable expensive visual effects (animations, backdrop-filter).
   * Set to true in performance-sensitive environments like Storybook.
   * @default false
   */
  disableEffects?: boolean;
}
```

**2. Modify the Component (`AuthLoadingScreen.tsx`)**

Introduce the `disableEffects` prop and use it to conditionally apply the expensive styles/classes. Remove the old `window.location` check.

```typescript
/*
 * File: /src/components/ui/AuthLoadingScreen.tsx
 * Description: Modified AuthLoadingScreen to accept a `disableEffects` prop
 *              to conditionally disable animations and backdrop-filter.
 */
import { AuthLoadingScreenProps } from './AuthLoadingScreen.types'; // Import from the new types file

export default function AuthLoadingScreen({
  message = 'Verifying Authentication',
  subMessage = 'Please wait while we verify your credentials',
  statusMessage = 'System access verification in progress...',
  footerMessage = 'SECURE CONNECTION ESTABLISHED',
  primaryColor = '#00ff87', // --neon-green
  secondaryColor = '#3b8eea', // --electric-blue
  textColor = '#ffffff', // --foreground
  background = 'var(--gradient-bg, linear-gradient(135deg, #121212 0%, #1b2b34 100%))',
  cardBackground = 'rgba(27, 43, 52, 0.7)',
  className = '',
  disableEffects = false, // Add the new prop with default value
}: AuthLoadingScreenProps) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${className}`}
      style={{ background }}
    >
      <div
        className="card w-full max-w-md p-8 space-y-8 border-2 rounded-md"
        style={{
          backgroundColor: cardBackground,
          // Apply backdrop-filter only if effects are NOT disabled
          ...(!disableEffects ? { backdropFilter: 'blur(10px)' } : {}),
          boxShadow: `0 0 20px ${primaryColor}33`,
          borderColor: primaryColor,
        }}
      >
        {/* Terminal-style header */}
        <div className="flex items-center mb-4">
          <div className="flex space-x-1 mr-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    i === 0
                      ? primaryColor
                      : i === 1
                        ? secondaryColor
                        : textColor,
                }}
              />
            ))}
          </div>
          <div
            className="h-px flex-grow"
            style={{ backgroundColor: secondaryColor }}
          ></div>
        </div>

        <h2 className="text-xl text-center" style={{ color: primaryColor }}>
          {message}
        </h2>

        <div
          className="flex justify-center items-start space-x-4 p-4 border border-opacity-30 rounded-md"
          style={{
            borderColor: secondaryColor,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ color: secondaryColor }}>
            <svg
              // Apply animation class only if effects are NOT disabled
              className={!disableEffects ? 'animate-spin h-8 w-8' : 'h-8 w-8'}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <div className="space-y-2 flex-1">
            <p
              // Apply animation class only if effects are NOT disabled
              className={!disableEffects ? 'text-sm animate-pulse' : 'text-sm'}
              style={{ color: secondaryColor }}
            >
              &gt; {statusMessage}
            </p>
            <p className="text-xs" style={{ color: textColor }}>
              &gt; {subMessage}
            </p>
            <div
              className="flex space-x-1 text-xs mt-2"
              style={{ color: textColor }}
            >
              <span>&gt;</span>
              <span
                // Apply animation class only if effects are NOT disabled
                className={!disableEffects ? 'animate-pulse' : ''}
              >
                |
              </span>
            </div>
          </div>
        </div>

        {footerMessage && (
          <div className="text-center text-xs" style={{ color: textColor }}>
            <p>{footerMessage}</p>
            <div className="flex justify-center items-center mt-2">
              <div
                className="h-px w-8"
                style={{ backgroundColor: secondaryColor }}
              ></div>
              <div className="px-2">•</div>
              <div
                className="h-px w-8"
                style={{ backgroundColor: secondaryColor }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**3. Update the Stories (`AuthLoadingScreen.stories.tsx`)**

Configure the stories to use the new prop, add documentation, and apply layout improvements.

```typescript
/*
 * File: /src/components/ui/AuthLoadingScreen.stories.tsx
 * Description: Stories for AuthLoadingScreen, configured to disable effects
 *              within Storybook for performance.
 */
import type { Meta, StoryObj } from '@storybook/react';
import AuthLoadingScreen from './AuthLoadingScreen';
import { AuthLoadingScreenProps } from './AuthLoadingScreen.types'; // Import from the new types file

/**
 * A stylized loading screen for authentication transitions with a terminal-like interface.
 *
 * It features configurable colors and messages. Ideal for displaying during authentication flows or
 * page transitions requiring a branded loading experience.
 *
 * **Note:** Expensive visual effects (animations, backdrop-filter) can be disabled via the
 * `disableEffects` prop, which is set to `true` by default in these Storybook examples
 * to prevent performance issues. Toggle the control below to see the difference (if performance allows).
 */
const meta: Meta<typeof AuthLoadingScreen> = {
  title: 'UI/Screens/Auth Loading',
  component: AuthLoadingScreen,
  tags: ['autodocs'],
  parameters: {
    // Use 'padded' layout for better canvas presentation with the height decorator
    layout: 'padded',
    docs: {
      description: {
        component:
          'A stylized, customizable loading screen for authentication transitions with a terminal-like interface. Use the `disableEffects` control to toggle performance-intensive animations and filters.',
      },
    },
  },
  argTypes: {
    message: { control: 'text' },
    subMessage: { control: 'text' },
    statusMessage: { control: 'text' },
    footerMessage: { control: 'text' },
    primaryColor: { control: 'color' },
    secondaryColor: { control: 'color' },
    textColor: { control: 'color' },
    background: { control: 'text' },
    cardBackground: { control: 'text' },
    className: { control: 'text' },
    disableEffects: {
      description:
        'Disable expensive visual effects (animations, backdrop-filter) for performance.',
      control: 'boolean',
    },
  },
  // Default args for all stories unless overridden
  args: {
    // Default to disabling effects in Storybook for performance
    disableEffects: true,
    // Explicitly set defaults used by the component for clarity in Storybook args
    message: 'Verifying Authentication',
    subMessage: 'Please wait while we verify your credentials',
    statusMessage: 'System access verification in progress...',
    footerMessage: 'SECURE CONNECTION ESTABLISHED',
    primaryColor: '#00ff87',
    secondaryColor: '#3b8eea',
    textColor: '#ffffff',
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)', // Explicit background
    cardBackground: 'rgba(27, 43, 52, 0.7)',
  },
};

export default meta;
type Story = StoryObj<typeof AuthLoadingScreen>;

// Decorator to constrain height in Storybook, preventing min-h-screen issues
const withFixedHeight = (Story: () => React.ReactElement) => (
  // Apply a fixed height and hide overflow. Adjust height as needed.
  // Use min-height on the inner Story to allow centering within the fixed container.
  <div style={{ height: '500px', overflow: 'hidden', display: 'flex' }}>
    <Story />
  </div>
);

/**
 * Default configuration. Effects are disabled by default in Storybook.
 * Use the Controls panel to toggle `disableEffects`.
 */
export const Default: Story = {
  args: {
    // Inherits default args from meta.args
  },
  decorators: [withFixedHeight],
};

/**
 * Shows the loading screen with custom messages for a login process.
 */
export const Login: Story = {
  args: {
    message: 'Authenticating User',
    subMessage: 'Establishing secure connection to server',
    statusMessage: 'Processing login credentials...',
    footerMessage: 'DATA TRANSFER ENCRYPTED',
  },
  decorators: [withFixedHeight],
};

/**
 * Shows the loading screen with custom messages for dashboard access.
 */
export const DashboardAccess: Story = {
  args: {
    message: 'Accessing Dashboard',
    subMessage: 'Verifying security credentials and loading user data',
    statusMessage: 'Retrieving repository analytics...',
    footerMessage: 'INITIALIZING DATA VISUALIZATION',
  },
  decorators: [withFixedHeight],
};

/**
 * Demonstrates an alternate purple/cyan color theme.
 */
export const AlternateColors: Story = {
  args: {
    message: 'Loading Resources',
    subMessage: 'Please wait while we set up your environment',
    statusMessage: 'Initializing connection...',
    footerMessage: 'RESOURCE ALLOCATION IN PROGRESS',
    primaryColor: '#a855f7', // Purple
    secondaryColor: '#06b6d4', // Cyan
  },
  decorators: [withFixedHeight],
};

/**
 * A dark themed version with a more subdued color palette.
 */
export const DarkTheme: Story = {
  args: {
    message: 'Authentication Required',
    subMessage: 'Establishing secure session',
    statusMessage: 'Verifying identity...',
    footerMessage: 'CONFIDENTIAL ACCESS PROTOCOL',
    primaryColor: '#9ca3af', // Gray
    secondaryColor: '#4b5563', // Dark gray
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    cardBackground: 'rgba(25, 25, 25, 0.8)',
  },
  decorators: [withFixedHeight],
};

/**
 * Story without a footer message.
 */
export const NoFooter: Story = {
  args: {
    footerMessage: '', // Explicitly empty footer
  },
  decorators: [withFixedHeight],
};

/**
 * Story demonstrating the effects enabled (may be slow in Storybook).
 * This explicitly sets `disableEffects` to `false`.
 */
export const EffectsEnabled: Story = {
    name: "Effects Enabled (Potentially Slow)",
    args: {
      disableEffects: false, // Explicitly enable effects for demonstration
    },
    decorators: [withFixedHeight],
  };
```

**Summary of Changes and Rationale:**

1.  **`AuthLoadingScreenProps` Interface:** Moved to `*.types.ts` for clarity (optional but good practice).
2.  **`disableEffects` Prop:** Added to the component (`AuthLoadingScreen.tsx`) to explicitly control expensive features. Defaults to `false` (effects enabled) for normal application use.
3.  **Conditional Logic:** Replaced the brittle `window.location` check with checks against the `disableEffects` prop for `backdrop-filter` and `animate-*` classes.
4.  **Storybook `args`:** Set `disableEffects: true` in the `meta.args` to default all stories to the performant version within Storybook. Added explicit default values for other props in `meta.args` for clarity.
5.  **Storybook `argTypes`:** Added `disableEffects` so it appears in the Controls panel, allowing developers to toggle it for testing (if performance permits).
6.  **Storybook `parameters.layout`:** Set to `'padded'` for better spacing.
7.  **Storybook Decorator (`withFixedHeight`):** Added to constrain the component's height within the Storybook canvas, preventing layout issues caused by `min-h-screen`.
8.  **Storybook Documentation:** Updated component and story descriptions to explain the `disableEffects` prop and why it's used in Storybook.
9.  **`EffectsEnabled` Story:** Added an explicit story to demonstrate the component with effects turned *on*, warning about potential performance issues in Storybook.

This approach directly addresses the performance bottleneck in Storybook by providing an explicit control mechanism, improving maintainability and testability while ensuring the component functions as intended in the main application. The Storybook stories are now functional and serve their purpose for UI development and documentation.