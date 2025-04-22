import React from "react";
import { Card } from "@/components/library";
import { cn } from "@/components/library/utils/cn";
import { useActivityMetrics, useUIState } from "@/state";

/**
 * DashboardSummaryPanel component
 *
 * Displays summary metrics for the dashboard in a grid layout.
 * Shows commit count, repository count, and active days count.
 * Data is accessed directly via Zustand hooks.
 *
 * @returns A styled dashboard summary panel component
 */
export default function DashboardSummaryPanel() {
  // Get data directly from Zustand hooks
  const { commits, repositories, activeDays } = useActivityMetrics();
  const { loading, error } = useUIState();

  return (
    <Card padding="md" radius="md" shadow="md">
      <div className="flex items-center justify-between border-b border-electric-blue pb-md mb-md">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-sm bg-neon-green"></div>
          <h2 className="text-xl font-bold text-neon-green">
            ACTIVITY METRICS
          </h2>
        </div>
        {loading && (
          <div className="px-sm py-xs text-xs rounded flex items-center bg-black/30 border border-electric-blue text-electric-blue">
            <span className="inline-block w-2 h-2 rounded-full mr-xs animate-pulse bg-electric-blue"></span>
            <span>PROCESSING</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="p-md rounded text-center bg-crimson-red/10 text-crimson-red">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <MetricCard
            label="COMMIT COUNT"
            value={commits}
            colorToken="neon-green"
            isLoading={loading}
          />
          <MetricCard
            label="REPOSITORIES"
            value={repositories}
            colorToken="electric-blue"
            isLoading={loading}
          />
          <MetricCard
            label="ACTIVE DAYS"
            value={activeDays}
            colorToken="luminous-yellow"
            isLoading={loading}
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
      <p className={cn("text-xs uppercase mb-xs", textColorClass)}>{label}</p>
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
