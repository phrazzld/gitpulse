import type { Meta, StoryObj } from '@storybook/react';
import ModeSelector, { ActivityMode, DEFAULT_MODES, ModeOption } from './ModeSelector';

/**
 * ModeSelector stories showcase a radio group component for selecting between 
 * different activity modes (personal, work, team).
 * 
 * Features:
 * - Radio group selection UI
 * - Multiple modes with descriptions
 * - Customizable appearance through theming props
 * - Accessibility support with ARIA attributes
 * - Disabled state support
 */
const meta: Meta<typeof ModeSelector> = {
  title: 'UI/Selectors/Mode Selector',
  component: ModeSelector,
  tags: ['autodocs'],
  argTypes: {
    selectedMode: { 
      description: 'Currently selected mode',
      control: 'radio',
      options: ['my-activity', 'my-work-activity', 'team-activity'],
    },
    onChange: { 
      description: 'Callback fired when mode changes',
      action: 'mode changed' 
    },
    disabled: { 
      description: 'Whether the component is disabled',
      control: 'boolean' 
    },
    modes: { 
      description: 'Available modes to display (defaults to DEFAULT_MODES)',
      control: 'object'
    },
    ariaLabel: { 
      description: 'Accessibility label for the radio group',
      control: 'text' 
    },
    className: { 
      description: 'Additional CSS class names',
      control: 'text' 
    },
    accentColor: {
      description: 'Primary color for accents (selected items, indicators)',
      control: 'color'
    },
    secondaryColor: {
      description: 'Text color for descriptions',
      control: 'color'
    },
    textColor: {
      description: 'Main text color',
      control: 'color'
    },
    backgroundColor: {
      description: 'Background color for the container',
      control: 'color'
    },
    selectedBackgroundColor: {
      description: 'Background color for selected items',
      control: 'color'
    }
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'A radio group component for selecting between different activity modes with customizable appearance and accessibility features.'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof ModeSelector>;

/**
 * Default state of the ModeSelector with the "my-activity" mode selected.
 */
export const Default: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: false,
  }
};

/**
 * ModeSelector with "my-work-activity" mode selected.
 */
export const WorkModeSelected: Story = {
  args: {
    selectedMode: 'my-work-activity',
    disabled: false,
  }
};

/**
 * ModeSelector with "team-activity" mode selected.
 */
export const TeamModeSelected: Story = {
  args: {
    selectedMode: 'team-activity',
    disabled: false,
  }
};

/**
 * ModeSelector in disabled state - cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: true,
  }
};

/**
 * ModeSelector with custom modes (different from defaults).
 */
export const CustomModes: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: false,
    modes: [
      { 
        id: 'my-activity', 
        label: 'VIEW MODE', 
        description: 'View repository information only'
      },
      { 
        id: 'my-work-activity', 
        label: 'EDIT MODE', 
        description: 'Make changes to repositories'
      },
      { 
        id: 'team-activity', 
        label: 'ADMIN MODE', 
        description: 'Full administrative controls'
      },
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'This example shows how to provide custom modes with different labels and descriptions while maintaining the required ActivityMode types.'
      }
    }
  }
};

/**
 * ModeSelector with custom theme colors.
 */
export const CustomTheme: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: false,
    accentColor: '#FF5733',
    secondaryColor: '#C70039',
    textColor: '#ffffff',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    selectedBackgroundColor: 'rgba(255, 87, 51, 0.2)',
  },
  parameters: {
    docs: {
      description: {
        story: 'This example demonstrates how to customize the component\'s appearance with different colors.'
      }
    }
  }
};

/**
 * ModeSelector with a custom label and CSS class.
 */
export const CustomLabel: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: false,
    ariaLabel: 'Select View Mode',
    className: 'shadow-lg'
  },
  parameters: {
    docs: {
      description: {
        story: 'This example shows how to customize the label and add CSS classes.'
      }
    }
  }
};