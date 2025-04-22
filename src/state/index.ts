/**
 * State Management Index
 *
 * This file exports all state-related functionality from a single entry point.
 */

// Export store
export { useStore } from "./store";

// Export types
export { StateSlice } from "./types";
export type {
  RootState,
  DashboardState,
  AuthState,
  SettingsState,
} from "./types";

// Export hooks
export {
  useDashboardState,
  useAuthState,
  useSettingsState,
  useRepositories,
  useSummary,
  useDateRange,
  useFilters,
  useUIState,
  useInstallations,
  usePanelExpansion,
  useErrorHandlers,
} from "./hooks";

// Export custom hooks from hooks directory
export {
  useDashboardRepository,
  useActivityMetrics,
  useSummaryGeneration,
} from "./hooks/index";

// Export safe store access patterns
export {
  useSafeSelector,
  useSafeAction,
  useSafeObject,
  useSafeSlice,
  createSliceHook,
  createHooksFactory,
} from "./hooks/useSafeStore";

// Export slice action interfaces
export type { DashboardSliceActions } from "./slices/dashboardSlice";
export type { AuthSliceActions } from "./slices/authSlice";
export type { SettingsSliceActions } from "./slices/settingsSlice";
export type {
  RepositoryState,
  RepositoryActions,
} from "./slices/repositorySlice";
