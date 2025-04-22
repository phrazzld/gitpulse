"use client";

import { useEffect, useState } from "react";

type InitStage = "starting" | "hydrating" | "finalizing" | "ready";

interface ZustandHydrationProps {
  message?: string;
  showDetailedProgress?: boolean;
}

/**
 * Enhanced loading component shown during Zustand store hydration
 *
 * Displayed while the store is initializing and hydrating from localStorage
 * Shows a visual indication of the initialization progress with animated stages
 */
export default function ZustandHydration({
  message = "Loading dashboard state...",
  showDetailedProgress = true,
}: ZustandHydrationProps) {
  const [stage, setStage] = useState<InitStage>("starting");
  const [progress, setProgress] = useState(10);

  // Simulate initialization progress for better user feedback
  useEffect(() => {
    // Start initialization sequence
    const startingTimeout = setTimeout(() => {
      setStage("hydrating");
      setProgress(35);
    }, 800);

    // Hydration stage
    const hydratingTimeout = setTimeout(() => {
      setStage("finalizing");
      setProgress(75);
    }, 1500);

    // Final stage
    const finalizingTimeout = setTimeout(() => {
      setStage("ready");
      setProgress(95);
    }, 2500);

    return () => {
      clearTimeout(startingTimeout);
      clearTimeout(hydratingTimeout);
      clearTimeout(finalizingTimeout);
    };
  }, []);

  // Get stage message based on current stage
  const getStageMessage = () => {
    switch (stage) {
      case "starting":
        return "Initializing application...";
      case "hydrating":
        return "Loading state from storage...";
      case "finalizing":
        return "Preparing dashboard...";
      case "ready":
        return "Almost ready...";
      default:
        return message;
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col justify-center items-center z-50"
      style={{
        backgroundColor: "hsl(var(--dark-slate))",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="p-6 rounded-md border shadow-lg max-w-sm text-center"
        style={{
          borderColor: "hsl(var(--neon-green))",
          backgroundColor: "hsla(var(--dark-slate), 0.8)",
          boxShadow: "0 0 15px rgba(0, 255, 135, 0.2)",
        }}
      >
        <div className="animate-pulse mb-4">
          <div
            className="inline-block w-16 h-16 rounded-full mb-2"
            style={{ backgroundColor: "rgba(0, 255, 135, 0.2)" }}
          ></div>
        </div>
        <h2
          className="text-xl font-mono mb-2"
          style={{ color: "hsl(var(--neon-green))" }}
        >
          Initializing Application
        </h2>
        <p className="text-gray-300 text-sm mb-4">{getStageMessage()}</p>

        {/* Progress bar */}
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out"
            style={{
              backgroundColor: "hsl(var(--neon-green))",
              width: `${progress}%`,
            }}
          ></div>
        </div>

        {/* Detailed progress indicators */}
        {showDetailedProgress && (
          <div className="mt-4 text-left text-xs">
            <div className="flex items-center mb-2">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    stage === "starting"
                      ? "hsl(var(--neon-green))"
                      : "hsl(var(--green))",
                }}
              ></div>
              <div className="text-gray-300">Application startup</div>
              <div className="ml-auto">
                {stage === "starting" ? "In progress" : "Complete"}
              </div>
            </div>

            <div className="flex items-center mb-2">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    stage === "hydrating"
                      ? "hsl(var(--neon-green))"
                      : stage === "starting"
                        ? "hsl(var(--gray))"
                        : "hsl(var(--green))",
                }}
              ></div>
              <div className="text-gray-300">State hydration</div>
              <div className="ml-auto">
                {stage === "hydrating"
                  ? "In progress"
                  : stage === "starting"
                    ? "Waiting"
                    : "Complete"}
              </div>
            </div>

            <div className="flex items-center mb-2">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    stage === "finalizing"
                      ? "hsl(var(--neon-green))"
                      : stage === "ready"
                        ? "hsl(var(--green))"
                        : "hsl(var(--gray))",
                }}
              ></div>
              <div className="text-gray-300">Dashboard preparation</div>
              <div className="ml-auto">
                {stage === "finalizing"
                  ? "In progress"
                  : stage === "ready"
                    ? "Complete"
                    : "Waiting"}
              </div>
            </div>

            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    stage === "ready"
                      ? "hsl(var(--neon-green))"
                      : "hsl(var(--gray))",
                }}
              ></div>
              <div className="text-gray-300">Final rendering</div>
              <div className="ml-auto">
                {stage === "ready" ? "In progress" : "Waiting"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
