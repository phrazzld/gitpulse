import React from "react";
import { cn } from "@/components/library/utils/cn";

/**
 * Props for the MobileMenuToggle component
 *
 * @see {@link MobileMenuToggle} for component implementation
 */
export interface MobileMenuToggleProps {
  /**
   * Current state of the mobile menu
   *
   * - true: Menu is open, toggle displays close icon
   * - false: Menu is closed, toggle displays hamburger icon
   *
   * This state should be managed by the parent component.
   */
  isOpen: boolean;

  /**
   * Callback function triggered when the toggle is clicked
   *
   * Should update the isOpen state in the parent component.
   *
   * @example
   * ```tsx
   * const [isMenuOpen, setIsMenuOpen] = useState(false);
   * const handleToggle = () => setIsMenuOpen(!isMenuOpen);
   *
   * <MobileMenuToggle isOpen={isMenuOpen} onToggle={handleToggle} />
   * ```
   */
  onToggle: () => void;

  /**
   * Optional CSS class name for custom styling
   *
   * Applied to the button element in addition to the default classes.
   * Useful for adjusting size, position, colors, or other styling aspects.
   */
  className?: string;

  /**
   * Optional ID of the menu element that this toggle controls
   *
   * Used for the aria-controls attribute to create an ARIA relationship
   * between the toggle button and the menu it controls.
   * Essential for accessibility, linking the button to the menu it toggles.
   */
  menuId?: string;

  /**
   * Optional aria-label for the toggle button
   *
   * Provides an accessible name for the button for screen reader users.
   * @default "Toggle mobile menu"
   */
  ariaLabel?: string;

  /**
   * Optional ID for the toggle button element
   *
   * When not provided, a unique ID will be generated.
   * Used for DOM identification and targeting with CSS/JS.
   */
  id?: string;

  /**
   * Optional custom icon for the open state
   *
   * When provided, replaces the default X icon when menu is open.
   * Must be a valid React node, typically an SVG icon component.
   */
  openIcon?: React.ReactNode;

  /**
   * Optional custom icon for the closed state
   *
   * When provided, replaces the default hamburger icon when menu is closed.
   * Must be a valid React node, typically an SVG icon component.
   */
  closedIcon?: React.ReactNode;
}

/**
 * Mobile menu toggle button component
 *
 * A toggle button designed for mobile navigation menus that switches
 * between open and closed states. Features smooth transitions, proper
 * accessibility attributes, and support for custom styling and icons.
 *
 * Key features:
 * - Toggles between hamburger icon (closed) and X icon (open)
 * - Smooth animations for state transitions
 * - Fully accessible with proper ARIA attributes
 * - Support for custom icons
 * - Automatic ID generation
 * - Optimized for touch interaction on mobile devices
 *
 * @remarks
 * This component implements WAI-ARIA practices for menu buttons, providing
 * proper accessibility support with aria-expanded, aria-controls, and
 * aria-haspopup attributes. The default icon is a hamburger menu that
 * animates into an X when opened.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [isMenuOpen, setIsMenuOpen] = useState(false);
 * const handleToggle = () => setIsMenuOpen(!isMenuOpen);
 *
 * <MobileMenuToggle isOpen={isMenuOpen} onToggle={handleToggle} />
 *
 * // With menu ID for accessibility
 * <MobileMenuToggle
 *   isOpen={isMenuOpen}
 *   onToggle={handleToggle}
 *   menuId="mobile-nav-menu"
 * />
 *
 * // With custom icons
 * <MobileMenuToggle
 *   isOpen={isMenuOpen}
 *   onToggle={handleToggle}
 *   openIcon={<CloseIcon />}
 *   closedIcon={<MenuIcon />}
 * />
 * ```
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
  /**
   * Unique ID for the toggle button element
   * When not provided in props, generates a random ID with prefix
   * Used for DOM identification and ARIA relationships
   */
  const buttonId =
    id || `mobile-menu-toggle-${Math.random().toString(36).substring(2, 9)}`;

  /**
   * Base CSS classes for the toggle button
   *
   * Combines:
   * - Layout and sizing classes
   * - Background and border styles
   * - Focus state handling for accessibility
   * - Transition and animation properties
   * - State-dependent styling based on isOpen
   * - Custom classes passed in props
   */
  const baseButtonClasses = cn(
    "relative flex flex-col justify-center items-center",
    "w-10 h-10 p-sm rounded",
    "bg-background-secondary border border-dark-slate/20",
    "focus:outline-none focus:ring-2 focus:ring-primary/50",
    "transition-all duration-normal hover:scale-105",
    isOpen ? "border-primary/30" : "hover:border-primary/20",
    className,
  );

  /**
   * Renders the default hamburger/close icon
   *
   * Creates an animated icon that transforms between:
   * - Hamburger menu (three horizontal lines) when closed
   * - X icon (diagonal lines) when open
   *
   * Uses CSS transitions for smooth animation between states.
   * Colors change based on the open/closed state.
   *
   * @returns A React element containing the animated icon
   */
  const renderDefaultIcon = (): React.ReactElement => {
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
            "block w-full h-0.5",
            isOpen ? "bg-primary" : "bg-foreground",
            "transition-all duration-normal",
            isOpen && "translate-y-1.5 rotate-45 w-5",
          )}
        />
        <span
          className={cn(
            "block w-full h-0.5",
            isOpen ? "bg-primary" : "bg-foreground",
            "transition-all duration-normal",
            isOpen && "opacity-0 w-3",
          )}
        />
        <span
          className={cn(
            "block w-full h-0.5",
            isOpen ? "bg-primary" : "bg-foreground",
            "transition-all duration-normal",
            isOpen && "-translate-y-1.5 -rotate-45 w-5",
            !isOpen && "w-4",
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
