import React from "react";

/**
 * Card component props interface
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
}

/**
 * Card component for content containers
 * All styling has been removed.
 */
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
    return (
      <div ref={ref} {...rest}>
        {children}
      </div>
    );
  },
);

// Display name for debugging and React DevTools
Card.displayName = "Card";

export { Card };
