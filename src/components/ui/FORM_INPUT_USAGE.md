# Form Input Usage & Testing Guide

This document tracks all form inputs across GitPulse and their test coverage status.

## Input Types in GitPulse

### 1. **Text/Search Inputs** (shadcn Input component)

#### AccountSelector (`src/components/AccountSelector.tsx`)
- **Type**: `search`
- **Props**: placeholder, disabled
- **Features**: Live filtering, case-insensitive search
- **Test Coverage**: ✅ Complete

#### OrganizationPicker (`src/components/OrganizationPicker.tsx`)
- **Type**: `search`
- **Props**: placeholder, disabled
- **Features**: Live filtering, case-insensitive search
- **Test Coverage**: ⚠️ Similar to AccountSelector, tests can be adapted

### 2. **Date Inputs** (shadcn Input component)

#### DateRangePicker (`src/components/DateRangePicker.tsx`)
- **Type**: `date`
- **Count**: 2 inputs (since/until)
- **Features**: Debounced updates, visual indicators, dropdown UI
- **Validation**: HTML5 date format (YYYY-MM-DD)
- **Test Coverage**: ✅ Complete

### 3. **Checkbox Inputs** (Native HTML)

#### FilterPanel (`src/components/FilterPanel.tsx`)
- **"Only Me" Checkbox**
  - Controls contributor filtering
  - Hides other contributor options when checked
  - **Test Coverage**: ✅ Complete

- **Contributor Checkboxes**
  - Multi-select for specific contributors
  - Shows commit counts as badges
  - Disabled when "Only Me" is checked
  - **Test Coverage**: ✅ Complete

- **Generate Summaries Checkbox**
  - Only visible when grouping is selected
  - Controls AI summary generation
  - **Test Coverage**: ✅ Complete

#### AccountSelector (`src/components/AccountSelector.tsx`)
- **Account Selection Checkboxes** (when multiSelect=true)
  - Multi-select accounts
  - Shows "YOU" badge for current user
  - **Test Coverage**: ✅ Complete

#### OrganizationPicker (`src/components/OrganizationPicker.tsx`)
- **Organization Selection Checkboxes** (when multiSelect=true)
  - Multi-select organizations
  - Shows member counts
  - **Test Coverage**: ⚠️ Similar to AccountSelector

### 4. **Radio Inputs** (Native HTML)

#### FilterPanel (`src/components/FilterPanel.tsx`)
- **Group By Options**
  - Options: none, repository, contributor
  - Only one selection allowed
  - Controls result grouping
  - **Test Coverage**: ✅ Complete

#### AccountSelector (`src/components/AccountSelector.tsx`)
- **Account Selection Radios** (when multiSelect=false)
  - Single-select mode
  - **Test Coverage**: ✅ Complete

#### OrganizationPicker (`src/components/OrganizationPicker.tsx`)
- **Organization Selection Radios** (when multiSelect=false)
  - Single-select mode
  - **Test Coverage**: ⚠️ Similar to AccountSelector

## Test Coverage Summary

### ✅ Fully Tested Components
1. **Input Component** (`input.test.tsx`)
   - All input types (text, email, password, date, number, search, file)
   - States: disabled, readOnly, required, focused
   - Validation: aria-invalid, pattern, min/max
   - Events: onChange, onBlur, onFocus, onKeyDown, onPaste
   - Accessibility: ARIA attributes, labels

2. **DateRangePicker** (`DateRangePicker.test.tsx`)
   - Date input functionality
   - Debouncing behavior
   - Dropdown interactions
   - Date formatting
   - Keyboard navigation

3. **FilterPanel** (`FilterPanel.test.tsx`)
   - Checkbox functionality (single and multi)
   - Radio button groups
   - Conditional rendering
   - Loading states
   - Filter state management

4. **AccountSelector** (`AccountSelector.test.tsx`)
   - Search input with filtering
   - Checkbox/radio switching
   - Multi/single select modes
   - Keyboard navigation
   - Accessibility

### ⚠️ Components with Similar Patterns (tests can be adapted)
- **OrganizationPicker**: Similar to AccountSelector, same patterns apply

## Common Patterns & Best Practices

### 1. Search Inputs
```typescript
// Pattern used in AccountSelector/OrganizationPicker
<Input
  type="search"
  placeholder="Search..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="h-8"  // Smaller height for search
/>
```

### 2. Date Inputs with Debouncing
```typescript
// Pattern from DateRangePicker
const [isDebouncing, setIsDebouncing] = useState(false);
const debouncedUpdate = useMemo(
  () => debounce((value) => {
    onDateRangeChange(value);
    setIsDebouncing(false);
  }, 500),
  [onDateRangeChange]
);
```

### 3. Checkbox Styling
```typescript
// Native checkboxes with Tailwind styling
<input
  type="checkbox"
  id="unique-id"
  checked={isChecked}
  onChange={(e) => handleChange(e.target.checked)}
  className="mr-2 accent-green-500"
  disabled={isDisabled}
/>
```

### 4. Radio Groups
```typescript
// Native radio buttons with proper grouping
<input
  type="radio"
  id="option-id"
  name="group-name"  // Same name for all in group
  value="option-value"
  checked={selected === 'option-value'}
  onChange={(e) => handleChange(e.target.value)}
  className="mr-2"
/>
```

## Validation Patterns

### 1. HTML5 Validation
- Date inputs automatically validate format
- Pattern attribute for regex validation
- Required attribute for mandatory fields

### 2. Custom Validation
- Debouncing for expensive validation
- Visual indicators (border colors, icons)
- Error messages with aria-describedby

### 3. Accessibility
- All inputs have associated labels
- Error states use aria-invalid
- Loading states announced to screen readers
- Keyboard navigation fully supported

## Testing Checklist for New Inputs

When adding new form inputs:

- [ ] Basic rendering and default values
- [ ] User interactions (typing, clicking, selecting)
- [ ] Validation (valid/invalid inputs)
- [ ] Disabled/readonly states
- [ ] Loading/error states
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Integration with parent component
- [ ] Edge cases (empty values, rapid changes)

## Running Tests

```bash
# Run all form input tests
npm run test:react src/components/**/*.test.tsx

# Run specific test
npm run test:react DateRangePicker.test.tsx

# Run with coverage
npm run test:react:coverage
```

## Future Improvements

1. **Add E2E tests** for complete form submission flows
2. **Test form validation** at the form level, not just inputs
3. **Add visual regression tests** for input states
4. **Create shared test utilities** for common input patterns
5. **Add performance tests** for components with many inputs