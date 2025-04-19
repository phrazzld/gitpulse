import { ReactNode } from "react";

/**
 * Represents a navigation link in the application
 */
export type NavLink = {
  /**
   * The visible text of the navigation link
   */
  label: string;

  /**
   * The destination URL of the link
   */
  href: string;

  /**
   * Optional icon to display with the link
   */
  icon?: ReactNode;

  /**
   * Whether authentication is required to access this link
   * If true, the link will only be visible/active when the user is authenticated
   */
  requiresAuth?: boolean;
};
