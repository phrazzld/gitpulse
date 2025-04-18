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
// Get variant-specific classes with interactive states
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

// Get size-specific classes
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

// Base button classes
const baseClasses = cn(
  "inline-flex items-center justify-center",
  "transition-colors duration-normal",
  "focus:outline-none focus:ring-2",
  "shadow-sm border",
);

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
