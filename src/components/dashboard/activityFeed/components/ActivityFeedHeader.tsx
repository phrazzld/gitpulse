import React from "react";

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
    <div
      className="mb-4 flex items-center justify-between border-b pb-3"
      style={{ borderColor: "var(--electric-blue)" }}
    >
      <div className="flex items-center">
        <div
          className="w-3 h-3 rounded-full mr-3"
          style={{ backgroundColor: "var(--luminous-yellow)" }}
        ></div>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--luminous-yellow)" }}
        >
          COMMIT TIMELINE
        </h2>
      </div>
      {isLoading && (
        <div
          className="px-2 py-1 text-xs rounded flex items-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--luminous-yellow)",
            color: "var(--luminous-yellow)",
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse"
            style={{ backgroundColor: "var(--luminous-yellow)" }}
          ></span>
          <span>LOADING</span>
        </div>
      )}
    </div>
  );
}
