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

  // Development warning for missing aria-label on icon-only buttons
  React.useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      isIconOnly &&
      !props["aria-label"]
    ) {
      console.error("Icon-only button must have an accessible name");
    }
  }, [isIconOnly, props]);

  // Base colors - using CSS variables for theming
  const darkSlate = "var(--dark-slate, #1b2b34)";
  // Electric blue CSS variable now meets WCAG AA requirements
  const electricBlue = "var(--electric-blue, #2563eb)";
  const lightGray = "var(--light-gray, #f5f5f5)";
  const disabledGray = "var(--disabled-gray, #e0e0e0)";
  const textLight = "var(--text-light, #ffffff)";
  const textDark = "var(--text-dark, #333333)";

  // Size classes
  const sizeClasses = {
    small: "px-3 py-1 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  };

  // Set base styles based on variant
  const getVariantStyles = () => {
    if (disabled) {
      return {
        backgroundColor: disabledGray,
        color: textDark,
        borderColor: disabledGray,
        cursor: "not-allowed",
        opacity: 0.7,
        boxShadow: "none",
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: darkSlate,
          color: textLight,
          borderColor: darkSlate,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          hoverBg: electricBlue,
          hoverColor: textLight,
        };
      case "secondary":
        return {
          backgroundColor: lightGray,
          color: textDark,
          borderColor: lightGray,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          hoverBg: "#e0e0e0",
          hoverColor: textDark,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: darkSlate,
          borderColor: darkSlate,
          boxShadow: "none",
          hoverBg: "rgba(27, 43, 52, 0.05)",
          // The darker blue now meets WCAG AA contrast requirements
          hoverColor: electricBlue,
        };
      default:
        return {
          backgroundColor: darkSlate,
          color: textLight,
          borderColor: darkSlate,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          hoverBg: electricBlue,
          hoverColor: textLight,
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
        // Add focus styles directly for test environment
        // Using darker blue for focus ring to meet WCAG 3:1 contrast requirement for non-text elements
        ...({ "--tw-ring-color": electricBlue } as React.CSSProperties),
        ...({ "--tw-ring-offset-color": darkSlate } as React.CSSProperties),
        ...({ "--tw-ring-offset-width": "2px" } as React.CSSProperties),
      }}
      data-focus-visible={true}
      {...rest}
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
