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
  // Combine base grid classes with variants and custom classes
  const gridClasses = cn(
    "grid w-full",
    getColumnsClasses(columns),
    getGapClasses(gap),
    className,
  );

  return (
    <div ref={ref} className={gridClasses} {...rest}>
      {children}
    </div>
  );
});

// Display name for debugging and React DevTools
DashboardGridContainer.displayName = "DashboardGridContainer";

export { DashboardGridContainer };
