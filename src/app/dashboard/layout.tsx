"use client";

import useProtectedRoute from "@/hooks/useProtectedRoute";
import AuthLoadingScreen from "@/components/AuthLoadingScreen";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NavLink } from "@/types/navigation";

// Define dashboard-specific navigation links
const dashboardNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard", requiresAuth: true },
  { label: "Activity", href: "/dashboard/activity", requiresAuth: true },
  { label: "Settings", href: "/dashboard/settings", requiresAuth: true },
  { label: "Documentation", href: "/docs" },
];

// Define footer links
const footerLinks: NavLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "About", href: "/about" },
  { label: "Support", href: "/support" },
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

  // Render dashboard layout with header and footer when authenticated
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        navLinks={dashboardNavLinks}
        session={session}
        className="bg-background-secondary/80 backdrop-blur-sm"
      />
      <main className="flex-grow">{children}</main>
      <Footer
        links={footerLinks}
        copyrightText="© 2025 GitPulse. All rights reserved."
      />
    </div>
  );
}
