import type { Meta, StoryObj } from '@storybook/react';
import LoadMoreButton from './LoadMoreButton';

/**
 * LoadMoreButton stories showcase a button component for loading more items in paginated lists.
 * 
 * This component has three main states:
 * - Default: Interactive button showing "LOAD MORE" text
 * - Loading: Disabled button showing loading spinner
 * - Hidden: Not rendered when there are no more items to load
 */
const meta: Meta<typeof LoadMoreButton> = {
  title: 'Atoms/LoadMoreButton',
  component: LoadMoreButton,
  tags: ['autodocs'],
  argTypes: {
    onClick: { 
      description: 'Function called when the button is clicked',
      action: 'clicked' 
    },
    loading: { 
      description: 'Whether the button is in loading state',
      control: 'boolean' 
    },
    hasMore: { 
      description: 'Whether there are more items to load (button is not rendered when false)',
      control: 'boolean' 
    },
    loadText: {
      description: 'Text to show in normal state',
      control: 'text'
    },
    loadingText: {
      description: 'Text to show in loading state',
      control: 'text'
    },
    className: { 
      description: 'Additional CSS class names',
      control: 'text' 
    }
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A button component for loading more items in paginated lists with loading and empty states.

## Accessibility Features

The LoadMoreButton is designed with comprehensive accessibility support:

### Purpose & User Impact
The LoadMoreButton enables users to load additional content in paginated interfaces. For users relying on keyboards or assistive technologies, proper state communication ensures they understand when content is loading and can effectively navigate the interface. Poor implementation can leave users uncertain about loading states or unable to access additional content.

### Keyboard Interaction

| Key | Action | Notes |
|-----|--------|-------|
| \`Tab\` | Moves focus to/from button | Button is included in tab order when visible |
| \`Enter\` | Activates load more action | Standard button behavior |
| \`Space\` | Activates load more action | Standard button behavior |

### Screen Reader Support

- **Loading State**: Uses \`aria-busy="true"\` to communicate loading status
- **State Changes**: Screen readers announce "busy" when loading begins
- **Content Updates**: Uses semantic HTML that announces content additions
- **Button Text**: Clear, descriptive text that explains the action

### ARIA Implementation

| Attribute | When Used | Purpose |
|-----------|-----------|---------|
| \`aria-busy\` | During loading state | Indicates button is processing |
| \`disabled\` | During loading state | Prevents multiple activations |

### Color Contrast

- **Text Contrast**: Meets WCAG AA 4.5:1 ratio for normal text
- **Loading State**: Maintains sufficient contrast even when disabled
- **Focus Indicators**: 3:1 contrast ratio for focus ring visibility

### State Communication

1. **Default State**: Button is focusable and actionable
2. **Loading State**: Button becomes disabled with \`aria-busy="true"\`
3. **No More Items**: Component is removed from DOM (not hidden) to prevent phantom focusable elements
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
            id: 'button-name',
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          },
          {
            id: 'aria-allowed-attr',
            enabled: true
          }
        ]
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof LoadMoreButton>;

/**
 * Default state of the LoadMoreButton - ready to load more items.
 */
export const Default: Story = {
  args: {
    loading: false,
    hasMore: true,
    loadText: 'LOAD MORE',
    loadingText: 'LOADING',
    className: ''
  },
  parameters: {
    docs: {
      description: {
        story: `**Default State**: The button is focusable and actionable. Screen readers announce "LOAD MORE button" and keyboard users can activate it with Enter or Space.

**Accessibility Testing**: Use Tab to focus the button and verify the focus indicator is visible. The button text should be clear and descriptive.`
      }
    }
  }
};

/**
 * Loading state of the button - shows spinner and is disabled.
 */
export const Loading: Story = {
  args: {
    loading: true,
    hasMore: true,
    loadText: 'LOAD MORE',
    loadingText: 'LOADING',
    className: ''
  },
  parameters: {
    docs: {
      description: {
        story: `**Loading State**: The button is disabled and uses \`aria-busy="true"\` to communicate the loading state. Screen readers announce "LOADING button, busy" to indicate processing is occurring.

**Accessibility Features**:
- Button is disabled to prevent multiple submissions
- \`aria-busy\` attribute communicates loading state to assistive technology
- Loading text clearly indicates current state
- Spinner is decorative and doesn't interfere with screen reader announcements

**Testing**: Verify that screen readers announce the busy state and that the button cannot be activated while loading.`
      }
    }
  }
};

/**
 * When there are no more items to load, the button isn't rendered.
 * This story wraps the component with a border to show where it would be.
 */
export const NoMoreItems: Story = {
  args: {
    loading: false,
    hasMore: false,
    loadText: 'LOAD MORE',
    loadingText: 'LOADING',
    className: ''
  },
  decorators: [
    (Story) => (
      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex justify-center items-center min-h-[100px] w-full">
        <div className="text-gray-400" aria-label="Empty state message">Button not rendered when hasMore is false</div>
        <Story />
      </div>
    )
  ],
  parameters: {
    docs: {
      description: {
        story: `**No More Items State**: When \`hasMore={false}\`, the button is completely removed from the DOM rather than hidden. This is crucial for accessibility as it prevents phantom focusable elements.

**Accessibility Benefits**:
- No phantom tab stops that confuse keyboard users
- Screen readers don't encounter invisible interactive elements
- Clean DOM structure without hidden elements
- Focus management is simplified in parent components

**Best Practice**: Removing elements from DOM rather than hiding them (\`display: none\` or \`visibility: hidden\`) is the preferred approach for load more patterns.

**Testing**: Use Tab to navigate through the interface and verify no phantom button receives focus.`
      }
    }
  }
};

/**
 * Button with custom text labels.
 */
export const CustomLabels: Story = {
  args: {
    loading: false,
    hasMore: true,
    loadText: 'SHOW MORE ITEMS',
    loadingText: 'FETCHING DATA',
    className: ''
  },
  parameters: {
    docs: {
      description: {
        story: `**Custom Labels**: Demonstrates how to customize button text for different contexts while maintaining accessibility.

**Text Guidelines**:
- Use clear, action-oriented language
- Keep text concise but descriptive
- Ensure loading text clearly indicates progress
- Consider internationalization when customizing labels

**Accessibility Considerations**:
- Custom text is announced by screen readers exactly as written
- Choose text that clearly describes the action being performed
- Avoid ambiguous terms like "More" without context

**Examples of Good Text**:
- "Show More Items" / "Loading More Items"
- "Load Next Page" / "Loading Page"
- "Expand Results" / "Loading Results"`
      }
    }
  }
};