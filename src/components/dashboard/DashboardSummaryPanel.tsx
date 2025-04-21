import React from "react";
import { Card } from "@/components/library";
import { DashboardSummaryPanelProps } from "@/types/dashboard";
import { cn } from "@/components/library/utils/cn";

/**
 * DashboardSummaryPanel component
 *
 * Displays summary metrics for the dashboard in a grid layout.
 * Shows commit count, repository count, and active days count.
 *
 * @param props - Component props
 * @returns A styled dashboard summary panel component
 */
export default function DashboardSummaryPanel({
  commits = 0,
  repositories = 0,
  activeDays = 0,
  isLoading = false,
  error = null,
}: DashboardSummaryPanelProps) {
  return (
    <Card padding="md" radius="md" shadow="md" className="mb-6">
      <div
        className="mb-4 flex items-center justify-between border-b pb-3"
        style={{ borderColor: "var(--electric-blue)" }}
      >
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: "var(--neon-green)" }}
          ></div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--neon-green)" }}
          >
            ACTIVITY METRICS
          </h2>
        </div>
        {isLoading && (
          <div
            className="px-2 py-1 text-xs rounded flex items-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--electric-blue)",
              color: "var(--electric-blue)",
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{ backgroundColor: "var(--electric-blue)" }}
            ></span>
            <span>PROCESSING</span>
          </div>
        )}
      </div>

      {error ? (
        <div
          className="p-4 rounded text-center"
          style={{
            backgroundColor: "rgba(255, 59, 48, 0.1)",
            color: "var(--crimson-red)",
          }}
        >
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="COMMIT COUNT"
            value={commits}
            color="var(--neon-green)"
            isLoading={isLoading}
          />
          <MetricCard
            label="REPOSITORIES"
            value={repositories}
            color="var(--electric-blue)"
            isLoading={isLoading}
          />
          <MetricCard
            label="ACTIVE DAYS"
            value={activeDays}
            color="var(--luminous-yellow)"
            isLoading={isLoading}
          />
        </div>
      )}
    </Card>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  color: string;
  isLoading?: boolean;
}

/**
 * MetricCard component
 *
 * Displays a single metric card with a label and value.
 * Used within the DashboardSummaryPanel to display individual metrics.
 *
 * @param props - Component props
 * @returns A styled metric card component
 */
function MetricCard({
  label,
  value,
  color,
  isLoading = false,
}: MetricCardProps) {
  return (
    <div
      className="p-4 rounded-md border relative"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        borderColor: color,
        boxShadow: `0 0 10px ${color}10`,
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: color }}
      ></div>
      <p className="text-xs uppercase mb-1" style={{ color: color }}>
        {label}
      </p>
      {isLoading ? (
        <div className="flex items-center h-8">
          <div
            className="w-6 h-2 rounded animate-pulse"
            style={{ backgroundColor: `${color}50` }}
          ></div>
        </div>
      ) : (
        <p
          className="text-3xl font-mono"
          style={{ color: "var(--foreground)" }}
        >
          {value.toLocaleString()}
        </p>
      )}
    </div>
  );
}
