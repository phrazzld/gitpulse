/**
 * Type definitions for the GitPulse API
 */

import { Commit, AppInstallation } from "@/lib/github";
import { AISummary } from "./dashboard";

/**
 * Valid grouping options for summary data
 */
export type GroupBy = 'contributor' | 'organization' | 'repository' | 'chronological';

/**
 * Represents a group of commits with metadata and summary
 */
export interface GroupedResult {
  readonly groupKey: string;
  readonly groupName: string;
  readonly groupAvatar?: string;
  readonly commitCount: number;
  readonly repositories: readonly string[];
  readonly dates: readonly string[];
  readonly commits: readonly Commit[];
  readonly aiSummary?: AISummary;
}

/**
 * API error response format
 */
export interface ErrorResponse {
  readonly error: string;
  readonly details?: string;
  readonly code?: string;
  readonly needsInstallation?: boolean;
  readonly message?: string;
  readonly filterInfo?: FilterInfo;
}

/**
 * Filter criteria information for the summary API
 */
export interface FilterInfo {
  readonly contributors: readonly string[] | null;
  readonly organizations: readonly string[] | null;
  readonly repositories: readonly string[] | null;
  readonly dateRange: {
    readonly since: string;
    readonly until: string;
  };
}

/**
 * Basic statistics about commits
 */
export interface CommitStats {
  readonly totalCommits: number;
  readonly repositories: readonly string[];
  readonly dates: readonly string[];
}

/**
 * Response format for the summary API
 */
export interface SummaryResponse {
  readonly user?: string;
  readonly commits: readonly Commit[];
  readonly stats: CommitStats;
  readonly aiSummary?: AISummary;
  readonly filterInfo: FilterInfo;
  readonly groupedResults: readonly GroupedResult[];
  readonly authMethod: "github_app" | "oauth";
  readonly installationIds: readonly number[] | null;
  readonly installations: readonly AppInstallation[];
  readonly currentInstallations: readonly AppInstallation[];
}