"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect client-side hydration
 *
 * Returns true once the component has been hydrated on the client
 * Initial false value indicates server-side rendering or initial client render
 */
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect only runs on the client
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
