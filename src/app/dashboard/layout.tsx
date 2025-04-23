"use client";

import useProtectedRoute from "@/hooks/useProtectedRoute";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import { NavLink } from "@/types/navigation";

// Define dashboard-specific navigation links
const dashboardNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard", requiresAuth: true },
  { label: "Activity", href: "/dashboard/activity", requiresAuth: true },
  { label: "Settings", href: "/dashboard/settings", requiresAuth: true },
  { label: "Documentation", href: "/docs" },
];

// Protected route layout for dashboard and other authenticated pages
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use our custom hook to protect this route
  const { isLoading, isAuthenticated, session } = useProtectedRoute({
    redirectTo: "/",
    loadingDelay: 250,
  });

  // Show loading screen while checking authentication
  if (isLoading || !isAuthenticated) {
    return (
      <AuthLoadingScreen
        message="Accessing Dashboard"
        subMessage="Verifying security credentials..."
      />
    );
  }

  // Render dashboard content without duplicate header/footer
  return <div>{children}</div>;
}
