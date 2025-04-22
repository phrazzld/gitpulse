import React from "react";
import { Button } from "@/components/library";
import { cn } from "@/components/library/utils/cn";

interface ActivityFeedErrorProps {
  error: string;
  code?: string;
  requestId?: string;
  details?: string;
  retryFn?: () => void;
}

/**
 * ActivityFeedError Component
 *
 * Displays an error message when data fetching fails
 * Supports standardized API error format with error code, details, and request ID
 */
export function ActivityFeedError({
  error,
  code,
  requestId,
  details,
  retryFn,
}: ActivityFeedErrorProps) {
  return (
    <div className="p-4 rounded-md border border-crimson-red bg-crimson-red/10 text-crimson-red">
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
        <div className="flex-1">
          <div>Failed to load activity data: {error}</div>

          {/* Show additional details if available */}
          {details && details !== error && (
            <div className="text-sm mt-1">{details}</div>
          )}

          {/* Show error code and request ID for support debugging */}
          {(code || requestId) && (
            <div className="text-xs mt-2 opacity-80">
              {code && <span>Error code: {code}</span>}
              {code && requestId && <span> · </span>}
              {requestId && <span>Request ID: {requestId}</span>}
            </div>
          )}

          {/* Add retry button if retry function provided */}
          {retryFn && (
            <Button
              variant="secondary"
              size="sm"
              onClick={retryFn}
              className="mt-3 text-crimson-red border-crimson-red hover:bg-crimson-red/10"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
