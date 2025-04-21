import React from "react";
import { Card } from "@/components/library";
import { cn } from "@/components/library/utils/cn";

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
    <header className={cn("w-full sticky top-0 z-10", className)}>
      <Card
        padding="md"
        radius="sm"
        shadow="md"
        className="w-full bg-background-secondary/95 backdrop-blur-sm transition-all duration-normal"
      >
        <div className="container mx-auto px-sm md:px-md">
          <div className="flex items-center justify-between h-16">
            {children}
          </div>
        </div>
      </Card>
    </header>
  );
};

export default HeaderContainer;
