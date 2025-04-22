/**
 * Zustand Store Configuration
 *
 * This file configures the main Zustand store and provides creator functions
 * for store slices. Includes hydration state tracking to ensure components
 * don't access state before it's fully initialized.
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { RootState, StateSlice } from "./types";
import { createDashboardSlice } from "./slices/dashboardSlice";
import { createAuthSlice } from "./slices/authSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createRepositorySlice } from "./slices/repositorySlice";
import { clearCorruptedStore } from "./clearStore";

// Check for and clear corrupted localStorage first
if (typeof window !== "undefined") {
  clearCorruptedStore();
}

/**
 * Create the root store with all slices
 *
 * Note: Repository slice has been consolidated into Dashboard slice
 * but is still included as a type-safe adapter for backward compatibility.
 *
 * Added isHydrated flag to track when store is ready for component access.
 */
export const useStore = create<RootState>()(
  devtools(
    persist(
      (set, get, ...a) => ({
        // Hydration state
        isHydrated: false,
        setIsHydrated: (isHydrated: boolean) => set({ isHydrated }),

        // Combine all slices
        [StateSlice.Dashboard]: createDashboardSlice(set, get, ...a),
        [StateSlice.Auth]: createAuthSlice(set, get, ...a),
        [StateSlice.Settings]: createSettingsSlice(set, get, ...a),
        // Repository slice is now an adapter that delegates to Dashboard slice
        [StateSlice.Repository]: createRepositorySlice(set, get, ...a),
      }),
      {
        name: "gitpulse-store",
        // Only persist certain parts of the state
        partialize: (state) => {
          // Handle null state gracefully
          if (!state) return {};

          return {
            // Persist hydration state
            isHydrated: false, // Always start as not hydrated on reload

            // Settings state
            [StateSlice.Settings]: state[StateSlice.Settings] || {},

            // Don't persist sensitive auth data
            [StateSlice.Auth]: state[StateSlice.Auth]
              ? {
                  isAuthenticated: state[StateSlice.Auth].isAuthenticated,
                  user: {
                    name: state[StateSlice.Auth].user?.name,
                    image: state[StateSlice.Auth].user?.image,
                  },
                }
              : {},

            // Only persist non-sensitive dashboard data
            [StateSlice.Dashboard]: state[StateSlice.Dashboard]
              ? {
                  activeFilters: state[StateSlice.Dashboard].activeFilters,
                  expandedPanels: state[StateSlice.Dashboard].expandedPanels,
                  showRepoList: state[StateSlice.Dashboard].showRepoList,
                  lastRefreshTime: state[StateSlice.Dashboard].lastRefreshTime,
                }
              : {},
          };
        },
        // Handle hydration events
        onRehydrateStorage: () => (state) => {
          // When store finishes rehydrating from localStorage, mark as hydrated
          console.log("Store rehydration complete");
          if (state) {
            state.setIsHydrated(true);
          }
        },
      },
    ),
  ),
);
