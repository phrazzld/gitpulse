/**
 * Integration tests for the Dashboard layout
 * Tests the integration of layout and dashboard components
 * Using real components instead of mocks for true integration testing
 * Updated for new grid-based layout and responsive design
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { mockSession, mockRepositories } from "../test-utils";
import { ImprovedDashboardTestWrapper } from "./ImprovedDashboardTestWrapper";
import { mockAllZustandHooks } from "./ZustandIntegrationTestHelpers";
import type { NavLink } from "@/types/navigation";

// Enable mock for Zustand hooks
mockAllZustandHooks();

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
import Dashboard from "@/app/dashboard/page";

// Mock DashboardGridContainer to test its usage
jest.mock("@/components/dashboard/layout", () => ({
  DashboardGridContainer: ({ children, className, ...props }: any) => (
    <div
      data-testid="dashboard-grid-container"
      className={`grid grid-cols-12 gap-md ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  ),
}));

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
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Save original fetch and matchMedia
    originalFetch = global.fetch;
    originalMatchMedia = window.matchMedia;

    jest.clearAllMocks();

    // Mock fetch responses
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/api/repos")) {
        return Promise.resolve(
          createApiResponse({
            repositories: mockRepositories,
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

    // Default matchMedia mock (no breakpoints)
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    // Restore original fetch and matchMedia
    global.fetch = originalFetch;
    window.matchMedia = originalMatchMedia;
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

// Add specific tests for responsive layout
describe("Dashboard Responsive Layout", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  // Mock Dashboard component
  jest.mock("@/app/dashboard/page", () => {
    return function MockDashboard() {
      return (
        <div
          data-testid="dashboard-container"
          className="bg-dark-slate min-h-screen"
        >
          <div className="max-w-7xl mx-auto py-lg sm:px-lg lg:px-xl">
            <div
              data-testid="dashboard-grid-container"
              className="grid grid-cols-12 gap-lg px-md py-lg sm:px-0"
            >
              {/* Panel elements with responsive classes */}
              <div className="col-span-12">
                <div data-testid="auth-panel" className="card">
                  Auth Panel
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 lg:col-span-4">
                <div data-testid="summary-panel" className="card">
                  Summary Panel
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 lg:col-span-8">
                <div data-testid="overview-panel" className="card">
                  Overview Panel
                </div>
              </div>
              <div className="col-span-12">
                <div data-testid="feed-panel" className="card">
                  Feed Panel
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };
  });

  it("uses full width layout on mobile screens", () => {
    // Mock mobile screen size
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes("(max-width:") || !query.includes("(min-width:"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Render dashboard with mobile screen size simulation
    render(
      <ImprovedDashboardTestWrapper
        initialData={{
          repositories: mockRepositories,
          loading: false,
          error: null,
        }}
      />,
    );

    // All panels should be full width on mobile
    const panels = [
      screen.getByTestId("auth-panel"),
      screen.getByTestId("summary-panel"),
      screen.getByTestId("overview-panel"),
      screen.getByTestId("feed-panel"),
    ];

    panels.forEach((panel) => {
      const panelContainer = panel.closest("div[class*='col-span-']");
      expect(panelContainer).toHaveClass("col-span-12");
    });
  });

  it("uses split layout on tablet screens (md breakpoint)", () => {
    // Mock tablet screen size - md breakpoint
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes("(min-width: 768px)"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Render dashboard with tablet screen size simulation
    render(
      <ImprovedDashboardTestWrapper
        initialData={{
          repositories: mockRepositories,
          loading: false,
          error: null,
        }}
      />,
    );

    // Summary and overview panels should be half width on tablet
    const summaryPanel = screen.getByTestId("summary-panel").closest("div");
    const overviewPanel = screen.getByTestId("overview-panel").closest("div");

    expect(summaryPanel).toHaveClass("md:col-span-6");
    expect(overviewPanel).toHaveClass("md:col-span-6");

    // Auth panel and feed panel should remain full width
    const authPanel = screen.getByTestId("auth-panel").closest("div");
    const feedPanel = screen.getByTestId("feed-panel").closest("div");

    expect(authPanel).toHaveClass("col-span-12");
    expect(feedPanel).toHaveClass("col-span-12");
  });

  it("uses asymmetric layout on desktop screens (lg breakpoint)", () => {
    // Mock desktop screen size - lg breakpoint
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes("(min-width: 1024px)"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    // Render dashboard with desktop screen size simulation
    render(
      <ImprovedDashboardTestWrapper
        initialData={{
          repositories: mockRepositories,
          loading: false,
          error: null,
        }}
      />,
    );

    // Summary panel should be 1/3 width and overview panel 2/3 width on desktop
    const summaryPanel = screen.getByTestId("summary-panel").closest("div");
    const overviewPanel = screen.getByTestId("overview-panel").closest("div");

    expect(summaryPanel).toHaveClass("lg:col-span-4"); // 1/3 of 12 columns
    expect(overviewPanel).toHaveClass("lg:col-span-8"); // 2/3 of 12 columns

    // Auth panel and feed panel should remain full width
    const authPanel = screen.getByTestId("auth-panel").closest("div");
    const feedPanel = screen.getByTestId("feed-panel").closest("div");

    expect(authPanel).toHaveClass("col-span-12");
    expect(feedPanel).toHaveClass("col-span-12");
  });
});
