# Component Library Guidelines

This document outlines the standards and best practices for our component library, including Storybook integration.

## Component Organization

Components are organized in the following directories:
- `src/components/ui/`: Core UI components that are reusable across the application
- `src/components/`: Application-specific components that may depend on context, state, or specific functionality

## Component Implementation Strategy

### Component Hierarchy

We organize our component library following atomic design principles:

1. **Atomic Components** (implement first)
   - Buttons, inputs, selectors, icons
   - Simple, focused components with minimal or no dependencies
   - Primarily controlled via props
   - Example: `LoadMoreButton`, `ModeSelector`

2. **Molecular Components** (implement second)
   - Cards, form groups, list items, banners
   - Composed of multiple atomic components
   - Example: `CommitItem`

3. **Organism Components** (implement last)
   - Complex UI sections, screens, layouts
   - Often have more complex rendering logic or state
   - May include animations, transitions, or side effects
   - Example: `AuthLoadingScreen`

### Implementation Order

1. Always start with the most atomic components
2. Progress to more complex components only after their dependencies are implemented
3. Defer complex components with performance-intensive features until the foundation is solid

## Storybook Standards

### File Structure

- Stories should be colocated with their components: `ComponentName.stories.tsx` next to `ComponentName.tsx`
- Use Component Story Format 3 (CSF3)

### Story Requirements

1. **Meta Configuration**
   - Include `tags: ['autodocs']` to generate documentation
   - Use the correct component title hierarchy (e.g., `UI/Buttons/Load More Button`)
   - Configure argTypes with controls, descriptions, and defaults

2. **Required Stories**
   - Default: Shows the standard component usage
   - All major states (e.g., Loading, Disabled, Error)
   - Edge cases when applicable

3. **Documentation**
   - Component TSDoc comments must be comprehensive
   - Prop descriptions must explain purpose, type, and defaults
   - Stories should include descriptions explaining their purpose

### Performance Considerations

1. **Start Simple**
   - Begin with simple, atomic components before tackling complex ones
   - Components with CSS animations, filters, or heavy rendering should be implemented later

2. **Isolation Techniques**
   - Use props to control side effects and intensive features
   - Add flags like `disableEffects` for performance-intensive components
   - Set reasonable defaults for Storybook environment

## Component Requirements

1. **Isolation**
   - Components should be isolated and rely mainly on props
   - Avoid direct coupling to global state, context, or external services
   - Use composition and props for configuration

2. **Documentation**
   - All components must have comprehensive TSDoc
   - All props must be documented with descriptions
   - Complex logic should have explanatory comments

3. **Accessibility**
   - Components must follow accessibility best practices
   - Include ARIA attributes where appropriate
   - Ensure keyboard navigation works correctly
   - Test with screen readers when applicable

## Testing

1. **Unit Tests**
   - Test component rendering with different props
   - Verify conditional rendering logic
   - Test event handlers and user interactions

2. **Visual Regression Tests**
   - Consider implementing Storybook visual tests
   - Capture snapshots of key component states