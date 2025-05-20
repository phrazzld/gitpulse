# Atomic Design Implementation

This document explains the Atomic Design methodology implementation in GitPulse, providing guidelines for categorizing components and creating new ones according to this system.

## Table of Contents

- [Introduction to Atomic Design](#introduction-to-atomic-design)
- [Implementation in GitPulse](#implementation-in-gitpulse)
  - [Directory Structure](#directory-structure)
  - [Component Organization](#component-organization)
- [Component Categories](#component-categories)
  - [Atoms](#atoms)
  - [Molecules](#molecules)
  - [Organisms](#organisms)
  - [Templates](#templates)
- [Guidelines for Categorizing Components](#guidelines-for-categorizing-components)
  - [Decision Tree](#decision-tree)
  - [Complexity Assessment](#complexity-assessment)
- [Development Workflow](#development-workflow)
  - [Creating New Components](#creating-new-components)
  - [Testing Components](#testing-components)
  - [Storybook Integration](#storybook-integration)
- [UI Architecture Principles](#ui-architecture-principles)
  - [Presentation/Logic Separation](#presentationlogic-separation)
  - [Component Dependencies](#component-dependencies)
- [Examples and Patterns](#examples-and-patterns)
  - [Atom Example](#atom-example)
  - [Molecule Example](#molecule-example)
  - [Organism Example](#organism-example)
  - [Template Example](#template-example)
- [Q&A: Common Questions](#qa-common-questions)

## Introduction to Atomic Design

Atomic Design is a methodology for creating design systems developed by Brad Frost. It's based on the idea that interfaces can be broken down into fundamental building blocks and then combined to form more complex components. The methodology consists of five distinct levels:

1. **Atoms**: The smallest building blocks of an interface (buttons, inputs, labels, etc.)
2. **Molecules**: Simple groups of UI elements functioning together (form fields, cards, etc.)
3. **Organisms**: Complex UI components composed of molecules and atoms (headers, forms, etc.)
4. **Templates**: Page-level layouts that arrange components
5. **Pages**: Specific instances of templates with actual content

The key benefit of Atomic Design is that it creates a **systematic, scalable, and consistent** approach to component development. By building from the smallest elements upward, we ensure reusability, maintainability, and coherence across the entire UI.

## Implementation in GitPulse

GitPulse implements Atomic Design with a focus on the first four levels: atoms, molecules, organisms, and templates. The implementation aligns with our development philosophy of modularity, testability, and clear separation of concerns.

### Directory Structure

Our component organization follows this structure:

```
src/
└── components/
    ├── atoms/          # Basic UI elements
    ├── molecules/      # Simple component combinations
    ├── organisms/      # Complex components 
    └── templates/      # Page layouts
```

### Component Organization

Components are organized based on their complexity, reusability, and dependencies:

- **Atoms**: Located in `src/components/atoms/`
- **Molecules**: Located in `src/components/molecules/`
- **Organisms**: Located in `src/components/organisms/`
- **Templates**: Located in `src/components/templates/` or handled by Next.js page/layout components

## Component Categories

### Atoms

**Definition**: The smallest, most basic building blocks of the interface that cannot be broken down further without losing their meaning.

**Characteristics**:
- Simple, focused functionality
- Few or no dependencies
- Highly reusable across the application
- Primarily presentation-focused
- Typically stateless or with minimal internal state

**Examples in GitPulse**:
- `Button`: Basic interactive element
- `LoadMoreButton`: Specialized button for loading more content
- `StatusDisplay`: Simple status indicator component
- `ModeSelector`: Radio button group for selecting activity modes

### Molecules

**Definition**: Combinations of atoms that form relatively simple UI components with a single responsibility.

**Characteristics**:
- Composed of multiple atoms
- Still relatively simple and focused
- More specific functionality than atoms
- May contain some simple logic
- Typically serves a single purpose

**Examples in GitPulse**:
- `DateRangePicker`: Combination of inputs and labels for date selection
- `ErrorAlert`: Alert component for displaying errors
- `AuthLoadingCard`: Card displaying authentication status
- `TerminalHeader`: Styled header with terminal-like appearance
- `CommitItem`: Individual commit display in a list

### Organisms

**Definition**: Complex UI components composed of molecules and/or atoms that form a distinct section of the user interface.

**Characteristics**:
- Made up of multiple molecules and atoms
- More complex functionality and presentation
- Often contains business logic or complex state management
- Represents a distinct section of the UI
- May integrate with other application services or APIs

**Examples in GitPulse**:
- `ActivityFeed`: Complex feed displaying commit activity
- `SummaryView`: Complete summary section with multiple sub-components
- `OperationsPanel`: Panel with multiple operations and settings
- `Header`: Application header with navigation and user info
- `FilterPanel`: Panel for filtering data with multiple options

### Templates

**Definition**: Page-level layouts that arrange multiple organisms into a complete page structure.

**Characteristics**:
- Defines the overall layout of a page
- Primarily focused on structure rather than content
- Usually doesn't contain business logic
- In Next.js applications, often handled by page components or layouts

**Examples in GitPulse**:
- `Dashboard Layout`: The layout structure for the dashboard
- `App Layout`: The overall application layout
- In many cases, Next.js page components like `dashboard/page.tsx` serve as templates

## Guidelines for Categorizing Components

### Decision Tree

Use the following decision tree to categorize a component:

1. **Is it a basic UI element that can't be broken down further?**
   - Yes → **Atom**
   - No → Continue

2. **Is it a simple combination of atoms with a single responsibility?**
   - Yes → **Molecule**
   - No → Continue

3. **Is it a complex component forming a distinct section of the UI?**
   - Yes → **Organism**
   - No → Continue

4. **Does it define a page layout arrangement?**
   - Yes → **Template**
   - No → Reassess, as it might not fit the Atomic Design pattern

### Complexity Assessment

Consider these factors when determining a component's category:

**Low Complexity (Atom)**
- Few props (typically < 5)
- No or minimal state management
- No dependencies on other components
- No or minimal business logic
- Highly reusable across the application

**Medium Complexity (Molecule)**
- Moderate number of props
- Limited state management
- Depends only on atoms
- Limited business logic
- Still relatively reusable

**High Complexity (Organism)**
- Numerous props
- Complex state management
- Depends on atoms and molecules
- May contain significant business logic
- Less reusable, more domain-specific

**Layout Complexity (Template)**
- Focused on arrangement rather than functionality
- Often uses CSS Grid, Flexbox for layout
- Contains placeholder slots for organisms

## Development Workflow

### Creating New Components

1. **Identify the Component Category**
   - Use the decision tree and complexity assessment
   - When in doubt, start with a higher category and refactor if needed

2. **Create Files in the Appropriate Directory**
   - Component file: `components/[category]/ComponentName.tsx`
   - Stories: `components/[category]/ComponentName.stories.tsx` (if applicable)
   - Tests: `components/[category]/__tests__/ComponentName.test.tsx`

3. **Follow the Presentation/Logic Separation Pattern**
   - Create a presentation component focusing on rendering UI
   - Extract complex logic to custom hooks when appropriate
   - See [UI Architecture Principles](#ui-architecture-principles) for more details

4. **Document the Component**
   - Add comprehensive TSDoc comments
   - Document props and their purpose
   - Include usage examples

### Testing Components

Testing differs slightly by component category:

**Atoms**
- Focus on rendering variations and states
- Test basic interactivity
- Usually requires minimal mocking

**Molecules**
- Test combinations of props and states
- Test interactions between constituent atoms
- May require limited mocking

**Organisms**
- Test overall functionality
- Mock more complex dependencies
- Test integration between sub-components

**Templates**
- Test layout responsiveness
- Test placement of components
- Focus on structure rather than functionality

### Storybook Integration

Storybook is a crucial part of our Atomic Design implementation, providing:

1. **Component Documentation**
   - Visual display of all component variations
   - Interactive controls for testing props and states
   - Documentation of props and usage

2. **Development Environment**
   - Isolated development workflow
   - Easy testing of different states and configurations
   - Visual regression testing

3. **Design System Showcase**
   - Living documentation of our UI components
   - Reference for designers and developers

For detailed Storybook guidelines, see [STORYBOOK.md](./STORYBOOK.md).

## UI Architecture Principles

### Presentation/Logic Separation

In accordance with our development philosophy, components should follow a clear separation of presentation and logic:

**Presentation Components**
- Focus on rendering UI based on props
- Minimal or no internal state (except UI-specific state)
- Avoid direct API calls or side effects
- Are pure and easily testable

**Logic Hooks**
- Manage state and side effects
- Handle data fetching and transformations
- Encapsulate business logic
- Return data and callbacks for components

**Container Components**
- Connect logic hooks to presentation components
- Serve as the integration point
- Handle context and global state

For more details, see [UI_PATTERNS.md](./UI_PATTERNS.md).

### Component Dependencies

Components should respect the Atomic Design hierarchy in their dependencies:

- **Atoms**: Should not depend on molecules, organisms, or templates
- **Molecules**: Can depend on atoms, but not on organisms or templates
- **Organisms**: Can depend on atoms and molecules, but not on templates
- **Templates**: Can depend on atoms, molecules, and organisms

This unidirectional dependency flow ensures proper separation and avoids circular dependencies.

## Examples and Patterns

### Atom Example

**LoadMoreButton.tsx**

```tsx
import React from 'react';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading: boolean;
  hasMore: boolean;
  className?: string;
  loadText?: string;
  loadingText?: string;
}

export default function LoadMoreButton({
  onClick,
  loading,
  hasMore,
  className = '',
  loadText = 'LOAD MORE',
  loadingText = 'LOADING'
}: LoadMoreButtonProps) {
  // Simple atom with minimal logic
  if (!hasMore) return null;

  return (
    <div className={`flex justify-center py-4 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-busy={loading}
        className="px-5 py-2 rounded-md text-sm font-medium flex items-center"
      >
        {loading ? (
          <>
            <span className="mr-2 animate-spin">⟳</span>
            {loadingText}
          </>
        ) : (
          <>
            {loadText}
          </>
        )}
      </button>
    </div>
  );
}
```

### Molecule Example

**ErrorAlert.tsx**

```tsx
import React from 'react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'warning' | 'error' | 'info';
  className?: string;
}

export default function ErrorAlert({
  message,
  onDismiss,
  variant = 'error',
  className = ''
}: ErrorAlertProps) {
  // A molecule combining atoms (text, button) for a specific purpose
  return (
    <div className={`alert alert-${variant} ${className}`} role="alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">{message}</div>
      {onDismiss && (
        <button onClick={onDismiss} className="alert-dismiss">
          ×
        </button>
      )}
    </div>
  );
}
```

### Organism Example

**ActivityFeed.tsx**

```tsx
import React, { useEffect, useState } from 'react';
import IntersectionObserver from '@/components/organisms/IntersectionObserver';
import LoadMoreButton from '@/components/atoms/LoadMoreButton';
import CommitItem from '@/components/molecules/CommitItem';
import { Commit } from '@/types/dashboard';

interface ActivityFeedProps {
  loadCommits: (cursor?: string, limit?: number) => Promise<{
    commits: Commit[];
    nextCursor?: string;
  }>;
  useInfiniteScroll?: boolean;
  initialLimit?: number;
  additionalItemsPerPage?: number;
  showRepository?: boolean;
  showContributor?: boolean;
  emptyMessage?: string;
}

// A complex organism with multiple sub-components and state management
export default function ActivityFeed({
  loadCommits,
  useInfiniteScroll = false,
  initialLimit = 10,
  additionalItemsPerPage = 10,
  showRepository = false,
  showContributor = false,
  emptyMessage = 'No activity data found.'
}: ActivityFeedProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  // Complex logic for data loading, state management, and more...
  
  return (
    <div className="activity-feed">
      {commits.length === 0 && !loading ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <ul className="commit-list">
          {commits.map(commit => (
            <CommitItem
              key={commit.id}
              commit={commit}
              showRepository={showRepository}
              showContributor={showContributor}
            />
          ))}
        </ul>
      )}
      
      {useInfiniteScroll && hasMore ? (
        <IntersectionObserver onIntersect={handleLoadMore}>
          <div className="loading-trigger">
            {loading && <div className="loading-indicator">Loading...</div>}
          </div>
        </IntersectionObserver>
      ) : (
        <LoadMoreButton
          onClick={handleLoadMore}
          loading={loading}
          hasMore={hasMore}
        />
      )}
    </div>
  );
}
```

### Template Example

**Dashboard Layout**

```tsx
// In a Next.js app, templates often take the form of layouts
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-content">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
```

## Q&A: Common Questions

### When should I create a new atom vs. reusing an existing one?

Create a new atom when:
- The component has a unique purpose that can't be fulfilled by existing atoms
- Variations would require excessive props on an existing atom
- The component represents a distinct UI element

Reuse an existing atom when:
- The needed component is functionally the same with minor variations
- The variations can be handled cleanly through props
- Creating a new component would lead to duplication

### How do I handle components that span multiple categories?

Some components may not fit cleanly into a single category. In these cases:

1. **Break it down**: Consider if the component can be split into smaller, more focused components
2. **Categorize by primary purpose**: Place it in the category that best represents its main function
3. **Opt for higher category**: When in doubt, place it in the higher complexity category

### How do styling and theming work with Atomic Design?

Styling should respect the component hierarchy:

- **Atoms**: Base styling with themable properties
- **Molecules**: Compositional styling that respects atom styles
- **Organisms**: Layout and arrangement of molecules/atoms
- **Templates**: Overall page structure and spacing

Use CSS variables, theme objects, or styled-components to maintain consistency.

### How do I handle state management with Atomic Design?

State management follows these principles:

- **Atoms**: Minimal internal state, mostly controlled via props
- **Molecules**: Limited internal state, mostly for UI interactions
- **Organisms**: May contain complex state or use hooks for data/logic
- **Templates**: Typically stateless, focusing on layout

For complex state spanning multiple components, use hooks above the component level or a state management library.

### Can I place non-UI utilities in the Atomic Design structure?

Pure utility functions, hooks, and services should be placed outside the component directories:

- Utilities: `src/lib/` or `src/utils/`
- Hooks: `src/hooks/`
- Services: `src/services/`

Only UI components belong in the Atomic Design structure.