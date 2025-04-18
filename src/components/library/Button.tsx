import React from "react";
import { cn } from "./utils/cn";

/**
 * Button component props interface
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Content to render inside the button */
  children: React.ReactNode;

  /** Button click handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;

  /** Disables the button when true */
  disabled?: boolean;

  /** Visual style variant */
  variant?: "primary" | "secondary" | "danger";

  /** Button size */
  size?: "sm" | "md" | "lg";

  /** HTML button type attribute */
  type?: "button" | "submit" | "reset";
}

/**
 * Button component for actions and form submissions
 *
 * Uses Tailwind CSS classes for styling with CSS variables from tokens.css
 */
// Get variant-specific classes
const getVariantClasses = (variant: ButtonProps["variant"]) => {
  switch (variant) {
    case "secondary":
      return "bg-white text-gray-700 border-gray-300";
    case "danger":
      return "bg-white text-red-600 border-red-600";
    case "primary":
    default:
      return "bg-gray-100 text-gray-900";
  }
};

// Get size-specific classes
const getSizeClasses = (size: ButtonProps["size"]) => {
  switch (size) {
    case "sm":
      return "text-sm px-2 py-1";
    case "lg":
      return "text-lg px-4 py-2";
    case "md":
    default:
      return "text-base px-3 py-2";
  }
};

// Base button classes
const baseClasses =
  "inline-flex items-center justify-center font-medium rounded focus:outline-none focus:ring-2 focus-visible:ring-2 transition-colors border";

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
      // Basic disabled styling
      disabled && "opacity-50 cursor-not-allowed",
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
