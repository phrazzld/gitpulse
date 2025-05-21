# Accessibility Guidelines

This document provides practical accessibility implementation guidelines for GitPulse developers, focusing on common patterns, approved color combinations, and proper ARIA attribute usage.

## Table of Contents

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Common Component Patterns](#common-component-patterns)
- [ARIA Attributes Reference](#aria-attributes-reference)
- [Color Contrast Requirements](#color-contrast-requirements)
- [Accessibility Hooks](#accessibility-hooks)
- [Testing Approach](#testing-approach)
- [Resources and Tools](#resources-and-tools)

## Introduction

GitPulse is committed to creating an accessible application that follows the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. These guidelines provide practical implementation advice to help developers create accessible components consistently.

### Key Principles

1. **Perceivable**: Information must be presentable in ways all users can perceive
2. **Operable**: Interface components must be operable by all users
3. **Understandable**: Content and operation must be understandable
4. **Robust**: Content must be accessible by a wide variety of user agents

### Documentation Structure

GitPulse accessibility documentation is organized into several complementary documents:

- **[Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)** (this document): Implementation patterns and reference
- **[Accessibility Best Practices](./ACCESSIBILITY_BEST_PRACTICES.md)**: General principles and common solutions
- **[Approved Color Pairings](./APPROVED_COLOR_PAIRINGS.md)**: Validated color combinations
- **[Color Contrast Utility](./COLOR_CONTRAST_UTILITY.md)**: Using the contrast calculation tools
- **[Local Accessibility Checks](./LOCAL_ACCESSIBILITY_CHECKS.md)**: Pre-commit testing procedures
- **[Accessibility CI Setup](./ACCESSIBILITY_CI_SETUP.md)**: CI/CD testing configuration

## Quick Start

### Accessibility Checklist

When implementing a new component or feature, ensure:

✅ **Semantic HTML**: Use the right element for the job (buttons for actions, links for navigation)  
✅ **Keyboard Navigation**: All interactive elements are keyboard accessible  
✅ **Focus Management**: Visible focus indicators and logical focus order  
✅ **ARIA Attributes**: Used correctly and only when necessary  
✅ **Color Contrast**: All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)  
✅ **Screen Reader Support**: All content can be understood by screen readers  
✅ **Responsive Design**: Works on all device sizes and with text zoom  
✅ **Reduced Motion**: Respects prefers-reduced-motion setting  
✅ **Testing**: Includes accessibility tests with jest-axe  

### Common Implementation Pattern

```tsx
import React from 'react';
import { useAriaAnnouncer } from '@/lib/accessibility';

function AccessibleComponent({ children, label, isActive, onChange }) {
  // 1. Use our accessibility hooks
  const { announce } = useAriaAnnouncer();
  
  // 2. Handle events with keyboard support
  const handleChange = (event) => {
    onChange(event);
    // 3. Announce important changes to screen readers
    announce(`Selected: ${label}`, 'polite');
  };
  
  return (
    // 4. Use semantic HTML with appropriate ARIA attributes
    <div 
      role="region" 
      aria-label={label}
    >
      {/* 5. Ensure proper keyboard interaction */}
      <button
        aria-pressed={isActive}
        onClick={handleChange}
        className="focus:ring-2 focus:ring-accent-primary"
      >
        {children}
      </button>
    </div>
  );
}
```

## Common Component Patterns

### Buttons

Buttons should use the semantic `<button>` element and include appropriate ARIA attributes:

```tsx
// ✅ Icon-only button - requires aria-label
<Button 
  aria-label="Settings"
  leftIcon={<SettingsIcon />}
/>

// ✅ Toggle button - uses aria-pressed
<Button 
  pressed={isActive} 
  onClick={handleToggle}
>
  {isActive ? 'On' : 'Off'}
</Button>

// ✅ Loading state - uses aria-busy
<Button loading>
  Submitting
</Button>

// ✅ Disabled state - uses aria-disabled
<Button disabled>
  Unavailable
</Button>
```

Implementation example from `src/components/atoms/Button.tsx`:

```tsx
function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled,
  loading,
  pressed,
  leftIcon,
  rightIcon,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  // Require aria-label for icon-only buttons
  const hasTextContent = children && React.Children.count(children) > 0;
  const hasOnlyIcon = !hasTextContent && (leftIcon || rightIcon);
  
  useEffect(() => {
    if (hasOnlyIcon && !ariaLabel && process.env.NODE_ENV === 'development') {
      console.error('Icon-only button must have an accessible name');
    }
  }, [hasOnlyIcon, ariaLabel]);

  return (
    <button
      className={buttonClasses({ variant, size, disabled, loading, pressed })}
      disabled={disabled || loading}
      aria-disabled={disabled || loading ? true : undefined}
      aria-busy={loading ? true : undefined}
      aria-pressed={pressed !== undefined ? pressed : undefined}
      {...props}
    >
      {loading && <Spinner aria-label="Loading" />}
      {leftIcon && <span className="button-icon">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="button-icon">{rightIcon}</span>}
    </button>
  );
}
```

### Form Inputs

Form inputs must have associated labels and appropriate ARIA attributes:

```tsx
// ✅ Explicit label with htmlFor matching input id
<div>
  <label htmlFor="email">Email Address</label>
  <input 
    id="email" 
    type="email" 
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby="email-hint email-error"
  />
  <p id="email-hint">We'll never share your email</p>
  {hasError && <p id="email-error" role="alert">Please enter a valid email</p>}
</div>

// ✅ Grouped form controls using fieldset/legend
<fieldset>
  <legend>Contact Preferences</legend>
  <div>
    <input id="email-pref" type="radio" name="contact" value="email" />
    <label htmlFor="email-pref">Email</label>
  </div>
  <div>
    <input id="phone-pref" type="radio" name="contact" value="phone" />
    <label htmlFor="phone-pref">Phone</label>
  </div>
</fieldset>
```

### DateRangePicker

From our `DateRangePicker` component, here's how to implement accessible date inputs:

```tsx
// In DateRangePicker.tsx
export default function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
  return (
    <div className="date-range-picker">
      <div className="date-input-group">
        <label htmlFor="since" className="date-label">START DATE</label>
        <input
          id="since"
          type="date"
          value={dateRange.since}
          onChange={(e) => onChange({ ...dateRange, since: e.target.value })}
          aria-label="Start date"
          className="date-input"
        />
      </div>
      <div className="date-input-group">
        <label htmlFor="until" className="date-label">END DATE</label>
        <input
          id="until"
          type="date"
          value={dateRange.until}
          onChange={(e) => onChange({ ...dateRange, until: e.target.value })}
          aria-label="End date"
          className="date-input"
        />
      </div>
    </div>
  );
}
```

### Loading States

Make loading states accessible with appropriate ARIA attributes:

```tsx
// Example from AuthLoadingScreen.tsx
<div 
  role="alert" 
  aria-live="assertive" 
  aria-busy={true}
  aria-label={message}
  className="auth-loading-screen"
>
  <h2 className="loading-title">{message}</h2>
  {subMessage && <p className="loading-sub-message">{subMessage}</p>}
  <StatusDisplay message={statusMessage} />
</div>
```

### Error Messages

Error messages should be associated with their inputs and announced to screen readers:

```tsx
// ✅ Good error message pattern
<div>
  <label htmlFor="username">Username</label>
  <input 
    id="username" 
    aria-invalid={!!errorMessage}
    aria-describedby={errorMessage ? "username-error" : undefined}
  />
  {errorMessage && (
    <div id="username-error" role="alert" className="error-message">
      {errorMessage}
    </div>
  )}
</div>
```

Example from our `ErrorAlert` component:

```tsx
// In ErrorAlert.tsx
export function ErrorAlert({ message, onInstall, onSignOut }) {
  return (
    <div 
      role="alert" 
      className="error-alert" 
      aria-live="assertive"
    >
      <div className="error-content">
        <h3 className="error-title">Error</h3>
        <p className="error-message">{message}</p>
      </div>
      <div className="error-actions">
        {onInstall && (
          <Button 
            onClick={onInstall}
            aria-describedby="install-description"
          >
            Install GitHub App
          </Button>
        )}
        {onSignOut && (
          <Button 
            variant="outline" 
            onClick={onSignOut}
          >
            Sign Out
          </Button>
        )}
      </div>
      <span id="install-description" className="visually-hidden">
        Install the GitHub app to fix authorization issues
      </span>
    </div>
  );
}
```

## ARIA Attributes Reference

### Essential ARIA Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `role` | Defines an element's purpose | `<div role="alert">Error message</div>` |
| `aria-label` | Provides name when no visible text exists | `<button aria-label="Close">×</button>` |
| `aria-labelledby` | References visible text as a label | `<div aria-labelledby="heading-id">...</div>` |
| `aria-describedby` | References additional description | `<input aria-describedby="help-text" />` |
| `aria-expanded` | Indicates expandable state | `<button aria-expanded="true">Hide</button>` |
| `aria-pressed` | Indicates toggle button state | `<button aria-pressed="true">Selected</button>` |
| `aria-checked` | Indicates checkbox-like state | `<div role="checkbox" aria-checked="mixed">...</div>` |
| `aria-selected` | Indicates selection state | `<div role="option" aria-selected="true">...</div>` |
| `aria-disabled` | Indicates disabled state | `<button aria-disabled="true">Unavailable</button>` |
| `aria-busy` | Indicates loading state | `<div aria-busy="true">Loading...</div>` |
| `aria-hidden` | Hides from assistive tech | `<div aria-hidden="true">Decorative</div>` |
| `aria-live` | Defines announcement priority | `<div aria-live="polite">Status updated</div>` |
| `aria-atomic` | Announces entire region | `<div aria-atomic="true">...</div>` |
| `aria-current` | Indicates current item | `<a aria-current="page">Home</a>` |
| `aria-invalid` | Indicates validation error | `<input aria-invalid="true" />` |
| `aria-required` | Indicates required field | `<input aria-required="true" />` |
| `aria-controls` | Links controller to target | `<button aria-controls="panel-1">...</button>` |
| `aria-owns` | Defines parent relationship | `<div aria-owns="child-1 child-2">...</div>` |
| `aria-haspopup` | Indicates popup presence | `<button aria-haspopup="menu">...</button>` |

### Common ARIA Roles

| Role | Purpose | Example |
|------|---------|---------|
| `alert` | Important, time-sensitive messages | `<div role="alert">Form submitted</div>` |
| `alertdialog` | Modal alert requiring response | `<div role="alertdialog">Confirm delete?</div>` |
| `button` | Clickable button (use `<button>` instead) | `<div role="button" tabindex="0">Click</div>` |
| `checkbox` | Toggleable option (use `<input type="checkbox">`) | `<div role="checkbox" aria-checked="true">...</div>` |
| `dialog` | Interactive dialog window | `<div role="dialog" aria-labelledby="title">...</div>` |
| `group` | Collection of related UI elements | `<div role="group" aria-label="Filters">...</div>` |
| `heading` | Section heading (use `<h1>-<h6>` instead) | `<div role="heading" aria-level="2">...</div>` |
| `link` | Hyperlink (use `<a>` instead) | `<div role="link" tabindex="0">...</div>` |
| `list` | Non-interactive list (use `<ul>` instead) | `<div role="list">...</div>` |
| `listbox` | Selection list | `<div role="listbox" aria-activedescendant="opt2">...</div>` |
| `menu` | Menu of commands | `<div role="menu" aria-labelledby="menu-heading">...</div>` |
| `menuitem` | Menu option | `<div role="menuitem" tabindex="-1">...</div>` |
| `option` | Selectable option | `<div role="option" aria-selected="false">...</div>` |
| `progressbar` | Progress indicator | `<div role="progressbar" aria-valuenow="50"...>...</div>` |
| `region` | Important section of page | `<div role="region" aria-label="Data visualization">...</div>` |
| `status` | Status update container | `<div role="status">3 items remaining</div>` |
| `tab` | Tab in a tablist | `<div role="tab" aria-selected="true">...</div>` |
| `tablist` | Container for tabs | `<div role="tablist">...</div>` |
| `tabpanel` | Tab content panel | `<div role="tabpanel" aria-labelledby="tab1">...</div>` |

### Landmark Roles

| Role | Purpose | Example |
|------|---------|---------|
| `banner` | Site header (usually `<header>`) | `<header role="banner">...</header>` |
| `navigation` | Navigation section (use `<nav>`) | `<nav role="navigation">...</nav>` |
| `main` | Main content area (use `<main>`) | `<main role="main">...</main>` |
| `complementary` | Supporting content (use `<aside>`) | `<aside role="complementary">...</aside>` |
| `contentinfo` | Site footer (usually `<footer>`) | `<footer role="contentinfo">...</footer>` |
| `form` | Form container (use `<form>`) | `<form role="form">...</form>` |
| `search` | Search functionality | `<div role="search">...</div>` |

### ARIA Attributes Usage Examples

#### Navigation Menu

```tsx
// Accessible navigation menu
<nav aria-label="Main Navigation">
  <ul role="menubar">
    <li role="none">
      <a 
        role="menuitem" 
        href="/"
        aria-current={isCurrentPage('/') ? 'page' : undefined}
      >
        Home
      </a>
    </li>
    <li role="none">
      <a role="menuitem" href="/dashboard">Dashboard</a>
    </li>
    <li role="none">
      <button 
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isSubMenuOpen ? 'true' : 'false'}
        onClick={toggleSubMenu}
      >
        Settings
      </button>
      {isSubMenuOpen && (
        <ul role="menu">
          <li role="none">
            <a role="menuitem" href="/settings/profile">Profile</a>
          </li>
          <li role="none">
            <a role="menuitem" href="/settings/account">Account</a>
          </li>
        </ul>
      )}
    </li>
  </ul>
</nav>
```

#### Tabs Component

```tsx
// Accessible tabs component
<div>
  <div role="tablist" aria-label="User Information">
    <button 
      role="tab" 
      id="tab-profile" 
      aria-selected={activeTab === 'profile'} 
      aria-controls="panel-profile"
      onClick={() => setActiveTab('profile')}
    >
      Profile
    </button>
    <button 
      role="tab" 
      id="tab-activity" 
      aria-selected={activeTab === 'activity'} 
      aria-controls="panel-activity"
      onClick={() => setActiveTab('activity')}
    >
      Activity
    </button>
  </div>
  
  <div 
    role="tabpanel" 
    id="panel-profile" 
    aria-labelledby="tab-profile"
    hidden={activeTab !== 'profile'}
  >
    Profile content...
  </div>
  <div 
    role="tabpanel" 
    id="panel-activity" 
    aria-labelledby="tab-activity"
    hidden={activeTab !== 'activity'}
  >
    Activity content...
  </div>
</div>
```

#### Status Updates

```tsx
// Status update that announces to screen readers
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading ? (
    <span>Loading data...</span>
  ) : (
    <span>Data updated at {formattedTime}</span>
  )}
</div>
```

#### Modal Dialog

```tsx
// Accessible modal dialog
<div 
  role="dialog" 
  aria-labelledby="dialog-title" 
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Confirm Action</h2>
  <p id="dialog-description">Are you sure you want to delete this item?</p>
  
  <div>
    <button onClick={confirmDelete}>Yes, Delete</button>
    <button onClick={closeDialog}>Cancel</button>
  </div>
</div>
```

## Color Contrast Requirements

### WCAG Standards

At GitPulse, we adhere to WCAG 2.1 AA standards for color contrast:

| Content Type | Minimum Contrast Ratio |
|--------------|------------------------|
| Normal Text (< 18pt) | 4.5:1 |
| Large Text (≥ 18pt or ≥ 14pt bold) | 3:1 |
| UI Components & Graphical Objects | 3:1 |

### Approved Color Pairings

GitPulse maintains an [Approved Color Pairings](./APPROVED_COLOR_PAIRINGS.md) document with validated color combinations that meet WCAG requirements.

Example approved combinations:

| Foreground | Background | Context | Ratio | Status |
|------------|------------|---------|-------|--------|
| var(--foreground)<br/>#1b2b34 | var(--background)<br/>#f8f9fa | Main body text | 13.82:1 | ✅ Pass |
| #00803d<br/>#00803d | var(--background)<br/>#f8f9fa | Interactive elements | 4.79:1 | ✅ Pass |
| #ffffff<br/>#ffffff | #1a4bbd<br/>#1a4bbd | Secondary buttons | 7.54:1 | ✅ Pass |

### Using the Color Contrast Utility

We provide a dedicated color contrast utility at `src/lib/accessibility/colorContrast.ts`:

```typescript
import { checkColorContrast } from '@/lib/accessibility/colorContrast';

// Check if colors meet WCAG AA standards for normal text
const result = checkColorContrast('#foreground', '#background');
console.log(result.ratio);     // The contrast ratio (e.g., 4.5)
console.log(result.passes);    // true/false - whether it meets standards

// For large text
const largeTextResult = checkColorContrast('#foreground', '#background', {
  size: 'large'
});

// For AAA level
const aaaResult = checkColorContrast('#foreground', '#background', {
  level: 'AAA'
});
```

For complete details, see the [Color Contrast Utility documentation](./COLOR_CONTRAST_UTILITY.md).

### Adding New Color Combinations

When creating new color combinations:

1. Check the contrast using our utility
2. Add to `docs/color-pairings.config.json`
3. Run `npm run generate-color-docs` to update documentation
4. Test in both light and dark modes

## Accessibility Hooks

GitPulse provides several React hooks to simplify accessibility implementation:

### useAriaAnnouncer

For screen reader announcements:

```tsx
import { useAriaAnnouncer } from '@/lib/accessibility';

function StatusIndicator() {
  const { announce } = useAriaAnnouncer();
  
  const updateStatus = (status) => {
    setStatus(status);
    // Announce to screen readers
    announce(`Status: ${status}`, 'polite');
  };
  
  return (
    <div>
      <p>Current status: {status}</p>
      <button onClick={() => updateStatus('Complete')}>
        Mark Complete
      </button>
    </div>
  );
}
```

### useFocusTrap

For modal dialogs and popups:

```tsx
import { useRef } from 'react';
import { useFocusTrap } from '@/lib/accessibility';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  
  // Trap focus within modal when open
  useFocusTrap(modalRef, isOpen);
  
  if (!isOpen) return null;
  
  return (
    <div ref={modalRef} className="modal">
      <button onClick={onClose}>Close</button>
      <h2>Modal Title</h2>
      <p>Content...</p>
      <div>
        <button>Cancel</button>
        <button>Confirm</button>
      </div>
    </div>
  );
}
```

### useKeyboardNavigation

For keyboard shortcuts and navigation:

```tsx
import { useKeyboardNavigation } from '@/lib/accessibility';

function NavigableComponent() {
  const handlers = {
    ArrowUp: () => moveSelection('up'),
    ArrowDown: () => moveSelection('down'),
    Enter: () => selectItem(),
    Escape: () => closeMenu()
  };
  
  const handleKeyDown = useKeyboardNavigation(handlers);
  
  return (
    <div 
      role="menu" 
      tabIndex={0} 
      onKeyDown={handleKeyDown} 
      className="menu"
    >
      {/* Menu items */}
    </div>
  );
}
```

### useRovingTabIndex

For composite components like tabsets, listboxes, or menus:

```tsx
import { useRef } from 'react';
import { useRovingTabIndex } from '@/lib/accessibility';

function TabList({ tabs, onTabChange }) {
  const itemRefs = tabs.map(() => useRef(null));
  
  const { currentIndex, setCurrentIndex, handleKeyDown } = useRovingTabIndex(
    itemRefs, 
    'horizontal'
  );
  
  const handleTabChange = (index) => {
    setCurrentIndex(index);
    onTabChange(tabs[index].id);
  };
  
  return (
    <div 
      role="tablist" 
      onKeyDown={handleKeyDown} 
      className="tab-list"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={itemRefs[index]}
          role="tab"
          tabIndex={index === currentIndex ? 0 : -1}
          aria-selected={index === currentIndex}
          onClick={() => handleTabChange(index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

## Testing Approach

GitPulse implements a multi-layered accessibility testing approach:

### Component Testing with jest-axe

Use the `assertAccessible` utility to test components:

```tsx
import { render } from '@testing-library/react';
import { assertAccessible } from '@/lib/tests/axeTest';
import MyComponent from '../MyComponent';

describe('MyComponent Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    await assertAccessible(container);
  });
  
  it('should test multiple states for accessibility', async () => {
    await testAccessibilityForStates(
      (props) => render(<MyComponent {...props} />),
      {
        default: {},
        loading: { loading: true },
        error: { error: 'An error occurred' },
        expanded: { expanded: true }
      }
    );
  });
});
```

### Pre-commit Accessibility Checks

GitPulse uses a pre-commit hook to check accessibility of staged Storybook stories:

```bash
# Run checks on staged stories
npm run check:a11y:staged

# Run checks on all stories
npm run check:a11y:all
```

For details, see [Local Accessibility Checks](./LOCAL_ACCESSIBILITY_CHECKS.md).

### CI/CD Automated Testing

Our CI pipeline includes comprehensive accessibility testing:

1. Component-level accessibility tests with jest-axe
2. Storybook accessibility tests
3. Automated accessibility reports

For configuration details, see [Accessibility CI Setup](./ACCESSIBILITY_CI_SETUP.md).

## Resources and Tools

### Internal Resources

- [Accessibility Best Practices](./ACCESSIBILITY_BEST_PRACTICES.md)
- [Approved Color Pairings](./APPROVED_COLOR_PAIRINGS.md)
- [Color Contrast Utility](./COLOR_CONTRAST_UTILITY.md)
- [Local Accessibility Checks](./LOCAL_ACCESSIBILITY_CHECKS.md)
- [Accessibility CI Setup](./ACCESSIBILITY_CI_SETUP.md)

### External Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Axe Core Rules](https://dequeuniversity.com/rules/axe/4.4)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/)

### Development Tools

- [Storybook a11y addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [axe DevTools extension](https://www.deque.com/axe/devtools/)
- [WAVE evaluation tool](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

---

This document is maintained as part of GitPulse's accessibility strategy. For questions or suggestions, please contact the accessibility team.

*Last updated: 2025-05-20*