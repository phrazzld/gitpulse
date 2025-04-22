import React from "react";
import { cn } from "@/components/library/utils/cn";

interface ActivityFeedHeaderProps {
  isLoading: boolean;
}

/**
 * ActivityFeedHeader Component
 *
 * Displays the header of the activity feed panel with optional loading indicator
 */
export function ActivityFeedHeader({ isLoading }: ActivityFeedHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-electric-blue pb-md mb-md">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-sm bg-luminous-yellow"></div>
        <h2 className="text-xl font-bold text-luminous-yellow">
          COMMIT TIMELINE
        </h2>
      </div>
      {isLoading && (
        <div className="px-sm py-xs text-xs rounded flex items-center bg-black/30 border border-luminous-yellow text-luminous-yellow">
          <span className="inline-block w-2 h-2 rounded-full mr-xs animate-pulse bg-luminous-yellow"></span>
          <span>LOADING</span>
        </div>
      )}
    </div>
  );
}
