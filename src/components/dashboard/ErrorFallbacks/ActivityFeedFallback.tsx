"use client";

import { Card } from "@/components/library";
import { DashboardErrorFallbackProps } from "../DashboardErrorBoundary";

/**
 * Activity Feed Fallback Component
 *
 * A specialized fallback for the activity feed panel.
 * It maintains the visual structure of the activity feed but indicates an error state.
 */
export default function ActivityFeedFallback({
  error,
  componentId,
  retry,
}: DashboardErrorFallbackProps) {
  return (
    <Card
      padding="lg"
      radius="md"
      shadow="md"
      className="border"
      style={{
        backgroundColor: "hsla(var(--dark-slate), 0.7)",
        borderColor: "hsl(var(--red))",
        boxShadow: "0 0 15px rgba(255, 0, 0, 0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-bold"
          style={{ color: "hsl(var(--electric-blue))" }}
        >
          ACTIVITY FEED
        </h2>
        <div
          className="text-sm rounded px-2 py-1"
          style={{
            backgroundColor: "hsl(var(--red))",
            color: "white",
          }}
        >
          Error
        </div>
      </div>

      <p className="text-gray-300 mb-4">
        The activity feed encountered an error and could not load your commit
        history.
      </p>

      <div className="bg-black bg-opacity-30 p-4 rounded mb-4">
        <div className="flex items-center border-b border-gray-700 py-3 opacity-50">
          <div className="w-10 h-10 rounded-full bg-gray-800"></div>
          <div className="ml-3 flex-1">
            <div className="h-4 w-48 bg-gray-800 rounded"></div>
            <div className="h-3 w-24 bg-gray-800 rounded mt-2"></div>
          </div>
          <div className="h-4 w-16 bg-gray-800 rounded"></div>
        </div>

        <div className="flex items-center border-b border-gray-700 py-3 opacity-50">
          <div className="w-10 h-10 rounded-full bg-gray-800"></div>
          <div className="ml-3 flex-1">
            <div className="h-4 w-48 bg-gray-800 rounded"></div>
            <div className="h-3 w-24 bg-gray-800 rounded mt-2"></div>
          </div>
          <div className="h-4 w-16 bg-gray-800 rounded"></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Error: {error.message.substring(0, 50)}...
        </div>
        <button
          onClick={retry}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: "hsl(var(--electric-blue))",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Retry Loading
        </button>
      </div>
    </Card>
  );
}
