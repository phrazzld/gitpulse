"use client";

import { ReactNode, useEffect } from "react";
import { useStore } from "./store";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import ZustandHydration from "@/components/ZustandHydration";

interface WithZustandProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * WithZustand Component
 *
 * Ensures Zustand store is properly initialized and hydrated before rendering children.
 * Shows a fallback component until the store is ready for use.
 */
export function WithZustand({
  children,
  fallback = <ZustandHydration />,
}: WithZustandProps) {
  // Track component hydration (client-side rendering)
  const isComponentHydrated = useIsHydrated();

  // Track store hydration state
  const isStoreHydrated = useStore((state) => state.isHydrated);
  const setIsHydrated = useStore((state) => state.setIsHydrated);

  // Debug hydration state
  const isFullyHydrated = isComponentHydrated && isStoreHydrated;

  useEffect(() => {
    console.log("WithZustand hydration status:", {
      isComponentHydrated,
      isStoreHydrated,
      isFullyHydrated: isComponentHydrated && isStoreHydrated,
    });

    // If component is hydrated but store isn't, mark store as hydrated
    if (isComponentHydrated && !isStoreHydrated) {
      console.log("Manually marking store as hydrated");
      setIsHydrated(true);
    }
  }, [isComponentHydrated, isStoreHydrated, setIsHydrated]);

  // Show fallback until everything is hydrated
  if (!isFullyHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * withZustand Higher-Order Component
 *
 * Wraps a component with Zustand hydration guard
 */
export function withZustand<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
) {
  // Use display name from wrapped component if available
  const wrappedName = Component.displayName || Component.name || "Component";

  function WithZustandComponent(props: P) {
    return (
      <WithZustand fallback={fallback}>
        <Component {...props} />
      </WithZustand>
    );
  }

  // Set display name for debugging
  WithZustandComponent.displayName = `withZustand(${wrappedName})`;

  return WithZustandComponent;
}
