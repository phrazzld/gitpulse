/**
 * Error Logger Utility
 *
 * Provides structured error logging for UI components with component context
 * and standardized formatting.
 */

import { logger } from "./logger";
import { ErrorInfo } from "react";

/**
 * Log a UI component error with structured data
 *
 * @param componentName - Name/ID of the component that had the error
 * @param error - The Error object that was caught
 * @param errorInfo - React ErrorInfo containing component stack
 * @param additionalContext - Any additional context information
 */
export function logUIError(
  componentName: string,
  error: Error,
  errorInfo?: ErrorInfo | null,
  additionalContext?: Record<string, unknown>,
): void {
  logger.error("UIError", `Error in component: ${componentName}`, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    componentStack: errorInfo?.componentStack ?? "No component stack available",
    component: componentName,
    ...additionalContext,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Generate a correlation ID for tracking related errors
 *
 * @returns A string ID in format: prefix-timestamp-random
 */
export function generateErrorCorrelationId(prefix = "err"): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format an error for display to users
 *
 * Creates a user-friendly error message with optional details
 * that can be shown in the UI.
 *
 * @param error - The error to format
 * @param includeStack - Whether to include stack trace (default: false)
 * @returns Formatted error message
 */
export function formatErrorForDisplay(
  error: Error,
  includeStack = false,
): string {
  const message = `${error.name}: ${error.message}`;

  if (includeStack && error.stack && process.env.NODE_ENV !== "production") {
    // Only include stack in non-production environments
    return `${message}\n\n${error.stack}`;
  }

  return message;
}
