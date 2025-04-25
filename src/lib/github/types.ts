/**
 * Type definitions for GitHub API interactions
 *
 * This module contains TypeScript interfaces and types for working with
 * GitHub repositories, commits, and installations.
 */

/**
 * Represents a GitHub repository
 */
export interface Repository {
  readonly id: number
  readonly name: string
  readonly full_name: string
  readonly owner: {
    readonly login: string
    readonly avatar_url?: string
    readonly type?: string
  }
  readonly private: boolean
  readonly html_url: string
  readonly description: string | null
  readonly updated_at?: string | null
  readonly language?: string | null
}

/**
 * Represents a GitHub commit author or committer
 */
export interface GitUser {
  readonly name?: string
  readonly email?: string
  readonly date?: string
}

/**
 * Represents a GitHub user or organization
 */
export interface GitHubUser {
  readonly login: string
  readonly avatar_url: string
  readonly type?: string
  readonly name?: string
  readonly url?: string
  readonly html_url?: string
}

/**
 * Represents a Git commit
 */
export interface GitCommit {
  readonly author: GitUser | null
  readonly committer?: GitUser | null
  readonly message: string
  readonly url?: string
  readonly comment_count?: number
  readonly verification?: {
    readonly verified: boolean
    readonly reason: string
    readonly signature?: string | null
    readonly payload?: string | null
  }
}

/**
 * Represents a GitHub commit
 */
export interface Commit {
  readonly sha: string
  readonly commit: GitCommit
  readonly html_url: string
  readonly author: GitHubUser | null
  readonly committer?: GitHubUser | null
  readonly parents?: readonly {
    readonly sha: string
    readonly url: string
    readonly html_url?: string
  }[]
  readonly stats?: {
    readonly additions: number
    readonly deletions: number
    readonly total: number
  }
  readonly repository?: {
    readonly full_name: string
  }
}

/**
 * Represents a GitHub account (user or organization)
 */
export interface GitHubAccount {
  readonly login: string
  readonly type?: string
  readonly avatarUrl?: string
}

/**
 * Represents a GitHub App installation
 */
export interface AppInstallation {
  readonly id: number
  readonly account: GitHubAccount | null
  readonly appSlug: string
  readonly appId: number
  readonly repositorySelection: string // 'all' or 'selected'
  readonly targetType: string // 'User' or 'Organization'
}

/**
 * Supported GitHub installation target types
 */
export type InstallationTargetType = 'User' | 'Organization'

/**
 * Represents the available GitHub API access methods
 */
export type GitHubAuthMethod = 'github_app' | 'oauth'
