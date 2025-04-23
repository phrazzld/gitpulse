import React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the HeaderContainer component
 */
export interface HeaderContainerProps {
  /**
   * The content to render inside the header container
   */
  children: React.ReactNode;

  /**
   * Optional CSS class name for custom styling
   */
  className?: string;
}

/**
 * HeaderContainer component
 *
 * Container for the header content with styling and layout
 */
export const HeaderContainer: React.FC<HeaderContainerProps> = ({
  children,
  className,
}) => {
  return (
    <header
      className={cn(
        "w-full sticky top-0 z-50 border-b border-muted bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {children}
      </div>
    </header>
  );
};

export default HeaderContainer;
