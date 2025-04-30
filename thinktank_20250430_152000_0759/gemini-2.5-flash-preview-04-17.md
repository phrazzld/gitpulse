```typescript
// /Users/phaedrus/Development/gitpulse/src/components/ui/AuthLoadingScreen.tsx
'use client';

/**
 * Props for the AuthLoadingScreen component
 */
interface AuthLoadingScreenProps {
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

/**
 * A stylized loading screen for authentication transitions
 *
 * Features a terminal-like interface with configurable colors and messages.
 * Animations and backdrop filter are disabled in Storybook for performance.
 *
 * @example
 * ```tsx
 * <AuthLoadingScreen
 *   message="Verifying Authentication"
 *   subMessage="Please wait while we verify your credentials"
 * />
 * ```
 */
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
  className = ''
}: AuthLoadingScreenProps) {

  // Check if running in Storybook environment using standard env var
  // process.env.STORYBOOK is typically set to 'true' by Storybook's build process
  const isStorybook = typeof process !== 'undefined' && process.env.STORYBOOK === 'true';

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${className}`}
      style={{ background }}
    >
      <div
        className="card w-full max-w-md p-8 space-y-8 border-2 rounded-md"
        style={{
          backgroundColor: cardBackground,
          // Apply backdrop-filter only when NOT in Storybook
          ...(!isStorybook ? { backdropFilter: 'blur(10px)' } : {}),
          boxShadow: `0 0 20px ${primaryColor}33`,
          borderColor: primaryColor
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
                  backgroundColor: i === 0
                    ? primaryColor
                    : i === 1
                      ? secondaryColor
                      : textColor
                }}
              />
            ))}
          </div>
          <div className="h-px flex-grow" style={{ backgroundColor: secondaryColor }}></div>
        </div>

        <h2 className="text-xl text-center" style={{ color: primaryColor }}>{message}</h2>

        <div
          className="flex justify-center items-start space-x-4 p-4 border border-opacity-30 rounded-md"
          style={{
            borderColor: secondaryColor,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ color: secondaryColor }}>
            <svg
              // Disable spin animation in Storybook for performance
              className={!isStorybook ? "animate-spin h-8 w-8" : "h-8 w-8"}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="space-y-2 flex-1">
            <p
              // Disable pulse animation in Storybook for performance
              className={!isStorybook ? "text-sm animate-pulse" : "text-sm"}
              style={{ color: secondaryColor }}
            >
              &gt; {statusMessage}
            </p>
            <p className="text-xs" style={{ color: textColor }}>
              &gt; {subMessage}
            </p>
            <div className="flex space-x-1 text-xs mt-2" style={{ color: textColor }}>
              <span>&gt;</span>
              <span
                // Disable pulse animation in Storybook for performance
                className={!isStorybook ? "animate-pulse" : ""}
              >|</span>
            </div>
          </div>
        </div>

        {footerMessage && (
          <div className="text-center text-xs" style={{ color: textColor }}>
            <p>{footerMessage}</p>
            <div className="flex justify-center items-center mt-2">
              <div className="h-px w-8" style={{ backgroundColor: secondaryColor }}></div>
              <div className="px-2">•</div>
              <div className="h-px w-8" style={{ backgroundColor: secondaryColor }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

```typescript
// /Users/phaedrus/Development/gitpulse/src/components/ui/AuthLoadingScreen.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import AuthLoadingScreen from './AuthLoadingScreen';

/**
 * AuthLoadingScreen stories showcase a stylized loading screen for authentication transitions.
 *
 * The component features a terminal-like interface with configurable colors and messages.
 * It's ideal for displaying during authentication flows, page transitions, or any loading state
 * that requires a more immersive and branded experience.
 *
 * **Note:** Animations (spin, pulse) and the backdrop filter are disabled in Storybook stories
 * for performance reasons. The full effects are visible when used in the application.
 */
const meta: Meta<typeof AuthLoadingScreen> = {
  title: 'UI/Screens/Auth Loading',
  component: AuthLoadingScreen,
  tags: ['autodocs'],
  parameters: {
    // Removed 'fullscreen' layout to prevent conflicts with component's min-h-screen
    docs: {
      description: {
        component: 'A stylized, customizable loading screen for authentication transitions with a terminal-like interface.'
          + '\n\n**Note:** Animations (spin, pulse) and the backdrop filter are disabled in Storybook stories for performance reasons. The full effects are visible when used in the application.'
      }
    }
  },
  argTypes: {
    message: {
      description: 'Primary message displayed as a title',
      control: 'text'
    },
    subMessage: {
      description: 'Secondary message displayed below the status line',
      control: 'text'
    },
    statusMessage: {
      description: 'Status line message displayed with animation',
      control: 'text'
    },
    footerMessage: {
      description: 'Footer message displayed at the bottom',
      control: 'text'
    },
    primaryColor: {
      description: 'Primary accent color (default: #00ff87 - neon green)',
      control: 'color'
    },
    secondaryColor: {
      description: 'Secondary accent color (default: #3b8eea - electric blue)',
      control: 'color'
    },
    textColor: {
      description: 'Text color (default: #ffffff - white)',
      control: 'color'
    },
    background: {
      description: 'Background for the entire screen',
      control: 'text'
    },
    cardBackground: {
      description: 'Card background color',
      control: 'text'
    },
    className: {
      description: 'Additional CSS class names',
      control: 'text'
    }
  }
};

export default meta;
type Story = StoryObj<typeof AuthLoadingScreen>;

// Add a decorator to constrain the component's height in Storybook
// This prevents the component from taking over the entire viewport
const withFixedHeight = (Story: any) => (
  // Use a flex container to ensure the component centers within the fixed height
  <div style={{ height: '500px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
    // Explicitly set background instead of using CSS variable
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)'
  },
  decorators: [withFixedHeight]
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
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)'
  },
  decorators: [withFixedHeight]
};

/**
 * Shows the loading screen with custom messages for a dashboard access scenario.
 */
export const DashboardAccess: Story = {
  args: {
    message: 'Accessing Dashboard',
    subMessage: 'Verifying security credentials and loading user data',
    statusMessage: 'Retrieving repository analytics...',
    footerMessage: 'INITIALIZING DATA VISUALIZATION',
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)'
  },
  decorators: [withFixedHeight]
};

/**
 * Demonstrates alternate color theme using a purple/cyan color scheme.
 */
export const AlternateColors: Story = {
  args: {
    message: 'Loading Resources',
    subMessage: 'Please wait while we set up your environment',
    statusMessage: 'Initializing connection...',
    footerMessage: 'RESOURCE ALLOCATION IN PROGRESS',
    primaryColor: '#a855f7', // Purple
    secondaryColor: '#06b6d4', // Cyan
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)'
  },
  decorators: [withFixedHeight]
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
    cardBackground: 'rgba(25, 25, 25, 0.8)'
  },
  decorators: [withFixedHeight]
};
```