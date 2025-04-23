import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/types/navigation";
import { cn } from "@/lib/utils";

/**
 * Props for the Footer component
 *
 * @see {@link Footer} for component implementation
 * @see {@link NavLink} for navigation link structure
 */
export interface FooterProps {
  /**
   * Optional array of navigation links to display in the footer
   * Each link will be rendered as a button in the footer navigation section
   * Links are rendered using the Button component from the library
   * @see {@link NavLink} for link structure details
   * @default []
   */
  links?: NavLink[];

  /**
   * Copyright text to display in the footer
   * Typically includes the copyright symbol, year, and company name
   * @example "© 2025 GitPulse. All rights reserved."
   */
  copyrightText: string;
}

/**
 * Footer component for application layouts
 *
 * Displays copyright information and optional navigation links in a responsive footer.
 * The footer is positioned at the bottom of the layout and spans the full width.
 * On desktop, copyright text is aligned left and navigation links are aligned right.
 * On mobile, both sections stack vertically with copyright on top.
 *
 * @remarks
 * The Footer component uses the Card component from the application's component library
 * for consistent styling and the Button component for navigation links.
 *
 * @example
 * ```tsx
 * // Basic usage with copyright only
 * <Footer copyrightText="© 2025 GitPulse. All rights reserved." />
 *
 * // With navigation links
 * const footerLinks: NavLink[] = [
 *   { label: "Terms", href: "/terms" },
 *   { label: "Privacy", href: "/privacy" },
 *   { label: "About", href: "/about" }
 * ];
 *
 * <Footer
 *   links={footerLinks}
 *   copyrightText="© 2025 GitPulse. All rights reserved."
 * />
 * ```
 */
export const Footer: React.FC<FooterProps> = ({
  links = [],
  copyrightText,
}) => {
  return (
    <footer className="w-full mt-auto py-4 border-t bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright text */}
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            {copyrightText}
          </div>

          {/* Navigation links */}
          {links.length > 0 && (
            <nav
              className="flex flex-wrap justify-center gap-2"
              aria-label="Footer Navigation"
            >
              {links.map((link) => (
                <Button key={link.href} variant="ghost" size="sm" asChild>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
