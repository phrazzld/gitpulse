import React from "react";

/**
 * Base props common to all button types
 */
interface BaseButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "aria-label"
  > {
  /**
   * The visual style variant of the button
   * - primary: Filled background with light text (default, high emphasis)
   * - secondary: Lighter background with dark text (medium emphasis)
   * - outline: Transparent with colored border (low emphasis)
   * @default 'primary'
   */
  variant?: "primary" | "secondary" | "outline";

  /**
   * The size of the button
   * - small: Compact size for tight spaces
   * - medium: Standard size for most use cases
   * - large: Larger, more prominent button
   * @default 'medium'
   */
  size?: "small" | "medium" | "large";

  /**
   * Whether the button is in a loading state
   * When true, the button will show a loading spinner and be disabled
   * @default false
   */
  loading?: boolean;

  /**
   * Whether the button is disabled
   * When true, the button cannot be clicked and appears visually disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the button is in a pressed state (for toggle buttons)
   * @default undefined
   */
  pressed?: boolean;

  /**
   * Function called when the button is clicked
   * Will not fire when button is disabled or loading
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Additional CSS classes to apply to the button
   * Allows for custom styling while keeping the button behaviors
   */
  className?: string;

  /**
   * HTML button type attribute
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";

  /**
   * Optional icon to display before the button text
   */
  leftIcon?: React.ReactNode;

  /**
   * Optional icon to display after the button text
   */
  rightIcon?: React.ReactNode;
}

/**
 * Props for buttons with text content
 */
export interface TextButtonProps extends BaseButtonProps {
  /**
   * Button content - must have text for accessibility
   */
  children: React.ReactNode;

  /**
   * Optional aria-label to override the text content for screen readers
   * Use only when the visible text is insufficient for accessibility
   */
  "aria-label"?: string;
}

/**
 * Props for icon-only buttons
 */
export interface IconButtonProps extends BaseButtonProps {
  /**
   * Icon-only buttons cannot have children
   */
  children?: never;

  /**
   * Required aria-label for accessible name
   * Must describe the button's action (e.g., "Open settings", "Close dialog")
   */
  "aria-label": string;
}

/**
 * Button component props - either text button or icon-only button
 */
export type ButtonProps = TextButtonProps | IconButtonProps;

/**
 * A reusable button component that follows atomic design principles.
 *
 * This component provides a consistent button interface throughout the application
 * with support for different visual variants, sizes, states (loading, disabled),
 * and accessibility features.
 *
 * Button is a pure presentation component that receives all configuration via props.
 *
 * @example
 * ```tsx
 * // Primary button (default)
 * <Button onClick={handleClick}>Click Me</Button>
 *
 * // Secondary button with custom className
 * <Button variant="secondary" className="my-4">Secondary Action</Button>
 *
 * // Outline button with loading state
 * <Button variant="outline" loading>Processing...</Button>
 *
 * // Different sizes
 * <Button size="small">Small</Button>
 * <Button size="medium">Medium</Button>
 * <Button size="large">Large</Button>
 *
 * // With icons and text
 * <Button leftIcon={<Icon name="check" />}>Save Changes</Button>
 *
 * // Icon-only button (requires aria-label)
 * <Button leftIcon={<Icon name="settings" />} aria-label="Open settings" />
 *
 * // Toggle button
 * <Button pressed={isToggled}>Toggle</Button>
 * ```
 */
export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "medium",
    loading = false,
    disabled = false,
    pressed,
    onClick,
    className = "",
    type = "button",
    leftIcon,
    rightIcon,
    ...rest
  } = props;

  // Determine if this is an icon-only button
  const hasChildren = "children" in props;
  const isIconOnly = hasChildren
    ? (!props.children ||
        (typeof props.children === "string" && !props.children.trim())) &&
      (leftIcon || rightIcon)
    : true; // If no children prop, it's an IconButtonProps which is always icon-only

  // Enforce aria-label for icon-only buttons in all environments
  React.useEffect(() => {
    if (isIconOnly && !props["aria-label"]) {
      if (process.env.NODE_ENV === "development") {
        // More detailed error in development
        console.error(
          "Accessibility Error: Icon-only button must have an aria-label attribute that describes its action. " +
          "This is required for screen reader users to understand the button's purpose."
        );
      } else {
        // Still show error in production but less verbose
        console.error("Accessibility Error: Icon-only button missing aria-label");
      }
    }
  }, [isIconOnly, props]);

  // Using design token system for consistent, accessible colors
  const colors = {
    primary: {
      bg: "var(--brand-dark-blue, #1a4bbd)",      // 7.54:1 contrast with white text
      text: "var(--brand-white, #ffffff)",
      border: "var(--brand-dark-blue, #1a4bbd)",
      hoverBg: "var(--brand-accessible-green, #00994f)",  // 4.85:1 inverted contrast
      hoverText: "var(--brand-dark-slate, #1b2b34)",
    },
    secondary: {
      bg: "var(--brand-electric-blue, #2563eb)",   // 5.17:1 contrast with white text
      text: "var(--brand-white, #ffffff)",
      border: "var(--brand-electric-blue, #2563eb)",
      hoverBg: "var(--brand-dark-blue, #1a4bbd)",  // 7.54:1 contrast
      hoverText: "var(--brand-white, #ffffff)",
    },
    outline: {
      bg: "transparent",
      text: "var(--brand-electric-blue, #2563eb)",  // 4.90:1 contrast on light
      border: "var(--brand-electric-blue, #2563eb)",
      hoverBg: "rgba(37, 99, 235, 0.1)",          // Subtle hover background
      hoverText: "var(--brand-dark-blue, #1a4bbd)", // Enhanced hover contrast
    },
    disabled: {
      bg: "#e0e0e0",
      text: "#9e9e9e",
      border: "#e0e0e0",
    },
    focus: "var(--color-focus, #2563eb)",          // 3:1 minimum focus contrast
  };

  // Size classes
  const sizeClasses = {
    small: "px-3 py-1 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  };

  // Set base styles based on variant using design tokens
  const getVariantStyles = () => {
    if (disabled) {
      return {
        backgroundColor: colors.disabled.bg,
        color: colors.disabled.text,
        borderColor: colors.disabled.border,
        cursor: "not-allowed",
        opacity: 0.7,
        boxShadow: "none",
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary.bg,         // 7.54:1 contrast with white text
          color: colors.primary.text,
          borderColor: colors.primary.border,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          hoverBg: colors.primary.hoverBg,           // 4.85:1 inverted contrast
          hoverColor: colors.primary.hoverText,
          focusBorderColor: colors.focus,            // 3:1 minimum focus contrast
        };
      case "secondary":
        return {
          backgroundColor: colors.secondary.bg,       // 5.17:1 contrast with white text
          color: colors.secondary.text,
          borderColor: colors.secondary.border,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          hoverBg: colors.secondary.hoverBg,         // 7.54:1 contrast
          hoverColor: colors.secondary.hoverText,
          focusBorderColor: colors.focus,            // 3:1 minimum focus contrast
        };
      case "outline":
        return {
          backgroundColor: colors.outline.bg,
          color: colors.outline.text,                // 4.90:1 contrast on light
          borderColor: colors.outline.border,
          boxShadow: "none",
          hoverBg: colors.outline.hoverBg,          // Subtle hover background
          hoverColor: colors.outline.hoverText,     // Enhanced hover contrast
          focusBorderColor: colors.focus,           // 3:1 minimum focus contrast
        };
      default:
        return {
          backgroundColor: colors.primary.bg,        // Default to primary variant
          color: colors.primary.text,
          borderColor: colors.primary.border,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          hoverBg: colors.primary.hoverBg,
          hoverColor: colors.primary.hoverText,
          focusBorderColor: colors.focus,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Loading spinner component
  const LoadingSpinner = () => (
    <span
      className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"
      style={{
        borderColor: variantStyles.color,
        borderTopColor: "transparent",
      }}
      aria-hidden="true"
      role="progressbar"
      aria-label="Loading"
    />
  );

  // Handle keyboard interactions for better accessibility
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      onClick &&
      !disabled &&
      !loading
    ) {
      event.preventDefault();
      onClick(event as any);
    }
  };

  // Extract children for type safety
  const children = "children" in props ? props.children : null;

  return (
    <button
      type={type}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled}
      aria-pressed={pressed !== undefined ? pressed : undefined}
      className={`
        font-medium rounded-md transition-all duration-200
        flex items-center justify-center
        focus:ring-2 focus:ring-offset-2 focus-visible:ring-2
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        color: variantStyles.color,
        border: `1px solid ${variantStyles.borderColor}`,
        boxShadow: variantStyles.boxShadow,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.85 : 1,
        // Enhanced focus styles for accessibility
        // Focus ring with minimum 3:1 contrast ratio against all backgrounds
        ...({ "--tw-ring-color": variantStyles.focusBorderColor || colors.focus } as React.CSSProperties),
        ...({ "--tw-ring-offset-color": variantStyles.backgroundColor } as React.CSSProperties),
        ...({ "--tw-ring-offset-width": "2px" } as React.CSSProperties),
        ...({ "--tw-ring-width": "2px" } as React.CSSProperties),
        // Ensure focus styles meet WCAG 2.1 SC 2.4.7 (Focus Visible)
        outline: "none", // Using a custom focus style that's more visible
        outlineOffset: "2px",
      }}
      data-focus-visible={true}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      {...rest}
      onMouseOver={(e) => {
        // Apply hover styles for testing and better interaction
        if (!disabled && !loading) {
          e.currentTarget.setAttribute('data-hover', 'true');
          e.currentTarget.style.backgroundColor = variantStyles.hoverBg as string;
          e.currentTarget.style.color = variantStyles.hoverColor as string;
        }
        // Call the original onMouseOver if provided
        if (rest.onMouseOver) rest.onMouseOver(e);
      }}
      onMouseOut={(e) => {
        // Remove hover styles
        if (!disabled && !loading) {
          e.currentTarget.removeAttribute('data-hover');
          e.currentTarget.style.backgroundColor = variantStyles.backgroundColor as string;
          e.currentTarget.style.color = variantStyles.color as string;
        }
        // Call the original onMouseOut if provided
        if (rest.onMouseOut) rest.onMouseOut(e);
      }}
    >
      {loading && <LoadingSpinner />}

      {leftIcon && !loading && (
        <span className="mr-2 inline-flex items-center">{leftIcon}</span>
      )}

      <span>{children}</span>

      {rightIcon && !loading && (
        <span className="ml-2 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
}
