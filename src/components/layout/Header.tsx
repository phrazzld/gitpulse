import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Card, Button } from "@/components/library";
import { NavigationMenu } from "@/components/layout/NavigationMenu";
import { MobileMenuToggle } from "@/components/layout/MobileMenuToggle";
import { NavLink } from "@/types/navigation";
import { cn } from "@/components/library/utils/cn";
import type { Session } from "next-auth";

export interface HeaderProps {
  /**
   * Array of navigation links to display in the header
   */
  navLinks: NavLink[];

  /**
   * Optional user session information
   * When provided, user account UI will be shown
   * When not provided, login button will be shown
   */
  session?: Session | null;

  /**
   * Optional CSS class name for custom styling
   */
  className?: string;

  /**
   * Optional text to display as the logo
   * @default "GitPulse"
   */
  logoText?: string;

  /**
   * Optional URL for a logo image
   * When provided, an image will be shown next to the logo text
   */
  logoImageUrl?: string;
}

/**
 * Header component for application layouts
 *
 * Displays the application logo, navigation menu, and user authentication UI.
 * Responsive design that adapts to both desktop and mobile screens.
 * Includes mobile menu toggle and overlay for small viewport sizes.
 */
export const Header: React.FC<HeaderProps> = ({
  navLinks,
  session,
  className,
  logoText = "GitPulse",
  logoImageUrl,
}) => {
  // Get current path for active link highlighting
  const pathname = usePathname();

  // Mobile menu state management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle mobile menu visibility
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Calculate which links to show based on auth state
  const visibleLinks = navLinks.filter(
    (link) => !link.requiresAuth || (link.requiresAuth && session),
  );

  // Generate a unique ID for the mobile menu
  const mobileMenuId = "mobile-navigation-menu";

  return (
    <header className={cn("w-full sticky top-0 z-10", className)}>
      <Card
        padding="md"
        radius="sm"
        shadow="md"
        className="w-full bg-background-secondary"
      >
        <div className="container mx-auto px-sm">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-sm no-underline"
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
                <span className="text-xl font-bold text-primary">
                  {logoText}
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <NavigationMenu
                links={visibleLinks}
                currentPath={pathname || ""}
                className="ml-md"
                ariaLabel="Main Navigation"
              />
            </div>

            {/* User Account / Auth Section */}
            <div className="ml-auto flex items-center gap-md">
              {session ? (
                <div className="flex items-center gap-sm">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full w-8 h-8 border border-dark-slate/20"
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
                    className="ml-sm"
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
                  <Button variant="primary" size="sm">
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
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Mobile Navigation Menu Overlay (Hidden on desktop) */}
      {isMobileMenuOpen && (
        <div
          id={mobileMenuId}
          className="md:hidden fixed inset-x-0 top-[4rem] z-20 bg-background-secondary border-t border-dark-slate/20 shadow-lg animate-fadeIn"
        >
          <div className="container mx-auto p-md">
            <NavigationMenu
              links={visibleLinks}
              currentPath={pathname || ""}
              orientation="vertical"
              className="w-full"
              ariaLabel="Mobile Navigation"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
