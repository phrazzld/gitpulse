"use client";

import { useState } from "react";
import { resetStore } from "@/state/clearStore";

interface InitializationErrorFallbackProps {
  error?: Error | null;
  errorInfo?: string;
}

/**
 * Fallback component shown when application initialization fails
 *
 * Provides information about the error and allows the user to reset
 * the application state and retry.
 */
export default function InitializationErrorFallback({
  error,
  errorInfo,
}: InitializationErrorFallbackProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    setIsResetting(true);

    try {
      const success = resetStore();
      setResetSuccess(success);

      if (success) {
        // Wait a moment before reloading
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error("Error resetting application state:", err);
      setResetSuccess(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen"
      style={{
        backgroundColor: "hsl(var(--dark-slate))",
        color: "hsl(var(--foreground))",
      }}
    >
      <div
        className="p-6 rounded-md border shadow-lg max-w-lg text-center"
        style={{
          borderColor: "hsl(var(--error))",
          backgroundColor: "hsla(var(--dark-slate), 0.9)",
          boxShadow: "0 0 15px rgba(255, 59, 48, 0.2)",
        }}
      >
        <div
          className="inline-flex justify-center items-center w-16 h-16 rounded-full mb-4"
          style={{
            backgroundColor: "rgba(255, 59, 48, 0.1)",
            border: "2px solid hsl(var(--error))",
          }}
        >
          <span className="text-2xl">!</span>
        </div>

        <h2
          className="text-xl font-mono mb-2"
          style={{ color: "hsl(var(--error))" }}
        >
          Initialization Error
        </h2>

        <p className="text-gray-300 text-sm mb-4">
          There was a problem initializing the application state.
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded text-left text-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
          >
            <p className="font-mono text-red-400">{error.message}</p>
            {errorInfo && (
              <pre className="mt-2 text-xs overflow-auto max-h-32 text-gray-400">
                {errorInfo}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={handleReset}
            disabled={isResetting || resetSuccess}
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                isResetting || resetSuccess
                  ? "rgba(255, 59, 48, 0.3)"
                  : "hsl(var(--error))",
              color:
                isResetting || resetSuccess
                  ? "rgba(255, 255, 255, 0.7)"
                  : "white",
              cursor: isResetting || resetSuccess ? "not-allowed" : "pointer",
            }}
          >
            {isResetting
              ? "Resetting..."
              : resetSuccess
                ? "Reset Successful - Reloading..."
                : "Reset Application State"}
          </button>

          <button
            onClick={() => window.location.reload()}
            disabled={isResetting || resetSuccess}
            className="px-4 py-2 rounded text-sm font-medium border transition-colors"
            style={{
              borderColor: "hsl(var(--foreground))",
              backgroundColor: "transparent",
              color: "hsl(var(--foreground))",
              opacity: isResetting || resetSuccess ? 0.5 : 1,
              cursor: isResetting || resetSuccess ? "not-allowed" : "pointer",
            }}
          >
            Try Again Without Reset
          </button>
        </div>
      </div>
    </div>
  );
}
