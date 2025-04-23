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
      <Card data-testid={testId}>
        <div>
          <div></div>
          <h2>ACTIVITY OVERVIEW</h2>
        </div>

        <div>
          <div>
            <div></div>
            <p>ANALYZING COMMIT PATTERNS</p>
          </div>
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i}></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <Card data-testid={testId}>
        <div>
          <div></div>
          <h2>ACTIVITY OVERVIEW</h2>
        </div>

        <div>{error}</div>
      </Card>
    );
  }

  // Early return if no summary or AI summary available
  if (!summary || !summary.aiSummary) {
    return (
      <Card data-testid={testId}>
        <div>
          <div></div>
          <h2>ACTIVITY OVERVIEW</h2>
        </div>

        <div>
          No activity data available. Generate a summary to see insights.
        </div>
      </Card>
    );
  }

  const { aiSummary } = summary;

  return (
    <Card data-testid={testId}>
      <div>
        <div>
          <div></div>
          <h2>ACTIVITY OVERVIEW</h2>
        </div>
        <div>
          <span></span>
          <span>AI ANALYSIS COMPLETE</span>
        </div>
      </div>

      {/* Key Themes Section */}
      <div>
        <div>
          <div></div>
          <h3>IDENTIFIED PATTERNS</h3>
        </div>
        <div>
          {aiSummary.keyThemes
            .slice(0, truncated ? 3 : undefined)
            .map((theme: string, index: number) => (
              <span key={index}>{theme}</span>
            ))}
        </div>
      </div>

      {/* Technical Areas */}
      <div>
        <div>
          <div></div>
          <h3>TECHNICAL FOCUS AREAS</h3>
        </div>
        <div>
          {aiSummary.technicalAreas
            .slice(0, truncated ? 3 : 6)
            .map((area: { name: string; count: number }, index: number) => (
              <div key={index}>
                <span>{area.name}</span>
                <span>{area.count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Accomplishments (only show in full view) */}
      {!truncated && (
        <div>
          <div>
            <div></div>
            <h3>KEY ACHIEVEMENTS</h3>
          </div>
          <div>
            <ul>
              {aiSummary.accomplishments.map(
                (accomplishment: string, index: number) => (
                  <li key={index}>
                    <span>→</span>
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
        <div>
          <Button variant="secondary" size="sm" onClick={onViewMore}>
            VIEW FULL ANALYSIS
          </Button>
        </div>
      )}
    </Card>
  );
}
