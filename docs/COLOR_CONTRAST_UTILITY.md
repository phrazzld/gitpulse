# Color Contrast Utility

This document describes the color contrast utility implemented as part of TASK-075. The utility provides functions for calculating and validating color contrast according to WCAG 2.1 accessibility standards.

## Overview

The color contrast utility is implemented in `src/lib/accessibility/colorContrast.ts` and provides functions for:

- Parsing colors in various formats (hex, rgb, rgba, CSS variables)
- Calculating color luminance according to WCAG 2.1 formula
- Calculating contrast ratios between colors
- Validating contrast ratios against WCAG 2.1 standards
- Providing comprehensive information about contrast checks

## WCAG 2.1 Contrast Standards

The Web Content Accessibility Guidelines (WCAG) 2.1 defines the following minimum contrast ratios:

| WCAG Level | Normal Text | Large Text |
|------------|-------------|------------|
| AA         | 4.5:1       | 3:1        |
| AAA        | 7:1         | 4.5:1      |

- "Normal Text" is text less than 18pt, or less than 14pt if bold
- "Large Text" is text 18pt or larger, or 14pt or larger if bold

## Usage Examples

### Basic Usage

```typescript
import { checkColorContrast } from '@/lib/accessibility/colorContrast';

// Check if black text on white background meets WCAG AA standards
const result = checkColorContrast('#000000', '#ffffff');
console.log(result);
// Output:
// {
//   ratio: 21,
//   passes: true,
//   foregroundColor: '#000000',
//   backgroundColor: '#ffffff'
// }
```

### Checking Against Different WCAG Levels

```typescript
// Check against WCAG AAA for normal text
const resultAAA = checkColorContrast('#777777', '#ffffff', { level: 'AAA' });
console.log(resultAAA.passes); // false

// Check against WCAG AA for large text
const resultLarge = checkColorContrast('#777777', '#ffffff', { level: 'AA', size: 'large' });
console.log(resultLarge.passes); // true
```

### Handling CSS Variables

```typescript
// Provide CSS variables mapping to resolve var() references
const cssVariables = {
  '--primary-color': '#0066cc',
  '--background-color': '#ffffff'
};

const result = checkColorContrast(
  'var(--primary-color)',
  'var(--background-color)',
  { cssVariables }
);

console.log(result.passes); // true
```

### Working with Transparency

```typescript
// Semi-transparent black on white background
const result = checkColorContrast('rgba(0, 0, 0, 0.5)', '#ffffff');
console.log(result.foregroundColor); // '#808080' (the effective blended color)
console.log(result.ratio); // ~3.95
console.log(result.passes); // false for AA normal, true for AA large
```

## API Reference

### Main Function

`checkColorContrast(foreground, background, options)`

Checks the contrast between two colors according to WCAG standards.

Parameters:
- `foreground` (string): The foreground color string
- `background` (string): The background color string
- `options` (object, optional):
  - `level` ('AA' | 'AAA', default: 'AA'): The WCAG level to check against
  - `size` ('normal' | 'large', default: 'normal'): The text size category
  - `cssVariables` (Record<string, string>, optional): CSS variables map for resolving var() references

Returns:
- An object containing:
  - `ratio` (number): The calculated contrast ratio
  - `passes` (boolean): Whether the contrast passes the specified WCAG level
  - `foregroundColor` (string): The resolved foreground color (as hex)
  - `backgroundColor` (string): The resolved background color (as hex)

### Helper Functions

The utility provides several helper functions that can be used independently:

- `parseColor(colorString, cssVariables?)`: Parses a color string into an RGB or RGBA object
- `calculateLuminance(color)`: Calculates the relative luminance of a color
- `calculateContrastRatio(fg, bg)`: Calculates the contrast ratio between two colors
- `meetsWCAGStandard(ratio, level?, size?)`: Checks if a contrast ratio meets WCAG standards
- `colorToHex(color)`: Converts an RGB or RGBA color to a hex string
- `blendColors(fg, bg)`: Blends a foreground RGBA color with a background RGB color
- `getWCAGRequirements()`: Returns a reference object with WCAG minimum contrast ratios

## Integration with Development Workflow

### In Component Development

When developing UI components, use the utility to validate color combinations:

```typescript
import { checkColorContrast } from '@/lib/accessibility/colorContrast';

// Before using color combinations in components
const { passes, ratio } = checkColorContrast(textColor, backgroundColor);
if (!passes) {
  console.warn(`Low contrast (${ratio.toFixed(2)}:1) between ${textColor} and ${backgroundColor}`);
}
```

### In Storybook

The color contrast utility can be integrated with Storybook for visual testing:

1. Add parameters to your stories to document the contrast checks
2. Use the `@storybook/addon-a11y` for automated accessibility checks

### Best Practices

1. Check contrast early in the design phase
2. Consider both normal and large text requirements
3. Test with both WCAG AA and AAA levels
4. Remember that transparent colors need to be tested against their actual backgrounds
5. Keep all text at AA level minimum, aim for AAA where possible

## Additional Resources

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyzer](https://developer.paciellogroup.com/resources/contrastanalyser/)