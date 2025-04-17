/**
 * Testing-specific type definitions
 *
 * This file centralizes types used in test files to improve type safety
 * while keeping test code clean and maintainable.
 */

import { NextRequest, NextResponse } from "next/server";
import { SessionInfo } from "./api";
import { Installation, Repository, Commit } from "./github";

/**
 * Type for Jest mock functions with proper return types
 * Use this instead of jest.Mock & { mockResolvedValue: (value: any) => jest.Mock }
 */
export type TypedMockFunction<T = unknown> = {
  mockResolvedValue: (value: T) => jest.Mock;
  mockResolvedValueOnce: (value: T) => jest.Mock;
  mockRejectedValue: (error: unknown) => jest.Mock;
  mockRejectedValueOnce: (error: unknown) => jest.Mock;
  mockImplementation: (fn: (...args: unknown[]) => T) => jest.Mock;
  mockImplementationOnce: (fn: (...args: unknown[]) => T) => jest.Mock;
};

/**
 * Type for API route handlers in tests
 * Use this instead of (req: any) => any
 */
export type ApiRouteHandler = (
  req: NextRequest,
  ...args: unknown[]
) => Promise<NextResponse>;

/**
 * Type for middleware handlers in tests
 * Use this instead of (handler: any) => (req: any) => any
 */
export type MiddlewareFunction = (
  handler: ApiRouteHandler,
) => (req: NextRequest) => Promise<NextResponse>;

/**
 * Type for API error response in tests
 * Use this instead of { status: number; data: any }
 */
export interface ApiTestResponse {
  status: number;
  statusText?: string;
  data: {
    error?: string;
    code?: string;
    details?: string;
    signOutRequired?: boolean;
    needsInstallation?: boolean;
    resetAt?: string;
    [key: string]: unknown;
  };
  headers: Record<string, string>;
}

/**
 * Type for mock components props in tests
 * Use this instead of props: any
 */
export interface MockComponentProps extends Record<string, unknown> {
  className?: string;
  children?: React.ReactNode;
  repositories?: { length: number }[];
  error?: string;
  loading?: boolean;
  needsInstallation?: boolean;
  summary?: { user: string };
  activityMode?: string;
  switchInstallations?: () => void;
  handleDateRangeChange?: (dateRange: { since: string; until: string }) => void;
  setShowRepoList?: (show: boolean) => void;
  showRepoList?: boolean;
}

/**
 * Type for date range picker in tests
 * Use this instead of { dateRange: any; onChange: (range: any) => void }
 */
export interface DateRangePickerProps {
  dateRange: {
    since: string;
    until: string;
  };
  onChange: (range: { since: string; until: string }) => void;
}

/**
 * Type for error context in tests
 * Use this instead of Record<string, any>
 */
export interface ErrorContext {
  functionName?: string;
  module?: string;
  timestamp?: string | number;
  [key: string]: unknown;
}

/**
 * Type for test data returned by mock responses
 * Use this instead of response: any
 */
export interface MockResponseData {
  success?: boolean;
  error?: string;
  data?: unknown;
  status?: number;
  message?: string;
  [key: string]: unknown;
}

/**
 * Type for GitHub installation in tests
 * Use this to ensure test installations have proper shape
 */
export interface TestInstallation extends Installation {
  createdAt?: string;
  updatedAt?: string;
  permissions?: Record<string, string>;
}

/**
 * Type for GitHub repository in tests
 * Use this to ensure test repositories have proper shape
 */
export interface TestRepository extends Repository {
  createdAt?: string;
  updatedAt?: string;
  stargazersCount?: number;
  forksCount?: number;
}

/**
 * Type for test session data
 * Use this for consistent session shape in tests
 */
export interface TestSession extends SessionInfo {
  expires: string;
  token?: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresAt?: number;
  };
  test_specific_data?: unknown;
}

/**
 * Type for mock handler argument types
 * Use this instead of <T extends any[]>
 */
export type MockHandlerArgs<T extends unknown[] = unknown[]> = T;

/**
 * Type for a mock body in NextResponse
 * Use this instead of body: any
 */
export interface MockResponseBody {
  text?: string;
  json?: Record<string, unknown>;
  blob?: Blob;
  formData?: FormData;
  arrayBuffer?: ArrayBuffer;
  [key: string]: unknown;
}
