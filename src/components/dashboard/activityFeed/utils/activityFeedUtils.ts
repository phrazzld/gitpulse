/**
 * Utility functions for the ActivityFeed components
 */

/**
 * Formats a date string into a localized date-time format
 *
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
export function formatCommitDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculates the height of the activity list based on the number of items and truncation state
 *
 * @param itemCount - Number of items in the list
 * @param itemHeight - Height of each individual item
 * @param truncated - Whether the list is in truncated mode
 * @param maxItems - Maximum number of items to display
 * @returns Calculated list height in pixels
 */
export function calculateListHeight(
  itemCount: number,
  itemHeight: number,
  truncated: boolean,
  maxItems?: number,
): number {
  const maxHeight = truncated ? 300 : 600;
  const effectiveItemCount =
    truncated && maxItems ? Math.min(itemCount, maxItems) : itemCount;

  return Math.min(maxHeight, Math.max(200, effectiveItemCount * itemHeight));
}

/**
 * Extracts the first line of a commit message for the title
 *
 * @param message - Full commit message
 * @returns First line of the commit message
 */
export function extractCommitTitle(message: string): string {
  return message.split("\n")[0];
}
