/**
 * Hook for generating activity summaries using Zustand store
 *
 * This hook provides the functionality to generate activity summaries
 * and stores the results directly in the Zustand store.
 */

import { useCallback } from "react";
import { useStore } from "../store";
import { StateSlice } from "../types";
import { useErrorHandlers } from "../hooks";

export function useSummaryGeneration() {
  // Access relevant state directly from Zustand store
  const dateRange = useStore((state) => state[StateSlice.Dashboard].dateRange);
  const installationIds = useStore(
    (state) => state[StateSlice.Dashboard].installationIds,
  );
  const activeFilters = useStore(
    (state) => state[StateSlice.Dashboard].activeFilters,
  );

  // Access actions from the store
  const setLoading = useStore(
    (state) => state[StateSlice.Dashboard].setLoading,
  );
  const setError = useStore((state) => state[StateSlice.Dashboard].setError);
  const setSummary = useStore(
    (state) => state[StateSlice.Dashboard].setSummary,
  );
  const setAuthMethod = useStore(
    (state) => state[StateSlice.Dashboard].setAuthMethod,
  );
  const setInstallationIds = useStore(
    (state) => state[StateSlice.Dashboard].setInstallationIds,
  );
  const setInstallations = useStore(
    (state) => state[StateSlice.Dashboard].setInstallations,
  );
  const setCurrentInstallations = useStore(
    (state) => state[StateSlice.Dashboard].setCurrentInstallations,
  );
  const setNeedsInstallation = useStore(
    (state) => state[StateSlice.Dashboard].setNeedsInstallation,
  );

  // Get error handlers
  const { handleAuthError, handleAppInstallationNeeded } = useErrorHandlers();

  const generateSummary = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setLoading(true);
        setError(null);
        setSummary(null);

        const params = buildSummaryQueryParams(
          dateRange,
          installationIds,
          activeFilters,
        );
        const response: Response = await fetch(
          `/api/summary?${params.toString()}`,
        );

        if (!response.ok) {
          // Parse the error response using the standardized API error format
          const errorData: {
            error?: string;
            code?: string;
            details?: string;
            requestId?: string;
            signOutRequired?: boolean;
            needsInstallation?: boolean;
            resetAt?: string;
            metadata?: Record<string, unknown>;
          } = await response.json();

          // Log the error with request ID if available for debugging
          if (errorData.requestId) {
            console.error(
              `API Error [${errorData.requestId}]:`,
              errorData.error,
              errorData.code,
            );
          }

          // Check if app installation is needed
          if (errorData.needsInstallation) {
            handleAppInstallationNeeded();
            return;
          }

          // Check if authentication error (rely on standardized fields)
          if (
            errorData.signOutRequired ||
            response.status === 401 ||
            response.status === 403 ||
            errorData.code === "GITHUB_AUTH_ERROR" ||
            errorData.code === "GITHUB_TOKEN_ERROR" ||
            errorData.code === "GITHUB_SCOPE_ERROR" ||
            errorData.code === "GITHUB_APP_CONFIG_ERROR"
          ) {
            handleAuthError();
            return;
          }

          // Create error object with all standardized properties
          const error = new Error(
            errorData.error || "Failed to generate summary",
          );

          // Add all standardized properties to the error object
          Object.assign(error, {
            code: errorData.code || "API_ERROR",
            details: errorData.details,
            requestId: errorData.requestId,
            signOutRequired: errorData.signOutRequired || false,
            needsInstallation: errorData.needsInstallation || false,
            resetAt: errorData.resetAt,
            metadata: errorData.metadata,
          });

          throw error;
        }

        const data = await response.json();

        setSummary(data);

        // Update auth method and installation IDs if available
        if (data.authMethod) {
          setAuthMethod(data.authMethod);
        }

        if (data.installationIds && data.installationIds.length > 0) {
          setInstallationIds(data.installationIds);
          setNeedsInstallation(false); // Clear the installation needed flag
        }

        // Update installations list
        if (data.installations && data.installations.length > 0) {
          setInstallations(data.installations);
        }

        // Update current installations
        if (data.currentInstallations && data.currentInstallations.length > 0) {
          setCurrentInstallations(data.currentInstallations);
        }
      } catch (error: unknown) {
        console.error("Error generating summary:", error);

        // Handle standardized API error format
        if (error instanceof Error) {
          // Check for API-specific properties
          const apiError = error as Error & {
            code?: string;
            details?: string;
            requestId?: string;
            signOutRequired?: boolean;
            needsInstallation?: boolean;
            resetAt?: string;
            metadata?: Record<string, unknown>;
          };

          // If it's a sign-out required error that wasn't caught earlier
          if (apiError.signOutRequired) {
            handleAuthError();
            return;
          }

          // If it's an installation needed error that wasn't caught earlier
          if (apiError.needsInstallation) {
            handleAppInstallationNeeded();
            return;
          }

          // Include error details in the message if available
          let errorMessage = apiError.message;
          if (apiError.details && !errorMessage.includes(apiError.details)) {
            errorMessage = `${errorMessage}${apiError.details ? `: ${apiError.details}` : ""}`;
          }

          setError(errorMessage);
        } else {
          setError("Failed to generate summary. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      dateRange,
      installationIds,
      activeFilters,
      setLoading,
      setError,
      setSummary,
      setAuthMethod,
      setInstallationIds,
      setInstallations,
      setCurrentInstallations,
      setNeedsInstallation,
      handleAuthError,
      handleAppInstallationNeeded,
    ],
  );

  return { generateSummary };
}

// Helper function to build query parameters for summary API
function buildSummaryQueryParams(
  dateRange: { since: string; until: string },
  installationIds: number[],
  activeFilters: { repositories: string[] },
): URLSearchParams {
  // Construct query parameters
  const params = new URLSearchParams({
    since: dateRange.since,
    until: dateRange.until,
  });

  // Add installation IDs if available
  if (installationIds.length > 0) {
    params.append("installation_ids", installationIds.join(","));
  }

  // Add filter parameters
  if (activeFilters.repositories.length > 0) {
    params.append("repositories", activeFilters.repositories.join(","));
  }

  // Always use chronological view
  params.append("groupBy", "chronological");

  return params;
}
