import React from "react";
import ActivityFeed from "@/components/ActivityFeed";
import { ActivityMode } from "@/types/common";
import { DateRange } from "@/components/DateRangePicker";
import { FilterState } from "@/app/dashboard/page";
import { createActivityFetcher } from "@/lib/activity";
import { CommitSummary } from "@/types/summary";

interface Props {
  summary: CommitSummary | null;
  activityMode: ActivityMode;
  dateRange: DateRange;
  activeFilters: FilterState;
  installationIds: number[];
}

export default function SummaryDisplay({
  summary,
  activityMode,
  dateRange,
  activeFilters,
  installationIds,
}: Props) {
  if (!summary) return null;

  return (
    <div
      className="mt-8 border rounded-lg p-6"
      style={{
        backgroundColor: "rgba(27, 43, 52, 0.7)",
        backdropFilter: "blur(5px)",
        borderColor: "var(--electric-blue)",
        boxShadow: "0 0 20px rgba(59, 142, 234, 0.15)",
      }}
    >
      {/* Terminal-like header */}
      <div
        className="flex items-center justify-between mb-6 border-b pb-3"
        style={{ borderColor: "var(--electric-blue)" }}
      >
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: "var(--electric-blue)" }}
          ></div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--electric-blue)" }}
          >
            COMMIT ANALYSIS: {summary.user?.toUpperCase()}
          </h2>
        </div>
        <div
          className="px-2 py-1 text-xs rounded flex items-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--neon-green)",
            color: "var(--neon-green)",
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse"
            style={{ backgroundColor: "var(--neon-green)" }}
          ></span>
          <span>ANALYSIS COMPLETE</span>
        </div>
      </div>

      {/* Activity Feed with Progressive Loading */}
      {summary.commits && (
        <div className="mb-8">
          <div className="flex items-center mb-3">
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: "var(--electric-blue)" }}
            ></div>
            <h3
              className="text-sm uppercase"
              style={{ color: "var(--electric-blue)" }}
            >
              COMMIT ACTIVITY
            </h3>
          </div>

          <ActivityFeed
            loadCommits={(cursor, limit) => {
              // Build parameters for API request
              const params: Record<string, string> = {
                since: dateRange.since,
                until: dateRange.until,
              };

              // Organization filters removed in individual-focused MVP

              // If installation IDs available, include them
              if (installationIds.length > 0) {
                params.installation_ids = installationIds.join(",");
              }

              // Always use my-activity endpoint
              const apiEndpoint = "/api/my-activity";

              // Create and return the fetcher
              return createActivityFetcher(apiEndpoint, params)(cursor, limit);
            }}
            useInfiniteScroll={true}
            initialLimit={30}
            additionalItemsPerPage={20}
            showRepository={true}
            emptyMessage="No activity data found for the selected filters."
          />
        </div>
      )}

      {/* Stats dashboard with cyber styling */}
      <div className="mb-8">
        <h3
          className="text-sm uppercase mb-3"
          style={{ color: "var(--neon-green)" }}
        >
          METRICS OVERVIEW
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-md border relative"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              borderColor: "var(--neon-green)",
              boxShadow: "0 0 10px rgba(0, 255, 135, 0.1)",
            }}
          >
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: "var(--neon-green)" }}
            ></div>
            <p
              className="text-xs uppercase mb-1"
              style={{ color: "var(--neon-green)" }}
            >
              COMMIT COUNT
            </p>
            <p
              className="text-3xl font-mono"
              style={{ color: "var(--foreground)" }}
            >
              {summary.stats.totalCommits}
            </p>
          </div>
          <div
            className="p-4 rounded-md border relative"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              borderColor: "var(--electric-blue)",
              boxShadow: "0 0 10px rgba(59, 142, 234, 0.1)",
            }}
          >
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: "var(--electric-blue)" }}
            ></div>
            <p
              className="text-xs uppercase mb-1"
              style={{ color: "var(--electric-blue)" }}
            >
              REPOSITORIES
            </p>
            <p
              className="text-3xl font-mono"
              style={{ color: "var(--foreground)" }}
            >
              {summary.stats.repositories.length}
            </p>
          </div>
          <div
            className="p-4 rounded-md border relative"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              borderColor: "var(--luminous-yellow)",
              boxShadow: "0 0 10px rgba(255, 200, 87, 0.1)",
            }}
          >
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ backgroundColor: "var(--luminous-yellow)" }}
            ></div>
            <p
              className="text-xs uppercase mb-1"
              style={{ color: "var(--luminous-yellow)" }}
            >
              ACTIVE DAYS
            </p>
            <p
              className="text-3xl font-mono"
              style={{ color: "var(--foreground)" }}
            >
              {summary.stats.dates.length}
            </p>
          </div>
        </div>
      </div>

      {summary.aiSummary && (
        <>
          {/* Key Themes */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: "var(--electric-blue)" }}
              ></div>
              <h3
                className="text-sm uppercase"
                style={{ color: "var(--electric-blue)" }}
              >
                IDENTIFIED PATTERNS
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {summary.aiSummary.keyThemes.map((theme, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-md text-sm"
                  style={{
                    backgroundColor: "rgba(0, 255, 135, 0.1)",
                    border: "1px solid var(--neon-green)",
                    color: "var(--neon-green)",
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Technical Areas */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: "var(--electric-blue)" }}
              ></div>
              <h3
                className="text-sm uppercase"
                style={{ color: "var(--electric-blue)" }}
              >
                TECHNICAL FOCUS AREAS
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.aiSummary.technicalAreas.map((area, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-md"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid var(--electric-blue)",
                  }}
                >
                  <span style={{ color: "var(--foreground)" }}>
                    {area.name}
                  </span>
                  <span
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: "rgba(59, 142, 234, 0.2)",
                      color: "var(--electric-blue)",
                    }}
                  >
                    {area.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Accomplishments */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: "var(--electric-blue)" }}
              ></div>
              <h3
                className="text-sm uppercase"
                style={{ color: "var(--electric-blue)" }}
              >
                KEY ACHIEVEMENTS
              </h3>
            </div>
            <div
              className="border rounded-md p-4"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderColor: "var(--neon-green)",
              }}
            >
              <ul className="space-y-3" style={{ color: "var(--foreground)" }}>
                {summary.aiSummary.accomplishments.map(
                  (accomplishment, index) => (
                    <li key={index} className="flex items-start">
                      <span
                        className="inline-block w-5 flex-shrink-0 mr-2"
                        style={{ color: "var(--neon-green)" }}
                      >
                        →
                      </span>
                      <span>{accomplishment}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Commit Types */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: "var(--electric-blue)" }}
              ></div>
              <h3
                className="text-sm uppercase"
                style={{ color: "var(--electric-blue)" }}
              >
                COMMIT CLASSIFICATION
              </h3>
            </div>
            <div className="space-y-4">
              {summary.aiSummary.commitsByType.map((type, index) => (
                <div
                  key={index}
                  className="border-l-2 pl-4 py-1"
                  style={{ borderColor: "var(--neon-green)" }}
                >
                  <div className="flex justify-between items-center">
                    <h4
                      className="font-medium"
                      style={{ color: "var(--neon-green)" }}
                    >
                      {type.type}
                    </h4>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: "rgba(0, 255, 135, 0.1)",
                        color: "var(--neon-green)",
                      }}
                    >
                      {type.count}
                    </span>
                  </div>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {type.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: "var(--electric-blue)" }}
              ></div>
              <h3
                className="text-sm uppercase"
                style={{ color: "var(--electric-blue)" }}
              >
                TEMPORAL ANALYSIS
              </h3>
            </div>
            <div className="space-y-4">
              {summary.aiSummary.timelineHighlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex border-b pb-3"
                  style={{ borderColor: "rgba(59, 142, 234, 0.2)" }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{
                      backgroundColor: "rgba(59, 142, 234, 0.1)",
                      border: "1px solid var(--electric-blue)",
                      color: "var(--electric-blue)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div
                      className="text-xs font-mono mb-1"
                      style={{ color: "var(--electric-blue)" }}
                    >
                      {new Date(highlight.date).toLocaleDateString()}
                    </div>
                    <div style={{ color: "var(--foreground)" }}>
                      {highlight.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Summary */}
          <div>
            <div className="flex items-center mb-3">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: "var(--electric-blue)" }}
              ></div>
              <h3
                className="text-sm uppercase"
                style={{ color: "var(--electric-blue)" }}
              >
                COMPREHENSIVE ANALYSIS
              </h3>
            </div>
            <div
              className="p-4 rounded-md border"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                borderColor: "var(--neon-green)",
                color: "var(--foreground)",
              }}
            >
              <div
                className="text-xs mb-2 font-mono"
                style={{ color: "var(--neon-green)" }}
              >
                $ AI_ANALYSIS --detailed-output
              </div>
              {summary.aiSummary.overallSummary}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
