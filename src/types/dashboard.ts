/**
 * Dashboard Interface Type Definitions
 *
 * This file defines types specifically related to the dashboard interface components
 * to provide consistent typing across the dashboard experience.
 */

import { ActivityMode, ActivityDateRange } from "./activity";
import { Repository } from "./github";
import { CommitSummary, AISummary } from "./summary";

/**
 * Dashboard filter state for repositories
 * Simplified from the previous implementation that included organizations and contributors
 */
export interface DashboardFilterState {
  repositories: string[];
}

/**
 * Props interface for the DashboardHeader component
 */
export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userImage?: string;
  status?: "loading" | "ready" | "error";
  onSignOut?: () => void;
}

/**
 * Props interface for the DashboardSummaryPanel component
 */
export interface DashboardSummaryPanelProps {
  commits?: number;
  repositories?: number;
  activeDays?: number;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Props interface for the ActivityOverviewPanel component
 */
export interface ActivityOverviewPanelProps {
  summary?: CommitSummary | null;
  isLoading?: boolean;
  error?: string | null;
  truncated?: boolean;
  onViewMore?: () => void;
}

/**
 * Props interface for the ActivityMetricsPanel component
 */
export interface ActivityMetricsPanelProps {
  metrics: ActivityMetric[];
  isLoading?: boolean;
}

/**
 * Activity metric item for display in the dashboard
 */
export interface ActivityMetric {
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number; // Percentage change
  changeDirection?: "up" | "down" | "neutral";
  color?: string; // CSS color variable
  icon?: string; // Icon identifier
}

/**
 * Technical insight item from AI analysis
 */
export interface TechnicalInsight {
  category: string;
  label: string;
  value: string | number;
  color?: string;
}

/**
 * Props interface for the ActivityFeedPanel component
 */
export interface ActivityFeedPanelProps {
  dateRange: ActivityDateRange;
  filters?: DashboardFilterState;
  installationIds?: number[];
  mode?: ActivityMode;
  maxItems?: number;
  isLoading?: boolean;
  showRepository?: boolean;
  truncated?: boolean;
  onViewMore?: () => void;
}

/**
 * Props interface for the RepositoryStatsPanel component
 */
export interface RepositoryStatsPanelProps {
  repositories: Repository[];
  filters: DashboardFilterState;
  isLoading?: boolean;
  onFilterChange?: (filters: DashboardFilterState) => void;
  onShowAllRepositories?: () => void;
}

/**
 * Props interface for the AIInsightsPanel component
 * Displays AI-generated insights from commit analysis
 */
export interface AIInsightsPanelProps {
  aiSummary?: AISummary | null;
  isLoading?: boolean;
  error?: string | null;
  truncated?: boolean;
  onViewMore?: () => void;
}

/**
 * Dashboard theme options
 */
export type DashboardTheme = "cyber" | "clean" | "minimal";

/**
 * Dashboard layout configuration
 */
export interface DashboardLayoutConfig {
  theme: DashboardTheme;
  gridLayout: "standard" | "compact" | "expanded";
  showSidebar: boolean;
  sidebarWidth?: number;
  contentMaxWidth?: number;
}

/**
 * Dashboard display state
 */
export interface DashboardDisplayState {
  layout: DashboardLayoutConfig;
  expandedPanels: string[];
  visiblePanels: string[];
}
