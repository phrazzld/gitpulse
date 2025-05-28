import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';
// Simple icon components for demonstration
const ChevronDownIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className={className} {...props}>
    <path d="M4.5 6L8 9.5L11.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const CloseIcon = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} style={{ fontSize: '20px', lineHeight: 1 }}>×</span>
);

const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M13 0H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM6 2h4v4H6V2zm7 12H3V2h1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2h1v12z" />
  </svg>
);

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M5.5 5.5A.5.5 0 0 1 6 5h1v7a.5.5 0 0 1-1 0V5zm3.5 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0V5z" />
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4 4h8v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4z" />
  </svg>
);

const BoldIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z" />
  </svg>
);

const ItalicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M7.991 11.674L9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z" />
  </svg>
);

const UnderlineIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136z" />
    <path fillRule="evenodd" d="M12.5 15h-9v-1h9v1z" />
  </svg>
);

const meta = {
  title: 'Atoms/Button/Accessibility Examples',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Accessibility-focused examples demonstrating proper ARIA usage, keyboard interaction, and screen reader support for the Button component.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Icon-only buttons must have an aria-label to be accessible to screen reader users.
 * The icon itself should be marked with aria-hidden since it's decorative.
 */
export const IconOnlyButton: Story = {
  args: {
    children: 'Button'
  },
  render: () => (
    <div className="flex gap-4">
      <Button
        variant="outline"
        size="small"
        aria-label="Close dialog"
      >
        <CloseIcon aria-hidden="true" />
      </Button>
      
      <Button
        variant="outline"
        size="small"
        aria-label="Delete item"
      >
        <TrashIcon aria-hidden="true" />
      </Button>
      
      <Button
        variant="primary"
        size="small"
        aria-label="Save changes"
      >
        <SaveIcon aria-hidden="true" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons require `aria-label` to provide context for screen reader users. The icon should have `aria-hidden="true"` since it is purely decorative.',
      },
    },
  },
};

/**
 * Toggle buttons use aria-pressed to indicate their on/off state.
 * Screen readers will announce "pressed" or "not pressed" accordingly.
 */
export const ToggleButton: Story = {
  args: {
    children: 'Button'
  },
  render: () => {
    const [isPressed, setIsPressed] = useState(false);
    
    return (
      <Button
        variant="outline"
        aria-pressed={isPressed}
        onClick={() => setIsPressed(!isPressed)}
      >
        {isPressed ? 'Notifications On' : 'Notifications Off'}
      </Button>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle buttons use `aria-pressed` to communicate their state. Screen readers announce "toggle button, pressed" or "toggle button, not pressed".',
      },
    },
  },
};

/**
 * Buttons that control expandable content use aria-expanded and aria-controls.
 * This pattern is common for accordions, dropdown menus, and collapsible sections.
 */
export const ExpandableContentButton: Story = {
  args: {
    children: 'Button'
  },
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div>
        <Button
          variant="outline"
          aria-expanded={isExpanded}
          aria-controls="details-panel"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Show Details</span>
          <ChevronDownIcon 
            aria-hidden="true" 
            className={`ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>
        
        <div 
          id="details-panel" 
          hidden={!isExpanded}
          className="mt-4 p-4 border rounded"
        >
          <p>This content is controlled by the button above.</p>
          <p>The button&apos;s aria-expanded state reflects whether this panel is visible.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Buttons controlling expandable content use `aria-expanded` to indicate state and `aria-controls` to establish the relationship with the controlled element.',
      },
    },
  },
};

/**
 * Loading buttons should communicate their busy state to assistive technologies.
 * The aria-busy attribute tells screen readers that the button is processing.
 */
export const LoadingStateButton: Story = {
  args: {
    children: 'Button'
  },
  render: () => {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 3000);
    };
    
    return (
      <Button
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span 
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" 
              aria-label="Loading" 
            />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading buttons use `aria-busy="true"` to indicate processing state. The button should be disabled during loading to prevent multiple submissions.',
      },
    },
  },
};

/**
 * Button groups should be wrapped in a container with role="group" and an aria-label.
 * This helps screen reader users understand that the buttons are related.
 */
export const ButtonGroup: Story = {
  args: {
    children: 'Button'
  },
  render: () => {
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);
    
    return (
      <div role="group" aria-label="Text formatting options">
        <Button
          variant="outline"
          size="small"
          aria-pressed={bold}
          aria-label="Bold"
          onClick={() => setBold(!bold)}
        >
          <BoldIcon aria-hidden="true" />
        </Button>
        
        <Button
          variant="outline"
          size="small"
          aria-pressed={italic}
          aria-label="Italic"
          onClick={() => setItalic(!italic)}
        >
          <ItalicIcon aria-hidden="true" />
        </Button>
        
        <Button
          variant="outline"
          size="small"
          aria-pressed={underline}
          aria-label="Underline"
          onClick={() => setUnderline(!underline)}
        >
          <UnderlineIcon aria-hidden="true" />
        </Button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Related buttons should be grouped with `role="group"` and `aria-label` to provide context. Each button in the group maintains its own state and label.',
      },
    },
  },
};

/**
 * Buttons with additional context can use aria-describedby to associate
 * help text or warnings with the button.
 */
export const ButtonWithDescription: Story = {
  args: {
    children: 'Button'
  },
  render: () => (
    <div className="space-y-4">
      <div>
        <Button
          variant="primary" className="bg-red-600 hover:bg-red-700"
          aria-describedby="delete-warning"
        >
          Delete Account
        </Button>
        <p id="delete-warning" className="text-sm text-red-600 mt-2">
          Warning: This action cannot be undone. All your data will be permanently deleted.
        </p>
      </div>
      
      <div>
        <Button
          variant="primary"
          aria-describedby="submit-help"
        >
          Submit Application
        </Button>
        <p id="submit-help" className="text-sm text-gray-600 mt-2">
          All fields must be completed before submission. You can save as draft to continue later.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `aria-describedby` to associate additional context, warnings, or help text with a button. Screen readers will announce this text after the button label.',
      },
    },
  },
};

/**
 * Demonstrate keyboard navigation through buttons.
 * All buttons should be reachable via Tab and activated with Space or Enter.
 */
export const KeyboardNavigation: Story = {
  args: {
    children: 'Button'
  },
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Try navigating with your keyboard:
        <br />• Tab: Move between buttons
        <br />• Space/Enter: Activate focused button
        <br />• Shift+Tab: Move backwards
      </p>
      
      <div className="flex gap-4">
        <Button variant="primary">First</Button>
        <Button variant="secondary">Second</Button>
        <Button variant="outline">Third</Button>
        <Button variant="outline">Fourth</Button>
      </div>
      
      <p className="text-sm text-gray-600">
        Notice the clear focus indicator (blue outline) that shows which button is currently focused.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All buttons are keyboard accessible by default. They appear in the tab order and show clear focus indicators.',
      },
    },
  },
};

/**
 * Screen reader announcements for different button states.
 * This example shows what screen readers announce for various button configurations.
 */
export const ScreenReaderAnnouncements: Story = {
  args: {
    children: 'Button'
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">What Screen Readers Announce:</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button>Save</Button>
            <span className="text-sm text-gray-600">→ &quot;Save, button&quot;</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button disabled>Submit</Button>
            <span className="text-sm text-gray-600">→ &quot;Submit, button, unavailable&quot;</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button aria-pressed={true}>Bold</Button>
            <span className="text-sm text-gray-600">→ &quot;Bold, toggle button, pressed&quot;</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="small" 
              aria-label="Close dialog"
            >
              <CloseIcon aria-hidden="true" />
            </Button>
            <span className="text-sm text-gray-600">→ &quot;Close dialog, button&quot;</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button aria-busy="true" disabled>
              Processing...
            </Button>
            <span className="text-sm text-gray-600">→ &quot;Processing, button, busy&quot;</span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'This demonstrates what screen readers announce for different button states and configurations. Proper ARIA attributes ensure users understand the button purpose and state.',
      },
    },
  },
};