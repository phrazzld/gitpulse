"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if a component has mounted on the client
 *
 * This hook is useful for preventing server-side rendering of client-only features.
 * It returns false on the server and during initial client render, then true after
 * component has mounted on the client.
 *
 * @returns {boolean} True if component has mounted on the client, false otherwise
 *
 * @example
 * function MyComponent() {
 *   const hasMounted = useHasMounted();
 *
 *   if (!hasMounted) {
 *     return <LoadingPlaceholder />;
 *   }
 *
 *   return <ClientOnlyComponent />;
 * }
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Effect only runs on client, guaranteeing we've mounted
    setHasMounted(true);
  }, []);

  return hasMounted;
}
