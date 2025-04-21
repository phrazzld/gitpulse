/**
 * Zustand Store Configuration
 *
 * This file configures the main Zustand store and provides creator functions
 * for store slices.
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { RootState, StateSlice } from "./types";
import { createDashboardSlice } from "./slices/dashboardSlice";
import { createAuthSlice } from "./slices/authSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createRepositorySlice } from "./slices/repositorySlice";

/**
 * Create the root store with all slices
 */
export const useStore = create<RootState>()(
  devtools(
    persist(
      (...a) => ({
        // Combine all slices
        [StateSlice.Dashboard]: createDashboardSlice(...a),
        [StateSlice.Auth]: createAuthSlice(...a),
        [StateSlice.Settings]: createSettingsSlice(...a),
        [StateSlice.Repository]: createRepositorySlice(...a),
      }),
      {
        name: "gitpulse-store",
        // Only persist certain parts of the state
        partialize: (state) => ({
          [StateSlice.Settings]: state[StateSlice.Settings],
          // Don't persist sensitive auth data
          [StateSlice.Auth]: {
            isAuthenticated: state[StateSlice.Auth].isAuthenticated,
            user: {
              name: state[StateSlice.Auth].user.name,
              image: state[StateSlice.Auth].user.image,
            },
          },
          // Only persist non-sensitive dashboard data
          [StateSlice.Dashboard]: {
            activeFilters: state[StateSlice.Dashboard].activeFilters,
            expandedPanels: state[StateSlice.Dashboard].expandedPanels,
            showRepoList: state[StateSlice.Dashboard].showRepoList,
          },
          // Persist repository UI preferences, but not the actual repository data
          [StateSlice.Repository]: {
            lastRefreshTime: state[StateSlice.Repository].lastRefreshTime,
          },
        }),
      },
    ),
  ),
);
