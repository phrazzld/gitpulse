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
 * - Keyboard navigation
 */
const meta: Meta<typeof ModeSelector> = {
  title: 'Atoms/ModeSelector',
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
        component: `A radio group component for selecting between different activity modes with customizable appearance and accessibility features.

## Accessibility Features

The ModeSelector implements a fully accessible radio group pattern with comprehensive keyboard and screen reader support:

### Purpose & User Impact
The ModeSelector allows users to choose between different activity modes that affect how data is displayed. For users relying on keyboards or assistive technologies, proper radio group implementation ensures they can navigate options efficiently and understand the current selection. Poor implementation can make mode selection confusing or impossible for assistive technology users.

### Keyboard Interaction

| Key | Action | Notes |
|-----|--------|-------|
| \`Tab\` | Moves focus into/out of the radio group | Only the selected radio receives initial focus |
| \`Shift + Tab\` | Moves focus out of the radio group | Standard reverse tab behavior |
| \`Arrow Up\` / \`Arrow Down\` | Navigate between radio options | Moves selection and focus |
| \`Arrow Left\` / \`Arrow Right\` | Navigate between radio options | Alternative navigation method |
| \`Space\` | Selects the focused radio option | Standard radio selection |

### Screen Reader Support

- **Group Labeling**: Uses \`role="radiogroup"\` with \`aria-label\` or \`aria-labelledby\`
- **Radio Identification**: Each option uses \`role="radio"\` with \`aria-checked\`
- **State Announcements**: Screen readers announce "selected" or "not selected" for each option
- **Group Navigation**: Announces entering/leaving radio group
- **Option Details**: Label and description are both announced

### ARIA Implementation

| Attribute | When Used | Purpose |
|-----------|-----------|---------|
| \`role="radiogroup"\` | On container | Identifies the group of radio options |
| \`aria-label\` | On container | Provides group label when no visible label exists |
| \`aria-labelledby\` | On container | Associates group with visible label |
| \`role="radio"\` | On each option | Identifies individual radio buttons |
| \`aria-checked\` | On each option | Indicates selection state |
| \`aria-disabled\` | When disabled | Communicates disabled state |

### Color Contrast

- **Text Contrast**: All text meets WCAG AA 4.5:1 ratio requirements
- **Selection Indicators**: Selected state meets 3:1 contrast minimum
- **Focus Indicators**: Focus ring has 3:1 contrast against adjacent colors
- **Custom Colors**: Theme validation ensures contrast compliance

### Focus Management

1. **Initial Focus**: First Tab enters on selected radio
2. **Arrow Navigation**: Moves both focus and selection together
3. **Visual Focus**: Clear focus indicators on focused option
4. **Focus Restoration**: Maintains logical focus order in parent components
        `
      }
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'aria-valid-attr-value',
            enabled: true
          },
          {
            id: 'interactive-supports-focus',
            enabled: true
          },
          {
            id: 'aria-allowed-attr',
            enabled: true
          },
          {
            id: 'aria-required-children',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          }
        ]
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof ModeSelector>;

/**
 * Default state of the ModeSelector with the "my-activity" mode selected.
 * 
 * Keyboard navigation:
 * - Use Tab to focus the component
 * - Use Arrow keys to navigate between options
 * - Use Space or Enter to select an option
 */
export const Default: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: `**Default State**: Demonstrates the radio group with "my-activity" selected. 

**Accessibility Testing**:
- Use Tab to focus the radio group (focus goes to selected option)
- Use Arrow keys to navigate between options and change selection
- Verify screen reader announces "radiogroup" and current selection
- Check that each option is announced with its label and description

**Keyboard Navigation**: Tab → Arrow keys → Space (alternative selection method)`
      }
    }
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
 * The component visually indicates its disabled state and is properly
 * marked with aria-disabled attribute.
 */
export const Disabled: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: `**Disabled State**: Shows how the component behaves when disabled.

**Accessibility Features**:
- Uses \`aria-disabled="true"\` on the radiogroup
- Visual styling indicates disabled state
- Component is not focusable when disabled
- Screen readers announce "disabled" when encountering the group

**Testing**: 
- Verify component cannot receive focus via Tab
- Check that disabled state is announced by screen readers
- Ensure visual indicators clearly show disabled state`
      }
    }
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
 * These colors have been selected to maintain proper contrast ratios
 * for accessibility.
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
        story: 'This example demonstrates how to customize the component\'s appearance with different colors while maintaining accessibility standards.'
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
        story: 'This example shows how to customize the label for better accessibility and add CSS classes for styling.'
      }
    }
  }
};