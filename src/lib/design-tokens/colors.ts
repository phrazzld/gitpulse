/**
 * GitPulse Design Token System - Colors
 * 
 * Centralized color definitions following atomic design principles and WCAG 2.1 AA standards.
 * All colors are sourced from approved color pairings with documented contrast ratios.
 * 
 * @see docs/accessibility/APPROVED_COLOR_PAIRINGS.md
 */

/**
 * Brand color palette - Core visual identity colors
 * These colors define the brand identity and should be used sparingly for accent and emphasis
 */
export const brandColors = {
  // Primary brand colors
  darkSlate: '#1b2b34',           // Main background color
  neonGreen: '#00ff87',           // Legacy brand green (use accessible variant for text)
  accessibleGreen: '#00994f',     // WCAG AA compliant green (3.51:1 large text, 7.54:1 inverted)
  electricBlue: '#2563eb',        // WCAG AA compliant blue (4.90:1 contrast)
  darkBlue: '#1a4bbd',           // High contrast blue (7.54:1 with white text)
  
  // Supporting colors
  luminousYellow: '#ffc857',      // Brand yellow (decorative use)
  accessibleYellow: '#a26100',   // WCAG AA yellow for text (4.69:1 contrast)
  crimsonRed: '#ff3b30',         // Brand red (decorative use)
  accessibleRed: '#c22f2f',     // WCAG AA red for text (5.32:1 contrast)
  
  // Neutral colors
  white: '#ffffff',              // Pure white for high contrast text
  black: '#000000',              // Pure black for maximum contrast
  lightGray: '#f8f9fa',         // Light background alternative
  darkGray: '#121212',          // Secondary dark background
} as const;

/**
 * Semantic color tokens - Intent-based color assignments
 * These tokens provide meaning and should be used for consistent user experience
 */
export const semanticColors = {
  // Primary semantic colors
  primary: brandColors.darkSlate,
  primaryText: brandColors.white,
  secondary: brandColors.electricBlue,
  secondaryText: brandColors.white,
  
  // State colors (all WCAG AA compliant)
  success: brandColors.accessibleGreen,    // 3.51:1 for large text
  successText: brandColors.white,
  warning: brandColors.accessibleYellow,   // 4.69:1 contrast ratio
  warningText: brandColors.darkSlate,
  error: brandColors.accessibleRed,        // 5.32:1 contrast ratio
  errorText: brandColors.white,
  info: brandColors.electricBlue,          // 4.90:1 contrast ratio
  infoText: brandColors.white,
  
  // Background colors
  background: brandColors.darkSlate,       // Primary background
  backgroundSecondary: brandColors.darkGray, // Secondary surfaces
  backgroundLight: brandColors.lightGray,  // Light theme background
  surface: brandColors.darkSlate,          // Card/panel backgrounds
  
  // Text colors
  textPrimary: brandColors.white,          // Primary text (13.82:1 contrast)
  textSecondary: brandColors.electricBlue, // Secondary text (4.90:1 contrast)
  textMuted: brandColors.accessibleGreen,  // Muted text (3.51:1 large text)
  textOnLight: brandColors.darkSlate,      // Text on light backgrounds (13.82:1)
  
  // Interactive colors
  link: brandColors.electricBlue,          // Link color (4.90:1 contrast)
  linkHover: brandColors.accessibleGreen,  // Link hover state
  linkActive: brandColors.luminousYellow,  // Link active state
  focus: brandColors.electricBlue,         // Focus ring color (3:1 minimum)
  
  // Border colors
  border: brandColors.electricBlue,        // Default border color
  borderMuted: brandColors.accessibleGreen, // Subtle borders
  borderStrong: brandColors.neonGreen,     // Emphasis borders
} as const;

/**
 * Component-specific color tokens
 * These tokens are designed for specific component patterns and use cases
 */
export const componentColors = {
  // Button color schemes (all WCAG AA compliant)
  button: {
    primary: {
      background: brandColors.darkBlue,     // 7.54:1 with white text
      text: brandColors.white,
      border: brandColors.darkBlue,
      hover: {
        background: brandColors.accessibleGreen, // 4.85:1 inverted contrast
        text: brandColors.darkSlate,
        border: brandColors.accessibleGreen,
      },
      focus: {
        ring: brandColors.electricBlue,     // 3:1 minimum focus contrast
        offset: brandColors.darkSlate,
      },
    },
    secondary: {
      background: brandColors.electricBlue, // 5.17:1 with white text
      text: brandColors.white,
      border: brandColors.electricBlue,
      hover: {
        background: brandColors.darkBlue,   // 7.54:1 contrast
        text: brandColors.white,
        border: brandColors.darkBlue,
      },
      focus: {
        ring: brandColors.accessibleGreen,  // 3:1 minimum focus contrast
        offset: brandColors.electricBlue,
      },
    },
    outline: {
      background: 'transparent',
      text: brandColors.electricBlue,       // 4.90:1 contrast on light
      border: brandColors.electricBlue,
      hover: {
        background: 'rgba(37, 99, 235, 0.1)', // Subtle hover background
        text: brandColors.darkBlue,         // Enhanced hover contrast
        border: brandColors.darkBlue,
      },
      focus: {
        ring: brandColors.electricBlue,
        offset: brandColors.lightGray,
      },
    },
    disabled: {
      background: '#e0e0e0',              // Disabled state
      text: '#9e9e9e',
      border: '#e0e0e0',
    },
  },
  
  // Form input colors
  input: {
    background: brandColors.darkSlate,
    text: brandColors.white,               // 13.82:1 contrast
    border: brandColors.electricBlue,     // Default border
    borderFocus: brandColors.accessibleGreen, // Focus border
    borderError: brandColors.accessibleRed,   // Error border
    placeholder: brandColors.electricBlue, // Placeholder text
    label: brandColors.accessibleGreen,    // Label color
  },
  
  // Status indicator colors
  status: {
    success: {
      background: brandColors.accessibleGreen,
      text: brandColors.white,
      border: brandColors.accessibleGreen,
    },
    warning: {
      background: brandColors.accessibleYellow,
      text: brandColors.darkSlate,         // 4.69:1 contrast
      border: brandColors.accessibleYellow,
    },
    error: {
      background: brandColors.accessibleRed,
      text: brandColors.white,             // 5.32:1 contrast
      border: brandColors.accessibleRed,
    },
    info: {
      background: brandColors.electricBlue,
      text: brandColors.white,             // 4.90:1 contrast
      border: brandColors.electricBlue,
    },
  },
  
  // Terminal/code display colors
  terminal: {
    background: '#0a0a0a',               // Darker than main background
    text: brandColors.accessibleGreen,   // Terminal text color
    prompt: brandColors.electricBlue,    // Command prompt color
    border: brandColors.electricBlue,
  },
  
  // Navigation colors
  navigation: {
    background: brandColors.darkSlate,
    text: brandColors.white,
    link: brandColors.electricBlue,
    linkActive: brandColors.accessibleGreen,
    linkHover: brandColors.neonGreen,
    border: brandColors.electricBlue,
  },
} as const;

/**
 * CSS Custom Property mappings
 * Maps design tokens to CSS custom properties for use in stylesheets
 */
export const cssVariables = {
  // Brand colors
  '--brand-dark-slate': brandColors.darkSlate,
  '--brand-neon-green': brandColors.neonGreen,
  '--brand-accessible-green': brandColors.accessibleGreen,
  '--brand-electric-blue': brandColors.electricBlue,
  '--brand-dark-blue': brandColors.darkBlue,
  '--brand-luminous-yellow': brandColors.luminousYellow,
  '--brand-accessible-yellow': brandColors.accessibleYellow,
  '--brand-crimson-red': brandColors.crimsonRed,
  '--brand-accessible-red': brandColors.accessibleRed,
  '--brand-white': brandColors.white,
  '--brand-black': brandColors.black,
  '--brand-light-gray': brandColors.lightGray,
  '--brand-dark-gray': brandColors.darkGray,
  
  // Semantic colors
  '--color-primary': semanticColors.primary,
  '--color-primary-text': semanticColors.primaryText,
  '--color-secondary': semanticColors.secondary,
  '--color-secondary-text': semanticColors.secondaryText,
  '--color-success': semanticColors.success,
  '--color-success-text': semanticColors.successText,
  '--color-warning': semanticColors.warning,
  '--color-warning-text': semanticColors.warningText,
  '--color-error': semanticColors.error,
  '--color-error-text': semanticColors.errorText,
  '--color-info': semanticColors.info,
  '--color-info-text': semanticColors.infoText,
  '--color-background': semanticColors.background,
  '--color-background-secondary': semanticColors.backgroundSecondary,
  '--color-background-light': semanticColors.backgroundLight,
  '--color-surface': semanticColors.surface,
  '--color-text-primary': semanticColors.textPrimary,
  '--color-text-secondary': semanticColors.textSecondary,
  '--color-text-muted': semanticColors.textMuted,
  '--color-text-on-light': semanticColors.textOnLight,
  '--color-link': semanticColors.link,
  '--color-link-hover': semanticColors.linkHover,
  '--color-link-active': semanticColors.linkActive,
  '--color-focus': semanticColors.focus,
  '--color-border': semanticColors.border,
  '--color-border-muted': semanticColors.borderMuted,
  '--color-border-strong': semanticColors.borderStrong,
} as const;

/**
 * Utility functions for working with design tokens
 */
export const colorUtils = {
  /**
   * Get a CSS custom property reference with fallback
   * @param token - The design token key
   * @param fallback - Fallback color value
   * @returns CSS custom property string with fallback
   */
  getCSSVar(token: keyof typeof cssVariables, fallback?: string): string {
    const customProp = cssVariables[token];
    return fallback ? `var(${token}, ${fallback})` : `var(${token})`;
  },
  
  /**
   * Get component color scheme
   * @param component - Component name
   * @param variant - Color variant
   * @returns Component color configuration
   */
  getComponentColors<T extends keyof typeof componentColors>(
    component: T
  ): typeof componentColors[T] {
    return componentColors[component];
  },
  
  /**
   * Check if a color meets WCAG AA standards (informational)
   * Note: For actual contrast checking, use the colorContrast.ts utility
   * @param colorName - Name of the color token
   * @returns Information about WCAG compliance
   */
  getAccessibilityInfo(colorName: string): {
    wcagCompliant: boolean;
    recommendedUse: string;
    contrastNote: string;
  } {
    // This is informational - actual contrast checking should use colorContrast.ts
    const accessibilityMap: Record<string, any> = {
      [brandColors.accessibleGreen]: {
        wcagCompliant: true,
        recommendedUse: 'Large text (18pt+) or graphics',
        contrastNote: '3.51:1 contrast ratio with light backgrounds',
      },
      [brandColors.electricBlue]: {
        wcagCompliant: true,
        recommendedUse: 'Normal text and interactive elements',
        contrastNote: '4.90:1 contrast ratio on light backgrounds',
      },
      [brandColors.darkBlue]: {
        wcagCompliant: true,
        recommendedUse: 'Backgrounds with white text',
        contrastNote: '7.54:1 contrast ratio with white text',
      },
      [brandColors.accessibleYellow]: {
        wcagCompliant: true,
        recommendedUse: 'Warning text on dark backgrounds',
        contrastNote: '4.69:1 contrast ratio',
      },
      [brandColors.accessibleRed]: {
        wcagCompliant: true,
        recommendedUse: 'Error text and indicators',
        contrastNote: '5.32:1 contrast ratio',
      },
    };
    
    return accessibilityMap[colorName] || {
      wcagCompliant: false,
      recommendedUse: 'Check docs/accessibility/APPROVED_COLOR_PAIRINGS.md',
      contrastNote: 'Verify contrast ratio before use',
    };
  },
};

/**
 * TypeScript utilities for type-safe color usage
 */
export type BrandColor = keyof typeof brandColors;
export type SemanticColor = keyof typeof semanticColors;
export type ComponentColorScheme = keyof typeof componentColors;
export type CSSVariable = keyof typeof cssVariables;

/**
 * Export all color definitions for easy importing
 */
export const colors = {
  brand: brandColors,
  semantic: semanticColors,
  components: componentColors,
  cssVars: cssVariables,
  utils: colorUtils,
} as const;

export default colors;