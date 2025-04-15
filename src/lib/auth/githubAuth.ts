// GitHub authentication module
// This module centralizes GitHub authentication logic for both OAuth and App-based authentication

import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { logger } from "../logger";
import {
  GitHubError,
  GitHubAuthError,
  GitHubConfigError,
  GitHubApiError,
  handleGitHubError
} from "../errors";
import { AUTH_METHODS } from "../constants";

// Module name for consistent logging
const MODULE_NAME = "githubAuth";

/**
 * Discriminated union type representing the different authentication methods for GitHub.
 * This allows for type-safe handling of authentication variants in a single interface.
 */
export type GitHubCredentials =
  | { type: 'oauth'; token: string }
  | { type: 'app'; installationId: number };

/**
 * This module will contain authentication-related functions for GitHub,
 * including:
 * 
 * - Creating authenticated Octokit instances (for both OAuth and App auth)
 * - Checking App installations
 * - Managing GitHub App installations
 * 
 * The functions will be implemented in subsequent tasks according to the plan.
 */