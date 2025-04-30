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
  title: 'UI/Buttons/Load More Button',
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
    className: { 
      description: 'Additional CSS class names',
      control: 'text' 
    }
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A button component for loading more items in paginated lists with loading and empty states.'
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
    className: ''
  }
};

/**
 * Loading state of the button - shows spinner and is disabled.
 */
export const Loading: Story = {
  args: {
    loading: true,
    hasMore: true,
    className: ''
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
    className: ''
  },
  decorators: [
    (Story) => (
      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex justify-center items-center min-h-[100px] w-full">
        <div className="text-gray-400">Button not rendered when hasMore is false</div>
        <Story />
      </div>
    )
  ]
};