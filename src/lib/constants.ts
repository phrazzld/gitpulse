/**
 * Application constants
 */

// Authentication methods
export const AUTH_METHODS = {
  OAUTH: "oauth",
  GITHUB_APP: "github_app",
};

// GitHub API request batch processing
export const GITHUB_API = {
  // Number of repositories to process in a single batch when fetching commits
  BATCH_SIZE: 5,
  // Default GitHub App installation URL fragment
  APP_INSTALLATION_URL_FRAGMENT: "#github-app-not-configured",
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

// Error messages
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    GITHUB_AUTH_ERROR:
      "GitHub authentication issue detected. Your token may be invalid, expired, or missing required permissions. Please sign out and sign in again to grant all necessary permissions.",
    SESSION_EXPIRED: "Your session has expired. Please sign in again.",
    UNAUTHORIZED:
      "You are not authorized to access this resource. Please sign in with the appropriate credentials.",
    INVALID_TOKEN:
      "Invalid authentication token. Please sign out and sign in again.",
    MISSING_SCOPES:
      "Your GitHub token is missing required permissions. Please sign out and sign in again to grant all necessary permissions.",
  },

  // Installation errors
  INSTALLATION: {
    INSTALLATION_NEEDED:
      "GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.",
    INSTALLATION_FAILED:
      "Failed to install GitHub App. Please try again or contact support.",
    INVALID_INSTALLATION_ID:
      "Invalid installation ID. Please select a valid GitHub App installation.",
  },

  // API errors
  API: {
    GENERIC_ERROR:
      "An error occurred while communicating with the server. Please try again later.",
    RATE_LIMIT: "GitHub API rate limit exceeded. Please try again later.",
    REPOSITORY_FETCH_ERROR: "Failed to fetch repositories. Please try again.",
    SUMMARY_FETCH_ERROR:
      "Failed to generate activity summary. Please try again.",
  },
};
