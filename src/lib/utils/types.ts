/**
 * Type utilities for consistent type handling across the application
 */

/**
 * Type guard to check if a value is an Error
 * @param e - The value to check
 * @returns True if the value is an Error or error-like object
 */
export function isError(e: unknown): e is Error {
  return e instanceof Error || (typeof e === 'object' && e !== null && 'message' in e);
}

/**
 * Type guard to check if a value is an HTTP error
 * @param e - The value to check
 * @returns True if the value has status and message properties
 */
export function isHttpError(e: unknown): e is { status: number; message: string } {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e;
}

/**
 * Type guard to check if a value is a GitHub API error
 * @param e - The value to check
 * @returns True if the value has name, message, and documentation_url properties
 */
export function isGitHubApiError(e: unknown): e is { 
  name: string; 
  message: string; 
  documentation_url?: string;
  status?: number;
} {
  return typeof e === 'object' && e !== null && 'message' in e && 
    ('name' in e || ('status' in e && (e as any).status === 401 || (e as any).status === 403));
}

/**
 * Safely extract a message from an unknown error
 * @param e - The error value
 * @returns A string message representing the error
 */
export function getErrorMessage(e: unknown): string {
  if (isError(e)) {
    return e.message;
  }
  if (typeof e === 'string') {
    return e;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unknown error occurred';
  }
}