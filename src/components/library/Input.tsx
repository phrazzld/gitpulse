import React from "react";
import { cn } from "./utils/cn";

/**
 * Input component props interface
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input value */
  value?: string;

  /** Input change handler */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  /** Placeholder text */
  placeholder?: string;

  /** Disables the input when true */
  disabled?: boolean;

  /** Input type (text, password, email, etc.) */
  type?: string;

  /** Error message or error state */
  error?: string | boolean;

  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * Input component for form fields
 *
 * Uses Tailwind CSS classes for styling with CSS variables from tokens.css
 */
// Base input classes
const baseClasses = cn(
  "w-full px-md py-sm",
  "text-base font-medium rounded",
  "transition-colors duration-normal",
  "focus:outline-none focus:ring-2 focus:ring-electric-blue/50",
  "border bg-true-white text-dark-slate border-dark-slate/30",
);

// Get error state classes
const getErrorClasses = (error?: string | boolean) => {
  return error
    ? "border-crimson-red focus:ring-crimson-red/50"
    : "hover:border-dark-slate/50";
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      disabled = false,
      type = "text",
      error,
      ariaLabel,
      className,
      ...rest
    },
    ref,
  ) => {
    // Apply classes based on component state and props
    const inputClasses = cn(
      baseClasses,
      getErrorClasses(error),
      // Disabled styling
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      // Pass through any custom classes
      className,
    );

    return (
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-disabled={disabled}
        aria-label={ariaLabel}
        className={inputClasses}
        {...rest}
      />
    );
  },
);

// Display name for debugging and React DevTools
Input.displayName = "Input";

export { Input };
