import React, { useRef, useEffect, KeyboardEvent, useState } from "react";
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

  /**
   * Optional ID for the navigation element
   */
  id?: string;
}

/**
 * Navigation menu component for application layouts
 *
 * Displays a list of navigation links in either horizontal or vertical orientation.
 * Automatically highlights the active link based on the current path.
 * Supports responsive layouts and can be styled with custom classes.
 * Implements keyboard navigation and ARIA accessibility attributes.
 */
export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  links = [],
  orientation = "horizontal",
  currentPath,
  className,
  ariaLabel = "Main Navigation",
  id,
}) => {
  // Don't render anything if there are no links
  if (links.length === 0) {
    return null;
  }

  // Refs for managing focus
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // State to track which item has focus
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Reset item refs when links change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, links.length);
  }, [links]);

  // Find initially active link index
  const initialActiveIndex = links.findIndex(
    (link) => link.href === currentPath,
  );

  // Determine layout classes based on orientation
  const layoutClasses = {
    horizontal: "flex flex-row items-center flex-wrap gap-sm",
    vertical: "flex flex-col items-start gap-sm",
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, index: number) => {
    let nextIndex = index;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        nextIndex = (index + 1) % links.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        nextIndex = (index - 1 + links.length) % links.length;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = links.length - 1;
        break;
      default:
        return;
    }

    // Focus the next navigation item
    if (itemRefs.current[nextIndex]) {
      itemRefs.current[nextIndex]?.focus();
      setFocusedIndex(nextIndex);
    }
  };

  // When an item receives focus
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  // When an item loses focus
  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  // Generate a unique ID for the navigation if not provided
  const navId = id || `nav-menu-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <nav
      id={navId}
      ref={navRef}
      className={cn(layoutClasses[orientation], className)}
      aria-label={ariaLabel}
      role="navigation"
    >
      <ul
        className={cn(
          "list-none p-0 m-0",
          orientation === "horizontal"
            ? "flex flex-row flex-wrap items-center gap-sm"
            : "flex flex-col items-start gap-sm w-full",
        )}
        role="menubar"
        aria-orientation={orientation}
      >
        {links.map((link, index) => {
          const isActive = currentPath === link.href;
          const isCurrentlyFocused = index === focusedIndex;

          return (
            <li key={link.href} role="none" className="m-0 p-0">
              <Link
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                href={link.href}
                className={cn(
                  "no-underline focus:outline-none",
                  isCurrentlyFocused && "ring-2 ring-primary rounded-sm",
                )}
                aria-current={isActive ? "page" : undefined}
                role="menuitem"
                tabIndex={
                  isActive || (index === 0 && initialActiveIndex === -1)
                    ? 0
                    : -1
                }
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                aria-label={
                  link.icon && !link.label
                    ? `${link.label || "Icon"} navigation link`
                    : undefined
                }
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "flex items-center gap-xs focus:outline-none",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-foreground hover:text-primary",
                  )}
                  tabIndex={-1} // Button shouldn't receive tab focus, as the Link is already focusable
                >
                  {link.icon && (
                    <span className="inline-flex" aria-hidden="true">
                      {link.icon}
                    </span>
                  )}
                  <span>{link.label}</span>
                </Button>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default NavigationMenu;
