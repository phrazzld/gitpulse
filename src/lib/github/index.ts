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
export { getInstallationManagementUrl } from './auth';

// Set the module name for logging
export const MODULE_NAME = "github";