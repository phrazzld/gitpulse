import type { Meta, StoryObj } from '@storybook/react';

// Temporary test story to verify accessibility hook
// This should be deleted after testing

const meta = {
  title: 'Testing/A11yHookTest',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// This story has a critical accessibility violation
export const CriticalViolation: Story = {
  render: () => (
    <div>
      <h1>Test A11y Hook</h1>
      {/* Deliberate critical violation: image without alt text */}
      <img src="/test-hook.jpg" width="200" height="150" />
      <p>This story should fail the pre-commit hook.</p>
    </div>
  ),
};