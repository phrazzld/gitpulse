import React from "react";
import { cn } from "./utils/cn";

/**
 * Card component props interface
 *
 * This interface extends the standard HTML div attributes and adds
 * properties specific to our design system. The Card component
 * serves as a container that can be customized with different
 * padding, border radius, and shadow options.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content to render inside the card.
   * Can be text, other components, or any valid React node.
   */
  children: React.ReactNode;

  /**
   * Padding size variant applied to the card.
   * - none: No padding
   * - sm: Small padding
   * - md: Medium padding (default)
   * - lg: Large padding
   * @default "md"
   */
  padding?: "none" | "sm" | "md" | "lg";

  /**
   * Border radius variant applied to the card.
   * - none: Square corners
   * - sm: Slightly rounded corners
   * - md: Medium rounded corners (default)
   * - lg: Highly rounded corners
   * @default "md"
   */
  radius?: "none" | "sm" | "md" | "lg";

  /**
   * Shadow variant applied to the card.
   * - none: No shadow
   * - sm: Subtle shadow
   * - md: Medium shadow (default)
   * - lg: Pronounced shadow
   * @default "md"
   */
  shadow?: "none" | "sm" | "md" | "lg";
}

/**
 * Card component for content containers
 *
 * A versatile container component that can be used to group related content
 * with consistent styling. Customizable padding, corner radius, and shadow
 * depth allow for flexible usage in different UI contexts.
 *
 * Uses Tailwind CSS classes for styling with CSS variables from tokens.css.
 *
 * @example
 * // Basic usage
 * <Card>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 *
 * @example
 * // Card with custom styling
 * <Card padding="lg" radius="sm" shadow="lg" className="max-w-md">
 *   <Content />
 * </Card>
 *
 * @example
 * // Card with no padding
 * <Card padding="none">
 *   <img src="image.jpg" alt="Full width image" />
 *   <div className="p-md">
 *     <p>Content with custom padding</p>
 *   </div>
 * </Card>
 */

/**
 * Gets Tailwind CSS classes for the specified padding variant
 *
 * Maps the padding size variant to the corresponding Tailwind CSS
 * padding classes. These classes use the design tokens defined in tokens.css.
 *
 * @param padding - The padding variant ("none", "sm", "md", or "lg")
 * @returns A string containing the Tailwind CSS padding class
 */
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

/**
 * Gets Tailwind CSS classes for the specified border radius variant
 *
 * Maps the radius size variant to the corresponding Tailwind CSS
 * border radius classes. These classes use the design tokens defined in tokens.css.
 *
 * @param radius - The border radius variant ("none", "sm", "md", or "lg")
 * @returns A string containing the Tailwind CSS border radius class
 */
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

/**
 * Gets Tailwind CSS classes for the specified shadow variant
 *
 * Maps the shadow size variant to the corresponding Tailwind CSS
 * shadow classes. These classes use the design tokens defined in tokens.css.
 *
 * @param shadow - The shadow variant ("none", "sm", "md", or "lg")
 * @returns A string containing the Tailwind CSS shadow class
 */
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

/**
 * Base Tailwind CSS classes applied to all card variants
 *
 * These classes handle the common styling aspects:
 * - Background color
 * - Border style and color
 * - Transition effects for shadow changes
 */
const baseClasses = cn(
  "bg-true-white",
  "border border-dark-slate/10",
  "transition-shadow duration-normal",
);

/**
 * Card component implementation using React.forwardRef
 *
 * The component accepts a ref that will be forwarded to the underlying
 * HTML div element, allowing parent components to interact with the
 * DOM node directly when needed.
 *
 * The Card component is designed to be a simple container that
 * provides visual structure through consistent styling.
 *
 * @param props - Card component props
 * @param ref - Forwarded ref to the underlying HTML div element
 * @returns A styled card container component
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
