# GitPulse Color Token System

## Overview

The GitPulse color token system provides a centralized, WCAG AA compliant color palette organized by atomic design principles. All colors meet accessibility standards with documented contrast ratios.

## Token Categories

### Brand Colors
Core visual identity colors that define the GitPulse cybernetic theme:
- `darkSlate` (#1b2b34) - Main background color
- `accessibleGreen` (#00994f) - WCAG AA green (3.51:1 large text)
- `electricBlue` (#2563eb) - WCAG AA blue (4.90:1 contrast)
- `darkBlue` (#1a4bbd) - High contrast blue (7.54:1 with white text)

### Semantic Colors
Intent-based colors for consistent user experience:
- `primary`, `secondary` - Main brand colors
- `success`, `warning`, `error`, `info` - State colors
- `textPrimary`, `textSecondary`, `textMuted` - Text hierarchy
- `link`, `linkHover`, `linkActive` - Interactive states

### Component Colors
Pre-defined schemes for specific UI components:
- `button.primary`, `button.secondary`, `button.outline` - Button variants
- `status.success`, `status.warning`, `status.error` - Status indicators
- `input.*` - Form element colors

## Usage

### TypeScript Import

```typescript
import { colors } from '@/lib/design-tokens/colors';

// Access different color categories
const brandColors = colors.brand;
const semanticColors = colors.semantic;
const componentColors = colors.components;
```

### CSS Custom Properties

```css
/* Use semantic color tokens in CSS */
.my-component {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  border: 1px solid var(--color-border);
}

/* Button component example */
.my-button {
  background-color: var(--brand-dark-blue);
  color: var(--brand-white);
  /* 7.54:1 contrast ratio - WCAG AA compliant */
}
```

### React Components

```typescript
import { colors } from '@/lib/design-tokens/colors';

// Using component color schemes
const MyButton: React.FC = () => {
  const buttonColors = colors.components.button.primary;
  
  return (
    <button
      style={{
        backgroundColor: buttonColors.background,
        color: buttonColors.text,
        border: `1px solid ${buttonColors.border}`
      }}
    >
      Click me
    </button>
  );
};

// Using semantic colors
const StatusMessage: React.FC<{ type: 'success' | 'error' }> = ({ type }) => {
  const bgColor = type === 'success' 
    ? colors.semantic.success 
    : colors.semantic.error;
  const textColor = type === 'success'
    ? colors.semantic.successText
    : colors.semantic.errorText;
    
  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>
      {type === 'success' ? 'Operation completed!' : 'Error occurred!'}
    </div>
  );
};
```

### Utility Functions

```typescript
import { colors } from '@/lib/design-tokens/colors';

// Generate CSS variable with fallback
const primaryColor = colors.utils.getCSSVar('--color-primary', '#1b2b34');
// Returns: 'var(--color-primary, #1b2b34)'

// Get component color schemes
const buttonScheme = colors.utils.getComponentColors('button');
// Returns: entire button color configuration

// Check accessibility information
const greenInfo = colors.utils.getAccessibilityInfo(colors.brand.accessibleGreen);
// Returns: { wcagCompliant: true, recommendedUse: '...', contrastNote: '...' }
```

## Accessibility Compliance

All color combinations meet WCAG 2.1 AA standards:

| Color Combination | Contrast Ratio | WCAG Level | Usage |
|------------------|----------------|------------|-------|
| White on Dark Blue | 7.54:1 | AA (Normal) | Primary buttons |
| White on Electric Blue | 5.17:1 | AA (Normal) | Secondary buttons |
| Electric Blue on Light | 4.90:1 | AA (Normal) | Links, text |
| Accessible Green on Light | 3.51:1 | AA (Large) | Large text, success |
| Accessible Yellow | 4.69:1 | AA (Normal) | Warning messages |
| Accessible Red | 5.32:1 | AA (Normal) | Error messages |

## Best Practices

1. **Use semantic colors first**: Choose semantic colors (success, error, primary) rather than brand colors directly
2. **Leverage component schemes**: Use pre-defined component color schemes for consistent styling
3. **Always verify accessibility**: All combinations in this system are WCAG AA compliant
4. **Use CSS custom properties**: Prefer CSS variables for better theme support
5. **Reference documentation**: See `APPROVED_COLOR_PAIRINGS.md` for detailed compliance info

## Storybook Documentation

View the interactive color documentation in Storybook:
- **Design System > Color Tokens > Brand Colors** - Brand color palette
- **Design System > Color Tokens > Semantic Colors** - Intent-based colors
- **Design System > Color Tokens > Component Colors** - Component-specific schemes
- **Design System > Color Tokens > Contrast Ratios** - WCAG compliance details
- **Design System > Color Tokens > Usage** - Code examples and best practices

## Migration from Hard-coded Colors

When updating existing components:

1. **Identify current colors**: Find hard-coded hex values or color references
2. **Map to tokens**: Replace with appropriate semantic or component tokens
3. **Use CSS variables**: Prefer `var(--color-name)` syntax for consistency
4. **Verify accessibility**: Ensure WCAG compliance is maintained
5. **Test thoroughly**: Verify visual appearance and accessibility

## File Structure

```
src/lib/design-tokens/
├── colors.ts              # Main color token definitions
├── index.ts               # Public API exports
└── __tests__/
    └── colors.test.ts     # Comprehensive test coverage
```

## Future Enhancements

- Light theme support (currently dark-first)
- Additional semantic color categories
- Component-specific token expansion
- Build-time validation tools
- Visual regression testing integration