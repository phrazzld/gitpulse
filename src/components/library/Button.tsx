import React from "react";
import { cn } from "./utils/cn";

/**
 * Button component props interface
 *
 * This interface extends the standard HTML button attributes and adds
 * properties specific to our design system. The Button component
 * supports multiple variants, sizes, and states.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Content to render inside the button.
   * Can be text, icons, or other React elements.
   */
  children: React.ReactNode;

  /**
   * Button click handler function.
   * Called when the button is clicked if not disabled.
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;

  /**
   * Disables the button when true.
   * Disabled buttons don't respond to click events and show a visual indicator.
   * @default false
   */
  disabled?: boolean;

  /**
   * Visual style variant of the button.
   * - primary: Default green button for main actions
   * - secondary: Neutral button for secondary actions
   * - danger: Red button for destructive actions
   * @default "primary"
   */
  variant?: "primary" | "secondary" | "danger";

  /**
   * Button size variant.
   * - sm: Small button with less padding
   * - md: Medium-sized button (default)
   * - lg: Large button with more padding
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * HTML button type attribute.
   * - button: Regular button (default)
   * - submit: Form submission button
   * - reset: Form reset button
   * @default "button"
   */
  type?: "button" | "submit" | "reset";
}

/**
 * Button component for actions and form submissions
 *
 * A flexible button component that adapts to different use cases
 * through variants and sizes. Supports all standard button HTML attributes
 * plus custom styling options.
 *
 * Uses Tailwind CSS classes for styling with CSS variables from tokens.css.
 *
 * @example
 * // Primary button
 * <Button onClick={handleClick}>Submit</Button>
 *
 * @example
 * // Secondary small button
 * <Button variant="secondary" size="sm">Cancel</Button>
 *
 * @example
 * // Danger button for destructive actions
 * <Button variant="danger">Delete</Button>
 */

/**
 * Gets Tailwind CSS classes specific to the button variant
 *
 * Handles different visual styles including background color,
 * text color, border color, and interactive states (hover, focus, active).
 *
 * @param variant - The button variant ("primary", "secondary", or "danger")
 * @returns A string of Tailwind CSS classes
 */
const getVariantClasses = (variant: ButtonProps["variant"]) => {
  switch (variant) {
    case "secondary":
      return cn(
        "bg-true-white text-dark-slate border-dark-slate/30",
        "hover:bg-dark-slate/5 focus:ring-electric-blue/50",
        "active:bg-dark-slate/10",
      );
    case "danger":
      return cn(
        "bg-true-white text-crimson-red border-crimson-red/30",
        "hover:bg-crimson-red/5 focus:ring-crimson-red/50",
        "active:bg-crimson-red/10",
      );
    case "primary":
    default:
      return cn(
        "bg-neon-green text-dark-slate border-transparent",
        "hover:bg-neon-green/90 focus:ring-neon-green/50",
        "active:bg-neon-green/80",
      );
  }
};

/**
 * Gets Tailwind CSS classes specific to the button size
 *
 * Controls text size, padding, font weight, and border radius
 * based on the selected size variant.
 *
 * @param size - The button size ("sm", "md", or "lg")
 * @returns A string of Tailwind CSS classes
 */
const getSizeClasses = (size: ButtonProps["size"]) => {
  switch (size) {
    case "sm":
      return "text-sm px-sm py-xs font-medium rounded-sm";
    case "lg":
      return "text-lg px-lg py-md font-bold rounded-lg";
    case "md":
    default:
      return "text-base px-md py-sm font-medium rounded";
  }
};

/**
 * Base Tailwind CSS classes applied to all button variants
 *
 * These classes handle the common styling aspects:
 * - Flexbox layout for content alignment
 * - Transition effects for smooth interactions
 * - Focus styles for accessibility
 * - Border and shadow styling
 */
const baseClasses = cn(
  "inline-flex items-center justify-center",
  "transition-colors duration-normal",
  "focus:outline-none focus:ring-2",
  "shadow-sm border",
);

/**
 * Button component implementation using React.forwardRef
 *
 * The component accepts a ref that will be forwarded to the underlying
 * HTML button element, allowing parent components to interact with the
 * DOM node directly when needed.
 *
 * @param props - Button component props
 * @param ref - Forwarded ref to the underlying HTML button element
 * @returns A styled button component
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      onClick,
      disabled = false,
      variant = "primary",
      size = "md",
      type = "button",
      className,
      ...rest
    },
    ref,
  ) => {
    // Apply classes based on component state and props
    const buttonClasses = cn(
      baseClasses,
      getVariantClasses(variant),
      getSizeClasses(size),
      // Disabled styling
      disabled &&
        "opacity-50 cursor-not-allowed hover:bg-opacity-100 pointer-events-none",
      // Pass through any custom classes
      className,
    );

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
        className={buttonClasses}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

// Display name for debugging and React DevTools
Button.displayName = "Button";

export { Button };
