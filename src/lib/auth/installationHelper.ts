/**
 * Installation ID Helper
 *
 * Centralized utility for resolving and validating GitHub App installation IDs
 * from various sources (query parameters, session, cookies) with consistent
 * behavior and error handling.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "../logger";
import { installationIdSchema, validateQueryParams } from "../validation";
import { AppInstallation } from "./githubAuth";
import { SessionInfo } from "@/types/api";

// Module name for logging
const MODULE_NAME = "auth:installationHelper";

// Installation ID source enum for tracking where the ID was found
export enum InstallationIdSource {
  QUERY = "query",
  SESSION = "session",
  COOKIE = "cookie",
  AVAILABLE_INSTALLATIONS = "available_installations",
  FALLBACK = "fallback",
  NONE = "none",
}

// Result interface for resolveInstallationId function
export interface InstallationIdResult {
  id?: number;
  source: InstallationIdSource;
  isValid: boolean;
  error?: string;
}

// Options for resolveInstallationId function
export interface ResolveInstallationIdOptions {
  // Request object containing query parameters and cookies
  req?: NextRequest;
  // Session object that might contain an installation ID
  session?: SessionInfo;
  // Available installations from GitHub App
  availableInstallations?: AppInstallation[];
  // Query parameter name, defaults to "installation_id"
  queryParamName?: string;
  // Cookie name, defaults to "github_installation_id"
  cookieName?: string;
  // Whether to validate that the ID exists in available installations
  validateAgainstAvailable?: boolean;
  // Whether to use the first available installation if none is found
  useFirstAvailableAsFallback?: boolean;
}

/**
 * Resolve installation ID from various sources with consistent priority:
 * 1. Query parameters
 * 2. Session
 * 3. Cookies
 * 4. First available installation (if useFirstAvailableAsFallback is true)
 *
 * @param options Options for resolving the installation ID
 * @returns Result object with the installation ID, source, and validation info
 */
export function resolveInstallationId(
  options: ResolveInstallationIdOptions,
): InstallationIdResult {
  const {
    req,
    session,
    availableInstallations = [],
    queryParamName = "installation_id",
    cookieName = "github_installation_id",
    validateAgainstAvailable = true,
    useFirstAvailableAsFallback = true,
  } = options;

  logger.debug(MODULE_NAME, "Attempting to resolve installation ID", {
    hasRequest: !!req,
    hasSession: !!session,
    availableInstallationsCount: availableInstallations.length,
    validateAgainstAvailable,
    useFirstAvailableAsFallback,
  });

  // Try to get from query parameters first
  if (req?.nextUrl?.searchParams) {
    const queryValue = req.nextUrl.searchParams.get(queryParamName);

    if (queryValue) {
      logger.debug(MODULE_NAME, "Found installation ID in query parameters", {
        queryParamName,
        queryValue,
      });

      // Validate the query parameter
      const validationResult = validateQueryParams(
        req.nextUrl.searchParams,
        z.object({
          [queryParamName]: installationIdSchema,
        }),
      );

      if (!validationResult.success) {
        logger.warn(
          MODULE_NAME,
          "Invalid installation ID in query parameters",
          {
            error: validationResult.error,
          },
        );

        return {
          source: InstallationIdSource.QUERY,
          isValid: false,
          error: validationResult.error || "Invalid installation ID format",
        };
      }

      const installationId = validationResult.data?.[queryParamName];

      // If we need to validate against available installations
      if (validateAgainstAvailable && availableInstallations.length > 0) {
        const isIdAvailable = availableInstallations.some(
          (inst) => inst.id === installationId,
        );

        if (!isIdAvailable) {
          logger.warn(
            MODULE_NAME,
            "Installation ID from query not found in available installations",
            {
              requestedId: installationId,
              availableIds: availableInstallations.map((i) => i.id),
            },
          );

          return {
            id: installationId,
            source: InstallationIdSource.QUERY,
            isValid: false,
            error: "Installation ID not found in available installations",
          };
        }
      }

      return {
        id: installationId,
        source: InstallationIdSource.QUERY,
        isValid: true,
      };
    }
  }

  // Try to get from session next
  if (session?.installationId) {
    logger.debug(MODULE_NAME, "Found installation ID in session", {
      installationId: session.installationId,
    });

    // Validate the installation ID
    try {
      const validatedId = installationIdSchema.parse(session.installationId);

      // If we need to validate against available installations
      if (validateAgainstAvailable && availableInstallations.length > 0) {
        const isIdAvailable = availableInstallations.some(
          (inst) => inst.id === validatedId,
        );

        if (!isIdAvailable) {
          logger.warn(
            MODULE_NAME,
            "Installation ID from session not found in available installations",
            {
              sessionId: validatedId,
              availableIds: availableInstallations.map((i) => i.id),
            },
          );

          return {
            id: validatedId,
            source: InstallationIdSource.SESSION,
            isValid: false,
            error: "Installation ID not found in available installations",
          };
        }
      }

      return {
        id: validatedId,
        source: InstallationIdSource.SESSION,
        isValid: true,
      };
    } catch (error) {
      logger.warn(MODULE_NAME, "Invalid installation ID in session", {
        error,
      });

      return {
        source: InstallationIdSource.SESSION,
        isValid: false,
        error: "Invalid installation ID in session",
      };
    }
  }

  // Try to get from cookies
  if (req?.headers) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader && cookieHeader.includes(`${cookieName}=`)) {
      const regex = new RegExp(`${cookieName}=([^;]+)`);
      const match = cookieHeader.match(regex);

      if (match && match[1]) {
        const cookieValue = match[1];
        logger.debug(MODULE_NAME, "Found installation ID in cookie", {
          cookieName,
          cookieValue,
        });

        try {
          const parsedId = parseInt(cookieValue, 10);
          const validatedId = installationIdSchema.parse(parsedId);

          // If we need to validate against available installations
          if (validateAgainstAvailable && availableInstallations.length > 0) {
            const isIdAvailable = availableInstallations.some(
              (inst) => inst.id === validatedId,
            );

            if (!isIdAvailable) {
              logger.warn(
                MODULE_NAME,
                "Installation ID from cookie not found in available installations",
                {
                  cookieId: validatedId,
                  availableIds: availableInstallations.map((i) => i.id),
                },
              );

              return {
                id: validatedId,
                source: InstallationIdSource.COOKIE,
                isValid: false,
                error: "Installation ID not found in available installations",
              };
            }
          }

          return {
            id: validatedId,
            source: InstallationIdSource.COOKIE,
            isValid: true,
          };
        } catch (error) {
          logger.warn(MODULE_NAME, "Invalid installation ID in cookie", {
            error,
          });

          return {
            source: InstallationIdSource.COOKIE,
            isValid: false,
            error: "Invalid installation ID in cookie",
          };
        }
      }
    }
  }

  // Fall back to first available installation if requested
  if (
    useFirstAvailableAsFallback &&
    availableInstallations.length > 0 &&
    availableInstallations[0].id
  ) {
    const fallbackId = availableInstallations[0].id;

    logger.info(MODULE_NAME, "Using first available installation as fallback", {
      fallbackId,
      account: availableInstallations[0].account?.login || "unknown",
    });

    return {
      id: fallbackId,
      source: InstallationIdSource.AVAILABLE_INSTALLATIONS,
      isValid: true,
    };
  }

  // No installation ID found
  logger.info(MODULE_NAME, "No installation ID found from any source");
  return {
    source: InstallationIdSource.NONE,
    isValid: false,
    error: "No installation ID found",
  };
}

/**
 * Resolve multiple installation IDs from a comma-separated query parameter
 *
 * @param options Options for resolving the installation IDs
 * @returns Array of valid installation IDs
 */
export function resolveMultipleInstallationIds(
  options: ResolveInstallationIdOptions & {
    queryParamName?: string; // Defaults to "installation_ids"
  },
): number[] {
  const {
    req,
    session,
    availableInstallations = [],
    queryParamName = "installation_ids",
    validateAgainstAvailable = true,
    useFirstAvailableAsFallback = true,
  } = options;

  logger.debug(MODULE_NAME, "Attempting to resolve multiple installation IDs", {
    hasRequest: !!req,
    hasSession: !!session,
    availableInstallationsCount: availableInstallations.length,
  });

  let installationIds: number[] = [];

  // Try to get from query parameters first (comma-separated list)
  if (req?.nextUrl?.searchParams) {
    const queryValue = req.nextUrl.searchParams.get(queryParamName);

    if (queryValue) {
      const parsedIds = queryValue
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

      logger.debug(MODULE_NAME, "Found installation IDs in query parameters", {
        queryParamName,
        parsedIds,
      });

      // Validate each ID
      const validIds = parsedIds.filter((id) => {
        try {
          installationIdSchema.parse(id);
          return true;
        } catch (e) {
          return false;
        }
      });

      // Filter to only IDs that are available to the user if needed
      if (validateAgainstAvailable && availableInstallations.length > 0) {
        const validAvailableIds = validIds.filter((id) =>
          availableInstallations.some((inst) => inst.id === id),
        );

        // Log any IDs that weren't found in available installations
        const invalidIds = validIds.filter(
          (id) => !validAvailableIds.includes(id),
        );

        if (invalidIds.length > 0) {
          logger.warn(
            MODULE_NAME,
            "Some installation IDs not found in available installations",
            {
              invalidIds,
              availableIds: availableInstallations.map((i) => i.id),
            },
          );
        }

        installationIds = validAvailableIds;
      } else {
        installationIds = validIds;
      }
    }
  }

  // If no IDs found in query, try the session
  if (installationIds.length === 0 && session?.installationId) {
    logger.debug(MODULE_NAME, "Using installation ID from session", {
      sessionId: session.installationId,
    });

    try {
      const validatedId = installationIdSchema.parse(session.installationId);

      // Check if the session ID is in available installations if needed
      if (validateAgainstAvailable && availableInstallations.length > 0) {
        const isIdAvailable = availableInstallations.some(
          (inst) => inst.id === validatedId,
        );

        if (isIdAvailable) {
          installationIds = [validatedId];
        } else {
          logger.warn(
            MODULE_NAME,
            "Session installation ID not found in available installations",
            {
              sessionId: validatedId,
            },
          );
        }
      } else {
        installationIds = [validatedId];
      }
    } catch (error) {
      logger.warn(MODULE_NAME, "Invalid installation ID in session", {
        error,
      });
    }
  }

  // If still no IDs, check cookies
  if (installationIds.length === 0 && req?.headers) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader && cookieHeader.includes("github_installation_id=")) {
      const match = cookieHeader.match(/github_installation_id=([^;]+)/);

      if (match && match[1]) {
        try {
          const cookieId = parseInt(match[1], 10);
          const validatedId = installationIdSchema.parse(cookieId);

          // Check if the cookie ID is in available installations if needed
          if (validateAgainstAvailable && availableInstallations.length > 0) {
            const isIdAvailable = availableInstallations.some(
              (inst) => inst.id === validatedId,
            );

            if (isIdAvailable) {
              installationIds = [validatedId];
              logger.info(MODULE_NAME, "Using installation ID from cookie", {
                cookieId: validatedId,
              });
            } else {
              logger.warn(
                MODULE_NAME,
                "Cookie installation ID not found in available installations",
                {
                  cookieId: validatedId,
                },
              );
            }
          } else {
            installationIds = [validatedId];
            logger.info(MODULE_NAME, "Using installation ID from cookie", {
              cookieId: validatedId,
            });
          }
        } catch (error) {
          logger.warn(MODULE_NAME, "Invalid installation ID in cookie", {
            error,
          });
        }
      }
    }
  }

  // If still no IDs and fallback is enabled, use first available installation
  if (
    installationIds.length === 0 &&
    useFirstAvailableAsFallback &&
    availableInstallations.length > 0
  ) {
    installationIds = [availableInstallations[0].id];
    logger.info(MODULE_NAME, "Using first available installation as fallback", {
      fallbackId: availableInstallations[0].id,
      account: availableInstallations[0].account?.login || "unknown",
    });
  }

  return installationIds;
}

/**
 * Throws an error if no valid installation ID is found
 * Useful for API routes that require an installation ID
 *
 * @param options Options for resolving the installation ID
 * @returns The resolved installation ID if found
 * @throws Error if no valid installation ID is found
 */
export function requireInstallationId(
  options: ResolveInstallationIdOptions,
): number {
  const result = resolveInstallationId(options);

  if (!result.isValid || !result.id) {
    const error = new Error(result.error || "No valid installation ID found");
    logger.error(MODULE_NAME, "Failed to resolve required installation ID", {
      error,
      source: result.source,
    });

    // Add metadata to the error object
    Object.assign(error, {
      code: "INSTALLATION_ID_REQUIRED",
      needsInstallation: true,
      source: result.source,
    });

    throw error;
  }

  return result.id;
}
