/**
 * Auth State Slice
 *
 * This slice manages authentication state including user information.
 */

import { StateCreator } from "zustand";
import { AuthState, RootState, StateSlice } from "../types";

// Initial state for the auth slice (no actions included)
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
};

export interface AuthSliceActions {
  setUser: (user: {
    email: string | null;
    name: string | null;
    image: string | null;
  }) => void;
  setAuthenticated: (authenticated: boolean, token?: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
}

/**
 * Creates the auth slice with state and actions
 */
export const createAuthSlice: StateCreator<
  RootState,
  [],
  [],
  AuthState & AuthSliceActions
> = (set) => ({
  // Initial state
  ...initialAuthState,

  // Actions
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
          signOut: currentState.signOut,
        },
      };
    });
  },
});
