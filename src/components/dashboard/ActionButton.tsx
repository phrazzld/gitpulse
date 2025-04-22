import React, { useState } from "react";
import { cn } from "../../components/library/utils/cn";
import { useUIState } from "@/state";

export default function ActionButton() {
  // Get loading state directly from Zustand store
  const { loading } = useUIState();

  const [isHovered, setIsHovered] = useState(false);

  // Base button classes
  const baseClasses =
    "px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center";

  // Conditional button classes based on loading and hover state
  const buttonClasses = cn(
    baseClasses,
    loading
      ? [
          "bg-black",
          "bg-opacity-30",
          "text-neon-green",
          "border-2 border-neon-green",
          "opacity-70",
          "cursor-not-allowed",
        ]
      : [
          isHovered
            ? "bg-neon-green text-dark-slate"
            : "bg-dark-slate text-neon-green",
          "border-2 border-neon-green",
          isHovered
            ? "shadow-[0_0_15px_rgba(0,255,135,0.4)]"
            : "shadow-[0_0_10px_rgba(0,255,135,0.2)]",
          "opacity-100",
          "cursor-pointer",
        ],
  );

  return (
    <div className="flex justify-end pt-4">
      <button
        type="submit"
        disabled={loading}
        title="Analyze your GitHub commits and generate activity summary with AI insights"
        className={buttonClasses}
        onMouseEnter={() => !loading && setIsHovered(true)}
        onMouseLeave={() => !loading && setIsHovered(false)}
      >
        {loading ? (
          <>
            <span className="mr-2 inline-block w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></span>
            ANALYZING DATA...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z"
                clipRule="evenodd"
              />
            </svg>
            ANALYZE COMMITS
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
