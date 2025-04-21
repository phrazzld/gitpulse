/**
 * Core Zustand State Management Types
 *
 * This file contains the core type definitions for the Zustand state management system.
 */

import { Repository, Installation } from "@/types/github";
import { CommitSummary } from "@/types/summary";
import { DashboardFilterState } from "@/types/dashboard";

/**
 * State slices identifiers
 */
export enum StateSlice {
  Dashboard = "dashboard",
  Auth = "auth",
  Settings = "settings",
  /**
   * @deprecated Repository slice is being consolidated into Dashboard slice.
   * Use Dashboard slice instead for repository-related state and actions.
   */
  Repository = "repository",
}

/**
 * Dashboard state slice
 *
 * Contains all former repository state and actions to reduce duplication.
 */
export interface DashboardState {
  // Data state
  repositories: Repository[];
  summary: CommitSummary | null;
  installationIds: number[];
  installations: Installation[];
  currentInstallations: Installation[];
  lastRefreshTime: number | null;

  // UI state
  loading: boolean;
  initialLoad: boolean;
  error: string | null;
  showRepoList: boolean;
  expandedPanels: string[];
  activeFilters: DashboardFilterState;

  // Auth state
  authMethod: string | null;
  needsInstallation: boolean;

  // Date range state
  dateRange: {
    since: string;
    until: string;
  };

  // Actions (this makes the TypeScript errors go away, but ideally these would be separate)
  setRepositories: (repositories: Repository[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialLoad: (initialLoad: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (since: string, until: string) => void;
  setSummary: (summary: CommitSummary | null) => void;
  setShowRepoList: (show: boolean) => void;
  togglePanel: (panelId: string) => void;
  setExpandedPanels: (panels: string[]) => void;
  setActiveFilters: (filters: { repositories: string[] }) => void;
  setAuthMethod: (method: string | null) => void;
  setNeedsInstallation: (needs: boolean) => void;
  setInstallationIds: (ids: number[]) => void;
  setInstallations: (installations: Installation[]) => void;
  setCurrentInstallations: (installations: Installation[]) => void;
  setLastRefreshTime: (time: number) => void;

  // Repository fetch actions
  fetchRepositories: (
    selectedInstallationId?: number,
    email?: string,
    forceFetch?: boolean,
  ) => Promise<boolean>;
  shouldRefreshRepositories: (accessToken?: string) => boolean;

  // Composite actions
  handleRepositoryFetchSuccess: (
    repositories: Repository[],
    authMethod?: string | null,
    installationId?: number | null,
    installationIds?: number[],
    installations?: Installation[],
    currentInstallation?: Installation | null,
    currentInstallations?: Installation[],
    needsInstallation?: boolean,
    cacheKey?: string,
  ) => boolean;
  handleRepositoryFetchError: (response: Response) => Promise<boolean>;
  handleAuthError: (customMessage?: string) => void;
  handleAppInstallationNeeded: (customMessage?: string) => void;
  resetDashboard: () => void;
}

/**
 * Auth state slice
 */
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    email: string | null;
    name: string | null;
    image: string | null;
  };
  loading: boolean;
  error: string | null;
  needsInstallation: boolean;

  // Basic actions
  setUser: (user: {
    email: string | null;
    name: string | null;
    image: string | null;
  }) => void;
  setAuthenticated: (authenticated: boolean, token?: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsInstallation: (needsInstallation: boolean) => void;

  // Error handling actions
  handleAuthError: (customMessage?: string) => void;
  handleAppInstallationNeeded: (customMessage?: string) => void;

  // Auth actions
  signOut: () => void;
}

/**
 * Settings state slice
 */
export interface SettingsState {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: boolean;
  refreshInterval: number;

  // Actions
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  resetSettings: () => void;
}

// Import repository types for backwards compatibility
import { RepositoryState, RepositoryActions } from "./slices/repositorySlice";

/**
 * Root state containing all slices
 */
export interface RootState {
  [StateSlice.Dashboard]: DashboardState;
  [StateSlice.Auth]: AuthState;
  [StateSlice.Settings]: SettingsState;
  /**
   * @deprecated Repository slice is being consolidated into Dashboard slice.
   * Use Dashboard slice instead for repository-related state and actions.
   * This is now implemented as an adapter that delegates to Dashboard slice.
   */
  [StateSlice.Repository]: RepositoryState & RepositoryActions;
}
