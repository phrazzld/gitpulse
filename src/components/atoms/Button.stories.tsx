import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';
import React from 'react';

/**
 * Button stories showcase a reusable button component that follows atomic design principles.
 * 
 * Features:
 * - Multiple visual variants (primary, secondary, outline)
 * - Different sizes (small, medium, large)
 * - Support for loading state with spinner
 * - Disabled state
 * - Icon support (left and right)
 * - Accessibility features with proper ARIA attributes
 * - Customizable with className
 */
const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: 'Button content',
      control: 'text',
    },
    variant: {
      description: 'The visual style variant of the button',
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
    },
    size: {
      description: 'The size of the button',
      control: 'radio',
      options: ['small', 'medium', 'large'],
    },
    loading: {
      description: 'Whether the button is in a loading state',
      control: 'boolean',
    },
    disabled: {
      description: 'Whether the button is disabled',
      control: 'boolean',
    },
    onClick: {
      description: 'Function called when the button is clicked',
      action: 'clicked',
    },
    className: {
      description: 'Additional CSS classes to apply to the button',
      control: 'text',
    },
    type: {
      description: 'HTML button type attribute',
      control: 'radio',
      options: ['button', 'submit', 'reset'],
    },
    ariaLabel: {
      description: 'Optional aria-label for improved accessibility',
      control: 'text',
    },
    leftIcon: {
      description: 'Optional icon to display before the button text',
      control: { disable: true }, // Complex prop, disable direct control
    },
    rightIcon: {
      description: 'Optional icon to display after the button text',
      control: { disable: true }, // Complex prop, disable direct control
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A reusable button component that follows atomic design principles. Provides a consistent button interface throughout the application with support for different visual variants, sizes, states, and accessibility features.'
      }
    },
    a11y: {
      config: {
        rules: [
          {
            // Ensure proper contrast ratio
            id: 'color-contrast',
            enabled: true
          },
          {
            // Ensure proper ARIA roles
            id: 'button-name',
            enabled: true
          },
          {
            // Ensure interactive elements are keyboard accessible
            id: 'interactive-supports-focus',
            enabled: true
          }
        ]
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default button with primary variant (dark background, light text).
 * 
 * This is the standard, high-emphasis button style.
 */
export const Default: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default primary variant with standard medium size. This is the primary call-to-action button style.'
      }
    }
  }
};

/**
 * Secondary button variant with medium emphasis.
 * 
 * This button has a lighter background and dark text, suitable for secondary actions.
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'medium',
    disabled: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary variant with a lighter background and dark text. Use for medium-emphasis actions that don\'t require the primary visual weight.'
      }
    }
  }
};

/**
 * Outline button variant with low emphasis.
 * 
 * This button has a transparent background with a visible border.
 */
export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
    size: 'medium',
    disabled: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Outline variant with transparent background and border. Use for low-emphasis actions or in contexts where a subtle button is needed.'
      }
    }
  }
};

/**
 * Small size button for compact spaces.
 */
export const Small: Story = {
  args: {
    children: 'Small Button',
    variant: 'primary',
    size: 'small',
    disabled: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Small size variant for compact UI areas or secondary actions. Uses less space while maintaining touch target size.'
      }
    }
  }
};

/**
 * Large size button for high visibility or touch-friendly interfaces.
 */
export const Large: Story = {
  args: {
    children: 'Large Button',
    variant: 'primary',
    size: 'large',
    disabled: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Large size variant for primary actions, touch-friendly interfaces, or when you need to draw attention to a specific action.'
      }
    }
  }
};

/**
 * Button in loading state, showing a spinner and disabled.
 */
export const Loading: Story = {
  args: {
    children: 'Loading',
    variant: 'primary',
    size: 'medium',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button in loading state displays a spinner and is automatically disabled. The spinner adapts to the button\'s color scheme.'
      }
    }
  }
};

/**
 * Disabled button that cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'primary',
    size: 'medium',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled button state. The button cannot be clicked and appears visually disabled. This state is automatically applied during loading.'
      }
    }
  }
};

/**
 * Simple SVG icon components for demonstration purposes
 */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 3.33334L12.6667 8.00001L8 12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Button with an icon on the left side.
 */
export const WithLeftIcon: Story = {
  args: {
    children: 'Button with Left Icon',
    variant: 'primary',
    size: 'medium',
    leftIcon: <CheckIcon />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with an icon displayed to the left of the text. Use icons to enhance visual communication and make actions more recognizable.'
      }
    }
  }
};

/**
 * Button with an icon on the right side.
 */
export const WithRightIcon: Story = {
  args: {
    children: 'Button with Right Icon',
    variant: 'primary',
    size: 'medium',
    rightIcon: <ArrowRightIcon />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with an icon displayed to the right of the text. Right-aligned icons often indicate direction or progression to another state.'
      }
    }
  }
};

/**
 * Button with both left and right icons.
 */
export const WithBothIcons: Story = {
  args: {
    children: 'Button with Both Icons',
    variant: 'primary',
    size: 'medium',
    leftIcon: <CheckIcon />,
    rightIcon: <ArrowRightIcon />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with icons on both sides. Use sparingly as this pattern can create visual clutter.'
      }
    }
  }
};

/**
 * Button with additional custom class applied.
 */
export const WithCustomClass: Story = {
  args: {
    children: 'Custom Class Button',
    variant: 'primary',
    size: 'medium',
    className: 'shadow-lg rounded-full',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with additional custom classes applied. The className prop allows for customization while keeping the core button behaviors.'
      }
    }
  }
};

/**
 * Submit type button for forms.
 */
export const SubmitButton: Story = {
  args: {
    children: 'Submit Form',
    variant: 'primary',
    size: 'medium',
    type: 'submit',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with type="submit" for use in forms. This will trigger form submission when clicked.'
      }
    }
  }
};

/**
 * Button with aria-label for accessibility.
 */
export const WithAriaLabel: Story = {
  args: {
    children: 'Close',
    variant: 'outline',
    size: 'small',
    ariaLabel: 'Close dialog',
    leftIcon: <span aria-hidden="true">×</span>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with an aria-label for improved accessibility. This is especially useful when the button text alone may not clearly describe its action.'
      }
    }
  }
};

/**
 * Button with interaction demonstration.
 * 
 * This story demonstrates how the Button component handles click events.
 */
export const WithInteraction: Story = {
  args: {
    children: 'Click Me',
    variant: 'primary',
    size: 'medium',
  },
  play: async ({ canvasElement, args }) => {
    // This would use @storybook/interaction add-on to demonstrate
    // button click interactions, but we're just defining the template here
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates the Button component\'s click interaction. When clicked, an action is logged in the Actions panel.'
      }
    }
  }
};