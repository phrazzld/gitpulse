"use client";

import { Card } from "@/components/library";
import { DashboardErrorFallbackProps } from "../DashboardErrorBoundary";

/**
 * Generic Panel Fallback Component
 *
 * A versatile fallback component that can replace any panel in the dashboard.
 * It displays error information and provides a retry button.
 */
export default function GenericPanelFallback({
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
        <h2 className="text-lg font-bold" style={{ color: "hsl(var(--red))" }}>
          Component Error
        </h2>
        <div className="text-sm text-gray-400">{componentId}</div>
      </div>

      <p className="text-gray-300 mb-4">
        This component encountered an error and could not be displayed properly.
      </p>

      <div className="mb-4">
        <pre className="p-2 bg-black bg-opacity-50 rounded text-xs text-gray-300 overflow-auto max-h-24">
          {error.toString()}
        </pre>
      </div>

      <button
        onClick={retry}
        className="px-4 py-2 rounded-md transition-colors"
        style={{
          backgroundColor: "hsl(var(--electric-blue))",
          color: "white",
        }}
      >
        Retry Component
      </button>
    </Card>
  );
}
