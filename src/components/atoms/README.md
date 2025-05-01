# Atoms

Atoms are the basic building blocks of matter. Applied to web interfaces, atoms are our HTML tags, such as form labels, inputs, buttons, etc.

In this directory, we store the smallest, most fundamental UI components that:

- Are highly reusable across the application
- Have minimal or no dependencies on other components
- Are primarily controlled via props
- Have a single, clear responsibility
- Typically don't maintain their own state (or have minimal internal state)

## Examples

- Buttons
- Input fields
- Icons
- Typography elements (headings, paragraphs)
- Simple form controls

## Guidelines

- Atoms should be implemented as pure presentation components
- Props should fully control the component's appearance and behavior
- Components should be thoroughly documented with TSDoc comments
- All components must have comprehensive test coverage (≥90%)
- Each component should have corresponding Storybook stories