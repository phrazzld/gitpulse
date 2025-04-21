"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "@/components/layout/NavigationMenu";
import { MobileMenuToggle } from "@/components/layout/MobileMenuToggle";
import { NavLink } from "@/types/navigation";
import type { Session } from "next-auth";
import Logo from "@/components/layout/header/Logo";
import UserProfileSection from "@/components/layout/header/UserProfileSection";
import MobileMenuOverlay from "@/components/layout/header/MobileMenuOverlay";
import HeaderContainer from "@/components/layout/header/HeaderContainer";
import { logMobileMenuToggle } from "@/components/layout/header/headerUtils";

/**
 * Props for the Header component
 */
export interface HeaderProps {
  /**
   * Array of navigation links to display in the header
   * These links will be filtered based on authentication state if they have requiresAuth set
   */
  navLinks: NavLink[];

  /**
   * Optional user session information from NextAuth
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
   */
  logoImageUrl?: string;
}

/**
 * Header component for application layouts
 *
 * Comprehensive header component that displays the application logo, navigation menu,
 * and user authentication UI. Features a responsive design that adapts between desktop
 * and mobile screen sizes with a mobile menu toggle for smaller viewports.
 */
export const Header: React.FC<HeaderProps> = ({
  navLinks,
  session,
  className,
  logoText = "GitPulse",
  logoImageUrl,
}) => {
  // Get the current URL path
  const pathname = usePathname();

  // State for managing the visibility of the mobile menu overlay
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Toggles the mobile menu visibility state and logs the event
  const toggleMobileMenu = (): void => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    logMobileMenuToggle(newState, pathname || "", session);
  };

  // Filter navigation links based on authentication state
  const visibleLinks = navLinks.filter(
    (link) => !link.requiresAuth || (link.requiresAuth && session),
  );

  // Unique ID for the mobile menu
  const mobileMenuId = "mobile-navigation-menu";

  return (
    <>
      <HeaderContainer className={className}>
        {/* Logo Section */}
        <Logo logoText={logoText} logoImageUrl={logoImageUrl} />

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <NavigationMenu
            links={visibleLinks}
            currentPath={pathname || ""}
            className="ml-lg"
            ariaLabel="Main Navigation"
            userId={session?.user?.email || session?.user?.name || undefined}
            isAuthenticated={!!session}
          />
        </div>

        {/* User Account / Auth Section */}
        <UserProfileSection session={session} />

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
      </HeaderContainer>

      {/* Mobile Navigation Menu Overlay (Hidden on desktop) */}
      <MobileMenuOverlay
        isOpen={isMobileMenuOpen}
        links={visibleLinks}
        currentPath={pathname || ""}
        menuId={mobileMenuId}
        userId={session?.user?.email || session?.user?.name || undefined}
        isAuthenticated={!!session}
      />
    </>
  );
};

export default Header;
