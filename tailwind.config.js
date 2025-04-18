/**
 * Tailwind CSS Configuration
 * @type {import('tailwindcss').Config}
 *
 * This configuration extends Tailwind's default theme with our design tokens
 * defined in src/styles/tokens.css. This allows us to use Tailwind utility classes
 * while maintaining a consistent design language through our CSS variable system.
 */
module.exports = {
  // Specifies files to scan for class names (used for purging in production)
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      /**
       * Color System
       * Maps our CSS color variables to Tailwind color utilities
       * Uses HSL notation for better compatibility with CSS variables
       */
      colors: {
        // Base colors - Raw color values from our palette
        // Usage: text-dark-slate, bg-neon-green, etc.
        "dark-slate": "hsl(var(--dark-slate))",
        "neon-green": "hsl(var(--neon-green))",
        "electric-blue": "hsl(var(--electric-blue))",
        "luminous-yellow": "hsl(var(--luminous-yellow))",
        "crimson-red": "hsl(var(--crimson-red))",
        "true-black": "hsl(var(--true-black))",
        "true-white": "hsl(var(--true-white))",
        "slate-dark": "hsl(var(--slate-dark))",

        // Semantic colors - Functional colors for UI elements
        // Usage: text-primary, bg-background, border-error, etc.
        background: "hsl(var(--background))",
        "background-secondary": "hsl(var(--background-secondary))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        success: "hsl(var(--success))",
        info: "hsl(var(--info))",
      },

      /**
       * Spacing System
       * Maps our spacing tokens to Tailwind spacing utilities
       * Usage: p-md, m-lg, gap-xl, etc.
       */
      spacing: {
        xs: "var(--spacing-xs)", // 4px
        sm: "var(--spacing-sm)", // 8px
        md: "var(--spacing-md)", // 16px
        lg: "var(--spacing-lg)", // 24px
        xl: "var(--spacing-xl)", // 32px
        "2xl": "var(--spacing-2xl)", // 48px
        "3xl": "var(--spacing-3xl)", // 64px
      },

      /**
       * Border Radius System
       * Maps our radius tokens to Tailwind border-radius utilities
       * Usage: rounded-sm, rounded, rounded-full, etc.
       */
      borderRadius: {
        sm: "var(--radius-sm)", // 4px
        DEFAULT: "var(--radius-md)", // 6px (default when using just 'rounded')
        md: "var(--radius-md)", // 6px
        lg: "var(--radius-lg)", // 8px
        full: "var(--radius-full)", // 9999px (circular elements)
      },

      /**
       * Typography System
       * Maps our typography tokens to Tailwind typography utilities
       */

      // Font Family
      // Usage: font-mono
      fontFamily: {
        mono: "var(--font-family-mono)", // Roboto Mono, fallbacks
      },

      // Font Size
      // Usage: text-sm, text-lg, etc.
      fontSize: {
        xs: "var(--font-size-xs)", // 12px
        sm: "var(--font-size-sm)", // 14px
        base: "var(--font-size-md)", // 16px (alias for 'md')
        md: "var(--font-size-md)", // 16px
        lg: "var(--font-size-lg)", // 18px
        xl: "var(--font-size-xl)", // 20px
        "2xl": "var(--font-size-2xl)", // 24px
        "3xl": "var(--font-size-3xl)", // 28px
      },

      // Font Weight
      // Usage: font-normal, font-bold, etc.
      fontWeight: {
        normal: "var(--font-weight-normal)", // 400
        medium: "var(--font-weight-medium)", // 500
        bold: "var(--font-weight-bold)", // 700
      },

      // Line Height
      // Usage: leading-tight, leading-normal, etc.
      lineHeight: {
        tight: "var(--line-height-tight)", // 1.2
        normal: "var(--line-height-normal)", // 1.5
        relaxed: "var(--line-height-relaxed)", // 1.75
      },

      // Letter Spacing
      // Usage: tracking-tight, tracking-wider, etc.
      letterSpacing: {
        tighter: "var(--letter-spacing-tighter)", // -0.05em
        tight: "var(--letter-spacing-tight)", // -0.025em
        normal: "var(--letter-spacing-normal)", // 0
        wide: "var(--letter-spacing-wide)", // 0.025em
        wider: "var(--letter-spacing-wider)", // 0.05em
      },
    },
  },
  plugins: [],
};
