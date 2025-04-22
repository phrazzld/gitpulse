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
    <div className="mb-4 flex items-center justify-between border-b border-electric-blue pb-3">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-3 bg-luminous-yellow"></div>
        <h2 className="text-xl font-bold text-luminous-yellow">
          COMMIT TIMELINE
        </h2>
      </div>
      {isLoading && (
        <div className="px-2 py-1 text-xs rounded flex items-center bg-black/30 border border-luminous-yellow text-luminous-yellow">
          <span className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse bg-luminous-yellow"></span>
          <span>LOADING</span>
        </div>
      )}
    </div>
  );
}
