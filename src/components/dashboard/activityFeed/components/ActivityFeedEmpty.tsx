import React from "react";

/**
 * ActivityFeedEmpty Component
 *
 * Displays a message when no activity data is available
 */
export function ActivityFeedEmpty() {
  return (
    <div className="py-8 text-center" style={{ color: "var(--foreground)" }}>
      <div
        className="inline-block p-3 rounded-md border mb-3"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderColor: "var(--electric-blue)",
        }}
      >
        <svg
          className="h-6 w-6 mx-auto mb-2"
          fill="currentColor"
          viewBox="0 0 20 20"
          style={{ color: "var(--electric-blue)" }}
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
        <div className="text-sm">
          No activity data available for the selected filters.
        </div>
      </div>
    </div>
  );
}
