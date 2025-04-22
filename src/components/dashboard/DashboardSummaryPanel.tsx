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
      <div className="mb-4 flex items-center justify-between border-b border-electric-blue pb-3">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-3 bg-neon-green"></div>
          <h2 className="text-xl font-bold text-neon-green">
            ACTIVITY METRICS
          </h2>
        </div>
        {isLoading && (
          <div className="px-2 py-1 text-xs rounded flex items-center bg-black/30 border border-electric-blue text-electric-blue">
            <span className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse bg-electric-blue"></span>
            <span>PROCESSING</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="p-4 rounded text-center bg-crimson-red/10 text-crimson-red">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="COMMIT COUNT"
            value={commits}
            colorToken="neon-green"
            isLoading={isLoading}
          />
          <MetricCard
            label="REPOSITORIES"
            value={repositories}
            colorToken="electric-blue"
            isLoading={isLoading}
          />
          <MetricCard
            label="ACTIVE DAYS"
            value={activeDays}
            colorToken="luminous-yellow"
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
  colorToken: "neon-green" | "electric-blue" | "luminous-yellow";
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
  colorToken,
  isLoading = false,
}: MetricCardProps) {
  const borderColorClass = `border-${colorToken}`;
  const textColorClass = `text-${colorToken}`;
  const bgColorClass = `bg-${colorToken}`;
  const pulseColorClass = `bg-${colorToken}/50`;

  return (
    <Card
      padding="md"
      radius="md"
      shadow="sm"
      className={cn("relative border bg-black/30", borderColorClass)}
    >
      <div
        className={cn("absolute top-0 left-0 w-full h-1", bgColorClass)}
      ></div>
      <p className={cn("text-xs uppercase mb-1", textColorClass)}>{label}</p>
      {isLoading ? (
        <div className="flex items-center h-8">
          <div
            className={cn("w-6 h-2 rounded animate-pulse", pulseColorClass)}
          ></div>
        </div>
      ) : (
        <p className="text-3xl font-mono text-foreground">
          {value.toLocaleString()}
        </p>
      )}
    </Card>
  );
}
