// Common types related to commit summaries and analysis
import { MinimalCommit } from '@/lib/optimize';
import { Commit } from '@/types/github';

// Test commit format used in test files
export interface TestCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  repository?: {
    name: string;
    full_name: string;
    html_url: string;
  };
  contributor?: {
    username: string;
    displayName: string;
    avatarUrl: string;
  };
}

export interface TechnicalArea {
  name: string;
  count: number;
}

export interface CommitType {
  type: string;
  count: number;
  description: string;
}

export interface TimelineHighlight {
  date: string;
  description: string;
}

export interface AISummary {
  keyThemes: string[];
  technicalAreas: TechnicalArea[];
  accomplishments: string[];
  commitsByType: CommitType[];
  timelineHighlights: TimelineHighlight[];
  overallSummary: string;
}

export interface CommitSummary {
  user?: string;
  commits: MinimalCommit[] | Commit[] | TestCommit[]; // Allow optimized, raw, and test formats
  stats: {
    totalCommits: number;
    repositories: string[];
    dates: string[];
  };
  aiSummary?: AISummary;
  authMethod?: string;
  installationId?: number | null;
  filterInfo?: {
    contributors: string[] | null;
    organizations: string[] | null;
    repositories: string[] | null;
    dateRange: { since: string, until: string };
  };
}