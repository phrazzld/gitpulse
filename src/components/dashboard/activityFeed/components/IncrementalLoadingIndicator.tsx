import React from "react";

/**
 * IncrementalLoadingIndicator Component
 *
 * Displays a loading indicator for incremental loading
 */
export function IncrementalLoadingIndicator() {
  return (
    <div className="text-xs flex items-center text-neon-green">
      <div className="w-3 h-3 border-2 border-neon-green border-t-transparent rounded-full animate-spin mr-2"></div>
      <div>
        Loading
        <span className="inline-block animate-pulse">.</span>
        <span
          className="inline-block animate-pulse"
          style={{ animationDelay: "0.3s" }}
        >
          .
        </span>
        <span
          className="inline-block animate-pulse"
          style={{ animationDelay: "0.6s" }}
        >
          .
        </span>
      </div>
    </div>
  );
}
