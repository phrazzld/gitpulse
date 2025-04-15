/**
 * Application constants
 */

// Authentication methods
export const AUTH_METHODS = {
  OAUTH: 'oauth',
  GITHUB_APP: 'github_app',
};

// GitHub API request batch processing
export const GITHUB_API = {
  // Number of repositories to process in a single batch when fetching commits
  BATCH_SIZE: 5,
  // Default GitHub App installation URL fragment
  APP_INSTALLATION_URL_FRAGMENT: '#github-app-not-configured',
};

// Cache TTLs for server responses (in seconds)
export const SERVER_CACHE_TTL = {
  SHORT: 60, // 1 minute - for dynamic data that changes frequently
  MEDIUM: 900, // 15 minutes - for semi-dynamic data
  LONG: 3600, // 1 hour - for relatively static data
  VERY_LONG: 86400, // 24 hours - for very static data
};

// Cache TTLs for client-side localStorage (in milliseconds)
export const CLIENT_CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Local storage refresh intervals
export const STORAGE_REFRESH = {
  REPOSITORY_REFRESH_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
};