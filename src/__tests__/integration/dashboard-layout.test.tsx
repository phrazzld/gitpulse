import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { mockSession } from "../test-utils";
import type { NavLink } from "@/types/navigation";

// Mock the next-auth/react module
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: mockSession,
    status: "authenticated", // Default to authenticated for most tests
    update: jest.fn(),
  })),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  usePathname: jest.fn().mockReturnValue("/dashboard"),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock the AuthLoadingScreen component
jest.mock("@/components/AuthLoadingScreen", () => {
  return function MockAuthLoadingScreen({
    message,
    subMessage,
  }: {
    message?: string;
    subMessage?: string;
  }) {
    return (
      <div data-testid="auth-loading-screen">
        <div data-testid="loading-message">{message}</div>
        <div data-testid="loading-submessage">{subMessage}</div>
      </div>
    );
  };
});

// Mock the Header component to track props
let headerProps: {
  navLinks?: NavLink[];
  session?: unknown;
  className?: string;
} | null = null;

jest.mock("@/components/layout/Header", () => {
  return function MockHeader(props: {
    navLinks: NavLink[];
    session?: unknown;
    className?: string;
  }) {
    headerProps = props;
    return <header data-testid="header">Header Component</header>;
  };
});

// Mock the Footer component to track props
let footerProps: {
  links?: NavLink[];
  copyrightText?: string;
} | null = null;

jest.mock("@/components/layout/Footer", () => {
  return function MockFooter(props: {
    links?: NavLink[];
    copyrightText: string;
  }) {
    footerProps = props;
    return <footer data-testid="footer">Footer Component</footer>;
  };
});

// Mock child content
const MockChildContent = () => (
  <div data-testid="dashboard-content">Dashboard Content</div>
);

// Import the DashboardLayout directly
import DashboardLayout from "@/app/dashboard/layout";

describe("DashboardLayout Integration", () => {
  // Reset mocks and mock component props before each test
  beforeEach(() => {
    jest.clearAllMocks();
    headerProps = null;
    footerProps = null;

    // Reset useSession mock implementation to authenticated
    const mockNextAuth = jest.requireMock("next-auth/react") as jest.Mocked<
      typeof import("next-auth/react")
    >;
    mockNextAuth.useSession.mockImplementation(() => ({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    }));
  });

  it("renders loading screen while checking authentication", () => {
    // Mock useSession to return loading state
    const mockNextAuth = jest.requireMock("next-auth/react") as jest.Mocked<
      typeof import("next-auth/react")
    >;
    mockNextAuth.useSession.mockImplementation(() => ({
      data: null,
      status: "loading",
      update: jest.fn(),
    }));

    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Check loading screen is displayed with correct messages
    expect(screen.getByTestId("auth-loading-screen")).toBeInTheDocument();
    expect(screen.getByTestId("loading-message")).toHaveTextContent(
      "Accessing Dashboard",
    );
    expect(screen.getByTestId("loading-submessage")).toHaveTextContent(
      "Verifying security credentials...",
    );

    // Ensure content is not rendered during loading
    expect(screen.queryByTestId("dashboard-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
  });

  it("shows loading screen for unauthenticated users", () => {
    // Mock useSession to return unauthenticated state
    const mockNextAuth = jest.requireMock("next-auth/react") as jest.Mocked<
      typeof import("next-auth/react")
    >;
    mockNextAuth.useSession.mockImplementation(() => ({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    }));

    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Loading screen should be shown during auth check
    expect(screen.getByTestId("auth-loading-screen")).toBeInTheDocument();

    // The actual redirect happens inside the useProtectedRoute hook,
    // which we're not fully testing here since that would be testing
    // the hook rather than the layout component
  });

  it("renders full layout with header, content, and footer when authenticated", async () => {
    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    // Ensure loading screen is not shown
    expect(screen.queryByTestId("auth-loading-screen")).not.toBeInTheDocument();
  });

  it("passes correct navigation links to Header", async () => {
    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(headerProps).not.toBeNull();
    });

    // Verify dashboard-specific navigation links
    const navLinks = headerProps?.navLinks || [];
    expect(navLinks).toHaveLength(5);

    // Test some of the specific links
    expect(navLinks[0]).toEqual({ label: "Home", href: "/" });
    expect(navLinks[1]).toEqual({
      label: "Dashboard",
      href: "/dashboard",
      requiresAuth: true,
    });
    expect(navLinks[2]).toEqual({
      label: "Activity",
      href: "/dashboard/activity",
      requiresAuth: true,
    });
  });

  it("passes session data to Header component", async () => {
    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(headerProps).not.toBeNull();
    });

    // Verify session is passed to Header
    expect(headerProps?.session).toEqual(mockSession);
  });

  it("applies custom classes to Header component", async () => {
    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(headerProps).not.toBeNull();
    });

    // Verify custom classes are passed to Header
    expect(headerProps?.className).toBe(
      "bg-background-secondary/80 backdrop-blur-sm",
    );
  });

  it("passes correct links to Footer component", async () => {
    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(footerProps).not.toBeNull();
    });

    // Verify footer links
    const links = footerProps?.links || [];
    expect(links).toHaveLength(4);

    // Test some specific links
    expect(links[0]).toEqual({ label: "Terms", href: "/terms" });
    expect(links[1]).toEqual({ label: "Privacy", href: "/privacy" });
    expect(links[3]).toEqual({ label: "Support", href: "/support" }); // Dashboard has an extra Support link
  });

  it("passes correct copyright text to Footer component", async () => {
    render(<DashboardLayout>{<MockChildContent />}</DashboardLayout>);

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(footerProps).not.toBeNull();
    });

    // Verify copyright text
    expect(footerProps?.copyrightText).toBe(
      "© 2025 GitPulse. All rights reserved.",
    );
  });
});
