"use client";

import { Card } from "@/components/library";
import { DashboardErrorFallbackProps } from "../DashboardErrorBoundary";

/**
 * Repository Panel Fallback Component
 *
 * A specialized fallback for the repository information panel.
 * It maintains the visual structure of the repository panel but indicates an error state.
 */
export default function RepositoryPanelFallback({
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
          style={{ color: "hsl(var(--neon-green))" }}
        >
          REPOSITORIES
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
        The repository information panel encountered an error and could not load
        your repositories.
      </p>

      <div className="mb-4">
        <ul className="space-y-2 pl-4">
          <li className="text-gray-400">
            • Repository data unavailable due to an error
          </li>
          <li className="text-gray-400">
            • Try refreshing the dashboard or retrying
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Error: {error.message.substring(0, 50)}...
        </div>
        <button
          onClick={retry}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: "hsl(var(--neon-green))",
            color: "black",
            fontWeight: "bold",
          }}
        >
          Retry Loading
        </button>
      </div>
    </Card>
  );
}
