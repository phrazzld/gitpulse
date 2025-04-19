import React from "react";
import Link from "next/link";
import { Button } from "@/components/library";
import { NavLink } from "@/types/navigation";
import { cn } from "@/components/library/utils/cn";

export interface NavigationMenuProps {
  /**
   * Array of navigation links to display
   */
  links: NavLink[];

  /**
   * Layout orientation of the navigation menu
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Current active path used for highlighting the active link
   */
  currentPath: string;

  /**
   * Optional CSS class name to apply custom styling
   */
  className?: string;

  /**
   * Optional aria-label for the navigation element
   * @default "Main Navigation"
   */
  ariaLabel?: string;
}

/**
 * Navigation menu component for application layouts
 *
 * Displays a list of navigation links in either horizontal or vertical orientation.
 * Automatically highlights the active link based on the current path.
 * Supports responsive layouts and can be styled with custom classes.
 */
export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  links = [],
  orientation = "horizontal",
  currentPath,
  className,
  ariaLabel = "Main Navigation",
}) => {
  // Don't render anything if there are no links
  if (links.length === 0) {
    return null;
  }

  // Determine layout classes based on orientation
  const layoutClasses = {
    horizontal: "flex flex-row items-center flex-wrap gap-sm",
    vertical: "flex flex-col items-start gap-sm",
  };

  return (
    <nav
      className={cn(layoutClasses[orientation], className)}
      aria-label={ariaLabel}
    >
      {links.map((link) => {
        const isActive = currentPath === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="no-underline"
            aria-current={isActive ? "page" : undefined}
          >
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "flex items-center gap-xs",
                isActive
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "text-foreground hover:text-primary",
              )}
            >
              {link.icon && <span className="inline-flex">{link.icon}</span>}
              <span>{link.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;
