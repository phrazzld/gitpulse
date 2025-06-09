/**
 * Core domain types for GitPulse
 * These are the fundamental data structures that represent our business domain
 */

/**
 * Core commit data structure
 */
export interface CommitData {
  readonly sha: string;
  readonly message: string;
  readonly author: string;
  readonly date: string; // ISO string format
  readonly repository: string;
  readonly additions?: number;
  readonly deletions?: number;
  readonly url?: string;
}

/**
 * Repository information
 */
export interface Repository {
  readonly name: string;
  readonly fullName: string;
  readonly owner: string;
  readonly description?: string;
  readonly isPrivate: boolean;
  readonly defaultBranch: string;
  readonly language?: string;
  readonly topics: readonly string[];
}

/**
 * User/contributor information
 */
export interface Contributor {
  readonly username: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly avatarUrl?: string;
  readonly profileUrl?: string;
}

/**
 * Date range for filtering
 */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Summary request parameters
 */
export interface SummaryRequest {
  readonly repositories: readonly string[];
  readonly dateRange: DateRange;
  readonly users?: readonly string[];
  readonly includePrivate?: boolean;
  readonly branch?: string;
}

/**
 * Summary statistics
 */
export interface SummaryStats {
  readonly totalCommits: number;
  readonly uniqueAuthors: number;
  readonly repositories: readonly string[];
  readonly mostActiveDay: string;
  readonly averageCommitsPerDay: number;
  readonly totalAdditions: number;
  readonly totalDeletions: number;
  readonly commitsByDay: Record<string, number>;
  readonly commitsByAuthor: Record<string, number>;
  readonly topRepositories: readonly {
    name: string;
    commits: number;
  }[];
}

/**
 * AI-generated summary content
 */
export interface SummaryContent {
  readonly overview: string;
  readonly keyThemes: readonly string[];
  readonly technicalFocus: readonly string[];
  readonly accomplishments: readonly string[];
  readonly commitTypes: Record<string, number>;
  readonly timelineHighlights: readonly {
    date: string;
    description: string;
  }[];
}

/**
 * Complete summary combining stats and AI content
 */
export interface Summary {
  readonly request: SummaryRequest;
  readonly stats: SummaryStats;
  readonly content: SummaryContent;
  readonly generatedAt: Date;
}

/**
 * GitHub API related types
 */
export interface GitHubCommitResponse {
  readonly sha: string;
  readonly commit: {
    readonly message: string;
    readonly author: {
      readonly name: string;
      readonly email: string;
      readonly date: string;
    };
  };
  readonly author?: {
    readonly login: string;
    readonly avatar_url: string;
    readonly html_url: string;
  };
  readonly stats?: {
    readonly additions: number;
    readonly deletions: number;
    readonly total: number;
  };
  readonly html_url: string;
}

/**
 * Validation error structure
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Application configuration
 */
export interface Config {
  readonly github: {
    readonly apiUrl: string;
    readonly timeout: number;
    readonly rateLimit: {
      readonly maxRequests: number;
      readonly windowMs: number;
    };
    readonly pagination: {
      readonly perPage: number;
      readonly batchSize: number;
    };
  };
  readonly validation: {
    readonly limits: {
      readonly maxRepositories: number;
      readonly maxDateRangeDays: number;
      readonly minDateRangeDays: number;
      readonly maxUsers: number;
      readonly maxBranchNameLength: number;
    };
    readonly rules: {
      readonly allowFutureDates: boolean;
    };
  };
  readonly api: {
    readonly timeout: number;
    readonly defaultLimit: number;
    readonly pagination: {
      readonly defaultPageSize: number;
      readonly maxPageSize: number;
    };
  };
  readonly cache: {
    readonly ttl: {
      readonly short: number;
      readonly medium: number;
      readonly long: number;
    };
    readonly staleWhileRevalidate: number;
  };
  readonly effects: {
    readonly retry: {
      readonly maxAttempts: number;
      readonly delayMs: number;
    };
    readonly timeout: {
      readonly defaultMs: number;
    };
  };
  readonly ui: {
    readonly progressiveLoading: {
      readonly initialLimit: number;
      readonly additionalItemsPerPage: number;
    };
    readonly summary: {
      readonly topRepositoriesLimit: number;
    };
    readonly debounce: {
      readonly defaultDelayMs: number;
    };
  };
  readonly ai: {
    readonly provider: string;
    readonly apiKey: string;
    readonly model: string;
    readonly maxTokens: number;
  };
}

/**
 * Type guards for runtime type checking
 */
export const isCommitData = (obj: unknown): obj is CommitData => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as CommitData).sha === 'string' &&
    typeof (obj as CommitData).message === 'string' &&
    typeof (obj as CommitData).author === 'string' &&
    typeof (obj as CommitData).date === 'string' &&
    typeof (obj as CommitData).repository === 'string'
  );
};

export const isRepository = (obj: unknown): obj is Repository => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Repository).name === 'string' &&
    typeof (obj as Repository).fullName === 'string' &&
    typeof (obj as Repository).owner === 'string' &&
    typeof (obj as Repository).isPrivate === 'boolean' &&
    typeof (obj as Repository).defaultBranch === 'string' &&
    Array.isArray((obj as Repository).topics)
  );
};

export const isSummaryRequest = (obj: unknown): obj is SummaryRequest => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    Array.isArray((obj as SummaryRequest).repositories) &&
    typeof (obj as SummaryRequest).dateRange === 'object' &&
    (obj as SummaryRequest).dateRange !== null &&
    (obj as SummaryRequest).dateRange.start instanceof Date &&
    (obj as SummaryRequest).dateRange.end instanceof Date
  );
};