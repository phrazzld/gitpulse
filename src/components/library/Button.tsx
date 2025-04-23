import React from "react";

/**
 * Button component props interface
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
}

/**
 * Button component for actions and form submissions
 * All styling has been removed.
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
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
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
