import React from "react";
import { cn } from "../../../components/library/utils/cn";

/**
 * Props interface for the DashboardGridContainer component
 */
export interface DashboardGridContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content to render inside the grid container.
   * Typically dashboard panels and cards.
   */
  children: React.ReactNode;

  /**
   * Number of base columns in the grid.
   * @default 12
   */
  columns?: number;

  /**
   * Size of gap between grid items.
   * - sm: Small gap
   * - md: Medium gap (default)
   * - lg: Large gap
   * @default "md"
   */
  gap?: "sm" | "md" | "lg";
}

/**
 * Gets Tailwind CSS classes for the specified gap size
 *
 * Gap size strategy:
 * - sm (small): Compact spacing for dense UIs or when maximizing content density is critical
 * - md (medium): Default spacing that balances content separation with screen space efficiency
 * - lg (large): Wide spacing for improved visual clarity and component distinction
 *
 * We deliberately limit to three options rather than using arbitrary values to maintain
 * consistent spacing throughout the application and align with our design tokens.
 *
 * @param gap - The gap size variant ("sm", "md", or "lg")
 * @returns A string containing the Tailwind CSS gap class
 */
const getGapClasses = (gap: DashboardGridContainerProps["gap"]) => {
  switch (gap) {
    case "sm":
      return "gap-sm";
    case "lg":
      return "gap-lg";
    case "md":
    default:
      return "gap-md";
  }
};

/**
 * Gets Tailwind CSS classes for the specified number of columns
 *
 * Column count design rationale:
 * - Default of 12 columns provides optimal flexibility for responsive layouts
 * - 12 is divisible by 1, 2, 3, 4, 6, and 12, enabling various proportions (1/2, 1/3, 1/4, etc.)
 * - Allows for asymmetric layouts like 1/3 + 2/3 (4-col + 8-col) or 1/4 + 3/4 (3-col + 9-col)
 * - While 24 columns would provide even more granularity, 12 strikes the right balance between
 *   flexibility and simplicity for most dashboard layouts
 *
 * @param columns - The number of columns in the grid
 * @returns A string containing the Tailwind CSS grid-cols class
 */
const getColumnsClasses = (columns: DashboardGridContainerProps["columns"]) => {
  return `grid-cols-${columns}`;
};

/**
 * DashboardGridContainer component
 *
 * A layout component that provides a responsive grid container for dashboard panels.
 * Uses CSS Grid via Tailwind CSS utilities for precise layout control.
 *
 * Design Decisions:
 * - Uses a 12-column grid by default for maximum flexibility and compatibility with common
 *   grid systems. 12 has many divisors (1, 2, 3, 4, 6) allowing for diverse layouts.
 *
 * - Defaults to medium gap spacing (gap-md) to balance content density with visual separation.
 *   This creates enough breathing room between panels while preserving valuable screen real estate.
 *
 * - Deliberately separates layout structure (this container) from styling (handled by Card components)
 *   to maintain separation of concerns and enable more flexible component reuse.
 *
 * - Implements a pure grid container without built-in responsiveness, pushing responsive decisions
 *   to the consuming component. This creates a more flexible, unopinionated container that can be
 *   used in various contexts across the application.
 *
 * - Leverages Tailwind's utility classes through the `cn` utility to enable style composition
 *   without sacrificing type safety or maintainability.
 *
 * @example
 * // Basic usage
 * <DashboardGridContainer>
 *   <div className="col-span-12 md:col-span-6 lg:col-span-4">Panel 1</div>
 *   <div className="col-span-12 md:col-span-6 lg:col-span-8">Panel 2</div>
 * </DashboardGridContainer>
 *
 * @example
 * // With custom gap and columns
 * <DashboardGridContainer gap="lg" columns={24}>
 *   <div className="col-span-24 lg:col-span-8">Narrow panel</div>
 *   <div className="col-span-24 lg:col-span-16">Wide panel</div>
 * </DashboardGridContainer>
 */
const DashboardGridContainer = React.forwardRef<
  HTMLDivElement,
  DashboardGridContainerProps
>(({ children, columns = 12, gap = "md", className, ...rest }, ref) => {
  // All styling has been removed

  return (
    <div ref={ref} className="grid grid-cols-12 gap-4 w-full" {...rest}>
      {children}
    </div>
  );
});

// Display name for debugging and React DevTools
DashboardGridContainer.displayName = "DashboardGridContainer";

export { DashboardGridContainer };
