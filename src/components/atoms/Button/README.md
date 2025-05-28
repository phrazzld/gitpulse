# Button Component

The Button component is a fundamental interactive element that provides a consistent, accessible way for users to trigger actions throughout the application.

## Usage

```tsx
import { Button } from '@/components/atoms/Button';

// Basic usage
<Button onClick={handleClick}>Click me</Button>

// With variants
<Button variant="secondary" size="lg">
  Large Secondary Button
</Button>

// Icon-only button
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <CloseIcon />
</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive'` | `'default'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disables the button |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `aria-label` | `string` | - | Required for icon-only buttons |
| `aria-pressed` | `boolean` | - | For toggle buttons |
| `aria-expanded` | `boolean` | - | When button controls collapsible content |

## Accessibility

### Purpose & User Impact

The Button component is a fundamental interactive element that allows users to trigger actions. For users relying on keyboards or assistive technologies, proper button implementation ensures they can navigate, understand, and activate controls effectively. Inaccessible buttons can completely block users from core functionality.

### Keyboard Interaction

| Key | Action | Notes |
|-----|--------|-------|
| `Tab` | Moves focus to/from the button | Should be in logical page order |
| `Space` | Activates the button | Standard button behavior |
| `Enter` | Activates the button | Standard button behavior |

The button receives focus in the natural tab order of the page and shows a clear visual focus indicator (blue outline with sufficient contrast).

### ARIA Usage

#### Required Attributes

| Attribute | When to Use | Example |
|-----------|-------------|---------|
| `aria-label` | When button has no visible text (icon-only) | `aria-label="Close dialog"` |
| `aria-pressed` | For toggle buttons | `aria-pressed="true"` |
| `aria-expanded` | When button controls collapsible content | `aria-expanded="false"` |
| `aria-busy` | During loading states | `aria-busy="true"` |

#### ✅ Correct Usage

```tsx
// Icon-only button with accessible label
<Button 
  variant="ghost" 
  size="icon"
  aria-label="Delete item"
>
  <TrashIcon />
</Button>

// Toggle button with state
<Button
  variant="outline"
  aria-pressed={isActive}
  onClick={() => setIsActive(!isActive)}
>
  {isActive ? 'Active' : 'Inactive'}
</Button>

// Button controlling expandable content
<Button
  aria-expanded={isOpen}
  aria-controls="details-panel"
  onClick={() => setIsOpen(!isOpen)}
>
  Show Details
</Button>
```

#### ❌ Common Mistakes

```tsx
// DON'T: Use div with onClick instead of button
<div onClick={handleClick}>Click me</div>

// DON'T: Forget aria-label on icon-only buttons
<Button variant="icon">
  <CloseIcon />
</Button>

// DON'T: Use wrong ARIA attributes
<Button aria-selected="true">Submit</Button> // aria-selected is for options, not buttons

// DON'T: Disable focus on interactive elements
<Button tabIndex={-1}>Can't reach me</Button>
```

### Semantic HTML

We use the native `<button>` element because it provides:
- Built-in keyboard support (Tab, Enter, Space)
- Automatic role announcement to screen readers
- Native disabled state handling
- Focus management
- Form submission capabilities when `type="submit"`

The button element automatically communicates its role and interactive nature to assistive technologies without additional ARIA.

### Content & Labeling

#### Visible Labels
- Use clear, action-oriented text (e.g., "Save Changes" not just "Save")
- Maintain minimum touch target size of 44x44px
- Ensure text describes the action that will occur

#### Screen Reader Labels
- Icon-only buttons must have `aria-label`
- Decorative icons within labeled buttons should use `aria-hidden="true"`
- Dynamic labels should update to reflect current state

```tsx
// Icon with visible text - hide decorative icon
<Button>
  <SaveIcon aria-hidden="true" />
  Save Document
</Button>

// Loading state with announcement
<Button disabled aria-busy="true">
  <Spinner aria-label="Loading" />
  Saving...
</Button>
```

### Color and Contrast

All button variants maintain WCAG AA compliance:
- **Default**: White text (#FFFFFF) on blue (#2563eb) - 4.90:1 ratio
- **Secondary**: Dark text on light background - 7.5:1 ratio
- **Outline**: Blue text (#2563eb) on white - 4.90:1 ratio
- **Ghost**: Inherits text color, ensures 4.5:1 minimum
- **Destructive**: White text on red background - 4.5:1 minimum

Focus indicators use a 3px blue outline (#2563eb) with sufficient contrast against all backgrounds.

### Screen Reader Announcements

| State | Announcement | Notes |
|-------|--------------|-------|
| Default | "Save Document, button" | Role and label announced |
| Pressed | "Toggle Dark Mode, toggle button, pressed" | State included |
| Disabled | "Submit Form, button, unavailable" | Disabled state communicated |
| Loading | "Saving, button, busy" | Busy state announced |

### Testing

#### Automated Testing
```tsx
// Jest + jest-axe test
it('should not have accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Test keyboard interaction
it('should be keyboard accessible', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  const button = screen.getByRole('button');
  button.focus();
  
  await userEvent.keyboard('[Space]');
  expect(handleClick).toHaveBeenCalledTimes(1);
  
  await userEvent.keyboard('[Enter]');
  expect(handleClick).toHaveBeenCalledTimes(2);
});
```

#### Manual Testing Checklist
- [ ] Keyboard navigation works with Tab key
- [ ] Space and Enter activate the button
- [ ] Focus indicator is clearly visible
- [ ] Screen reader announces button role and label
- [ ] Disabled buttons are announced as unavailable
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch target is at least 44x44 pixels
- [ ] Loading states are announced

### Examples in Storybook

- [Basic Button](./Button.stories.tsx) - All variants and sizes
- [Icon Button](./Button.stories.tsx#icon-button) - Demonstrates aria-label usage
- [Toggle Button](./Button.stories.tsx#toggle-button) - Shows aria-pressed states
- [Loading Button](./Button.stories.tsx#loading-button) - Async states with aria-busy

### Common Patterns

#### Button Groups
```tsx
<div role="group" aria-label="Text formatting">
  <Button aria-pressed={bold} onClick={toggleBold}>
    <BoldIcon aria-hidden="true" />
    <span className="sr-only">Bold</span>
  </Button>
  <Button aria-pressed={italic} onClick={toggleItalic}>
    <ItalicIcon aria-hidden="true" />
    <span className="sr-only">Italic</span>
  </Button>
</div>
```

#### Confirmation Actions
```tsx
<Button
  variant="destructive"
  onClick={handleDelete}
  aria-describedby="delete-warning"
>
  Delete Account
</Button>
<span id="delete-warning" className="sr-only">
  This action cannot be undone
</span>
```

### Resources

- [WAI-ARIA Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [Button Component Source](./Button.tsx)
- [Button Tests](./Button.test.tsx)
- [Button Accessibility Tests](./Button.accessibility.test.tsx)
- [Pattern Library Principles](/docs/accessibility/PATTERN_LIBRARY_PRINCIPLES.md)