/**
 * GitPulse Design Token System
 * 
 * Centralized design tokens for consistent, accessible design across the application.
 * 
 * @example
 * ```typescript
 * import { colors } from '@/lib/design-tokens';
 * 
 * // Use semantic colors
 * const primaryColor = colors.semantic.primary;
 * 
 * // Use component color schemes  
 * const buttonColors = colors.components.button.primary;
 * 
 * // Generate CSS custom properties
 * const cssVar = colors.utils.getCSSVar('--color-primary');
 * ```
 */

export { 
  colors,
  brandColors,
  semanticColors, 
  componentColors,
  cssVariables,
  colorUtils,
  type BrandColor,
  type SemanticColor,
  type ComponentColorScheme,
  type CSSVariable
} from './colors';

// Re-export the default colors object for convenience
export { default } from './colors';