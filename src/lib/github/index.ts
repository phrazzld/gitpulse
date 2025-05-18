/**
 * GitHub module index
 * 
 * This module provides the public API for the GitHub modules,
 * exporting types, interfaces, and the adapter layer for dependency injection.
 */

// Re-export all types
export * from './types';

// Re-export interfaces for dependency injection
export * from './interfaces';

// Re-export the adapter for creating configured services
export * from './adapter';

// For backward compatibility, also export individual module functions
// Note: These exports are for backward compatibility only. 
// New code should use the adapter pattern via createGitHubClient or createGitHubServices
export { 
  getInstallationManagementUrl,
  getAllAppInstallations,
  checkAppInstallation,
  getInstallationOctokit,
  createOAuthOctokit,
  validateOAuthToken
} from './auth';

export {
  fetchAllRepositories,
  fetchAllRepositoriesOAuth,
  fetchAllRepositoriesApp,
  fetchAllRepositoriesApp as fetchInstallationRepositories, // backward compatibility alias
  fetchAllRepositoriesOAuth as fetchOrganizationRepositories, // backward compatibility alias
  fetchAllRepositoriesOAuth as fetchUserRepositories, // backward compatibility alias
  fetchAllRepositories as getAllRepositories // backward compatibility alias
} from './repositories';

export {
  fetchRepositoryCommits,
  fetchRepositoryCommitsOAuth,
  fetchRepositoryCommitsApp,
  fetchCommitsForRepositories
} from './commits';

export {
  checkRateLimit,
  parseTokenScopes,
  validateTokenScopes,
  getRepoIdentifier,
  splitRepoFullName,
  deduplicateBy,
  processBatches,
  formatGitHubError
} from './utils';

// Set the module name for logging
export const MODULE_NAME = "github";