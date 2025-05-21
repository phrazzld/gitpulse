# Organisms

Organisms are groups of molecules joined together to form a relatively complex, distinct section of an interface.

In this directory, we store components that:

- Combine multiple molecules and/or atoms to create a complete, standalone UI section
- May manage more complex layouts and interactions
- Represent distinct sections of the application interface
- Typically receive data and callbacks via props (presentation components) 

## Examples

- Navigation bars
- Forms (multiple form groups + submit button)
- Content sections (header + content + actions)
- Panels (header + controls + content)
- Modals (header + content + footer)

## Guidelines

- Organisms should compose molecules and atoms to create cohesive UI sections
- Business logic should be extracted into custom hooks, and organisms should act as presentation components
- Organisms should receive all necessary data and callbacks via props
- Components should be thoroughly documented with TSDoc comments
- All components must have comprehensive test coverage (≥80%)
- Each component should have corresponding Storybook stories with documented states