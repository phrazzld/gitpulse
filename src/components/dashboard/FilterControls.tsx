import React from "react";
import DateRangePicker, { DateRange } from "@/components/DateRangePicker";
import { FilterState } from "@/app/dashboard/page";
import { Installation } from "@/types/github";
import { Session } from "next-auth";
import { ActivityMode } from "@/types/activity";

interface Props {
  activityMode: ActivityMode;
  dateRange: DateRange;
  activeFilters: FilterState;
  installations: Installation[];
  loading: boolean;
  handleDateRangeChange: (newDateRange: DateRange) => void;
  session: Session | null;
}

export default function FilterControls({
  activityMode,
  dateRange,
  activeFilters,
  installations,
  loading,
  handleDateRangeChange,
  session,
}: Props) {
  return (
    <div
      className="mb-8 border rounded-lg p-6"
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
        <div
          className="px-2 py-1 text-xs rounded flex items-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--electric-blue)",
            color: "var(--electric-blue)",
          }}
        >
          <span>CONFIGURE PARAMETERS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Activity mode info panel */}
          <div
            className="rounded-lg border"
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
          </div>
        </div>

        {/* Right column - Date and Analysis Info */}
        <div className="space-y-6">
          <DateRangePicker
            dateRange={dateRange}
            onChange={handleDateRangeChange}
            disabled={loading}
          />

          {/* Analysis Parameters Info Card */}
          <div
            className="rounded-lg border bg-opacity-70 p-4"
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
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: "rgba(0, 255, 135, 0.1)",
                    color: "var(--neon-green)",
                  }}
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
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: "rgba(59, 142, 234, 0.1)",
                    color: "var(--electric-blue)",
                  }}
                >
                  {dateRange.since} to {dateRange.until}
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
          </div>
        </div>
      </div>
    </div>
  );
}
