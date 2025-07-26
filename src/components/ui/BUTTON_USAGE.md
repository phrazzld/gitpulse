# Button Component Usage Inventory

This document tracks all button usages across the GitPulse application to ensure comprehensive test coverage.

## Button Usage by Component

### 1. **LoadMoreButton** (`src/components/ui/LoadMoreButton.tsx`)
- **Variant**: `outline`
- **Size**: `sm`
- **States**: Loading (disabled), Default
- **Icons**: Loader2 (loading), ChevronDown (default)
- **Test Coverage**: ✅ Complete

### 2. **Landing Page** (`src/app/page.tsx`)
- **Variant**: `default`
- **Size**: `lg`
- **Props**: Full width on mobile
- **Test Coverage**: ⚠️ Manual testing needed

### 3. **OperationsPanel** (`src/components/dashboard/OperationsPanel.tsx`)
- **Count**: 2 buttons
- **Variants**: `destructive`, `ghost`
- **Icons**: LogOut, X
- **Test Coverage**: ⚠️ Manual testing needed

### 4. **AuthError** (`src/components/AuthError.tsx`)
- **Count**: 2 buttons
- **Variants**: `default`, `outline`
- **Icons**: LogOut, RefreshCw
- **Test Coverage**: ⚠️ Manual testing needed

### 5. **AccountSelector** (`src/components/AccountSelector.tsx`)
- **Variant**: `outline`
- **Icons**: ChevronDown
- **States**: Dropdown trigger
- **Test Coverage**: ⚠️ Manual testing needed

### 6. **OrganizationPicker** (`src/components/OrganizationPicker.tsx`)
- **Variant**: `outline`
- **Icons**: ChevronDown, Building2
- **States**: Dropdown trigger, loading
- **Test Coverage**: ⚠️ Manual testing needed

### 7. **DateRangePicker** (`src/components/DateRangePicker.tsx`)
- **Variant**: `outline`
- **Icons**: Calendar, ChevronDown
- **States**: Dropdown trigger
- **Test Coverage**: ⚠️ Manual testing needed

### 8. **FilterPanel** (`src/components/FilterPanel.tsx`)
- **Variant**: `outline`
- **Icons**: ChevronDown/ChevronUp
- **States**: Expanded/Collapsed toggle
- **Test Coverage**: ⚠️ Manual testing needed

### 9. **Header** (`src/components/dashboard/Header.tsx`)
- **Variant**: `ghost`
- **Size**: `sm`
- **Icons**: LogOut
- **Test Coverage**: ⚠️ Manual testing needed

### 10. **ThemeToggle** (`src/components/theme-toggle.tsx`)
- **Variant**: `outline`
- **Size**: `icon`
- **Icons**: Sun, Moon
- **States**: Theme switching
- **Test Coverage**: ⚠️ Manual testing needed

## Button Variants Used

- ✅ **default**: Landing page sign-in
- ✅ **destructive**: Sign out buttons
- ✅ **outline**: Most common - dropdowns, toggles, load more
- ❌ **secondary**: Not used in app
- ✅ **ghost**: Minimal buttons in header/panels
- ❌ **link**: Not used in app

## Button Sizes Used

- ✅ **default**: Not explicitly set (default size)
- ✅ **sm**: LoadMoreButton, Header
- ✅ **lg**: Landing page
- ✅ **icon**: Theme toggle

## Common Patterns

1. **Dropdown Triggers**: Account, Organization, Date selectors use outline variant with ChevronDown
2. **Action Buttons**: Sign out uses destructive/ghost variants
3. **Loading States**: Shown with Loader2 icon and disabled state
4. **Icon Buttons**: Theme toggle uses icon size

## Testing Checklist

### Core Button Component ✅
- [x] All variants render correctly
- [x] All sizes render correctly
- [x] Disabled state works
- [x] Click handlers fire
- [x] Keyboard accessibility
- [x] Custom props forwarding
- [x] asChild prop
- [x] Icon handling

### LoadMoreButton ✅
- [x] Loading state
- [x] hasMore logic
- [x] Custom text props
- [x] Click handling

### Integration Testing Needed
- [ ] Theme toggle functionality
- [ ] Dropdown trigger behavior
- [ ] Sign out flow
- [ ] Loading states in real scenarios
- [ ] Mobile responsiveness

## Recommendations

1. **Create integration tests** for common button patterns (dropdowns, sign out)
2. **Add Storybook stories** for button usage examples
3. **Test mobile touch interactions**
4. **Verify all icon buttons have proper aria-labels**
5. **Ensure loading states prevent double-clicks**