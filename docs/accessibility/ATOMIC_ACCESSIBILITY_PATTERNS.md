# Atomic Design Accessibility Patterns

This document provides accessibility best practices and patterns specific to each level of our atomic design system. Use these guidelines when creating or reviewing components at each level.

## Overview

Atomic design creates a hierarchy of components, and accessibility concerns evolve with complexity:
- **Atoms**: Focus on fundamental accessibility of individual elements
- **Molecules**: Handle relationships and simple interactions between atoms
- **Organisms**: Manage complex interactions, focus flow, and content structure
- **Templates**: Ensure page-level accessibility and landmark structure
- **Pages**: Verify complete user flows and dynamic content handling

## Atoms

Atoms are the foundational building blocks. Getting accessibility right at this level prevents issues from cascading up.

### Key Principles for Atoms

1. **Use Native Elements**
   ```tsx
   // ✅ Good: Native button element
   <button type="button">Click me</button>
   
   // ❌ Bad: Div acting as button
   <div onClick={handleClick}>Click me</div>
   ```

2. **Ensure Keyboard Accessibility**
   - All interactive atoms must be keyboard operable
   - Use standard keys (Tab, Enter, Space, Arrow keys)
   - Provide visible focus indicators (minimum 3:1 contrast)

3. **Provide Accessible Names**
   ```tsx
   // Icon-only button needs aria-label
   <Button aria-label="Close dialog">
     <CloseIcon />
   </Button>
   
   // Input needs associated label
   <label htmlFor="email">Email</label>
   <Input id="email" type="email" />
   ```

4. **Maintain Color Contrast**
   - Text: 4.5:1 against background (AA standard)
   - Large text (18pt+): 3:1 ratio
   - Interactive elements: 3:1 for boundaries/states

### Common Atom Patterns

#### Button
- Use `<button>` element
- Include `type` attribute
- Add `aria-label` for icon-only variants
- Support `disabled` state properly
- Implement `aria-pressed` for toggles

#### Input
- Always associate with `<label>`
- Include `aria-describedby` for help text
- Add `aria-invalid` and `aria-errormessage` for validation
- Use appropriate `type` attribute
- Support `required` and `disabled` states

#### Link
- Use `<a>` with valid `href`
- Distinguish from buttons (navigation vs action)
- Make link purpose clear from text
- Add `aria-current` for current page

#### Icon
- Decorative: use `aria-hidden="true"`
- Informative: provide alternative text
- As button: wrap in button with `aria-label`
- Maintain minimum 44x44px touch target

## Molecules

Molecules combine atoms into functional units. Focus on relationships and group behavior.

### Key Principles for Molecules

1. **Establish Relationships**
   ```tsx
   // Form field molecule
   <div className="form-field">
     <label htmlFor="username">Username</label>
     <Input 
       id="username"
       aria-describedby="username-help username-error"
     />
     <span id="username-help">Must be unique</span>
     <span id="username-error" role="alert">Username taken</span>
   </div>
   ```

2. **Group Related Elements**
   ```tsx
   // Use fieldset for related inputs
   <fieldset>
     <legend>Shipping Address</legend>
     <Input label="Street" />
     <Input label="City" />
     <Input label="Zip" />
   </fieldset>
   ```

3. **Handle Simple Interactions**
   - Focus moves logically between atoms
   - State changes are announced
   - Error messages appear near relevant fields

### Common Molecule Patterns

#### Form Field Group
- Use `fieldset` and `legend` for related fields
- Associate errors with specific inputs
- Announce validation changes
- Maintain logical tab order

#### Search Bar
```tsx
<form role="search" aria-label="Site search">
  <Input
    type="search"
    aria-label="Search query"
  />
  <Button type="submit">
    <SearchIcon aria-hidden="true" />
    Search
  </Button>
</form>
```

#### Button Group
```tsx
<div role="group" aria-label="Text alignment">
  <Button aria-pressed={align === 'left'}>Left</Button>
  <Button aria-pressed={align === 'center'}>Center</Button>
  <Button aria-pressed={align === 'right'}>Right</Button>
</div>
```

#### Card
- Use appropriate heading level
- Make entire card clickable if it's a link
- Ensure interactive elements are accessible
- Consider `article` element for standalone content

## Organisms

Organisms are complex, often interactive sections requiring sophisticated accessibility patterns.

### Key Principles for Organisms

1. **Manage Focus Flow**
   ```tsx
   // Modal organism with focus trap
   <Dialog
     onClose={() => returnFocusToTrigger()}
     initialFocus={firstInteractiveElement}
   >
     {/* Focus trapped within dialog */}
   </Dialog>
   ```

2. **Implement Complex ARIA Patterns**
   - Use appropriate widget roles
   - Manage state with ARIA attributes
   - Handle keyboard navigation patterns

3. **Structure Content Hierarchically**
   ```tsx
   <nav aria-label="Main navigation">
     <h2 className="sr-only">Site Navigation</h2>
     {/* Navigation items */}
   </nav>
   ```

### Common Organism Patterns

#### Navigation
```tsx
<nav aria-label="Main">
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
    <li>
      <button aria-expanded={productsOpen}>
        Products
      </button>
      {/* Dropdown menu */}
    </li>
  </ul>
</nav>
```

#### Data Table
```tsx
<table>
  <caption>User Activity Summary</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Actions</th>
      <th scope="col">
        <button aria-label="Sort by date">Date</button>
      </th>
    </tr>
  </thead>
  <tbody>{/* Table rows */}</tbody>
</table>
```

#### Tabs
```tsx
<div>
  <div role="tablist" aria-label="Account settings">
    <button
      role="tab"
      aria-selected={activeTab === 0}
      aria-controls="panel-0"
      id="tab-0"
    >
      Profile
    </button>
    {/* More tabs */}
  </div>
  <div
    role="tabpanel"
    id="panel-0"
    aria-labelledby="tab-0"
    hidden={activeTab !== 0}
  >
    {/* Tab content */}
  </div>
</div>
```

#### Modal/Dialog
- Trap focus within modal
- Return focus to trigger on close
- Add `aria-modal="true"`
- Provide close button and Escape key handling
- Announce modal content to screen readers

### Focus Management Strategies

#### Focus Trapping
```tsx
// For modals, dropdowns, and overlays
useFocusTrap(containerRef, {
  initialFocus: firstButton,
  returnFocus: triggerElement,
  escapeDeactivates: true
});
```

#### Roving Tabindex
```tsx
// For single-tab-stop widgets (menus, tablists)
useRovingTabIndex(itemRefs, {
  orientation: 'horizontal',
  loop: true
});
```

#### Skip Links
```tsx
<a href="#main" className="skip-link">
  Skip to main content
</a>
```

## Live Regions and Dynamic Content

### Announcing Changes
```tsx
// Status messages (polite)
<div role="status" aria-live="polite">
  {itemCount} items in cart
</div>

// Urgent alerts (assertive)
<div role="alert" aria-live="assertive">
  Error: Invalid credit card
</div>

// Loading states
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading results...' : `${results.length} results found`}
</div>
```

### Progressive Enhancement
1. Ensure content is accessible without JavaScript
2. Enhance with ARIA and keyboard handling
3. Add live regions for dynamic updates
4. Test with JavaScript disabled

## Testing Strategies by Atomic Level

### Atoms
- Verify keyboard operability
- Check color contrast
- Validate ARIA usage
- Test focus indicators

### Molecules
- Test tab order through grouped elements
- Verify relationship announcements
- Check error message associations
- Validate form submissions

### Organisms
- Test complex keyboard patterns
- Verify focus management
- Check heading hierarchy
- Test with screen readers
- Validate ARIA widget implementation

## Component Creation Checklist

When creating new components at any level:

- [ ] Can it be built with semantic HTML?
- [ ] Is it keyboard accessible?
- [ ] Does it have appropriate ARIA labels/descriptions?
- [ ] Are focus indicators visible?
- [ ] Does color contrast meet WCAG AA?
- [ ] Are errors announced to screen readers?
- [ ] Is the tab order logical?
- [ ] Are loading/dynamic states announced?
- [ ] Does it work without JavaScript?
- [ ] Is it tested with automated tools?

## Resources

### Internal
- [Pattern Library Principles](./PATTERN_LIBRARY_PRINCIPLES.md)
- [Component Template](./COMPONENT_TEMPLATE.md)
- [Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)
- [Approved Color Pairings](./APPROVED_COLOR_PAIRINGS.md)

### External
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Components](https://inclusive-components.design/)
- [The A11Y Project](https://www.a11yproject.com/)