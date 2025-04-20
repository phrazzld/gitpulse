/**
 * Integration tests for the Dashboard layout
 * Tests the integration of layout and dashboard components
 * Using real components instead of mocks for true integration testing
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { mockSession } from "../test-utils";
import { ImprovedDashboardTestWrapper } from "./ImprovedDashboardTestWrapper";
import type { NavLink } from "@/types/navigation";

// Mock only external dependencies, not internal components
jest.mock("next-auth/react", () => {
  const originalModule = jest.requireActual("next-auth/react");
  return {
    ...originalModule,
    useSession: jest.fn(() => ({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    })),
    signOut: jest.fn(),
    SessionProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  usePathname: jest.fn().mockReturnValue("/dashboard"),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-testid="next-image"
    />
  ),
}));

// Mock external API methods
jest.mock("@/lib/auth/githubAuth", () => ({
  createAuthenticatedOctokit: jest.fn(),
  getInstallationManagementUrl: jest
    .fn()
    .mockReturnValue("https://github.com/settings/installations/123"),
  getAllAppInstallations: jest.fn().mockResolvedValue([]),
  checkAppInstallation: jest.fn().mockResolvedValue(123),
}));

jest.mock("@/lib/githubData", () => ({
  fetchRepositories: jest.fn(),
  fetchAppRepositories: jest.fn(),
  fetchAllRepositories: jest.fn(),
  fetchRepositoryCommitsWithOctokit: jest.fn(),
  fetchRepositoryCommits: jest.fn(),
  fetchCommitsForRepositoriesWithOctokit: jest.fn(),
  fetchCommitsForRepositories: jest.fn(),
}));

// Import necessary components
import DashboardLayout from "@/app/dashboard/layout";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Mock child content
const MockChildContent = () => (
  <div data-testid="dashboard-content">Dashboard Content</div>
);

// Helper for creating API responses
const createApiResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
};

describe("DashboardLayout Integration", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
    jest.clearAllMocks();

    // Mock fetch responses
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/api/repos")) {
        return Promise.resolve(
          createApiResponse({
            repositories: [],
            authMethod: "github_app",
            installationId: 123,
          }),
        );
      }
      return Promise.reject(new Error(`Unhandled route: ${url}`));
    });

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

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
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

    render(
      <ImprovedDashboardTestWrapper>
        <DashboardLayout>{<MockChildContent />}</DashboardLayout>
      </ImprovedDashboardTestWrapper>,
    );

    // Check loading screen is displayed by checking for loading text
    expect(screen.getByText(/accessing dashboard/i)).toBeInTheDocument();
    expect(
      screen.getByText(/verifying security credentials/i),
    ).toBeInTheDocument();

    // Ensure content is not rendered during loading
    expect(screen.queryByTestId("dashboard-content")).not.toBeInTheDocument();
  });

  it("renders full layout with header, content, and footer when authenticated", async () => {
    render(
      <ImprovedDashboardTestWrapper>
        <DashboardLayout>{<MockChildContent />}</DashboardLayout>
      </ImprovedDashboardTestWrapper>,
    );

    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument(); // Header
      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
      expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // Footer
    });

    // Ensure loading screen is not shown
    expect(screen.queryByTestId("auth-loading-screen")).not.toBeInTheDocument();
  });

  it("renders the correct navigation links", async () => {
    render(
      <ImprovedDashboardTestWrapper>
        <Header
          navLinks={[
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard", requiresAuth: true },
            {
              label: "Activity",
              href: "/dashboard/activity",
              requiresAuth: true,
            },
          ]}
          session={mockSession}
        />
      </ImprovedDashboardTestWrapper>,
    );

    // Wait for navigation to render
    await waitFor(() => {
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    // Check for some navigation links
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("renders footer with copyright text", async () => {
    render(
      <ImprovedDashboardTestWrapper>
        <Footer
          links={[
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "About", href: "/about" },
          ]}
          copyrightText="© 2025 GitPulse. All rights reserved."
        />
      </ImprovedDashboardTestWrapper>,
    );

    // Verify footer content
    expect(screen.getByText("Terms")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(
      screen.getByText("© 2025 GitPulse. All rights reserved."),
    ).toBeInTheDocument();
  });
});
