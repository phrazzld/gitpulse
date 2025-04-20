import React, { useState } from "react";
import { NavLink } from "@/types/navigation";
import type { Session } from "next-auth";

/**
 * Props for the TestHeader component
 */
export interface TestHeaderProps {
  /**
   * Array of navigation links to display in the header
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
 * Test implementation of the Header component
 *
 * This is a simplified version used for testing that matches the original API
 */
export const TestHeader: React.FC<TestHeaderProps> = ({
  navLinks,
  session,
  className,
  logoText = "GitPulse",
  logoImageUrl,
}) => {
  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter links based on authentication
  const visibleLinks = navLinks.filter(
    (link) => !link.requiresAuth || (link.requiresAuth && session),
  );

  return (
    <header data-testid="header" className={className}>
      {/* Logo */}
      <div data-testid="logo">
        {logoText}
        {logoImageUrl && <img src={logoImageUrl} data-testid="mock-image" />}
      </div>

      {/* Desktop Nav */}
      <nav aria-label="Main Navigation" data-testid="desktop-nav">
        {visibleLinks.map((link) => (
          <a key={link.href} href={link.href} data-testid="nav-link">
            {link.label}
          </a>
        ))}
      </nav>

      {/* User Profile */}
      <div data-testid="user-profile">
        {session ? (
          <>
            {session.user?.image && (
              <img src={session.user.image} data-testid="mock-image" />
            )}
            <span className="hidden sm:inline-block">{session.user?.name}</span>
            <button aria-label="Account menu">Account menu</button>
          </>
        ) : (
          <a href="/api/auth/signin">
            <button>Sign In</button>
          </a>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        aria-label="Toggle navigation menu"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        data-testid="mobile-menu-toggle"
      >
        Menu
      </button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div id="mobile-navigation-menu" data-testid="mobile-navigation-menu">
          <nav aria-label="Mobile Navigation">
            {visibleLinks.map((link) => (
              <a key={link.href} href={link.href} data-testid="mobile-nav-link">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default TestHeader;
