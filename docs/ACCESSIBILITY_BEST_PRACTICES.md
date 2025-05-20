# Accessibility Best Practices

This document outlines GitPulse's accessibility best practices, guidelines, and common patterns to ensure our application is usable by everyone, including people with disabilities.

## Table of Contents

- [Introduction](#introduction)
- [Color Contrast Requirements](#color-contrast-requirements)
- [Common Accessibility Pitfalls and Solutions](#common-accessibility-pitfalls-and-solutions)
- [Keyboard Navigation Best Practices](#keyboard-navigation-best-practices)
- [Screen Reader Considerations](#screen-reader-considerations)
- [Accessibility Hooks Reference](#accessibility-hooks-reference)
- [Testing and Validation](#testing-and-validation)
- [Resources](#resources)

## Introduction

GitPulse is committed to creating an accessible application that follows the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. This document provides practical guidance for implementing accessible components and avoiding common accessibility issues.

## Color Contrast Requirements

### WCAG Contrast Standards

WCAG defines minimum contrast ratios between text and its background:

| Level | Normal Text | Large Text |
|-------|------------|------------|
| AA    | 4.5:1      | 3:1        |
| AAA   | 7:1        | 4.5:1      |

- **Normal Text**: Less than 18pt, or less than 14pt if bold
- **Large Text**: 18pt or larger, or 14pt or larger if bold

### Using the Color Contrast Utility

GitPulse provides a color contrast utility at `src/lib/accessibility/colorContrast.ts` that should be used to validate all color combinations:

```typescript
import { checkColorContrast } from '@/lib/accessibility/colorContrast';

// Check if colors meet WCAG AA standards
const result = checkColorContrast('#foreground', '#background');
console.log(result.ratio);     // The contrast ratio (e.g., 4.5)
console.log(result.passes);    // true/false - whether it meets standards

// For specific requirements
const aaaResult = checkColorContrast('#foreground', '#background', {
  level: 'AAA',
  size: 'normal'
});
```

### Approved Color Pairings

All color combinations used in the application must follow our approved color pairings documented in `docs/APPROVED_COLOR_PAIRINGS.md`. These pairings have been verified to meet WCAG AA requirements.

For example:
- Primary text on backgrounds uses a contrast ratio of 13.82:1
- Interactive elements use a minimum contrast ratio of 4.5:1
- Large headings maintain at least a 3:1 ratio

### Color Contrast Best Practices

1. **Never rely on color alone** to convey information
2. **Always validate new color combinations** with the colorContrast utility
3. **Consider both light and dark modes** when designing color combinations
4. **Test with color vision deficiency simulators**
5. **Add new approved combinations** to the `color-pairings.config.json` file

### Example: Fixing Low Contrast Text

```jsx
// ❌ Poor contrast - fails WCAG AA
<div style={{ color: '#999999', backgroundColor: '#f8f9fa' }}>
  This text is difficult to read with a 2.3:1 contrast ratio
</div>

// ✅ Improved contrast - passes WCAG AA and AAA
<div style={{ color: '#333333', backgroundColor: '#f8f9fa' }}>
  This text is easy to read with a 12.7:1 contrast ratio
</div>
```

## Common Accessibility Pitfalls and Solutions

### 1. Missing Text Alternatives

**Pitfall**: Images without appropriate `alt` text are not accessible to screen reader users.

**Solution**:
```jsx
// ❌ No alt text
<img src="/icons/graph.svg" />

// ✅ Descriptive alt text
<img src="/icons/graph.svg" alt="Commit activity graph showing increasing trend" />

// ✅ Decorative image (explicitly marked as such)
<img src="/decorative-pattern.svg" alt="" />
```

### 2. Keyboard Navigation Issues

**Pitfall**: Custom interactive elements that aren't accessible via keyboard.

**Solution**:
```jsx
// ❌ Not keyboard accessible
<div onClick={handleClick}>Click Me</div>

// ✅ Keyboard accessible
<button onClick={handleClick}>Click Me</button>

// ✅ For custom elements
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click Me
</div>
```

### 3. Focus Management

**Pitfall**: Losing focus or focus trapped unintentionally.

**Solution**: Use our `useFocusTrap` hook for modals and dialogs:
```jsx
const modalRef = useRef(null);
useFocusTrap(modalRef, isOpen);

return (
  <div ref={modalRef}>
    <button>Close</button>
    <input type="text" />
  </div>
);
```

### 4. Improper ARIA Usage

**Pitfall**: Incorrect or unnecessary ARIA attributes can make accessibility worse.

**Solution**: Follow these ARIA guidelines:
- Only use ARIA when necessary and appropriate
- Ensure ARIA states and properties match the visual state
- Don't override the semantics of HTML elements

```jsx
// ❌ Incorrect ARIA
<div role="button" aria-pressed="true">
  {isActive ? 'Active' : 'Inactive'}
</div>

// ✅ Correct usage
<button aria-pressed={isActive}>
  {isActive ? 'Active' : 'Inactive'}
</button>
```

### 5. Form Labeling

**Pitfall**: Form controls without proper labels are not accessible.

**Solution**:
```jsx
// ❌ Missing label
<input type="text" placeholder="Enter your name" />

// ✅ Explicit label
<label htmlFor="name">Name</label>
<input id="name" type="text" />

// ✅ Visually hidden label (still accessible to screen readers)
<label htmlFor="search" className="visually-hidden">Search</label>
<input id="search" type="search" />
```

### 6. Dynamic Content Updates

**Pitfall**: Screen readers might not announce dynamic content changes.

**Solution**: Use our `useAriaAnnouncer` hook:
```jsx
const { announce } = useAriaAnnouncer();

function handleSubmit() {
  // Process form...
  announce('Form submitted successfully', 'assertive');
}
```

### 7. Touch Target Size

**Pitfall**: Touch targets that are too small are difficult for users with motor impairments.

**Solution**: Make interactive elements at least 44x44 pixels:
```css
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 10px 16px;
}
```

### 8. Heading Hierarchy

**Pitfall**: Skipping heading levels confuses screen reader users.

**Solution**: Maintain a logical heading structure:
```jsx
// ❌ Skipped level
<h1>Page Title</h1>
<h3>Section Title</h3>

// ✅ Proper hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
```

## Keyboard Navigation Best Practices

### Focusable Elements

Ensure all interactive elements can be focused using the keyboard:

1. Use semantic HTML elements (`button`, `a`, `input`, etc.) whenever possible
2. For custom interactive elements, add `tabIndex={0}`
3. For non-interactive elements that users need to see, use `tabIndex={-1}`
4. Never use `tabIndex` values greater than 0

### Focus Indicators

Focus indicators must be clearly visible:

1. Don't remove the default focus outline unless replacing it with something better
2. Ensure focus indicators have sufficient contrast
3. Consider using both outline and background color changes for better visibility

```css
/* ✅ Enhanced focus indicator */
button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  background-color: var(--accent-secondary);
}
```

### Keyboard Shortcuts

When implementing keyboard shortcuts:

1. Document all shortcuts
2. Avoid conflicts with browser and screen reader shortcuts
3. Allow users to disable or customize shortcuts
4. Use our `useKeyboardNavigation` hook for consistent implementation

### Focus Management for Dynamic Content

1. When opening a dialog, trap focus inside and return focus when closed
2. When removing elements from the DOM, ensure focus moves to a logical location
3. After route changes, focus should move to the main content area

## Screen Reader Considerations

### Semantic HTML

1. Use the proper HTML elements for their intended purpose
2. Ensure landmarks are properly implemented (header, nav, main, footer, etc.)
3. Use lists (`<ul>`, `<ol>`) for groups of related items

### ARIA Landmarks and Regions

```jsx
// ✅ Properly marked up page structure
<header role="banner">
  <h1>GitPulse</h1>
</header>
<nav aria-label="Main Navigation">
  {/* navigation items */}
</nav>
<main id="main-content">
  <article>
    <h2>Dashboard</h2>
    {/* content */}
  </article>
</main>
<aside aria-label="Repository Information">
  {/* sidebar content */}
</aside>
<footer role="contentinfo">
  {/* footer content */}
</footer>
```

### Dynamic Content

Use live regions for important dynamic content:

1. Use `aria-live="polite"` for non-urgent updates
2. Use `aria-live="assertive"` for critical updates
3. Use the `useAriaAnnouncer` hook to create and manage live regions

### Hidden Content

For visually hidden content that should be available to screen readers:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Accessibility Hooks Reference

GitPulse provides several custom React hooks to simplify accessibility implementations.

### useFocusTrap

For trapping focus within modals, dialogs, and other overlay components:

```typescript
import { useRef } from 'react';
import { useFocusTrap } from '@/lib/accessibility';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  
  useFocusTrap(modalRef, isOpen, {
    returnFocusOnDeactivate: true,
    onDeactivate: onClose,
    allowClickOutside: true
  });
  
  if (!isOpen) return null;
  
  return (
    <div ref={modalRef} className="modal">
      <button onClick={onClose}>Close</button>
      <h2>Modal Title</h2>
      <p>Modal content...</p>
    </div>
  );
}
```

### useRovingTabIndex

For implementing keyboard navigation in composite components like tabs, menus, and listboxes:

```typescript
import { useRef } from 'react';
import { useRovingTabIndex } from '@/lib/accessibility';

function TabList({ tabs }) {
  const itemRefs = tabs.map(() => useRef(null));
  
  const { currentIndex, handleKeyDown } = useRovingTabIndex(itemRefs, 'horizontal');
  
  return (
    <div role="tablist" onKeyDown={handleKeyDown}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={itemRefs[index]}
          role="tab"
          aria-selected={index === currentIndex}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### useKeyboardNavigation

For custom keyboard shortcuts and navigation:

```typescript
import { useKeyboardNavigation } from '@/lib/accessibility';

function NavigableComponent() {
  const handlers = {
    ArrowUp: () => console.log('Up arrow pressed'),
    ArrowDown: () => console.log('Down arrow pressed'),
    'Ctrl+S': (e) => {
      console.log('Save shortcut pressed');
      // Save action
    }
  };
  
  const handleKeyDown = useKeyboardNavigation(handlers, {
    preventDefault: true,
    stopPropagation: true
  });
  
  return (
    <div tabIndex={0} onKeyDown={handleKeyDown}>
      Press keyboard keys to navigate
    </div>
  );
}
```

### useAriaAnnouncer

For announcing dynamic content changes to screen readers:

```typescript
import { useAriaAnnouncer } from '@/lib/accessibility';

function Notification() {
  const { announce, clearQueue } = useAriaAnnouncer();
  
  function handleSuccess() {
    announce('Operation completed successfully', 'polite');
  }
  
  function handleError() {
    announce('An error occurred. Please try again.', 'assertive');
  }
  
  return (
    <div>
      <button onClick={handleSuccess}>Complete</button>
      <button onClick={handleError}>Trigger Error</button>
      <button onClick={clearQueue}>Clear Announcements</button>
    </div>
  );
}
```

## Testing and Validation

GitPulse implements comprehensive accessibility testing at multiple levels:

### Local Development Testing

1. **Manual Testing**:
   - Test keyboard navigation using Tab, Shift+Tab, Enter, Space, and arrow keys
   - Test with browser developer tools (Lighthouse, Accessibility Inspector)
   - Check color contrast using the DevTools contrast checker

2. **Storybook Testing**:
   - Use the Accessibility addon in Storybook
   - Test components in isolation with a11y checks
   - Verify WCAG compliance for each component state

3. **Pre-commit Checks**:
   - Automated accessibility testing via `npm run check:a11y:staged`
   - Catches issues before they reach the codebase
   - See `docs/LOCAL_ACCESSIBILITY_CHECKS.md` for details

### CI/CD Testing

Our CI pipeline includes automated accessibility testing:

1. Storybook accessibility tests
2. Axe-core integration for WCAG validation
3. Component-specific accessibility tests

See `docs/ACCESSIBILITY_CI_SETUP.md` for detailed information on CI testing.

### Continuous Improvement

Report accessibility issues you find:

1. Create a ticket with detailed reproduction steps
2. Include the specific WCAG criteria that's not being met
3. Propose a solution if possible

## Resources

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Axe-core Rules Documentation](https://dequeuniversity.com/rules/axe/4.4)
- [Related Documents](#related-documents)

### Related Documents

- [Accessibility CI Setup](./ACCESSIBILITY_CI_SETUP.md)
- [Local Accessibility Checks](./LOCAL_ACCESSIBILITY_CHECKS.md)
- [Accessibility Reporting](./ACCESSIBILITY_REPORTING.md)
- [Approved Color Pairings](./APPROVED_COLOR_PAIRINGS.md)