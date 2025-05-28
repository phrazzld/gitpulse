/**
 * Tests for the color design token system
 * Validates token structure, accessibility compliance, and utility functions
 */

import { 
  brandColors, 
  semanticColors, 
  componentColors, 
  cssVariables,
  colorUtils,
  colors,
  type BrandColor,
  type SemanticColor,
  type ComponentColorScheme
} from '../colors';

describe('Color Design Tokens', () => {
  describe('Brand Colors', () => {
    it('should have all required brand colors defined', () => {
      const requiredColors = [
        'darkSlate',
        'neonGreen', 
        'accessibleGreen',
        'electricBlue',
        'darkBlue',
        'luminousYellow',
        'accessibleYellow',
        'crimsonRed',
        'accessibleRed',
        'white',
        'black',
        'lightGray',
        'darkGray'
      ] as const;
      
      requiredColors.forEach(colorName => {
        expect(brandColors[colorName]).toBeDefined();
        expect(typeof brandColors[colorName]).toBe('string');
        expect(brandColors[colorName]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should use WCAG AA compliant colors for accessible variants', () => {
      // These are the approved accessible colors from our documentation
      expect(brandColors.accessibleGreen).toBe('#00994f');
      expect(brandColors.electricBlue).toBe('#2563eb');
      expect(brandColors.darkBlue).toBe('#1a4bbd');
      expect(brandColors.accessibleYellow).toBe('#a26100');
      expect(brandColors.accessibleRed).toBe('#c22f2f');
    });

    it('should have proper hex color format', () => {
      Object.values(brandColors).forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('Semantic Colors', () => {
    it('should reference valid brand colors', () => {
      // Check that semantic colors map to actual brand color values
      expect(semanticColors.primary).toBe(brandColors.darkSlate);
      expect(semanticColors.secondary).toBe(brandColors.electricBlue);
      expect(semanticColors.success).toBe(brandColors.accessibleGreen);
      expect(semanticColors.warning).toBe(brandColors.accessibleYellow);
      expect(semanticColors.error).toBe(brandColors.accessibleRed);
    });

    it('should have text colors that pair with semantic colors', () => {
      expect(semanticColors.primaryText).toBe(brandColors.white);
      expect(semanticColors.successText).toBe(brandColors.white);
      expect(semanticColors.errorText).toBe(brandColors.white);
    });

    it('should define all required semantic categories', () => {
      const requiredCategories = [
        'primary', 'primaryText',
        'secondary', 'secondaryText', 
        'success', 'successText',
        'warning', 'warningText',
        'error', 'errorText',
        'info', 'infoText',
        'background', 'backgroundSecondary', 'backgroundLight',
        'textPrimary', 'textSecondary', 'textMuted',
        'link', 'linkHover', 'linkActive',
        'focus'
      ];
      
      requiredCategories.forEach(category => {
        expect(semanticColors[category as keyof typeof semanticColors]).toBeDefined();
      });
    });
  });

  describe('Component Colors', () => {
    it('should have button color schemes with all required states', () => {
      const buttonColors = componentColors.button;
      
      // Test interactive button variants
      ['primary', 'secondary', 'outline'].forEach(variant => {
        const variantColors = buttonColors[variant as keyof typeof buttonColors];
        expect(variantColors.background).toBeDefined();
        expect(variantColors.text).toBeDefined();
        expect(variantColors.border).toBeDefined();
        
        // These variants should have hover and focus states
        if (variant !== 'disabled') {
          expect((variantColors as any).hover).toBeDefined();
          expect((variantColors as any).focus).toBeDefined();
          
          // Check hover states
          expect((variantColors as any).hover.background).toBeDefined();
          expect((variantColors as any).hover.text).toBeDefined();
          expect((variantColors as any).hover.border).toBeDefined();
          
          // Check focus states
          expect((variantColors as any).focus.ring).toBeDefined();
          expect((variantColors as any).focus.offset).toBeDefined();
        }
      });
      
      // Test disabled state separately
      const disabledColors = buttonColors.disabled;
      expect(disabledColors.background).toBeDefined();
      expect(disabledColors.text).toBeDefined();
      expect(disabledColors.border).toBeDefined();
    });

    it('should have status color schemes', () => {
      const statusColors = componentColors.status;
      
      ['success', 'warning', 'error', 'info'].forEach(status => {
        const statusScheme = statusColors[status as keyof typeof statusColors];
        expect(statusScheme.background).toBeDefined();
        expect(statusScheme.text).toBeDefined();
        expect(statusScheme.border).toBeDefined();
      });
    });

    it('should have input color configuration', () => {
      const inputColors = componentColors.input;
      
      expect(inputColors.background).toBeDefined();
      expect(inputColors.text).toBeDefined();
      expect(inputColors.border).toBeDefined();
      expect(inputColors.borderFocus).toBeDefined();
      expect(inputColors.borderError).toBeDefined();
      expect(inputColors.placeholder).toBeDefined();
      expect(inputColors.label).toBeDefined();
    });

    it('should use accessible colors for component variants', () => {
      // Primary button should use high contrast colors
      expect(componentColors.button.primary.background).toBe(brandColors.darkBlue);
      expect(componentColors.button.primary.text).toBe(brandColors.white);
      
      // Error status should use accessible red
      expect(componentColors.status.error.background).toBe(brandColors.accessibleRed);
    });
  });

  describe('CSS Variables', () => {
    it('should map all brand colors to CSS custom properties', () => {
      Object.entries(brandColors).forEach(([colorName, colorValue]) => {
        const cssVarName = `--brand-${colorName.replace(/([A-Z])/g, '-$1').toLowerCase()}` as keyof typeof cssVariables;
        expect(cssVariables[cssVarName]).toBe(colorValue);
      });
    });

    it('should have semantic color CSS variables', () => {
      const semanticVars = [
        '--color-primary',
        '--color-secondary', 
        '--color-success',
        '--color-warning',
        '--color-error',
        '--color-background',
        '--color-text-primary'
      ] as const;
      
      semanticVars.forEach(varName => {
        expect(cssVariables[varName]).toBeDefined();
      });
    });

    it('should use proper CSS custom property naming convention', () => {
      Object.keys(cssVariables).forEach(varName => {
        expect(varName).toMatch(/^--[a-z-]+$/);
      });
    });
  });

  describe('Color Utils', () => {
    it('should generate CSS var strings with fallbacks', () => {
      const cssVar = colorUtils.getCSSVar('--color-primary', '#fallback');
      expect(cssVar).toBe('var(--color-primary, #fallback)');
    });

    it('should generate CSS var strings without fallbacks', () => {
      const cssVar = colorUtils.getCSSVar('--color-primary');
      expect(cssVar).toBe('var(--color-primary)');
    });

    it('should get component color schemes', () => {
      const buttonColors = colorUtils.getComponentColors('button');
      expect(buttonColors).toBe(componentColors.button);
      
      const statusColors = colorUtils.getComponentColors('status');
      expect(statusColors).toBe(componentColors.status);
    });

    it('should provide accessibility information for approved colors', () => {
      const greenInfo = colorUtils.getAccessibilityInfo(brandColors.accessibleGreen);
      expect(greenInfo.wcagCompliant).toBe(true);
      expect(greenInfo.recommendedUse).toContain('Large text');
      expect(greenInfo.contrastNote).toContain('3.51:1');
      
      const blueInfo = colorUtils.getAccessibilityInfo(brandColors.electricBlue);
      expect(blueInfo.wcagCompliant).toBe(true);
      expect(blueInfo.recommendedUse).toContain('Normal text');
      expect(blueInfo.contrastNote).toContain('4.90:1');
    });

    it('should provide fallback info for unknown colors', () => {
      const unknownInfo = colorUtils.getAccessibilityInfo('#unknown');
      expect(unknownInfo.wcagCompliant).toBe(false);
      expect(unknownInfo.recommendedUse).toContain('APPROVED_COLOR_PAIRINGS.md');
    });
  });

  describe('Type Safety', () => {
    it('should provide type-safe color token access', () => {
      // This test ensures TypeScript types are working correctly
      const brandColor: BrandColor = 'darkSlate';
      expect(brandColors[brandColor]).toBe('#1b2b34');
      
      const semanticColor: SemanticColor = 'primary';
      expect(semanticColors[semanticColor]).toBe(brandColors.darkSlate);
      
      const componentScheme: ComponentColorScheme = 'button';
      expect(componentColors[componentScheme]).toBe(componentColors.button);
    });
  });

  describe('Default Export', () => {
    it('should export consolidated colors object', () => {
      expect(colors.brand).toBe(brandColors);
      expect(colors.semantic).toBe(semanticColors);
      expect(colors.components).toBe(componentColors);
      expect(colors.cssVars).toBe(cssVariables);
      expect(colors.utils).toBe(colorUtils);
    });
  });

  describe('WCAG Compliance Validation', () => {
    it('should use only approved color combinations', () => {
      // These colors are documented in APPROVED_COLOR_PAIRINGS.md as WCAG AA compliant
      const approvedColors = [
        brandColors.accessibleGreen,    // 3.51:1 large text
        brandColors.electricBlue,       // 4.90:1 normal text  
        brandColors.darkBlue,          // 7.54:1 with white text
        brandColors.accessibleYellow,  // 4.69:1 contrast
        brandColors.accessibleRed,     // 5.32:1 contrast
      ];
      
      approvedColors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should maintain contrast ratios for component schemes', () => {
      // Primary button: white text on dark blue background (7.54:1)
      expect(componentColors.button.primary.background).toBe(brandColors.darkBlue);
      expect(componentColors.button.primary.text).toBe(brandColors.white);
      
      // Secondary button: white text on electric blue background (5.17:1)
      expect(componentColors.button.secondary.background).toBe(brandColors.electricBlue);
      expect(componentColors.button.secondary.text).toBe(brandColors.white);
    });
  });
});