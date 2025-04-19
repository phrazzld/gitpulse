import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Card, Button } from "@/components/library";
import { NavigationMenu } from "@/components/layout/NavigationMenu";
import { MobileMenuToggle } from "@/components/layout/MobileMenuToggle";
import { NavLink } from "@/types/navigation";
import { cn } from "@/components/library/utils/cn";
import { logger } from "@/lib/logger";
import { LogData } from "@/types/common";
import type { Session } from "next-auth";

/**
 * Props for the Header component
 *
 * @see {@link Header} for component implementation
 * @see {@link NavLink} for navigation link structure
 * @see {@link Session} from next-auth for session structure
 */
export interface HeaderProps {
  /**
   * Array of navigation links to display in the header
   * These links will be filtered based on authentication state if they have requiresAuth set
   * Links are passed to the NavigationMenu component for rendering
   * @see {@link NavLink} for link structure details
   */
  navLinks: NavLink[];

  /**
   * Optional user session information from NextAuth
   * When provided, user account UI with profile picture (if available) will be shown
   * When not provided or null, login button will be shown instead
   * This session object is also used to filter navigation links with requiresAuth
   * @see {@link Session} from next-auth for session structure details
   */
  session?: Session | null;

  /**
   * Optional CSS class name for custom styling
   * Applied to the outer header element for custom styling
   * Useful for applying margin, padding, or other layout adjustments
   */
  className?: string;

  /**
   * Optional text to display as the logo
   * Displayed in the header alongside the logo image
   * @default "GitPulse"
   */
  logoText?: string;

  /**
   * Optional URL for a logo image
   * When provided, an image will be shown next to the logo text
   * If not provided, a default globe icon will be used
   * @example "/logo.svg" or "https://example.com/logo.png"
   */
  logoImageUrl?: string;
}

/**
 * Header component for application layouts
 *
 * Comprehensive header component that displays the application logo, navigation menu,
 * and user authentication UI. Features a responsive design that adapts between desktop
 * and mobile screen sizes with a mobile menu toggle for smaller viewports.
 *
 * Key features:
 * - Responsive layout with desktop and mobile views
 * - Conditional rendering of authentication UI based on session state
 * - Mobile menu toggle for small viewport sizes
 * - Active link highlighting based on current path
 * - Filtering of navigation links based on authentication state
 * - Accessibility features including proper ARIA attributes
 * - Logging of menu toggle and navigation events
 *
 * @remarks
 * The Header uses several other components:
 * - NavigationMenu for rendering navigation links
 * - MobileMenuToggle for the mobile menu button
 * - Card and Button from the component library
 *
 * The mobile menu is displayed as an overlay at the top of the viewport on small screens.
 *
 * @example
 * ```tsx
 * // Basic usage with navigation links
 * const navLinks: NavLink[] = [
 *   { label: "Home", href: "/" },
 *   { label: "Dashboard", href: "/dashboard", requiresAuth: true }
 * ];
 *
 * <Header navLinks={navLinks} session={session} />
 *
 * // With custom logo and styling
 * <Header
 *   navLinks={navLinks}
 *   session={session}
 *   logoText="MyApp"
 *   logoImageUrl="/logo.svg"
 *   className="bg-primary/10"
 * />
 * ```
 */
export const Header: React.FC<HeaderProps> = ({
  navLinks,
  session,
  className,
  logoText = "GitPulse",
  logoImageUrl,
}) => {
  /**
   * Gets the current URL path using Next.js's usePathname hook
   * Used to determine the active navigation link in the NavigationMenu
   */
  const pathname = usePathname();

  /**
   * State for managing the visibility of the mobile menu overlay
   * - true: mobile menu is visible
   * - false: mobile menu is hidden
   */
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  /**
   * Toggles the mobile menu visibility state and logs the event
   *
   * This function:
   * 1. Toggles the isMobileMenuOpen state
   * 2. Creates a log entry with relevant context data
   * 3. Includes user info in the log when a session is available
   * 4. Calls the logger service to record the event
   */
  const toggleMobileMenu = (): void => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    // Build log data object with action and path context
    const logData: LogData = {
      action: newState ? "open_mobile_menu" : "close_mobile_menu",
      path: pathname,
    };

    // Add authentication context to log data
    if (session?.user) {
      logData.userId = session.user.email || session.user.name;
      logData.authenticated = true;
    } else {
      logData.authenticated = false;
    }

    // Log the menu toggle event
    logger.info(
      "Header",
      `Mobile menu ${newState ? "opened" : "closed"}`,
      logData,
    );
  };

  /**
   * Filters navigation links based on authentication state
   *
   * Only shows links that:
   * - Don't require authentication (public links), or
   * - Require authentication AND the user is authenticated
   */
  const visibleLinks = navLinks.filter(
    (link) => !link.requiresAuth || (link.requiresAuth && session),
  );

  /**
   * Unique ID for the mobile menu
   * Used for ARIA attributes to connect the toggle button with the menu
   * via aria-controls and id attributes
   */
  const mobileMenuId = "mobile-navigation-menu";

  return (
    <header className={cn("w-full sticky top-0 z-10", className)}>
      <Card
        padding="md"
        radius="sm"
        shadow="md"
        className="w-full bg-background-secondary/95 backdrop-blur-sm transition-all duration-normal"
      >
        <div className="container mx-auto px-sm md:px-md">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-sm no-underline transition-transform duration-normal hover:scale-105"
                aria-label="Go to homepage"
              >
                {logoImageUrl ? (
                  <Image
                    src={logoImageUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8"
                    aria-hidden="true"
                  />
                ) : (
                  <Image
                    src="/globe.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6"
                    aria-hidden="true"
                  />
                )}
                <span className="text-lg md:text-xl font-bold text-primary">
                  {logoText}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <NavigationMenu
                links={visibleLinks}
                currentPath={pathname || ""}
                className="ml-lg"
                ariaLabel="Main Navigation"
                userId={
                  session?.user?.email || session?.user?.name || undefined
                }
                isAuthenticated={!!session}
              />
            </div>

            {/* User Account / Auth Section */}
            <div className="ml-auto flex items-center gap-sm md:gap-md">
              {session ? (
                <div className="flex items-center gap-sm">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full w-8 h-8 border border-dark-slate/20 shadow-sm"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                    {session.user?.name || "User"}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label="Account menu"
                    className="ml-xs md:ml-sm"
                  >
                    <span className="sr-only">Account menu</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              ) : (
                <Link href="/api/auth/signin" className="no-underline">
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-sm hover:shadow-md transition-shadow duration-normal"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button (Hidden on desktop) */}
            <div className="flex md:hidden ml-sm">
              <MobileMenuToggle
                isOpen={isMobileMenuOpen}
                onToggle={toggleMobileMenu}
                menuId={mobileMenuId}
                ariaLabel="Toggle navigation menu"
                className="shadow-sm hover:shadow-md"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Navigation Menu Overlay (Hidden on desktop) */}
      {isMobileMenuOpen && (
        <div
          id={mobileMenuId}
          className="md:hidden fixed inset-x-0 top-[4rem] z-modal-backdrop bg-background-secondary/95 backdrop-blur-sm border-t border-dark-slate/20 shadow-lg animate-fadeIn"
        >
          <div className="container mx-auto p-md">
            <NavigationMenu
              links={visibleLinks}
              currentPath={pathname || ""}
              orientation="vertical"
              className="w-full animate-slideIn"
              ariaLabel="Mobile Navigation"
              userId={session?.user?.email || session?.user?.name || undefined}
              isAuthenticated={!!session}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
