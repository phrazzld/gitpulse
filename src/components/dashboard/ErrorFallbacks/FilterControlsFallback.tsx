"use client";

import { Card } from "@/components/library";
import { DashboardErrorFallbackProps } from "../DashboardErrorBoundary";

/**
 * Filter Controls Fallback Component
 *
 * A specialized fallback for the filter controls section.
 * It provides minimal filter functionality while indicating an error state.
 */
export default function FilterControlsFallback({
  error,
  componentId,
  retry,
}: DashboardErrorFallbackProps) {
  return (
    <div
      className="p-4 border rounded-md"
      style={{
        backgroundColor: "hsla(var(--dark-slate), 0.8)",
        borderColor: "hsl(var(--red))",
        boxShadow: "0 0 15px rgba(255, 0, 0, 0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-bold"
          style={{ color: "hsl(var(--red))" }}
        >
          FILTERS (ERROR)
        </h2>
        <button
          onClick={retry}
          className="px-3 py-1 text-sm rounded-md transition-colors"
          style={{
            backgroundColor: "hsl(var(--red))",
            color: "white",
          }}
        >
          Retry
        </button>
      </div>

      <p className="text-gray-300 text-sm mb-4">
        The filter controls encountered an error and are limited. You may
        continue using other dashboard features.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black bg-opacity-30 p-3 rounded">
          <div className="h-5 w-24 bg-gray-800 rounded mb-2"></div>
          <div className="h-8 w-full bg-gray-800 rounded"></div>
        </div>
        <div className="bg-black bg-opacity-30 p-3 rounded">
          <div className="h-5 w-24 bg-gray-800 rounded mb-2"></div>
          <div className="h-8 w-full bg-gray-800 rounded"></div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Error: {error.message.substring(0, 60)}...
      </div>
    </div>
  );
}
