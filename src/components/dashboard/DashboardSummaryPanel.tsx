import React from "react";
import { useActivityMetrics, useUIState } from "@/state";
import { Repository } from "@/types/github";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DashboardSummaryPanelProps {
  repositories?: Repository[];
  "data-testid"?: string;
}

/**
 * DashboardSummaryPanel component
 *
 * Displays summary metrics for the dashboard.
 * Shows commit count, repository count, and active days count.
 * Repositories are passed as props, but other metrics are still accessed via hooks.
 */
export default function DashboardSummaryPanel({
  repositories = [],
  "data-testid": testId,
}: DashboardSummaryPanelProps) {
  // Still get some data directly from Zustand hooks
  const { commits = 0, activeDays = 0 } = useActivityMetrics();
  const { loading = false, error = null } = useUIState();

  // Use repository count from props
  const repositoryCount = repositories?.length || 0;

  return (
    <Card className="h-full" data-testid={testId}>
      <CardHeader className="border-b pb-4 border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <CardTitle className="text-primary">ACTIVITY METRICS</CardTitle>
        </div>
        {loading && (
          <div className="flex items-center gap-1 text-xs text-secondary border border-secondary/30 bg-muted px-2 py-0.5 rounded">
            <div className="w-2 h-2 animate-pulse bg-secondary rounded-full"></div>
            <span>PROCESSING</span>
          </div>
        )}
      </CardHeader>

      {error ? (
        <CardContent className="pt-4">
          <div className="p-3 rounded-md text-destructive border border-destructive/20 bg-destructive/10">
            {error}
          </div>
        </CardContent>
      ) : (
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="COMMIT COUNT"
              value={commits}
              isLoading={loading}
              color="primary"
            />
            <MetricCard
              label="REPOSITORIES"
              value={repositoryCount}
              isLoading={loading}
              color="secondary"
            />
            <MetricCard
              label="ACTIVE DAYS"
              value={activeDays}
              isLoading={loading}
              color="accent"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  isLoading?: boolean;
  color: "primary" | "secondary" | "accent";
}

/**
 * MetricCard component
 *
 * Displays a single metric card with a label and value.
 * Used within the DashboardSummaryPanel to display individual metrics.
 */
function MetricCard({
  label,
  value,
  isLoading = false,
  color,
}: MetricCardProps) {
  const colorMap = {
    primary: "border-primary/30 bg-primary/5",
    secondary: "border-secondary/30 bg-secondary/5",
    accent: "border-accent/30 bg-accent/5",
  };

  const textColorMap = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  return (
    <div className={`rounded-md border p-3 ${colorMap[color]}`}>
      <p className={`text-xs font-medium mb-1 ${textColorMap[color]}`}>
        {label}
      </p>
      {isLoading ? (
        <div className="h-8 flex items-center">
          <div className="w-8 h-2 rounded animate-pulse bg-muted-foreground/50"></div>
        </div>
      ) : (
        <p className="text-2xl font-mono">{value.toLocaleString()}</p>
      )}
    </div>
  );
}
