/**
 * Utility functions for the GitPulse dashboard
 */

/**
 * Gets today's date formatted as YYYY-MM-DD
 * @returns The current date as an ISO string (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  const today = new Date();
  return formatDateToISOString(today);
}

/**
 * Gets the date from a week ago formatted as YYYY-MM-DD
 * @returns The date from 7 days ago as an ISO string (YYYY-MM-DD)
 */
export function getLastWeekDate(): string {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return formatDateToISOString(lastWeek);
}

/**
 * Formats a date object to ISO string date format (YYYY-MM-DD)
 * @param date - The date to format
 * @returns The formatted date string
 */
export function formatDateToISOString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets the GitHub App installation URL using the configured app name
 * @returns The URL for GitHub App installation, or an error indicator if not configured
 */
export function getGitHubAppInstallUrl(): string {
  // Use the provided app name or a generic message if not configured
  const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
  
  if (!appName) {
    // If no app name is configured, create a more informative error
    console.error("GitHub App name not configured. Please set NEXT_PUBLIC_GITHUB_APP_NAME environment variable.");
    return "#github-app-not-configured";
  }
  
  // Use the standard GitHub App installation URL
  return `https://github.com/apps/${appName}/installations/new`;
}

/**
 * Creates a date range object with the specified since and until dates
 * @param since - The start date (YYYY-MM-DD)
 * @param until - The end date (YYYY-MM-DD) 
 * @returns An object with since and until properties
 */
export function createDateRange(since: string, until: string): { since: string; until: string } {
  return {
    since,
    until
  };
}

/**
 * Creates a default date range from a week ago to today
 * @returns A date range object with since set to a week ago and until set to today
 */
export function getDefaultDateRange(): { since: string; until: string } {
  return {
    since: getLastWeekDate(),
    until: getTodayDate()
  };
}