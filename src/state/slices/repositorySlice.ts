/**
 * Repository State Slice for Zustand
 *
 * @deprecated This slice is being consolidated into dashboardSlice.ts to reduce duplication.
 * Use the Dashboard slice for all repository-related state and actions. This file
 * is now a type-safe adapter that delegates to dashboardSlice and will be removed
 * in a future update once all code is migrated to use the Dashboard slice directly.
 */

import { StateCreator } from "zustand";
import { RootState, StateSlice } from "../types";
import { Repository, Installation } from "@/types/github";

/**
 * Define the state interface for repository slice
 */
export interface RepositoryState {
  // Data state
  repositories: Repository[];
  installationIds: number[];
  installations: Installation[];
  currentInstallations: Installation[];
  loading: boolean;
  initialLoad: boolean;
  error: string | null;
  authMethod: string | null;
  needsInstallation: boolean;
  lastRefreshTime: number | null;
}

/**
 * Define the actions interface for repository slice
 */
export interface RepositoryActions {
  // Basic state setters
  setRepositories: (repositories: Repository[]) => void;
  setInstallationIds: (ids: number[]) => void;
  setInstallations: (installations: Installation[]) => void;
  setCurrentInstallations: (installations: Installation[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialLoad: (initialLoad: boolean) => void;
  setError: (error: string | null) => void;
  setAuthMethod: (method: string | null) => void;
  setNeedsInstallation: (needs: boolean) => void;
  setLastRefreshTime: (time: number) => void;

  // Complex actions
  fetchRepositories: (
    selectedInstallationId?: number,
    email?: string,
    forceFetch?: boolean,
  ) => Promise<boolean>;

  // Error handlers
  handleAuthError: () => void;
  handleAppInstallationNeeded: () => void;

  // Utility actions
  shouldRefreshRepositories: (accessToken?: string) => boolean;
  reset: () => void;
}

/**
 * This is a type-safe adapter implementation that delegates all calls to dashboardSlice.
 * Instead of duplicating functionality, we simply forward calls to the dashboardSlice.
 */
export const createRepositorySlice: StateCreator<
  RootState,
  [],
  [],
  RepositoryState & RepositoryActions
> = (set, get) => {
  return {
    // Initial state is mirrored from dashboard slice to maintain type safety
    get repositories() {
      return get()[StateSlice.Dashboard].repositories;
    },
    get installationIds() {
      return get()[StateSlice.Dashboard].installationIds;
    },
    get installations() {
      return get()[StateSlice.Dashboard].installations;
    },
    get currentInstallations() {
      return get()[StateSlice.Dashboard].currentInstallations;
    },
    get loading() {
      return get()[StateSlice.Dashboard].loading;
    },
    get initialLoad() {
      return get()[StateSlice.Dashboard].initialLoad;
    },
    get error() {
      return get()[StateSlice.Dashboard].error;
    },
    get authMethod() {
      return get()[StateSlice.Dashboard].authMethod;
    },
    get needsInstallation() {
      return get()[StateSlice.Dashboard].needsInstallation;
    },
    get lastRefreshTime() {
      return get()[StateSlice.Dashboard].lastRefreshTime;
    },

    // All actions delegate to dashboardSlice
    setRepositories: (repositories) =>
      get()[StateSlice.Dashboard].setRepositories(repositories),

    setInstallationIds: (installationIds) =>
      get()[StateSlice.Dashboard].setInstallationIds(installationIds),

    setInstallations: (installations) =>
      get()[StateSlice.Dashboard].setInstallations(installations),

    setCurrentInstallations: (currentInstallations) =>
      get()[StateSlice.Dashboard].setCurrentInstallations(currentInstallations),

    setLoading: (loading) => get()[StateSlice.Dashboard].setLoading(loading),

    setInitialLoad: (initialLoad) =>
      get()[StateSlice.Dashboard].setInitialLoad(initialLoad),

    setError: (error) => get()[StateSlice.Dashboard].setError(error),

    setAuthMethod: (authMethod) =>
      get()[StateSlice.Dashboard].setAuthMethod(authMethod),

    setNeedsInstallation: (needsInstallation) =>
      get()[StateSlice.Dashboard].setNeedsInstallation(needsInstallation),

    setLastRefreshTime: (lastRefreshTime) =>
      get()[StateSlice.Dashboard].setLastRefreshTime(lastRefreshTime),

    // Delegate complex actions
    fetchRepositories: async (selectedInstallationId, email, forceFetch) =>
      get()[StateSlice.Dashboard].fetchRepositories(
        selectedInstallationId,
        email,
        forceFetch,
      ),

    // Delegate error handlers with small wrapper for backcompat
    handleAuthError: () => get()[StateSlice.Dashboard].handleAuthError(),

    handleAppInstallationNeeded: () =>
      get()[StateSlice.Dashboard].handleAppInstallationNeeded(),

    // Delegate utility actions
    shouldRefreshRepositories: (accessToken) =>
      get()[StateSlice.Dashboard].shouldRefreshRepositories(accessToken),

    // Reset adapts to match dashboardSlice's resetDashboard
    reset: () => get()[StateSlice.Dashboard].resetDashboard(),
  };
};
