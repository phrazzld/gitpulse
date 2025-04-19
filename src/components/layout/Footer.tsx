import React from "react";
import Link from "next/link";
import { Card, Button } from "@/components/library";
import { NavLink } from "@/types/navigation";

export interface FooterProps {
  /**
   * Optional array of navigation links to display in the footer
   */
  links?: NavLink[];

  /**
   * Copyright text to display in the footer
   */
  copyrightText: string;
}

/**
 * Footer component for application layouts
 *
 * Displays copyright information and optional navigation links.
 * Responsive layout that works well on different screen sizes.
 */
export const Footer: React.FC<FooterProps> = ({
  links = [],
  copyrightText,
}) => {
  return (
    <footer className="w-full mt-auto py-md">
      <Card
        padding="md"
        radius="sm"
        shadow="sm"
        className="w-full bg-background-secondary/95 backdrop-blur-sm text-foreground transition-all duration-normal"
      >
        <div className="container mx-auto px-sm md:px-md">
          <div className="flex flex-col md:flex-row justify-between items-center gap-md">
            {/* Copyright text */}
            <div className="text-sm text-foreground/80 mb-md md:mb-0 font-medium">
              {copyrightText}
            </div>

            {/* Navigation links */}
            {links.length > 0 && (
              <nav
                className="flex flex-wrap justify-center gap-sm"
                aria-label="Footer Navigation"
              >
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="no-underline transition-transform duration-normal hover:scale-105"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-foreground/90 hover:text-primary shadow-sm hover:shadow-md transition-all duration-normal"
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </Card>
    </footer>
  );
};

export default Footer;
