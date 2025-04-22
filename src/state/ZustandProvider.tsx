"use client";

import { ReactNode, useEffect, useState } from "react";
import { useStore } from "./store";
import { useHasMounted } from "@/hooks/useHasMounted";
import ZustandHydration from "@/components/ZustandHydration";

interface ZustandProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingIndicator?: ReactNode;
  timeout?: number;
}

/**
 * ZustandProvider Component
 *
 * Ensures Zustand store is properly initialized and hydrated before rendering children.
 * This should be placed near the root of your component tree, likely in providers.tsx.
 *
 * Features:
 * - Detects client-side hydration
 * - Tracks Zustand store hydration state
 * - Shows a loading indicator until store is ready
 * - Optional timeout to prevent infinite loading
 * - Falls back to simplified UI if initialization fails
 *
 * @param {ReactNode} children - Components to render after store initialization
 * @param {ReactNode} fallback - Component to render if initialization fails
 * @param {ReactNode} loadingIndicator - Custom loading component (defaults to ZustandHydration)
 * @param {number} timeout - Maximum time to wait for initialization (in ms)
 */
export function ZustandProvider({
  children,
  fallback,
  loadingIndicator = <ZustandHydration />,
  timeout = 5000, // 5 second timeout for initialization
}: ZustandProviderProps) {
  // Track component client-side mounting
  const hasMounted = useHasMounted();

  // Track store hydration state from Zustand
  const isStoreHydrated = useStore((state) => state.isHydrated);
  const setIsHydrated = useStore((state) => state.setIsHydrated);

  // Track initialization errors
  const [hasInitError, setHasInitError] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  // Combine conditions for overall "ready" state
  const isReady = hasMounted && isStoreHydrated && !hasInitError;

  // Debug logging
  useEffect(() => {
    console.log("ZustandProvider initialization status:", {
      hasMounted,
      isStoreHydrated,
      isReady,
      hasInitError,
    });

    // If component is mounted but store isn't hydrated, trigger manual hydration
    if (hasMounted && !isStoreHydrated && !hasInitError) {
      try {
        // Access raw store state to verify it's accessible
        const storeState = useStore.getState();

        if (storeState) {
          console.log("Manually marking Zustand store as hydrated");
          setIsHydrated(true);
        } else {
          throw new Error("Store state is not available");
        }
      } catch (error) {
        console.error("Error initializing Zustand store:", error);
        setInitError(
          error instanceof Error
            ? error
            : new Error("Unknown store initialization error"),
        );
        setHasInitError(true);
      }
    }
  }, [hasMounted, isStoreHydrated, hasInitError, setIsHydrated]);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    if (isReady || hasInitError || !hasMounted) return;

    const timeoutId = setTimeout(() => {
      if (!isStoreHydrated) {
        console.error(`Zustand initialization timed out after ${timeout}ms`);
        setInitError(
          new Error(`Store initialization timed out after ${timeout}ms`),
        );
        setHasInitError(true);

        // Final attempt to mark as hydrated to recover
        setIsHydrated(true);
      }
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [
    hasMounted,
    isStoreHydrated,
    isReady,
    hasInitError,
    timeout,
    setIsHydrated,
  ]);

  // If there's an initialization error and a fallback is provided, show it
  if (hasInitError && fallback) {
    console.error(
      "Rendering fallback UI due to store initialization error:",
      initError,
    );
    return <>{fallback}</>;
  }

  // If not yet ready, show loading indicator
  if (!isReady) {
    return <>{loadingIndicator}</>;
  }

  // Store is initialized and ready, render children
  return <>{children}</>;
}
