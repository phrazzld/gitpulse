"use client";

import { ReactNode } from "react";
import ZustandHydration from "@/components/ZustandHydration";
import { ZustandProvider } from "./ZustandProvider";

interface WithZustandProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * WithZustand Component
 *
 * @deprecated Use ZustandProvider instead. This component is maintained for backwards compatibility.
 *
 * Ensures Zustand store is properly initialized and hydrated before rendering children.
 * Shows a fallback component until the store is ready for use.
 */
export function WithZustand({
  children,
  fallback = <ZustandHydration />,
}: WithZustandProps) {
  console.warn(
    "WithZustand is deprecated and will be removed in a future version. " +
      "Use ZustandProvider from @/state/ZustandProvider instead.",
  );

  // Delegate to ZustandProvider for consistency
  return (
    <ZustandProvider loadingIndicator={fallback}>{children}</ZustandProvider>
  );
}

/**
 * withZustand Higher-Order Component
 *
 * @deprecated Use ZustandProvider directly. This HOC is maintained for backwards compatibility.
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
    console.warn(
      `withZustand HOC is deprecated and will be removed in a future version. ` +
        `Component: ${wrappedName}. Use ZustandProvider from @/state/ZustandProvider instead.`,
    );

    return (
      <ZustandProvider loadingIndicator={fallback}>
        <Component {...props} />
      </ZustandProvider>
    );
  }

  // Set display name for debugging
  WithZustandComponent.displayName = `withZustand(${wrappedName})`;

  return WithZustandComponent;
}
