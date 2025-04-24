/**
 * GitHub utilities module
 * 
 * Provides common utility functions for working with GitHub APIs,
 * including rate limit handling, data transformation, and error formatting.
 */

import { Octokit } from "octokit";
import { logger } from "../logger";

const MODULE_NAME = "github:utils";

/**
 * GitHub API rate limit information
 */
export interface RateLimitInfo {
  readonly limit: number;
  readonly remaining: number;
  readonly reset: Date;
  readonly usedPercent: number;
}

/**
 * Check GitHub API rate limits for the given Octokit instance
 * @param octokit Authenticated Octokit instance
 * @param authMethod Optional label for the authentication method used (for logging)
 * @returns Rate limit information or null if checking failed
 */
export async function checkRateLimit(
  octokit: Octokit,
  authMethod: string = ""
): Promise<RateLimitInfo | null> {
  const authLabel = authMethod ? ` (${authMethod})` : "";
  
  try {
    const rateLimit = await octokit.rest.rateLimit.get();
    const core = rateLimit.data.resources.core;
    
    const rateLimitInfo: RateLimitInfo = {
      limit: core.limit,
      remaining: core.remaining,
      reset: new Date(core.reset * 1000),
      usedPercent: 100 - Number(((core.remaining / core.limit) * 100).toFixed(1)),
    };
    
    logger.info(MODULE_NAME, `GitHub API rate limit status${authLabel}`, {
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      reset: rateLimitInfo.reset.toISOString(),
      usedPercent: rateLimitInfo.usedPercent,
    });
    
    if (rateLimitInfo.remaining < 100) {
      logger.warn(MODULE_NAME, `GitHub API rate limit is running low${authLabel}`, {
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.reset.toISOString(),
      });
    }
    
    return rateLimitInfo;
  } catch (error) {
    logger.warn(MODULE_NAME, `Failed to check GitHub API rate limits${authLabel}`, {
      error,
    });
    return null;
  }
}

/**
 * Parse the OAuth token scopes from response headers
 * @param scopesHeader The x-oauth-scopes header value
 * @returns Array of scope strings
 */
export function parseTokenScopes(scopesHeader: string = ""): string[] {
  return scopesHeader ? scopesHeader.split(", ") : [];
}

/**
 * Check if the OAuth token has necessary scopes
 * @param scopes Array of token scopes
 * @param requiredScopes Array of required scopes
 * @returns Object with validation results
 */
export function validateTokenScopes(
  scopes: string[],
  requiredScopes: string[] = ["repo"]
): { 
  isValid: boolean;
  missingScopes: string[];
} {
  const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));
  return {
    isValid: missingScopes.length === 0,
    missingScopes
  };
}

/**
 * Create repository identification string
 * @param owner Repository owner (user or organization)
 * @param repo Repository name
 * @returns Repository identifier string (owner/repo)
 */
export function getRepoIdentifier(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

/**
 * Split a full repository name into owner and repo parts
 * @param fullName Repository full name (owner/repo)
 * @returns Tuple of [owner, repo] or empty strings if invalid
 */
export function splitRepoFullName(fullName: string): [string, string] {
  if (!fullName || typeof fullName !== 'string') {
    return ['', ''];
  }
  
  const parts = fullName.split('/');
  if (parts.length !== 2) {
    return ['', ''];
  }
  
  return [parts[0], parts[1]];
}

/**
 * Deduplicate an array of items by a key
 * @param items Array of items to deduplicate
 * @param keyFn Function to extract the key to deduplicate by
 * @returns Deduplicated array of items
 */
export function deduplicateBy<T>(items: T[], keyFn: (item: T) => string | number): T[] {
  logger.debug(MODULE_NAME, "Deduplicating items", {
    count: items.length,
  });
  
  const uniqueItems = Array.from(
    new Map(items.map(item => [keyFn(item), item])).values()
  );
  
  const duplicatesRemoved = items.length - uniqueItems.length;
  if (duplicatesRemoved > 0) {
    logger.info(MODULE_NAME, "Removed duplicate items", {
      before: items.length,
      after: uniqueItems.length,
      removed: duplicatesRemoved
    });
  }
  
  return uniqueItems;
}

/**
 * Process an array of items in batches with a maximum batch size
 * @param items Array of items to process
 * @param batchSize Maximum batch size
 * @param processBatch Function to process each batch
 * @returns Combined results from all batches
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processBatch: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  logger.debug(MODULE_NAME, "Processing items in batches", {
    totalItems: items.length,
    batchSize
  });
  
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    logger.debug(MODULE_NAME, `Processing batch ${Math.floor(i / batchSize) + 1}`, {
      batchSize: batch.length,
      itemsProcessed: i,
      totalItems: items.length
    });
    
    const batchResults = await processBatch(batch);
    results.push(...batchResults);
  }
  
  logger.debug(MODULE_NAME, "Completed batch processing", {
    totalItems: items.length,
    totalResults: results.length
  });
  
  return results;
}

/**
 * Format error messages from GitHub API errors
 * @param error The error object
 * @returns Formatted error message
 */
export function formatGitHubError(error: unknown): string {
  if (!error) {
    return "Unknown GitHub API error";
  }
  
  if (error instanceof Error) {
    // Check for Octokit errors with response data
    if ('response' in error && typeof (error as any).response === 'object') {
      const response = (error as any).response;
      if (response.status === 401) {
        return "GitHub authentication failed. Please sign in again.";
      }
      if (response.status === 403) {
        return "Access denied by GitHub. You may not have permission or have exceeded rate limits.";
      }
      if (response.status === 404) {
        return "GitHub resource not found. The repository or resource may not exist or you lack permission.";
      }
      
      // Extract message from response data if available
      if (response.data && response.data.message) {
        return `GitHub API error: ${response.data.message}`;
      }
      
      return `GitHub API error: ${response.status} ${response.statusText || ''}`.trim();
    }
    
    return `GitHub error: ${error.message}`;
  }
  
  // If error is a string or other primitive
  return `GitHub error: ${String(error)}`;
}