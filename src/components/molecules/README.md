# Molecules

Molecules are groups of atoms bonded together and the fundamental unit of a compound. These are simple UI components like form groups, list items, or menu items.

In this directory, we store components that:

- Combine multiple atoms to create a more complex UI element
- Have a single, focused purpose
- May have limited internal state, but are primarily controlled via props
- Form distinct UI patterns that may be reused across the application

## Examples

- Form groups (label + input + validation message)
- Search bars (input + search button)
- Menu items (icon + text + badge)
- Cards (header + content + actions)
- List items (icon + primary text + secondary text + action)

## Guidelines

- Molecules should favor composition of atoms over direct HTML implementation
- Props should provide clear control over the component's appearance and behavior
- Components should be thoroughly documented with TSDoc comments
- All components must have comprehensive test coverage (≥85%)
- Each component should have corresponding Storybook stories