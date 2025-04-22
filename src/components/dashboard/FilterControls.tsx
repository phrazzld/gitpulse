import React from "react";
import DateRangePicker from "@/components/DateRangePicker";
import { ActivityMode } from "@/types/activity";
import { Session } from "next-auth";
import { Button, Card, cn } from "@/components/library";
import {
  useDateRange,
  useFilters,
  useUIState,
  useInstallations,
} from "@/state";

interface Props {
  activityMode: ActivityMode;
  session: Session | null;
}

export default function FilterControls({ activityMode, session }: Props) {
  // Get state directly from Zustand hooks
  const { loading: uiLoading } = useUIState();
  const { dateRange, since, until, updateDateRange } = useDateRange();
  const { filters: activeFilters, updateFilters } = useFilters();
  const { installations, loading: installationsLoading } = useInstallations();

  // Determine loading state
  const loading = uiLoading || installationsLoading;

  // Function to handle date range changes
  const handleDateRangeChange = (newDateRange: {
    since: string;
    until: string;
  }) => {
    updateDateRange(newDateRange.since, newDateRange.until);
  };

  return (
    <Card
      className="mb-8"
      padding="lg"
      radius="lg"
      style={{
        backgroundColor: "rgba(27, 43, 52, 0.8)",
        backdropFilter: "blur(5px)",
        borderColor: "var(--electric-blue)",
        boxShadow: "0 0 15px rgba(59, 142, 234, 0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: "var(--electric-blue)" }}
          ></div>
          <h3
            className="text-sm font-bold uppercase"
            style={{ color: "var(--electric-blue)" }}
          >
            ANALYSIS FILTERS
          </h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="text-xs"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--electric-blue)",
            color: "var(--electric-blue)",
          }}
        >
          CONFIGURE PARAMETERS
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Activity mode info panel */}
          <Card
            padding="none"
            radius="lg"
            shadow="none"
            style={{
              backgroundColor: "rgba(27, 43, 52, 0.7)",
              backdropFilter: "blur(5px)",
              borderColor: "var(--neon-green)",
            }}
          >
            <div
              className="p-3 border-b"
              style={{ borderColor: "var(--neon-green)" }}
            >
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: "var(--neon-green)" }}
                ></div>
                <h3
                  className="text-sm uppercase"
                  style={{ color: "var(--neon-green)" }}
                >
                  ACTIVITY MODE
                </h3>
              </div>
            </div>
            <div className="p-4">
              <div
                className="p-3 rounded-md"
                style={{
                  backgroundColor: "rgba(0, 255, 135, 0.1)",
                  borderLeft: "3px solid var(--neon-green)",
                }}
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center"
                    style={{ borderColor: "var(--neon-green)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--neon-green)" }}
                    />
                  </div>
                  <div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: "var(--foreground)" }}
                    >
                      MY ACTIVITY
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: "var(--electric-blue)" }}
                    >
                      View your commits across all repositories
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column - Date and Analysis Info */}
        <div className="space-y-6">
          <DateRangePicker
            dateRange={dateRange || { since: "", until: "" }}
            onChange={handleDateRangeChange}
            disabled={loading}
          />

          {/* Analysis Parameters Info Card */}
          <Card
            padding="md"
            radius="lg"
            shadow="none"
            style={{
              backgroundColor: "rgba(27, 43, 52, 0.7)",
              backdropFilter: "blur(5px)",
              borderColor: "var(--neon-green)",
            }}
          >
            <div className="flex items-center mb-3">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: "var(--neon-green)" }}
              ></div>
              <h3
                className="text-sm uppercase"
                style={{ color: "var(--neon-green)" }}
              >
                ANALYSIS PARAMETERS
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs"
                  style={{ color: "var(--electric-blue)" }}
                >
                  MODE
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    "bg-opacity-10 bg-neon-green",
                  )}
                  style={{ color: "var(--neon-green)" }}
                >
                  MY ACTIVITY
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className="text-xs"
                  style={{ color: "var(--electric-blue)" }}
                >
                  DATE RANGE
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    "bg-opacity-10 bg-electric-blue",
                  )}
                  style={{ color: "var(--electric-blue)" }}
                >
                  {dateRange?.since || ""} to {dateRange?.until || ""}
                </span>
              </div>

              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: "rgba(0, 255, 135, 0.2)" }}
              >
                <div className="text-xs" style={{ color: "var(--foreground)" }}>
                  Configure your analysis parameters above, then click the
                  Analyze Commits button below to generate insights.
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}
