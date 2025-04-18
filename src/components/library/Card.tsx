import React from "react";
import { cn } from "./utils/cn";

/**
 * Card component props interface
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content to render inside the card */
  children: React.ReactNode;

  /** Optional padding size variant */
  padding?: "none" | "sm" | "md" | "lg";

  /** Optional border radius variant */
  radius?: "none" | "sm" | "md" | "lg";

  /** Optional shadow variant */
  shadow?: "none" | "sm" | "md" | "lg";
}

/**
 * Card component for content containers
 *
 * Uses Tailwind CSS classes for styling with CSS variables from tokens.css
 */
// Get padding-specific classes
const getPaddingClasses = (padding: CardProps["padding"]) => {
  switch (padding) {
    case "none":
      return "p-0";
    case "sm":
      return "p-sm";
    case "lg":
      return "p-lg";
    case "md":
    default:
      return "p-md";
  }
};

// Get radius-specific classes
const getRadiusClasses = (radius: CardProps["radius"]) => {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-sm";
    case "lg":
      return "rounded-lg";
    case "md":
    default:
      return "rounded";
  }
};

// Get shadow-specific classes
const getShadowClasses = (shadow: CardProps["shadow"]) => {
  switch (shadow) {
    case "none":
      return "shadow-none";
    case "sm":
      return "shadow-sm";
    case "lg":
      return "shadow-lg";
    case "md":
    default:
      return "shadow";
  }
};

// Base card classes
const baseClasses = cn(
  "bg-true-white",
  "border border-dark-slate/10",
  "transition-shadow duration-normal",
);

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      padding = "md",
      radius = "md",
      shadow = "md",
      className,
      ...rest
    },
    ref,
  ) => {
    // Apply classes based on component props
    const cardClasses = cn(
      baseClasses,
      getPaddingClasses(padding),
      getRadiusClasses(radius),
      getShadowClasses(shadow),
      // Pass through any custom classes
      className,
    );

    return (
      <div ref={ref} className={cardClasses} {...rest}>
        {children}
      </div>
    );
  },
);

// Display name for debugging and React DevTools
Card.displayName = "Card";

export { Card };
