# Accessibility Pattern Library Principles

## Overview

This document establishes the foundational principles for documenting and implementing accessibility patterns within our atomic design system. It serves as the reference point for all component-level accessibility documentation and ensures consistency across our pattern library.

## Core Philosophy

Our accessibility approach aligns with the broader Development Philosophy principles:

1. **Simplicity First**: Use semantic HTML as the foundation. Add ARIA only when necessary.
2. **Explicit Documentation**: Document the "why" behind accessibility decisions, not just the "how"
3. **Testable Examples**: Every pattern must have working, testable implementations in Storybook
4. **Modularity**: Accessibility concerns are documented at the component level where they apply

## Fundamental Rules

### 1. Semantic HTML First

Before reaching for ARIA attributes or custom implementations:
- Use native HTML elements that provide the required semantics
- Leverage built-in keyboard support and accessibility features
- Only enhance with ARIA when HTML alone is insufficient

**Why**: Native elements come with accessibility features built-in, reducing complexity and potential for errors.

### 2. Progressive Enhancement

Build accessible experiences that work for everyone:
- Start with a solid HTML foundation
- Enhance with CSS for visual design
- Add JavaScript for enhanced interactivity
- Ensure functionality remains accessible at each layer

### 3. Keyboard Navigation

All interactive elements must be:
- Reachable via keyboard (in the tab order)
- Operable using standard keys (Enter, Space, Arrow keys, Escape)
- Visually distinguishable when focused
- Logically ordered in the tab sequence

## ARIA Usage Guidelines

### When to Use ARIA

ARIA should be used to:
1. **Bridge semantic gaps** when HTML doesn't provide needed semantics
2. **Establish relationships** between elements that aren't clear from structure alone
3. **Announce dynamic changes** that users need to know about
4. **Provide accessible names** when visible labels aren't appropriate

### ARIA First Rule

> If you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so.

### Common ARIA Attributes by Category

#### Roles
- **Widget roles**: `button`, `checkbox`, `menuitem`, `tab`, etc.
- **Structure roles**: `navigation`, `main`, `complementary`, `region`
- **Landmark roles**: Generally prefer HTML5 elements (`<nav>`, `<main>`, `<aside>`)

#### States and Properties
- **Labels**: `aria-label`, `aria-labelledby`
- **Descriptions**: `aria-describedby`
- **States**: `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`
- **Relationships**: `aria-controls`, `aria-owns`
- **Live regions**: `aria-live`, `aria-atomic`, `aria-relevant`

## Component Documentation Requirements

Every component's accessibility documentation must include:

### 1. Purpose & User Impact
Explain how this component serves users and why accessibility is critical for this pattern.

### 2. Keyboard Interaction
Document all keyboard behaviors:
- Which keys perform which actions
- Expected focus order
- Any special key combinations
- Focus management requirements

### 3. ARIA Usage
When ARIA is needed:
- List required and optional attributes
- Explain why each attribute is necessary
- Provide correct usage examples
- Warn against common mistakes

### 4. Semantic Structure
Document the HTML structure and explain why specific elements were chosen.

### 5. Testing Approach
Specify:
- What automated tests verify
- What requires manual testing
- Expected behavior for screen readers

## Color and Contrast

All components must comply with WCAG AA standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18pt+): 3:1 contrast ratio minimum
- UI components and graphics: 3:1 contrast ratio minimum

Reference approved color pairings: [APPROVED_COLOR_PAIRINGS.md](./APPROVED_COLOR_PAIRINGS.md)

Use the color contrast utility for verification: `src/lib/accessibility/colorContrast.ts`

## Focus Management Patterns

### Basic Focus Indicators
- All interactive elements must have visible focus indicators
- Focus indicators must have at least 3:1 contrast against adjacent colors
- Custom focus styles should enhance, not replace, default browser focus

### Complex Focus Management
For complex widgets:
- **Focus trapping**: Modals, dialogs, and overlays
- **Roving tabindex**: Radio groups, menus, tablists
- **Focus restoration**: Return focus to trigger element when closing overlays
- **Initial focus**: Set appropriate initial focus for opened panels/dialogs

## Dynamic Content and Announcements

### Live Regions
Use ARIA live regions to announce important changes:
- `aria-live="polite"`: For non-critical updates
- `aria-live="assertive"`: For critical, time-sensitive information
- `role="status"`: For status messages
- `role="alert"`: For error messages

### Loading States
- Announce when loading begins and ends
- Provide alternative text for loading indicators
- Ensure loading states don't block keyboard navigation

## Testing and Validation

### Automated Testing
- Use `@storybook/addon-a11y` for all component stories
- Include `jest-axe` tests in component test suites
- Run accessibility checks in CI pipeline

### Manual Testing
Essential manual checks:
1. **Keyboard-only navigation**: Can you use the component without a mouse?
2. **Screen reader testing**: Does announced content make sense?
3. **Color contrast**: Verify in different color modes
4. **Focus order**: Is the tab order logical?
5. **Touch targets**: Are interactive elements large enough (44x44px minimum)?

## Resources and References

### External Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

### Internal Resources
- [Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)
- [Accessibility Best Practices](./ACCESSIBILITY_BEST_PRACTICES.md)
- [Approved Color Pairings](./APPROVED_COLOR_PAIRINGS.md)
- [Color Contrast Utility](./COLOR_CONTRAST_UTILITY.md)

## Maintenance

This document and all component accessibility documentation should be:
- Reviewed quarterly for accuracy
- Updated when WCAG standards change
- Modified based on user feedback and testing results
- Kept in sync with component implementation changes