import { create } from "zustand";
import { createDashboardSlice } from "../dashboardSlice";
import { DashboardState, RootState, StateSlice } from "../../types";
import { mockRepositories, mockInstallation } from "@/__tests__/test-utils";

// Mock dependencies
jest.mock("@/lib/localStorageCache", () => ({
  setCacheItem: jest.fn(),
  getStaleItem: jest
    .fn()
    .mockImplementation(() => ({ data: null, isStale: false })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

describe("dashboardSlice", () => {
  // Create a test store
  const useTestStore = create<RootState>((set, get) => ({
    [StateSlice.Dashboard]: createDashboardSlice(set, get),
  }));

  // Reset store before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store to its initial state
    const initialState = useTestStore.getState()[StateSlice.Dashboard];

    // Create a clean state with only data properties (no action methods)
    const stateToReset: Record<string, any> = {};

    Object.keys(initialState).forEach((key) => {
      if (typeof initialState[key] !== "function") {
        stateToReset[key] = initialState[key];
      }
    });

    // Set the state
    useTestStore.setState({
      [StateSlice.Dashboard]: {
        ...initialState,
        ...stateToReset,
      },
    });
  });

  describe("setRepositories", () => {
    it("should update repositories in state", () => {
      // Call the action
      useTestStore
        .getState()
        [StateSlice.Dashboard].setRepositories(mockRepositories);

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert
      expect(dashboardState.repositories).toEqual(mockRepositories);
    });
  });

  describe("handleRepositoryFetchSuccess", () => {
    it("should update multiple state properties in one atomic operation", () => {
      // Initial values to set
      const repositories = mockRepositories;
      const authMethod = "github_app";
      const installationId = 123;
      const installationIds = [123];
      const installations = [mockInstallation];

      // Call the atomic update action
      const result = useTestStore
        .getState()
        [
          StateSlice.Dashboard
        ].handleRepositoryFetchSuccess(repositories, authMethod, installationId, installationIds, installations);

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert multiple state properties updated correctly
      expect(dashboardState.repositories).toEqual(repositories);
      expect(dashboardState.authMethod).toEqual(authMethod);
      expect(dashboardState.installationIds).toEqual(installationIds);
      expect(dashboardState.installations).toEqual(installations);
      expect(dashboardState.loading).toBe(false);
      expect(dashboardState.initialLoad).toBe(false);
      expect(dashboardState.error).toBeNull();

      // Verify function returned expected value
      expect(result).toBe(true);

      // Verify localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "lastRepositoryRefresh",
        expect.any(String),
      );
    });
  });

  describe("setDateRange", () => {
    it("should update date range in state", () => {
      // Example date range
      const since = "2023-01-01";
      const until = "2023-01-31";

      // Call the action
      useTestStore.getState()[StateSlice.Dashboard].setDateRange(since, until);

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert
      expect(dashboardState.dateRange).toEqual({ since, until });
    });
  });

  describe("togglePanel", () => {
    it("should add panel ID when not already expanded", () => {
      // Initial state has empty expandedPanels array

      // Call the action to expand a panel
      useTestStore.getState()[StateSlice.Dashboard].togglePanel("test-panel");

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert panel was added
      expect(dashboardState.expandedPanels).toEqual(["test-panel"]);
    });

    it("should remove panel ID when already expanded", () => {
      // First, set initial state with an expanded panel
      useTestStore.setState({
        [StateSlice.Dashboard]: {
          ...useTestStore.getState()[StateSlice.Dashboard],
          expandedPanels: ["test-panel"],
        },
      });

      // Call the action to collapse the panel
      useTestStore.getState()[StateSlice.Dashboard].togglePanel("test-panel");

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert panel was removed
      expect(dashboardState.expandedPanels).toEqual([]);
    });
  });

  describe("handleAuthError", () => {
    it("should set error state with default message when no custom message provided", () => {
      // Call the action
      useTestStore.getState()[StateSlice.Dashboard].handleAuthError();

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert error was set with default message
      expect(dashboardState.error).toContain(
        "GitHub authentication issue detected",
      );
    });

    it("should set error state with custom message when provided", () => {
      const customMessage = "Custom auth error message";

      // Call the action with custom message
      useTestStore
        .getState()
        [StateSlice.Dashboard].handleAuthError(customMessage);

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert error was set with custom message
      expect(dashboardState.error).toEqual(customMessage);
    });
  });

  describe("resetDashboard", () => {
    it("should reset all state properties to initial values but preserve actions", () => {
      // First, set some non-default state values
      useTestStore.setState({
        [StateSlice.Dashboard]: {
          ...useTestStore.getState()[StateSlice.Dashboard],
          repositories: mockRepositories,
          error: "Some error",
          loading: true,
          initialLoad: false,
        },
      });

      // Verify state was modified
      expect(
        useTestStore.getState()[StateSlice.Dashboard].repositories,
      ).toEqual(mockRepositories);

      // Store a reference to an action function before reset
      const setRepositoriesBeforeReset =
        useTestStore.getState()[StateSlice.Dashboard].setRepositories;

      // Call the reset action
      useTestStore.getState()[StateSlice.Dashboard].resetDashboard();

      // Get updated state
      const dashboardState = useTestStore.getState()[StateSlice.Dashboard];

      // Assert data was reset
      expect(dashboardState.repositories).toEqual([]);
      expect(dashboardState.error).toBeNull();
      expect(dashboardState.loading).toBe(false);
      expect(dashboardState.initialLoad).toBe(true);

      // Assert action functions are preserved
      expect(dashboardState.setRepositories).toBe(setRepositoriesBeforeReset);
    });
  });
});
