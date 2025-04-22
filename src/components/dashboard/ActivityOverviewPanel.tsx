import React from "react";
import { Button, Card } from "@/components/library";
import { cn } from "@/components/library/utils/cn";
import { useUIState } from "@/state";
import { useSafeSelector } from "@/state/hooks/useSafeStore";
import { StateSlice } from "@/state/types";

import { Repository } from "@/types/github";
import { CommitSummary } from "@/types/summary";

interface ActivityOverviewPanelProps {
  truncated?: boolean;
  onViewMore?: () => void;
  repositories?: Repository[];
  "data-testid"?: string;
}

/**
 * ActivityOverviewPanel component
 *
 * Displays an overview of user activity with AI-generated insights.
 * Shows key themes, technical areas, and accomplishments.
 * Data is accessed directly via Zustand hooks.
 *
 * @param props - Component props
 * @returns A styled activity overview panel component
 */
export default function ActivityOverviewPanel({
  truncated = false,
  onViewMore,
  "data-testid": testId,
}: ActivityOverviewPanelProps) {
  // Get data with safe selectors and proper fallbacks
  const summary = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.summary,
    null as CommitSummary | null,
  );
  const { loading: isLoading, error } = useUIState();

  // Early return for loading state
  if (isLoading) {
    return (
      <Card padding="md" radius="md" shadow="md" data-testid={testId}>
        <div className="flex items-center border-b border-electric-blue pb-md mb-md">
          <div className="w-3 h-3 rounded-full mr-sm bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>

        <div className="flex flex-col space-y-md p-md items-center justify-center">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full animate-pulse bg-neon-green mr-sm"></div>
            <p className="text-sm text-neon-green">ANALYZING COMMIT PATTERNS</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-md animate-pulse bg-black/30 border border-electric-blue"
              ></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <Card padding="md" radius="md" shadow="md" data-testid={testId}>
        <div className="flex items-center border-b border-electric-blue pb-md mb-md">
          <div className="w-3 h-3 rounded-full mr-sm bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>

        <div className="p-md rounded text-center bg-crimson-red/10 text-crimson-red">
          {error}
        </div>
      </Card>
    );
  }

  // Early return if no summary or AI summary available
  if (!summary || !summary.aiSummary) {
    return (
      <Card padding="md" radius="md" shadow="md" data-testid={testId}>
        <div className="flex items-center border-b border-electric-blue pb-md mb-md">
          <div className="w-3 h-3 rounded-full mr-sm bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>

        <div className="p-md text-center text-foreground">
          No activity data available. Generate a summary to see insights.
        </div>
      </Card>
    );
  }

  const { aiSummary } = summary;

  return (
    <Card padding="md" radius="md" shadow="md" data-testid={testId}>
      <div className="flex items-center justify-between border-b border-electric-blue pb-md mb-md">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-sm bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>
        <div className="px-sm py-xs text-xs rounded flex items-center bg-black/30 border border-neon-green text-neon-green">
          <span className="inline-block w-2 h-2 rounded-full mr-xs bg-neon-green"></span>
          <span>AI ANALYSIS COMPLETE</span>
        </div>
      </div>

      {/* Key Themes Section */}
      <div className="mb-lg">
        <div className="flex items-center mb-sm">
          <div className="w-2 h-2 rounded-full mr-xs bg-neon-green"></div>
          <h3 className="text-sm uppercase text-neon-green">
            IDENTIFIED PATTERNS
          </h3>
        </div>
        <div className="flex flex-wrap gap-sm">
          {aiSummary.keyThemes
            .slice(0, truncated ? 3 : undefined)
            .map((theme: string, index: number) => (
              <span
                key={index}
                className="px-sm py-xs rounded-md text-sm bg-neon-green/10 border border-neon-green text-neon-green"
              >
                {theme}
              </span>
            ))}
        </div>
      </div>

      {/* Technical Areas */}
      <div className="mb-lg">
        <div className="flex items-center mb-sm">
          <div className="w-2 h-2 rounded-full mr-xs bg-electric-blue"></div>
          <h3 className="text-sm uppercase text-electric-blue">
            TECHNICAL FOCUS AREAS
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {aiSummary.technicalAreas
            .slice(0, truncated ? 3 : 6)
            .map((area: { name: string; count: number }, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center p-sm rounded-md bg-black/30 border border-electric-blue"
              >
                <span className="text-foreground">{area.name}</span>
                <span className="px-sm py-xs rounded text-xs bg-electric-blue/20 text-electric-blue">
                  {area.count}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Accomplishments (only show in full view) */}
      {!truncated && (
        <div className="mb-lg">
          <div className="flex items-center mb-sm">
            <div className="w-2 h-2 rounded-full mr-xs bg-luminous-yellow"></div>
            <h3 className="text-sm uppercase text-luminous-yellow">
              KEY ACHIEVEMENTS
            </h3>
          </div>
          <div className="border rounded-md p-md bg-black/20 border-luminous-yellow">
            <ul className="space-y-sm text-foreground">
              {aiSummary.accomplishments.map(
                (accomplishment: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-5 flex-shrink-0 mr-xs text-luminous-yellow">
                      →
                    </span>
                    <span>{accomplishment}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      )}

      {/* View More Button (only in truncated view) */}
      {truncated && onViewMore && (
        <div className="mt-md flex justify-center">
          <Button variant="secondary" size="sm" onClick={onViewMore}>
            VIEW FULL ANALYSIS
          </Button>
        </div>
      )}
    </Card>
  );
}
