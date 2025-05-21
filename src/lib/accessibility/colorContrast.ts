/**
 * Color Contrast Utility Module
 * 
 * This module provides utilities for calculating color contrast according to WCAG 2.1 standards.
 * It supports various color formats (hex, rgb, rgba, CSS variables) and provides functions for
 * calculating luminance and contrast ratios, and checking compliance with WCAG standards.
 * 
 * @module colorContrast
 */

/**
 * Represents an RGB color
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Represents an RGBA color with alpha channel
 */
export interface RGBA extends RGB {
  a: number; // 0-1
}

/**
 * Options for WCAG standard checking
 */
export interface WCAGOptions {
  /**
   * WCAG level to check against (AA or AAA)
   * @default 'AA'
   */
  level?: 'AA' | 'AAA';
  
  /**
   * Text size category for contrast requirements
   * @default 'normal'
   */
  size?: 'normal' | 'large';
  
  /**
   * CSS variables record for resolving variable references
   */
  cssVariables?: Record<string, string>;
}

/**
 * Results of a contrast check
 */
export interface ContrastResult {
  /**
   * The calculated contrast ratio
   */
  ratio: number;
  
  /**
   * Whether the contrast passes the specified WCAG level
   */
  passes: boolean;
  
  /**
   * The resolved foreground color (as hex)
   */
  foregroundColor: string;
  
  /**
   * The resolved background color (as hex)
   */
  backgroundColor: string;
}

const HEX_REGEX = /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
const RGB_REGEX = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
const RGBA_REGEX = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/;
const CSS_VAR_REGEX = /^var\(\s*(--[\w-]+)(?:\s*,\s*(.*))?\s*\)$/;

/**
 * Parses a color string into an RGB or RGBA object
 * 
 * Supports the following formats:
 * - Hex: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 * - RGB: rgb(r, g, b)
 * - RGBA: rgba(r, g, b, a)
 * - CSS Variables: var(--color-name), var(--color-name, fallback)
 * 
 * @param colorString - The color string to parse
 * @param cssVariables - Optional record of CSS variables for resolving var() references
 * @returns The parsed RGB or RGBA color, or null if parsing fails
 */
export function parseColor(
  colorString: string,
  cssVariables?: Record<string, string>
): RGB | RGBA | null {
  if (!colorString) return null;
  
  // Trim and convert to lowercase for consistent parsing
  const color = colorString.trim().toLowerCase();
  
  // Check if the color is a CSS variable
  const cssVarMatch = color.match(CSS_VAR_REGEX);
  if (cssVarMatch) {
    const varName = cssVarMatch[1];
    const fallback = cssVarMatch[2];
    
    // Try to resolve from cssVariables
    if (cssVariables && varName in cssVariables) {
      return parseColor(cssVariables[varName], cssVariables);
    }
    
    // Try fallback if available
    if (fallback) {
      return parseColor(fallback, cssVariables);
    }
    
    return null;
  }
  
  // Parse hex colors
  if (color.startsWith('#')) {
    if (!HEX_REGEX.test(color)) return null;

    let r = 0, g = 0, b = 0, a = 1;

    // Handle different hex formats
    if (color.length === 4) {
      // #RGB
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else if (color.length === 5) {
      // #RGBA
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
      a = parseInt(color[4] + color[4], 16) / 255;
    } else if (color.length === 7) {
      // #RRGGBB
      r = parseInt(color.substring(1, 3), 16);
      g = parseInt(color.substring(3, 5), 16);
      b = parseInt(color.substring(5, 7), 16);
    } else if (color.length === 9) {
      // #RRGGBBAA
      r = parseInt(color.substring(1, 3), 16);
      g = parseInt(color.substring(3, 5), 16);
      b = parseInt(color.substring(5, 7), 16);
      a = parseInt(color.substring(7, 9), 16) / 255;
    }

    return a < 1 ? { r, g, b, a } : { r, g, b };
  }
  
  // Parse rgb format
  const rgbMatch = color.match(RGB_REGEX);
  if (rgbMatch) {
    // Validate range - only allow 0-255
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);

    if (r > 255 || g > 255 || b > 255 || r < 0 || g < 0 || b < 0) {
      return null;
    }

    return { r, g, b };
  }
  
  // Parse rgba format
  const rgbaMatch = color.match(RGBA_REGEX);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a = parseFloat(rgbaMatch[4]);

    // Validate ranges - only allow valid values
    if (r > 255 || g > 255 || b > 255 || r < 0 || g < 0 || b < 0 || a < 0 || a > 1) {
      return null;
    }

    return a < 1 ? { r, g, b, a } : { r, g, b };
  }
  
  return null;
}

/**
 * Blends a foreground RGBA color with a background RGB color
 * 
 * @param fg - The foreground color
 * @param bg - The background color
 * @returns The blended RGB color
 */
export function blendColors(fg: RGBA, bg: RGB): RGB {
  // Simple alpha blending
  const alpha = fg.a;
  
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha))
  };
}

/**
 * Converts an RGB component (0-255) to its linear value using the WCAG formula
 *
 * @param colorComponent - The RGB component (0-255)
 * @returns The linearized component value
 */
function linearize(colorComponent: number): number {
  // Convert to 0-1 range
  const value = colorComponent / 255;

  // Apply the sRGB to linear conversion formula per WCAG 2.1
  // See: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
  if (value <= 0.03928) {
    return value / 12.92;
  } else {
    return Math.pow((value + 0.055) / 1.055, 2.4);
  }
}

/**
 * Calculates the relative luminance of a color according to WCAG 2.1
 * 
 * @param color - The color to calculate luminance for
 * @returns The relative luminance value (0-1)
 */
export function calculateLuminance(color: RGB | RGBA): number {
  // Convert RGB to linear values
  const r = linearize(color.r);
  const g = linearize(color.g);
  const b = linearize(color.b);
  
  // Calculate luminance using WCAG formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Converts an RGB or RGBA color to a hex string
 * 
 * @param color - The color to convert
 * @returns The hex string representation of the color
 */
export function colorToHex(color: RGB | RGBA): string {
  const r = color.r.toString(16).padStart(2, '0');
  const g = color.g.toString(16).padStart(2, '0');
  const b = color.b.toString(16).padStart(2, '0');
  
  if ('a' in color && color.a < 1) {
    const a = Math.round(color.a * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }
  
  return `#${r}${g}${b}`;
}

/**
 * Calculates the contrast ratio between two colors
 * 
 * @param fg - The foreground color
 * @param bg - The background color
 * @returns The contrast ratio (1-21)
 */
export function calculateContrastRatio(fg: RGB | RGBA, bg: RGB): number {
  // Handle RGBA by blending with background
  const foreground: RGB = 'a' in fg && fg.a < 1
    ? blendColors(fg as RGBA, bg)
    : fg;

  // Calculate luminance for both colors
  const fgLuminance = calculateLuminance(foreground);
  const bgLuminance = calculateLuminance(bg);

  // Sort luminances from light to dark
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  // Calculate contrast ratio using WCAG formula
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a contrast ratio meets WCAG standards
 * 
 * @param ratio - The contrast ratio to check
 * @param level - The WCAG level (AA or AAA)
 * @param size - The text size category
 * @returns Whether the contrast ratio passes the specified standards
 */
export function meetsWCAGStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  // WCAG 2.1 contrast requirements
  if (level === 'AA') {
    return size === 'normal' ? ratio >= 4.5 : ratio >= 3;
  } else {
    return size === 'normal' ? ratio >= 7 : ratio >= 4.5;
  }
}

/**
 * Checks the contrast between two colors according to WCAG standards
 * 
 * @param foreground - The foreground color string
 * @param background - The background color string
 * @param options - Options for the contrast check
 * @returns The contrast check result
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  options: WCAGOptions = {}
): ContrastResult {
  const { level = 'AA', size = 'normal', cssVariables } = options;
  
  // Parse colors
  const fgColor = parseColor(foreground, cssVariables);
  const bgColor = parseColor(background, cssVariables);
  
  // Validate inputs
  if (!fgColor) {
    throw new Error(`Invalid foreground color: ${foreground}`);
  }
  
  if (!bgColor) {
    throw new Error(`Invalid background color: ${background}`);
  }
  
  if ('a' in bgColor && bgColor.a < 1) {
    throw new Error('Background color must be fully opaque');
  }
  
  // Calculate contrast ratio
  const ratio = calculateContrastRatio(fgColor, bgColor as RGB);
  
  // Check if it meets WCAG standards
  const passes = meetsWCAGStandard(ratio, level, size);
  
  // Prepare effective colors for result
  const effectiveFgColor = 'a' in fgColor && fgColor.a < 1
    ? blendColors(fgColor as RGBA, bgColor as RGB)
    : fgColor;
  
  return {
    ratio,
    passes,
    foregroundColor: colorToHex(effectiveFgColor),
    backgroundColor: colorToHex(bgColor)
  };
}

/**
 * Returns a description of WCAG requirements for reference
 * 
 * @returns Object containing WCAG requirements
 */
export function getWCAGRequirements(): Record<string, Record<string, number>> {
  return {
    AA: {
      normal: 4.5,
      large: 3.0
    },
    AAA: {
      normal: 7.0,
      large: 4.5
    }
  };
}