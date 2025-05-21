/**
 * Extended Octokit Type Definitions
 *
 * This module provides extended type definitions for Octokit API responses
 * to handle cases where the official type definitions are incomplete or
 * don't match the actual API responses.
 */

import { Octokit } from "octokit";
import { Repository, Commit } from "./types";

/**
 * Extended Octokit response for repository data
 * Handles varying response formats from different Octokit endpoints
 */
export type OctokitRepositoryResponse = Repository | Repository[] | unknown;

/**
 * Type guard to check if a response is a Repository array
 */
export function isRepositoryArray(data: unknown): data is Repository[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    "full_name" in data[0]
  );
}

/**
 * Type guard to check if a response is a single Repository
 */
export function isSingleRepository(data: unknown): data is Repository {
  return (
    typeof data === "object" &&
    data !== null &&
    "full_name" in data
  );
}

/**
 * Safely converts an Octokit repository response to a typed Repository array
 */
export function normalizeRepositoryResponse(data: OctokitRepositoryResponse): Repository[] {
  if (isRepositoryArray(data)) {
    return data;
  }
  
  if (isSingleRepository(data)) {
    return [data];
  }
  
  return [];
}

/**
 * Safe accessor for potentially undefined properties in API responses
 */
export function safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  return obj[key];
}

/**
 * Safely extracts account login from an account object that may have varying structure
 */
export function safeExtractLogin(account: unknown): string | undefined {
  if (
    account &&
    typeof account === "object" &&
    account !== null &&
    "login" in account &&
    typeof account.login === "string"
  ) {
    return account.login;
  }
  return undefined;
}

/**
 * Safely extracts account type from an account object that may have varying structure
 */
export function safeExtractType(account: unknown): string | undefined {
  if (
    account &&
    typeof account === "object" &&
    account !== null &&
    "type" in account &&
    typeof account.type === "string"
  ) {
    return account.type;
  }
  return undefined;
}