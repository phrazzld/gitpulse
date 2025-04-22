/**
 * Utility functions for handling Zustand store state
 */

const STORE_KEY = "gitpulse-store";

/**
 * Checks for and clears corrupted localStorage state
 *
 * @returns true if store was corrupted and cleared, false otherwise
 */
export function clearCorruptedStore(): boolean {
  try {
    if (typeof window === "undefined") return false;

    const storedState = localStorage.getItem(STORE_KEY);

    if (!storedState) return false;

    try {
      // Try to parse the stored state
      JSON.parse(storedState);
      return false; // If we can parse it, it's not corrupted
    } catch (e) {
      // If we can't parse it, it's corrupted - clear it
      console.warn("Detected corrupted store state, clearing localStorage");
      localStorage.removeItem(STORE_KEY);
      return true;
    }
  } catch (error) {
    console.error("Error checking localStorage:", error);
    return false;
  }
}

/**
 * Completely resets the store state
 */
export function resetStore(): boolean {
  try {
    if (typeof window === "undefined") return false;

    localStorage.removeItem(STORE_KEY);
    console.log("Store state has been reset");
    return true;
  } catch (error) {
    console.error("Error resetting store:", error);
    return false;
  }
}
