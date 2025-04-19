import React from "react";
import { cn } from "@/components/library/utils/cn";

export interface MobileMenuToggleProps {
  /**
   * Current state of the mobile menu
   */
  isOpen: boolean;

  /**
   * Callback function triggered when the toggle is clicked
   */
  onToggle: () => void;

  /**
   * Optional CSS class name for custom styling
   */
  className?: string;

  /**
   * Optional ID of the menu element that this toggle controls
   * Used for aria-controls attribute
   */
  menuId?: string;

  /**
   * Optional aria-label for the toggle button
   * @default "Toggle mobile menu"
   */
  ariaLabel?: string;

  /**
   * Optional ID for the toggle button element
   */
  id?: string;

  /**
   * Optional custom icon for the open state
   */
  openIcon?: React.ReactNode;

  /**
   * Optional custom icon for the closed state
   */
  closedIcon?: React.ReactNode;
}

/**
 * Mobile menu toggle button component
 *
 * Renders a button that toggles between open and closed states
 * for controlling mobile navigation menus. Includes proper ARIA
 * attributes for accessibility and supports custom styling.
 */
export const MobileMenuToggle: React.FC<MobileMenuToggleProps> = ({
  isOpen,
  onToggle,
  className,
  menuId,
  ariaLabel = "Toggle mobile menu",
  id,
  openIcon,
  closedIcon,
}) => {
  // Define the button ID for reference
  const buttonId =
    id || `mobile-menu-toggle-${Math.random().toString(36).substring(2, 9)}`;

  // Common button classes
  const baseButtonClasses = cn(
    "relative flex flex-col justify-center items-center",
    "w-10 h-10 p-sm rounded",
    "bg-background-secondary border border-dark-slate/20",
    "focus:outline-none focus:ring-2 focus:ring-primary/50",
    "transition-colors duration-normal",
    className,
  );

  // Default hamburger/close icon implementation
  const renderDefaultIcon = () => {
    return (
      <div
        className={cn(
          "w-5 flex flex-col justify-center items-center gap-1",
          "transition-all duration-normal",
        )}
      >
        {/* Three lines that transform between hamburger and X icon */}
        <span
          className={cn(
            "block w-full h-0.5 bg-foreground",
            "transition-transform duration-normal",
            isOpen && "translate-y-1.5 rotate-45",
          )}
        />
        <span
          className={cn(
            "block w-full h-0.5 bg-foreground",
            "transition-opacity duration-normal",
            isOpen && "opacity-0",
          )}
        />
        <span
          className={cn(
            "block w-full h-0.5 bg-foreground",
            "transition-transform duration-normal",
            isOpen && "-translate-y-1.5 -rotate-45",
          )}
        />
      </div>
    );
  };

  return (
    <button
      id={buttonId}
      type="button"
      onClick={onToggle}
      className={baseButtonClasses}
      aria-expanded={isOpen}
      aria-controls={menuId}
      aria-label={ariaLabel}
      aria-haspopup="menu"
    >
      {isOpen
        ? openIcon || renderDefaultIcon()
        : closedIcon || renderDefaultIcon()}
    </button>
  );
};

export default MobileMenuToggle;
