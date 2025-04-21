/**
 * Auth State Slice
 *
 * This slice manages authentication state including user information
 * and authentication error handling.
 */

import { StateCreator } from "zustand";
import { AuthState, RootState, StateSlice } from "../types";
import { ERROR_MESSAGES } from "@/lib/constants";

// Extended state for the auth slice
export interface AuthStateExtended extends AuthState {
  needsInstallation: boolean;
}

// Initial state data for the auth slice (no actions included)
// We only define the data properties here, not the action methods
const initialAuthState = {
  isAuthenticated: false,
  token: null,
  user: {
    email: null,
    name: null,
    image: null,
  },
  loading: false,
  error: null,
  needsInstallation: false,
};

export interface AuthSliceActions {
  // Basic state setters
  setUser: (user: {
    email: string | null;
    name: string | null;
    image: string | null;
  }) => void;
  setAuthenticated: (authenticated: boolean, token?: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsInstallation: (needsInstallation: boolean) => void;

  // Auth error handlers
  handleAuthError: (customMessage?: string) => void;
  handleAppInstallationNeeded: (customMessage?: string) => void;

  // Authentication actions
  signOut: () => void;
}

/**
 * Creates the auth slice with state and actions
 */
export const createAuthSlice: StateCreator<
  RootState,
  [],
  [],
  AuthStateExtended & AuthSliceActions
> = (set, get) => ({
  // Initial state
  ...initialAuthState,

  // Basic state setters
  setUser: (user) =>
    set((state) => ({
      [StateSlice.Auth]: {
        ...state[StateSlice.Auth],
        user,
      },
    })),

  setAuthenticated: (isAuthenticated, token = null) =>
    set((state) => ({
      [StateSlice.Auth]: {
        ...state[StateSlice.Auth],
        isAuthenticated,
        token,
      },
    })),

  setLoading: (loading) =>
    set((state) => ({
      [StateSlice.Auth]: {
        ...state[StateSlice.Auth],
        loading,
      },
    })),

  setError: (error) =>
    set((state) => ({
      [StateSlice.Auth]: {
        ...state[StateSlice.Auth],
        error,
      },
    })),

  setNeedsInstallation: (needsInstallation) =>
    set((state) => ({
      [StateSlice.Auth]: {
        ...state[StateSlice.Auth],
        needsInstallation,
      },
    })),

  // Memoized error handlers
  handleAuthError: (customMessage) => {
    console.log("GitHub authentication issue detected.");

    set((state) => ({
      [StateSlice.Auth]: {
        ...state[StateSlice.Auth],
        error: customMessage || ERROR_MESSAGES.AUTH.GITHUB_AUTH_ERROR,
        loading: false,
      },
    }));

    // Also update the state in the repository slice to maintain consistency
    if (get()[StateSlice.Repository]) {
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          error: customMessage || ERROR_MESSAGES.AUTH.GITHUB_AUTH_ERROR,
          loading: false,
        },
      }));
    }

    // We might need to update dashboard state as well
    if (get()[StateSlice.Dashboard]) {
      set((state) => ({
        [StateSlice.Dashboard]: {
          ...state[StateSlice.Dashboard],
          error: customMessage || ERROR_MESSAGES.AUTH.GITHUB_AUTH_ERROR,
          loading: false,
        },
      }));
    }
  },

  handleAppInstallationNeeded: (customMessage) => {
    console.log("GitHub App installation needed.");

    set((state) => ({
      [StateSlice.Auth]: {
        ...state[StateSlice.Auth],
        needsInstallation: true,
        error: customMessage || ERROR_MESSAGES.INSTALLATION.INSTALLATION_NEEDED,
        loading: false,
      },
    }));

    // Also update the state in the repository slice to maintain consistency
    if (get()[StateSlice.Repository]) {
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          needsInstallation: true,
          error:
            customMessage || ERROR_MESSAGES.INSTALLATION.INSTALLATION_NEEDED,
          loading: false,
        },
      }));
    }

    // We might need to update dashboard state as well
    if (get()[StateSlice.Dashboard]) {
      set((state) => ({
        [StateSlice.Dashboard]: {
          ...state[StateSlice.Dashboard],
          needsInstallation: true,
          error:
            customMessage || ERROR_MESSAGES.INSTALLATION.INSTALLATION_NEEDED,
          loading: false,
        },
      }));
    }
  },

  // Authentication actions
  signOut: () => {
    // Create a complete state with both data and methods
    set((state) => {
      const currentState = state[StateSlice.Auth];
      return {
        [StateSlice.Auth]: {
          ...initialAuthState,
          user: {
            ...initialAuthState.user,
          },
          // Keep all the action methods
          setUser: currentState.setUser,
          setAuthenticated: currentState.setAuthenticated,
          setLoading: currentState.setLoading,
          setError: currentState.setError,
          setNeedsInstallation: currentState.setNeedsInstallation,
          handleAuthError: currentState.handleAuthError,
          handleAppInstallationNeeded: currentState.handleAppInstallationNeeded,
          signOut: currentState.signOut,
        },
      };
    });
  },
});
