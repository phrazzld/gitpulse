import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ModeSelector, { ActivityMode, ModeOption } from './ModeSelector';

const meta = {
  title: 'Atoms/ModeSelector/Accessibility Examples',
  component: ModeSelector,
  parameters: {
    docs: {
      description: {
        component: 'Accessibility-focused examples demonstrating proper radio group implementation, keyboard navigation, and screen reader support for the ModeSelector component.',
      },
    },
  },
} satisfies Meta<typeof ModeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Radio groups must have proper labeling for screen reader users.
 * This example shows how aria-label provides an accessible name for the group.
 */
export const AriaLabelExample: Story = {
  args: {
    selectedMode: 'my-activity' as ActivityMode,
    onChange: () => {},
  },
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Accessible Radio Group Labeling</h3>
      <ModeSelector
        {...args}
        ariaLabel="Choose activity view mode"
        onChange={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Radio groups require accessible names. Use `aria-label` when no visible label exists, or `aria-labelledby` to reference a visible heading.',
      },
    },
  },
};

/**
 * This example demonstrates the proper keyboard navigation pattern for radio groups.
 * Focus moves into the group on the selected item, then arrow keys change selection.
 */
export const KeyboardNavigationExample: Story = {
  args: {
    selectedMode: 'my-activity' as ActivityMode,
    onChange: () => {},
  },
  render: () => {
    const [selectedMode, setSelectedMode] = useState<ActivityMode>('my-activity');
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Keyboard Navigation Pattern</h3>
        <div className="text-sm text-gray-400 space-y-1">
          <p><kbd>Tab</kbd> - Enter radio group (focuses selected option)</p>
          <p><kbd>↑↓</kbd> / <kbd>←→</kbd> - Navigate and select options</p>
          <p><kbd>Space</kbd> - Alternative selection method</p>
        </div>
        <ModeSelector
          selectedMode={selectedMode}
          onChange={setSelectedMode}
          ariaLabel="Activity mode selection with keyboard navigation"
        />
        <p className="text-sm">
          Selected: <strong>{selectedMode}</strong>
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Radio groups use arrow keys for navigation between options. Tab only enters/exits the group. This follows standard radio group interaction patterns.',
      },
    },
  },
};

/**
 * Custom radio group with enhanced accessibility features including
 * detailed descriptions and proper grouping.
 */
export const DetailedDescriptionsExample: Story = {
  args: {
    selectedMode: 'my-activity' as ActivityMode,
    onChange: () => {},
  },
  render: () => {
    const [selectedMode, setSelectedMode] = useState<ActivityMode>('my-activity');
    
    const accessibilityModes: ModeOption[] = [
      {
        id: 'my-activity',
        label: 'Personal View',
        description: 'Shows only your personal commits and contributions. Ideal for individual productivity tracking.'
      },
      {
        id: 'my-work-activity',
        label: 'Work View',
        description: 'Displays work-related commits and professional projects. Filters out personal hobby projects.'
      },
      {
        id: 'team-activity',
        label: 'Team View',
        description: 'Shows collaborative work and team contributions. Includes all team members\' activity.'
      }
    ];
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Enhanced Descriptions for Screen Readers</h3>
        <ModeSelector
          selectedMode={selectedMode}
          onChange={setSelectedMode}
          modes={accessibilityModes}
          ariaLabel="Select activity view mode with detailed descriptions"
        />
        <div className="text-sm text-gray-400">
          <p>Screen readers will announce both the label and description for each option.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Detailed descriptions help screen reader users understand the purpose of each option. Both label and description are announced when navigating.',
      },
    },
  },
};

/**
 * This example shows how disabled state is properly communicated to assistive technologies.
 */
export const DisabledStateExample: Story = {
  args: {
    selectedMode: 'my-activity' as ActivityMode,
    onChange: () => {},
  },
  render: () => {
    const [isDisabled, setIsDisabled] = useState(true);
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Disabled State Communication</h3>
        <button 
          onClick={() => setIsDisabled(!isDisabled)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          {isDisabled ? 'Enable' : 'Disable'} Mode Selector
        </button>
        <ModeSelector
          selectedMode="my-activity"
          onChange={() => {}}
          disabled={isDisabled}
          ariaLabel="Mode selector with disabled state example"
        />
        <div className="text-sm text-gray-400">
          <p>When disabled:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Component cannot receive focus</li>
            <li>Screen readers announce &ldquo;disabled&rdquo;</li>
            <li>Visual styling indicates unavailable state</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled radio groups use `aria-disabled="true"` and remove the component from the tab order. The disabled state is both visually and programmatically indicated.',
      },
    },
  },
};

/**
 * This example demonstrates how to properly associate a visible label with the radio group.
 */
export const VisibleLabelExample: Story = {
  args: {
    selectedMode: 'my-activity' as ActivityMode,
    onChange: () => {},
  },
  render: () => {
    const [selectedMode, setSelectedMode] = useState<ActivityMode>('my-activity');
    
    return (
      <div className="space-y-4">
        <h3 id="visible-label-example" className="text-lg font-semibold">
          Activity Analysis Mode
        </h3>
        <p className="text-sm text-gray-400">
          Choose how you want to view and analyze your GitHub activity data:
        </p>
        <ModeSelector
          selectedMode={selectedMode}
          onChange={setSelectedMode}
          ariaLabel="Activity analysis mode selection" // Still include aria-label as backup
        />
        <div className="text-sm text-gray-400">
          <p>Best practice: Use aria-labelledby to reference visible headings when available.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'When a visible label exists, use `aria-labelledby` to reference it. This creates a stronger association than `aria-label` alone.',
      },
    },
  },
};

/**
 * This example shows how selection state changes are announced to screen readers.
 */
export const StateAnnouncementExample: Story = {
  args: {
    selectedMode: 'my-activity' as ActivityMode,
    onChange: () => {},
  },
  render: () => {
    const [selectedMode, setSelectedMode] = useState<ActivityMode>('my-activity');
    const [lastChange, setLastChange] = useState<string>('');
    
    const handleChange = (newMode: ActivityMode) => {
      setSelectedMode(newMode);
      setLastChange(`Changed to: ${newMode}`);
    };
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">State Change Announcements</h3>
        <ModeSelector
          selectedMode={selectedMode}
          onChange={handleChange}
          ariaLabel="Mode selector with state change announcements"
        />
        <div 
          aria-live="polite" 
          aria-atomic="true"
          className="text-sm text-green-400 min-h-[1.5rem]"
        >
          {lastChange}
        </div>
        <div className="text-sm text-gray-400">
          <p>Screen readers announce selection changes automatically through radio group semantics.</p>
          <p>Additional live region above provides visual feedback that&apos;s also announced.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Radio groups automatically announce state changes. You can supplement this with live regions for additional feedback, but avoid redundant announcements.',
      },
    },
  },
};