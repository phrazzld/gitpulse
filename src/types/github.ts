// GitHub API related type definitions
// This file centralizes GitHub-related type definitions used across the application

/**
 * Discriminated union type representing the different authentication methods for GitHub.
 * This allows for type-safe handling of authentication variants in a single interface.
 */
export type GitHubCredentials =
  | { type: 'oauth'; token: string }
  | { type: 'app'; installationId: number };

/**
 * GitHub installation account information
 */
export type InstallationAccount = {
  login: string;
  type?: string;
  avatarUrl?: string;
};

/**
 * GitHub App installation information
 */
export type Installation = {
  id: number;
  account: InstallationAccount | null;
  appSlug: string;
  appId: number;
  repositorySelection: string;
  targetType: string; // 'User' or 'Organization'
};

/**
 * GitHub repository information
 */
export type Repository = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    // Additional owner properties that might be used
    avatar_url?: string;
    type?: string;
    [key: string]: unknown;
  };
  private: boolean;
  html_url?: string;
  description?: string | null;
  updated_at?: string | null;
  language?: string | null;
  // Allow additional properties that might come from the GitHub API
  [key: string]: unknown;
};

/**
 * GitHub commit information
 */
export type Commit = {
  sha: string;
  commit: {
    author: {
      name?: string;
      email?: string;
      date?: string;
    } | null;
    committer?: {
      name?: string;
      email?: string;
      date?: string;
    } | null;
    message: string;
    // Additional properties that might exist
    [key: string]: unknown;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
    // Additional properties that might exist
    [key: string]: unknown;
  } | null;
  repository?: {
    full_name: string;
  };
  // Allow additional properties from the GitHub API
  [key: string]: unknown;
};