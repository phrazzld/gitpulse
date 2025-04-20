import React from "react";

/**
 * ActivityFeedLoading Component
 *
 * Displays a loading spinner during initial data load
 */
export function ActivityFeedLoading() {
  return (
    <div className="py-8 flex justify-center">
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-3"
          style={{
            borderColor: "var(--electric-blue)",
            borderTopColor: "transparent",
          }}
        ></div>
        <div style={{ color: "var(--electric-blue)" }}>
          Loading activity data...
        </div>
      </div>
    </div>
  );
}
