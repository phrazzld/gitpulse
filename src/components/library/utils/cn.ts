/**
 * Utility function for merging Tailwind CSS class names
 *
 * This function combines the functionality of:
 * - clsx: for conditionally joining class names together
 * - tailwind-merge: for properly handling Tailwind utility conflicts
 *
 * @example
 * // Basic usage
 * cn('px-2', 'py-3') // => "px-2 py-3"
 *
 * @example
 * // Conditional classes
 * cn('px-2', isActive && 'bg-blue-500') // => "px-2 bg-blue-500" or "px-2"
 *
 * @example
 * // Handling conflicts (last one wins)
 * cn('px-2', 'px-4') // => "px-4"
 */

import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges multiple class names together and resolves Tailwind CSS conflicts
 *
 * @param inputs - Class names to merge (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
