import React from "react";
import { NavigationMenu } from "@/components/layout/NavigationMenu";
import { NavLink } from "@/types/navigation";

/**
 * Props for the MobileMenuOverlay component
 */
export interface MobileMenuOverlayProps {
  /**
   * Whether the mobile menu is open
   */
  isOpen: boolean;

  /**
   * Array of navigation links to display in the menu
   */
  links: NavLink[];

  /**
   * Current active path used for highlighting the active link
   */
  currentPath: string;

  /**
   * ID for the mobile menu
   */
  menuId: string;

  /**
   * Optional user ID for logging purposes
   */
  userId?: string;

  /**
   * Whether the user is authenticated
   */
  isAuthenticated?: boolean;
}

/**
 * MobileMenuOverlay component
 *
 * Displays a mobile navigation menu overlay when the mobile menu is open
 */
export const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = ({
  isOpen,
  links,
  currentPath,
  menuId,
  userId,
  isAuthenticated,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      id={menuId}
      className="md:hidden fixed inset-x-0 top-[4rem] z-modal-backdrop bg-background-secondary/95 backdrop-blur-sm border-t border-dark-slate/20 shadow-lg animate-fadeIn"
    >
      <div className="container mx-auto p-md">
        <NavigationMenu
          links={links}
          currentPath={currentPath || ""}
          orientation="vertical"
          className="w-full animate-slideIn"
          ariaLabel="Mobile Navigation"
          userId={userId}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
};

export default MobileMenuOverlay;
