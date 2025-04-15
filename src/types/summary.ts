// Common types related to commit summaries and analysis

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
  commits: any[]; // TODO: Consider creating a more specific type for commits
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