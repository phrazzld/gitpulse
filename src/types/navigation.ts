import { ReactNode } from "react";

/**
 * Represents a navigation link used throughout the application
 *
 * Navigation links are used in the Header, Footer, and NavigationMenu components
 * to create consistent navigation patterns across the application.
 *
 * @example
 * ```tsx
 * // Simple navigation link
 * const homeLink: NavLink = { label: "Home", href: "/" };
 *
 * // Navigation link with icon
 * const settingsLink: NavLink = {
 *   label: "Settings",
 *   href: "/settings",
 *   icon: <SettingsIcon />,
 *   requiresAuth: true
 * };
 *
 * // Creating a navigation array
 * const navLinks: NavLink[] = [
 *   { label: "Home", href: "/" },
 *   { label: "Dashboard", href: "/dashboard", requiresAuth: true }
 * ];
 * ```
 */
export type NavLink = {
  /**
   * The visible text of the navigation link
   * Displayed as the main text content of the link
   */
  label: string;

  /**
   * The destination URL of the link
   * This can be an absolute path ('/dashboard') or a relative path ('settings')
   */
  href: string;

  /**
   * Optional icon to display with the link
   * Can be any valid React node, typically an SVG icon component
   * When provided, the icon will be displayed next to the label
   */
  icon?: ReactNode;

  /**
   * Whether authentication is required to access this link
   * When true, the link will only be visible/active when the user is authenticated
   * Used by navigation components to conditionally show/hide links based on auth state
   * @default false
   */
  requiresAuth?: boolean;
};
