# Component Accessibility Documentation Template

Use this template when adding accessibility documentation to any atomic component's README.md or Storybook MDX file.

---

## Accessibility

### Purpose & User Impact

[Explain how this component serves users and why its accessibility features are important. Focus on real user scenarios and the impact of getting accessibility wrong.]

Example:
> The Button component is a fundamental interactive element that allows users to trigger actions. For users relying on keyboards or assistive technologies, proper button implementation ensures they can navigate, understand, and activate controls effectively. Inaccessible buttons can completely block users from core functionality.

### Keyboard Interaction

Describe all keyboard behaviors in a clear table format:

| Key | Action | Notes |
|-----|--------|-------|
| `Tab` | Moves focus to/from the button | Should be in logical page order |
| `Space` | Activates the button | Standard button behavior |
| `Enter` | Activates the button | Standard button behavior |

Additional keyboard considerations:
- [Any special focus management needs]
- [Keyboard shortcuts if applicable]
- [Focus order within complex components]

### ARIA Usage

#### Required Attributes

| Attribute | When to Use | Example |
|-----------|-------------|---------|
| `aria-label` | When button has no visible text (icon-only) | `aria-label="Close dialog"` |
| `aria-pressed` | For toggle buttons | `aria-pressed="true"` |
| `aria-expanded` | When button controls collapsible content | `aria-expanded="false"` |

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
```

### Semantic HTML

Explain the semantic structure and why it's important:

- **Element Choice**: Why `<button>` not `<div>` or `<a>`
- **Structure**: How the component maintains semantic meaning
- **Enhancements**: When and why ARIA enhances the native semantics

Example:
> We use the native `<button>` element because it provides built-in keyboard support, focus management, and screen reader announcements. The button element automatically communicates its role and interactive nature to assistive technologies without additional ARIA.

### Content & Labeling

#### Visible Labels
- [When to use visible text]
- [Minimum touch target size: 44x44px]
- [Text content guidelines]

#### Screen Reader Labels
- [When to use aria-label vs visible text]
- [How to handle icon-only buttons]
- [Dynamic label considerations]

#### Descriptions and Help Text
- [When to use aria-describedby]
- [How to associate help text]
- [Error message associations]

Example:
```tsx
// Visible label with additional description
<div>
  <Button aria-describedby="submit-help">
    Submit Form
  </Button>
  <span id="submit-help" className="text-sm text-muted">
    All fields must be completed before submission
  </span>
</div>
```

### Color and Contrast

- **Contrast Ratios**: Specify the contrast ratios this component maintains
- **Focus Indicators**: Describe the focus state styling
- **State Changes**: How color indicates different states accessibly

Reference the approved color combinations from [APPROVED_COLOR_PAIRINGS.md](../APPROVED_COLOR_PAIRINGS.md)

### Screen Reader Announcements

Document what screen readers announce for different states:

| State | Announcement | Notes |
|-------|--------------|-------|
| Default | "Submit Form, button" | Role and label announced |
| Pressed | "Toggle, button, pressed" | State included |
| Disabled | "Submit Form, button, unavailable" | Disabled state communicated |

### Testing

#### Automated Testing
```tsx
// Example jest-axe test
it('should not have accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Manual Testing Checklist
- [ ] Keyboard navigation works as expected
- [ ] Focus indicator is clearly visible
- [ ] Screen reader announces button role and label
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Touch target is at least 44x44 pixels
- [ ] Component works without JavaScript enabled (if applicable)

### Examples in Storybook

Link to relevant Storybook stories that demonstrate accessibility features:

- [Basic Button with keyboard navigation](./Button.stories.tsx)
- [Icon Button with aria-label](./Button.stories.tsx#icon-button)
- [Toggle Button with aria-pressed](./Button.stories.tsx#toggle-button)

### Common Patterns and Use Cases

Document specific patterns this component supports:

1. **Loading State**
   ```tsx
   <Button disabled aria-busy="true">
     <Spinner aria-label="Loading" />
     Saving...
   </Button>
   ```

2. **Icon with Text**
   ```tsx
   <Button>
     <SaveIcon aria-hidden="true" />
     Save Document
   </Button>
   ```

3. **Grouped Actions**
   ```tsx
   <div role="group" aria-label="Text formatting">
     <Button aria-pressed={bold} aria-label="Bold">B</Button>
     <Button aria-pressed={italic} aria-label="Italic">I</Button>
   </div>
   ```

### Resources

- [WAI-ARIA Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [Component Source Code](./Button.tsx)
- [Component Tests](./Button.test.tsx)
- [Accessibility Tests](./Button.accessibility.test.tsx)