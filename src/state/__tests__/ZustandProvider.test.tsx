import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ZustandProvider } from "../ZustandProvider";
import { useStore } from "../store";
import { useHasMounted } from "../../hooks/useHasMounted";

// Mock the useStore implementation
jest.mock("../store", () => ({
  useStore: {
    getState: jest.fn(),
    __esModule: true,
    // Mock the default hook function
    default: jest.fn(),
  },
}));

// Mock the useHasMounted hook
jest.mock("../../hooks/useHasMounted", () => ({
  useHasMounted: jest.fn(),
}));

// Type the mocked functions
const mockedUseHasMounted = useHasMounted as jest.MockedFunction<
  typeof useHasMounted
>;
const mockedUseStore = useStore as jest.MockedFunction<any>;
const mockedGetState = useStore.getState as jest.MockedFunction<any>;

describe("ZustandProvider", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading indicator when not ready", () => {
    // Mock hasMounted to return false (SSR/initial render)
    mockedUseHasMounted.mockReturnValue(false);

    // Mock store to be not hydrated
    const mockSelector = jest.fn();
    mockSelector.mockReturnValue(false);
    mockedUseStore.mockImplementation((selector) =>
      selector({ isHydrated: false, setIsHydrated: jest.fn() }),
    );

    render(
      <ZustandProvider
        loadingIndicator={<div data-testid="loading">Loading...</div>}
      >
        <div data-testid="children">Children</div>
      </ZustandProvider>,
    );

    // Should show loading indicator, not children
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("should render children when fully hydrated", () => {
    // Mock hasMounted to return true (client-side hydration complete)
    mockedUseHasMounted.mockReturnValue(true);

    // Mock store to be hydrated
    mockedUseStore.mockImplementation((selector) => {
      // If selector is asking for isHydrated, return true
      if (selector.toString().includes("isHydrated")) {
        return true;
      }
      // If selector is asking for setIsHydrated, return a mock function
      if (selector.toString().includes("setIsHydrated")) {
        return jest.fn();
      }
      return undefined;
    });

    // Mock getState to return a valid store
    mockedGetState.mockReturnValue({
      isHydrated: true,
      setIsHydrated: jest.fn(),
    });

    render(
      <ZustandProvider>
        <div data-testid="children">Children</div>
      </ZustandProvider>,
    );

    // Should show children, not loading indicator
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("should render fallback when initialization fails", async () => {
    // Mock hasMounted to return true
    mockedUseHasMounted.mockReturnValue(true);

    // Mock store to be not hydrated
    mockedUseStore.mockImplementation((selector) => {
      // If selector is asking for isHydrated, return false
      if (selector.toString().includes("isHydrated")) {
        return false;
      }
      // If selector is asking for setIsHydrated, return a mock function that throws
      if (selector.toString().includes("setIsHydrated")) {
        return jest.fn().mockImplementation(() => {
          throw new Error("Initialization failed");
        });
      }
      return undefined;
    });

    // Mock getState to throw an error
    mockedGetState.mockImplementation(() => {
      throw new Error("Store state unavailable");
    });

    // Use a small timeout to trigger the error fallback quickly
    render(
      <ZustandProvider
        fallback={<div data-testid="fallback">Error Fallback</div>}
        timeout={10}
      >
        <div data-testid="children">Children</div>
      </ZustandProvider>,
    );

    // Initially should show loading
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();

    // After error is detected, should show fallback
    await waitFor(
      () => {
        expect(screen.getByTestId("fallback")).toBeInTheDocument();
      },
      { timeout: 100 },
    );
  });
});
