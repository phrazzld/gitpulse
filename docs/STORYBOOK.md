# Storybook Usage Standards

This document defines the standards and best practices for using Storybook in the GitPulse project. It serves as a guide for developers when creating or updating component stories to ensure consistency across the codebase.

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. File Structure and Naming](#2-file-structure-and-naming)
- [3. Component Story Format (CSF3)](#3-component-story-format-csf3)
- [4. Story Hierarchy and Organization](#4-story-hierarchy-and-organization)
- [5. ArgTypes and Controls](#5-argtypes-and-controls)
- [6. Story Documentation](#6-story-documentation)
- [7. Component Isolation and Testing](#7-component-isolation-and-testing)
- [8. Accessibility (a11y)](#8-accessibility-a11y)
- [9. Component Variants and States](#9-component-variants-and-states)
- [10. Example Stories](#10-example-stories)

## 1. Introduction

Storybook is our primary tool for developing, documenting, and testing UI components in isolation. It enables a component-driven development workflow, improves collaboration between developers and designers, and serves as a living documentation of our UI components.

**Key Benefits:**
- Isolated component development
- Visual testing and documentation
- Accessibility testing
- Interactive development workflow
- Living component library

## 2. File Structure and Naming

### Story File Location

Story files **MUST** be co-located with their corresponding component files:

```
src/components/ui/
  ├── Button.tsx
  ├── Button.stories.tsx
  ├── ModeSelector.tsx
  ├── ModeSelector.stories.tsx
  └── ...
```

### File Naming Convention

Story files **MUST** follow this naming convention:

- Story files: `ComponentName.stories.tsx`
- Story name: PascalCase that represents the state or variant (e.g., `Default`, `Loading`, `Disabled`)

## 3. Component Story Format (CSF3)

All stories **MUST** use Component Story Format 3 (CSF3). This is the standard format supported by Storybook 7.0+.

### Basic Template

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import ComponentName from './ComponentName';

/**
 * Component description and key information
 */
const meta: Meta<typeof ComponentName> = {
  title: 'Category/Subcategory/Component Name',
  component: ComponentName,
  tags: ['autodocs'],
  argTypes: {
    // Property configurations
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

/**
 * Description of this specific story variant
 */
export const Default: Story = {
  args: {
    // Properties for this story variant
  },
};
```

### Story Exports

Each story export **MUST**:
- Use PascalCase naming
- Be accompanied by JSDoc comments explaining the story's purpose or the component state it represents
- Define the necessary `args` for the component state being showcased

## 4. Story Hierarchy and Organization

### Title Structure

Story titles **MUST** follow a hierarchical structure with slashes to represent the component's category and subcategory:

```typescript
title: 'Category/Subcategory/Component Name'
```

### Standard Categories

For consistency, use these primary categories:

- **UI**: Basic UI components (buttons, inputs, selectors, etc.)
  - Subcategories: Buttons, Inputs, Selectors, Cards, etc.
- **Features**: Feature-specific components
  - Subcategories: Dashboard, Auth, Activity, etc.
- **Layout**: Layout components (grid, container, etc.)
- **Feedback**: Feedback components (alerts, toasts, etc.)
- **Navigation**: Navigation components (navbar, tabs, etc.)
- **Data Display**: Data visualization components (tables, charts, etc.)

Example:
```typescript
title: 'UI/Buttons/Load More Button'
title: 'UI/Selectors/Mode Selector'
```

## 5. ArgTypes and Controls

### Defining Controls

Every component prop **MUST** have a corresponding entry in the `argTypes` object with:
- A clear description of the prop's purpose
- An appropriate control based on the prop's type
- Additional control configuration if needed (options, labels, etc.)

```typescript
argTypes: {
  onClick: { 
    description: 'Function called when the button is clicked',
    action: 'clicked' 
  },
  variant: { 
    description: 'The visual style of the button',
    control: 'select',
    options: ['primary', 'secondary', 'tertiary'],
  },
  size: { 
    description: 'The size of the button',
    control: 'radio',
    options: ['small', 'medium', 'large'],
  },
  disabled: { 
    description: 'Whether the button is disabled',
    control: 'boolean' 
  },
  children: { 
    description: 'The content to display inside the button',
    control: 'text' 
  },
}
```

### Action Handlers

For event handlers (like `onClick`, `onChange`), use Storybook actions:

```typescript
argTypes: {
  onClick: { 
    description: 'Function called when the button is clicked',
    action: 'clicked' 
  },
  onChange: { 
    description: 'Callback fired when value changes',
    action: 'changed' 
  }
}
```

### Default Args

Define default args for the component in the meta object:

```typescript
parameters: {
  docs: {
    description: {
      component: 'Component description that appears in the docs tab'
    }
  }
}
```

## 6. Story Documentation

### Component Documentation

Every component **MUST** have comprehensive TSDoc comments in the source file:
- Description of the component's purpose and usage
- Explanation of each prop
- Usage examples
- Default values

### Story Documentation

Each story (variant) **MUST** have JSDoc comments explaining:
- What the story represents
- Any special configuration or behavior
- Usage guidance if relevant

```typescript
/**
 * Disabled state of the button - cannot be interacted with.
 * The component visually indicates its disabled state and is properly
 * marked with aria-disabled attribute.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'The disabled state is visually indicated and properly communicated to assistive technologies.'
      }
    }
  }
};
```

## 7. Component Isolation and Testing

### Component Isolation

Components **MUST** be designed for isolation:
- Minimize external dependencies
- Receive all required data via props
- Use dependency injection for services/hooks
- Handle state internally or via explicit props

### Testing in Storybook

Stories serve as visual test cases. For each component, create stories that:
- Cover all significant states and variants
- Test edge cases (empty data, long content, errors)
- Demonstrate interactive behavior

### Using Decorators

Use decorators to set up context or specialized environments for stories:

```typescript
export const WithCustomTheme: Story = {
  args: {
    // Props for this story
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme="custom">
        <Story />
      </ThemeProvider>
    ),
  ],
};
```

## 8. Accessibility (a11y)

### a11y Addon Configuration

All stories **SHOULD** include accessibility validation configuration:

```typescript
parameters: {
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
          id: 'aria-valid-attr-value',
          enabled: true
        }
      ]
    }
  }
}
```

### Testing Accessibility

Every component **MUST** be tested for accessibility:
- Run the accessibility checks in the Storybook a11y addon
- Document accessibility features in the component's documentation
- Include keyboard navigation instructions for interactive components

## 9. Component Variants and States

### Required Story Variants

For most components, create at least these story variants (if applicable):

1. **Default**: The standard/base state of the component
2. **Variants**: Different visual or functional variants
3. **States**: Different states (loading, disabled, error, etc.)
4. **Size Variations**: Different sizes if the component supports them
5. **Customization**: Examples of customization options

### Interactive States

For interactive components, include stories demonstrating:
- Initial/resting state
- Hover state
- Focus state
- Active/pressed state
- Disabled state

## 10. Example Stories

### Simple Component Example (LoadMoreButton)

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import LoadMoreButton from './LoadMoreButton';

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
      description: 'Whether there are more items to load',
      control: 'boolean' 
    },
    loadText: {
      description: 'Text to show in normal state',
      control: 'text'
    },
    loadingText: {
      description: 'Text to show in loading state',
      control: 'text'
    }
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A button component for loading more items in paginated lists.'
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
    loadingText: 'LOADING'
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
    loadingText: 'LOADING'
  }
};
```

### Complex Component Example (ModeSelector)

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import ModeSelector from './ModeSelector';

const meta: Meta<typeof ModeSelector> = {
  title: 'UI/Selectors/Mode Selector',
  component: ModeSelector,
  tags: ['autodocs'],
  argTypes: {
    selectedMode: { 
      description: 'Currently selected mode',
      control: 'radio',
      options: ['my-activity', 'my-work-activity', 'team-activity']
    },
    onChange: { 
      description: 'Callback fired when mode changes',
      action: 'mode changed' 
    },
    disabled: { 
      description: 'Whether the component is disabled',
      control: 'boolean' 
    },
    // Additional argTypes
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'A radio group component for selecting between different activity modes.'
      }
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
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
 * Default state with "my-activity" selected.
 * 
 * Keyboard navigation:
 * - Use Tab to focus the component
 * - Use Arrow keys to navigate between options
 * - Use Space or Enter to select an option
 */
export const Default: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: false
  }
};

/**
 * Component in disabled state - cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    selectedMode: 'my-activity',
    disabled: true
  }
};
```

---

By following these standards, we ensure our Storybook implementation provides a consistent, maintainable, and useful component library that serves both as development environment and documentation.