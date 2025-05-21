/**
 * Type definitions for session-related types
 * These types extend the basic NextAuth session types found in next-auth.d.ts
 */

import { Session } from "next-auth";

/**
 * Extended session interface for GitPulse app
 * This is the session object provided to API routes via withAuthValidation
 */
export interface GitPulseSession extends Session {
  accessToken?: string;
  installationId?: number;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  profile?: {
    login?: string;
    [key: string]: unknown;
  };
  expires: string;
}

/**
 * Type for API route handlers that use session authentication
 */
export interface GitHubAuthOptions {
  accessToken?: string;
  installationId?: number;
}

/**
 * Type for GitHub authentication token related info
 */
export interface GitHubTokenInfo {
  length?: number;
  prefix?: string;
}

/**
 * Mock user request for test authentication
 */
export interface MockUserRequest {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

/**
 * Type for mock session data in testing
 */
export interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  expires: string;
  accessToken: string;
  installationId: number;
}