import React from "react";
import { cn } from "./utils/cn";

/**
 * Input component props interface
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Input value */
  value?: string;

  /** Input change handler */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  /** Placeholder text */
  placeholder?: string;

  /** Disables the input when true */
  disabled?: boolean;

  /** Input type (text, password, email, etc.) */
  type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date";

  /** Error message or error state */
  error?: string | boolean;

  /** Optional aria-label for accessibility */
  ariaLabel?: string;

  /** Size variant for visual styling */
  size?: "sm" | "md" | "lg";

  /** HTML size attribute (number of characters) */
  htmlSize?: number;

  /** Visual style variant */
  variant?: "outlined" | "filled";

  /** Error message text to display */
  errorMessage?: string;

  /** ID of element that describes this input */
  ariaDescribedby?: string;

  /** Whether the input is in read-only mode */
  readOnly?: boolean;
}

/**
 * Input component for form fields
 *
 * Uses Tailwind CSS classes for styling with CSS variables from tokens.css
 */
// Base input classes for all variants
const baseClasses = cn(
  "w-full",
  "transition-colors duration-normal",
  "focus:outline-none focus:ring-2",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
);

// Get variant-specific classes
const getVariantClasses = (variant: InputProps["variant"]) => {
  switch (variant) {
    case "filled":
      return cn(
        "bg-dark-slate/5 border-transparent",
        "hover:bg-dark-slate/10 focus:bg-true-white",
        "focus:border-electric-blue/50 focus:ring-electric-blue/50",
      );
    case "outlined":
    default:
      return cn(
        "bg-true-white border-dark-slate/30",
        "hover:border-dark-slate/50",
        "focus:border-electric-blue/50 focus:ring-electric-blue/50",
      );
  }
};

// Get size-specific classes
const getSizeClasses = (size: InputProps["size"]) => {
  switch (size) {
    case "sm":
      return "text-sm px-sm py-xs rounded-sm";
    case "lg":
      return "text-lg px-lg py-md rounded-lg";
    case "md":
    default:
      return "text-base px-md py-sm rounded";
  }
};

// Get error state classes
const getErrorClasses = (error?: string | boolean) => {
  return error
    ? cn(
        "border-crimson-red text-crimson-red placeholder-crimson-red/70",
        "focus:ring-crimson-red/50 focus:border-crimson-red",
      )
    : "";
};

// Get read-only state classes
const getReadOnlyClasses = (readOnly?: boolean) => {
  return readOnly ? "bg-dark-slate/5 cursor-default" : "";
};

// Get type-specific classes
const getTypeClasses = (type?: InputProps["type"]) => {
  switch (type) {
    case "password":
      return "font-mono tracking-wider";
    case "number":
      return "font-mono";
    case "search":
      return "pr-8"; // Space for search icon if needed
    case "date":
      return "font-mono";
    default:
      return "";
  }
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      disabled = false,
      readOnly = false,
      type = "text",
      error,
      errorMessage,
      ariaLabel,
      ariaDescribedby,
      size = "md",
      htmlSize,
      variant = "outlined",
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    // Generate a unique ID for the input if not provided
    const uniqueId = React.useId();
    const inputId = id || `input-${uniqueId}`;
    const errorId = errorMessage ? `error-${inputId}` : undefined;

    // Combine describedby with error ID if present
    const describedBy = cn(ariaDescribedby, errorId);

    // Apply classes based on component state and props
    const inputClasses = cn(
      baseClasses,
      getVariantClasses(variant),
      getSizeClasses(size),
      getTypeClasses(type),
      getErrorClasses(error),
      getReadOnlyClasses(readOnly),
      // Pass through any custom classes
      className,
    );

    return (
      <div className="flex flex-col w-full gap-1">
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          size={htmlSize}
          aria-invalid={!!error}
          aria-disabled={disabled}
          aria-readonly={readOnly}
          aria-label={ariaLabel}
          aria-describedby={describedBy || undefined}
          className={inputClasses}
          {...rest}
        />

        {/* Error message display */}
        {errorMessage && (
          <div id={errorId} className="text-crimson-red text-sm mt-1">
            {errorMessage}
          </div>
        )}
      </div>
    );
  },
);

// Display name for debugging and React DevTools
Input.displayName = "Input";

export { Input };
