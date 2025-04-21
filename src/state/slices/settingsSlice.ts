/**
 * Settings State Slice
 *
 * This slice manages user preferences and application settings.
 */

import { StateCreator } from "zustand";
import { RootState, SettingsState, StateSlice } from "../types";

// Initial state for the settings slice (no actions included)
const initialSettingsState = {
  theme: "system" as const,
  language: "en",
  notifications: true,
  refreshInterval: 30 * 60 * 1000, // 30 minutes in milliseconds
};

export interface SettingsSliceActions {
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  resetSettings: () => void;
}

/**
 * Creates the settings slice with state and actions
 */
export const createSettingsSlice: StateCreator<
  RootState,
  [],
  [],
  SettingsState & SettingsSliceActions
> = (set) => ({
  // Initial state
  ...initialSettingsState,

  // Actions
  setTheme: (theme) =>
    set((state) => ({
      [StateSlice.Settings]: {
        ...state[StateSlice.Settings],
        theme,
      },
    })),

  setLanguage: (language) =>
    set((state) => ({
      [StateSlice.Settings]: {
        ...state[StateSlice.Settings],
        language,
      },
    })),

  setNotifications: (notifications) =>
    set((state) => ({
      [StateSlice.Settings]: {
        ...state[StateSlice.Settings],
        notifications,
      },
    })),

  setRefreshInterval: (refreshInterval) =>
    set((state) => ({
      [StateSlice.Settings]: {
        ...state[StateSlice.Settings],
        refreshInterval,
      },
    })),

  resetSettings: () => {
    // Create a complete state with both data and methods
    set((state) => {
      const currentState = state[StateSlice.Settings];
      return {
        [StateSlice.Settings]: {
          ...initialSettingsState,
          // Ensure strict type for theme
          theme: initialSettingsState.theme as "system" | "light" | "dark",
          // Keep all the action methods
          setTheme: currentState.setTheme,
          setLanguage: currentState.setLanguage,
          setNotifications: currentState.setNotifications,
          setRefreshInterval: currentState.setRefreshInterval,
          resetSettings: currentState.resetSettings,
        },
      };
    });
  },
});
