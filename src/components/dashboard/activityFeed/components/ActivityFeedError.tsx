import React from "react";

interface ActivityFeedErrorProps {
  error: string;
}

/**
 * ActivityFeedError Component
 *
 * Displays an error message when data fetching fails
 */
export function ActivityFeedError({ error }: ActivityFeedErrorProps) {
  return (
    <div
      className="p-4 rounded-md border"
      style={{
        backgroundColor: "rgba(255, 59, 48, 0.1)",
        borderColor: "var(--crimson-red)",
        color: "var(--crimson-red)",
      }}
    >
      <div className="flex items-start">
        <svg
          className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>Failed to load activity data: {error}</div>
      </div>
    </div>
  );
}
