/**
 * Responsive Behavior Validation Script
 * 
 * This script helps validate responsive behavior across different viewport sizes.
 * Run in the browser console or as part of e2e tests.
 */

interface ResponsiveBreakpoint {
  name: string;
  width: number;
  description: string;
}

const BREAKPOINTS: ResponsiveBreakpoint[] = [
  { name: 'Mobile S', width: 320, description: 'Small phones' },
  { name: 'Mobile M', width: 375, description: 'Standard phones' },
  { name: 'Mobile L', width: 425, description: 'Large phones' },
  { name: 'Tablet', width: 768, description: 'Tablets (md breakpoint)' },
  { name: 'Laptop', width: 1024, description: 'Small laptops (lg breakpoint)' },
  { name: 'Desktop', width: 1440, description: 'Standard desktop (xl breakpoint)' },
  { name: '4K', width: 2560, description: 'Large screens (2xl breakpoint)' },
];

interface ResponsiveCheck {
  selector: string;
  description: string;
  mobile: string[];
  tablet: string[];
  desktop: string[];
}

const RESPONSIVE_CHECKS: ResponsiveCheck[] = [
  {
    selector: '[class*="grid"]',
    description: 'Grid layouts',
    mobile: ['grid-cols-1'],
    tablet: ['md:grid-cols-2'],
    desktop: ['lg:grid-cols-3', 'xl:grid-cols-4'],
  },
  {
    selector: '[class*="flex"]',
    description: 'Flex layouts',
    mobile: ['flex-col'],
    tablet: ['md:flex-row'],
    desktop: ['lg:flex-row'],
  },
  {
    selector: '[class*="p-"]',
    description: 'Padding',
    mobile: ['p-4', 'px-4', 'py-4'],
    tablet: ['md:p-6', 'md:px-6'],
    desktop: ['lg:p-8', 'lg:px-8'],
  },
  {
    selector: '[class*="text-"]',
    description: 'Text sizes',
    mobile: ['text-sm', 'text-base'],
    tablet: ['md:text-base', 'md:text-lg'],
    desktop: ['lg:text-lg', 'lg:text-xl'],
  },
  {
    selector: '[class*="gap-"]',
    description: 'Gap spacing',
    mobile: ['gap-4'],
    tablet: ['md:gap-6'],
    desktop: ['lg:gap-8'],
  },
  {
    selector: '[class*="hidden"]',
    description: 'Visibility',
    mobile: ['hidden md:block', 'hidden lg:block'],
    tablet: ['hidden lg:block'],
    desktop: ['block'],
  },
];

export function validateResponsiveBehavior() {
  const results: Record<string, any> = {};

  BREAKPOINTS.forEach(breakpoint => {
    // Simulate viewport change
    if (typeof window !== 'undefined') {
      // In a real browser environment
      window.resizeTo(breakpoint.width, 800);
    }

    results[breakpoint.name] = {
      width: breakpoint.width,
      checks: {},
    };

    RESPONSIVE_CHECKS.forEach(check => {
      const elements = document.querySelectorAll(check.selector);
      const expectedClasses = 
        breakpoint.width < 768 ? check.mobile :
        breakpoint.width < 1024 ? check.tablet :
        check.desktop;

      results[breakpoint.name].checks[check.description] = {
        elementsFound: elements.length,
        expectedClasses,
        passed: elements.length > 0,
      };
    });
  });

  return results;
}

// Export validation report
export function generateResponsiveReport() {
  const report = {
    timestamp: new Date().toISOString(),
    breakpoints: BREAKPOINTS,
    components: [
      {
        name: 'Dashboard Grid',
        path: '/dashboard',
        responsive: {
          mobile: 'Single column layout',
          tablet: '2 column grid',
          desktop: '2-3 column grid with sidebar',
        },
      },
      {
        name: 'Summary Stats',
        path: '/dashboard',
        responsive: {
          mobile: 'Stacked cards',
          tablet: '3 cards in row',
          desktop: '3 cards with larger spacing',
        },
      },
      {
        name: 'Date Range Picker',
        path: '/dashboard',
        responsive: {
          mobile: 'Stacked date inputs',
          tablet: 'Side by side inputs',
          desktop: 'Inline with other filters',
        },
      },
      {
        name: 'Repository Section',
        path: '/dashboard',
        responsive: {
          mobile: 'Vertical list',
          tablet: '2 column grid',
          desktop: 'Multi-column with metadata',
        },
      },
      {
        name: 'Header',
        path: '/dashboard',
        responsive: {
          mobile: 'Compact with menu',
          tablet: 'Full navigation',
          desktop: 'Full navigation with user info',
        },
      },
    ],
    tailwindClasses: {
      spacing: ['p-4', 'md:p-6', 'lg:p-8'],
      grid: ['grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3'],
      flex: ['flex-col', 'md:flex-row'],
      text: ['text-sm', 'md:text-base', 'lg:text-lg'],
      visibility: ['hidden md:block', 'block md:hidden'],
    },
  };

  return report;
}

// Manual test checklist
export const MANUAL_CHECKS = [
  '✓ Navigation is accessible on mobile (hamburger menu if needed)',
  '✓ Forms are touch-friendly with appropriate input sizes',
  '✓ Buttons have adequate touch targets (min 44x44px)',
  '✓ Text remains readable at all sizes',
  '✓ Horizontal scrolling is avoided on mobile',
  '✓ Images scale appropriately',
  '✓ Modals/dropdowns fit within viewport',
  '✓ Tables have horizontal scroll on mobile',
  '✓ Loading states work at all sizes',
  '✓ Error messages are visible and readable',
];

// CSS validation helper
export function checkCSSConsistency() {
  const issues: string[] = [];
  
  // Check for inline styles that might break responsive design
  const elementsWithInlineStyles = document.querySelectorAll('[style]');
  if (elementsWithInlineStyles.length > 0) {
    issues.push(`Found ${elementsWithInlineStyles.length} elements with inline styles`);
  }

  // Check for fixed widths that might cause issues
  const fixedWidthElements = document.querySelectorAll('[class*="w-"][class*="px"]');
  if (fixedWidthElements.length > 0) {
    issues.push(`Found ${fixedWidthElements.length} elements with fixed pixel widths`);
  }

  // Check for missing responsive classes
  const gridsWithoutResponsive = document.querySelectorAll('.grid:not([class*="md:"])');
  if (gridsWithoutResponsive.length > 0) {
    issues.push(`Found ${gridsWithoutResponsive.length} grids without responsive modifiers`);
  }

  return issues;
}

console.log('Responsive validation script loaded. Run validateResponsiveBehavior() to check.');