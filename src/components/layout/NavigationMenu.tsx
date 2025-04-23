"use client";

import React, { useRef, useEffect, KeyboardEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { LogData } from "@/types/common";

/**
 * Props for the NavigationMenu component
 *
 * @see {@link NavigationMenu} for component implementation
 * @see {@link NavLink} for navigation link structure
 */
export interface NavigationMenuProps {
  /**
   * Array of navigation links to display in the menu
   *
   * Each link is rendered as a button within a navigation list.
   * If links array is empty, the component returns null (renders nothing).
   * @see {@link NavLink} for navigation link structure
   */
  links: NavLink[];

  /**
   * Layout orientation of the navigation menu
   *
   * - "horizontal": Links are displayed in a row (good for desktop headers)
   * - "vertical": Links are displayed in a column (good for mobile menus or sidebars)
   *
   * Affects the flexbox direction, alignment, and keyboard navigation behavior.
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Current active path used for highlighting the active link
   *
   * This is typically the current URL path from the router.
   * Used to determine which link should be highlighted as active
   * and receive keyboard focus by default.
   * @example "/dashboard" or "/settings"
   */
  currentPath: string;

  /**
   * Optional CSS class name to apply custom styling to the navigation container
   *
   * Applied to the root nav element in addition to the default classes.
   */
  className?: string;

  /**
   * Optional aria-label for the navigation element
   *
   * Provides an accessible name for the navigation landmark.
   * Important for screen reader users to identify the purpose of the navigation.
   * @default "Main Navigation"
   */
  ariaLabel?: string;

  /**
   * Optional ID for the navigation element
   *
   * When not provided, a unique ID will be generated.
   * Used for targeting the navigation with ARIA attributes and scripts.
   */
  id?: string;

  /**
   * Optional user information for logging purposes
   *
   * When provided, user details will be included in navigation event logs.
   * Can be an email, name, or other user identifier.
   */
  userId?: string;

  /**
   * Optional boolean indicating whether the user is authenticated
   *
   * Used for logging navigation events with authentication context.
   * Does not affect which links are displayed - filtering should be done
   * before passing links to this component.
   */
  isAuthenticated?: boolean;
}

/**
 * Navigation menu component for application layouts
 *
 * A comprehensive navigation component that can be used in headers,
 * sidebars, or mobile menus. Supports both horizontal and vertical layouts
 * with fully accessible keyboard navigation support and ARIA attributes.
 *
 * Key features:
 * - Adaptive layout (horizontal or vertical)
 * - Active link highlighting
 * - Keyboard navigation (arrow keys, home/end)
 * - Focus management
 * - Proper ARIA roles and attributes
 * - Event logging for analytics
 * - Support for icons in navigation links
 * - Empty state handling
 *
 * @remarks
 * This component handles focus management and keyboard navigation according
 * to WAI-ARIA authoring practices for navigation menus. It uses the Button
 * component from the application's component library for consistent styling.
 *
 * Navigation events are logged when links are clicked, including context data
 * about the user, the source/destination paths, and the navigation source
 * (mobile or desktop).
 *
 * @example
 * ```tsx
 * // Basic horizontal navigation
 * const links: NavLink[] = [
 *   { label: "Home", href: "/" },
 *   { label: "Dashboard", href: "/dashboard", requiresAuth: true }
 * ];
 *
 * <NavigationMenu
 *   links={links}
 *   currentPath={pathname}
 * />
 *
 * // Vertical navigation for mobile menu
 * <NavigationMenu
 *   links={links}
 *   currentPath={pathname}
 *   orientation="vertical"
 *   ariaLabel="Mobile Navigation"
 *   className="w-full"
 * />
 * ```
 */
export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  links = [],
  orientation = "horizontal",
  currentPath,
  className,
  ariaLabel = "Main Navigation",
  id,
  userId,
  isAuthenticated,
}) => {
  /**
   * Early return guard: don't render anything if there are no links
   * This prevents rendering an empty navigation container
   */
  if (links.length === 0) {
    return null;
  }

  /**
   * Ref for the navigation element
   * Used for potential DOM manipulation or future focus management enhancement
   */
  const navRef = useRef<HTMLElement>(null);

  /**
   * Refs for each link element
   * Used to programmatically set focus during keyboard navigation
   * Array size matches the number of navigation links
   */
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  /**
   * State to track which item currently has focus
   * - -1: No item has focus
   * - 0+: Index of the focused item in the links array
   * Used to apply visual focus styles and for keyboard navigation tracking
   */
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  /**
   * Resize refs array when links array changes
   * This ensures the refs array size matches the links array size
   */
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, links.length);
  }, [links]);

  /**
   * Find the index of the currently active link
   * Used to set initial focus and for highlighting the active link
   * Returns -1 if no link matches the current path
   */
  const initialActiveIndex = links.findIndex(
    (link) => link.href === currentPath,
  );

  /**
   * CSS class mapping for different orientations
   * Contains tailwind classes for horizontal and vertical layouts
   */
  const layoutClasses = {
    horizontal: "flex flex-row items-center flex-wrap gap-2",
    vertical: "flex flex-col items-start gap-2",
  };

  /**
   * Handles keyboard navigation events
   *
   * Implements WAI-ARIA Authoring Practices for navigation menus:
   * - Arrow Right/Down: Move to next item
   * - Arrow Left/Up: Move to previous item
   * - Home: Move to first item
   * - End: Move to last item
   *
   * Wraps around at the beginning/end of the list for a circular navigation pattern
   *
   * @param e - Keyboard event from the navigation item
   * @param index - Current index of the item receiving the keydown event
   */
  const handleKeyDown = (
    e: KeyboardEvent<HTMLElement>,
    index: number,
  ): void => {
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

    // Focus the next navigation item if it exists
    if (itemRefs.current[nextIndex]) {
      itemRefs.current[nextIndex]?.focus();
      setFocusedIndex(nextIndex);
    }
  };

  /**
   * Updates focus state when an item receives focus
   *
   * @param index - Index of the item receiving focus
   */
  const handleFocus = (index: number): void => {
    setFocusedIndex(index);
  };

  /**
   * Clears focus state when an item loses focus
   * Resets focusedIndex to -1 to indicate no item has focus
   */
  const handleBlur = (): void => {
    setFocusedIndex(-1);
  };

  /**
   * Handles click events on navigation links
   * Logs navigation events for analytics purposes
   *
   * Only logs clicks that actually navigate (not clicks on the current path)
   * Includes context data like user info, current path, and destination
   *
   * @param link - The NavLink object being clicked
   * @param index - Index of the link in the links array
   */
  const handleLinkClick = (link: NavLink, index: number): void => {
    // Don't log clicks on the current page (no actual navigation)
    if (link.href === currentPath) {
      return;
    }

    // Build log data object with navigation context
    const logData: LogData = {
      action: "navigation_link_click",
      destination: link.href,
      linkLabel: link.label,
      navigationSource: orientation === "horizontal" ? "desktop" : "mobile",
      fromPath: currentPath,
    };

    // Add authentication context to log data
    if (userId) {
      logData.userId = userId;
      logData.authenticated = isAuthenticated || false;
    } else {
      logData.authenticated = isAuthenticated || false;
    }

    // Log the navigation event
    logger.info(
      "NavigationMenu",
      `Navigation to: ${link.label} (${link.href})`,
      logData,
    );
  };

  /**
   * Unique ID for the navigation element
   * When not provided in props, generates a random ID with prefix
   * Used for DOM identification and ARIA relationships
   */
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
            ? "flex flex-row flex-wrap items-center gap-2"
            : "flex flex-col items-start gap-2 w-full",
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
                onClick={() => handleLinkClick(link, index)}
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
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-1 focus:outline-none",
                    isActive ? "bg-primary/10 text-primary font-medium" : "",
                    orientation === "vertical" && "justify-start w-full",
                  )}
                  tabIndex={-1} // Button shouldn't receive tab focus, as the Link is already focusable
                >
                  {link.icon && (
                    <span className="inline-flex" aria-hidden="true">
                      {link.icon}
                    </span>
                  )}
                  <span>{link.label}</span>
                  {isActive && (
                    <span
                      className="ml-1 w-1.5 h-1.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
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
