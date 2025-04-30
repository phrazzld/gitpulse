```typescript
/*
 * Consultation Request: T009 - Fix AuthLoadingScreen Storybook Freeze
 * Goal: Create Storybook stories for AuthLoadingScreen component that work properly in Storybook without freezing.
 * Problem: Storybook freezes completely when navigating to AuthLoadingScreen stories, likely due to performance issues with animations or complex CSS like backdrop-filter in the Storybook environment.
 * Solution:
 * 1. Introduce a reliable check within the component to detect if it's running inside Storybook. Use `process.env.STORYBOOK === 'true'`, which is a standard environment variable set by Storybook builders.
 * 2. Conditionally disable performance-intensive features (animations like `animate-spin`, `animate-pulse`, and CSS properties like `backdrop-filter`) when the component is rendered in Storybook using the check from step 1.
 * 3. Ensure Storybook story configuration (`AuthLoadingScreen.stories.tsx`) is clean, uses appropriate layout parameters (`padded`), and potentially uses decorators (`withFixedHeight`) to manage the component's `min-h-screen` style effectively within the Storybook canvas.
 * 4. Explicitly set background styles in story args to avoid potential issues with CSS variable resolution in Storybook.
 * Rationale: This approach directly targets the likely performance bottlenecks (animations, backdrop-filter) specifically within the Storybook environment, preventing the freeze while allowing the component to render fully featured in the main application. It uses a standard mechanism for environment detection, improving robustness over URL checking.
 */

/**
 * File: /Users/phaedrus/Development/gitpulse/src/components/ui/AuthLoadingScreen.tsx
 * Description: Modified AuthLoadingScreen component to conditionally disable animations and backdrop-filter when running in Storybook.
 */
import { AuthLoadingScreenProps } from './AuthLoadingScreen.types'; // Assume props interface moved to separate file for clarity

// Determine if running in Storybook - safer check than URL parsing
// process.env.STORYBOOK is typically set by Storybook builders
const isStorybook = process.env.STORYBOOK === 'true';

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
          // Only apply backdrop-filter in non-Storybook environments to improve performance
          // Use the isStorybook flag
          ...(!isStorybook ? { backdropFilter: 'blur(10px)' } : {}),
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
              // Disable animation in Storybook
              className={!isStorybook ? 'animate-spin h-8 w-8' : 'h-8 w-8'}
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
              // Disable animation in Storybook
              className={!isStorybook ? 'text-sm animate-pulse' : 'text-sm'}
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
                // Disable animation in Storybook
                className={!isStorybook ? 'animate-pulse' : ''}
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

```typescript
/*
 * File: /Users/phaedrus/Development/gitpulse/src/components/ui/AuthLoadingScreen.types.ts
 * Description: Created separate types file for AuthLoadingScreenProps.
 */
export interface AuthLoadingScreenProps {
  /**
   * Primary message displayed as a title
   */
  message?: string;

  /**
   * Secondary message displayed below the status line
   */
  subMessage?: string;

  /**
   * Status line message displayed with animation
   */
  statusMessage?: string;

  /**
   * Footer message displayed at the bottom
   */
  footerMessage?: string;

  /**
   * Primary accent color (default: #00ff87 - neon green)
   */
  primaryColor?: string;

  /**
   * Secondary accent color (default: #3b8eea - electric blue)
   */
  secondaryColor?: string;

  /**
   * Text color (default: #ffffff - white)
   */
  textColor?: string;

  /**
   * Background for the entire screen (default: var(--gradient-bg) or fallback)
   */
  background?: string;

  /**
   * Card background color (default: rgba(27, 43, 52, 0.7) - dark slate with opacity)
   */
  cardBackground?: string;

  /**
   * Optional CSS class name to apply to the container
   */
  className?: string;
}
```

```typescript
/*
 * File: /Users/phaedrus/Development/gitpulse/src/components/ui/AuthLoadingScreen.stories.tsx
 * Description: Updated stories file with layout parameter and clarified decorator purpose. Ensured explicit backgrounds are used.
 */
import type { Meta, StoryObj } from '@storybook/react';
import AuthLoadingScreen from './AuthLoadingScreen';
import { AuthLoadingScreenProps } from './AuthLoadingScreen.types'; // Import props type

/**
 * AuthLoadingScreen stories showcase a stylized loading screen for authentication transitions.
 *
 * The component features a terminal-like interface with configurable colors and messages.
 * It's ideal for displaying during authentication flows, page transitions, or any loading state
 * that requires a more immersive and branded experience.
 * Note: Animations and backdrop-filter are automatically disabled within Storybook for performance reasons.
 */
const meta: Meta<typeof AuthLoadingScreen> = {
  title: 'UI/Screens/Auth Loading',
  component: AuthLoadingScreen,
  tags: ['autodocs'],
  parameters: {
    // Use 'padded' layout to provide breathing room and work well with the height decorator
    layout: 'padded',
    docs: {
      description: {
        component:
          'A stylized, customizable loading screen for authentication transitions with a terminal-like interface. Animations and backdrop-filter are disabled in Storybook view.',
      },
    },
  },
  argTypes: {
    message: {
      description: 'Primary message displayed as a title',
      control: 'text',
    },
    subMessage: {
      description: 'Secondary message displayed below the status line',
      control: 'text',
    },
    statusMessage: {
      description: 'Status line message displayed with animation (disabled in Storybook)',
      control: 'text',
    },
    footerMessage: {
      description: 'Footer message displayed at the bottom',
      control: 'text',
    },
    primaryColor: {
      description: 'Primary accent color (default: #00ff87 - neon green)',
      control: 'color',
    },
    secondaryColor: {
      description: 'Secondary accent color (default: #3b8eea - electric blue)',
      control: 'color',
    },
    textColor: {
      description: 'Text color (default: #ffffff - white)',
      control: 'color',
    },
    background: {
      description: 'Background for the entire screen',
      control: 'text',
    },
    cardBackground: {
      description: 'Card background color',
      control: 'text',
    },
    className: {
      description: 'Additional CSS class names',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuthLoadingScreen>;

// Decorator to constrain the component's height in Storybook.
// This prevents the component's `min-h-screen` from expanding indefinitely
// within the Storybook canvas, especially when combined with flex centering.
const withFixedHeight = (Story: () => React.ReactElement) => (
  // Apply a fixed height and hide overflow. Adjust height as needed.
  <div style={{ height: '500px', overflow: 'hidden' }}>
    <Story />
  </div>
);

/**
 * Default configuration of the AuthLoadingScreen with standard messages.
 */
export const Default: Story = {
  args: {
    message: 'Verifying Authentication',
    subMessage: 'Please wait while we verify your credentials',
    statusMessage: 'System access verification in progress...',
    footerMessage: 'SECURE CONNECTION ESTABLISHED',
    // Explicitly set background for clarity in Storybook, avoiding CSS variable dependency
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)',
    cardBackground: 'rgba(27, 43, 52, 0.7)', // Default value explicit
    primaryColor: '#00ff87', // Default value explicit
    secondaryColor: '#3b8eea', // Default value explicit
    textColor: '#ffffff', // Default value explicit
  },
  decorators: [withFixedHeight],
};

/**
 * Shows the loading screen with custom messages for a login process.
 */
export const Login: Story = {
  args: {
    ...Default.args, // Start with default args
    message: 'Authenticating User',
    subMessage: 'Establishing secure connection to server',
    statusMessage: 'Processing login credentials...',
    footerMessage: 'DATA TRANSFER ENCRYPTED',
  },
  decorators: [withFixedHeight],
};

/**
 * Shows the loading screen with custom messages for a dashboard access scenario.
 */
export const DashboardAccess: Story = {
  args: {
    ...Default.args, // Start with default args
    message: 'Accessing Dashboard',
    subMessage: 'Verifying security credentials and loading user data',
    statusMessage: 'Retrieving repository analytics...',
    footerMessage: 'INITIALIZING DATA VISUALIZATION',
  },
  decorators: [withFixedHeight],
};

/**
 * Demonstrates alternate color theme using a purple/cyan color scheme.
 */
export const AlternateColors: Story = {
  args: {
    ...Default.args, // Start with default args
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
    ...Default.args, // Start with default args
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
      ...Default.args, // Start with default args
      footerMessage: '', // Explicitly empty footer
    },
    decorators: [withFixedHeight],
  };

```

**Summary of Changes:**

1.  **`AuthLoadingScreen.tsx`:**
    *   Added `isStorybook` constant using `process.env.STORYBOOK === 'true'`.
    *   Conditionally applied `backdrop-filter: 'blur(10px)'` only if `!isStorybook`.
    *   Conditionally applied `animate-spin` and `animate-pulse` classes only if `!isStorybook`.
2.  **`AuthLoadingScreen.types.ts`:** (New file)
    *   Extracted the `AuthLoadingScreenProps` interface into its own file for better organization. Updated the component and stories file to import from here.
3.  **`AuthLoadingScreen.stories.tsx`:**
    *   Updated component description to mention that animations/backdrop-filter are disabled in Storybook.
    *   Set `parameters.layout` to `'padded'` for better canvas presentation.
    *   Refined the comment for the `withFixedHeight` decorator.
    *   Ensured all stories explicitly define necessary args (like background, colors, cardBackground) or spread default args (`...Default.args`) for consistency and robustness against potential CSS variable issues in Storybook.
    *   Added a `NoFooter` story variant.

These changes should resolve the Storybook freezing issue by disabling the most performance-intensive features specifically within that environment, making the stories functional and usable for development and documentation.