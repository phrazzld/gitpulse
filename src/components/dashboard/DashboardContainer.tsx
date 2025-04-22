"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLoadingState from "@/components/DashboardLoadingState";
import { useDashboardRepository } from "@/state";

interface DashboardContainerProps {
  children: ReactNode;
}

/**
 * Dashboard Container Component
 *
 * Handles data fetching, authentication, and session management.
 * Acts as a container for the dashboard layout, providing data to child components.
 *
 * Child components can directly access state via hooks rather than receiving props.
 */
export default function DashboardContainer({
  children,
}: DashboardContainerProps) {
  const { data: session, status } = useSession();

  // Get repository data and actions from Zustand
  const {
    initialLoad,
    fetchRepositoriesWithCookieHandling,
    setupWindowFocusRefresh,
  } = useDashboardRepository();

  // Setup window focus refresh handler
  useEffect(() => {
    if (session?.accessToken) {
      return setupWindowFocusRefresh(session.accessToken);
    }
    return undefined; // Explicitly return undefined for TypeScript
  }, [session, setupWindowFocusRefresh]);

  // Fetch repositories when session is available
  useEffect(() => {
    if (session) {
      fetchRepositoriesWithCookieHandling(
        session.user?.email as string,
        session.accessToken as string,
      );
    }
  }, [session, fetchRepositoriesWithCookieHandling]);

  // Show loading state during initial session loading or first data fetch
  if (status === "loading" || initialLoad) {
    return <DashboardLoadingState />;
  }

  // Render children (the dashboard layout) once data is loaded
  return <>{children}</>;
}
