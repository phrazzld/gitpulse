import type { Meta, StoryObj } from '@storybook/react';
import AuthLoadingScreen from './AuthLoadingScreen';

/**
 * AuthLoadingScreen stories showcase a stylized loading screen for authentication transitions.
 * 
 * The component features a terminal-like interface with configurable colors and messages.
 * It's ideal for displaying during authentication flows, page transitions, or any loading state
 * that requires a more immersive and branded experience.
 */
const meta: Meta<typeof AuthLoadingScreen> = {
  title: 'UI/Screens/Auth Loading',
  component: AuthLoadingScreen,
  tags: ['autodocs'],
  parameters: {
    // Removed 'fullscreen' layout to prevent conflicts with component's min-h-screen
    docs: {
      description: {
        component: 'A stylized, customizable loading screen for authentication transitions with a terminal-like interface.\n\n' +
                   '**Performance Note:** This component uses CSS animations and backdrop filters that can be performance-intensive. ' +
                   'For this reason, animations are disabled by default in Storybook (via the `disableEffects` prop) but are enabled in the actual application. ' +
                   'The WithEffects story demonstrates how the component looks with all animations enabled, but it may cause performance issues.'
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
    },
    disableEffects: {
      description: 'Disable animations and performance-intensive effects',
      control: 'boolean',
      defaultValue: true
    }
  }
};

export default meta;
type Story = StoryObj<typeof AuthLoadingScreen>;

// Add a decorator to constrain the component's height in Storybook
// This prevents the component from taking over the entire viewport
const withFixedHeight = (Story: any) => (
  <div style={{ 
    height: '500px', 
    overflow: 'auto', // Changed from 'hidden' to 'auto'
    position: 'relative',
    border: '1px solid #333' // Visual indicator of boundaries
  }}>
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
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)',
    // Disable effects to prevent freeze in Storybook
    disableEffects: true
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
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)',
    disableEffects: true
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
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)',
    disableEffects: true
  },
  decorators: [withFixedHeight]
};

/**
 * Demonstrates alternate color theme using a purple/cyan color scheme.
 * The backdrop filter has been disabled for better performance.
 */
export const AlternateColors: Story = {
  args: {
    message: 'Loading Resources',
    subMessage: 'Please wait while we set up your environment',
    statusMessage: 'Initializing connection...',
    footerMessage: 'RESOURCE ALLOCATION IN PROGRESS',
    primaryColor: '#a855f7', // Purple
    secondaryColor: '#06b6d4', // Cyan
    background: 'linear-gradient(135deg, #121212 0%, #1b2b34 100%)',
    disableEffects: true
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
    cardBackground: 'rgba(25, 25, 25, 0.8)',
    disableEffects: true
  },
  decorators: [withFixedHeight]
};

/**
 * Demonstrates the component with all animations and effects enabled.
 * WARNING: May cause performance issues in Storybook.
 */
export const WithEffects: Story = {
  args: {
    message: 'Full Effects Demo',
    subMessage: 'All animations and effects are enabled in this story',
    statusMessage: 'Warning: May impact performance...',
    footerMessage: 'USE WITH CAUTION',
    primaryColor: '#ff3d00', // Warning orange
    secondaryColor: '#ffc107', // Amber
    background: 'linear-gradient(135deg, #121212 0%, #300a0a 100%)',
    disableEffects: false
  },
  decorators: [withFixedHeight],
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates the component with all visual effects enabled. **Warning:** This may cause performance issues in Storybook.'
      }
    }
  }
};