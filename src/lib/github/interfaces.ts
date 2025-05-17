/**
 * GitHub dependency interfaces
 * 
 * These interfaces define the contracts for external dependencies
 * used by the GitHub modules, enabling proper dependency injection
 * and testing at true external boundaries.
 */

import type { Endpoints } from "@octokit/types";

/**
 * Interface for Octokit client operations
 * Defines only the methods actually used by our GitHub modules
 */
export interface IOctokitClient {
  rest: {
    rateLimit: {
      get(): Promise<{ data: Endpoints["GET /rate_limit"]["response"]["data"]; status: number; headers: any }>;
    };
    users: {
      getAuthenticated(): Promise<{ data: Endpoints["GET /user"]["response"]["data"]; status: number; headers: any }>;
    };
    repos: {
      listForAuthenticatedUser(
        params?: Endpoints["GET /user/repos"]["parameters"]
      ): Promise<{ data: Endpoints["GET /user/repos"]["response"]["data"]; status: number; headers: any }>;
      listForOrg(
        params: Endpoints["GET /orgs/{org}/repos"]["parameters"]
      ): Promise<{ data: Endpoints["GET /orgs/{org}/repos"]["response"]["data"]; status: number; headers: any }>;
      listCommits(
        params: Endpoints["GET /repos/{owner}/{repo}/commits"]["parameters"]
      ): Promise<{ data: Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]["data"]; status: number; headers: any }>;
    };
    orgs: {
      listForAuthenticatedUser(
        params?: Endpoints["GET /user/orgs"]["parameters"]
      ): Promise<{ data: Endpoints["GET /user/orgs"]["response"]["data"]; status: number; headers: any }>;
    };
    apps: {
      listInstallationsForAuthenticatedUser(
        params?: Endpoints["GET /user/installations"]["parameters"]
      ): Promise<{ data: Endpoints["GET /user/installations"]["response"]["data"]; status: number; headers: any }>;
      listReposAccessibleToInstallation(
        params?: Endpoints["GET /installation/repositories"]["parameters"]
      ): Promise<{ data: Endpoints["GET /installation/repositories"]["response"]["data"]; status: number; headers: any }>;
    };
  };
  
  paginate<T>(
    endpoint: any,
    params?: any,
    mapFn?: (response: any) => T[]
  ): Promise<T[]>;
}

/**
 * Type for the fetch function dependency
 */
export type IFetchFunction = typeof fetch;

/**
 * Interface for GitHub App authentication
 */
export interface IGitHubAppAuth {
  (options: { type: "installation" }): Promise<{
    type: string;
    token: string;
    expiresAt?: string;
  }>;
}

/**
 * Interface for creating GitHub App authentication
 */
export interface IAppAuthProvider {
  createAppAuth(options: {
    appId: string;
    privateKey: string;
    installationId: number;
  }): IGitHubAppAuth;
}

/**
 * Factory function type for creating Octokit clients
 */
export type IOctokitFactory = (options: { auth: string }) => IOctokitClient;