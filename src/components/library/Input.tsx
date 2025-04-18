import React from "react";
import { cn } from "./utils/cn";

/**
 * Input component props interface
 *
 * This interface extends the standard HTML input attributes (excluding size)
 * and adds properties specific to our design system.
 *
 * The omission of the HTML "size" attribute is to avoid a naming conflict
 * with our custom size prop. Instead, we provide the htmlSize prop to
 * access the HTML size attribute when needed.
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Current value of the input field.
   * This can be controlled by the parent component.
   */
  value?: string;

  /**
   * Handler function called when the input value changes.
   * Receives a React.ChangeEvent object containing the new value.
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  /**
   * Placeholder text displayed when the input is empty.
   * Should provide a hint about the expected input format.
   */
  placeholder?: string;

  /**
   * Disables the input when true.
   * Disabled inputs don't accept focus or input and have a visual indicator.
   * @default false
   */
  disabled?: boolean;

  /**
   * Input type that determines the data format and validation.
   * Supports common HTML input types like text, password, email, etc.
   * @default "text"
   */
  type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date";

  /**
   * Indicates that input has an error.
   * Can be a boolean or a string (for backward compatibility).
   * Use errorMessage prop for displaying the error message.
   */
  error?: string | boolean;

  /**
   * ARIA label for accessibility when no visible label is present.
   * Provides a text alternative for screen readers.
   */
  ariaLabel?: string;

  /**
   * Size variant for visual styling.
   * Controls the input's padding, font size, and border radius.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * HTML size attribute (number of characters).
   * This replaces the standard HTML size attribute since we
   * use "size" for our custom size variants.
   */
  htmlSize?: number;

  /**
   * Visual style variant of the input.
   * - outlined: Input with border (default)
   * - filled: Input with background fill
   * @default "outlined"
   */
  variant?: "outlined" | "filled";

  /**
   * Error message text to display below the input.
   * Only displayed when error prop is true or a string.
   */
  errorMessage?: string;

  /**
   * ID of element that describes this input.
   * Used for accessibility to associate descriptive text with the input.
   */
  ariaDescribedby?: string;

  /**
   * Whether the input is in read-only mode.
   * Read-only inputs can't be modified but are still focusable.
   * @default false
   */
  readOnly?: boolean;
}

/**
 * Input component for form fields
 *
 * A flexible input component that adapts to different use cases through
 * variants, sizes, and states. Supports all standard HTML input attributes
 * plus custom styling options and accessibility features.
 *
 * Uses Tailwind CSS classes for styling with CSS variables from tokens.css.
 *
 * @example
 * // Basic usage
 * <Input value={value} onChange={handleChange} placeholder="Enter text" />
 *
 * @example
 * // Input with error state
 * <Input
 *   value={email}
 *   onChange={handleEmailChange}
 *   type="email"
 *   error={!isValidEmail}
 *   errorMessage="Please enter a valid email address"
 * />
 *
 * @example
 * // Filled variant with large size
 * <Input variant="filled" size="lg" placeholder="Search..." type="search" />
 */

/**
 * Base Tailwind CSS classes applied to all input variants
 *
 * These classes handle the common styling aspects that apply
 * regardless of variant or state:
 * - Width and layout
 * - Transition effects
 * - Focus state
 * - Disabled state styling
 */
const baseClasses = cn(
  "w-full",
  "transition-colors duration-normal",
  "focus:outline-none focus:ring-2",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
);

/**
 * Gets Tailwind CSS classes specific to the input variant
 *
 * Handles different visual styles including background color,
 * border styles, and interactive state changes.
 *
 * @param variant - The input variant ("outlined" or "filled")
 * @returns A string of Tailwind CSS classes
 */
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

/**
 * Gets Tailwind CSS classes specific to the input size
 *
 * Controls text size, padding, and border radius based on the
 * selected size variant.
 *
 * @param size - The input size ("sm", "md", or "lg")
 * @returns A string of Tailwind CSS classes
 */
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

/**
 * Gets Tailwind CSS classes for the error state
 *
 * Applies error-specific styling like red border and text
 * when the input has an error.
 *
 * @param error - The error state (boolean or string)
 * @returns A string of Tailwind CSS classes or empty string if no error
 */
const getErrorClasses = (error?: string | boolean) => {
  return error
    ? cn(
        "border-crimson-red text-crimson-red placeholder-crimson-red/70",
        "focus:ring-crimson-red/50 focus:border-crimson-red",
      )
    : "";
};

/**
 * Gets Tailwind CSS classes for read-only state
 *
 * Applies styling specific to inputs that can't be modified
 * but remain focusable.
 *
 * @param readOnly - The read-only state
 * @returns A string of Tailwind CSS classes or empty string if not read-only
 */
const getReadOnlyClasses = (readOnly?: boolean) => {
  return readOnly ? "bg-dark-slate/5 cursor-default" : "";
};

/**
 * Gets Tailwind CSS classes specific to the input type
 *
 * Applies type-specific styling like monospace fonts for numeric inputs
 * or special layout adjustments for certain types.
 *
 * @param type - The input type
 * @returns A string of Tailwind CSS classes based on the input type
 */
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

/**
 * Input component implementation using React.forwardRef
 *
 * The component accepts a ref that will be forwarded to the underlying
 * HTML input element, allowing parent components to interact with the
 * DOM node directly when needed.
 *
 * The component includes accessibility features like ARIA attributes
 * and error message display for form validation.
 *
 * @param props - Input component props
 * @param ref - Forwarded ref to the underlying HTML input element
 * @returns A styled input component with optional error message
 */
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
