/**
 * Extended GitHub Provider Types
 *
 * This module extends the NextAuth GitHub provider types to include
 * additional properties that are supported but not included in the
 * original type definitions.
 */

/**
 * Interface for the getCallbackUrl function's return value
 * to support proper typing with the GitHub provider configuration
 */
export interface GitHubProviderCallbackConfig {
  /**
   * Custom callback URL for the OAuth provider
   * This overrides the default callback URL that NextAuth generates
   */
  callbackUrl: string;
}