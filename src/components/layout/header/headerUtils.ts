import { LogData } from "@/types/common";
import { logger } from "@/lib/logger";
import type { Session } from "next-auth";

/**
 * Logs mobile menu toggle events
 *
 * @param isOpen - The new state of the mobile menu
 * @param pathname - The current URL path
 * @param session - The user session, if available
 */
export function logMobileMenuToggle(
  isOpen: boolean,
  pathname: string,
  session?: Session | null,
): void {
  // Build log data object with action and path context
  const logData: LogData = {
    action: isOpen ? "open_mobile_menu" : "close_mobile_menu",
    path: pathname,
  };

  // Add authentication context to log data
  if (session?.user) {
    logData.userId = session.user.email || session.user.name;
    logData.authenticated = true;
  } else {
    logData.authenticated = false;
  }

  // Log the menu toggle event
  logger.info("Header", `Mobile menu ${isOpen ? "opened" : "closed"}`, logData);
}
