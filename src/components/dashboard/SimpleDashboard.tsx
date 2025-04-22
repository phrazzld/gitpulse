"use client";

import { useState } from "react";
import { Card } from "@/components/library";
import { resetStore } from "@/state/clearStore";

interface SimpleDashboardProps {
  error?: Error | null;
  errorInfo?: string;
}

/**
 * Simplified Dashboard Component
 *
 * A fallback dashboard UI that renders when the main dashboard encounters
 * state initialization errors. This component:
 * - Has no Zustand state dependencies
 * - Displays error information when available
 * - Provides a way to reset the application state
 * - Maintains visual consistency with the main dashboard
 */
export default function SimpleDashboard({
  error,
  errorInfo,
}: SimpleDashboardProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle state reset when button is clicked
  const handleResetState = () => {
    setIsResetting(true);

    try {
      const success = resetStore();
      setResetSuccess(success);

      if (success) {
        // Wait a moment then reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error("Error resetting state:", err);
      setResetSuccess(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: "hsl(var(--dark-slate))" }}
      data-testid="simplified-dashboard"
    >
      <div className="max-w-7xl mx-auto py-lg sm:px-lg lg:px-xl">
        <div className="px-md py-lg sm:px-0 gap-lg">
          {/* Header panel */}
          <Card
            padding="lg"
            radius="md"
            shadow="lg"
            className="border backdrop-blur-sm mb-6"
            style={{
              backgroundColor: "hsla(var(--dark-slate), 0.7)",
              borderColor: "hsl(var(--neon-green))",
              boxShadow: "0 0 15px rgba(0, 255, 135, 0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h1
                className="text-xl font-bold"
                style={{ color: "hsl(var(--neon-green))" }}
              >
                GitPulse Dashboard
              </h1>
              <div className="text-sm text-gray-400">Simplified View</div>
            </div>

            <div
              className="p-4 border rounded-md mb-6"
              style={{
                borderColor: "hsl(var(--red))",
                backgroundColor: "hsla(var(--red), 0.1)",
              }}
            >
              <h2
                className="text-lg font-bold mb-2"
                style={{ color: "hsl(var(--red))" }}
              >
                Dashboard State Error
              </h2>
              <p className="text-gray-300 mb-4">
                The dashboard could not be loaded due to state initialization
                issues. This may be caused by corrupted state data or a
                rendering error.
              </p>

              {error && (
                <div className="mb-4">
                  <h3
                    className="text-sm font-bold mb-1"
                    style={{ color: "hsl(var(--red))" }}
                  >
                    Error Details:
                  </h3>
                  <pre className="p-2 bg-black bg-opacity-50 rounded text-xs text-gray-300 overflow-auto">
                    {error.toString()}
                    {errorInfo && `\n\nComponent Stack:\n${errorInfo}`}
                  </pre>
                </div>
              )}

              <button
                onClick={handleResetState}
                disabled={isResetting}
                className="px-4 py-2 text-white rounded-md transition-colors"
                style={{
                  backgroundColor: isResetting
                    ? "hsl(var(--red-dark))"
                    : "hsl(var(--red))",
                  cursor: isResetting ? "not-allowed" : "pointer",
                }}
              >
                {isResetting ? "Resetting..." : "Reset Application State"}
              </button>

              {resetSuccess && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: "hsl(var(--green))" }}
                >
                  State reset successful! Reloading page...
                </p>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-400 text-sm">
                You can attempt to reload the page or reset the application
                state using the button above.
              </p>
            </div>
          </Card>

          {/* Content panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card
              padding="lg"
              radius="md"
              shadow="md"
              className="border"
              style={{
                backgroundColor: "hsla(var(--dark-slate), 0.7)",
                borderColor: "hsla(var(--electric-blue), 0.5)",
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: "hsl(var(--electric-blue))" }}
              >
                Repository Information
              </h2>
              <p className="text-gray-400">
                Repository data cannot be displayed in simplified mode.
              </p>
            </Card>

            <Card
              padding="lg"
              radius="md"
              shadow="md"
              className="border"
              style={{
                backgroundColor: "hsla(var(--dark-slate), 0.7)",
                borderColor: "hsla(var(--electric-blue), 0.5)",
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: "hsl(var(--electric-blue))" }}
              >
                Activity Overview
              </h2>
              <p className="text-gray-400">
                Activity data cannot be displayed in simplified mode.
              </p>
            </Card>
          </div>

          {/* Activity Feed Panel */}
          <Card
            padding="lg"
            radius="md"
            shadow="md"
            className="border"
            style={{
              backgroundColor: "hsla(var(--dark-slate), 0.7)",
              borderColor: "hsla(var(--electric-blue), 0.5)",
            }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "hsl(var(--electric-blue))" }}
            >
              Activity Feed
            </h2>
            <p className="text-gray-400">
              Activity feed cannot be displayed in simplified mode.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
