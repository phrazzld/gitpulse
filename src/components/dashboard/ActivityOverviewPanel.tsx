import React from "react";
import { Button, Card } from "@/components/library";
import { ActivityOverviewPanelProps } from "@/types/dashboard";
import { cn } from "@/components/library/utils/cn";

/**
 * ActivityOverviewPanel component
 *
 * Displays an overview of user activity with AI-generated insights.
 * Shows key themes, technical areas, and accomplishments.
 *
 * @param props - Component props
 * @returns A styled activity overview panel component
 */
export default function ActivityOverviewPanel({
  summary,
  isLoading = false,
  error = null,
  truncated = false,
  onViewMore,
}: ActivityOverviewPanelProps) {
  // Early return for loading state
  if (isLoading) {
    return (
      <Card padding="md" radius="md" shadow="md" className="mb-6">
        <div className="mb-4 flex items-center border-b border-electric-blue pb-3">
          <div className="w-3 h-3 rounded-full mr-3 bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>

        <div className="flex flex-col space-y-4 p-4 items-center justify-center">
          <div className="flex space-x-2 items-center">
            <div className="w-4 h-4 rounded-full animate-pulse bg-neon-green"></div>
            <p className="text-sm text-neon-green">ANALYZING COMMIT PATTERNS</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
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
      <Card padding="md" radius="md" shadow="md" className="mb-6">
        <div className="mb-4 flex items-center border-b border-electric-blue pb-3">
          <div className="w-3 h-3 rounded-full mr-3 bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>

        <div className="p-4 rounded text-center bg-crimson-red/10 text-crimson-red">
          {error}
        </div>
      </Card>
    );
  }

  // Early return if no summary or AI summary available
  if (!summary || !summary.aiSummary) {
    return (
      <Card padding="md" radius="md" shadow="md" className="mb-6">
        <div className="mb-4 flex items-center border-b border-electric-blue pb-3">
          <div className="w-3 h-3 rounded-full mr-3 bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>

        <div className="p-4 text-center text-foreground">
          No activity data available. Generate a summary to see insights.
        </div>
      </Card>
    );
  }

  const { aiSummary } = summary;

  return (
    <Card padding="md" radius="md" shadow="md" className="mb-6">
      <div className="mb-4 flex items-center justify-between border-b border-electric-blue pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-3 bg-electric-blue"></div>
          <h2 className="text-xl font-bold text-electric-blue">
            ACTIVITY OVERVIEW
          </h2>
        </div>
        <div className="px-2 py-1 text-xs rounded flex items-center bg-black/30 border border-neon-green text-neon-green">
          <span className="inline-block w-2 h-2 rounded-full mr-2 bg-neon-green"></span>
          <span>AI ANALYSIS COMPLETE</span>
        </div>
      </div>

      {/* Key Themes Section */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-neon-green"></div>
          <h3 className="text-sm uppercase text-neon-green">
            IDENTIFIED PATTERNS
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {aiSummary.keyThemes
            .slice(0, truncated ? 3 : undefined)
            .map((theme, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-md text-sm bg-neon-green/10 border border-neon-green text-neon-green"
              >
                {theme}
              </span>
            ))}
        </div>
      </div>

      {/* Technical Areas */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2 bg-electric-blue"></div>
          <h3 className="text-sm uppercase text-electric-blue">
            TECHNICAL FOCUS AREAS
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiSummary.technicalAreas
            .slice(0, truncated ? 3 : 6)
            .map((area, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 rounded-md bg-black/30 border border-electric-blue"
              >
                <span className="text-foreground">{area.name}</span>
                <span className="px-2 py-1 rounded text-xs bg-electric-blue/20 text-electric-blue">
                  {area.count}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Accomplishments (only show in full view) */}
      {!truncated && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <div className="w-2 h-2 rounded-full mr-2 bg-luminous-yellow"></div>
            <h3 className="text-sm uppercase text-luminous-yellow">
              KEY ACHIEVEMENTS
            </h3>
          </div>
          <div className="border rounded-md p-4 bg-black/20 border-luminous-yellow">
            <ul className="space-y-3 text-foreground">
              {aiSummary.accomplishments.map((accomplishment, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-5 flex-shrink-0 mr-2 text-luminous-yellow">
                    →
                  </span>
                  <span>{accomplishment}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* View More Button (only in truncated view) */}
      {truncated && onViewMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={onViewMore}>
            VIEW FULL ANALYSIS
          </Button>
        </div>
      )}
    </Card>
  );
}
