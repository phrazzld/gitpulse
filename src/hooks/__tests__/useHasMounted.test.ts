import React from "react";
import { renderHook } from "@testing-library/react";
import { useHasMounted } from "../useHasMounted";

describe("useHasMounted hook", () => {
  // We need to mock useEffect to simulate SSR environment
  let originalUseEffect: typeof React.useEffect;
  let mockUseEffectImplementation: jest.MockedFunction<typeof React.useEffect>;

  beforeEach(() => {
    // Mock the React.useEffect implementation
    originalUseEffect = React.useEffect;
    mockUseEffectImplementation = jest.fn();
    React.useEffect = mockUseEffectImplementation;
  });

  afterEach(() => {
    // Restore the original React.useEffect
    React.useEffect = originalUseEffect;
  });

  it("should return false on initial render (simulating SSR)", () => {
    // During SSR, useEffect doesn't run
    mockUseEffectImplementation.mockImplementation(() => undefined);

    const { result } = renderHook(() => useHasMounted());

    // Initial value should be false
    expect(result.current).toBe(false);
  });

  it("should return true after useEffect runs (client-side hydration)", () => {
    // Make useEffect run the callback immediately to simulate client-side hydration
    mockUseEffectImplementation.mockImplementation((callback) => {
      callback();
      return undefined;
    });

    const { result } = renderHook(() => useHasMounted());

    // After useEffect runs, value should be true
    expect(result.current).toBe(true);
  });

  it("should only set hasMounted to true once", () => {
    // Track the number of times setState is called
    const setStateMock = jest.fn();
    const useStateMock = jest.spyOn(React, "useState");

    // Make useState return our false initial state and mock setter
    useStateMock.mockImplementation(() => [false, setStateMock]);

    // Make useEffect run the callback
    mockUseEffectImplementation.mockImplementation((callback) => {
      callback();
      return undefined;
    });

    renderHook(() => useHasMounted());

    // useState should be called once during render
    expect(useStateMock).toHaveBeenCalledWith(false);

    // setState should be called once during useEffect
    expect(setStateMock).toHaveBeenCalledTimes(1);
    expect(setStateMock).toHaveBeenCalledWith(true);
  });
});
